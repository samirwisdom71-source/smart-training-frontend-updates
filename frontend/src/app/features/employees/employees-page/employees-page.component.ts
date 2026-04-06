import { ChangeDetectorRef, Component, DestroyRef, inject, signal, computed, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { EmployeesApiService } from '../../../core/api/employees/employees-api.service';
import { PositionsApiService } from '../../../core/api/positions/positions-api.service';
import { JobsApiService } from '../../../core/api/jobs/jobs-api.service';
import { OrganizationsApiService } from '../../../core/api/organizations/organizations-api.service';
import { OrganizationalUnitsApiService } from '../../../core/api/organizational-units/organizational-units-api.service';
import { RolesApiService } from '../../../core/api/roles/roles-api.service';
import type { RoleListDto } from '../../../core/api/roles/roles-api.models';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import type { EmployeeListDto, CreateEmployeeRequest, UpdateEmployeeRequest } from '../../../core/api/employees/employees-api.models';
import type { PositionListDto } from '../../../core/api/positions/positions-api.models';
import type { JobListDto } from '../../../core/api/jobs/jobs-api.models';
import type { OrganizationalUnitListDto } from '../../../core/api/organizational-units/organizational-units-api.models';
import type { PagedResult } from '../../../core/models/api-response';

@Component({
  selector: 'app-employees-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, PageShellComponent, ConfirmDialogComponent],
  template: `
    <app-page-shell [title]="'nav.employees' | translate" [breadcrumbs]="breadcrumbs()">
      <div class="actions-row" actions>
        @if (canCreate()) {
          <button type="button" class="ds-btn ds-btn--primary ds-btn--sm" (click)="openCreate()">{{ 'common.add' | translate }} {{ 'table.employee' | translate }}</button>
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
              <div class="ds-filterfield__label">{{ 'table.organizationalUnit' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="organizationalUnitIdFilter" (ngModelChange)="onFilterChange()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                @for (ou of ouOptions(); track ou.id) {
                  <option [ngValue]="ou.id">{{ getLocalizedText(ou.nameAr, ou.nameEn) }}</option>
                }
              </select>
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'table.job' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="jobIdFilter" (ngModelChange)="onFilterChange()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                @for (j of jobOptions(); track j.id) {
                  <option [ngValue]="j.id">{{ getLocalizedText(j.titleAr, j.titleEn) }}</option>
                }
              </select>
            </div>
            <div class="ds-filterfield">
              <div class="ds-filterfield__label">{{ 'table.status' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()">
                <option value="">{{ 'common.all' | translate }}</option>
                <option value="Active">{{ 'status.active' | translate }}</option>
                <option value="Inactive">{{ 'status.inactive' | translate }}</option>
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
                <th>{{ 'table.employeeNumber' | translate }}</th>
                <th>{{ 'table.name' | translate }}</th>
                <th>{{ 'table.email' | translate }}</th>
                <th>{{ 'table.status' | translate }}</th>
                <th>{{ 'table.jobTitle' | translate }}</th>
                <th>{{ 'table.organizationalUnit' | translate }}</th>
                <th>{{ 'table.manager' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (e of data()!.items; track e.id) {
                <tr>
                  <td>{{ e.employeeNumber }}</td>
                  <td>{{ getEmployeeDisplayName(e) }}</td>
                  <td>{{ e.email ?? '—' }}</td>
                  <td><span class="ds-badge" [class.ds-badge--success]="e.status === 'Active'" [class.ds-badge--neutral]="e.status !== 'Active'">{{ e.status === 'Active' ? ('status.active' | translate) : e.status === 'Inactive' ? ('status.inactive' | translate) : e.status }}</span></td>
                  <td>{{ getLocalizedText(e.jobTitleAr, e.jobTitleEn) }}</td>
                  <td>{{ getLocalizedOuName(e.organizationalUnitId, e.organizationalUnitNameAr, e.organizationalUnitNameEn) }}</td>
                  <td>{{ getLocalizedText(e.managerNameAr, e.managerNameEn) }}</td>
                  <td class="cell-actions">
                    @if (canEdit()) {
                      <button
                        type="button"
                        class="ds-btn ds-btn--ghost ds-btn--icon"
                        (click)="openEdit(e)"
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
                        [class.status-toggle-btn--active]="e.status === 'Active'"
                        (click)="setStatus(e)"
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
                        (click)="confirmDelete(e)"
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
        <div class="modal-drawer ds-card modal-drawer--wide" (click)="$event.stopPropagation()">
          <h3 class="modal-drawer__title">{{ editingId() ? ('common.edit' | translate) : ('common.add' | translate) }} {{ 'table.employee' | translate }}</h3>
          @if (modalError()) {
            <p class="ds-field-error">{{ modalError() }}</p>
          }
          <form (ngSubmit)="save()">
            <div class="form-group">
              <label class="ds-label">{{ 'table.employeeNumber' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="form.employeeNumber" name="employeeNumber" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.fullNameEn' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="form.fullNameEn" name="fullNameEn" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.fullNameAr' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="form.fullNameAr" name="fullNameAr" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.email' | translate }}</label>
              <input type="email" class="ds-input" [(ngModel)]="form.email" name="email" [required]="!editingId()" />
            </div>
            @if (!editingId()) {
              <div class="form-group">
                <label class="ds-label">{{ 'auth.password' | translate }}</label>
                <div class="input-with-toggle">
                  <input [type]="showPassword() ? 'text' : 'password'" class="ds-input" [(ngModel)]="form.password" name="password" required />
                  <button type="button" class="ds-btn ds-btn--ghost ds-btn--icon input-toggle-btn" (click)="showPassword.set(!showPassword())" [attr.aria-label]="(showPassword() ? 'auth.hidePassword' : 'auth.showPassword') | translate">
                    @if (showPassword()) {
                      <svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 7a5 5 0 0 1 5 5c0 1.5-.7 2.8-1.8 3.6L17 17H7l1.8-1.4A5 5 0 0 1 12 7Zm0 2a3 3 0 0 0-3 3c0 .9.4 1.6 1 2.1V14h4v-1c.6-.5 1-1.2 1-2.1a3 3 0 0 0-3-3Z" fill="currentColor"/></svg>
                    } @else {
                      <svg class="icon-svg" viewBox="0 0 24 24"><path d="M4 12c0-1.5.7-2.8 1.8-3.6L4 5v2a8 8 0 0 0 8 8h2l-1.8-1.4A5 5 0 0 1 7 12H4Zm16 0c0 1.5-.7 2.8-1.8 3.6L20 19v-2a8 8 0 0 0-8-8h-2l1.8 1.4A5 5 0 0 1 17 12h3Z" fill="currentColor"/></svg>
                    }
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label class="ds-label">{{ 'users.roles' | translate }}</label>
                  <select class="ds-input" [(ngModel)]="form.userRoleId" name="userRoleId">
                    <option [ngValue]="null">—</option>
                    @for (r of roleOptions(); track r.id) {
                      <option [ngValue]="r.id">{{ getRoleLabel(r.name) }}</option>
                    }
                  </select>
              </div>
            }
            <div class="form-group">
              <label class="ds-label">{{ 'table.phone' | translate }}</label>
              <input type="text" class="ds-input" [(ngModel)]="form.phone" name="phone" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.hireDate' | translate }}</label>
              <input type="date" class="ds-input" [(ngModel)]="form.hireDate" name="hireDate" />
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.position' | translate }}</label>
              <select class="ds-input" [(ngModel)]="form.positionId" name="positionId">
                <option [ngValue]="null">—</option>
                @for (p of positionOptions(); track p.id) {
                  <option [ngValue]="p.id">{{ p.code }} ({{ p.jobTitleEn }})</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.organizationalUnit' | translate }}</label>
              <select class="ds-input" [(ngModel)]="form.organizationalUnitId" name="organizationalUnitId" (ngModelChange)="onFormOrganizationalUnitChange($event)">
                <option [ngValue]="null">—</option>
                @for (ou of ouOptions(); track ou.id) {
                  <option [ngValue]="ou.id">{{ getLocalizedText(ou.nameAr, ou.nameEn) }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.job' | translate }}</label>
              <p class="ds-hint" aria-hidden="true">{{ 'employees.jobHint' | translate }}</p>
              <select class="ds-input" [(ngModel)]="form.jobId" name="jobId" [disabled]="!form.organizationalUnitId">
                <option [ngValue]="null">—</option>
                @for (j of getJobOptionsForForm(); track j.id) {
                  <option [ngValue]="j.id">{{ getLocalizedText(j.titleAr, j.titleEn) }} ({{ j.code }})</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="ds-label">{{ 'table.manager' | translate }}</label>
              <select class="ds-input" [(ngModel)]="form.managerEmployeeId" name="managerEmployeeId">
                <option [ngValue]="null">—</option>
                @for (emp of employeeOptions(); track emp.id) {
                  @if (emp.id !== editingId()) {
                    <option [ngValue]="emp.id">{{ getLocalizedText(emp.fullNameAr, emp.fullNameEn) }} ({{ emp.employeeNumber }})</option>
                  }
                }
              </select>
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
    .modal-drawer--wide { max-width: 520px; }
    .modal-drawer__title { font-size: var(--text-h1); font-weight: 600; margin: 0 0 var(--space-md); }
    .modal-drawer form .form-group { margin-bottom: var(--space-md); }
    .ds-hint { font-size: var(--text-body-sm, 0.875rem); color: var(--color-text-secondary, #64748b); margin: 0 0 var(--space-xs); }
    .modal-drawer__actions { display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-lg); }
    .input-with-toggle { display: flex; gap: var(--space-xs); align-items: center; }
    .input-with-toggle .ds-input { flex: 1; }
    .input-toggle-btn { flex-shrink: 0; }
  `]
})
export class EmployeesPageComponent implements OnInit {
  private readonly api = inject(EmployeesApiService);
  private readonly positionApi = inject(PositionsApiService);
  private readonly jobApi = inject(JobsApiService);
  private readonly orgApi = inject(OrganizationsApiService);
  private readonly ouApi = inject(OrganizationalUnitsApiService);
  private readonly rolesApi = inject(RolesApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly data = signal<PagedResult<EmployeeListDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  search = '';
  organizationalUnitIdFilter: string | null = null;
  jobIdFilter: string | null = null;
  statusFilter = '';
  searchDebounce: ReturnType<typeof setTimeout> | null = null;

  readonly positionOptions = signal<PositionListDto[]>([]);
  readonly jobOptions = signal<JobListDto[]>([]);
  readonly ouOptions = signal<OrganizationalUnitListDto[]>([]);
  readonly employeeOptions = signal<EmployeeListDto[]>([]);
  readonly roleOptions = signal<RoleListDto[]>([]);
  readonly showPassword = signal(false);

  readonly showModal = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly modalError = signal<string | null>(null);
  readonly showConfirm = signal(false);
  readonly toDelete = signal<EmployeeListDto | null>(null);

  form: CreateEmployeeRequest & { password?: string | null; userRoleId?: string | null } = {
    employeeNumber: '',
    fullNameEn: '',
    fullNameAr: '',
    email: null,
    phone: null,
    hireDate: null,
    positionId: null,
    jobId: null,
    organizationalUnitId: null,
    managerEmployeeId: null,
    password: null,
    userRoleId: null,
  };

  canCreate = () => this.auth.hasPermission(PermissionCodes.employee.create);
  canEdit = () => this.auth.hasPermission(PermissionCodes.employee.edit);
  canDelete = () => this.auth.hasPermission(PermissionCodes.employee.delete);

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.employees') }]);
  deleteConfirmMessage = computed(() => this.translate.instant('dialog.confirmDelete'));

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
    this.loadPositionOptions();
    this.loadJobOptions();
    this.loadOuOptions();
    this.loadEmployeeOptions();
    this.loadRoles();
    this.load();
  }

