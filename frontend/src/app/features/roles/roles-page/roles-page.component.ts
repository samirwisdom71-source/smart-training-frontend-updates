import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { RolesApiService } from '../../../core/api/roles/roles-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import type { RoleListDto, RoleDto, CreateRoleRequest, PermissionDto } from '../../../core/api/roles/roles-api.models';
import type { PagedResult } from '../../../core/models/api-response';

@Component({
  selector: 'app-roles-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, PageShellComponent, ConfirmDialogComponent, TooltipDirective],
  template: `
    <app-page-shell [title]="'nav.roles' | translate" [breadcrumbs]="breadcrumbs()" [fullWidth]="true" [showPageTitle]="false">
      <div class="ent-admin-page ent-page-fade-in">
        <header class="ent-admin-hero">
          <div class="ent-admin-hero__inner">
            <h1 class="ent-admin-hero__title">{{ 'nav.roles' | translate }}</h1>
            <p class="ent-admin-hero__subtitle">{{ 'enterprise.adminHeroSubtitle' | translate }}</p>
          </div>
        </header>

      <div class="actions-row">
        @if (canCreate()) {
          <button type="button" class="ds-btn ds-btn--primary ds-btn--sm premium-primary-btn" (click)="openCreate()" [appTooltip]="('common.add' | translate) + ' — ' + ('table.role' | translate)">{{ 'common.add' | translate }} {{ 'table.role' | translate }}</button>
        }
      </div>
      <div filters class="ent-admin-filters">
        <div class="ds-filterbar">
          <div class="ds-filterbar__controls">
            <div class="ds-filterfield" style="max-width: 280px;">
              <div class="ds-filterfield__label">{{ 'common.search' | translate }}</div>
              <input type="text" class="ds-input filter-search ds-filterfield__control" [(ngModel)]="search" (ngModelChange)="onSearchChange()" [placeholder]="'common.search' | translate" />
            </div>
          </div>
          <div class="ds-filterbar__actions">
            <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="clearFilters()">
              {{ 'common.clearFilters' | translate }}
            </button>
          </div>
        </div>
      </div>

      <div class="ent-admin-content">
      @if (loading()) {
        <div class="ent-table-panel">
        <div class="table-loading">
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
          <p class="ds-empty__title">{{ 'table.noRows' | translate }}</p>
          @if (canCreate()) {
            <button type="button" class="ds-btn ds-btn--primary ds-btn--sm premium-primary-btn" (click)="openCreate()">{{ 'common.add' | translate }}</button>
          }
        </div>
        </div>
      } @else {
        <div class="ent-table-panel">
        <div class="ds-table-wrap">
          <table class="ds-table">
            <thead>
              <tr>
                <th>{{ 'table.name' | translate }}</th>
                <th>{{ 'table.permissions' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (r of data()!.items; track r.id) {
                <tr>
                  <td>{{ r.name }}</td>
                  <td>{{ r.description ?? '—' }}</td>
                  <td class="cell-actions">
                    @if (canEdit()) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon"
                        (click)="openEdit(r)"
                        [attr.aria-label]="'common.edit' | translate"
                        [appTooltip]="'common.edit' | translate"
                      >
                        <svg class="icon-svg" viewBox="0 0 24 24">
                          <path d="M4 17.5V20h2.5L17 9.5 14.5 7 4 17.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                          <path d="M13.5 6.5 16 4l3 3-2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    }
                    @if (canDelete()) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon ds-btn--danger"
                        (click)="confirmDelete(r)"
                        [attr.aria-label]="'common.delete' | translate"
                        [appTooltip]="'common.delete' | translate"
                      >
                        <svg class="icon-svg" viewBox="0 0 24 24">
                          <path d="M6 7h12M10 10v7M14 10v7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                          <path d="M9 4h6l1 2H8l1-2Zm-1 3-1 11h10l-1-11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="pagination ent-pagination">
          <button type="button" class="ds-btn ds-btn--ghost ds-btn--sm" [disabled]="!data()?.hasPreviousPage" (click)="prevPage()">{{ 'common.previous' | translate }}</button>
          <span class="ent-pagination-info">{{ 'common.page' | translate }} {{ page() }} {{ 'common.of' | translate }} {{ data()?.totalPages ?? 1 }}</span>
          <button type="button" class="ds-btn ds-btn--ghost ds-btn--sm" [disabled]="!data()?.hasNextPage" (click)="nextPage()">{{ 'common.next' | translate }}</button>
        </div>
        </div>
      }
      </div>
      </div>
    </app-page-shell>

    @if (showModal()) {
      <div class="ent-modal-overlay">
        <button type="button" class="ent-modal-backdrop" [attr.aria-label]="'common.close' | translate" (click)="closeModal()"></button>
        <div class="ent-modal-shell modal-drawer premium-modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="premium-modal__header">
            <div class="premium-modal__titlewrap">
              <h3 class="premium-modal__title">{{ editingId() ? ('common.edit' | translate) : ('common.add' | translate) }} {{ 'table.role' | translate }}</h3>
              <p class="premium-modal__subtitle">{{ 'nav.roles' | translate }}</p>
            </div>
            <button type="button" class="ds-btn ds-btn--ghost ds-btn--icon premium-modal__close" (click)="closeModal()" [attr.aria-label]="'common.close' | translate" [appTooltip]="'common.close' | translate">
              <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div class="premium-modal__body">
          @if (modalError()) {
            <div class="premium-modal__error">
              <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 9v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <path d="M12 17h.01" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
              </svg>
              <p class="premium-modal__error-text">{{ modalError() }}</p>
            </div>
          }
          <form class="premium-form" (ngSubmit)="saveRole()">
            <div class="form-group">
              <label class="ds-label">{{ 'table.name' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="form.name" name="name" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.description' | translate }}</label>
              <textarea class="ds-textarea" [(ngModel)]="form.description" name="description" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.permissions' | translate }}</label>
              <div class="permissions-list">
                @for (p of permissionsList(); track p.id) {
                  <label class="permission-item">
                    <input type="checkbox" [checked]="form.permissionIds.includes(p.id)" (change)="togglePermission(p.id)" />
                    <span class="permission-label">{{ p.code }}{{ p.description ? ' — ' + p.description : '' }}</span>
                  </label>
                }
              </div>
            </div>
            <div class="premium-modal__footer">
              <button type="button" class="ds-btn ds-btn--secondary premium-secondary-btn" (click)="closeModal()">{{ 'common.cancel' | translate }}</button>
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
    .actions-row { display: flex; justify-content: flex-end; margin-bottom: var(--space-sm); flex-wrap: wrap; gap: var(--space-sm); }
    .filter-search { max-width: 280px; }
    .table-loading { padding: var(--space-md) var(--space-lg); }
    .cell-actions { text-align: end; display: flex; gap: var(--space-sm); justify-content: flex-end; flex-wrap: wrap; }
    .permission-label { flex: 1; min-width: 0; }
  `]
})
export class RolesPageComponent implements OnInit {
  private readonly api = inject(RolesApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly data = signal<PagedResult<RoleListDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  search = '';
  searchDebounce: ReturnType<typeof setTimeout> | null = null;

  readonly showModal = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly modalError = signal<string | null>(null);
  readonly permissionsList = signal<PermissionDto[]>([]);
  form: CreateRoleRequest & { permissionIds: string[] } = { name: '', description: null, permissionIds: [] };

  readonly showConfirm = signal(false);
  readonly toDelete = signal<RoleListDto | null>(null);
  deleteConfirmMessage = computed(() => {
    const r = this.toDelete();
    return r ? this.translate.instant('dialog.confirmDelete') : '';
  });

  canCreate = () => this.auth.hasPermission(PermissionCodes.role.create);
  canEdit = () => this.auth.hasPermission(PermissionCodes.role.edit);
  canDelete = () => this.auth.hasPermission(PermissionCodes.role.delete);

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.roles') }]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getPaged({ page: this.page(), pageSize: this.pageSize, search: this.search || undefined }).subscribe({
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

  onSearchChange(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => { this.page.set(1); this.load(); }, 300);
  }

