import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { PortalToBodyDirective } from '../../../shared/portal/portal-to-body.directive';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { TrainingNeedsApiService } from '../../../core/api/training-needs/training-needs-api.service';
import { AssessmentsApiService } from '../../../core/api/assessments/assessments-api.service';
import { OrganizationsApiService } from '../../../core/api/organizations/organizations-api.service';
import { OrganizationalUnitsApiService } from '../../../core/api/organizational-units/organizational-units-api.service';
import { JobsApiService } from '../../../core/api/jobs/jobs-api.service';
import { EmployeesApiService } from '../../../core/api/employees/employees-api.service';
import { TrainingPlansApiService } from '../../../core/api/training-plans/training-plans-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import type { TrainingNeedListDto, TrainingNeedDto, CreateTrainingNeedRequest, UpdateTrainingNeedRequest } from '../../../core/api/training-needs/training-needs-api.models';
import type { CompetencyGapListDto } from '../../../core/api/assessments/assessments-api.models';
import type { PagedResult } from '../../../core/models/api-response';
import { ToastService } from '../../../core/toast/toast.service';
import {
  DataViewPreferenceService,
  DataViewToggleComponent,
  LuxActionIconComponent,
  LuxDataCardComponent,
  LuxDataCardGridComponent,
} from '../../../shared/data-view';

@Component({
  selector: 'app-training-needs-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    PageShellComponent,
    ConfirmDialogComponent,
    PortalToBodyDirective,
    TooltipDirective,
    PaginationComponent,
    DataViewToggleComponent,
    LuxDataCardComponent,
    LuxDataCardGridComponent,
    LuxActionIconComponent,
  ],
  templateUrl: './training-needs-page.component.html',
  styleUrls: ['./training-needs-page.component.scss'],
})
export class TrainingNeedsPageComponent implements OnInit {
  private readonly api = inject(TrainingNeedsApiService);
  private readonly gapsApi = inject(AssessmentsApiService);
  private readonly orgApi = inject(OrganizationsApiService);
  private readonly ouApi = inject(OrganizationalUnitsApiService);
  private readonly jobsApi = inject(JobsApiService);
  private readonly employeesApi = inject(EmployeesApiService);
  private readonly plansApi = inject(TrainingPlansApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);
  readonly dataViewPref = inject(DataViewPreferenceService);

  readonly data = signal<PagedResult<TrainingNeedListDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  search = '';
  employeeIdFilter: string | null = null;
  jobIdFilter: string | null = null;
  organizationalUnitIdFilter: string | null = null;
  statusFilter: string | null = null;
  sourceTypeFilter: string | null = null;

  readonly orgOptions = signal<{ id: string; nameEn: string }[]>([]);
  readonly ouOptions = signal<{ id: string; nameEn: string; nameAr?: string | null }[]>([]);
  readonly jobOptions = signal<{ id: string; titleEn: string; titleAr: string }[]>([]);
  readonly employeeOptions = signal<{ id: string; fullNameEn: string; fullNameAr: string }[]>([]);
  /** Child OUs under the selected unit (shown as "departments" in the modal). */
  readonly modalDepartmentOptions = signal<{ id: string; nameEn: string; nameAr?: string | null }[]>([]);
  readonly modalAllDepartments = signal(true);
  readonly modalSelectedDepartmentIds = signal<Set<string>>(new Set());
  readonly modalEmployeeOptions = signal<{ id: string; fullNameEn: string; fullNameAr: string }[]>([]);
  readonly loadingModalEmployees = signal(false);
  readonly showModal = signal(false);
  readonly showGenerateModal = signal(false);
  readonly showAssignModal = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly modalError = signal<string | null>(null);
  readonly generateResult = signal<string | null>(null);
  readonly gapsForGenerate = signal<CompetencyGapListDto[]>([]);
  readonly selectedGapIds = signal<Set<string>>(new Set());
  readonly loadingGaps = signal(false);
  readonly planOptions = signal<{ id: string; titleEn: string; titleAr: string; status: string; year: number }[]>([]);
  readonly selectedNeedIds = signal<Set<string>>(new Set());
  selectedPlanId: string | null = null;
  assignResult = signal<string | null>(null);

  readonly showConfirm = signal(false);
  readonly toDeleteId = signal<string | null>(null);
  readonly deleting = signal(false);

