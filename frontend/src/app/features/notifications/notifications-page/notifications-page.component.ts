import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { NotificationService } from '../../../core/notifications/notification.service';
import type { NotificationDto, PagedResult, ApiResponse } from '../../../core/notifications/models/notification.models';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [RouterLink, TranslateModule, PageShellComponent, TooltipDirective, PaginationComponent],
  template: `
    <app-page-shell
      [title]="'notifications.title' | translate"
      [breadcrumbs]="breadcrumbs()"
      [fullWidth]="true"
      [showPageTitle]="false"
    >
      <div class="ent-notifications-page">
        <header class="ent-admin-hero ent-notifications-hero ent-page-fade-in">
          <div class="ent-admin-hero__inner">
            <h1 class="ent-admin-hero__title">{{ 'notifications.title' | translate }}</h1>
            <p class="ent-admin-hero__subtitle">{{ 'enterprise.adminHeroSubtitle' | translate }}</p>
          </div>
        </header>

        <div class="ent-notifications-toolbar">
          <h2 class="ent-title visually-hidden">{{ 'notifications.title' | translate }}</h2>
          <div class="actions">
            @if (notifications.unreadCount() > 0) {
              <button
                type="button"
                class="ds-btn ds-btn--secondary premium-secondary-btn"
                (click)="markAllRead()"
                [appTooltip]="'notifications.markAllRead' | translate"
              >
                {{ 'notifications.markAllRead' | translate }}
              </button>
            }
          </div>
        </div>

        <div class="ent-notifications-filters-row">
          <div class="ent-segmented" role="tablist" [attr.aria-label]="'notifications.title' | translate">
            <button
              type="button"
              class="ent-segmented__btn"
              [class.active]="unreadOnly() === false"
              (click)="setUnreadOnly(false)"
              role="tab"
              [attr.aria-selected]="unreadOnly() === false"
            >
              {{ 'common.all' | translate }}
            </button>
            <button
              type="button"
              class="ent-segmented__btn"
              [class.active]="unreadOnly() === true"
              (click)="setUnreadOnly(true)"
              role="tab"
              [attr.aria-selected]="unreadOnly() === true"
            >
              {{ 'notifications.unread' | translate }}
            </button>
          </div>
          <select class="ds-select category-select border-radius-md" [value]="category()" (change)="onCategoryChange($event)">
            <option value="">{{ 'notifications.allCategories' | translate }}</option>
            @for (c of categories(); track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select>
        </div>

        <div class="list-wrap">
          @if (loading()) {
            <div class="skeleton-page">
              @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
                <div class="ds-skeleton skeleton-item"></div>
              }
            </div>
          } @else if (paged()) {
            @if (paged()!.items.length === 0) {
              <div class="ds-empty ent-empty-state">
                <p class="ds-empty__title">{{ 'notifications.emptyPage' | translate }}</p>
              </div>
            } @else {
              <div class="list">
                @for (n of paged()!.items; track n.id) {
                  <a
                    class="card ent-notification-card"
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
                <app-pagination
                  [page]="page()"
                  [totalPages]="paged()!.totalPages"
                  [disabled]="loading()"
                  (pageChange)="goPage($event)"
                />
              }
            }
          }
        </div>
      </div>
    </app-page-shell>
  `,
  styles: [`
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }
    .actions { display: flex; gap: var(--space-sm); flex-wrap: wrap; }
    .list-wrap { min-height: 200px; }
    .skeleton-page { padding: 0; }
    .skeleton-item {
      height: 80px;
      margin-bottom: var(--space-sm);
      border-radius: 20px;
    }
    .ent-empty-state {
      padding: var(--space-xl) var(--space-md);
      border-radius: 18px;
      border: 1px dashed color-mix(in srgb, var(--gulf-gold) 28%, var(--color-border-light));
      background: color-mix(in srgb, var(--gulf-green-800) 4%, var(--color-bg-elevated));
      text-align: center;
    }
    .list {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-sm);
    }
    @media (min-width: 600px) {
      .list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (min-width: 900px) {
      .list { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-md); }
    }
    @media (min-width: 1280px) {
      .list { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
    .card {
      display: flex;
      align-items: flex-start;
      gap: var(--space-md);
      padding: var(--space-md);
      text-decoration: none;
      color: inherit;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      min-height: 104px;
      border-radius: 20px;
    }
    .card:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
    }
    .ent-notifications-pagination {
      justify-content: center;
      margin-top: var(--space-lg);
    }
    .edge {
      position: absolute;
      inset-block: 0;
      inset-inline-end: 0;
      width: 4px;
      background: transparent;
      border-radius: 0;
    }
    .card.unread .edge {
      background: linear-gradient(180deg, var(--gulf-green-800), var(--gulf-gold));
    }
    .card-side { display: flex; padding-top: 2px; }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--gulf-green-800);
      flex-shrink: 0;
      margin-top: 6px;
      box-shadow: 0 0 10px color-mix(in srgb, var(--gulf-gold) 40%, transparent);
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
      color: var(--gulf-green-900);
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
      background: color-mix(in srgb, var(--gulf-green-800) 10%, transparent);
      color: var(--gulf-green-800);
      border: 1px solid color-mix(in srgb, var(--gulf-green-800) 18%, var(--gulf-gold) 22%);
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1;
    }
    .chip--unread {
      background: color-mix(in srgb, var(--gulf-gold) 14%, var(--color-bg-subtle));
      border-color: color-mix(in srgb, var(--gulf-gold) 35%, var(--color-border));
      color: var(--gulf-gold-dark);
    }
    .time {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      white-space: nowrap;
    }
  `],
})
export class NotificationsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  readonly notifications = inject(NotificationService);

  readonly breadcrumbs = computed(() => [{ label: this.translate.instant('notifications.title') }]);

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
