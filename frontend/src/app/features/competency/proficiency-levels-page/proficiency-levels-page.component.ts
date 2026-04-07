import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { PortalToBodyDirective } from '../../../shared/portal/portal-to-body.directive';
import { ProficiencyLevelsApiService } from '../../../core/api/proficiency-levels/proficiency-levels-api.service';
import { CompetencyFrameworksApiService } from '../../../core/api/competency-frameworks/competency-frameworks-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/toast/toast.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import { LocalizedTextPipe } from '../../../shared/pipes/localized-text.pipe';
import type { ProficiencyLevelListDto, CreateProficiencyLevelRequest, UpdateProficiencyLevelRequest } from '../../../core/api/proficiency-levels/proficiency-levels-api.models';
import type { CompetencyFrameworkListDto } from '../../../core/api/competency-frameworks/competency-frameworks-api.models';
import type { PagedResult } from '../../../core/models/api-response';

@Component({
  selector: 'app-proficiency-levels-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, PageShellComponent, ConfirmDialogComponent, LocalizedTextPipe, TooltipDirective, PortalToBodyDirective],
  template: `
    <app-page-shell [title]="'nav.proficiencyLevels' | translate" [breadcrumbs]="breadcrumbs()" [showPageTitle]="false">
      <div class="actions-row" actions>
        @if (canCreate()) {
          <button type="button" class="ds-btn ds-btn--primary ds-btn--sm premium-primary-btn" (click)="openCreate()">
            <span class="premium-primary-btn__icon" aria-hidden="true">
              <svg class="icon-svg" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </span>
            {{ 'common.add' | translate }} {{ 'competency.proficiencyLevel' | translate }}
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
              <div class="ds-filterfield__label">{{ 'competency.framework' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="frameworkIdFilter" (ngModelChange)="onFilterChange()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                @for (fw of frameworkOptions(); track fw.id) {
                  <option [ngValue]="fw.id">{{ fw.nameAr | localizedText:fw.nameEn }}</option>
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
                <th>{{ 'competency.levelNumber' | translate }}</th>
                <th>{{ 'table.code' | translate }}</th>
                <th>{{ 'table.name' | translate }}</th>
                <th>{{ 'competency.framework' | translate }}</th>
                <th>{{ 'competency.displayOrder' | translate }}</th>
                <th>{{ 'table.status' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (l of data()!.items; track l.id) {
                <tr>
                  <td><strong>{{ l.levelNumber }}</strong></td>
                  <td>{{ l.code }}</td>
                  <td>{{ displayName(l.nameEn, l.nameAr) }}</td>
                  <td>{{ l.frameworkNameAr | localizedText:l.frameworkNameEn }}</td>
                  <td>{{ l.displayOrder }}</td>
                  <td><span class="ds-badge" [class.ds-badge--success]="l.isActive" [class.ds-badge--neutral]="!l.isActive">{{ l.isActive ? ('status.active' | translate) : ('status.inactive' | translate) }}</span></td>
                  <td class="cell-actions">
                    @if (canEdit()) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon premium-icon-btn"
                        (click)="openEdit(l)"
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
                        [class.status-toggle-btn--active]="l.isActive"
                        (click)="setStatus(l)"
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
                        (click)="confirmDelete(l)"
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

    @if (showModal()) {
      <div
        class="modal-overlay"
        appPortalToBody
        (mousedown)="$event.preventDefault(); $event.stopPropagation()"
        (click)="$event.preventDefault(); $event.stopPropagation(); closeModal()"
      >
        <div class="modal-drawer premium-modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="premium-modal__header">
            <div class="premium-modal__titlewrap">
              <h3 class="premium-modal__title">{{ editingId() ? ('common.edit' | translate) : ('common.add' | translate) }} {{ 'competency.proficiencyLevel' | translate }}</h3>
              <p class="premium-modal__subtitle">{{ 'nav.proficiencyLevels' | translate }}</p>
            </div>
            <button type="button" class="ds-btn ds-btn--ghost ds-btn--icon premium-modal__close" (click)="closeModal($event)" [attr.aria-label]="'common.close' | translate" [appTooltip]="'common.close' | translate">
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
              <label class="ds-label">{{ 'competency.framework' | translate }}</label>
              <select class="ds-input" [(ngModel)]="form.frameworkId" name="frameworkId" [disabled]="!!editingId()">
                @for (fw of frameworkOptions(); track fw.id) {
                  <option [ngValue]="fw.id">{{ fw.nameAr | localizedText:fw.nameEn }} ({{ fw.code }})</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.code' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="form.code" name="code" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'competency.levelNumber' | translate }}</label>
              <input type="number" class="ds-input" [(ngModel)]="form.levelNumber" name="levelNumber" min="1" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.nameEn' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="form.nameEn" name="nameEn" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.nameAr' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="form.nameAr" name="nameAr" />
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
              <label class="ds-label">{{ 'competency.displayOrder' | translate }}</label>
              <input type="number" class="ds-input" [(ngModel)]="form.displayOrder" name="displayOrder" min="0" />
            </div>
            <div class="premium-modal__footer">
              <button type="button" class="ds-btn ds-btn--secondary premium-secondary-btn" (click)="closeModal($event)">{{ 'common.cancel' | translate }}</button>
              <button type="submit" class="ds-btn ds-btn--primary premium-primary-btn" [disabled]="saving()">{{ saving() ? ('common.loading' | translate) : ('common.save' | translate) }}</button>
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
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 14px;
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
    .premium-icon-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--gulf-gold) 10%, var(--color-bg-subtle)); }

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

    .modal-drawer { max-width: 720px; width: 100%; max-height: 90vh; overflow: hidden; border-radius: 20px; }
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
    .premium-secondary-btn:hover:not(:disabled) {
      border-color: var(--gulf-gold);
      box-shadow: 0 0 18px rgba(200, 164, 93, 0.14);
    }
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
  `]
})
export class ProficiencyLevelsPageComponent implements OnInit {
  private readonly api = inject(ProficiencyLevelsApiService);
  private readonly frameworkApi = inject(CompetencyFrameworksApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  readonly data = signal<PagedResult<ProficiencyLevelListDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  search = '';
  frameworkIdFilter: string | null = null;
  isActiveFilter: boolean | null = null;
  searchDebounce: ReturnType<typeof setTimeout> | null = null;

  readonly frameworkOptions = signal<CompetencyFrameworkListDto[]>([]);
  readonly showModal = signal(false);
  readonly modalClosing = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly modalError = signal<string | null>(null);

  readonly showConfirm = signal(false);
  readonly toDelete = signal<ProficiencyLevelListDto | null>(null);

  form: CreateProficiencyLevelRequest = {
    frameworkId: '',
    code: '',
    levelNumber: 1,
    nameEn: '',
    nameAr: '',
    descriptionEn: null,
    descriptionAr: null,
    displayOrder: 0,
  };

  canCreate = () => this.auth.hasPermission(PermissionCodes.competency.create);
  canEdit = () => this.auth.hasPermission(PermissionCodes.competency.edit);
  canDelete = () => this.auth.hasPermission(PermissionCodes.competency.delete);

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.competency') }, { label: this.translate.instant('nav.proficiencyLevels') }]);

  displayName(nameEn: string | null | undefined, nameAr: string | null | undefined): string {
    const lang = this.translate.currentLang ?? 'en';
    const primary = (lang === 'ar' ? nameAr : nameEn) ?? '';
    const fallback = (lang === 'ar' ? nameEn : nameAr) ?? '';
    const value = primary.trim() || fallback.trim();
    return value || '—';
  }

  ngOnInit(): void {
    this.loadFrameworkOptions();
    this.load();
  }

  confirmDelete(l: ProficiencyLevelListDto): void {
    this.toDelete.set(l);
    this.showConfirm.set(true);
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
    this.toDelete.set(null);
  }

  deleteConfirmMessage = computed(() => {
    const l = this.toDelete();
    if (!l) return '';
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

  loadFrameworkOptions(): void {
    this.frameworkApi.getPaged({ page: 1, pageSize: 500, isActive: true }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.frameworkOptions.set(res.data.items);
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
      frameworkId: this.frameworkIdFilter ?? undefined,
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
    this.frameworkIdFilter = null;
    this.isActiveFilter = null;
    this.page.set(1);
    this.load();
  }

  prevPage(): void { this.page.update(p => Math.max(1, p - 1)); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }

  openCreate(): void {
    if (this.modalClosing()) return;
    this.editingId.set(null);
    const fw = this.frameworkOptions()[0];
    this.form = { frameworkId: fw?.id ?? '', code: '', levelNumber: 1, nameEn: '', nameAr: '', descriptionEn: null, descriptionAr: null, displayOrder: 0 };
    this.modalError.set(null);
    this.showModal.set(true);
  }

  openEdit(l: ProficiencyLevelListDto): void {
    if (this.modalClosing()) return;
    this.editingId.set(l.id);
    this.form = { frameworkId: l.frameworkId, code: l.code, levelNumber: l.levelNumber, nameEn: l.nameEn, nameAr: l.nameAr, descriptionEn: null, descriptionAr: null, displayOrder: l.displayOrder };
    this.modalError.set(null);
    this.showModal.set(true);
    this.api.getById(l.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.form = {
            frameworkId: res.data.frameworkId,
            code: res.data.code,
            levelNumber: res.data.levelNumber,
            nameEn: res.data.nameEn,
            nameAr: res.data.nameAr,
            descriptionEn: res.data.descriptionEn ?? null,
            descriptionAr: res.data.descriptionAr ?? null,
            displayOrder: res.data.displayOrder,
          };
        }
      },
    });
  }

  closeModal(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.modalClosing()) return;
    this.modalClosing.set(true);
    setTimeout(() => {
      this.showModal.set(false);
      this.editingId.set(null);
      this.modalClosing.set(false);
    }, 0);
  }

  save(): void {
    this.modalError.set(null);
    const id = this.editingId();
    if (id) {
      this.saving.set(true);
      this.api.update(id, { code: this.form.code, levelNumber: this.form.levelNumber, nameEn: this.form.nameEn, nameAr: this.form.nameAr, descriptionEn: this.form.descriptionEn, descriptionAr: this.form.descriptionAr, displayOrder: this.form.displayOrder }).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    } else {
      if (!this.form.code?.trim() || !this.form.nameEn?.trim() || !this.form.frameworkId) {
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

  setStatus(l: ProficiencyLevelListDto): void {
    this.api.setStatus(l.id, { isActive: !l.isActive }).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err.error?.message ?? err.message ?? 'Failed to set status'),
    });
  }
}
