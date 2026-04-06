import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { JobCompetencyMappingsApiService } from '../../../core/api/job-competency-mappings/job-competency-mappings-api.service';
import { JobsApiService } from '../../../core/api/jobs/jobs-api.service';
import { CompetenciesApiService } from '../../../core/api/competencies/competencies-api.service';
import { CompetencyFrameworksApiService } from '../../../core/api/competency-frameworks/competency-frameworks-api.service';
import { ProficiencyLevelsApiService } from '../../../core/api/proficiency-levels/proficiency-levels-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/toast/toast.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import { LocalizedTextPipe } from '../../../shared/pipes/localized-text.pipe';
import type { JobCompetencyMappingListDto, CreateJobCompetencyMappingRequest, UpdateJobCompetencyMappingRequest } from '../../../core/api/job-competency-mappings/job-competency-mappings-api.models';
import type { JobListDto } from '../../../core/api/jobs/jobs-api.models';
import type { CompetencyListDto } from '../../../core/api/competencies/competencies-api.models';
import type { ProficiencyLevelListDto } from '../../../core/api/proficiency-levels/proficiency-levels-api.models';
import type { CompetencyFrameworkListDto } from '../../../core/api/competency-frameworks/competency-frameworks-api.models';
import type { PagedResult } from '../../../core/models/api-response';

