import { Component, ElementRef, OnInit, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { KnowledgeApiService } from '../../../core/api/knowledge/knowledge-api.service';
import type { KnowledgeAssetListDto, KnowledgeAssetDto } from '../../../core/api/knowledge/knowledge-api.models';
import { CompetencyFrameworksApiService } from '../../../core/api/competency-frameworks/competency-frameworks-api.service';
import type { CompetencyFrameworkListDto } from '../../../core/api/competency-frameworks/competency-frameworks-api.models';
import type { ApiResponse, PagedResult } from '../../../core/models/api-response';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import { ToastService } from '../../../core/toast/toast.service';

@Component({
  selector: 'app-knowledge-library-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, PageShellComponent, ConfirmDialogComponent],
  templateUrl: './knowledge-library-page.component.html',
  styleUrls: ['./knowledge-library-page.component.scss'],
})
export class KnowledgeLibraryPageComponent implements OnInit {
  private static readonly guidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private readonly api = inject(KnowledgeApiService);
  private readonly competencyFrameworksApi = inject(CompetencyFrameworksApiService);
  private readonly translate = inject(TranslateService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  @ViewChild('fileInput') private fileInputRef?: ElementRef<HTMLInputElement>;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<KnowledgeAssetListDto[]>([]);
  readonly totalCount = signal(0);
  page = 1;
  pageSize = 20;
  search = '';
  /** Filter by competency framework id (stored in `category` on the API). */
  categoryFilter = '';
  isActive: boolean | null = true;

  readonly frameworks = signal<CompetencyFrameworkListDto[]>([]);

  readonly showConfirm = signal(false);
  readonly toDelete = signal<KnowledgeAssetListDto | null>(null);
  readonly deleting = signal(false);

  readonly showAddModal = signal(false);
  readonly saving = signal(false);
  readonly modalError = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly loadedDetail = signal<KnowledgeAssetDto | null>(null);
  readonly loadingDetail = signal(false);
  readonly selectedFileName = signal<string | null>(null);

  selectedFile: File | null = null;

  assetForm = {
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    category: '',
    tags: '',
    isActive: true,
  };

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.knowledgeLibrary') }]);

  canCreate = () => this.auth.hasPermission(PermissionCodes.knowledge.create);
  canEdit = () => this.auth.hasPermission(PermissionCodes.knowledge.edit);
  canDelete = () => this.auth.hasPermission(PermissionCodes.knowledge.delete);
  deleteConfirmMessage = computed(() => this.translate.instant('dialog.confirmDelete'));

  ngOnInit(): void {
    this.loadFrameworks();
    this.load();
  }

  loadFrameworks(): void {
    this.competencyFrameworksApi.getPaged({ page: 1, pageSize: 500, isActive: true }).subscribe({
      next: (res: ApiResponse<PagedResult<CompetencyFrameworkListDto>>) => {
        if (res.success && res.data?.items) this.frameworks.set(res.data.items);
      },
    });
  }

  frameworkLabel(f: CompetencyFrameworkListDto): string {
    const lang = this.translate.currentLang || 'en';
    return lang === 'ar' && f.nameAr ? f.nameAr : f.nameEn;
  }

  /** Resolve stored `category` (framework id or legacy free text) for display. */
  categoryDisplay(raw: string | null | undefined): string {
    if (!raw?.trim()) return '—';
    const v = raw.trim();
    if (KnowledgeLibraryPageComponent.guidRe.test(v)) {
      const f = this.frameworks().find((x) => x.id.toLowerCase() === v.toLowerCase());
      if (f) return this.frameworkLabel(f);
    }
    return v;
  }

  /** Options for the asset modal: frameworks plus a row if the stored value is not in the loaded list (legacy text or removed framework). */
  modalCategorySelectOptions(): { value: string; label: string }[] {
    const out = this.frameworks().map((f) => ({ value: f.id, label: this.frameworkLabel(f) }));
    const cat = this.assetForm.category?.trim();
    if (!cat || out.some((o) => o.value === cat)) return out;
    const isGuid = KnowledgeLibraryPageComponent.guidRe.test(cat);
    const legacy = this.translate.instant('knowledge.legacyCategory');
    const label = isGuid ? `${cat.slice(0, 8)}… (${legacy})` : `${cat} (${legacy})`;
    return [{ value: cat, label }, ...out];
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getAssetsPaged({
        page: this.page,
        pageSize: this.pageSize,
        category: this.categoryFilter || undefined,
        search: this.search || undefined,
        isActive: this.isActive ?? undefined,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success && res.data) {
            this.items.set(res.data.items);
            this.totalCount.set(res.data.totalCount);
          } else {
            this.error.set('Failed to load');
          }
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Failed to load');
        },
      });
  }

  title(item: KnowledgeAssetListDto): string {
    const lang = this.translate.currentLang || 'en';
    return lang === 'ar' && item.titleAr ? item.titleAr : item.titleEn;
  }

  confirmDelete(item: KnowledgeAssetListDto): void {
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
    this.api.deleteAsset(target.id).subscribe({
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

  openAddModal(): void {
    if (!this.canCreate()) return;
    this.editingId.set(null);
    this.loadedDetail.set(null);
    this.loadingDetail.set(false);
    this.resetAssetForm();
    this.clearFileSelection();
    this.modalError.set(null);
    this.showAddModal.set(true);
  }

  openEditModal(item: KnowledgeAssetListDto): void {
    if (!this.canEdit()) return;
    this.editingId.set(null);
    this.loadedDetail.set(null);
    this.resetAssetForm();
    this.clearFileSelection();
    this.modalError.set(null);
    this.loadingDetail.set(true);
    this.showAddModal.set(true);

    this.api.getAssetById(item.id).subscribe({
      next: (res) => {
        this.loadingDetail.set(false);
        if (res.success && res.data) {
          const d = res.data;
          this.editingId.set(d.id);
          this.loadedDetail.set(d);
          this.assetForm = {
            titleEn: d.titleEn,
            titleAr: d.titleAr,
            descriptionEn: d.descriptionEn ?? '',
            descriptionAr: d.descriptionAr ?? '',
            category: d.category ?? '',
            tags: d.tags ?? '',
            isActive: d.isActive,
          };
        } else {
          this.modalError.set(this.translate.instant('dialog.error'));
        }
      },
      error: () => {
        this.loadingDetail.set(false);
        this.modalError.set(this.translate.instant('dialog.error'));
      },
    });
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
    this.modalError.set(null);
    this.editingId.set(null);
    this.loadedDetail.set(null);
    this.loadingDetail.set(false);
    this.clearFileSelection();
  }

  resetAssetForm(): void {
    this.assetForm = {
      titleEn: '',
      titleAr: '',
      descriptionEn: '',
      descriptionAr: '',
      category: '',
      tags: '',
      isActive: true,
    };
  }

  clearFileSelection(): void {
    this.selectedFile = null;
    this.selectedFileName.set(null);
    const el = this.fileInputRef?.nativeElement;
    if (el) el.value = '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    this.selectedFile = f;
    this.selectedFileName.set(f?.name ?? null);
  }

  private strOrNull(v: string): string | null {
    const t = v.trim();
    return t ? t : null;
  }

  private finishSaveSuccess(): void {
    this.saving.set(false);
    this.toast.success(this.translate.instant('common.saved'));
    this.closeAddModal();
    this.load();
  }

  saveAsset(): void {
    const titleEn = this.assetForm.titleEn.trim();
    const titleAr = this.assetForm.titleAr.trim();
    if (!titleEn || !titleAr) {
      this.modalError.set(this.translate.instant('validation.required'));
      return;
    }
    this.modalError.set(null);

    const editId = this.editingId();
    if (editId) {
      const detail = this.loadedDetail();
      if (!detail) return;
      this.saving.set(true);
      this.api
        .updateAsset(editId, {
          id: editId,
          titleEn,
          titleAr,
          descriptionEn: this.strOrNull(this.assetForm.descriptionEn),
          descriptionAr: this.strOrNull(this.assetForm.descriptionAr),
          category: this.strOrNull(this.assetForm.category),
          tags: this.strOrNull(this.assetForm.tags),
          filePath: detail.filePath,
          fileName: detail.fileName,
          contentType: detail.contentType,
          fileSizeBytes: detail.fileSizeBytes,
          isActive: this.assetForm.isActive,
        })
        .subscribe({
          next: (res) => {
            if (!res.success) {
              this.saving.set(false);
              this.modalError.set(res.message ?? this.translate.instant('dialog.error'));
              return;
            }
            const file = this.selectedFile;
            if (file) {
              this.api.uploadKnowledgeAssetFile(editId, file).subscribe({
                next: (up) => {
                  if (up.success) this.finishSaveSuccess();
                  else {
                    this.saving.set(false);
                    this.modalError.set(up.message ?? this.translate.instant('dialog.error'));
                  }
                },
                error: (err) => {
                  this.saving.set(false);
                  this.modalError.set(err.error?.message ?? err.message ?? this.translate.instant('dialog.error'));
                },
              });
            } else {
              this.finishSaveSuccess();
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
    const fd = new FormData();
    fd.append('titleEn', titleEn);
    fd.append('titleAr', titleAr);
    const dEn = this.strOrNull(this.assetForm.descriptionEn);
    if (dEn) fd.append('descriptionEn', dEn);
    const dAr = this.strOrNull(this.assetForm.descriptionAr);
    if (dAr) fd.append('descriptionAr', dAr);
    const cat = this.strOrNull(this.assetForm.category);
    if (cat) fd.append('category', cat);
    const tags = this.strOrNull(this.assetForm.tags);
    if (tags) fd.append('tags', tags);
    if (this.selectedFile) fd.append('file', this.selectedFile, this.selectedFile.name);

    this.api.createAssetWithFile(fd).subscribe({
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
