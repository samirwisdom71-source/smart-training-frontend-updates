import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { PortalToBodyDirective } from '../../../shared/portal/portal-to-body.directive';
import { JobsApiService } from '../../../core/api/jobs/jobs-api.service';
import { OrganizationsApiService } from '../../../core/api/organizations/organizations-api.service';
import { OrganizationalUnitsApiService } from '../../../core/api/organizational-units/organizational-units-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import type { JobListDto, CreateJobRequest, UpdateJobRequest } from '../../../core/api/jobs/jobs-api.models';
import type { OrganizationalUnitListDto } from '../../../core/api/organizational-units/organizational-units-api.models';
import type { PagedResult } from '../../../core/models/api-response';
import { ToastService } from '../../../core/toast/toast.service';

@Component({
  selector: 'app-jobs-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, PageShellComponent, ConfirmDialogComponent, TooltipDirective, PortalToBodyDirective],
  template: `
    <app-page-shell [title]="'nav.jobs' | translate" [breadcrumbs]="breadcrumbs()" [showPageTitle]="false">
      <div class="jobs-page ds-animate-fade-up" data-delay="1">
        <header class="jobs-hero">
          <div class="jobs-hero__inner">
            <h1 class="jobs-hero__title">{{ 'nav.jobs' | translate }}</h1>
            <p class="jobs-hero__subtitle">{{ 'jobs.pageSubtitle' | translate }}</p>
          </div>
        </header>

        <div class="actions-row jobs-actions" actions>
        @if (canCreate()) {
          <button type="button" class="ds-btn ds-btn--primary ds-btn--sm jobs-primary-btn" (click)="openCreate()">{{ 'common.add' | translate }} {{ 'table.job' | translate }}</button>
        }
        </div>
        <div filters>
          <div class="ds-filterbar jobs-filterbar">
          <div class="ds-filterbar__controls">
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'common.search' | translate }}</div>
              <input type="text" class="ds-input filter-search ds-filterfield__control jobs-input" [(ngModel)]="search" (ngModelChange)="onSearchChange()" [placeholder]="'common.search' | translate" />
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'table.organizationalUnit' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control jobs-input" [(ngModel)]="organizationalUnitIdFilter" (ngModelChange)="onFilterChange()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                @for (ou of ouOptions(); track ou.id) {
                  <option [ngValue]="ou.id">{{ getLocalizedText(ou.nameAr, ou.nameEn) }}</option>
                }
              </select>
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'table.status' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control jobs-input" [(ngModel)]="isActiveFilter" (ngModelChange)="onFilterChange()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                <option [ngValue]="true">{{ 'status.active' | translate }}</option>
                <option [ngValue]="false">{{ 'status.inactive' | translate }}</option>
              </select>
            </div>
          </div>
          <div class="ds-filterbar__actions">
            <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm jobs-secondary-btn" (click)="clearFilters()">
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
        <div class="ds-table-wrap jobs-table-wrap">
          <table class="ds-table jobs-table">
            <thead>
              <tr>
                <th>{{ 'table.code' | translate }}</th>
                <th>{{ 'table.name' | translate }}</th>
                <th>{{ 'table.gradeLevel' | translate }}</th>
                <th>{{ 'table.organizationalUnit' | translate }}</th>
                <th>{{ 'table.status' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (j of data()!.items; track j.id) {
                <tr>
                  <td>{{ j.code }}</td>
                  <td>{{ getLocalizedText(j.titleAr, j.titleEn) }}</td>
                  <td>{{ j.gradeLevel ?? '—' }}</td>
                  <td>{{ getLocalizedOuNameFromJob(j) }}</td>
                  <td><span class="ds-badge" [class.ds-badge--success]="j.isActive" [class.ds-badge--neutral]="!j.isActive">{{ j.isActive ? ('status.active' | translate) : ('status.inactive' | translate) }}</span></td>
                  <td class="cell-actions">
                    @if (canEdit()) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon jobs-icon-btn"
                        (click)="openEdit(j)"
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
                        class="ds-btn ds-btn--ghost ds-btn--icon status-toggle-btn jobs-icon-btn"
                        [class.status-toggle-btn--active]="j.isActive"
                        (click)="setStatus(j)"
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
                        class="ds-btn ds-btn--ghost ds-btn--icon ds-btn--danger jobs-icon-btn"
                        (click)="confirmDelete(j)"
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
      </div>
    </app-page-shell>

    @if (showModal()) {
      <div class="modal-overlay" appPortalToBody (click)="closeModal()">
        <div class="modal-drawer premium-modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="premium-modal__header">
            <div class="premium-modal__titlewrap">
              <h3 class="premium-modal__title">{{ editingId() ? ('common.edit' | translate) : ('common.add' | translate) }} {{ 'table.job' | translate }}</h3>
              <p class="premium-modal__subtitle">{{ 'nav.jobs' | translate }}</p>
            </div>
            <button type="button" class="ds-btn ds-btn--ghost ds-btn--icon premium-modal__close" (click)="closeModal()" [attr.aria-label]="'common.close' | translate" [appTooltip]="'common.close' | translate">
              <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="premium-modal__body">
            @if (modalError()) {
              <div class="premium-modal__error">
                <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 9v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M12 17h.01" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                </svg>
                <p class="premium-modal__error-text">{{ modalError() }}</p>
              </div>
            }
            <form class="premium-form" (ngSubmit)="save()">
            <div class="form-group">
              <label class="ds-label">{{ 'table.code' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="form.code" name="code" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.titleEn' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="form.titleEn" name="titleEn" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.titleAr' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="form.titleAr" name="titleAr" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.descriptionEn' | translate }}</label>
              <textarea class="ds-textarea" [(ngModel)]="form.descriptionEn" name="descriptionEn" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.descriptionAr' | translate }}</label>
              <textarea class="ds-textarea" [(ngModel)]="form.descriptionAr" name="descriptionAr" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.organizationalUnit' | translate }}</label>
              <select class="ds-input" [(ngModel)]="form.organizationalUnitId" name="organizationalUnitId">
                <option [ngValue]="null">—</option>
                @for (ou of ouOptions(); track ou.id) {
                  <option [ngValue]="ou.id">{{ getLocalizedText(ou.nameAr, ou.nameEn) }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.gradeLevel' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="form.gradeLevel" name="gradeLevel" />
            </div>
            <div class="premium-modal__footer">
              <button type="button" class="ds-btn ds-btn--secondary jobs-secondary-btn" (click)="closeModal()">{{ 'common.cancel' | translate }}</button>
              <button type="submit" class="ds-btn ds-btn--primary jobs-primary-btn" [disabled]="saving()">{{ saving() ? ('common.loading' | translate) : ('common.save' | translate) }}</button>
            </div>
            </form>
          </div>
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
    .jobs-page {
      --jobs-border: color-mix(in srgb, var(--gulf-gold) 18%, var(--color-border-light));
      --jobs-shadow-card: 0 12px 34px rgba(15, 61, 46, 0.08);
    }

    .jobs-hero {
      margin-block-end: var(--space-md);
      padding: var(--space-lg) var(--space-xl);
      border-radius: 20px;
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--gulf-green-800) 92%, #000) 0%,
        var(--gulf-green-800) 42%,
        color-mix(in srgb, var(--gulf-green-700) 88%, var(--gulf-gold) 12%) 100%
      );
      color: var(--gulf-text);
      border: 1px solid color-mix(in srgb, var(--gulf-gold) 35%, transparent);
      box-shadow:
        0 16px 40px rgba(11, 42, 33, 0.18),
        0 0 0 1px rgba(255, 255, 255, 0.06) inset,
        0 0 48px rgba(200, 164, 93, 0.12);
      position: relative;
      overflow: hidden;
    }

    .jobs-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 80% 60% at 0% 0%, rgba(200, 164, 93, 0.18), transparent 55%);
      pointer-events: none;
    }

    .jobs-hero__inner { position: relative; z-index: 1; }
    .jobs-hero__title { margin: 0 0 var(--space-xs); font-size: clamp(1.35rem, 2.5vw, 1.75rem); font-weight: 800; letter-spacing: -0.02em; text-shadow: 0 1px 18px rgba(0,0,0,0.2); }
    .jobs-hero__subtitle { margin: 0; font-size: var(--text-body-sm); font-weight: 600; color: var(--gulf-text-muted); max-width: 52rem; line-height: var(--line-height-normal); }

    .jobs-actions { margin-bottom: var(--space-md); }
    .jobs-primary-btn { background: linear-gradient(145deg, var(--gulf-green-800), color-mix(in srgb, var(--gulf-green-700) 86%, var(--gulf-gold) 14%)); border-color: color-mix(in srgb, var(--gulf-gold) 28%, transparent); box-shadow: 0 10px 28px rgba(15, 61, 46, 0.16), 0 0 22px rgba(200, 164, 93, 0.12); }
    .jobs-secondary-btn:hover:not(:disabled) { border-color: var(--gulf-gold); box-shadow: 0 0 18px rgba(200, 164, 93, 0.14); }

    .filter-search { max-width: 280px; }
    .filter-select { max-width: 200px; }
    .jobs-filterbar {
      margin-bottom: var(--space-md);
      padding: var(--space-md) var(--space-lg);
      border-radius: 18px;
      border: 1px solid var(--jobs-border);
      background: linear-gradient(180deg, rgba(255,255,255,0.92) 0%, color-mix(in srgb, var(--color-bg-elevated) 92%, var(--gulf-emerald) 6%) 100%);
      box-shadow: var(--jobs-shadow-card), inset 0 1px 0 rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    .jobs-input { border-radius: 14px; }

    .table-loading { padding: var(--space-md) 0; }
    .cell-actions { text-align: end; }
    .status-toggle-btn { color: var(--color-text-secondary, #64748b); }
    .status-toggle-btn .icon-svg { width: 22px; height: 22px; }
    .status-toggle-btn.status-toggle-btn--active { color: #22c55e; }
    .status-toggle-btn.status-toggle-btn--active:hover { background: rgba(34, 197, 94, 0.18); }
    .jobs-icon-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--gulf-gold) 10%, var(--color-bg-subtle)); }

    .jobs-table-wrap {
      border-radius: 18px;
      border-color: var(--jobs-border);
      box-shadow: var(--jobs-shadow-card);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      overflow: hidden;
    }

    .jobs-table th {
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--gulf-green-800) 92%, #000) 0%,
        var(--gulf-green-800) 58%,
        color-mix(in srgb, var(--gulf-green-700) 88%, var(--gulf-gold) 12%) 100%
      );
    }

    .pagination { display: flex; align-items: center; gap: var(--space-md); margin-top: var(--space-lg); flex-wrap: wrap; }
    .pagination-info { font-size: var(--text-body-sm); color: var(--color-text-secondary); }
    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      background: radial-gradient(ellipse 85% 65% at 50% 0%, rgba(200, 164, 93, 0.16), transparent 55%), rgba(15,23,42,0.58);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-lg);
    }

    .modal-drawer { max-width: 640px; width: 100%; max-height: 90vh; overflow: hidden; border-radius: 20px; }

    .premium-modal {
      border: 1px solid color-mix(in srgb, var(--gulf-gold) 30%, var(--color-border));
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, color-mix(in srgb, var(--color-bg-elevated) 92%, var(--gulf-emerald) 6%) 100%);
      box-shadow: 0 30px 70px rgba(0, 0, 0, 0.25), 0 0 28px rgba(200, 164, 93, 0.14);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }

    .premium-modal__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-md);
      padding: 18px 18px 14px;
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--gulf-green-800) 92%, #000) 0%,
        var(--gulf-green-800) 55%,
        color-mix(in srgb, var(--gulf-gold) 18%, var(--gulf-green-700)) 100%
      );
      color: var(--gulf-text);
      border-bottom: 1px solid rgba(255, 255, 255, 0.14);
      position: relative;
      overflow: hidden;
    }

    .premium-modal__header::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 80% 60% at 0% 0%, rgba(200, 164, 93, 0.22), transparent 55%);
      pointer-events: none;
    }

    .premium-modal__titlewrap { position: relative; z-index: 1; min-width: 0; }
    .premium-modal__title { margin: 0; font-size: 1.15rem; font-weight: 800; letter-spacing: -0.02em; text-shadow: 0 1px 18px rgba(0,0,0,0.22); }
    .premium-modal__subtitle { margin: 0.25rem 0 0; font-size: 0.85rem; font-weight: 600; color: rgba(248, 250, 248, 0.8); }

    .premium-modal__close {
      position: relative;
      z-index: 1;
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.95);
      border: 1px solid rgba(255,255,255,0.18);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
    }
    .premium-modal__close:hover:not(:disabled) {
      background: rgba(255,255,255,0.18);
      border-color: rgba(200,164,93,0.6);
      box-shadow: 0 0 18px rgba(200,164,93,0.18), inset 0 1px 0 rgba(255,255,255,0.16);
    }

    .premium-modal__body { padding: 18px; overflow: auto; flex: 1 1 auto; -webkit-overflow-scrolling: touch; }
    .premium-form .form-group { margin-bottom: var(--space-md); }

    .premium-modal__error {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 12px;
      border-radius: 14px;
      border: 1px solid color-mix(in srgb, var(--gulf-gold) 18%, rgba(211,47,47,0.28));
      background: linear-gradient(180deg, rgba(253, 236, 234, 0.85), rgba(255,255,255,0.7));
      box-shadow: 0 10px 26px rgba(211,47,47,0.08);
      margin-bottom: var(--space-md);
    }
    .premium-modal__error .icon-svg { width: 18px; height: 18px; color: #b91c1c; margin-top: 2px; }
    .premium-modal__error-text { margin: 0; font-size: var(--text-body-sm); color: color-mix(in srgb, var(--color-text) 80%, #b91c1c 20%); line-height: 1.4; }

    .premium-modal__footer {
      position: sticky;
      bottom: 0;
      display: flex;
      justify-content: flex-end;
      gap: var(--space-sm);
      padding: 14px 18px;
      background: linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.92));
      border-top: 1px solid color-mix(in srgb, var(--gulf-gold) 16%, var(--color-border));
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    @media (max-width: 560px) {
      .premium-modal__footer { flex-direction: column-reverse; align-items: stretch; }
      .modal-overlay { padding: var(--space-md); }
    }
  `]
})
export class JobsPageComponent implements OnInit {
  private readonly api = inject(JobsApiService);
  private readonly orgApi = inject(OrganizationsApiService);
  private readonly ouApi = inject(OrganizationalUnitsApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  readonly data = signal<PagedResult<JobListDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  search = '';
  organizationalUnitIdFilter: string | null = null;
  isActiveFilter: boolean | null = null;
  searchDebounce: ReturnType<typeof setTimeout> | null = null;

  readonly ouOptions = signal<OrganizationalUnitListDto[]>([]);
  readonly showModal = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly modalError = signal<string | null>(null);

  form: CreateJobRequest = {
    code: '',
    titleEn: '',
    titleAr: '',
    descriptionEn: null,
    descriptionAr: null,
    organizationalUnitId: null,
    gradeLevel: null,
  };

  readonly showConfirm = signal(false);
  readonly toDelete = signal<JobListDto | null>(null);

  canCreate = () => this.auth.hasPermission(PermissionCodes.job.create);
  canEdit = () => this.auth.hasPermission(PermissionCodes.job.edit);
  canDelete = () => this.auth.hasPermission(PermissionCodes.job.delete);

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.jobs') }]);

  ngOnInit(): void {
    this.loadOuOptions();
    this.load();
  }

  confirmDelete(j: JobListDto): void {
    this.toDelete.set(j);
    this.showConfirm.set(true);
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
    this.toDelete.set(null);
  }

  deleteConfirmMessage = computed(() => {
    const j = this.toDelete();
    if (!j) return '';
    return this.translate.instant('dialog.confirmDelete');
  });

  doDelete(): void {
    const target = this.toDelete();
    if (!target) return;
    this.showConfirm.set(false);
    this.api.delete(target.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(this.translate.instant('common.deleted') || this.translate.instant('common.saved'));
          this.load();
        } else {
          this.toast.error(res.message || this.translate.instant('error.generic'));
        }
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? err.message ?? this.translate.instant('error.generic'));
      },
    });
  }

  loadOuOptions(): void {
    this.orgApi.getDefault().subscribe({
      next: (res) => {
        const defaultOrgId = res.success && res.data?.id ? res.data.id : undefined;
        this.ouApi.getPaged({ page: 1, pageSize: 5000, organizationId: defaultOrgId, rootOnly: false, sortBy: 'type' }).subscribe({
          next: (r) => {
            if (r.success && r.data) this.ouOptions.set(r.data.items);
          },
        });
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
      organizationalUnitId: this.organizationalUnitIdFilter ?? undefined,
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
    this.organizationalUnitIdFilter = null;
    this.isActiveFilter = null;
    this.page.set(1);
    this.load();
  }

  prevPage(): void { this.page.update(p => Math.max(1, p - 1)); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }

  openCreate(): void {
    this.editingId.set(null);
    this.form = { code: '', titleEn: '', titleAr: '', descriptionEn: null, descriptionAr: null, organizationalUnitId: null, gradeLevel: null };
    this.modalError.set(null);
    this.showModal.set(true);
  }

  openEdit(j: JobListDto): void {
    this.editingId.set(j.id);
    this.form = {
      code: j.code,
      titleEn: j.titleEn,
      titleAr: j.titleAr,
      descriptionEn: null,
      descriptionAr: null,
      organizationalUnitId: j.organizationalUnitId ?? null,
      gradeLevel: j.gradeLevel ?? null,
    };
    this.modalError.set(null);
    this.showModal.set(true);
    this.api.getById(j.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.form = {
            code: res.data.code,
            titleEn: res.data.titleEn,
            titleAr: res.data.titleAr,
            descriptionEn: res.data.descriptionEn ?? null,
            descriptionAr: res.data.descriptionAr ?? null,
            organizationalUnitId: res.data.organizationalUnitId ?? null,
            gradeLevel: res.data.gradeLevel ?? null,
          };
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
      this.api.update(id, this.form as UpdateJobRequest).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    } else {
      if (!this.form.code?.trim() || !this.form.titleEn?.trim()) {
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

  setStatus(j: JobListDto): void {
    this.api.setStatus(j.id, { isActive: !j.isActive }).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err.error?.message ?? err.message ?? 'Failed to set status'),
    });
  }

  getLocalizedText(ar?: string | null, en?: string | null): string {
    const currentLang = (this.translate.currentLang || this.translate.getDefaultLang() || 'en').toLowerCase();
    const prefersArabic = currentLang.startsWith('ar');
    const arText = ar?.trim() ?? '';
    const enText = en?.trim() ?? '';
    if (prefersArabic) return arText || enText || '—';
    return enText || arText || '—';
  }

  getLocalizedOuNameFromJob(job: JobListDto): string {
    const ou = this.ouOptions().find(x => x.id === job.organizationalUnitId);
    if (ou) return this.getLocalizedText(ou.nameAr, ou.nameEn);
    const arName = (job as JobListDto & { organizationalUnitNameAr?: string | null }).organizationalUnitNameAr;
    return this.getLocalizedText(arName, job.organizationalUnitNameEn);
  }
}
