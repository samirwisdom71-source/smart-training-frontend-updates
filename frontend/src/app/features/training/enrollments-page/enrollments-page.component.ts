import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { EnrollmentsApiService } from '../../../core/api/enrollments/enrollments-api.service';
import { TrainingProgramsApiService } from '../../../core/api/training-programs/training-programs-api.service';
import { EmployeesApiService } from '../../../core/api/employees/employees-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import { ToastService } from '../../../core/toast/toast.service';
import type { EnrollmentListDto } from '../../../core/api/enrollments/enrollments-api.models';
import type { NominateEnrollmentsBulkRequest } from '../../../core/api/enrollments/enrollments-api.models';
import type { PagedResult } from '../../../core/models/api-response';

@Component({
  selector: 'app-enrollments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink, PageShellComponent, ConfirmDialogComponent],
  templateUrl: './enrollments-page.component.html',
  styleUrls: ['./enrollments-page.component.scss'],
})
export class EnrollmentsPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(EnrollmentsApiService);
  private readonly programsApi = inject(TrainingProgramsApiService);
  private readonly employeesApi = inject(EmployeesApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  readonly data = signal<PagedResult<EnrollmentListDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  programIdFilter: string | null = null;
  employeeIdFilter: string | null = null;
  statusFilter: string | null = null;

  readonly programOptions = signal<{ id: string; titleEn: string; titleAr: string }[]>([]);
  readonly employeeOptions = signal<{ id: string; fullNameEn: string; fullNameAr: string }[]>([]);

  readonly showNominateModal = signal(false);
  readonly savingNominate = signal(false);
  readonly nominateError = signal<string | null>(null);
  nominateForm: NominateEnrollmentsBulkRequest = {
    trainingProgramId: '',
    employeeIds: [],
    nominationSource: undefined,
    notes: null,
  };

  readonly showCancelConfirm = signal(false);
  readonly toCancelRow = signal<EnrollmentListDto | null>(null);
  readonly cancelling = signal(false);

  readonly showDeleteConfirm = signal(false);
  readonly toDeleteRow = signal<EnrollmentListDto | null>(null);
  readonly deleting = signal(false);
  readonly backProgramId = signal<string | null>(null);

  canCreate = () => this.auth.hasPermission(PermissionCodes.enrollment.create);
  canApprove = () => this.auth.hasPermission(PermissionCodes.enrollment.approve);
  canEdit = () => this.auth.hasPermission(PermissionCodes.enrollment.edit);
  canDelete = () => this.auth.hasPermission(PermissionCodes.enrollment.delete);

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.enrollments') }]);

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'Enrolled':
      case 'Confirmed':
      case 'Completed':
        return 'ds-badge--success';
      case 'Approved':
        return 'ds-badge--info';
      case 'Rejected':
      case 'Cancelled':
        return 'ds-badge--danger';
      default:
        return 'ds-badge--neutral';
    }
  }

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap.get('programId');
    if (qp) {
      this.programIdFilter = qp;
      this.backProgramId.set(qp);
    }

    this.programsApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.programOptions.set(res.data.items.map(p => ({ id: p.id, titleEn: p.titleEn, titleAr: p.titleAr })));
        }
      },
    });
    this.employeesApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.employeeOptions.set(
            res.data.items.map(e => ({ id: e.id, fullNameEn: e.fullNameEn, fullNameAr: e.fullNameAr })),
          );
        }
      },
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getPaged({
      page: this.page(),
      pageSize: this.pageSize,
      programId: this.programIdFilter ?? undefined,
      employeeId: this.employeeIdFilter ?? undefined,
      status: this.statusFilter ?? undefined,
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

  onFilterChange(): void {
    this.page.set(1);
    this.load();
  }

  clearFilters(): void {
    this.programIdFilter = null;
    this.employeeIdFilter = null;
    this.statusFilter = null;
    this.page.set(1);
    this.load();
  }

  prevPage(): void { this.page.update(p => Math.max(1, p - 1)); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }

  approve(row: EnrollmentListDto): void {
    this.api.approve(row.id).subscribe({ next: () => this.load(), error: (err) => this.error.set(err.error?.message ?? 'Failed') });
  }

  reject(row: EnrollmentListDto): void {
    this.api.reject(row.id).subscribe({ next: () => this.load(), error: (err) => this.error.set(err.error?.message ?? 'Failed') });
  }

  enroll(row: EnrollmentListDto): void {
    this.api.enroll(row.id).subscribe({ next: () => this.load(), error: (err) => this.error.set(err.error?.message ?? 'Failed') });
  }

  cancel(row: EnrollmentListDto): void {
    this.toCancelRow.set(row);
    this.showCancelConfirm.set(true);
  }

  cancelCancelConfirm(): void {
    this.showCancelConfirm.set(false);
    this.toCancelRow.set(null);
  }

  doCancel(): void {
    const row = this.toCancelRow();
    if (!row) return;
    this.showCancelConfirm.set(false);
    this.cancelling.set(true);
    this.api.cancel(row.id).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.toCancelRow.set(null);
        this.toast.success(this.translate.instant('enrollments.cancelled'));
        this.load();
      },
      error: (err) => {
        this.cancelling.set(false);
        this.toast.error(err.error?.message ?? err.message ?? this.translate.instant('dialog.error'));
      },
    });
  }

  confirmDelete(row: EnrollmentListDto): void {
    if (!this.canDelete()) return;
    this.toDeleteRow.set(row);
    this.showDeleteConfirm.set(true);
  }

  cancelDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
    this.toDeleteRow.set(null);
  }

  doDelete(): void {
    const row = this.toDeleteRow();
    if (!row) return;
    this.showDeleteConfirm.set(false);
    this.deleting.set(true);
    this.api.deleteEnrollment(row.id).subscribe({
      next: (res) => {
        this.deleting.set(false);
        this.toDeleteRow.set(null);
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

  complete(row: EnrollmentListDto): void {
    this.api.complete(row.id).subscribe({ next: () => this.load(), error: (err) => this.error.set(err.error?.message ?? 'Failed') });
  }

  openNominate(): void {
    this.nominateForm = {
      trainingProgramId: this.backProgramId() ?? this.programIdFilter ?? '',
      employeeIds: [],
      nominationSource: undefined,
      notes: null,
    };
    this.nominateError.set(null);
    this.showNominateModal.set(true);
  }

  closeNominate(): void {
    this.showNominateModal.set(false);
  }

  submitNominate(): void {
    if (!this.nominateForm.trainingProgramId?.trim() || !this.nominateForm.employeeIds?.length) {
      this.nominateError.set(this.translate.instant('validation.required'));
      return;
    }
    this.savingNominate.set(true);
    this.nominateError.set(null);
    this.api.nominateBulk(this.nominateForm).subscribe({
      next: () => {
        this.savingNominate.set(false);
        this.closeNominate();
        this.load();
      },
      error: (err) => {
        this.savingNominate.set(false);
        this.nominateError.set(err.error?.message ?? err.error?.errors?.[0] ?? 'Failed');
      },
    });
  }

  toggleSelectAllEmployees(checked: boolean): void {
    const all = this.employeeOptions().map(e => e.id);
    this.nominateForm = { ...this.nominateForm, employeeIds: checked ? all : [] };
  }

  toggleEmployee(employeeId: string, checked: boolean): void {
    const current = this.nominateForm.employeeIds ?? [];
    if (checked) {
      if (current.includes(employeeId)) return;
      this.nominateForm = { ...this.nominateForm, employeeIds: [...current, employeeId] };
      return;
    }
    this.nominateForm = { ...this.nominateForm, employeeIds: current.filter(x => x !== employeeId) };
  }

  isEmployeeSelected(employeeId: string): boolean {
    return (this.nominateForm.employeeIds ?? []).includes(employeeId);
  }

  isAllEmployeesSelected(): boolean {
    const ids = this.nominateForm.employeeIds ?? [];
    const all = this.employeeOptions();
    return all.length > 0 && ids.length === all.length;
  }

  getLocalizedText(ar?: string | null, en?: string | null): string {
    const lang = (this.translate.currentLang || this.translate.getDefaultLang() || 'en').toLowerCase();
    const arText = ar?.trim() ?? '';
    const enText = en?.trim() ?? '';
    if (lang.startsWith('ar')) return arText || enText || '—';
    return enText || arText || '—';
  }

  localizedProgramTitle(programId: string, fallbackEn: string): string {
    const p = this.programOptions().find(x => x.id === programId);
    if (p) return this.getLocalizedText(p.titleAr, p.titleEn);
    return fallbackEn?.trim() || '—';
  }

  localizedEmployeeName(employeeId: string, fallbackEn: string): string {
    const e = this.employeeOptions().find(x => x.id === employeeId);
    if (e) return this.getLocalizedText(e.fullNameAr, e.fullNameEn);
    return fallbackEn?.trim() || '—';
  }
}
