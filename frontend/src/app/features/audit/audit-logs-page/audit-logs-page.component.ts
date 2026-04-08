import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { AuditApiService } from '../../../core/api/audit/audit-api.service';
import type { AuditLogEntryViewDto, AuditListParams } from '../../../core/api/audit/audit-api.models';
import type { ApiResponse, PagedResult } from '../../../core/models/api-response';

@Component({
  selector: 'app-audit-logs-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, PageShellComponent, TooltipDirective, PaginationComponent],
  template: `
    <app-page-shell [title]="'audit.title' | translate" [breadcrumbs]="breadcrumbs()" [fullWidth]="true" [showPageTitle]="false">
      <div class="ent-admin-page ent-page-fade-in">
        <header class="ent-admin-hero">
          <div class="ent-admin-hero__inner">
            <h1 class="ent-admin-hero__title">{{ 'audit.title' | translate }}</h1>
            <p class="ent-admin-hero__subtitle">{{ 'enterprise.adminHeroSubtitle' | translate }}</p>
          </div>
        </header>

        <div filters class="ent-admin-filters ent-admin-filters--4col">
        <div class="ds-filterbar">
          <div class="ds-filterbar__controls">
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'audit.fromDate' | translate }}</div>
              <input
                type="date"
                class="ds-input filter-input ds-filterfield__control"
                [(ngModel)]="fromDate"
                [max]="toDate || null"
                (ngModelChange)="onFromDateChange()"
              />
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'audit.toDate' | translate }}</div>
              <input
                type="date"
                class="ds-input filter-input ds-filterfield__control"
                [(ngModel)]="toDate"
                [min]="fromDate || null"
                (ngModelChange)="onToDateChange()"
              />
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'audit.module' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="moduleName" (ngModelChange)="onFilterChange()">
                <option value="">{{ 'audit.allModules' | translate }}</option>
                <option value="Auth">Auth</option>
                <option value="Profile">Profile</option>
                <option value="User">User</option>
                <option value="Role">Role</option>
              </select>
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'audit.status' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="successFilter" (ngModelChange)="onFilterChange()">
                <option value="">{{ 'audit.allStatuses' | translate }}</option>
                <option value="true">{{ 'audit.success' | translate }}</option>
                <option value="false">{{ 'audit.failure' | translate }}</option>
              </select>
            </div>
          </div>
          <div class="ds-filterbar__actions">
            <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="clearFilters()">
              {{ 'common.clearFilters' | translate }}
            </button>
            <button type="button" class="ds-btn ds-btn--sm filter-refresh-btn ent-filter-primary" (click)="load()" [appTooltip]="'common.refresh' | translate">
              <span class="filter-refresh-icon" aria-hidden="true">⟳</span>
              <span class="filter-refresh-label">{{ 'common.refresh' | translate }}</span>
            </button>
          </div>
        </div>
        </div>

      <div class="ent-admin-content">
      @if (loading()) {
        <div class="ent-table-panel">
        <div class="table-loading">
          <div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div>
          <div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div>
          <div class="ds-skeleton" style="height: 48px;"></div>
        </div>
        </div>
      } @else if (error()) {
        <div class="ds-error-state">
          <p class="ds-error-state__title">{{ error() }}</p>
          <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="load()">{{ 'empty.tryAgain' | translate }}</button>
        </div>
      } @else if (!data()?.items?.length) {
        <div class="ent-table-panel">
        <div class="ds-empty">
          <p class="ds-empty__title">{{ 'audit.noEntries' | translate }}</p>
        </div>
        </div>
      } @else {
        <div class="ent-table-panel">
        <div class="ds-table-wrap">
          <table class="ds-table">
            <thead>
              <tr>
                <th>{{ 'audit.timestamp' | translate }}</th>
                <th>{{ 'audit.user' | translate }}</th>
                <th>{{ 'audit.action' | translate }}</th>
                <th>{{ 'audit.module' | translate }}</th>
                <th>{{ 'audit.status' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (e of data()!.items; track e.id) {
                <tr>
                  <td class="cell-date">{{ formatDate(e.timestamp) }}</td>
                  <td>{{ e.userEmail ?? e.userFullName ?? ('audit.system' | translate) }}</td>
                  <td>{{ e.actionType }}</td>
                  <td>{{ e.moduleName ?? '—' }}</td>
                  <td>
                    <span class="ds-badge" [class.ds-badge--success]="e.success" [class.ds-badge--error]="!e.success">
                      {{ e.success ? ('audit.success' | translate) : ('audit.failure' | translate) }}
                    </span>
                  </td>
                  <td class="cell-actions">
                    <button
                      type="button"
                      class="ds-btn ds-btn--ghost ds-btn--icon"
                      (click)="openDetail(e)"
                      [attr.aria-label]="'common.details' | translate"
                      [appTooltip]="'common.details' | translate"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <g clip-path="url(#clip0_4418_7081)">
                    <path d="M11.9999 16.3299C9.60992 16.3299 7.66992 14.3899 7.66992 11.9999C7.66992 9.60992 9.60992 7.66992 11.9999 7.66992C14.3899 7.66992 16.3299 9.60992 16.3299 11.9999C16.3299 14.3899 14.3899 16.3299 11.9999 16.3299ZM11.9999 9.16992C10.4399 9.16992 9.16992 10.4399 9.16992 11.9999C9.16992 13.5599 10.4399 14.8299 11.9999 14.8299C13.5599 14.8299 14.8299 13.5599 14.8299 11.9999C14.8299 10.4399 13.5599 9.16992 11.9999 9.16992Z" fill="white" style="fill: var(--fillg);"/>
                    <path d="M12.0001 21.0205C8.24008 21.0205 4.69008 18.8205 2.25008 15.0005C1.19008 13.3505 1.19008 10.6605 2.25008 9.00047C4.70008 5.18047 8.25008 2.98047 12.0001 2.98047C15.7501 2.98047 19.3001 5.18047 21.7401 9.00047C22.8001 10.6505 22.8001 13.3405 21.7401 15.0005C19.3001 18.8205 15.7501 21.0205 12.0001 21.0205ZM12.0001 4.48047C8.77008 4.48047 5.68008 6.42047 3.52008 9.81047C2.77008 10.9805 2.77008 13.0205 3.52008 14.1905C5.68008 17.5805 8.77008 19.5205 12.0001 19.5205C15.2301 19.5205 18.3201 17.5805 20.4801 14.1905C21.2301 13.0205 21.2301 10.9805 20.4801 9.81047C18.3201 6.42047 15.2301 4.48047 12.0001 4.48047Z" fill="white" style="fill: var(--fillg);"/>
                    </g>
                    <defs>
                    <clipPath id="clip0_4418_7081">
                    <rect width="24" height="24" fill="white"/>
                    </clipPath>
                    </defs>
                    </svg>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <app-pagination
          [page]="page()"
          [totalPages]="data()?.totalPages ?? 1"
          [disabled]="loading()"
          (pageChange)="setPage($event)"
        />
        </div>
      }
      </div>
      </div>
    </app-page-shell>

    @if (detailEntry()) {
      <div class="premium-drawer-overlay premium-drawer-overlay--centered">
        <button type="button" class="premium-drawer-backdrop" [attr.aria-label]="'common.close' | translate" (click)="closeDetail()"></button>
        <div class="premium-drawer premium-drawer--modal audit-detail" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <div class="premium-drawer__header audit-detail__header">
            <div class="audit-detail__titlewrap">
              <h3 class="premium-drawer__title audit-detail__title">{{ 'audit.detailTitle' | translate }}</h3>
              <div class="audit-detail__subtitle">
                <span class="audit-detail__who">{{ detailEntry()!.userEmail ?? detailEntry()!.userFullName ?? ('audit.system' | translate) }}</span>
                <span class="audit-detail__sep" aria-hidden="true">•</span>
                <span class="audit-detail__action">{{ detailEntry()!.actionType }}</span>
              </div>
            </div>
            <div class="audit-detail__headerActions">
              <span class="ds-badge audit-detail__status" [class.ds-badge--success]="detailEntry()!.success" [class.ds-badge--error]="!detailEntry()!.success">
                {{ detailEntry()!.success ? ('audit.success' | translate) : ('audit.failure' | translate) }}
              </span>
              <button type="button" class="premium-drawer__close" (click)="closeDetail()" [attr.aria-label]="'common.close' | translate" [appTooltip]="'common.close' | translate">&times;</button>
            </div>
          </div>

          <div class="premium-drawer__body audit-detail__body">
            @if (detailEntry()!.failureReason) {
              <div class="audit-detail__callout audit-detail__callout--error">
                <div class="audit-detail__calloutTitle">{{ 'audit.failureReason' | translate }}</div>
                <div class="audit-detail__calloutBody">{{ detailEntry()!.failureReason }}</div>
              </div>
            }

            <div class="audit-detail__grid">
              <section class="audit-detail__section">
                <h4 class="audit-detail__sectionTitle">{{ 'common.details' | translate }}</h4>
                <div class="audit-detail__kv">
                  <div class="audit-detail__row">
                    <div class="audit-detail__label">{{ 'audit.timestamp' | translate }}</div>
                    <div class="audit-detail__value">{{ formatDate(detailEntry()!.timestamp) }}</div>
                  </div>
                  <div class="audit-detail__row">
                    <div class="audit-detail__label">{{ 'audit.module' | translate }}</div>
                    <div class="audit-detail__value">{{ detailEntry()!.moduleName ?? '—' }}</div>
                  </div>
                  <div class="audit-detail__row">
                    <div class="audit-detail__label">{{ 'audit.entity' | translate }}</div>
                    <div class="audit-detail__value">
                      {{ detailEntry()!.entityName ?? '—' }}
                      @if (detailEntry()!.entityId) {
                        <span class="audit-detail__mono audit-detail__pill">#{{ detailEntry()!.entityId }}</span>
                      }
                    </div>
                  </div>
                  @if (detailEntry()!.ipAddress) {
                    <div class="audit-detail__row">
                      <div class="audit-detail__label">{{ 'audit.ipAddress' | translate }}</div>
                      <div class="audit-detail__value audit-detail__mono">{{ detailEntry()!.ipAddress }}</div>
                    </div>
                  }
                </div>
              </section>

              <section class="audit-detail__section">
                <h4 class="audit-detail__sectionTitle">{{ 'audit.user' | translate }}</h4>
                <div class="audit-detail__kv">
                  <div class="audit-detail__row">
                    <div class="audit-detail__label">{{ 'audit.user' | translate }}</div>
                    <div class="audit-detail__value">{{ detailEntry()!.userEmail ?? detailEntry()!.userFullName ?? ('audit.system' | translate) }}</div>
                  </div>
                  <div class="audit-detail__row">
                    <div class="audit-detail__label">{{ 'audit.action' | translate }}</div>
                    <div class="audit-detail__value">{{ detailEntry()!.actionType }}</div>
                  </div>
                  @if (detailEntry()!.userAgent) {
                    <div class="audit-detail__row audit-detail__row--stack">
                      <div class="audit-detail__label">{{ 'audit.userAgent' | translate }}</div>
                      <div class="audit-detail__value audit-detail__code audit-detail__truncate">{{ detailEntry()!.userAgent }}</div>
                    </div>
                  }
                </div>
              </section>
            </div>

            @if (detailEntry()!.oldValuesSummary || detailEntry()!.newValuesSummary) {
              <section class="audit-detail__section audit-detail__section--changes">
                <h4 class="audit-detail__sectionTitle">{{ 'audit.changes' | translate }}</h4>
                <div class="audit-detail__changes">
                  @if (detailEntry()!.oldValuesSummary) {
                    <div class="audit-detail__changeCard">
                      <div class="audit-detail__changeTitle">{{ 'audit.oldValues' | translate }}</div>
                      <pre class="audit-detail__code">{{ detailEntry()!.oldValuesSummary }}</pre>
                    </div>
                  }
                  @if (detailEntry()!.newValuesSummary) {
                    <div class="audit-detail__changeCard">
                      <div class="audit-detail__changeTitle">{{ 'audit.newValues' | translate }}</div>
                      <pre class="audit-detail__code">{{ detailEntry()!.newValuesSummary }}</pre>
                    </div>
                  }
                </div>
              </section>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* filter bar layout unified in design system */
    .filter-refresh-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
    .filter-refresh-icon {
      font-size: 0.85rem;
    }
    .table-loading { padding: var(--space-md) var(--space-lg); }
    .cell-date { white-space: nowrap; font-size: var(--text-body-sm); }
    .cell-actions { text-align: center; }

    /* —— Audit details modal redesign —— */
    .audit-detail__header {
      align-items: flex-start;
    }
    .audit-detail__titlewrap {
      position: relative;
      z-index: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .audit-detail__title {
      font-size: clamp(1.05rem, 2vw, 1.35rem);
      line-height: 1.15;
    }
    .audit-detail__subtitle {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      color: rgba(248, 250, 248, 0.82);
      min-width: 0;
    }
    .audit-detail__who {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 28rem;
    }
    .audit-detail__sep {
      opacity: 0.8;
    }
    .audit-detail__action {
      opacity: 0.95;
    }
    .audit-detail__headerActions {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      gap: var(--space-sm);
      flex-shrink: 0;
    }
    .audit-detail__status {
      border-color: rgba(255, 255, 255, 0.22);
      background: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.95);
    }
    .audit-detail__body {
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
    }
    .audit-detail__callout {
      border-radius: 16px;
      border: 1px solid color-mix(in srgb, var(--gulf-gold) 18%, var(--color-border-light));
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.72));
      box-shadow: 0 10px 28px rgba(15, 61, 46, 0.06);
      padding: 12px 14px;
    }
    .audit-detail__callout--error {
      border-color: color-mix(in srgb, rgba(211, 47, 47, 0.55) 55%, var(--gulf-gold) 10%);
      background: linear-gradient(180deg, rgba(253, 236, 234, 0.92), rgba(255, 255, 255, 0.75));
    }
    .audit-detail__calloutTitle {
      font-weight: 800;
      font-size: var(--text-body-sm);
      color: color-mix(in srgb, var(--color-text) 80%, #b91c1c 20%);
      margin-bottom: 4px;
    }
    .audit-detail__calloutBody {
      font-size: var(--text-body-sm);
      color: var(--color-text);
      line-height: 1.45;
      word-break: break-word;
    }
    .audit-detail__grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-md);
    }
    .audit-detail__section {
      border-radius: 18px;
      border: 1px solid color-mix(in srgb, var(--gulf-gold) 16%, var(--color-border-light));
      background: linear-gradient(
        180deg,
        color-mix(in srgb, var(--color-bg-elevated) 96%, var(--gulf-emerald) 4%) 0%,
        rgba(255, 255, 255, 0.55) 100%
      );
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
      padding: 14px;
    }
    .audit-detail__sectionTitle {
      margin: 0 0 10px;
      font-size: 0.9rem;
      font-weight: 900;
      letter-spacing: -0.01em;
      color: color-mix(in srgb, var(--gulf-green-900) 92%, var(--gulf-gold) 8%);
    }
    .audit-detail__kv {
      display: grid;
      gap: 10px;
    }
    .audit-detail__row {
      display: grid;
      grid-template-columns: 160px minmax(0, 1fr);
      gap: 10px;
      align-items: start;
    }
    .audit-detail__row--stack {
      grid-template-columns: 1fr;
      gap: 6px;
    }
    .audit-detail__label {
      font-size: var(--text-caption);
      font-weight: 700;
      color: var(--color-text-muted);
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }
    .audit-detail__value {
      font-size: var(--text-body-sm);
      color: var(--color-text);
      min-width: 0;
      word-break: break-word;
    }
    .audit-detail__mono {
      font-family: var(--font-mono);
    }
    .audit-detail__pill {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 2px 10px;
      border: 1px solid color-mix(in srgb, var(--gulf-gold) 18%, var(--color-border));
      background: color-mix(in srgb, var(--color-bg-elevated) 92%, var(--gulf-green-800) 4%);
      margin-inline-start: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      color: color-mix(in srgb, var(--color-text) 82%, var(--gulf-green-900) 18%);
      max-width: 100%;
    }
    .audit-detail__code {
      white-space: pre-wrap;
      word-break: break-word;
      font-family: var(--font-mono);
      font-size: var(--text-body-sm);
      padding: 10px 12px;
      margin: 0;
      border-radius: 14px;
      border: 1px solid color-mix(in srgb, var(--gulf-gold) 14%, var(--color-border));
      background: rgba(255, 255, 255, 0.72);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }
    .audit-detail__truncate {
      max-height: 96px;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
    }
    .audit-detail__section--changes {
      padding: 14px;
    }
    .audit-detail__changes {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-md);
    }
    .audit-detail__changeCard {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .audit-detail__changeTitle {
      font-size: var(--text-caption);
      font-weight: 800;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }
    @media (max-width: 860px) {
      .audit-detail__grid {
        grid-template-columns: 1fr;
      }
      .audit-detail__changes {
        grid-template-columns: 1fr;
      }
      .audit-detail__row {
        grid-template-columns: 140px minmax(0, 1fr);
      }
      .audit-detail__who {
        max-width: 18rem;
      }
    }
    @media (max-width: 520px) {
      .audit-detail__headerActions {
        gap: var(--space-xs);
      }
      .audit-detail__status {
        display: none;
      }
      .audit-detail__row {
        grid-template-columns: 1fr;
        gap: 6px;
      }
    }
  `]
})
export class AuditLogsPageComponent implements OnInit {
  private readonly api = inject(AuditApiService);
  private readonly translate = inject(TranslateService);

