import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { CompetencyFrameworkModalComponent } from '../competency-framework-modal/competency-framework-modal.component';
import { CompetencyFrameworksApiService } from '../../../core/api/competency-frameworks/competency-frameworks-api.service';
import { OrganizationsApiService } from '../../../core/api/organizations/organizations-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import { LocalizedTextPipe } from '../../../shared/pipes/localized-text.pipe';
import type { CompetencyFrameworkListDto, CreateCompetencyFrameworkRequest, UpdateCompetencyFrameworkRequest } from '../../../core/api/competency-frameworks/competency-frameworks-api.models';
import type { OrganizationListDto } from '../../../core/api/organizations/organizations-api.models';
import type { PagedResult } from '../../../core/models/api-response';
import { ToastService } from '../../../core/toast/toast.service';

@Component({
  selector: 'app-competency-frameworks-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, PageShellComponent, ConfirmDialogComponent, LocalizedTextPipe, TooltipDirective, CompetencyFrameworkModalComponent],
  template: `
    <app-page-shell [title]="'nav.competencyFrameworks' | translate" [breadcrumbs]="breadcrumbs()" [showPageTitle]="false">
      <div class="actions-row" actions>
        @if (canCreate()) {
          <button type="button" class="ds-btn ds-btn--primary ds-btn--sm premium-primary-btn" (click)="openCreate()">
            <span class="premium-primary-btn__icon" aria-hidden="true">
              <svg class="icon-svg" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </span>
            {{ 'common.add' | translate }} {{ 'competency.framework' | translate }}
          </button>
        }
      </div>
      <div filters>
        <div class="ds-filterbar">
          <div class="ds-filterbar__controls">
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'common.search' | translate }}</div>
              <input type="text" class="ds-input filter-search ds-filterfield__control" [(ngModel)]="search" (ngModelChange)="onSearchChange()" [placeholder]="'common.search' | translate" />
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'table.organization' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="organizationIdFilter" (ngModelChange)="onFilterChange()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                @for (org of orgOptions(); track org.id) {
                  <option [ngValue]="org.id">{{ org.nameAr | localizedText:org.nameEn }}</option>
                }
              </select>
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'table.status' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="isActiveFilter" (ngModelChange)="onFilterChange()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                <option [ngValue]="true">{{ 'status.active' | translate }}</option>
                <option [ngValue]="false">{{ 'status.inactive' | translate }}</option>
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
                <th>{{ 'table.code' | translate }}</th>
                <th>{{ 'table.name' | translate }}</th>
                <th>{{ 'table.organization' | translate }}</th>
                <th>{{ 'table.status' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (f of data()!.items; track f.id) {
                <tr>
                  <td>{{ f.code }}</td>
                  <td>{{ displayName(f.nameEn, f.nameAr) }}</td>
                  <td>{{ f.organizationNameAr | localizedText:f.organizationNameEn }}</td>
                  <td><span class="ds-badge" [class.ds-badge--success]="f.isActive" [class.ds-badge--neutral]="!f.isActive">{{ f.isActive ? ('status.active' | translate) : ('status.inactive' | translate) }}</span></td>
                  <td class="cell-actions">
                    @if (canEdit()) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon premium-icon-btn"
                        (click)="openEdit(f)"
                        [attr.aria-label]="'common.edit' | translate"
                        [appTooltip]="'common.edit' | translate"
                      >
                        <svg class="icon-svg" viewBox="0 0 24 24">
                          <path d="M4 17.5V20h2.5L17 9.5 14.5 7 4 17.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                          <path d="M13.5 6.5 16 4l3 3-2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon status-toggle-btn premium-icon-btn"
                        [class.status-toggle-btn--active]="f.isActive"
                        (click)="setStatus(f)"
                        [attr.aria-label]="'org.setStatus' | translate"
                        [appTooltip]="'org.setStatus' | translate"
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
                        class="ds-btn ds-btn--ghost ds-btn--icon ds-btn--danger premium-icon-btn"
                        (click)="confirmDelete(f)"
                        [attr.aria-label]="'common.delete' | translate"
                        [appTooltip]="'common.delete' | translate"
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

    <app-competency-framework-modal
      [open]="showModal()"
      [form]="form"
      [orgOptions]="orgOptions()"
      [editingId]="editingId()"
      [modalError]="modalError()"
      [saving]="saving()"
      (dismissed)="onFrameworkModalDismissed()"
      (saveRequested)="save()"
    />

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
    .premium-primary-btn {
      background: linear-gradient(145deg, var(--gulf-green-800), color-mix(in srgb, var(--gulf-green-700) 86%, var(--gulf-gold) 14%));
      border-color: color-mix(in srgb, var(--gulf-gold) 28%, transparent);
      box-shadow: 0 10px 28px rgba(15, 61, 46, 0.16), 0 0 22px rgba(200, 164, 93, 0.12);
      transition: transform 0.18s ease, box-shadow 0.22s ease;
    }
    .premium-primary-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 14px 34px rgba(15, 61, 46, 0.2), 0 0 30px rgba(200, 164, 93, 0.16);
    }
    .premium-primary-btn__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.14);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
    }

    .premium-secondary-btn:hover:not(:disabled) {
      border-color: var(--gulf-gold);
      box-shadow: 0 0 18px rgba(200, 164, 93, 0.14);
    }

    .premium-icon-btn:hover:not(:disabled) {
      background: color-mix(in srgb, var(--gulf-gold) 10%, var(--color-bg-subtle));
    }
  `]
})
export class CompetencyFrameworksPageComponent implements OnInit {
  private readonly api = inject(CompetencyFrameworksApiService);
  private readonly orgApi = inject(OrganizationsApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  readonly data = signal<PagedResult<CompetencyFrameworkListDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  search = '';
  organizationIdFilter: string | null = null;
  isActiveFilter: boolean | null = null;
  searchDebounce: ReturnType<typeof setTimeout> | null = null;

  readonly orgOptions = signal<OrganizationListDto[]>([]);
  readonly showModal = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly modalError = signal<string | null>(null);

  readonly showConfirm = signal(false);
  readonly toDelete = signal<CompetencyFrameworkListDto | null>(null);

  form: CreateCompetencyFrameworkRequest = {
    code: '',
    nameEn: '',
    nameAr: '',
    descriptionEn: null,
    descriptionAr: null,
    organizationId: null,
  };

  /** Blocks openCreate/openEdit briefly after dismiss — avoids click-through reopening the modal. */
  private suppressFrameworkModalOpenUntil = 0;

  canCreate = () => this.auth.hasPermission(PermissionCodes.competency.create);
  canEdit = () => this.auth.hasPermission(PermissionCodes.competency.edit);
  canDelete = () => this.auth.hasPermission(PermissionCodes.competency.delete);

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.competency') }, { label: this.translate.instant('nav.competencyFrameworks') }]);

  displayName(nameEn: string | null | undefined, nameAr: string | null | undefined): string {
    const lang = this.translate.currentLang ?? 'en';
    const primary = (lang === 'ar' ? nameAr : nameEn) ?? '';
    const fallback = (lang === 'ar' ? nameEn : nameAr) ?? '';
    const value = primary.trim() || fallback.trim();
    return value || '—';
  }

  ngOnInit(): void {
    this.loadOrgOptions();
    this.load();
  }

  confirmDelete(f: CompetencyFrameworkListDto): void {
    this.toDelete.set(f);
    this.showConfirm.set(true);
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
    this.toDelete.set(null);
  }

  deleteConfirmMessage = computed(() => {
    const f = this.toDelete();
    if (!f) return '';
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

  loadOrgOptions(): void {
    this.orgApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.orgOptions.set(res.data.items);
      },
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getPaged({
      page: this.page(),
      pageSize: this.pageSize,
      search: this.search || undefined,
      organizationId: this.organizationIdFilter ?? undefined,
      isActive: this.isActiveFilter ?? undefined,
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
    this.organizationIdFilter = null;
    this.isActiveFilter = null;
    this.page.set(1);
    this.load();
  }

  prevPage(): void { this.page.update(p => Math.max(1, p - 1)); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }

  openCreate(): void {
    if (Date.now() < this.suppressFrameworkModalOpenUntil) return;
    this.editingId.set(null);
    this.form = { code: '', nameEn: '', nameAr: '', descriptionEn: null, descriptionAr: null, organizationId: null };
    this.modalError.set(null);
    this.showModal.set(true);
  }

  openEdit(f: CompetencyFrameworkListDto): void {
    if (Date.now() < this.suppressFrameworkModalOpenUntil) return;
    this.editingId.set(f.id);
    this.form = { code: f.code, nameEn: f.nameEn, nameAr: f.nameAr, descriptionEn: null, descriptionAr: null, organizationId: f.organizationId ?? null };
    this.modalError.set(null);
    this.showModal.set(true);
    this.api.getById(f.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.form = {
            code: res.data.code,
            nameEn: res.data.nameEn,
            nameAr: res.data.nameAr,
            descriptionEn: res.data.descriptionEn ?? null,
            descriptionAr: res.data.descriptionAr ?? null,
            organizationId: res.data.organizationId ?? null,
          };
        }
      },
    });
  }

  onFrameworkModalDismissed(): void {
    this.suppressFrameworkModalOpenUntil = Date.now() + 400;
    this.showModal.set(false);
    this.editingId.set(null);
    this.modalError.set(null);
  }

  save(): void {
    this.modalError.set(null);
    const id = this.editingId();
    if (id) {
      this.saving.set(true);
      this.api.update(id, this.form as UpdateCompetencyFrameworkRequest).subscribe({
        next: () => { this.saving.set(false); this.onFrameworkModalDismissed(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    } else {
      if (!this.form.code?.trim() || !this.form.nameEn?.trim()) {
        this.modalError.set(this.translate.instant('validation.required'));
        return;
      }
      this.saving.set(true);
      this.api.create(this.form).subscribe({
        next: () => { this.saving.set(false); this.onFrameworkModalDismissed(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    }
  }

  setStatus(f: CompetencyFrameworkListDto): void {
    this.api.setStatus(f.id, { isActive: !f.isActive }).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err.error?.message ?? err.message ?? 'Failed to set status'),
    });
  }
}
