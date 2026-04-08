import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { RecycleBinApiService } from '../../../core/api/recycle-bin/recycle-bin-api.service';
import { UsersApiService } from '../../../core/api/users/users-api.service';
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
  imports: [FormsModule, TranslateModule, PageShellComponent, ConfirmDialogComponent, TooltipDirective, PaginationComponent],
  template: `
    <app-page-shell [title]="'recycleBin.title' | translate" [breadcrumbs]="breadcrumbs()" [fullWidth]="true" [showPageTitle]="false">
      <div class="ent-admin-page ent-page-fade-in">
        <header class="ent-admin-hero">
          <div class="ent-admin-hero__inner">
            <h1 class="ent-admin-hero__title">{{ 'recycleBin.title' | translate }}</h1>
            <p class="ent-admin-hero__subtitle">{{ 'enterprise.adminHeroSubtitle' | translate }}</p>
          </div>
        </header>

      <div filters class="ent-admin-filters ent-admin-filters--4col">
        <div class="ds-filterbar">
          <div class="ds-filterbar__controls">
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'common.search' | translate }}</div>
              <input type="text" class="ds-input filter-search ds-filterfield__control" [(ngModel)]="search" (ngModelChange)="onFilterChange()" [placeholder]="'common.search' | translate" />
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
          <p class="ds-empty__title">{{ 'recycleBin.empty' | translate }}</p>
        </div>
        </div>
      } @else {
        <div class="ent-table-panel">
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
                  <td>{{ deletedByDisplay(item.deletedBy) }}</td>
                  <td class="cell-actions">
                    @if (canRestore(item)) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost"
                        (click)="openRestoreConfirm(item)"
                        [attr.aria-label]="'recycleBin.restore' | translate"
                        [appTooltip]="'recycleBin.restore' | translate"
                      >
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#bd2626">
<path d="M14.55 22.42C14.22 22.42 13.91 22.2 13.82 21.86C13.71 21.46 13.95 21.05 14.36 20.94C18.42 19.87 21.25 16.19 21.25 11.99C21.25 6.89 17.1 2.74 12 2.74C7.67 2.74 4.83 5.27 3.5 6.8H6.44C6.85 6.8 7.19 7.14 7.19 7.55C7.19 7.96 6.86 8.31 6.44 8.31H2.01C1.96 8.31 1.87 8.3 1.8 8.28C1.71 8.25 1.63 8.21 1.56 8.16C1.47 8.1 1.4 8.02 1.35 7.93C1.3 7.84 1.26 7.73 1.25 7.62C1.25 7.59 1.25 7.57 1.25 7.54V3C1.25 2.59 1.59 2.25 2 2.25C2.41 2.25 2.75 2.59 2.75 3V5.39C4.38 3.64 7.45 1.25 12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 16.88 19.46 21.16 14.74 22.4C14.68 22.41 14.61 22.42 14.55 22.42Z" fill="white" style="fill: var(--fillg);"/>
<path d="M11.29 22.73C11.27 22.73 11.25 22.72 11.24 22.72C10.16 22.65 9.1 22.41 8.1 22.02C7.81 21.91 7.61 21.62 7.62 21.31C7.62 21.22 7.64 21.13 7.67 21.05C7.82 20.67 8.27 20.48 8.64 20.62C9.51 20.96 10.42 21.16 11.34 21.23C11.73 21.25 12.04 21.59 12.04 21.99L12.03 22.03C12.01 22.42 11.68 22.73 11.29 22.73ZM5.78 20.58C5.61 20.58 5.45 20.52 5.31 20.42C4.47 19.74 3.73 18.95 3.13 18.07C3.04 17.94 2.99 17.8 2.99 17.65C2.99 17.4 3.11 17.17 3.32 17.03C3.65 16.8 4.13 16.89 4.36 17.21C4.36 17.22 4.36 17.22 4.36 17.22C4.37 17.23 4.38 17.25 4.39 17.26C4.91 18.01 5.54 18.68 6.25 19.24C6.42 19.38 6.53 19.59 6.53 19.82C6.53 19.99 6.48 20.16 6.37 20.3C6.22 20.48 6.01 20.58 5.78 20.58ZM2.44 15.7C2.11 15.7 1.82 15.49 1.73 15.18C1.41 14.15 1.25 13.08 1.25 12V11.99C1.26 11.58 1.59 11.25 2 11.25C2.41 11.25 2.75 11.59 2.75 12C2.75 12.94 2.89 13.86 3.16 14.73C3.18 14.81 3.19 14.88 3.19 14.96C3.19 15.28 2.98 15.57 2.66 15.67C2.59 15.69 2.52 15.7 2.44 15.7Z" fill="white" style="fill: var(--fillg);"/>
</svg>
                      </button>
                    }
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
    .filter-search { min-width: 0; }
    .table-loading { padding: var(--space-md) var(--space-lg); }
    .cell-date { white-space: nowrap; font-size: var(--text-body-sm); }
    .cell-actions { text-align: center; }
  `]
})
export class RecycleBinPageComponent implements OnInit {
  private readonly api = inject(RecycleBinApiService);
  private readonly usersApi = inject(UsersApiService);
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
  private readonly deletedByNameById = signal<Record<string, string>>({});
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
        if (res.success && res.data) {
          this.data.set(res.data);
          this.prefetchDeletedByNames(res.data.items);
        }
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
  setPage(p: number): void { this.page.set(p); this.load(); }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' });
  }

  deletedByDisplay(deletedBy: string | null): string {
    if (!deletedBy) return '—';
    if (deletedBy.includes('@')) return deletedBy; // already an email
    if (!this.isGuidLike(deletedBy)) return deletedBy; // already a readable name
    return this.deletedByNameById()[deletedBy] ?? deletedBy;
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

  private prefetchDeletedByNames(items: RecycleBinItemDto[]): void {
    const current = this.deletedByNameById();
    const uniqueIds = Array.from(new Set(items.map(i => i.deletedBy).filter((v): v is string => !!v)));
    const unresolved = uniqueIds.filter(id => this.isGuidLike(id) && !current[id]);
    for (const id of unresolved) {
      this.usersApi.getById(id).subscribe({
        next: (res) => {
          if (!res.success || !res.data) return;
          const name = res.data.fullName || res.data.email || id;
          this.deletedByNameById.update(map => ({ ...map, [id]: name }));
        },
        error: () => {
          // ignore lookup failures; we'll fall back to the raw id
        }
      });
    }
  }

  private isGuidLike(value: string): boolean {
    // 8-4-4-4-12 hex, common for user ids
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
  }
}