  readonly data = signal<PagedResult<AuditLogEntryViewDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 20;
  fromDate = '';
  toDate = '';
  moduleName = '';
  successFilter = '';
  readonly detailEntry = signal<AuditLogEntryViewDto | null>(null);

  breadcrumbs = computed(() => [{ label: this.translate.instant('audit.title') }]);

  ngOnInit(): void {
    this.load();
  }

  onFromDateChange(): void {
    if (this.fromDate && this.toDate && this.toDate < this.fromDate) {
      this.toDate = this.fromDate;
    }
    this.onFilterChange();
  }

  onToDateChange(): void {
    if (this.fromDate && this.toDate && this.toDate < this.fromDate) {
      this.fromDate = this.toDate;
    }
    this.onFilterChange();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const params: AuditListParams = {
      page: this.page(),
      pageSize: this.pageSize,
      moduleName: this.moduleName || undefined,
      success: this.successFilter === 'true' ? true : this.successFilter === 'false' ? false : undefined
    };
    if (this.fromDate) params.fromUtc = this.fromDate + 'T00:00:00Z';
    if (this.toDate) params.toUtc = this.toDate + 'T23:59:59Z';
    this.api.getPaged(params).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) this.data.set(res.data);
        else this.error.set(res.message ?? 'Failed to load');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? err.message ?? 'Failed to load');
      }
    });
  }

  onFilterChange(): void {
    this.page.set(1);
    this.load();
  }

  clearFilters(): void {
    this.fromDate = '';
    this.toDate = '';
    this.moduleName = '';
    this.successFilter = '';
    this.page.set(1);
    this.load();
  }

  prevPage(): void { this.page.update(p => Math.max(1, p - 1)); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }
  setPage(p: number): void { this.page.set(p); this.load(); }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' });
  }

  openDetail(entry: AuditLogEntryViewDto): void {
    this.detailEntry.set(entry);
  }

  closeDetail(): void {
    this.detailEntry.set(null);
  }
}
