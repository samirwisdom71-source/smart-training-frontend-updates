import { Component, inject, signal, HostListener, OnInit, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../core/notifications/notification.service';
import type { NotificationDto } from '../../../core/notifications/models/notification.models';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [RouterLink, TranslateModule, TooltipDirective],
  template: `
    @if (notifications.canView()) {
      <div class="bell-wrap">
        <button
          type="button"
          class="bell-btn"
          (click)="toggle()"
          [attr.aria-label]="'header.notificationsAria' | translate"
          [appTooltip]="'header.notificationsAria' | translate"
          [attr.aria-expanded]="open()"
        >
          <svg class="bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          @if (notifications.unreadCount() > 0) {
            <span class="badge">{{ notifications.unreadCount() > 99 ? '99+' : notifications.unreadCount() }}</span>
          }
        </button>
        @if (open()) {
          <div class="dropdown" (click)="$event.stopPropagation()">
            <div class="dropdown-header">
              <span class="dropdown-title">{{ 'notifications.title' | translate }}</span>
              @if (notifications.unreadCount() > 0) {
                <button type="button" class="link-btn" (click)="markAllRead()">{{ 'notifications.markAllRead' | translate }}</button>
              }
            </div>
            <div class="dropdown-list">
              @if (notifications.loading()) {
                <div class="skeleton-list">
                  @for (i of [1,2,3,4]; track i) {
                    <div class="skeleton-line"></div>
                  }
                </div>
              } @else if (notifications.recentList().length === 0) {
                <div class="empty">{{ 'notifications.empty' | translate }}</div>
              } @else {
                @for (n of notifications.recentList(); track n.id) {
                  <a
                    class="notification-row"
                    [class.unread]="!n.isRead"
                  [routerLink]="resolveLink(n)"
                  (click)="onClick(n)"
                  >
                    <span class="dot" [class.hide]="n.isRead"></span>
                    <div class="content">
                      <span class="title">{{ n.title }}</span>
                      <span class="time">{{ timeAgo(n.createdAt) }}</span>
                    </div>
                  </a>
                }
              }
            </div>
            <a class="view-all" routerLink="/notifications" (click)="close()">{{ 'notifications.viewAll' | translate }}</a>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .bell-wrap { position: relative; }
    .bell-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: var(--radius-md, 8px);
      color: var(--color-text-secondary, #64748b);
      cursor: pointer;
    }
    .bell-btn:hover { background: var(--color-border-light, #f1f5f9); color: var(--color-text, #0f172a); }
    :host-context(app-header) .bell-btn {
      color: var(--color-header-text-muted);
    }
    :host-context(app-header) .bell-btn:hover {
      background: var(--color-header-hover);
      color: var(--color-header-text);
    }
    .bell-icon { width: 22px; height: 22px; }
    .badge {
      position: absolute;
      top: 4px;
      inset-inline-end: 4px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      font-size: 11px;
      font-weight: 600;
      line-height: 18px;
      text-align: center;
      color: #fff;
      background: #ef4444;
      border-radius: 9px;
    }
    .dropdown {
      position: absolute;
      top: calc(100% + 8px);
      inset-inline-end: 0;
      width: 360px;
      max-height: 420px;
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      z-index: 1000;
    }
    .dropdown-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-md);
      border-block-end: 1px solid var(--color-border-light);
    }
    .dropdown-title { font-weight: 600; font-size: var(--text-body-sm); color: var(--color-text); }
    .link-btn {
      background: none;
      border: none;
      font-size: var(--text-caption);
      color: var(--color-primary);
      cursor: pointer;
      font-weight: 500;
    }
    .link-btn:hover { text-decoration: underline; }
    .dropdown-list {
      overflow-y: auto;
      max-height: 320px;
    }
    .skeleton-list { padding: 12px 16px; }
    .skeleton-line {
      height: 40px;
      margin-bottom: 8px;
      background: linear-gradient(90deg, var(--color-border-light) 25%, var(--color-border) 50%, var(--color-border-light) 75%);
      background-size: 200% 100%;
      animation: skeleton 1s ease-in-out infinite;
      border-radius: var(--radius-sm);
    }
    @keyframes skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .empty {
      padding: var(--space-lg);
      text-align: center;
      font-size: var(--text-body-sm);
      color: var(--color-text-secondary);
    }
    .notification-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 16px;
      text-decoration: none;
      color: inherit;
      border-bottom: 1px solid var(--color-border-light, #f1f5f9);
      cursor: pointer;
    }
    .notification-row:hover { background: var(--color-bg-hover, #f8fafc); }
    .notification-row.unread { background: var(--color-bg-subtle, #f8fafc); }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-primary, #2563eb);
      flex-shrink: 0;
      margin-top: 6px;
    }
    .dot.hide { visibility: hidden; }
    .content { flex: 1; min-width: 0; }
    .title {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text, #0f172a);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .time {
      display: block;
      font-size: 0.75rem;
      color: var(--color-text-secondary, #64748b);
      margin-top: 2px;
    }
    .view-all {
      display: block;
      padding: var(--space-sm) var(--space-md);
      text-align: center;
      font-size: var(--text-caption);
      font-weight: 500;
      color: var(--color-primary);
      text-decoration: none;
      border-block-start: 1px solid var(--color-border-light);
    }
    .view-all:hover { background: var(--color-bg-hover); }
  `],
})
export class NotificationBellComponent implements OnInit {
  readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef as any);
  readonly open = signal(false);

  ngOnInit(): void {
    if (this.notifications.canView()) this.notifications.loadUnreadCount();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    // اغلق القائمة فقط إذا كان الضغط خارج مكوّن الجرس بالكامل
    if (this.open() && target && !this.host.nativeElement.contains(target)) {
      this.close();
    }
  }

  toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next) {
      this.notifications.loadUnreadCount();
      this.notifications.loadRecent(10);
    }
  }

  close(): void {
    this.open.set(false);
  }

  markAllRead(): void {
    this.notifications.markAllAsRead();
  }

  onClick(n: NotificationDto): void {
    if (!n.isRead) this.notifications.markAsRead(n.id);
    this.close();
  }

  resolveLink(n: NotificationDto): string | string[] {
    const deepLink = (n.deepLinkUrl ?? '').trim();
    if (!deepLink) {
      const relatedType = (n.relatedEntityType ?? '').trim();
      const relatedId = (n.relatedEntityId ?? '').trim();

      if (relatedType === 'AnnualTrainingPlan' && relatedId) return `/training-plans/${relatedId}`;
      if (relatedType === 'TrainingNeed') return '/training-needs';
      if (relatedType === 'Enrollment') return '/enrollments';
      if (relatedType === 'Assessment') return '/assessments/my';
      if (relatedType === 'AssessmentCycle') return '/assessments/cycles';

      return '/notifications';
    }

    // Backward compatibility for old notifications that used a non-existing route.
    if (/^\/assessments\/cycles\/[0-9a-fA-F-]{36}$/.test(deepLink)) {
      return '/assessments/cycles';
    }
    if (/^\/notifications\/[0-9a-fA-F-]{36}$/.test(deepLink)) {
      return '/notifications';
    }

    return deepLink.startsWith('/') ? deepLink : `/${deepLink}`;
  }

  timeAgo(iso: string): string {
    const d = new Date(iso);
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return this.translate.instant('time.justNow');
    if (s < 3600) return this.translate.instant('time.minutesAgo', { count: Math.floor(s / 60) });
    if (s < 86400) return this.translate.instant('time.hoursAgo', { count: Math.floor(s / 3600) });
    if (s < 604800) return this.translate.instant('time.daysAgo', { count: Math.floor(s / 86400) });
    return d.toLocaleDateString(this.translate.currentLang === 'ar' ? 'ar-SA' : 'en-US');
  }
}
