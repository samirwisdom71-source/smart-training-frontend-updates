import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { PortalToBodyDirective } from '../../../shared/portal/portal-to-body.directive';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { PostTrainingReportsApiService } from '../../../core/api/post-training-reports/post-training-reports-api.service';
import { TrainingProgramsApiService } from '../../../core/api/training-programs/training-programs-api.service';
import { EmployeesApiService } from '../../../core/api/employees/employees-api.service';
import { EnrollmentsApiService } from '../../../core/api/enrollments/enrollments-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import { ToastService } from '../../../core/toast/toast.service';
import type { PostTrainingReportListDto } from '../../../core/api/post-training-reports/post-training-reports-api.models';
import type { EmployeeListDto } from '../../../core/api/employees/employees-api.models';
import type { PagedResult } from '../../../core/models/api-response';
import {
  DataViewPreferenceService,
  DataViewToggleComponent,
  LuxActionIconComponent,
  LuxDataCardComponent,
  LuxDataCardGridComponent,
} from '../../../shared/data-view';

@Component({
  selector: 'app-post-training-reports-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    RouterLink,
    DatePipe,
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
  templateUrl: './post-training-reports-page.component.html',
  styleUrls: ['./post-training-reports-page.component.scss'],
})
export class PostTrainingReportsPageComponent implements OnInit {
  private readonly api = inject(PostTrainingReportsApiService);
  private readonly programsApi = inject(TrainingProgramsApiService);
  private readonly employeesApi = inject(EmployeesApiService);
  private readonly enrollmentsApi = inject(EnrollmentsApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly dataViewPref = inject(DataViewPreferenceService);

  readonly data = signal<PagedResult<PostTrainingReportListDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  programIdFilter: string | null = null;
  employeeIdFilter: string | null = null;
  statusFilter: string | null = null;
  private readonly emptyEmployeeId = '00000000-0000-0000-0000-000000000000';

  readonly programOptions = signal<{ id: string; titleEn: string; titleAr: string }[]>([]);
  readonly employeeOptions = signal<{ id: string; fullNameEn: string; fullNameAr: string }[]>([]);
  readonly currentEmployeeId = signal<string | null>(null);
  readonly currentEmployeeName = signal<string>('—');
  readonly allowedProgramIds = signal<string[]>([]);
  readonly isPrivilegedUser = computed(() => this.canAnalyze());
  readonly visibleProgramOptions = computed(() => {
    if (this.isPrivilegedUser()) return this.programOptions();
    const allowed = new Set(this.allowedProgramIds());
    return this.programOptions().filter((program) => allowed.has(program.id));
  });

  canExecute = () => this.auth.hasPermission(PermissionCodes.evaluation.execute);
  canAnalyze = () => this.auth.hasPermission(PermissionCodes.evaluation.analyze);
  breadcrumbs = computed(() => [{ label: this.translate.instant('postTrainingReports.title') }]);

  readonly showArchiveConfirm = signal(false);
  readonly toArchiveRow = signal<PostTrainingReportListDto | null>(null);
  readonly archiving = signal(false);

  readonly showNewModal = signal(false);
  readonly savingNew = signal(false);
  newProgramId: string | null = null;
  newEmployeeId: string | null = null;
  newNotes = '';
  newModalError: string | null = null;

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'Submitted':
      case 'Reviewed':
        return 'ds-badge--success';
      case 'Archived':
        return 'ds-badge--neutral';
      case 'Draft':
        return 'ds-badge--neutral';
      default:
        return 'ds-badge--neutral';
    }
  }

  ngOnInit(): void {
    this.loadProgramOptions();
    if (this.isPrivilegedUser()) {
      this.loadEmployeeOptions();
      this.load();
      return;
    }
    this.initializeRestrictedUserFilters();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getPaged({
      page: this.page(),
      pageSize: this.pageSize,
      programId: this.programIdFilter ?? undefined,
      employeeId: this.effectiveEmployeeIdFilter() ?? undefined,
      status: this.statusFilter ?? undefined,
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) this.data.set(res.data);
        else this.error.set(res.message ?? 'Failed');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Failed');
      },
    });
  }

  onFilterChange(): void {
    this.page.set(1);
    this.load();
  }
  clearFilters(): void {
    this.programIdFilter = null;
    this.employeeIdFilter = this.isPrivilegedUser() ? null : (this.currentEmployeeId() ?? this.emptyEmployeeId);
    this.statusFilter = null;
    this.page.set(1);
    this.load();
  }
  prevPage(): void {
    this.page.update(p => Math.max(1, p - 1));
    this.load();
  }
  nextPage(): void {
    this.page.update(p => p + 1);
    this.load();
  }
  setPage(p: number): void {
    this.page.set(p);
    this.load();
  }

  openNewModal(): void {
    this.newProgramId = this.programIdFilter;
    this.newEmployeeId = this.effectiveEmployeeIdFilter() ?? null;
    this.newNotes = '';
    this.newModalError = null;
    this.showNewModal.set(true);
  }

  closeNewModal(): void {
    this.showNewModal.set(false);
  }

  submitNewReport(): void {
    if (!this.newProgramId || !this.newEmployeeId) {
      this.newModalError = this.translate.instant('validation.required');
      return;
    }
    this.savingNew.set(true);
    this.newModalError = null;
    this.api
      .saveDraft({
        trainingProgramId: this.newProgramId,
        employeeId: this.newEmployeeId,
        notes: this.newNotes.trim() || null,
        details: [],
      })
      .subscribe({
        next: (res) => {
          this.savingNew.set(false);
          if (res.success && res.data) {
            this.toast.success(this.translate.instant('postTrainingReports.draftSaved'));
            this.closeNewModal();
            this.page.set(1);
            this.load();
            void this.router.navigate(['/post-training-reports', 'review', res.data]);
          } else {
            this.newModalError = res.errors?.[0] ?? res.message ?? 'Failed';
          }
        },
        error: (err) => {
          this.savingNew.set(false);
          this.newModalError = err.error?.errors?.[0] ?? err.error?.message ?? err.message ?? 'Failed';
        },
      });
  }

  archive(row: PostTrainingReportListDto): void {
    this.toArchiveRow.set(row);
    this.showArchiveConfirm.set(true);
  }

  cancelArchiveConfirm(): void {
    this.showArchiveConfirm.set(false);
    this.toArchiveRow.set(null);
  }

  doArchive(): void {
    const row = this.toArchiveRow();
    if (!row) return;
    this.showArchiveConfirm.set(false);
    this.archiving.set(true);
    this.api.archive(row.id).subscribe({
      next: () => {
        this.archiving.set(false);
        this.toArchiveRow.set(null);
        this.toast.success(this.translate.instant('postTrainingReports.archived'));
        this.load();
      },
      error: (err) => {
        this.archiving.set(false);
        this.toast.error(err.error?.message ?? err.message ?? this.translate.instant('dialog.error'));
      },
    });
  }

  openReportReview(row: PostTrainingReportListDto): void {
    void this.router.navigate(['/post-training-reports', 'review', row.id]);
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

  private loadProgramOptions(): void {
    this.programsApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.programOptions.set(res.data.items.map((p) => ({ id: p.id, titleEn: p.titleEn, titleAr: p.titleAr })));
        }
      },
    });
  }

  private loadEmployeeOptions(): void {
    this.employeesApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.employeeOptions.set(
            res.data.items.map((e) => ({ id: e.id, fullNameEn: e.fullNameEn, fullNameAr: e.fullNameAr })),
          );
        }
      },
    });
  }

  private initializeRestrictedUserFilters(): void {
    const user = this.auth.user();
    this.currentEmployeeName.set(user?.fullName?.trim() || '—');

    if (!user?.id) {
      this.employeeIdFilter = this.emptyEmployeeId;
      this.load();
      return;
    }

    this.employeesApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        const employee = res.success && res.data
          ? res.data.items.find((item) => item.userId === user.id) ?? null
          : null;
        this.applyRestrictedEmployeeContext(employee);
      },
      error: () => {
        this.applyRestrictedEmployeeContext(null);
      },
    });
  }

  private applyRestrictedEmployeeContext(employee: EmployeeListDto | null): void {
    if (!employee) {
      this.currentEmployeeId.set(null);
      this.allowedProgramIds.set([]);
      this.employeeIdFilter = this.emptyEmployeeId;
      this.newEmployeeId = null;
      this.load();
      return;
    }

    this.currentEmployeeId.set(employee.id);
    this.currentEmployeeName.set(this.getLocalizedText(employee.fullNameAr, employee.fullNameEn));
    this.employeeOptions.set([{ id: employee.id, fullNameEn: employee.fullNameEn, fullNameAr: employee.fullNameAr }]);
    this.employeeIdFilter = employee.id;
    this.newEmployeeId = employee.id;
    this.loadAllowedPrograms(employee.id);
    this.load();
  }

  private loadAllowedPrograms(employeeId: string): void {
    this.enrollmentsApi.getByEmployee(employeeId).subscribe({
      next: (res) => {
        const programIds = (res.success && res.data ? res.data : [])
          .filter((item) => item.status !== 'Rejected' && item.status !== 'Cancelled')
          .map((item) => item.trainingProgramId);
        this.allowedProgramIds.set([...new Set(programIds)]);

        if (this.programIdFilter && !this.allowedProgramIds().includes(this.programIdFilter)) {
          this.programIdFilter = null;
        }
      },
      error: () => {
        this.allowedProgramIds.set([]);
        this.programIdFilter = null;
      },
    });
  }

  private effectiveEmployeeIdFilter(): string | null {
    if (this.isPrivilegedUser()) return this.employeeIdFilter;
    return this.currentEmployeeId() ?? this.emptyEmployeeId;
  }

  downloadRowAttachment(row: PostTrainingReportListDto): void {
    if (!row.attachmentFilePath) return;
    this.api
      .downloadStoredAttachment(row.attachmentFilePath, row.attachmentOriginalFileName)
      .subscribe({
        error: () => {
          this.toast.error(this.translate.instant('postTrainingReports.downloadFailed'));
        },
      });
  }
}