@Component({
  selector: 'app-job-competency-mappings-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, PageShellComponent, ConfirmDialogComponent, LocalizedTextPipe],
  template: `
    <app-page-shell [title]="'nav.jobCompetencyMappings' | translate" [breadcrumbs]="breadcrumbs()">
      <div class="actions-row" actions>
        @if (canCreate()) {
          <button type="button" class="ds-btn ds-btn--primary ds-btn--sm" (click)="openCreate()">{{ 'common.add' | translate }} {{ 'competency.mapping' | translate }}</button>
        }
      </div>
      <div filters>
        <div class="ds-filterbar">
          <div class="ds-filterbar__controls">
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'common.search' | translate }}</div>
              <input type="text" class="ds-input filter-search ds-filterfield__control" [(ngModel)]="search" (ngModelChange)="onSearchChange()" />
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'table.job' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="jobIdFilter" (ngModelChange)="onFilterChange()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                @for (j of jobOptions(); track j.id) {
                  <option [ngValue]="j.id">{{ j.titleAr | localizedText:j.titleEn }}</option>
                }
              </select>
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'competency.framework' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="frameworkIdFilter" (ngModelChange)="onFilterChange()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                @for (fw of frameworkOptions(); track fw.id) {
                  <option [ngValue]="fw.id">{{ fw.nameAr | localizedText:fw.nameEn }}</option>
                }
              </select>
            </div>
          </div>
          <div class="ds-filterbar__actions">
            <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="clearFilters()">
              {{ 'common.clearFilters' | translate }}
            </button>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="table-loading"><div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div><div class="ds-skeleton" style="height: 48px;"></div></div>
      } @else if (error()) {
        <div class="ds-error-state">
          <p class="ds-error-state__title">{{ error() }}</p>
          <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="load()">{{ 'empty.tryAgain' | translate }}</button>
        </div>
      } @else if (!data()?.items?.length) {
        <div class="ds-empty">
          <p class="ds-empty__title">{{ 'table.noRows' | translate }}</p>
          @if (canCreate()) {
            <button type="button" class="ds-btn ds-btn--primary ds-btn--sm" (click)="openCreate()">{{ 'common.add' | translate }}</button>
          }
        </div>
      } @else {
        <div class="ds-table-wrap">
          <table class="ds-table">
            <thead>
              <tr>
                <th>{{ 'table.job' | translate }}</th>
                <th>{{ 'competency.competency' | translate }}</th>
                <th>{{ 'competency.requiredLevel' | translate }}</th>
                <th>{{ 'competency.importanceWeight' | translate }}</th>
                <th>{{ 'competency.mandatory' | translate }}</th>
                <th>{{ 'table.status' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (m of data()!.items; track m.id) {
                <tr>
                  <td>{{ m.jobTitleEn ?? m.jobCode ?? '—' }}</td>
                  <td>{{ m.competencyNameEn ?? m.competencyCode ?? '—' }}</td>
                  <td>L{{ m.levelNumber }} ({{ m.requiredProficiencyLevelCode ?? '—' }})</td>
                  <td>{{ m.importanceWeight ?? '—' }}</td>
                  <td>{{ m.isMandatory ? ('common.yes' | translate) : ('common.no' | translate) }}</td>
                  <td><span class="ds-badge" [class.ds-badge--success]="m.isActive" [class.ds-badge--neutral]="!m.isActive">{{ m.isActive ? ('status.active' | translate) : ('status.inactive' | translate) }}</span></td>
                  <td class="cell-actions">
                    @if (canEdit()) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon"
                        (click)="openEdit(m)"
                        [attr.aria-label]="'common.edit' | translate"
                        [title]="'common.edit' | translate"
                      >
                        <svg class="icon-svg" viewBox="0 0 24 24">
                          <path d="M4 17.5V20h2.5L17 9.5 14.5 7 4 17.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                          <path d="M13.5 6.5 16 4l3 3-2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon status-toggle-btn"
                        [class.status-toggle-btn--active]="m.isActive"
                        (click)="setStatus(m)"
                        [attr.aria-label]="'org.setStatus' | translate"
                        [title]="'org.setStatus' | translate"
                      >
                        <svg class="icon-svg" viewBox="0 0 24 24">
                          <rect x="3" y="7" width="18" height="10" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/>
                          <circle cx="8" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>
                        </svg>
                      </button>
                    }
                    @if (canDelete()) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon ds-btn--danger"
                        (click)="confirmDelete(m)"
                        [attr.aria-label]="'common.delete' | translate"
                        [title]="'common.delete' | translate"
                      >
                        <svg class="icon-svg" viewBox="0 0 24 24">
                          <path d="M6 19V7h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z" fill="none" stroke="currentColor" stroke-width="1.6" />
                          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 7h16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
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

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-drawer ds-card" (click)="$event.stopPropagation()">
          <h3 class="modal-drawer__title">{{ editingId() ? ('common.edit' | translate) : ('common.add' | translate) }} {{ 'competency.mapping' | translate }}</h3>
          @if (modalError()) { <p class="ds-field-error">{{ modalError() }}</p> }
          <form (ngSubmit)="save()">
            <div class="form-group">
              <label class="ds-label">{{ 'table.job' | translate }}</label>
              <select class="ds-input" [(ngModel)]="form.jobId" name="jobId" [disabled]="!!editingId()">
                @for (j of jobOptions(); track j.id) {
                  <option [ngValue]="j.id">{{ j.titleAr | localizedText:j.titleEn }} ({{ j.code }})</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'competency.competency' | translate }}</label>
              <select class="ds-input" [(ngModel)]="form.competencyId" name="competencyId" (ngModelChange)="onCompetencyChange()" [disabled]="!!editingId()">
                @for (c of competencyOptions(); track c.id) {
                  <option [ngValue]="c.id">{{ c.nameAr | localizedText:c.nameEn }} ({{ c.code }})</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'competency.requiredLevel' | translate }}</label>
              <select class="ds-input" [(ngModel)]="form.requiredProficiencyLevelId" name="requiredProficiencyLevelId">
                @for (l of levelOptions(); track l.id) {
                  <option [ngValue]="l.id">L{{ l.levelNumber }} - {{ l.nameAr | localizedText:l.nameEn }} ({{ l.code }})</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'competency.importanceWeight' | translate }}</label>
              <input type="number" class="ds-input" [(ngModel)]="form.importanceWeight" name="importanceWeight" min="0" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'competency.mandatory' | translate }}</label>
              <select class="ds-input" [(ngModel)]="form.isMandatory" name="isMandatory">
                <option [ngValue]="false">{{ 'common.no' | translate }}</option>
                <option [ngValue]="true">{{ 'common.yes' | translate }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.notes' | translate }}</label>
              <textarea class="ds-textarea" [(ngModel)]="form.notes" name="notes" rows="2"></textarea>
            </div>
            <div class="modal-drawer__actions">
              <button type="button" class="ds-btn ds-btn--secondary" (click)="closeModal()">{{ 'common.cancel' | translate }}</button>
              <button type="submit" class="ds-btn ds-btn--primary" [disabled]="saving()">{{ saving() ? ('common.loading' | translate) : ('common.save' | translate) }}</button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (showConfirm()) {
      <app-confirm-dialog
        [title]="'dialog.confirmDelete' | translate"
        [message]="deleteConfirmMessage()"
        [confirmLabel]="'common.delete' | translate"
        [cancelLabel]="'common.cancel' | translate"
        (confirm)="doDelete()"
        (cancel)="cancelDelete()"
      />
    }
  `,
  styles: [`
    .filter-row { display: flex; gap: var(--space-md); align-items: center; flex-wrap: wrap; }
    .filter-search { max-width: 280px; }
    .filter-select { max-width: 200px; }
    .table-loading { padding: var(--space-md) 0; }
    .cell-actions { text-align: end; }
    .status-toggle-btn { color: var(--color-text-secondary, #64748b); }
    .status-toggle-btn .icon-svg { width: 22px; height: 22px; }
    .status-toggle-btn.status-toggle-btn--active { color: #22c55e; }
    .status-toggle-btn.status-toggle-btn--active:hover { background: rgba(34, 197, 94, 0.18); }
    .pagination { display: flex; align-items: center; gap: var(--space-md); margin-top: var(--space-lg); flex-wrap: wrap; }
    .pagination-info { font-size: var(--text-body-sm); color: var(--color-text-secondary); }
    .modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; padding: var(--space-lg); }
    .modal-drawer { max-width: 440px; width: 100%; max-height: 90vh; overflow: auto; }
    .modal-drawer__title { font-size: var(--text-h1); font-weight: 600; margin: 0 0 var(--space-md); }
    .modal-drawer form .form-group { margin-bottom: var(--space-md); }
    .modal-drawer__actions { display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-lg); }
  `]
})
export class JobCompetencyMappingsPageComponent implements OnInit {
  private readonly api = inject(JobCompetencyMappingsApiService);
  private readonly jobApi = inject(JobsApiService);
  private readonly competencyApi = inject(CompetenciesApiService);
  private readonly frameworkApi = inject(CompetencyFrameworksApiService);
  private readonly levelApi = inject(ProficiencyLevelsApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  readonly data = signal<PagedResult<JobCompetencyMappingListDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  search = '';
  jobIdFilter: string | null = null;
  frameworkIdFilter: string | null = null;
  searchDebounce: ReturnType<typeof setTimeout> | null = null;

  readonly jobOptions = signal<JobListDto[]>([]);
  readonly frameworkOptions = signal<CompetencyFrameworkListDto[]>([]);
  readonly competencyOptions = signal<CompetencyListDto[]>([]);
  readonly levelOptions = signal<ProficiencyLevelListDto[]>([]);
  readonly showModal = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly modalError = signal<string | null>(null);

  readonly showConfirm = signal(false);
  readonly toDelete = signal<JobCompetencyMappingListDto | null>(null);

  form: CreateJobCompetencyMappingRequest = {
    jobId: '',
    competencyId: '',
    requiredProficiencyLevelId: '',
    importanceWeight: null,
    isMandatory: false,
    notes: null,
  };

  canCreate = () => this.auth.hasPermission(PermissionCodes.jobCompetency.create);
  canEdit = () => this.auth.hasPermission(PermissionCodes.jobCompetency.edit);
  canDelete = () => this.auth.hasPermission(PermissionCodes.jobCompetency.delete);

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.competency') }, { label: this.translate.instant('nav.jobCompetencyMappings') }]);

  ngOnInit(): void {
    this.loadJobOptions();
    this.loadFrameworkOptions();
    this.loadCompetencyOptions();
    this.load();
  }

  confirmDelete(m: JobCompetencyMappingListDto): void {
    this.toDelete.set(m);
    this.showConfirm.set(true);
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
    this.toDelete.set(null);
  }

  deleteConfirmMessage = computed(() => {
    const m = this.toDelete();
    if (!m) return '';
    return this.translate.instant('dialog.confirmDelete');
  });

  doDelete(): void {
    const target = this.toDelete();
    if (!target) return;
    this.showConfirm.set(false);
    this.api.delete(target.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(this.translate.instant('common.deleted'));
          this.load();
        } else {
          this.toast.error(res.message || this.translate.instant('dialog.error'));
        }
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? err.message ?? this.translate.instant('dialog.error'));
      },
    });
  }

  loadJobOptions(): void {
    this.jobApi.getPaged({ page: 1, pageSize: 500, isActive: true }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.jobOptions.set(res.data.items);
      },
    });
  }

  loadFrameworkOptions(): void {
    this.frameworkApi.getPaged({ page: 1, pageSize: 500, isActive: true }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.frameworkOptions.set(res.data.items);
      },
    });
  }

  loadCompetencyOptions(): void {
    this.competencyApi.getPaged({ page: 1, pageSize: 500, isActive: true }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.competencyOptions.set(res.data.items);
      },
    });
  }

  onCompetencyChange(): void {
    const comp = this.competencyOptions().find(c => c.id === this.form.competencyId);
    if (comp) {
      this.levelApi.getPaged({ page: 1, pageSize: 100, frameworkId: comp.frameworkId, isActive: true }).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.levelOptions.set(res.data.items);
            if (!this.editingId() && res.data.items.length && !this.form.requiredProficiencyLevelId) {
              this.form.requiredProficiencyLevelId = res.data.items[0].id;
            }
          }
        },
      });
    } else {
      this.levelOptions.set([]);
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getPaged({
      page: this.page(),
      pageSize: this.pageSize,
      search: this.search || undefined,
      jobId: this.jobIdFilter ?? undefined,
      frameworkId: this.frameworkIdFilter ?? undefined,
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) this.data.set(res.data);
        else this.error.set(res.message ?? 'Failed to load');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? err.message ?? 'Failed to load');
      },
    });
  }

  onSearchChange(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => { this.page.set(1); this.load(); }, 300);
  }

  onFilterChange(): void {
    this.page.set(1);
    this.load();
  }

  clearFilters(): void {
    this.search = '';
    this.jobIdFilter = null;
    this.frameworkIdFilter = null;
    this.page.set(1);
    this.load();
  }

  prevPage(): void { this.page.update(p => Math.max(1, p - 1)); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }

  openCreate(): void {
    this.editingId.set(null);
    this.form = { jobId: this.jobOptions()[0]?.id ?? '', competencyId: '', requiredProficiencyLevelId: '', importanceWeight: null, isMandatory: false, notes: null };
    this.levelOptions.set([]);
    this.modalError.set(null);
    this.showModal.set(true);
  }

  openEdit(m: JobCompetencyMappingListDto): void {
    this.editingId.set(m.id);
    this.modalError.set(null);
    this.showModal.set(true);
    this.api.getById(m.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.form = {
            jobId: res.data.jobId,
            competencyId: res.data.competencyId,
            requiredProficiencyLevelId: res.data.requiredProficiencyLevelId,
            importanceWeight: res.data.importanceWeight ?? null,
            isMandatory: res.data.isMandatory,
            notes: res.data.notes ?? null,
          };
          this.onCompetencyChange();
        }
      },
    });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  save(): void {
    this.modalError.set(null);
    const id = this.editingId();
    if (id) {
      this.saving.set(true);
      const update: UpdateJobCompetencyMappingRequest = {
        requiredProficiencyLevelId: this.form.requiredProficiencyLevelId,
        importanceWeight: this.form.importanceWeight,
        isMandatory: this.form.isMandatory,
        notes: this.form.notes,
      };
      this.api.update(id, update).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    } else {
      if (!this.form.jobId || !this.form.competencyId || !this.form.requiredProficiencyLevelId) {
        this.modalError.set(this.translate.instant('validation.required'));
        return;
      }
      this.saving.set(true);
      this.api.create(this.form).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    }
  }

  setStatus(m: JobCompetencyMappingListDto): void {
    this.api.setStatus(m.id, { isActive: !m.isActive }).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err.error?.message ?? err.message ?? 'Failed to set status'),
    });
  }
}
