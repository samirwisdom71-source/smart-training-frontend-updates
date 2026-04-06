import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { RecycleBinApiService } from '../../../core/api/recycle-bin/recycle-bin-api.service';
import { ToastService } from '../../../core/toast/toast.service';
import type { RecycleBinItemDto, RecycleBinListParams } from '../../../core/api/recycle-bin/recycle-bin-api.models';
import type { ApiResponse, PagedResult } from '../../../core/models/api-response';

const MODULE_OPTIONS: { value: string; labelKey: string }[] = [
  { value: '', labelKey: 'recycleBin.allModules' },
  { value: 'Organization', labelKey: 'recycleBin.module.Organization' },
  { value: 'OrganizationalUnit', labelKey: 'recycleBin.module.OrganizationalUnit' },
  { value: 'Job', labelKey: 'recycleBin.module.Job' },
  { value: 'Position', labelKey: 'recycleBin.module.Position' },
  { value: 'CompetencyFramework', labelKey: 'recycleBin.module.CompetencyFramework' },
  { value: 'CompetencyType', labelKey: 'recycleBin.module.CompetencyType' },
  { value: 'Competency', labelKey: 'recycleBin.module.Competency' },
  { value: 'ProficiencyLevel', labelKey: 'recycleBin.module.ProficiencyLevel' },
  { value: 'JobCompetencyMapping', labelKey: 'recycleBin.module.JobCompetencyMapping' },
  { value: 'TrainingNeed', labelKey: 'recycleBin.module.TrainingNeed' },
  { value: 'AnnualTrainingPlan', labelKey: 'recycleBin.module.AnnualTrainingPlan' },
  { value: 'TrainingPlanItem', labelKey: 'recycleBin.module.TrainingPlanItem' },
  { value: 'TrainingProgram', labelKey: 'recycleBin.module.TrainingProgram' },
  { value: 'TrainingSession', labelKey: 'recycleBin.module.TrainingSession' },
  { value: 'KnowledgeAsset', labelKey: 'recycleBin.module.KnowledgeAsset' },
  { value: 'KnowledgeTransferRecord', labelKey: 'recycleBin.module.KnowledgeTransferRecord' },
  { value: 'InternalExpert', labelKey: 'recycleBin.module.InternalExpert' },
];