  loadRoles(): void {
    this.rolesApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.roleOptions.set(res.data.items);
        }
      }
    });
  }

  loadPositionOptions(): void {
    this.positionApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.positionOptions.set(res.data.items);
      },
    });
  }

  loadJobOptions(): void {
    this.jobApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.jobOptions.set(res.data.items);
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

  loadEmployeeOptions(): void {
    this.api.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.employeeOptions.set(res.data.items);
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
      jobId: this.jobIdFilter ?? undefined,
      status: this.statusFilter || undefined,
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
    this.jobIdFilter = null;
    this.statusFilter = '';
    this.page.set(1);
    this.load();
  }

  getJobOptionsForForm(): JobListDto[] {
    const ouId = this.form.organizationalUnitId;
    if (!ouId) return [];
    return this.jobOptions().filter(j => j.organizationalUnitId === ouId);
  }

  onFormOrganizationalUnitChange(ouId: string | null): void {
    if (!ouId || !this.form.jobId) return;
    const selectedJob = this.jobOptions().find(j => j.id === this.form.jobId);
    if (selectedJob && selectedJob.organizationalUnitId !== ouId) this.form = { ...this.form, jobId: null };
  }

  getEmployeeDisplayName(e: EmployeeListDto): string {
    return this.getLocalizedText(e.fullNameAr, e.fullNameEn);
  }

  getRoleLabel(roleName: string): string {
    const key = 'roles.' + roleName;
    const t = this.translate.instant(key);
    return t !== key ? t : roleName;
  }

  getLocalizedText(ar?: string | null, en?: string | null): string {
    const currentLang = (this.translate.currentLang || this.translate.getDefaultLang() || 'en').toLowerCase();
    const prefersArabic = currentLang.startsWith('ar');
    const arText = ar?.trim() ?? '';
    const enText = en?.trim() ?? '';
    if (prefersArabic) return arText || enText || '—';
    return enText || arText || '—';
  }

  getLocalizedOuName(ouId?: string | null, fallbackAr?: string | null, fallbackEn?: string | null): string {
    const ou = ouId ? this.ouOptions().find(x => x.id === ouId) : null;
    if (ou) return this.getLocalizedText(ou.nameAr, ou.nameEn);
    return this.getLocalizedText(fallbackAr, fallbackEn);
  }

  prevPage(): void { this.page.update(p => Math.max(1, p - 1)); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }

  openCreate(): void {
    this.editingId.set(null);
    const roles = this.roleOptions();
    const employeeRole = roles.find(r => r.name === 'Employee');
    this.form = {
      employeeNumber: '',
      fullNameEn: '',
      fullNameAr: '',
      email: null,
      phone: null,
      hireDate: null,
      positionId: null,
      jobId: null,
      organizationalUnitId: null,
      managerEmployeeId: null,
      password: null,
      userRoleId: employeeRole?.id ?? null,
    };
    this.showPassword.set(false);
    this.modalError.set(null);
    this.showModal.set(true);
  }

  openEdit(e: EmployeeListDto): void {
    this.editingId.set(e.id);
    this.api.getById(e.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const d = res.data;
          this.form = {
            employeeNumber: d.employeeNumber,
            fullNameEn: d.fullNameEn,
            fullNameAr: d.fullNameAr,
            email: d.email ?? null,
            phone: d.phone ?? null,
            hireDate: d.hireDate ?? null,
            positionId: d.positionId ?? null,
            jobId: d.jobId ?? null,
            organizationalUnitId: d.organizationalUnitId ?? null,
            managerEmployeeId: d.managerEmployeeId ?? null,
          };
        }
      },
    });
    this.modalError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  save(): void {
    this.modalError.set(null);
    const id = this.editingId();
    const payload: CreateEmployeeRequest | UpdateEmployeeRequest = {
      employeeNumber: this.form.employeeNumber,
      fullNameEn: this.form.fullNameEn,
      fullNameAr: this.form.fullNameAr,
      email: this.form.email ?? null,
      phone: this.form.phone ?? null,
      hireDate: this.form.hireDate ?? null,
      positionId: this.form.positionId ?? null,
      jobId: this.form.jobId ?? null,
      organizationalUnitId: this.form.organizationalUnitId ?? null,
      managerEmployeeId: this.form.managerEmployeeId ?? null,
    };
    if (!id && this.form.email && this.form.password) {
      (payload as CreateEmployeeRequest).password = this.form.password;
      (payload as CreateEmployeeRequest).userRoleIds = this.form.userRoleId ? [this.form.userRoleId] : [];
    }
    if (id) {
      this.saving.set(true);
      this.api.update(id, payload as UpdateEmployeeRequest).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); this.loadEmployeeOptions(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    } else {
      if (!this.form.employeeNumber?.trim() || !this.form.fullNameEn?.trim() || !this.form.fullNameAr?.trim()) {
        this.modalError.set(this.translate.instant('validation.required'));
        return;
      }
      if (!this.form.email?.trim() || !this.form.password?.trim()) {
        this.modalError.set(this.translate.instant('employees.emailPasswordRequired'));
        return;
      }
      this.saving.set(true);
      this.api.create(payload as CreateEmployeeRequest).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); this.loadEmployeeOptions(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    }
  }

  setStatus(e: EmployeeListDto): void {
    const newStatus = e.status === 'Active' ? 'Inactive' : 'Active';
    this.api.setStatus(e.id, { status: newStatus }).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err.error?.message ?? err.message ?? 'Failed to set status'),
    });
  }

  confirmDelete(e: EmployeeListDto): void {
    this.toDelete.set(e);
    this.showConfirm.set(true);
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
    this.toDelete.set(null);
  }

  doDelete(): void {
    const target = this.toDelete();
    if (!target) return;
    this.showConfirm.set(false);
    this.api.delete(target.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.load();
          this.loadEmployeeOptions();
        } else {
          this.error.set(res.message ?? 'Failed to delete');
        }
        this.toDelete.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message ?? 'Failed to delete');
        this.toDelete.set(null);
      },
    });
  }
}
