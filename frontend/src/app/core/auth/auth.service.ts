import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, map, shareReplay, finalize } from 'rxjs';
import { appConfig } from '../../config/app.config';
import type { ApiResponse } from '../models/api-response';
import type {
  LoginResponse,
  RefreshTokenResponse,
  CurrentUserDto,
  StoredAuth,
} from './models/auth.models';

function unwrap<T>(res: ApiResponse<T>): T {
  if (res?.success && res.data != null) return res.data as T;
  throw new Error((res as { message?: string })?.message ?? 'Request failed');
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return '';
}

function pickStringOrNull(obj: Record<string, unknown>, keys: string[]): string | null {
  const s = pickString(obj, keys);
  return s || null;
}

function coerceStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

function decodeJwtExpiresAtMs(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function resolveAccessExpiryMs(expiresAtIso: string | undefined, accessToken: string): number | null {
  if (expiresAtIso) {
    const t = new Date(expiresAtIso).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return decodeJwtExpiresAtMs(accessToken);
}

/** Maps common backend shapes (camelCase / PascalCase / nested `user`) to LoginResponse. */
function normalizeLoginResponse(raw: unknown): LoginResponse {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid login response');
  const r = raw as Record<string, unknown>;

  const accessToken = pickString(r, ['accessToken', 'AccessToken', 'token', 'Token']);
  if (!accessToken) throw new Error('No access token in login response');

  const refreshToken = pickString(r, ['refreshToken', 'RefreshToken']);
  let accessTokenExpiresAt = pickString(r, [
    'accessTokenExpiresAt',
    'AccessTokenExpiresAt',
    'expiresAt',
    'ExpiresAt',
    'tokenExpiresAt',
    'TokenExpiresAt',
  ]);

  const userNode = r['user'] ?? r['User'];
  const userObj =
    userNode && typeof userNode === 'object' ? (userNode as Record<string, unknown>) : null;

  let userId = pickString(r, ['userId', 'UserId']);
  if (!userId && userObj) userId = pickString(userObj, ['id', 'Id', 'userId', 'UserId']);

  let email = pickString(r, ['email', 'Email']);
  if (!email && userObj) email = pickString(userObj, ['email', 'Email']);

  let fullName = pickString(r, ['fullName', 'FullName']);
  if (!fullName && userObj) fullName = pickString(userObj, ['fullName', 'FullName']);
  if (!fullName) fullName = email || 'User';

  const profilePicturePath =
    pickStringOrNull(r, ['profilePicturePath', 'ProfilePicturePath']) ??
    (userObj ? pickStringOrNull(userObj, ['profilePicturePath', 'ProfilePicturePath']) : null);

  let roles = coerceStringArray(r['roles'] ?? r['Roles']);
  if (!roles.length && userObj) roles = coerceStringArray(userObj['roles'] ?? userObj['Roles']);

  let permissions = coerceStringArray(r['permissions'] ?? r['Permissions']);
  if (!permissions.length && userObj)
    permissions = coerceStringArray(userObj['permissions'] ?? userObj['Permissions']);

  if (!accessTokenExpiresAt) {
    const jwtMs = decodeJwtExpiresAtMs(accessToken);
    accessTokenExpiresAt = jwtMs ? new Date(jwtMs).toISOString() : new Date(Date.now() + 3600_000).toISOString();
  }

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    userId: userId || email || '',
    email,
    fullName,
    profilePicturePath,
    roles,
    permissions,
  };
}

const AUTH_KEY = 'smart_training_auth';
const API = `${appConfig.apiUrl}/api/auth`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<CurrentUserDto | null>(null);
  private readonly accessToken = signal<string | null>(null);
  private readonly initialized = signal(false);
  private refreshInFlight$: Observable<RefreshTokenResponse> | null = null;

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this.accessToken());
  readonly isInitialized = this.initialized.asReadonly();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.restoreFromStorage();
  }

  private restoreFromStorage(): void {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) {
        this.initialized.set(true);
        return;
      }
      const stored: StoredAuth = JSON.parse(raw);
      if (!stored.accessToken || !stored.user) {
        localStorage.removeItem(AUTH_KEY);
        this.initialized.set(true);
        return;
      }
      const user = stored.user as CurrentUserDto;
      if (!user.permissions) user.permissions = [];
      const refreshToken = stored.refreshToken ?? '';
      const expiryMs = resolveAccessExpiryMs(stored.expiresAt, stored.accessToken);

      if (expiryMs != null && expiryMs <= Date.now() + 60_000) {
        if (refreshToken) {
          this.refreshAndRestore(refreshToken).subscribe(() => this.initialized.set(true));
          return;
        }
        localStorage.removeItem(AUTH_KEY);
        this.initialized.set(true);
        return;
      }

      this.accessToken.set(stored.accessToken);
      this.currentUser.set(user);
    } catch {
      localStorage.removeItem(AUTH_KEY);
    }
    this.initialized.set(true);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${API}/login`, { email, password }).pipe(
      map(unwrap),
      map((body) => normalizeLoginResponse(body)),
      tap((res) => this.handleAuthSuccess(res))
    );
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${API}/forgot-password`, { email }).pipe(
      map((res) => {
        if (!res?.success) throw new Error(res?.errors?.[0] ?? res?.message ?? 'Request failed');
        return undefined;
      })
    );
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${API}/reset-password`, { token, newPassword }).pipe(
      map((res) => {
        if (!res?.success) throw new Error(res?.errors?.[0] ?? res?.message ?? 'Request failed');
        return undefined;
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${API}/change-password`, { currentPassword, newPassword }).pipe(
      map((res) => {
        if (!res?.success) throw new Error(res?.errors?.[0] ?? res?.message ?? 'Request failed');
        return undefined;
      })
    );
  }

  updateProfile(data: { fullName?: string; profilePicturePath?: string }): Observable<CurrentUserDto> {
    return this.http.patch<ApiResponse<CurrentUserDto>>(`${API}/me`, data).pipe(
      map(unwrap),
      tap((user) => {
        this.currentUser.set(user);
        this.updateStoredUser(user);
      })
    );
  }

  /** Upload profile photo. Returns updated CurrentUserDto. Max 5MB; JPEG, PNG, GIF, WebP. */
  uploadProfilePhoto(file: File): Observable<CurrentUserDto> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<CurrentUserDto>>(`${appConfig.apiUrl}/api/profile/photo`, form).pipe(
      map(unwrap),
      tap((user) => {
        this.currentUser.set(user);
        this.updateStoredUser(user);
      })
    );
  }

  /** Remove profile photo. Returns updated CurrentUserDto. */
  removeProfilePhoto(): Observable<CurrentUserDto> {
    return this.http.delete<ApiResponse<CurrentUserDto>>(`${appConfig.apiUrl}/api/profile/photo`).pipe(
      map(unwrap),
      tap((user) => {
        this.currentUser.set(user);
        this.updateStoredUser(user);
      })
    );
  }

  refreshToken(refreshToken: string): Observable<RefreshTokenResponse> {
    if (this.refreshInFlight$) return this.refreshInFlight$;

    this.refreshInFlight$ = this.http.post<ApiResponse<RefreshTokenResponse>>(`${API}/refresh`, { refreshToken }).pipe(
      map(unwrap),
      tap((res) => this.setTokensOnly(res.accessToken, res.newRefreshToken, res.accessTokenExpiresAt)),
      shareReplay(1),
      finalize(() => {
        this.refreshInFlight$ = null;
      })
    );

    return this.refreshInFlight$;
  }

  private refreshAndRestore(refreshToken: string): Observable<RefreshTokenResponse | null> {
    return this.refreshToken(refreshToken).pipe(
      tap((res) => {
        const user = this.currentUser();
        if (user) {
          this.accessToken.set(res.accessToken);
          this.persist({
            accessToken: res.accessToken,
            refreshToken: res.newRefreshToken || undefined,
            expiresAt: res.accessTokenExpiresAt,
            user,
          });
        }
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  private handleAuthSuccess(res: LoginResponse): void {
    const user: CurrentUserDto = {
      id: res.userId || res.email || '',
      email: res.email ?? '',
      fullName: res.fullName,
      profilePicturePath: res.profilePicturePath ?? null,
      roles: res.roles ?? [],
      permissions: res.permissions ?? [],
    };
    this.accessToken.set(res.accessToken);
    this.currentUser.set(user);
    this.persist({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken || undefined,
      expiresAt: res.accessTokenExpiresAt,
      user,
    });
  }

  private persist(data: StoredAuth): void {
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
  }

  /** Updates only tokens (e.g. after refresh). Keeps current user. */
  setTokensOnly(accessToken: string, refreshToken: string, expiresAt: string): void {
    this.accessToken.set(accessToken);
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      try {
        const stored: StoredAuth = JSON.parse(raw);
        stored.accessToken = accessToken;
        stored.refreshToken = refreshToken;
        stored.expiresAt = expiresAt;
        localStorage.setItem(AUTH_KEY, JSON.stringify(stored));
      } catch {
        // ignore
      }
    }
  }

  getAccessToken(): string | null {
    return this.accessToken();
  }

  getRefreshToken(): string | null {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      const stored: StoredAuth = JSON.parse(raw);
      return stored.refreshToken ?? null;
    } catch {
      return null;
    }
  }

  /** Whether the current user has the given permission (exact code). */
  hasPermission(permission: string): boolean {
    const user = this.currentUser();
    return user?.permissions?.includes(permission) ?? false;
  }

  /** Whether the current user has any of the given permissions. */
  hasAnyPermission(permissions: string[]): boolean {
    if (!permissions?.length) return true;
    const user = this.currentUser();
    const list = user?.permissions;
    if (!list?.length) return false;
    return permissions.some((p) => list.includes(p));
  }

  /** Whether the current user has all of the given permissions. */
  hasAllPermissions(permissions: string[]): boolean {
    if (!permissions?.length) return true;
    const user = this.currentUser();
    const list = user?.permissions;
    if (!list?.length) return false;
    return permissions.every((p) => list.includes(p));
  }

  loadCurrentUser(): Observable<CurrentUserDto> {
    return this.http.get<ApiResponse<CurrentUserDto>>(`${API}/me`).pipe(
      map(unwrap),
      tap((user) => {
        this.currentUser.set(user);
        this.updateStoredUser(user);
      })
    );
  }

  private updateStoredUser(user: CurrentUserDto): void {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return;
    try {
      const stored: StoredAuth = JSON.parse(raw);
      stored.user = user;
      localStorage.setItem(AUTH_KEY, JSON.stringify(stored));
    } catch {
      // ignore storage errors
    }
  }

  logout(): void {
    this.accessToken.set(null);
    this.currentUser.set(null);
    localStorage.removeItem(AUTH_KEY);
    this.router.navigate(['/login']);
  }
}
