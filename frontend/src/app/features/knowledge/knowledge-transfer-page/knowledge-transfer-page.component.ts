import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { KnowledgeApiService } from '../../../core/api/knowledge/knowledge-api.service';
import { EmployeesApiService } from '../../../core/api/employees/employees-api.service';
import type { KnowledgeTransferListDto, KnowledgeTransferDto } from '../../../core/api/knowledge/knowledge-api.models';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import { ToastService } from '../../../core/toast/toast.service';

@Component({
  selector: 'app-knowledge-transfer-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, PageShellComponent, ConfirmDialogComponent, TooltipDirective],
  templateUrl: './knowledge-transfer-page.component.html',
  styleUrls: ['./knowledge-transfer-page.component.scss'],
})
export class KnowledgeTransferPageComponent implements OnInit {
  private readonly api = inject(KnowledgeApiService);
  private readonly employeesApi = inject(EmployeesApiService);
  private readonly translate = inject(TranslateService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<KnowledgeTransferListDto[]>([]);
  page = 1;
  pageSize = 20;
  search = '';

  readonly showConfirm = signal(false);
  readonly toDelete = signal<KnowledgeTransferListDto | null>(null);
  readonly deleting = signal(false);

  readonly showAddModal = signal(false);
  readonly saving = signal(false);
  readonly modalError = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly loadedDetail = signal<KnowledgeTransferDto | null>(null);
  readonly loadingDetail = signal(false);
  /** All employees — recipients (to) and edit "to" dropdown. */
  readonly employeeOptions = signal<{ id: string; fullNameEn: string; fullNameAr: string }[]>([]);
  /** Loaded on page init for localized names in the main table (list API returns English only). */
  readonly tableEmployeeLookup = signal<{ id: string; fullNameEn: string; fullNameAr: string }[]>([]);
  /** Internal experts only — transferring employee (from). */
  readonly fromExpertOptions = signal<{ id: string; fullNameEn: string; fullNameAr: string }[]>([]);
  readonly loadingModalEmployees = signal(false);
  /** When creating: multiple recipients. */
  readonly selectedToEmployeeIds = signal<Set<string>>(new Set());

  readonly transferStatusOptions: { value: string; labelKey: string }[] = [
    { value: 'Planned', labelKey: 'knowledge.transferStatusPlanned' },
    { value: 'InProgress', labelKey: 'knowledge.transferStatusInProgress' },
    { value: 'Completed', labelKey: 'knowledge.transferStatusCompleted' },
    { value: 'Cancelled', labelKey: 'knowledge.transferStatusCancelled' },
  ];

  transferForm = {
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    fromEmployeeId: null as string | null,
    toEmployeeId: null as string | null,
    transferDate: '',
    transferEndDate: '',
    status: 'Planned',
    notes: '',
  };

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.knowledgeTransfer') }]);
  canCreate = () => this.auth.hasPermission(PermissionCodes.knowledge.create);
  canEdit = () => this.auth.hasPermission(PermissionCodes.knowledge.edit);
  canDelete = () => this.auth.hasPermission(PermissionCodes.knowledge.delete);
  deleteConfirmMessage = computed(() => this.translate.instant('dialog.confirmDelete'));

  ngOnInit(): void {
    this.load();
    this.employeesApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.tableEmployeeLookup.set(
            res.data.items.map((e) => ({ id: e.id, fullNameEn: e.fullNameEn, fullNameAr: e.fullNameAr })),
          );
        }
      },
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getTransferPaged({ page: this.page, pageSize: this.pageSize, search: this.search || undefined }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) this.items.set(res.data.items);
        else this.error.set('Failed to load');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load');
      },
    });
  }

  title(item: KnowledgeTransferListDto): string {
    return this.getLocalizedText(item.titleAr, item.titleEn);
  }

  private getLocalizedText(ar?: string | null, en?: string | null): string {
    const lang = (this.translate.currentLang || this.translate.getDefaultLang() || 'en').toLowerCase();
    const arText = ar?.trim() ?? '';
    const enText = en?.trim() ?? '';
    if (lang.startsWith('ar')) return arText || enText || '—';
    return enText || arText || '—';
  }

  /** Resolve employee display name for table rows using cached picklist. */
  tableEmployeeDisplayName(employeeId: string | null | undefined, nameEnFallback: string | null | undefined): string {
    if (!employeeId) return nameEnFallback?.trim() || '—';
    const e = this.tableEmployeeLookup().find((x) => x.id === employeeId);
    if (e) return this.employeeLabel(e);
    return nameEnFallback?.trim() || '—';
  }

  transferStatusLabel(status: string | null | undefined): string {
    if (!status?.trim()) return '—';
    const opt = this.transferStatusOptions.find((o) => o.value === status);
    return opt ? this.translate.instant(opt.labelKey) : status;
  }

  employeeLabel(e: { fullNameEn: string; fullNameAr: string }): string {
    return this.getLocalizedText(e.fullNameAr, e.fullNameEn);
  }

  /** Value for datetime-local input from API ISO string. */
  private toDateTimeLocalValue(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  formatPeriod(item: KnowledgeTransferListDto): string {
    const a = item.transferDate;
    const b = item.transferEndDate;
    if (!a && !b) return '—';
    const fmt = (iso: string) => {
      const d = new Date(iso);
      return isNaN(d.getTime()) ? iso : d.toLocaleString();
    };
    if (a && b) return `${fmt(a)} → ${fmt(b)}`;
    return fmt(a || b || '');
  }

  recipientEmployees(): { id: string; fullNameEn: string; fullNameAr: string }[] {
    const fromId = this.transferForm.fromEmployeeId;
    const all = this.employeeOptions();
    if (!fromId) return all;
    return all.filter((e) => e.id !== fromId);
  }

  onFromEmployeeChange(): void {
    const from = this.transferForm.fromEmployeeId;
    if (from) {
      this.selectedToEmployeeIds.update((s) => {
        const n = new Set(s);
        n.delete(from);
        return n;
      });
    }
  }

  isToRecipientSelected(id: string): boolean {
    return this.selectedToEmployeeIds().has(id);
  }

  toggleToRecipient(id: string, checked: boolean): void {
    this.selectedToEmployeeIds.update((s) => {
      const n = new Set(s);
      if (checked) n.add(id);
      else n.delete(id);
      return n;
    });
  }

  allRecipientsSelected(): boolean {
    const list = this.recipientEmployees();
    if (!list.length) return false;
    const sel = this.selectedToEmployeeIds();
    return list.every((e) => sel.has(e.id));
  }

  someRecipientsSelected(): boolean {
    const list = this.recipientEmployees();
    const sel = this.selectedToEmployeeIds();
    const c = list.filter((e) => sel.has(e.id)).length;
    return c > 0 && c < list.length;
  }

  toggleSelectAllRecipients(checked: boolean): void {
    const list = this.recipientEmployees();
    if (checked) this.selectedToEmployeeIds.set(new Set(list.map((e) => e.id)));
    else this.selectedToEmployeeIds.set(new Set());
  }

  confirmDelete(item: KnowledgeTransferListDto): void {
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
    this.api.deleteTransfer(target.id).subscribe({
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
    this.selectedToEmployeeIds.set(new Set());
    this.resetTransferForm();
    this.modalError.set(null);
    this.showAddModal.set(true);
    this.loadModalPicklists();
  }

  openEditModal(item: KnowledgeTransferListDto): void {
    if (!this.canEdit()) return;
    this.editingId.set(null);
    this.loadedDetail.set(null);
    this.resetTransferForm();
    this.modalError.set(null);
    this.showAddModal.set(true);
    this.loadingDetail.set(true);
    this.loadModalPicklists(() => {
      this.api.getTransferById(item.id).subscribe({
        next: (res) => {
          this.loadingDetail.set(false);
          if (res.success && res.data) {
            const d = res.data;
            this.editingId.set(d.id);
            this.loadedDetail.set(d);
            this.transferForm = {
              titleEn: d.titleEn,
              titleAr: d.titleAr,
              descriptionEn: d.descriptionEn ?? '',
              descriptionAr: d.descriptionAr ?? '',
              fromEmployeeId: d.fromEmployeeId,
              toEmployeeId: d.toEmployeeId,
              transferDate: this.toDateTimeLocalValue(d.transferDate),
              transferEndDate: this.toDateTimeLocalValue(d.transferEndDate),
              status: d.status?.trim() || 'Planned',
              notes: d.notes ?? '',
            };
            this.ensureFromInExpertOptions(d.fromEmployeeId, d.fromEmployeeNameEn);
          } else {
            this.modalError.set(this.translate.instant('dialog.error'));
          }
        },
        error: () => {
          this.loadingDetail.set(false);
          this.modalError.set(this.translate.instant('dialog.error'));
        },
      });
    });
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
    this.modalError.set(null);
    this.editingId.set(null);
    this.loadedDetail.set(null);
    this.loadingDetail.set(false);
  }

  resetTransferForm(): void {
    this.transferForm = {
      titleEn: '',
      titleAr: '',
      descriptionEn: '',
      descriptionAr: '',
      fromEmployeeId: null,
      toEmployeeId: null,
      transferDate: '',
      transferEndDate: '',
      status: 'Planned',
      notes: '',
    };
    this.selectedToEmployeeIds.set(new Set());
  }

  /** Loads internal experts for "from" and all employees for "to" (independent so one failure does not block the other). */
  loadModalPicklists(onLoaded?: () => void): void {
    this.loadingModalEmployees.set(true);
    let remaining = 2;
    const finish = (): void => {
      remaining--;
      if (remaining <= 0) {
        this.loadingModalEmployees.set(false);
        onLoaded?.();
      }
    };

    this.api.getExpertsPaged({ page: 1, pageSize: 500, isActive: true }).subscribe({
      next: (experts) => {
        if (experts.success && experts.data?.items?.length) {
          const byEmp = new Map<string, { id: string; fullNameEn: string; fullNameAr: string }>();
          for (const x of experts.data.items) {
            if (!byEmp.has(x.employeeId)) {
              byEmp.set(x.employeeId, {
                id: x.employeeId,
                fullNameEn: x.employeeNameEn,
                fullNameAr: x.employeeNameAr ?? '',
              });
            }
          }
          this.fromExpertOptions.set(
            Array.from(byEmp.values()).sort((a, b) => a.fullNameEn.localeCompare(b.fullNameEn)),
          );
        } else {
          this.fromExpertOptions.set([]);
        }
        finish();
      },
      error: () => {
        this.fromExpertOptions.set([]);
        finish();
      },
    });

    this.employeesApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (employees) => {
        if (employees.success && employees.data) {
          this.employeeOptions.set(
            employees.data.items.map((e) => ({ id: e.id, fullNameEn: e.fullNameEn, fullNameAr: e.fullNameAr })),
          );
        }
        finish();
      },
      error: () => finish(),
    });
  }

  /** If editing and the stored "from" is not in the active experts list, append one option so the value displays. */
  private ensureFromInExpertOptions(employeeId: string | null, nameEn: string | null): void {
    if (!employeeId) return;
    const opts = this.fromExpertOptions();
    if (opts.some((o) => o.id === employeeId)) return;
    this.fromExpertOptions.update((list) =>
      [...list, { id: employeeId, fullNameEn: nameEn?.trim() || employeeId, fullNameAr: '' }].sort((a, b) =>
        a.fullNameEn.localeCompare(b.fullNameEn),
      ),
    );
  }

  private strOrNull(v: string): string | null {
    const t = v.trim();
    return t ? t : null;
  }

  private localDateTimeToIso(value: string): string | null {
    const v = value?.trim();
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  saveTransfer(): void {
    const titleEn = this.transferForm.titleEn.trim();
    const titleAr = this.transferForm.titleAr.trim();
    if (!titleEn || !titleAr) {
      this.modalError.set(this.translate.instant('validation.required'));
      return;
    }
    this.modalError.set(null);
    const startIso = this.localDateTimeToIso(this.transferForm.transferDate);
    const endIso = this.localDateTimeToIso(this.transferForm.transferEndDate);
    if (startIso && endIso && new Date(endIso) < new Date(startIso)) {
      this.modalError.set(this.translate.instant('knowledge.transferEndBeforeStart'));
      return;
    }

    const editId = this.editingId();
    if (editId) {
      if (!this.canEdit()) return;
      const detail = this.loadedDetail();
      if (!detail) return;
      this.saving.set(true);
      this.api
        .updateTransfer(editId, {
          id: editId,
          titleEn,
          titleAr,
          descriptionEn: this.strOrNull(this.transferForm.descriptionEn),
          descriptionAr: this.strOrNull(this.transferForm.descriptionAr),
          fromEmployeeId: this.transferForm.fromEmployeeId ?? undefined,
          toEmployeeId: this.transferForm.toEmployeeId ?? undefined,
          transferDate: startIso,
          transferEndDate: endIso,
          status: this.transferForm.status.trim() || null,
          notes: this.strOrNull(this.transferForm.notes),
          relatedKnowledgeAssetId: detail.relatedKnowledgeAssetId ?? undefined,
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
    const toIds = Array.from(this.selectedToEmployeeIds());
    if (toIds.length === 0) {
      this.modalError.set(this.translate.instant('knowledge.selectAtLeastOneRecipient'));
      return;
    }
    const status = this.transferForm.status.trim() || 'Planned';
    const bodyBase = {
      titleEn,
      titleAr,
      descriptionEn: this.strOrNull(this.transferForm.descriptionEn),
      descriptionAr: this.strOrNull(this.transferForm.descriptionAr),
      fromEmployeeId: this.transferForm.fromEmployeeId ?? undefined,
      transferDate: startIso,
      transferEndDate: endIso,
      status,
      notes: this.strOrNull(this.transferForm.notes),
    };
    this.saving.set(true);
    forkJoin(toIds.map((toEmployeeId) => this.api.createTransfer({ ...bodyBase, toEmployeeId }))).subscribe({
      next: (results) => {
        this.saving.set(false);
        const failed = results.find((r) => !r.success);
        if (failed) {
          this.modalError.set(failed.message ?? this.translate.instant('dialog.error'));
          return;
        }
        this.toast.success(this.translate.instant('knowledge.transfersCreatedCount', { count: toIds.length }));
        this.closeAddModal();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.modalError.set(err.error?.message ?? err.message ?? this.translate.instant('dialog.error'));
      },
    });
  }
}
