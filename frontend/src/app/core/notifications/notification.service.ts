import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { appConfig } from '../../config/app.config';
import { AuthService } from '../auth/auth.service';
import type { NotificationDto, PagedResult, ApiResponse } from './models/notification.models';

const API = `${appConfig.apiUrl}/api/notifications`;
const HUB_PATH = `${appConfig.apiUrl}/hubs/notifications`;

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private hub: HubConnection | null = null;
  private readonly receiveNotification$ = new Subject<NotificationDto>();

  readonly unreadCount = signal(0);
  readonly recentList = signal<NotificationDto[]>([]);
  readonly loading = signal(false);
  readonly hubConnected = signal(false);

  /** Emits when a new notification is received in real time. */
  readonly onReceive = this.receiveNotification$.asObservable();

  /** Whether the user can see notifications (has permission and is authenticated). */
  readonly canView = computed(() => {
    const u = this.auth.user();
    return !!u && this.auth.hasPermission('notification:view');
  });

  constructor() {
    this.auth.user();
    // When user changes, refresh count and connect/disconnect hub
  }

  /** Load unread count and optionally recent list. Call after login or when opening dropdown. */
  loadUnreadCount(): void {
    if (!this.auth.getAccessToken()) return;
    this.http.get<ApiResponse<number>>(`${API}/unread-count`).subscribe({
      next: (res) => {
        if (res.success && typeof res.data === 'number') this.unreadCount.set(res.data);
      },
      error: () => {},
    });
  }

  /** Load recent notifications for the dropdown (e.g. first page, 10 items). */
  loadRecent(pageSize = 10): void {
    if (!this.auth.getAccessToken()) return;
    this.loading.set(true);
    const params = new HttpParams().set('page', '1').set('pageSize', String(pageSize));
    this.http.get<ApiResponse<PagedResult<NotificationDto>>>(API, { params }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data?.items) this.recentList.set(res.data.items);
      },
      error: () => this.loading.set(false),
    });
  }

  getPaged(params: { page: number; pageSize: number; unreadOnly?: boolean; category?: string }) {
    let httpParams = new HttpParams()
      .set('page', String(params.page))
      .set('pageSize', String(params.pageSize));
    if (params.unreadOnly === true) httpParams = httpParams.set('unreadOnly', 'true');
    if (params.category) httpParams = httpParams.set('category', params.category);
    return this.http.get<ApiResponse<PagedResult<NotificationDto>>>(API, { params: httpParams });
  }

  getById(id: string) {
    return this.http.get<ApiResponse<NotificationDto>>(`${API}/${id}`);
  }

  markAsRead(id: string): void {
    this.http.post(`${API}/${id}/read`, {}).subscribe({
      next: () => {
        this.unreadCount.update((c) => Math.max(0, c - 1));
        this.recentList.update((list) =>
          list.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
      },
    });
  }

  markAllAsRead(): void {
    this.http.post(`${API}/read-all`, {}).subscribe({
      next: () => {
        this.unreadCount.set(0);
        this.recentList.update((list) =>
          list.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
      },
    });
  }

  /** Connect to SignalR hub for real-time notifications. Call when user is authenticated. */
  connectHub(): void {
    // NOTE: في بيئة الإنتاج الحالية، مسار SignalR خلف IIS يُعيد 404 HTML،
    // لذلك نُعطل الاتصال بالـ Hub بالكامل لتجنّب رسائل الخطأ المتكررة.
    if (appConfig.apiUrl.startsWith('https://smart-training-management.gate-digital.com')) {
      return;
    }

    const token = this.auth.getAccessToken();
    if (!token || this.hub) return;
    const url = `${HUB_PATH}?access_token=${encodeURIComponent(token)}`;
    this.hub = new HubConnectionBuilder()
      .withUrl(url, { accessTokenFactory: () => token })
      .configureLogging(LogLevel.None)
      .withAutomaticReconnect()
      .build();

    this.hub.on('ReceiveNotification', (dto: NotificationDto) => {
      this.unreadCount.update((c) => c + 1);
      this.recentList.update((list) => [dto, ...list.filter((n) => n.id !== dto.id)].slice(0, 10));
      this.receiveNotification$.next(dto);
    });

    this.hub
      .start()
      .then(() => this.hubConnected.set(true))
      .catch(() => {});
    this.hub.onclose(() => this.hubConnected.set(false));
  }

  /** Disconnect SignalR. Call on logout. */
  disconnectHub(): void {
    if (this.hub) {
      this.hub.stop().catch(() => {});
      this.hub = null;
    }
    this.hubConnected.set(false);
    this.unreadCount.set(0);
    this.recentList.set([]);
  }

  ngOnDestroy(): void {
    this.disconnectHub();
  }
}
