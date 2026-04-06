import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { TrainingPlansApiService } from '../../../core/api/training-plans/training-plans-api.service';
import { OrganizationsApiService } from '../../../core/api/organizations/organizations-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { LocalizedTextPipe } from '../../../shared/pipes/localized-text.pipe';
import { ToastService } from '../../../core/toast/toast.service';
import type { AnnualTrainingPlanListDto, CreateAnnualTrainingPlanRequest, UpdateAnnualTrainingPlanRequest } from '../../../core/api/training-plans/training-plans-api.models';
import type { PagedResult } from '../../../core/models/api-response';

@Component({
  selector: 'app-training-plans-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink, DecimalPipe, PageShellComponent, ConfirmDialogComponent, LocalizedTextPipe],
  templateUrl: './training-plans-page.component.html',
  styleUrls: ['./training-plans-page.component.scss'],
})
export class TrainingPlansPageComponent implements OnInit {
  private readonly api = inject(TrainingPlansApiService);
  private readonly orgApi = inject(OrganizationsApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  readonly data = signal<PagedResult<AnnualTrainingPlanListDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  search = '';
  organizationIdFilter: string | null = null;
  yearFilter: number | null = null;
  statusFilter: string | null = null;

  readonly orgOptions = signal<{ id: string; nameEn: string; nameAr: string }[]>([]);
  readonly defaultOrgId = signal<string | null>(null);
  readonly showModal = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly modalError = signal<string | null>(null);

  readonly showConfirm = signal(false);
  readonly toDeleteId = signal<string | null>(null);
  readonly deleting = signal(false);

  form: CreateAnnualTrainingPlanRequest = {
    year: new Date().getFullYear(),
    organizationId: '',
    planType: 'Annual',
    startDate: null,
    endDate: null,
    titleEn: '',
    titleAr: '',
    descriptionEn: null,
    descriptionAr: null,
    budget: null,
    notes: null,
  };

  canCreate = () => this.auth.hasPermission(PermissionCodes.trainingPlan.create);
  canEdit = () => this.auth.hasPermission(PermissionCodes.trainingPlan.edit);
  canSubmit = () => this.auth.hasPermission(PermissionCodes.trainingPlan.submit);
  canApprove = () => this.auth.hasPermission(PermissionCodes.trainingPlan.approve);
  canDelete = () => this.auth.hasPermission(PermissionCodes.trainingPlan.delete);

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.trainingPlan') }]);
  deleteConfirmMessage = computed(() => this.translate.instant('dialog.confirmDelete'));

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'Approved': return 'ds-badge--success';
      case 'Submitted': return 'ds-badge--info';
      case 'Rejected': return 'ds-badge--danger';
      default: return 'ds-badge--neutral';
    }
  }

  years = computed(() => {
    const y = new Date().getFullYear();
    return [y - 1, y, y + 1];
  });

  ngOnInit(): void {
    this.orgApi.getDefault().subscribe({
      next: (res) => {
        if (res.success && res.data?.id) this.defaultOrgId.set(res.data.id);
      },
    });
    this.orgApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.orgOptions.set(res.data.items.map(o => ({ id: o.id, nameEn: o.nameEn, nameAr: o.nameAr })));
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
      organizationId: this.organizationIdFilter ?? undefined,
      year: this.yearFilter ?? undefined,
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

  onFilterChange(): void {
    this.page.set(1);
    this.load();
  }

  clearFilters(): void {
    this.search = '';
    this.organizationIdFilter = null;
    this.yearFilter = null;
    this.statusFilter = null;
    this.page.set(1);
    this.load();
  }

  prevPage(): void { this.page.update(p => Math.max(1, p - 1)); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }

  openCreate(): void {
    this.editingId.set(null);
    this.form = {
      year: new Date().getFullYear(),
      organizationId: this.organizationIdFilter ?? this.defaultOrgId() ?? this.orgOptions()[0]?.id ?? '',
      planType: 'Annual',
      startDate: null,
      endDate: null,
      titleEn: '',
      titleAr: '',
      descriptionEn: null,
      descriptionAr: null,
      budget: null,
      notes: null,
    };
    this.modalError.set(null);
    this.showModal.set(true);
  }

  openEdit(row: AnnualTrainingPlanListDto): void {
    this.editingId.set(row.id);
    this.api.getById(row.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const d = res.data;
          this.form = {
            year: d.year,
            organizationId: d.organizationId,
            planType: (d.planType as any) ?? 'Annual',
            startDate: (d.startDate as any) ?? null,
            endDate: (d.endDate as any) ?? null,
            titleEn: d.titleEn,
            titleAr: d.titleAr,
            descriptionEn: d.descriptionEn ?? null,
            descriptionAr: d.descriptionAr ?? null,
            budget: d.budget ?? null,
            notes: d.notes ?? null,
          };
          this.modalError.set(null);
          this.showModal.set(true);
        }
      },
    });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  onPlanTypeChange(): void {
    if (this.form.planType === 'Annual') {
      this.form = { ...this.form, startDate: null, endDate: null };
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const startDate = this.form.startDate ?? today;
    const endDate = this.form.endDate ?? startDate;
    this.form = { ...this.form, startDate, endDate };

    if (this.form.startDate && this.form.endDate && this.form.endDate < this.form.startDate) {
      this.form = { ...this.form, endDate: this.form.startDate };
    }
  }

  onStartDateChange(): void {
    if (this.form.startDate && this.form.endDate && this.form.endDate < this.form.startDate) {
      this.form = { ...this.form, endDate: this.form.startDate };
    }
  }

  onEndDateChange(): void {
    if (this.form.startDate && this.form.endDate && this.form.endDate < this.form.startDate) {
      this.form = { ...this.form, startDate: this.form.endDate };
    }
  }

  save(): void {
    this.modalError.set(null);
    const id = this.editingId();

    // The create/update API requires an organizationId, but we no longer show it in the modal.
    if (!this.form.organizationId) {
      this.form = { ...this.form, organizationId: this.organizationIdFilter ?? this.defaultOrgId() ?? this.orgOptions()[0]?.id ?? '' };
    }

    if (id) {
      this.saving.set(true);
      this.api.update(id, { ...this.form, id }).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    } else {
      if (!this.form.titleEn?.trim() || !this.form.titleAr?.trim() || !this.form.organizationId) {
        this.modalError.set(this.translate.instant('validation.required'));
        return;
      }
      if (this.form.planType !== 'Annual') {
        if (!this.form.startDate || !this.form.endDate) {
          this.modalError.set(this.translate.instant('validation.required'));
          return;
        }
        if (this.form.endDate < this.form.startDate) {
          this.modalError.set('End date must be after start date.');
          return;
        }
      }
      this.saving.set(true);
      this.api.create(this.form).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    }
  }

  submitPlan(row: AnnualTrainingPlanListDto): void {
    this.api.submit(row.id).subscribe({ next: () => this.load(), error: (err) => this.error.set(err.error?.message ?? 'Failed') });
  }

  approvePlan(row: AnnualTrainingPlanListDto): void {
    this.api.approve(row.id).subscribe({ next: () => this.load(), error: (err) => this.error.set(err.error?.message ?? 'Failed') });
  }

  rejectPlan(row: AnnualTrainingPlanListDto): void {
    this.api.reject(row.id).subscribe({ next: () => this.load(), error: (err) => this.error.set(err.error?.message ?? 'Failed') });
  }

  confirmDelete(row: AnnualTrainingPlanListDto): void {
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
    this.api.deletePlan(id).subscribe({
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
}
