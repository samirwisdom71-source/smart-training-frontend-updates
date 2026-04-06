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
      if (stored.accessToken && stored.refreshToken && stored.user) {
        const user = stored.user as CurrentUserDto;
        if (!user.permissions) user.permissions = [];
        const expiresAt = new Date(stored.expiresAt).getTime();
        if (expiresAt > Date.now() + 60_000) {
          this.accessToken.set(stored.accessToken);
          this.currentUser.set(user);
        } else {
          this.refreshAndRestore(stored.refreshToken).subscribe(() => this.initialized.set(true));
          return;
        }
      }
    } catch {
      localStorage.removeItem(AUTH_KEY);
    }
    this.initialized.set(true);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${API}/login`, { email, password }).pipe(
      map(unwrap),
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
            refreshToken: res.newRefreshToken,
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
      id: res.userId,
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
      refreshToken: res.refreshToken,
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