  readonly priorityOptions: { value: string | null; labelKey: string }[] = [
    { value: null, labelKey: 'trainingNeeds.priorityNone' },
    { value: 'High', labelKey: 'trainingNeeds.priorityHigh' },
    { value: 'Medium', labelKey: 'trainingNeeds.priorityMedium' },
    { value: 'Low', labelKey: 'trainingNeeds.priorityLow' },
  ];

  form: CreateTrainingNeedRequest = {
    sourceType: 'Manual',
    titleEn: '',
    titleAr: '',
    descriptionEn: null,
    descriptionAr: null,
    priority: null,
    employeeId: null,
    organizationalUnitId: null,
    jobId: null,
    competencyId: null,
    assessmentCycleId: null,
    competencyGapId: null,
  };

  canCreate = () => this.auth.hasPermission(PermissionCodes.trainingNeed.create);
  canEdit = () => this.auth.hasPermission(PermissionCodes.trainingNeed.edit);
  canDelete = () => this.auth.hasPermission(PermissionCodes.trainingNeed.delete);
  canGenerateFromGaps = () => this.auth.hasPermission(PermissionCodes.gapAnalysis.analyze);
  canAssignToPlan = () => this.auth.hasPermission(PermissionCodes.trainingNeed.edit);

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.trainingNeeds') }]);
  deleteConfirmMessage = computed(() => this.translate.instant('dialog.confirmDelete'));

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'Approved': return 'ds-badge--success';
      case 'Submitted': return 'ds-badge--info';
      case 'Rejected': return 'ds-badge--danger';
      default: return 'ds-badge--neutral';
    }
  }

  ngOnInit(): void {
    this.loadOrgOptions();
    this.loadOuOptions();
    this.loadJobOptions();
    this.loadEmployeeOptions();
    this.loadPlanOptions();
    this.load();
  }

  loadOrgOptions(): void {
    this.orgApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.orgOptions.set(res.data.items.map(o => ({ id: o.id, nameEn: o.nameEn })));
      },
    });
  }

  loadOuOptions(): void {
    this.orgApi.getDefault().subscribe({
      next: (res) => {
        const defaultOrgId = res.success && res.data?.id ? res.data.id : undefined;
        this.ouApi.getPaged({ page: 1, pageSize: 500, organizationId: defaultOrgId }).subscribe({
          next: (r) => {
            if (r.success && r.data) this.ouOptions.set(r.data.items.map(o => ({ id: o.id, nameEn: o.nameEn, nameAr: o.nameAr })));
          },
        });
      },
    });
  }

  loadJobOptions(): void {
    this.jobsApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.jobOptions.set(res.data.items.map(j => ({ id: j.id, titleEn: j.titleEn, titleAr: j.titleAr })));
        }
      },
    });
  }

  loadEmployeeOptions(): void {
    this.employeesApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.employeeOptions.set(
            res.data.items.map(e => ({ id: e.id, fullNameEn: e.fullNameEn, fullNameAr: e.fullNameAr })),
          );
        }
      },
    });
  }

  loadPlanOptions(): void {
    this.plansApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.planOptions.set(
            res.data.items
              .filter(p => p.status === 'Draft' || p.status === 'Rejected')
              .map(p => ({ id: p.id, titleEn: p.titleEn, titleAr: p.titleAr, status: p.status, year: p.year }))
          );
        }
      },
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getPaged({
      page: this.page(),
      pageSize: this.pageSize,
      employeeId: this.employeeIdFilter ?? undefined,
      jobId: this.jobIdFilter ?? undefined,
      organizationalUnitId: this.organizationalUnitIdFilter ?? undefined,
      status: this.statusFilter ?? undefined,
      search: this.search || undefined,
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
    this.page.set(1);
    this.load();
  }

  onFilterChange(): void {
    this.page.set(1);
    this.load();
  }

  clearFilters(): void {
    this.search = '';
    this.employeeIdFilter = null;
    this.jobIdFilter = null;
    this.organizationalUnitIdFilter = null;
    this.statusFilter = null;
    this.page.set(1);
    this.load();
  }

  prevPage(): void { this.page.update(p => Math.max(1, p - 1)); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }
  setPage(p: number): void { this.page.set(p); this.load(); }

  toggleNeedSelection(needId: string): void {
    this.selectedNeedIds.update(current => {
      const next = new Set(current);
      if (next.has(needId)) next.delete(needId);
      else next.add(needId);
      return next;
    });
  }

  toggleSelectAllOnPage(checked: boolean): void {
    const rows = this.data()?.items ?? [];
    this.selectedNeedIds.update(current => {
      const next = new Set(current);
      for (const row of rows) {
        if (checked) next.add(row.id);
        else next.delete(row.id);
      }
      return next;
    });
  }

  areAllRowsSelectedOnPage(): boolean {
    const rows = this.data()?.items ?? [];
    if (!rows.length) return false;
    const selected = this.selectedNeedIds();
    return rows.every(r => selected.has(r.id));
  }

  openAssignModal(): void {
    if (!this.selectedNeedIds().size) return;
    this.selectedPlanId = null;
    this.assignResult.set(null);
    this.showAssignModal.set(true);
    this.loadPlanOptions();
  }

  closeAssignModal(): void {
    this.showAssignModal.set(false);
    this.selectedPlanId = null;
  }

  runAssignToPlan(): void {
    const annualTrainingPlanId = this.selectedPlanId;
    const trainingNeedIds = Array.from(this.selectedNeedIds());
    if (!annualTrainingPlanId || trainingNeedIds.length === 0) {
      this.assignResult.set(this.translate.instant('validation.required'));
      return;
    }
    this.saving.set(true);
    this.assignResult.set(null);
    this.api.assignToPlan({ annualTrainingPlanId, trainingNeedIds }).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success) {
          const message = this.translate.instant('trainingNeeds.assignedCount', { count: res.data ?? 0 });
          this.assignResult.set(message);
          this.toast.success(message);
          this.selectedNeedIds.set(new Set());
          this.closeAssignModal();
          this.load();
        } else {
          this.assignResult.set(res.message ?? this.translate.instant('dialog.error'));
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.assignResult.set(err.error?.message ?? err.message ?? this.translate.instant('dialog.error'));
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form = {
      sourceType: 'Manual',
      titleEn: '',
      titleAr: '',
      descriptionEn: null,
      descriptionAr: null,
      priority: null,
      employeeId: null,
      organizationalUnitId: null,
      jobId: null,
      competencyId: null,
      assessmentCycleId: null,
      competencyGapId: null,
    };
    this.resetModalOuFilters();
    this.modalError.set(null);
    this.showModal.set(true);
  }

  openEdit(row: TrainingNeedListDto): void {
    this.editingId.set(row.id);
    this.modalError.set(null);
    this.showModal.set(true);
    this.api.getById(row.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const d = res.data as TrainingNeedDto;
          this.form = {
            sourceType: d.sourceType,
            titleEn: d.titleEn,
            titleAr: d.titleAr,
            descriptionEn: d.descriptionEn ?? null,
            descriptionAr: d.descriptionAr ?? null,
            priority: d.priority ?? null,
            employeeId: d.employeeId ?? null,
            organizationalUnitId: d.organizationalUnitId ?? null,
            jobId: null,
            competencyId: d.competencyId ?? null,
            assessmentCycleId: d.assessmentCycleId ?? null,
            competencyGapId: d.competencyGapId ?? null,
          };
          this.initializeModalForEdit(d);
        }
      },
    });
  }

  private resetModalOuFilters(): void {
    this.modalDepartmentOptions.set([]);
    this.modalAllDepartments.set(true);
    this.modalSelectedDepartmentIds.set(new Set());
    this.modalEmployeeOptions.set([]);
    this.loadingModalEmployees.set(false);
  }

  onModalOrganizationalUnitChange(ouId: string | null): void {
    this.form.jobId = null;
    this.form.employeeId = null;
    this.modalDepartmentOptions.set([]);
    this.modalAllDepartments.set(true);
    this.modalSelectedDepartmentIds.set(new Set());
    this.modalEmployeeOptions.set([]);
    if (!ouId) {
      this.loadingModalEmployees.set(false);
      return;
    }
    this.ouApi.getPaged({ page: 1, pageSize: 500, parentId: ouId, isActive: true, rootOnly: false }).subscribe({
      next: (r) => {
        if (r.success && r.data) {
          this.modalDepartmentOptions.set(r.data.items.map(o => ({ id: o.id, nameEn: o.nameEn, nameAr: o.nameAr })));
        } else {
          this.modalDepartmentOptions.set([]);
        }
        this.refreshModalEmployees();
      },
      error: () => {
        this.modalDepartmentOptions.set([]);
        this.refreshModalEmployees();
      },
    });
  }

  setModalAllDepartments(checked: boolean): void {
    this.modalAllDepartments.set(checked);
    if (checked) this.modalSelectedDepartmentIds.set(new Set());
  }

  toggleModalDepartment(departmentId: string, checked: boolean): void {
    if (checked) this.modalAllDepartments.set(false);
    this.modalSelectedDepartmentIds.update(s => {
      const next = new Set(s);
      if (checked) next.add(departmentId);
      else next.delete(departmentId);
      return next;
    });
  }

  isModalDepartmentSelected(id: string): boolean {
    return this.modalSelectedDepartmentIds().has(id);
  }

  /** Loads employees for the selected organizational unit only (unit + its direct child OUs), not filtered by department checkboxes. */
  private refreshModalEmployees(): void {
    const ouId = this.form.organizationalUnitId;
    if (!ouId) {
      this.modalEmployeeOptions.set([]);
      this.loadingModalEmployees.set(false);
      return;
    }
    const children = this.modalDepartmentOptions();
    const childIds = children.map(c => c.id);
    const unitIds = childIds.length === 0 ? [ouId] : [ouId, ...childIds];
    this.loadEmployeesForOrganizationalUnitIds(unitIds);
  }

  private loadEmployeesForOrganizationalUnitIds(unitIds: string[]): void {
    if (unitIds.length === 0) {
      this.modalEmployeeOptions.set([]);
      this.loadingModalEmployees.set(false);
      return;
    }
    this.loadingModalEmployees.set(true);
    forkJoin(
      unitIds.map(id => this.employeesApi.getPaged({ page: 1, pageSize: 500, organizationalUnitId: id }))
    ).subscribe({
      next: (responses) => {
        const map = new Map<string, { id: string; fullNameEn: string; fullNameAr: string }>();
        for (const res of responses) {
          if (res.success && res.data?.items) {
            for (const e of res.data.items) {
              map.set(e.id, { id: e.id, fullNameEn: e.fullNameEn, fullNameAr: e.fullNameAr });
            }
          }
        }
        const list = Array.from(map.values()).sort((a, b) => a.fullNameEn.localeCompare(b.fullNameEn));
        this.modalEmployeeOptions.set(list);
        this.loadingModalEmployees.set(false);
        if (this.form.employeeId && !map.has(this.form.employeeId)) {
          this.form.employeeId = null;
        }
      },
      error: () => {
        this.modalEmployeeOptions.set([]);
        this.loadingModalEmployees.set(false);
      },
    });
  }

  private initializeModalForEdit(d: TrainingNeedDto): void {
    this.modalAllDepartments.set(true);
    this.modalSelectedDepartmentIds.set(new Set());
    const ouId = d.organizationalUnitId;
    if (!ouId) {
      this.modalDepartmentOptions.set([]);
      this.modalEmployeeOptions.set([]);
      return;
    }
    this.ouApi.getPaged({ page: 1, pageSize: 500, parentId: ouId, isActive: true, rootOnly: false }).subscribe({
      next: (r) => {
        const children = r.success && r.data
          ? r.data.items.map(o => ({ id: o.id, nameEn: o.nameEn, nameAr: o.nameAr }))
          : [];
        this.modalDepartmentOptions.set(children);
        const empId = d.employeeId;
        if (!empId || children.length === 0) {
          this.refreshModalEmployees();
          return;
        }
        this.employeesApi.getById(empId).subscribe({
          next: (er) => {
            const empOu = er.success && er.data ? er.data.organizationalUnitId : null;
            const childIdSet = new Set(children.map(c => c.id));
            if (empOu && childIdSet.has(empOu)) {
              this.modalAllDepartments.set(false);
              this.modalSelectedDepartmentIds.set(new Set([empOu]));
            }
            this.refreshModalEmployees();
          },
          error: () => this.refreshModalEmployees(),
        });
      },
      error: () => {
        this.modalDepartmentOptions.set([]);
        this.refreshModalEmployees();
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
      this.api.update(id, { id, titleEn: this.form.titleEn, titleAr: this.form.titleAr, descriptionEn: this.form.descriptionEn, descriptionAr: this.form.descriptionAr, priority: this.form.priority }).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    } else {
      if (!this.form.titleEn?.trim() || !this.form.titleAr?.trim()) {
        this.modalError.set(this.translate.instant('validation.required'));
        return;
      }
      this.form.jobId = null;
      this.saving.set(true);
      this.api.create(this.form).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    }
  }

  submitNeed(row: TrainingNeedListDto): void {
    if (row.status !== 'Draft' && row.status !== 'Rejected') return;
    this.api.submit(row.id).subscribe({ next: () => this.load(), error: (err) => this.error.set(err.error?.message ?? 'Failed') });
  }

  approveNeed(row: TrainingNeedListDto): void {
    this.api.approve(row.id).subscribe({ next: () => this.load(), error: (err) => this.error.set(err.error?.message ?? 'Failed') });
  }

  rejectNeed(row: TrainingNeedListDto): void {
    this.api.reject(row.id).subscribe({ next: () => this.load(), error: (err) => this.error.set(err.error?.message ?? 'Failed') });
  }

  confirmDelete(row: TrainingNeedListDto): void {
    if (!this.canDelete()) return;
    this.toDeleteId.set(row.id);
    this.showConfirm.set(true);
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
    this.toDeleteId.set(null);
  }

  doDelete(): void {
    const id = this.toDeleteId();
    if (!id) return;
    this.showConfirm.set(false);
    this.deleting.set(true);
    this.api.delete(id).subscribe({
      next: (res) => {
        this.deleting.set(false);
        if (res.success) {
          this.toast.success(this.translate.instant('common.deleted'));
          this.load();
        } else {
          this.toast.error(res.message ?? this.translate.instant('dialog.error'));
        }
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(err.error?.message ?? err.message ?? this.translate.instant('dialog.error'));
      },
    });
  }

  openGenerateFromGaps(): void {
    this.showGenerateModal.set(true);
    this.generateResult.set(null);
    this.selectedGapIds.set(new Set());
    this.loadingGaps.set(true);
    this.gapsApi.getGapsPaged({ page: 1, pageSize: 200 }).subscribe({
      next: (res) => {
        this.loadingGaps.set(false);
        if (res.success && res.data) this.gapsForGenerate.set(res.data.items);
      },
      error: () => this.loadingGaps.set(false),
    });
  }

  closeGenerateModal(): void {
    this.showGenerateModal.set(false);
  }

  toggleGapSelection(gapId: string): void {
    this.selectedGapIds.update(s => {
      const next = new Set(s);
      if (next.has(gapId)) next.delete(gapId); else next.add(gapId);
      return next;
    });
  }

  runGenerateFromGaps(): void {
    const ids = Array.from(this.selectedGapIds());
    if (ids.length === 0) {
      this.generateResult.set(this.translate.instant('trainingNeeds.selectAtLeastOneGap'));
      return;
    }
    this.saving.set(true);
    this.generateResult.set(null);
    this.api.generateFromGaps(ids).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success && res.data != null) {
          this.generateResult.set(this.translate.instant('trainingNeeds.generatedCount', { count: res.data }));
          this.load();
        } else this.generateResult.set(res.message ?? 'Error');
      },
      error: (err) => {
        this.saving.set(false);
        this.generateResult.set(err.error?.message ?? err.message ?? 'Error');
      },
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

  localizedTableEmployee(row: TrainingNeedListDto): string {
    if (!row.employeeId) return row.employeeNameEn?.trim() || '—';
    const e = this.employeeOptions().find((x) => x.id === row.employeeId);
    if (e) return this.getLocalizedText(e.fullNameAr, e.fullNameEn);
    return row.employeeNameEn?.trim() || '—';
  }

  localizedTableJob(row: TrainingNeedListDto): string {
    if (!row.jobId) return row.jobTitleEn?.trim() || '—';
    const j = this.jobOptions().find((x) => x.id === row.jobId);
    if (j) return this.getLocalizedText(j.titleAr, j.titleEn);
    return row.jobTitleEn?.trim() || '—';
  }

  gapSeverityLabel(severity: string | null | undefined): string {
    switch (severity) {
      case 'Low': return this.translate.instant('assessments.gapLow');
      case 'Medium': return this.translate.instant('assessments.gapMedium');
      case 'High': return this.translate.instant('assessments.gapHigh');
      default: return severity?.trim() || '—';
    }
  }
}
