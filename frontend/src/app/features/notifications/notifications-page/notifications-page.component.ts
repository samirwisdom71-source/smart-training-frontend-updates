import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../core/notifications/notification.service';
import type { NotificationDto, PagedResult, ApiResponse } from '../../../core/notifications/models/notification.models';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  template: `
    <div class="page">
      <div class="toolbar">
        <h1 class="title">{{ 'notifications.title' | translate }}</h1>
        <div class="actions">
          @if (notifications.unreadCount() > 0) {
            <button type="button" class="ds-btn ds-btn--secondary" (click)="markAllRead()">{{ 'notifications.markAllRead' | translate }}</button>
          }
        </div>
      </div>
      <div class="filters">
        <div class="segmented" role="tablist" [attr.aria-label]="'notifications.title' | translate">
          <button
            type="button"
            class="segmented__btn"
            [class.active]="unreadOnly() === false"
            (click)="setUnreadOnly(false)"
            role="tab"
            [attr.aria-selected]="unreadOnly() === false"
          >
            {{ 'common.all' | translate }}
          </button>
          <button
            type="button"
            class="segmented__btn"
            [class.active]="unreadOnly() === true"
            (click)="setUnreadOnly(true)"
            role="tab"
            [attr.aria-selected]="unreadOnly() === true"
          >
            {{ 'notifications.unread' | translate }}
          </button>
        </div>
        <select class="ds-select category-select" [value]="category()" (change)="onCategoryChange($event)">
          <option value="">{{ 'notifications.allCategories' | translate }}</option>
          @for (c of categories(); track c) {
            <option [value]="c">{{ c }}</option>
          }
        </select>
      </div>
      <div class="list-wrap">
        @if (loading()) {
          <div class="skeleton-page">
            @for (i of [1,2,3,4,5,6,7,8]; track i) {
              <div class="ds-skeleton skeleton-item"></div>
            }
          </div>
        } @else if (paged()) {
          @if (paged()!.items.length === 0) {
            <div class="ds-empty empty-state">
              <p class="ds-empty__title">{{ 'notifications.emptyPage' | translate }}</p>
            </div>
          } @else {
            <div class="list">
              @for (n of paged()!.items; track n.id) {
                <a
                  class="card"
                  [class.unread]="!n.isRead"
                  (click)="onClick(n)"
                  [routerLink]="resolveLink(n)"
                >
                  <div class="card-side" aria-hidden="true">
                    <span class="dot" [class.hide]="n.isRead"></span>
                  </div>
                  <div class="card-body">
                    <div class="card-head">
                      <span class="card-title">{{ n.title }}</span>
                      <span class="time">{{ formatDate(n.createdAt) }}</span>
                    </div>
                    @if (n.body) {
                      <p class="card-body-text">{{ n.body }}</p>
                    }
                    <div class="card-meta">
                      @if (n.category) {
                        <span class="chip">{{ n.category }}</span>
                      }
                      @if (!n.isRead) {
                        <span class="chip chip--unread">{{ 'notifications.unread' | translate }}</span>
                      }
                    </div>
                  </div>
                  <span class="edge" aria-hidden="true"></span>
                </a>
              }
            </div>
            @if (paged()!.totalPages > 1) {
              <div class="pagination">
                <button
                  type="button"
                  class="ds-btn ds-btn--secondary"
                  [disabled]="!paged()!.hasPreviousPage"
                  (click)="goPage(page() - 1)"
                >
                  {{ 'notifications.previous' | translate }}
                </button>
                <span class="page-info">{{ 'common.page' | translate }} {{ page() }} {{ 'common.of' | translate }} {{ paged()!.totalPages }}</span>
                <button
                  type="button"
                  class="ds-btn ds-btn--secondary"
                  [disabled]="!paged()!.hasNextPage"
                  (click)="goPage(page() + 1)"
                >
                  {{ 'notifications.next' | translate }}
                </button>
              </div>
            }
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 920px; margin: 0 auto; padding: var(--space-xl); }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-lg);
    }
    .title { margin: 0; font-size: var(--text-display-2); font-weight: 600; color: var(--color-text); letter-spacing: -0.02em; }
    .actions { display: flex; gap: var(--space-sm); }
    .filters {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      margin-bottom: var(--space-lg);
      flex-wrap: wrap;
    }
    .segmented {
      display: inline-flex;
      border: 1px solid var(--color-border);
      background: var(--color-bg-elevated);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }
    .segmented__btn {
      padding: var(--space-sm) var(--space-md);
      border: none;
      background: transparent;
      font-size: var(--text-body-sm);
      cursor: pointer;
      color: var(--color-text-secondary);
    }
    .segmented__btn + .segmented__btn { border-inline-start: 1px solid var(--color-border-light); }
    .segmented__btn.active { background: var(--color-primary); color: #fff; }
    .segmented__btn:hover:not(.active) { background: var(--color-bg-hover); color: var(--color-text); }
    .category-select {
      min-width: 160px;
      padding: var(--space-sm) var(--space-md);
      border-radius: var(--radius-sm);
      font-size: var(--text-body-sm);
      background: var(--color-bg-elevated);
      color: var(--color-text);
    }
    .list-wrap { min-height: 200px; }
    .skeleton-page { padding: 0; }
    .skeleton-item {
      height: 80px;
      margin-bottom: var(--space-sm);
      border-radius: var(--radius-md);
    }
    .empty-state {
      padding: var(--space-2xl);
      color: var(--color-text-secondary);
    }
    .list { display: grid; grid-template-columns: 1fr; gap: var(--space-md); }
    @media (min-width: 900px) {
      .list { grid-template-columns: 1fr 1fr; }
    }
    .card {
      display: flex;
      align-items: flex-start;
      gap: var(--space-md);
      padding: var(--space-md);
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-md);
      text-decoration: none;
      color: inherit;
      cursor: pointer;
      transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
      position: relative;
      overflow: hidden;
      min-height: 112px;
    }
    .card:hover {
      background: var(--color-bg-hover);
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
      border-color: rgba(10, 77, 82, 0.25);
    }
    .card:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
    .card.unread { border-color: rgba(10, 77, 82, 0.35); }
    .edge {
      position: absolute;
      inset-block: 0;
      inset-inline-end: 0;
      width: 4px;
      background: transparent;
      border-radius: 0;
    }
    .card.unread .edge { background: var(--color-primary); }
    .card-side { display: flex; padding-top: 2px; }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--color-primary);
      flex-shrink: 0;
      margin-top: 6px;
    }
    .dot.hide { visibility: hidden; }
    .card-body { flex: 1; min-width: 0; }
    .card-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--space-sm);
    }
    .card-title {
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--color-text);
      letter-spacing: -0.01em;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .card-body-text {
      margin: 4px 0 0 0;
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .card-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 10px;
      flex-wrap: wrap;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 999px;
      background: rgba(10, 77, 82, 0.10);
      color: var(--color-primary);
      border: 1px solid rgba(10, 77, 82, 0.16);
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1;
    }
    .chip--unread {
      background: rgba(184, 134, 11, 0.14);
      border-color: rgba(184, 134, 11, 0.22);
      color: #8a5b00;
    }
    .time {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      white-space: nowrap;
    }
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-lg);
      margin-top: var(--space-xl);
      flex-wrap: wrap;
    }
    .page-info { font-size: 0.875rem; color: var(--color-text-secondary); }
  `],
})
export class NotificationsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  readonly notifications = inject(NotificationService);

  readonly page = signal(1);
  readonly pageSize = 20;
  readonly unreadOnly = signal<boolean | null>(false);
  readonly category = signal<string>('');
  readonly loading = signal(false);
  readonly paged = signal<PagedResult<NotificationDto> | null>(null);

  readonly categories = computed(() => {
    const p = this.paged();
    if (!p?.items?.length) return [] as string[];
    const set = new Set(p.items.map((n: NotificationDto) => n.category).filter(Boolean));
    return Array.from(set).sort() as string[];
  });

  constructor() {
    this.notifications.loadUnreadCount();
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.notifications
      .getPaged({
        page: this.page(),
        pageSize: this.pageSize,
        unreadOnly: this.unreadOnly() ?? undefined,
        category: this.category() || undefined,
      })
      .subscribe({
        next: (res: ApiResponse<PagedResult<NotificationDto>>) => {
          this.loading.set(false);
          if (res.success && res.data) this.paged.set(res.data);
        },
        error: () => this.loading.set(false),
      });
  }

  setUnreadOnly(value: boolean): void {
    this.unreadOnly.set(value);
    this.page.set(1);
    this.load();
  }

  onCategoryChange(e: Event): void {
    const v = (e.target as HTMLSelectElement).value;
    this.category.set(v);
    this.page.set(1);
    this.load();
  }

  goPage(p: number): void {
    this.page.set(p);
    this.load();
  }

  markAllRead(): void {
    this.notifications.markAllAsRead();
    this.load();
  }

  onClick(n: NotificationDto): void {
    if (!n.isRead) this.notifications.markAsRead(n.id);
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

  formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return this.translate.instant('time.justNow');
    if (diff < 3600000) return this.translate.instant('time.minutesAgo', { count: Math.floor(diff / 60000) });
    if (diff < 86400000) return this.translate.instant('time.hoursAgo', { count: Math.floor(diff / 3600000) });
    return d.toLocaleDateString(this.translate.currentLang === 'ar' ? 'ar-SA' : 'en-US');
  }
}
