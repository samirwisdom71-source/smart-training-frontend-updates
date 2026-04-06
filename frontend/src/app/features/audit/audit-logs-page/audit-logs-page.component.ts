import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { AuditApiService } from '../../../core/api/audit/audit-api.service';
import type { AuditLogEntryViewDto, AuditListParams } from '../../../core/api/audit/audit-api.models';
import type { ApiResponse, PagedResult } from '../../../core/models/api-response';

@Component({
  selector: 'app-audit-logs-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, PageShellComponent],
  template: `
    <app-page-shell [title]="'audit.title' | translate" [breadcrumbs]="breadcrumbs()">
      <div filters>
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
            <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm filter-refresh-btn" (click)="load()">
              <span class="filter-refresh-icon" aria-hidden="true">⟳</span>
              <span class="filter-refresh-label">{{ 'common.refresh' | translate }}</span>
            </button>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="table-loading">
          <div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div>
          <div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div>
          <div class="ds-skeleton" style="height: 48px;"></div>
        </div>
      } @else if (error()) {
        <div class="ds-error-state">
          <p class="ds-error-state__title">{{ error() }}</p>
          <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="load()">{{ 'empty.tryAgain' | translate }}</button>
        </div>
      } @else if (!data()?.items?.length) {
        <div class="ds-empty">
          <p class="ds-empty__title">{{ 'audit.noEntries' | translate }}</p>
        </div>
      } @else {
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
                      [title]="'common.details' | translate"
                    >
                      <svg class="icon-svg" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/>
                        <path d="m16 16 3 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <button type="button" class="ds-btn ds-btn--ghost ds-btn--sm" [disabled]="!data()?.hasPreviousPage" (click)="prevPage()">{{ 'common.previous' | translate }}</button>
          <span class="pagination-info">{{ 'common.page' | translate }} {{ page() }} {{ 'common.of' | translate }} {{ data()?.totalPages ?? 1 }}</span>
          <button type="button" class="ds-btn ds-btn--ghost ds-btn--sm" [disabled]="!data()?.hasNextPage" (click)="nextPage()">{{ 'common.next' | translate }}</button>
        </div>
      }
    </app-page-shell>

    @if (detailEntry()) {
      <div class="drawer-overlay" (click)="closeDetail()">
        <div class="drawer ds-card" (click)="$event.stopPropagation()">
          <div class="drawer__header">
            <h3 class="drawer__title">{{ 'audit.detailTitle' | translate }}</h3>
            <button type="button" class="drawer__close" (click)="closeDetail()" aria-label="Close">&times;</button>
          </div>
          <div class="drawer__body">
            <dl class="detail-list">
              <dt>{{ 'audit.timestamp' | translate }}</dt>
              <dd>{{ formatDate(detailEntry()!.timestamp) }}</dd>
              <dt>{{ 'audit.user' | translate }}</dt>
              <dd>{{ detailEntry()!.userEmail ?? detailEntry()!.userFullName ?? ('audit.system' | translate) }}</dd>
              <dt>{{ 'audit.action' | translate }}</dt>
              <dd>{{ detailEntry()!.actionType }}</dd>
              <dt>{{ 'audit.module' | translate }}</dt>
              <dd>{{ detailEntry()!.moduleName ?? '—' }}</dd>
              <dt>{{ 'audit.entity' | translate }}</dt>
              <dd>{{ detailEntry()!.entityName ?? '—' }} {{ detailEntry()!.entityId ? '(' + detailEntry()!.entityId + ')' : '' }}</dd>
              <dt>{{ 'audit.status' | translate }}</dt>
              <dd>{{ detailEntry()!.success ? ('audit.success' | translate) : ('audit.failure' | translate) }}</dd>
              @if (detailEntry()!.failureReason) {
                <dt>{{ 'audit.failureReason' | translate }}</dt>
                <dd class="detail-error">{{ detailEntry()!.failureReason }}</dd>
              }
              @if (detailEntry()!.oldValuesSummary) {
                <dt>{{ 'audit.oldValues' | translate }}</dt>
                <dd class="detail-pre">{{ detailEntry()!.oldValuesSummary }}</dd>
              }
              @if (detailEntry()!.newValuesSummary) {
                <dt>{{ 'audit.newValues' | translate }}</dt>
                <dd class="detail-pre">{{ detailEntry()!.newValuesSummary }}</dd>
              }
              @if (detailEntry()!.ipAddress) {
                <dt>{{ 'audit.ipAddress' | translate }}</dt>
                <dd>{{ detailEntry()!.ipAddress }}</dd>
              }
              @if (detailEntry()!.userAgent) {
                <dt>{{ 'audit.userAgent' | translate }}</dt>
                <dd class="detail-pre detail-truncate">{{ detailEntry()!.userAgent }}</dd>
              }
            </dl>
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
    .filter-input, .filter-select { max-width: 160px; }
    .table-loading { padding: var(--space-md) 0; }
    .cell-date { white-space: nowrap; font-size: var(--text-body-sm); }
    .cell-actions { text-align: end; }
    .pagination { display: flex; align-items: center; gap: var(--space-md); margin-top: var(--space-lg); flex-wrap: wrap; }
    .pagination-info { font-size: var(--text-body-sm); color: var(--color-text-secondary); }
    .drawer-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(15,23,42,0.5); display: flex; justify-content: flex-end; }
    .drawer { width: 100%; max-width: 480px; height: 100%; overflow: auto; border-radius: 0; box-shadow: -4px 0 24px rgba(0,0,0,0.15); }
    .drawer__header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-lg); border-bottom: 1px solid var(--color-border-light); }
    .drawer__title { margin: 0; font-size: var(--text-h1); font-weight: 600; }
    .drawer__close { background: none; border: none; font-size: 1.5rem; line-height: 1; cursor: pointer; color: var(--color-text-muted); padding: 0; }
    .drawer__close:hover { color: var(--color-text); }
    .drawer__body { padding: var(--space-lg); }
    .detail-list { margin: 0; }
    .detail-list dt { font-weight: 600; font-size: var(--text-caption); color: var(--color-text-muted); margin-top: var(--space-md); margin-bottom: var(--space-2xs); }
    .detail-list dd { margin: 0; }
    .detail-pre { white-space: pre-wrap; word-break: break-word; font-family: var(--font-mono); font-size: var(--text-body-sm); }
    .detail-truncate { max-height: 80px; overflow: auto; }
    .detail-error { color: var(--color-error); }
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
