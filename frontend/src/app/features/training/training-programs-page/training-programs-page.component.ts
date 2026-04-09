import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { PortalToBodyDirective } from '../../../shared/portal/portal-to-body.directive';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { LocalizedTextPipe } from '../../../shared/pipes/localized-text.pipe';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { TrainingProgramsApiService } from '../../../core/api/training-programs/training-programs-api.service';
import { OrganizationsApiService } from '../../../core/api/organizations/organizations-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import { ToastService } from '../../../core/toast/toast.service';
import type { TrainingProgramListDto, CreateTrainingProgramRequest, UpdateTrainingProgramRequest } from '../../../core/api/training-programs/training-programs-api.models';
import type { PagedResult } from '../../../core/models/api-response';
import {
  DataViewPreferenceService,
  DataViewToggleComponent,
  LuxActionIconComponent,
  LuxDataCardComponent,
  LuxDataCardGridComponent,
} from '../../../shared/data-view';

@Component({
  selector: 'app-training-programs-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    RouterLink,
    DatePipe,
    DecimalPipe,
    TooltipDirective,
    LocalizedTextPipe,
    PageShellComponent,
    ConfirmDialogComponent,
    PortalToBodyDirective,
    PaginationComponent,
    DataViewToggleComponent,
    LuxDataCardComponent,
    LuxDataCardGridComponent,
    LuxActionIconComponent,
  ],
  templateUrl: './training-programs-page.component.html',
  styleUrls: ['./training-programs-page.component.scss'],
})
export class TrainingProgramsPageComponent implements OnInit {
  private readonly api = inject(TrainingProgramsApiService);
  private readonly orgApi = inject(OrganizationsApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly dataViewPref = inject(DataViewPreferenceService);

  readonly data = signal<PagedResult<TrainingProgramListDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  search = '';
  organizationIdFilter: string | null = null;
  statusFilter: string | null = null;

  readonly orgOptions = signal<{ id: string; nameEn: string; nameAr: string }[]>([]);
  readonly showModal = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly modalError = signal<string | null>(null);

  readonly showConfirm = signal(false);
  readonly toDeleteId = signal<string | null>(null);
  readonly deleting = signal(false);
  readonly deliveryModeOptions: string[] = ['Online', 'Offline', 'Hybrid'];
  readonly executorTypeOptions: string[] = ['Internal', 'ExternalPartner'];
  /** Stored in DB as program Location when not Online-only. */
  readonly programLocationScopeOptions: string[] = ['InsideCircle', 'OutsideCircle'];

  form: CreateTrainingProgramRequest = {
    organizationId: '',
    code: '',
    titleEn: '',
    titleAr: '',
    descriptionEn: null,
    descriptionAr: null,
    competencyId: null,
    deliveryMode: null,
    location: null,
    onlineLink: null,
    executorType: null,
    capacity: null,
    startDate: null,
    endDate: null,
  };

  canCreate = () => this.auth.hasPermission(PermissionCodes.trainingProgram.create);
  canEdit = () => this.auth.hasPermission(PermissionCodes.trainingProgram.edit);
  canDelete = () => this.auth.hasPermission(PermissionCodes.trainingProgram.delete);

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.programs') }]);
  deleteConfirmMessage = computed(() => this.translate.instant('dialog.confirmDelete'));

  ngOnInit(): void {
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
    this.statusFilter = null;
    this.page.set(1);
    this.load();
  }

  prevPage(): void { this.page.update(p => Math.max(1, p - 1)); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }
  setPage(p: number): void { this.page.set(p); this.load(); }

  programStatusLabel(status: string | null | undefined): string {
    switch (status) {
      case 'Draft':
        return this.translate.instant('status.draft');
      case 'Published':
        return this.translate.instant('status.published');
      case 'Completed':
        return this.translate.instant('status.completed');
      case 'Planned':
        return this.translate.instant('status.planned');
      default:
        return status?.trim() || '—';
    }
  }

  private isKnownLocationScope(v: string | null | undefined): boolean {
    return v === 'InsideCircle' || v === 'OutsideCircle';
  }

  /** Keep location / online fields consistent with delivery mode. */
  onProgramDeliveryModeChange(): void {
    const mode = this.form.deliveryMode;
    if (mode === 'Online') {
      this.form.location = null;
    } else if (mode === 'Offline' || mode === 'Hybrid') {
      if (!this.form.location || !this.isKnownLocationScope(this.form.location)) {
        this.form.location = 'InsideCircle';
      }
    }
  }

  private normalizeProgramLocationAfterLoad(): void {
    const mode = this.form.deliveryMode;
    if (mode === 'Online') {
      this.form.location = null;
      return;
    }
    if (mode === 'Offline' || mode === 'Hybrid') {
      if (!this.form.location || !this.isKnownLocationScope(this.form.location)) {
        this.form.location = 'InsideCircle';
      }
    }
  }

  /** API may return full ISO; `<input type="date">` needs `yyyy-MM-dd`. */
  private toDateInputValue(value: string | null | undefined): string | null {
    if (value == null || String(value).trim() === '') return null;
    const s = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  }

  private toApiDateString(value: string | null | undefined): string | null {
    const v = typeof value === 'string' ? value.trim() : '';
    if (!v) return null;
    return v.length >= 10 ? v.slice(0, 10) : v;
  }

  openScientificMaterials(relativePath: string): void {
    const url = this.api.fileUrl(relativePath);
    window.open(url, '_blank', 'noopener');
  }

  openProgramDetail(id: string): void {
    void this.router.navigate(['/programs', id]);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form = {
      organizationId: this.organizationIdFilter ?? this.orgOptions()[0]?.id ?? '',
      code: '',
      titleEn: '',
      titleAr: '',
      descriptionEn: null,
      descriptionAr: null,
      competencyId: null,
      deliveryMode: null,
      location: null,
      onlineLink: null,
      executorType: null,
      capacity: null,
      startDate: null,
      endDate: null,
    };
    this.modalError.set(null);
    this.showModal.set(true);
  }

  openEdit(row: TrainingProgramListDto): void {
    this.editingId.set(row.id);
    this.api.getById(row.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const d = res.data;
          this.form = {
            organizationId: d.organizationId,
            trainingPlanItemId: d.trainingPlanItemId,
            code: d.code,
            titleEn: d.titleEn,
            titleAr: d.titleAr,
            descriptionEn: d.descriptionEn ?? null,
            descriptionAr: d.descriptionAr ?? null,
            competencyId: d.competencyId ?? null,
            deliveryMode: d.deliveryMode ?? null,
            location: d.location ?? null,
            onlineLink: d.onlineLink ?? null,
            executorType: d.executorType ?? null,
            capacity: d.capacity ?? null,
            startDate: d.startDate ?? null,
            endDate: d.endDate ?? null,
          };
          this.normalizeProgramLocationAfterLoad();
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

  save(): void {
    this.modalError.set(null);
    const startDate = this.toApiDateString(this.form.startDate);
    const endDate = this.toApiDateString(this.form.endDate);
    if (startDate && endDate && endDate < startDate) {
      this.modalError.set(this.translate.instant('programs.datesInvalidRange'));
      return;
    }
    const body = { ...this.form, startDate, endDate };
    const id = this.editingId();
    if (id) {
      this.saving.set(true);
      this.api.update(id, { ...body, id }).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    } else {
      if (!this.form.code?.trim() || !this.form.titleEn?.trim() || !this.form.organizationId) {
        this.modalError.set(this.translate.instant('validation.required'));
        return;
      }
      this.saving.set(true);
      this.api.create(body).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    }
  }

  confirmDelete(row: TrainingProgramListDto): void {
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
    this.api.deleteProgram(id).subscribe({
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
