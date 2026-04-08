import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { RolesApiService } from '../../../core/api/roles/roles-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import type { RoleListDto, RoleDto, CreateRoleRequest, PermissionDto } from '../../../core/api/roles/roles-api.models';
import type { PagedResult } from '../../../core/models/api-response';

@Component({
  selector: 'app-roles-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, PageShellComponent, ConfirmDialogComponent, TooltipDirective, PaginationComponent],
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
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"> 
                        <g clip-path="url(#clip0_4418_7276)"> <path d="M15 22.75H9C3.57 22.75 1.25 20.43 1.25 15V9C1.25 3.57 3.57 1.25 9 1.25H11C11.41 1.25 11.75 1.59 11.75 2C11.75 2.41 11.41 2.75 11 2.75H9C4.39 2.75 2.75 4.39 2.75 9V15C2.75 19.61 4.39 21.25 9 21.25H15C19.61 21.25 21.25 19.61 21.25 15V13C21.25 12.59 21.59 12.25 22 12.25C22.41 12.25 22.75 12.59 22.75 13V15C22.75 20.43 20.43 22.75 15 22.75Z" fill="white" style="fill: var(--fillg);"/> <path d="M8.50008 17.6905C7.89008 17.6905 7.33008 17.4705 6.92008 17.0705C6.43008 16.5805 6.22008 15.8705 6.33008 15.1205L6.76008 12.1105C6.84008 11.5305 7.22008 10.7805 7.63008 10.3705L15.5101 2.49055C17.5001 0.500547 19.5201 0.500547 21.5101 2.49055C22.6001 3.58055 23.0901 4.69055 22.9901 5.80055C22.9001 6.70055 22.4201 7.58055 21.5101 8.48055L13.6301 16.3605C13.2201 16.7705 12.4701 17.1505 11.8901 17.2305L8.88008 17.6605C8.75008 17.6905 8.62008 17.6905 8.50008 17.6905ZM16.5701 3.55055L8.69008 11.4305C8.50008 11.6205 8.28008 12.0605 8.24008 12.3205L7.81008 15.3305C7.77008 15.6205 7.83008 15.8605 7.98008 16.0105C8.13008 16.1605 8.37008 16.2205 8.66008 16.1805L11.6701 15.7505C11.9301 15.7105 12.3801 15.4905 12.5601 15.3005L20.4401 7.42055C21.0901 6.77055 21.4301 6.19055 21.4801 5.65055C21.5401 5.00055 21.2001 4.31055 20.4401 3.54055C18.8401 1.94055 17.7401 2.39055 16.5701 3.55055Z" fill="white" style="fill: var(--fillg);"/> <path d="M19.8501 9.83027C19.7801 9.83027 19.7101 9.82027 19.6501 9.80027C17.0201 9.06027 14.9301 6.97027 14.1901 4.34027C14.0801 3.94027 14.3101 3.53027 14.7101 3.41027C15.1101 3.30027 15.5201 3.53027 15.6301 3.93027C16.2301 6.06027 17.9201 7.75027 20.0501 8.35027C20.4501 8.46027 20.6801 8.88027 20.5701 9.28027C20.4801 9.62027 20.1801 9.83027 19.8501 9.83027Z" fill="white" style="fill: var(--fillg);"/> </g> <defs> <clipPath id="clip0_4418_7276"> <rect width="24" height="24" fill="white"/> </clipPath> </defs> </svg>
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#b52828">
                        <g clip-path="url(#clip0_4418_7385)">
                        <path d="M20.9999 6.73046C20.9799 6.73046 20.9499 6.73046 20.9199 6.73046C15.6299 6.20046 10.3499 6.00046 5.11992 6.53046L3.07992 6.73046C2.65992 6.77046 2.28992 6.47046 2.24992 6.05046C2.20992 5.63046 2.50992 5.27046 2.91992 5.23046L4.95992 5.03046C10.2799 4.49046 15.6699 4.70046 21.0699 5.23046C21.4799 5.27046 21.7799 5.64046 21.7399 6.05046C21.7099 6.44046 21.3799 6.73046 20.9999 6.73046Z" fill="white" style="fill: var(--fillg);"/>
                        <path d="M8.50001 5.72C8.46001 5.72 8.42001 5.72 8.37001 5.71C7.97001 5.64 7.69001 5.25 7.76001 4.85L7.98001 3.54C8.14001 2.58 8.36001 1.25 10.69 1.25H13.31C15.65 1.25 15.87 2.63 16.02 3.55L16.24 4.85C16.31 5.26 16.03 5.65 15.63 5.71C15.22 5.78 14.83 5.5 14.77 5.1L14.55 3.8C14.41 2.93 14.38 2.76 13.32 2.76H10.7C9.64001 2.76 9.62001 2.9 9.47001 3.79L9.24001 5.09C9.18001 5.46 8.86001 5.72 8.50001 5.72Z" fill="white" style="fill: var(--fillg);"/>
                        <path d="M15.2099 22.7496H8.7899C5.2999 22.7496 5.1599 20.8196 5.0499 19.2596L4.3999 9.18959C4.3699 8.77959 4.6899 8.41959 5.0999 8.38959C5.5199 8.36959 5.8699 8.67959 5.8999 9.08959L6.5499 19.1596C6.6599 20.6796 6.6999 21.2496 8.7899 21.2496H15.2099C17.3099 21.2496 17.3499 20.6796 17.4499 19.1596L18.0999 9.08959C18.1299 8.67959 18.4899 8.36959 18.8999 8.38959C19.3099 8.41959 19.6299 8.76959 19.5999 9.18959L18.9499 19.2596C18.8399 20.8196 18.6999 22.7496 15.2099 22.7496Z" fill="white" style="fill: var(--fillg);"/>
                        <path d="M13.6601 17.25H10.3301C9.92008 17.25 9.58008 16.91 9.58008 16.5C9.58008 16.09 9.92008 15.75 10.3301 15.75H13.6601C14.0701 15.75 14.4101 16.09 14.4101 16.5C14.4101 16.91 14.0701 17.25 13.6601 17.25Z" fill="white" style="fill: var(--fillg);"/>
                        <path d="M14.5 13.25H9.5C9.09 13.25 8.75 12.91 8.75 12.5C8.75 12.09 9.09 11.75 9.5 11.75H14.5C14.91 11.75 15.25 12.09 15.25 12.5C15.25 12.91 14.91 13.25 14.5 13.25Z" fill="white" style="fill: var(--fillg);"/>
                        </g>
                        <defs>
                        <clipPath id="clip0_4418_7385">
                        <rect width="24" height="24" fill="white"/>
                        </clipPath>
                        </defs>
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
    .cell-actions { text-align: center; display: flex; gap: var(--space-sm); justify-content:center; flex-wrap: nowrap; align-items: center; }
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
  setPage(p: number): void { this.page.set(p); this.load(); }

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