  clearFilters(): void {
    this.search = '';
    this.page.set(1);
    this.load();
  }

  prevPage(): void { this.page.update(p => Math.max(1, p - 1)); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }

  openCreate(): void {
    this.editingId.set(null);
    this.form = { name: '', description: null, permissionIds: [] };
    this.modalError.set(null);
    this.api.getPermissions().subscribe({
      next: (res) => {
        if (res.success && res.data) this.permissionsList.set(res.data);
        this.showModal.set(true);
      },
    });
  }

  openEdit(r: RoleListDto): void {
    this.editingId.set(r.id);
    this.modalError.set(null);
    this.api.getById(r.id).subscribe({
      next: (res) => {
        if (!res.success || !res.data) return;
        const role = res.data as RoleDto;
        this.form = {
          name: role.name,
          description: role.description ?? null,
          permissionIds: role.permissions.map((p) => p.id),
        };
        this.api.getPermissions().subscribe({
          next: (r2) => {
            if (r2.success && r2.data) this.permissionsList.set(r2.data);
            this.showModal.set(true);
          },
        });
      },
    });
  }

  togglePermission(id: string): void {
    const ids = this.form.permissionIds;
    if (ids.includes(id)) {
      this.form.permissionIds = ids.filter((x) => x !== id);
    } else {
      this.form.permissionIds = [...ids, id];
    }
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  saveRole(): void {
    this.modalError.set(null);
    const id = this.editingId();
    const { permissionIds, ...roleBody } = this.form;
    if (id) {
      this.saving.set(true);
      this.api.update(id, roleBody).subscribe({
        next: () => {
          this.api.assignPermissions(id, { permissionIds: permissionIds ?? [] }).subscribe({
            next: () => { this.saving.set(false); this.closeModal(); this.load(); },
            error: (err) => { this.saving.set(false); this.modalError.set(err.error?.message ?? 'Error'); },
          });
        },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    } else {
      if (!this.form.name?.trim()) {
        this.modalError.set(this.translate.instant('validation.required'));
        return;
      }
      this.saving.set(true);
      this.api.create(roleBody).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.api.assignPermissions(res.data.id, { permissionIds: permissionIds ?? [] }).subscribe({
              next: () => { this.saving.set(false); this.closeModal(); this.load(); },
              error: (err) => { this.saving.set(false); this.modalError.set(err.error?.message ?? 'Error'); },
            });
          } else {
            this.saving.set(false);
            this.closeModal();
            this.load();
          }
        },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    }
  }

  confirmDelete(r: RoleListDto): void {
    this.toDelete.set(r);
    this.showConfirm.set(true);
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
    this.toDelete.set(null);
  }

  doDelete(): void {
    const r = this.toDelete();
    if (!r) return;
    this.api.delete(r.id).subscribe({
      next: () => { this.cancelDelete(); this.load(); },
      error: (err) => { this.cancelDelete(); this.error.set(err.error?.message ?? err.message ?? 'Delete failed'); }
    });
  }
}
