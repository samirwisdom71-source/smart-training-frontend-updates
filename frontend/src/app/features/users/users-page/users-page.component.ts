import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { UsersApiService } from '../../../core/api/users/users-api.service';
import { RolesApiService } from '../../../core/api/roles/roles-api.service';
import { EmployeesApiService } from '../../../core/api/employees/employees-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import type { UserDto, CreateUserRequest, UpdateUserRequest } from '../../../core/api/users/users-api.models';
import type { RoleListDto } from '../../../core/api/roles/roles-api.models';
import type { EmployeeListDto } from '../../../core/api/employees/employees-api.models';
import type { ApiResponse, PagedResult } from '../../../core/models/api-response';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, PageShellComponent, ConfirmDialogComponent],
  template: `
    <app-page-shell [title]="'nav.usersAndRoles' | translate" [breadcrumbs]="breadcrumbs()">
      <div class="actions-row" actions>
        @if (canCreate()) {
          <button type="button" class="ds-btn ds-btn--primary ds-btn--sm" (click)="openCreate()">{{ 'common.add' | translate }} {{ 'table.user' | translate }}</button>
        }
      </div>
      <div filters>
        <div class="ds-filterbar">
          <div class="ds-filterbar__controls">
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'common.search' | translate }}</div>
              <input type="text" class="ds-input filter-search ds-filterfield__control" [(ngModel)]="search" (ngModelChange)="onSearchChange()" />
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
                <th>{{ 'table.name' | translate }}</th>
                <th>{{ 'table.email' | translate }}</th>
                <th>{{ 'table.role' | translate }}</th>
                <th>{{ 'table.manager' | translate }}</th>
                <th>{{ 'table.status' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (u of data()!.items; track u.id) {
                <tr>
                  <td>
                    <div class="cell-user">
                      <span class="cell-avatar">{{ initials(u.fullName) }}</span>
                      {{ u.fullName }}
                    </div>
                  </td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.roleNames ?? '—' }}</td>
                  <td class="cell-manager">{{ u.managerName ?? '—' }}</td>
                  <td><span class="ds-badge" [class.ds-badge--success]="u.isActive" [class.ds-badge--neutral]="!u.isActive">{{ u.isActive ? ('status.active' | translate) : ('status.inactive' | translate) }}</span></td>
                  <td class="cell-actions">
                    @if (canEdit()) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon"
                        (click)="openSetManager(u)"
                        [attr.aria-label]="'users.setManager' | translate"
                        [title]="'users.setManager' | translate"
                      >
                        <svg class="icon-svg" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="none" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon"
                        (click)="openEdit(u)"
                        [attr.aria-label]="'common.edit' | translate"
                        [title]="'common.edit' | translate"
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
                        (click)="confirmDelete(u)"
                        [attr.aria-label]="'common.delete' | translate"
                        [title]="'common.delete' | translate"
                      >
                        <svg class="icon-svg" viewBox="0 0 24 24">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="none" stroke="currentColor" stroke-width="1.5"/>
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
          <h3 class="modal-drawer__title">{{ editingId() ? ('common.edit' | translate) : ('common.add' | translate) }} {{ 'table.user' | translate }}</h3>
          @if (modalError()) {
            <p class="ds-field-error">{{ modalError() }}</p>
          }
          <form (ngSubmit)="saveUser()">
            <div class="form-group">
              <label class="ds-label">{{ 'auth.email' | translate }}</label>
              <input type="email" class="ds-input" [(ngModel)]="form.email" name="email" [readonly]="!!editingId()" />
            </div>
            @if (!editingId()) {
              <div class="form-group">
                <label class="ds-label">{{ 'auth.password' | translate }}</label>
                <div class="input-with-toggle">
                  <input [type]="showPassword() ? 'text' : 'password'" class="ds-input" [(ngModel)]="form.password" name="password" />
                  <button type="button" class="ds-btn ds-btn--ghost ds-btn--icon input-toggle-btn" (click)="showPassword.set(!showPassword())" [attr.aria-label]="(showPassword() ? 'auth.hidePassword' : 'auth.showPassword') | translate" [title]="(showPassword() ? 'auth.hidePassword' : 'auth.showPassword') | translate">
                    @if (showPassword()) {
                      <svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 7a5 5 0 0 1 5 5c0 1.5-.7 2.8-1.8 3.6L17 17H7l1.8-1.4A5 5 0 0 1 12 7Zm0 2a3 3 0 0 0-3 3c0 .9.4 1.6 1 2.1V14h4v-1c.6-.5 1-1.2 1-2.1a3 3 0 0 0-3-3Z" fill="currentColor"/></svg>
                    } @else {
                      <svg class="icon-svg" viewBox="0 0 24 24"><path d="M4 12c0-1.5.7-2.8 1.8-3.6L4 5v2a8 8 0 0 0 8 8h2l-1.8-1.4A5 5 0 0 1 7 12H4Zm16 0c0 1.5-.7 2.8-1.8 3.6L20 19v-2a8 8 0 0 0-8-8h-2l1.8 1.4A5 5 0 0 1 17 12h3Z" fill="currentColor"/></svg>
                    }
                  </button>
                </div>
              </div>
            }
            <div class="form-group">
              <label class="ds-label">{{ 'profile.fullName' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="form.fullName" name="fullName" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'users.roles' | translate }}</label>
              <div class="roles-checkbox-list">
                @for (r of roleOptions(); track r.id) {
                  <label class="checkbox-row">
                    <input type="checkbox" [checked]="isRoleSelected(r.id)" (change)="toggleRole(r.id)" />
                    <span>{{ getRoleLabel(r.name) }}</span>
                  </label>
                }
                @if (roleOptions().length === 0) {
                  <p class="ds-hint">{{ 'common.noData' | translate }}</p>
                }
              </div>
            </div>
            @if (editingId()) {
              <label class="checkbox-wrap">
                <input type="checkbox" [(ngModel)]="form.isActive" name="isActive" />
                <span>{{ 'status.active' | translate }}</span>
              </label>
            }
            <div class="modal-drawer__actions">
              <button type="button" class="ds-btn ds-btn--secondary" (click)="closeModal()">{{ 'common.cancel' | translate }}</button>
              <button type="submit" class="ds-btn ds-btn--primary" [disabled]="saving()">{{ saving() ? ('common.loading' | translate) : ('common.save' | translate) }}</button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (showManagerModal()) {
      <div class="modal-overlay" (click)="closeManagerModal()">
        <div class="modal-drawer ds-card modal-drawer--sm" (click)="$event.stopPropagation()">
          <h3 class="modal-drawer__title">{{ 'users.setManager' | translate }}</h3>
          <p class="modal-drawer__subtitle">{{ userForManager()?.fullName }}</p>
          @if (managerModalError()) {
            <p class="ds-field-error">{{ managerModalError() }}</p>
          }
          <div class="form-group">
            <label class="ds-label">{{ 'table.manager' | translate }}</label>
            <select class="ds-input" [(ngModel)]="selectedManagerUserId" name="selectedManagerUserId">
              <option [ngValue]="null">—</option>
              @for (emp of managerEmployeeOptions(); track emp.id) {
                @if (emp.userId && emp.userId !== userForManager()?.id) {
                  <option [ngValue]="emp.userId">{{ emp.fullNameEn }} ({{ emp.employeeNumber }})</option>
                }
              }
            </select>
          </div>
          <div class="modal-drawer__actions">
            <button type="button" class="ds-btn ds-btn--secondary" (click)="closeManagerModal()">{{ 'common.cancel' | translate }}</button>
            <button type="button" class="ds-btn ds-btn--primary" (click)="saveManager()" [disabled]="savingManager()">{{ savingManager() ? ('common.loading' | translate) : ('common.save' | translate) }}</button>
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
    .table-loading { padding: var(--space-md) 0; }
    .cell-user { display: flex; align-items: center; gap: var(--space-sm); }
    .cell-avatar { width: 28px; height: 28px; border-radius: var(--radius-full); background: var(--color-primary-muted); color: var(--color-primary); font-size: var(--text-caption); font-weight: 600; display: inline-flex; align-items: center; justify-content: center; }
    .cell-actions { text-align: end; }
    .pagination { display: flex; align-items: center; gap: var(--space-md); margin-top: var(--space-lg); flex-wrap: wrap; }
    .pagination-info { font-size: var(--text-body-sm); color: var(--color-text-secondary); }
    .modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; padding: var(--space-lg); }
    .modal-drawer { max-width: 440px; width: 100%; max-height: 90vh; overflow: auto; }
    .modal-drawer--sm { max-width: 380px; }
    .modal-drawer__title { font-size: var(--text-h1); font-weight: 600; margin: 0 0 var(--space-md); }
    .modal-drawer__subtitle { font-size: var(--text-body-sm); color: var(--color-text-secondary); margin: 0 0 var(--space-md); }
    .modal-drawer form .form-group { margin-bottom: var(--space-md); }
    .checkbox-wrap { display: flex; align-items: center; gap: var(--space-sm); font-size: var(--text-body-sm); cursor: pointer; margin-bottom: var(--space-md); }
    .modal-drawer__actions { display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-lg); }
    .input-with-toggle { display: flex; gap: var(--space-xs); align-items: center; }
    .input-with-toggle .ds-input { flex: 1; }
    .input-toggle-btn { flex-shrink: 0; }
    .ds-hint { font-size: var(--text-body-sm); color: var(--color-text-secondary); margin: var(--space-xs) 0 0; }
    .roles-checkbox-list { max-height: 220px; overflow-y: auto; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-sm); background: var(--color-bg); }
    .checkbox-row { display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-xs) 0; cursor: pointer; font-size: var(--text-body-sm); }
    .checkbox-row input { width: 18px; height: 18px; accent-color: var(--color-primary); }
  `]
})
export class UsersPageComponent implements OnInit {
  private readonly api = inject(UsersApiService);
  private readonly rolesApi = inject(RolesApiService);
  private readonly employeesApi = inject(EmployeesApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly data = signal<PagedResult<UserDto> | null>(null);
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
  readonly showPassword = signal(false);
  readonly roleOptions = signal<RoleListDto[]>([]);

  readonly showManagerModal = signal(false);
  readonly userForManager = signal<UserDto | null>(null);
  readonly managerEmployeeOptions = signal<EmployeeListDto[]>([]);
  readonly managerModalError = signal<string | null>(null);
  readonly savingManager = signal(false);
  selectedManagerUserId: string | null = null;

  readonly showConfirm = signal(false);
  readonly toDelete = signal<UserDto | null>(null);
  deleteConfirmMessage = computed(() => {
    const u = this.toDelete();
    return u ? this.translate.instant('users.deleteConfirm', { name: u.fullName || u.email }) : '';
  });

  form: CreateUserRequest & { password?: string; isActive?: boolean; roleIds?: string[] } = {
    email: '',
    password: '',
    fullName: '',
    isActive: true,
    roleIds: []
  };

  canCreate = () => this.auth.hasPermission(PermissionCodes.user.create);
  canEdit = () => this.auth.hasPermission(PermissionCodes.user.edit);
  canDelete = () => this.auth.hasPermission(PermissionCodes.user.delete);

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.usersAndRoles') }]);

  ngOnInit(): void {
    this.load();
    this.loadRoles();
  }

  loadRoles(): void {
    this.rolesApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => { if (res.success && res.data) this.roleOptions.set(res.data.items); }
    });
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

  initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase() || '—';
  }

  getRoleLabel(roleName: string): string {
    const key = 'roles.' + roleName;
    const t = this.translate.instant(key);
    return t !== key ? t : roleName;
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form = { email: '', password: '', fullName: '', isActive: true, roleIds: [] };
    this.showPassword.set(false);
    this.modalError.set(null);
    this.showModal.set(true);
  }

  openEdit(u: UserDto): void {
    this.editingId.set(u.id);
    this.api.getById(u.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const d = res.data;
          this.form = {
            email: d.email,
            password: '',
            fullName: d.fullName,
            profilePicturePath: d.profilePicturePath,
            isActive: d.isActive,
            preferredLocale: d.preferredLocale ?? null,
            roleIds: d.roleIds ? [...d.roleIds] : []
          };
        }
      }
    });
    this.modalError.set(null);
    this.showModal.set(true);
  }

  isRoleSelected(roleId: string): boolean {
    return (this.form.roleIds ?? []).includes(roleId);
  }

  toggleRole(roleId: string): void {
    const ids = this.form.roleIds ?? [];
    const idx = ids.indexOf(roleId);
    if (idx === -1) this.form.roleIds = [...ids, roleId];
    else this.form.roleIds = ids.filter(id => id !== roleId);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  openSetManager(u: UserDto): void {
    this.userForManager.set(u);
    this.selectedManagerUserId = null;
    this.managerModalError.set(null);
    this.showManagerModal.set(true);
    this.employeesApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => { if (res.success && res.data) this.managerEmployeeOptions.set(res.data.items); }
    });
  }

  closeManagerModal(): void {
    this.showManagerModal.set(false);
    this.userForManager.set(null);
    this.managerEmployeeOptions.set([]);
    this.managerModalError.set(null);
  }

  saveManager(): void {
    const user = this.userForManager();
    if (!user) return;
    this.managerModalError.set(null);
    this.savingManager.set(true);
    this.api.setManager(user.id, this.selectedManagerUserId).subscribe({
      next: () => { this.savingManager.set(false); this.closeManagerModal(); this.load(); },
      error: (err) => {
        this.savingManager.set(false);
        this.managerModalError.set(err.error?.errors?.[0] ?? err.error?.message ?? err.message ?? 'Error');
      }
    });
  }

  confirmDelete(u: UserDto): void {
    this.toDelete.set(u);
    this.showConfirm.set(true);
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
    this.toDelete.set(null);
  }

  doDelete(): void {
    const u = this.toDelete();
    if (!u) return;
    this.api.delete(u.id).subscribe({
      next: () => { this.cancelDelete(); this.load(); },
      error: (err) => { this.cancelDelete(); this.error.set(err.error?.message ?? err.message ?? 'Delete failed'); }
    });
  }

  saveUser(): void {
    this.modalError.set(null);
    const id = this.editingId();
    if (id) {
      this.saving.set(true);
      this.api.update(id, {
        fullName: this.form.fullName,
        profilePicturePath: this.form.profilePicturePath ?? null,
        isActive: this.form.isActive ?? true,
        preferredLocale: this.form.preferredLocale ?? null,
        roleIds: this.form.roleIds ?? []
      }).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? err.message ?? 'Error'); }
      });
    } else {
      if (!this.form.email || !this.form.fullName) {
        this.modalError.set(this.translate.instant('validation.required'));
        return;
      }
      if (!this.form.password) {
        this.modalError.set(this.translate.instant('validation.required'));
        return;
      }
      this.saving.set(true);
      this.api.create({
        email: this.form.email,
        password: this.form.password,
        fullName: this.form.fullName,
        isActive: this.form.isActive ?? true,
        roleIds: this.form.roleIds ?? []
      }).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? err.message ?? 'Error'); }
      });
    }
  }
}
