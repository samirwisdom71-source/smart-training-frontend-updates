import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { forkJoin, switchMap } from 'rxjs';
import { KnowledgeApiService } from '../../../core/api/knowledge/knowledge-api.service';
import { EmployeesApiService } from '../../../core/api/employees/employees-api.service';
import { CompetenciesApiService } from '../../../core/api/competencies/competencies-api.service';
import { OrganizationsApiService } from '../../../core/api/organizations/organizations-api.service';
import { OrganizationalUnitsApiService } from '../../../core/api/organizational-units/organizational-units-api.service';
import type { InternalExpertListDto } from '../../../core/api/knowledge/knowledge-api.models';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import { ToastService } from '../../../core/toast/toast.service';

@Component({
  selector: 'app-internal-experts-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, PageShellComponent, ConfirmDialogComponent],
  templateUrl: './internal-experts-page.component.html',
  styleUrls: ['./internal-experts-page.component.scss'],
})
export class InternalExpertsPageComponent implements OnInit {
  private readonly api = inject(KnowledgeApiService);
  private readonly employeesApi = inject(EmployeesApiService);
  private readonly competenciesApi = inject(CompetenciesApiService);
  private readonly orgApi = inject(OrganizationsApiService);
  private readonly ouApi = inject(OrganizationalUnitsApiService);
  private readonly translate = inject(TranslateService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<InternalExpertListDto[]>([]);
  page = 1;
  pageSize = 20;
  search = '';
  isActive: boolean | null = true;

  readonly showConfirm = signal(false);
  readonly toDelete = signal<InternalExpertListDto | null>(null);
  readonly deleting = signal(false);

  readonly showAddModal = signal(false);
  readonly saving = signal(false);
  readonly modalError = signal<string | null>(null);
  readonly loadingModalData = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly employeeOptions = signal<{ id: string; fullNameEn: string; fullNameAr: string; organizationalUnitId: string | null }[]>([]);
  readonly competencyOptions = signal<{ id: string; nameEn: string; nameAr: string }[]>([]);
  readonly ouOptions = signal<{ id: string; nameEn: string; nameAr?: string | null }[]>([]);

  expertForm = {
    employeeId: null as string | null,
    competencyIds: [] as string[],
    organizationalUnitId: null as string | null,
    areaOfExpertiseEn: '',
    areaOfExpertiseAr: '',
    notes: '',
    isActive: true,
  };

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.internalExperts') }]);
  canCreate = () => this.auth.hasPermission(PermissionCodes.internalExpert.manage);
  canEdit = () => this.auth.hasPermission(PermissionCodes.internalExpert.edit);
  canDelete = () => this.auth.hasPermission(PermissionCodes.internalExpert.manage);
  deleteConfirmMessage = computed(() => this.translate.instant('dialog.confirmDelete'));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getExpertsPaged({ page: this.page, pageSize: this.pageSize, search: this.search || undefined, isActive: this.isActive ?? undefined }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data)
          this.items.set(res.data.items.map((x) => ({ ...x, competencyIds: x.competencyIds ?? [] })));
        else this.error.set('Failed to load');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load');
      },
    });
  }

  expertName(item: InternalExpertListDto): string {
    const lang = this.translate.currentLang || 'en';
    return lang === 'ar' && item.employeeNameAr ? item.employeeNameAr : item.employeeNameEn;
  }

  area(item: InternalExpertListDto): string {
    const lang = this.translate.currentLang || 'en';
    return lang === 'ar' && item.areaOfExpertiseAr ? item.areaOfExpertiseAr : (item.areaOfExpertiseEn ?? '—');
  }

  competencyDisplay(item: InternalExpertListDto): string {
    const lang = (this.translate.currentLang || 'en').toLowerCase();
    const ar = item.competencyNamesAr?.trim() ?? '';
    const en = item.competencyNamesEn?.trim() ?? '';
    if (lang.startsWith('ar')) return ar || en || '—';
    return en || ar || '—';
  }

  localizedOuName(item: InternalExpertListDto): string {
    const lang = (this.translate.currentLang || this.translate.getDefaultLang() || 'en').toLowerCase();
    const prefersArabic = lang.startsWith('ar');
    const ar = item.organizationalUnitNameAr?.trim() ?? '';
    const en = item.organizationalUnitNameEn?.trim() ?? '';
    if (prefersArabic) return ar || en || '—';
    return en || ar || '—';
  }

  getLocalizedText(nameAr?: string | null, nameEn?: string | null): string {
    const lang = (this.translate.currentLang || 'en').toLowerCase();
    const ar = nameAr?.trim() ?? '';
    const en = nameEn?.trim() ?? '';
    if (lang.startsWith('ar')) return ar || en || '—';
    return en || ar || '—';
  }

  employeeLabel(e: { fullNameEn: string; fullNameAr: string }): string {
    return this.getLocalizedText(e.fullNameAr, e.fullNameEn);
  }

  confirmDelete(item: InternalExpertListDto): void {
    if (!this.canDelete()) return;
    this.toDelete.set(item);
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
    this.deleting.set(true);
    this.api.deleteExpert(target.id).subscribe({
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

  private applyModalCatalogue(
    employees: {
      success: boolean;
      data?: { items: { id: string; fullNameEn: string; fullNameAr: string; organizationalUnitId: string | null }[] };
    },
    competencies: { success: boolean; data?: { items: { id: string; nameEn: string; nameAr: string }[] } },
    ous: { success: boolean; data?: { items: { id: string; nameEn: string; nameAr?: string | null }[] } },
  ): void {
    if (employees.success && employees.data) {
      this.employeeOptions.set(
        employees.data.items.map((e) => ({
          id: e.id,
          fullNameEn: e.fullNameEn,
          fullNameAr: e.fullNameAr,
          organizationalUnitId: e.organizationalUnitId ?? null,
        })),
      );
    }
    if (competencies.success && competencies.data) {
      this.competencyOptions.set(
        competencies.data.items.map((c) => ({ id: c.id, nameEn: c.nameEn, nameAr: c.nameAr })),
      );
    }
    if (ous.success && ous.data) {
      this.ouOptions.set(ous.data.items.map((o) => ({ id: o.id, nameEn: o.nameEn, nameAr: o.nameAr })));
    }
  }

  openAddModal(): void {
    if (!this.canCreate()) return;
    this.editingId.set(null);
    this.resetExpertForm();
    this.modalError.set(null);
    this.showAddModal.set(true);
    this.loadingModalData.set(true);
    this.orgApi
      .getDefault()
      .pipe(
        switchMap((orgRes) => {
          const orgId = orgRes.success && orgRes.data?.id ? orgRes.data.id : undefined;
          return forkJoin({
            employees: this.employeesApi.getPaged({ page: 1, pageSize: 500 }),
            competencies: this.competenciesApi.getPaged({ page: 1, pageSize: 500, isActive: true }),
            ous: this.ouApi.getPaged({ page: 1, pageSize: 500, organizationId: orgId }),
          });
        }),
      )
      .subscribe({
        next: ({ employees, competencies, ous }) => {
          this.loadingModalData.set(false);
          this.applyModalCatalogue(employees, competencies, ous);
        },
        error: () => {
          this.loadingModalData.set(false);
          this.modalError.set(this.translate.instant('dialog.error'));
        },
      });
  }

  openEditModal(item: InternalExpertListDto): void {
    if (!this.canEdit()) return;
    this.editingId.set(null);
    this.resetExpertForm();
    this.modalError.set(null);
    this.showAddModal.set(true);
    this.loadingModalData.set(true);
    this.orgApi
      .getDefault()
      .pipe(
        switchMap((orgRes) => {
          const orgId = orgRes.success && orgRes.data?.id ? orgRes.data.id : undefined;
          return forkJoin({
            employees: this.employeesApi.getPaged({ page: 1, pageSize: 500 }),
            competencies: this.competenciesApi.getPaged({ page: 1, pageSize: 500, isActive: true }),
            ous: this.ouApi.getPaged({ page: 1, pageSize: 500, organizationId: orgId }),
            expert: this.api.getExpertById(item.id),
          });
        }),
      )
      .subscribe({
        next: ({ employees, competencies, ous, expert }) => {
          this.loadingModalData.set(false);
          this.applyModalCatalogue(employees, competencies, ous);
          if (expert.success && expert.data) {
            const d = expert.data;
            this.editingId.set(d.id);
            this.expertForm = {
              employeeId: d.employeeId,
              competencyIds: [...(d.competencyIds ?? [])],
              organizationalUnitId: d.organizationalUnitId,
              areaOfExpertiseEn: d.areaOfExpertiseEn ?? '',
              areaOfExpertiseAr: d.areaOfExpertiseAr ?? '',
              notes: d.notes ?? '',
              isActive: d.isActive,
            };
          } else {
            this.modalError.set(this.translate.instant('dialog.error'));
          }
        },
        error: () => {
          this.loadingModalData.set(false);
          this.modalError.set(this.translate.instant('dialog.error'));
        },
      });
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
    this.modalError.set(null);
    this.editingId.set(null);
  }

  resetExpertForm(): void {
    this.expertForm = {
      employeeId: null,
      competencyIds: [],
      organizationalUnitId: null,
      areaOfExpertiseEn: '',
      areaOfExpertiseAr: '',
      notes: '',
      isActive: true,
    };
  }

  onEmployeeSelected(): void {
    const id = this.expertForm.employeeId;
    if (!id) {
      this.expertForm.organizationalUnitId = null;
      return;
    }
    const e = this.employeeOptions().find((x) => x.id === id);
    this.expertForm.organizationalUnitId = e?.organizationalUnitId ?? null;
  }

  isCompetencyChecked(competencyId: string): boolean {
    return this.expertForm.competencyIds.includes(competencyId);
  }

  toggleCompetency(competencyId: string, checked: boolean): void {
    const set = new Set(this.expertForm.competencyIds);
    if (checked) set.add(competencyId);
    else set.delete(competencyId);
    this.expertForm.competencyIds = [...set];
  }

  private strOrNull(v: string): string | null {
    const t = v.trim();
    return t ? t : null;
  }

  saveExpert(): void {
    const employeeId = this.expertForm.employeeId;
    if (!employeeId) {
      this.modalError.set(this.translate.instant('validation.required'));
      return;
    }
    this.modalError.set(null);

    const editId = this.editingId();
    if (editId) {
      if (!this.canEdit()) return;
      this.saving.set(true);
      this.api
        .updateExpert(editId, {
          id: editId,
          employeeId,
          competencyIds: this.expertForm.competencyIds.length ? this.expertForm.competencyIds : undefined,
          organizationalUnitId: this.expertForm.organizationalUnitId ?? undefined,
          areaOfExpertiseEn: this.strOrNull(this.expertForm.areaOfExpertiseEn) ?? undefined,
          areaOfExpertiseAr: this.strOrNull(this.expertForm.areaOfExpertiseAr) ?? undefined,
          notes: this.strOrNull(this.expertForm.notes) ?? undefined,
          isActive: this.expertForm.isActive,
        })
        .subscribe({
          next: (res) => {
            this.saving.set(false);
            if (res.success) {
              this.toast.success(this.translate.instant('common.saved'));
              this.closeAddModal();
              this.load();
            } else {
              this.modalError.set(res.message ?? this.translate.instant('dialog.error'));
            }
          },
          error: (err) => {
            this.saving.set(false);
            this.modalError.set(err.error?.message ?? err.message ?? this.translate.instant('dialog.error'));
          },
        });
      return;
    }

    if (!this.canCreate()) return;
    this.saving.set(true);
    this.api
      .createExpert({
        employeeId,
        competencyIds: this.expertForm.competencyIds.length ? this.expertForm.competencyIds : undefined,
        organizationalUnitId: this.expertForm.organizationalUnitId ?? undefined,
        areaOfExpertiseEn: this.strOrNull(this.expertForm.areaOfExpertiseEn) ?? undefined,
        areaOfExpertiseAr: this.strOrNull(this.expertForm.areaOfExpertiseAr) ?? undefined,
        notes: this.strOrNull(this.expertForm.notes) ?? undefined,
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          if (res.success) {
            this.toast.success(this.translate.instant('common.saved'));
            this.closeAddModal();
            this.load();
          } else {
            this.modalError.set(res.message ?? this.translate.instant('dialog.error'));
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.modalError.set(err.error?.message ?? err.message ?? this.translate.instant('dialog.error'));
        },
      });
  }
}