@Component({
  selector: 'app-recycle-bin-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, PageShellComponent, ConfirmDialogComponent],
  template: `
    <app-page-shell [title]="'recycleBin.title' | translate" [breadcrumbs]="breadcrumbs()">
      <div filters>
        <div class="ds-filterbar">
          <div class="ds-filterbar__controls">
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'common.search' | translate }}</div>
              <input type="text" class="ds-input filter-search ds-filterfield__control" [(ngModel)]="search" (ngModelChange)="onFilterChange()" />
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'recycleBin.moduleType' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="moduleKey" (ngModelChange)="onFilterChange()">
                @for (opt of moduleOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.labelKey | translate }}</option>
                }
              </select>
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'recycleBin.fromDate' | translate }}</div>
              <input
                type="date"
                class="ds-input filter-input ds-filterfield__control"
                [(ngModel)]="fromDate"
                [max]="toDate || null"
                (ngModelChange)="onFromDateChange()"
              />
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'recycleBin.toDate' | translate }}</div>
              <input
                type="date"
                class="ds-input filter-input ds-filterfield__control"
                [(ngModel)]="toDate"
                [min]="fromDate || null"
                (ngModelChange)="onToDateChange()"
              />
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
          <p class="ds-empty__title">{{ 'recycleBin.empty' | translate }}</p>
        </div>
      } @else {
        <div class="ds-table-wrap">
          <table class="ds-table">
            <thead>
              <tr>
                <th>{{ 'recycleBin.moduleType' | translate }}</th>
                <th>{{ 'recycleBin.displayName' | translate }}</th>
                <th>{{ 'recycleBin.deletedAt' | translate }}</th>
                <th>{{ 'recycleBin.deletedBy' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (item of data()!.items; track item.entityId + item.deletedAt) {
                <tr>
                  <td><span class="ds-badge ds-badge--neutral">{{ item.moduleName }}</span></td>
                  <td>{{ item.displayName || '—' }}</td>
                  <td class="cell-date">{{ formatDate(item.deletedAt) }}</td>
                  <td>{{ item.deletedBy || '—' }}</td>
                  <td class="cell-actions">
                    @if (canRestore(item)) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon"
                        (click)="openRestoreConfirm(item)"
                        [attr.aria-label]="'recycleBin.restore' | translate"
                        [title]="'recycleBin.restore' | translate"
                      >
                        <svg class="icon-svg" viewBox="0 0 24 24">
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M2 8h20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                          <path d="M12 2v10l4-4-4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    }
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

    @if (showConfirm() && itemToRestore()) {
      <app-confirm-dialog
        [title]="'recycleBin.restoreConfirmTitle' | translate"
        [message]="restoreConfirmMessage()"
        [confirmLabel]="'recycleBin.restore' | translate"
        [cancelLabel]="'common.cancel' | translate"
        (confirm)="doRestore()"
        (cancel)="closeRestoreConfirm()"
      />
    }
  `,
  styles: [`
    /* filter bar layout unified in design system */
    .filter-refresh-btn { display: inline-flex; align-items: center; gap: 0.25rem; }
    .filter-refresh-icon { font-size: 0.85rem; }
    .filter-input, .filter-select { max-width: 160px; }
    .filter-search { min-width: 160px; }
    .table-loading { padding: var(--space-md) 0; }
    .cell-date { white-space: nowrap; font-size: var(--text-body-sm); }
    .cell-actions { text-align: end; }
    .pagination { display: flex; align-items: center; gap: var(--space-md); margin-top: var(--space-lg); flex-wrap: wrap; }
    .pagination-info { font-size: var(--text-body-sm); color: var(--color-text-secondary); }
  `]
})
export class RecycleBinPageComponent implements OnInit {
  private readonly api = inject(RecycleBinApiService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly data = signal<PagedResult<RecycleBinItemDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 20;
  search = '';
  moduleKey = '';
  fromDate = '';
  toDate = '';
  readonly showConfirm = signal(false);
  readonly itemToRestore = signal<RecycleBinItemDto | null>(null);
  readonly restoring = signal(false);

  readonly moduleOptions = MODULE_OPTIONS;
  breadcrumbs = computed(() => [{ label: this.translate.instant('recycleBin.title') }]);
  restoreConfirmMessage = computed(() => {
    const item = this.itemToRestore();
    if (!item) return '';
    return this.translate.instant('recycleBin.restoreConfirmMessage', { name: item.displayName || item.entityId });
  });

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
    const params: RecycleBinListParams = {
      page: this.page(),
      pageSize: this.pageSize,
      moduleKey: this.moduleKey || undefined,
      search: this.search.trim() || undefined,
      fromDate: this.fromDate ? this.fromDate + 'T00:00:00' : undefined,
      toDate: this.toDate ? this.toDate + 'T23:59:59' : undefined
    };
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
    this.search = '';
    this.moduleKey = '';
    this.fromDate = '';
    this.toDate = '';
    this.page.set(1);
    this.load();
  }

  prevPage(): void { this.page.update(p => Math.max(1, p - 1)); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' });
  }

  canRestore(item: RecycleBinItemDto): boolean {
    if (item.moduleKey === 'TrainingPlanItem' || item.moduleKey === 'TrainingSession')
      return !!item.relatedId;
    return true;
  }

  openRestoreConfirm(item: RecycleBinItemDto): void {
    if (!this.canRestore(item)) return;
    this.itemToRestore.set(item);
    this.showConfirm.set(true);
  }

  closeRestoreConfirm(): void {
    this.showConfirm.set(false);
    this.itemToRestore.set(null);
  }

  doRestore(): void {
    const item = this.itemToRestore();
    if (!item || this.restoring()) return;
    this.restoring.set(true);
    this.api.restore(item).subscribe({
      next: (res: ApiResponse<void>) => {
        this.restoring.set(false);
        this.closeRestoreConfirm();
        if (res.success) {
          this.toast.success(this.translate.instant('recycleBin.restored'));
          this.load();
        } else {
          this.toast.error(res.message ?? res.errors?.[0] ?? this.translate.instant('dialog.error'));
        }
      },
      error: (err) => {
        this.restoring.set(false);
        this.closeRestoreConfirm();
        this.toast.error(err.error?.message ?? err.error?.errors?.[0] ?? err.message ?? this.translate.instant('dialog.error'));
      }
    });
  }
}
