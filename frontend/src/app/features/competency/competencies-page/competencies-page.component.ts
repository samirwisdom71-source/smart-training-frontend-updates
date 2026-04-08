import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { PortalToBodyDirective } from '../../../shared/portal/portal-to-body.directive';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CompetenciesApiService } from '../../../core/api/competencies/competencies-api.service';
import { CompetencyFrameworksApiService } from '../../../core/api/competency-frameworks/competency-frameworks-api.service';
import { CompetencyTypesApiService } from '../../../core/api/competency-types/competency-types-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/toast/toast.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import { LocalizedTextPipe } from '../../../shared/pipes/localized-text.pipe';
import type { CompetencyListDto, CreateCompetencyRequest, UpdateCompetencyRequest } from '../../../core/api/competencies/competencies-api.models';
import type { CompetencyFrameworkListDto } from '../../../core/api/competency-frameworks/competency-frameworks-api.models';
import type { CompetencyTypeListDto } from '../../../core/api/competency-types/competency-types-api.models';
import type { PagedResult } from '../../../core/models/api-response';

@Component({
  selector: 'app-competencies-page',
  standalone: true,

  imports: [
    FormsModule,
    TranslateModule,
    PageShellComponent,
    ConfirmDialogComponent,
    TooltipDirective,
    PortalToBodyDirective,
    LocalizedTextPipe,
    PaginationComponent,
  ],
  templateUrl: './competencies-page.component.html',
  styleUrls: ['./competencies-page.component.scss'],
    
})
export class CompetenciesPageComponent implements OnInit {
  private readonly api = inject(CompetenciesApiService);
  private readonly frameworkApi = inject(CompetencyFrameworksApiService);
  private readonly typeApi = inject(CompetencyTypesApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  readonly data = signal<PagedResult<CompetencyListDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  search = '';
  frameworkIdFilter: string | null = null;
  competencyTypeIdFilter: string | null = null;
  isActiveFilter: boolean | null = null;
  searchDebounce: ReturnType<typeof setTimeout> | null = null;

  readonly frameworkOptions = signal<CompetencyFrameworkListDto[]>([]);
  readonly typeOptions = signal<CompetencyTypeListDto[]>([]);
  readonly showModal = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly modalError = signal<string | null>(null);

  readonly showConfirm = signal(false);
  readonly toDelete = signal<CompetencyListDto | null>(null);

  /** Blocks openCreate/openEdit briefly after dismiss — avoids click-through reopening the portaled modal. */
  private suppressCompetencyModalOpenUntil = 0;

  form: CreateCompetencyRequest = {
    code: '',
    nameEn: '',
    nameAr: '',
    descriptionEn: null,
    descriptionAr: null,
    competencyTypeId: '',
    frameworkId: '',
    category: null,
    displayOrder: 0,
  };

  canCreate = () => this.auth.hasPermission(PermissionCodes.competency.create);
  canEdit = () => this.auth.hasPermission(PermissionCodes.competency.edit);
  canDelete = () => this.auth.hasPermission(PermissionCodes.competency.delete);

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.competency') }, { label: this.translate.instant('nav.competencies') }]);

  displayName(nameEn: string | null | undefined, nameAr: string | null | undefined): string {
    const lang = this.translate.currentLang ?? 'en';
    const primary = (lang === 'ar' ? nameAr : nameEn) ?? '';
    const fallback = (lang === 'ar' ? nameEn : nameAr) ?? '';
    const value = primary.trim() || fallback.trim();
    return value || '—';
  }

  ngOnInit(): void {
    this.loadFrameworkOptions();
    this.loadTypeOptions(null);
    this.load();
  }

  confirmDelete(c: CompetencyListDto): void {
    this.toDelete.set(c);
    this.showConfirm.set(true);
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
    this.toDelete.set(null);
  }

  deleteConfirmMessage = computed(() => {
    const c = this.toDelete();
    if (!c) return '';
    return this.translate.instant('dialog.confirmDelete');
  });

  doDelete(): void {
    const target = this.toDelete();
    if (!target) return;
    this.showConfirm.set(false);
    this.api.delete(target.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(this.translate.instant('common.deleted'));
          this.load();
        } else {
          this.toast.error(res.message || this.translate.instant('dialog.error'));
        }
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? err.message ?? this.translate.instant('dialog.error'));
      },
    });
  }

  loadFrameworkOptions(): void {
    this.frameworkApi.getPaged({ page: 1, pageSize: 500, isActive: true }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.frameworkOptions.set(res.data.items);
      },
    });
  }

  loadTypeOptions(frameworkId: string | null): void {
    if (!frameworkId) {
      this.typeApi.getPaged({ page: 1, pageSize: 500, isActive: true }).subscribe({
        next: (res) => {
          if (res.success && res.data) this.typeOptions.set(res.data.items);
        },
      });
      return;
    }
    this.typeApi.getPaged({ page: 1, pageSize: 500, frameworkId, isActive: true }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.typeOptions.set(res.data.items);
      },
    });
  }

  onFrameworkChange(): void {
    this.loadTypeOptions(this.form.frameworkId || null);
    if (!this.editingId()) this.form.competencyTypeId = this.typeOptions()[0]?.id ?? '';
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getPaged({
      page: this.page(),
      pageSize: this.pageSize,
      search: this.search || undefined,
      frameworkId: this.frameworkIdFilter ?? undefined,
      competencyTypeId: this.competencyTypeIdFilter ?? undefined,
      isActive: this.isActiveFilter ?? undefined,
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
    this.frameworkIdFilter = null;
    this.competencyTypeIdFilter = null;
    this.isActiveFilter = null;
    this.page.set(1);
    this.load();
  }

  prevPage(): void { this.page.update(p => Math.max(1, p - 1)); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }
  setPage(p: number): void { this.page.set(p); this.load(); }

  openCreate(): void {
    if (Date.now() < this.suppressCompetencyModalOpenUntil) return;
    this.editingId.set(null);
    const fw = this.frameworkOptions()[0];
    const types = this.typeOptions();
    const firstType = types.find(t => t.frameworkId === fw?.id) ?? types[0];
    this.form = {
      code: '', nameEn: '', nameAr: '', descriptionEn: null, descriptionAr: null,
      competencyTypeId: firstType?.id ?? '', frameworkId: fw?.id ?? '', category: null, displayOrder: 0,
    };
    this.modalError.set(null);
    this.showModal.set(true);
  }

  openEdit(c: CompetencyListDto): void {
    if (Date.now() < this.suppressCompetencyModalOpenUntil) return;
    this.editingId.set(c.id);
    this.form = {
      code: c.code, nameEn: c.nameEn, nameAr: c.nameAr, descriptionEn: null, descriptionAr: null,
      competencyTypeId: c.competencyTypeId, frameworkId: c.frameworkId, category: c.category ?? null, displayOrder: c.displayOrder,
    };
    this.modalError.set(null);
    this.showModal.set(true);
    this.api.getById(c.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.form = {
            code: res.data.code,
            nameEn: res.data.nameEn,
            nameAr: res.data.nameAr,
            descriptionEn: res.data.descriptionEn ?? null,
            descriptionAr: res.data.descriptionAr ?? null,
            competencyTypeId: res.data.competencyTypeId,
            frameworkId: res.data.frameworkId,
            category: res.data.category ?? null,
            displayOrder: res.data.displayOrder,
          };
        }
      },
    });
  }

  closeModal(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    (event as MouseEvent | undefined)?.stopImmediatePropagation?.();
    this.suppressCompetencyModalOpenUntil = Date.now() + 400;
    this.showModal.set(false);
    this.editingId.set(null);
  }

  save(): void {
    this.modalError.set(null);
    const id = this.editingId();
    if (id) {
      this.saving.set(true);
      this.api.update(id, { code: this.form.code, nameEn: this.form.nameEn, nameAr: this.form.nameAr, descriptionEn: this.form.descriptionEn, descriptionAr: this.form.descriptionAr, category: this.form.category, displayOrder: this.form.displayOrder }).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    } else {
      if (!this.form.code?.trim() || !this.form.nameEn?.trim() || !this.form.frameworkId || !this.form.competencyTypeId) {
        this.modalError.set(this.translate.instant('validation.required'));
        return;
      }
      this.saving.set(true);
      this.api.create(this.form).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.load(); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    }
  }

  setStatus(c: CompetencyListDto): void {
    this.api.setStatus(c.id, { isActive: !c.isActive }).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err.error?.message ?? err.message ?? 'Failed to set status'),
    });
  }
}
