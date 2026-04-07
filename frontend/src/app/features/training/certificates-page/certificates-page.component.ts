import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { CertificatesApiService } from '../../../core/api/certificates/certificates-api.service';
import { TrainingProgramsApiService } from '../../../core/api/training-programs/training-programs-api.service';
import { EmployeesApiService } from '../../../core/api/employees/employees-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import type { CertificateListDto } from '../../../core/api/certificates/certificates-api.models';
import type { PagedResult } from '../../../core/models/api-response';
import type { ApiResponse } from '../../../core/models/api-response';
import type { CertificateDto } from '../../../core/api/certificates/certificates-api.models';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { PortalToBodyDirective } from '../../../shared/portal/portal-to-body.directive';

export interface CertificateGenerateRow {
  id: string;
  name: string;
  disabled: boolean;
  hintKey?: string;
}

@Component({
  selector: 'app-certificates-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, DatePipe, TooltipDirective, PageShellComponent, PortalToBodyDirective],
  templateUrl: './certificates-page.component.html',
  styleUrls: ['./certificates-page.component.scss'],
})
export class CertificatesPageComponent implements OnInit {
  private readonly api = inject(CertificatesApiService);
  private readonly programsApi = inject(TrainingProgramsApiService);
  private readonly employeesApi = inject(EmployeesApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly data = signal<PagedResult<CertificateListDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  search = '';
  employeeIdFilter: string | null = null;
  programIdFilter: string | null = null;

  readonly programOptions = signal<{ id: string; titleEn: string; titleAr: string }[]>([]);
  readonly employeeOptions = signal<{ id: string; fullNameEn: string; fullNameAr: string }[]>([]);
  readonly showGenerateModal = signal(false);
  generateProgramIdVal: string | null = null;
  readonly generateRows = signal<CertificateGenerateRow[]>([]);
  readonly generateSelectedIds = signal<string[]>([]);
  readonly generateLoading = signal(false);
  readonly saving = signal(false);
  readonly generateError = signal<string | null>(null);
  readonly uploadingId = signal<string | null>(null);
  readonly uploadError = signal<string | null>(null);

  readonly eligibleGenerateRows = computed(() => this.generateRows().filter((r) => !r.disabled));

  readonly allEligibleGenerateSelected = computed(() => {
    const eligible = this.eligibleGenerateRows();
    if (!eligible.length) return false;
    const sel = new Set(this.generateSelectedIds());
    return eligible.every((r) => sel.has(r.id));
  });

  canManage = () => this.auth.hasPermission(PermissionCodes.certificate.manage);
  breadcrumbs = computed(() => [{ label: this.translate.instant('certificates.title') }]);

  ngOnInit(): void {
    this.programsApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.programOptions.set(res.data.items.map((p) => ({ id: p.id, titleEn: p.titleEn, titleAr: p.titleAr })));
        }
      },
    });
    if (this.canManage()) {
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
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getPaged({
        page: this.page(),
        pageSize: this.pageSize,
        employeeId: this.employeeIdFilter ?? undefined,
        programId: this.programIdFilter ?? undefined,
        search: this.search || undefined,
      })
      .subscribe({
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
    this.search = '';
    this.employeeIdFilter = null;
    this.programIdFilter = null;
    this.page.set(1);
    this.load();
  }
  prevPage(): void {
    this.page.update((p) => Math.max(1, p - 1));
    this.load();
  }
  nextPage(): void {
    this.page.update((p) => p + 1);
    this.load();
  }

  openGenerate(): void {
    this.generateProgramIdVal = null;
    this.generateRows.set([]);
    this.generateSelectedIds.set([]);
    this.generateError.set(null);
    this.showGenerateModal.set(true);
  }

  closeGenerateModal(): void {
    this.showGenerateModal.set(false);
  }

  onGenerateProgramChange(): void {
    const pid = this.generateProgramIdVal;
    this.generateError.set(null);
    if (!pid) {
      this.generateRows.set([]);
      this.generateSelectedIds.set([]);
      return;
    }
    this.refreshGenerateRows(pid, []);
  }

  /** Reload eligible employees for the generate modal; optionally keep selection for these ids if still eligible. */
  private refreshGenerateRows(programId: string, keepSelectedIfEligible: string[]): void {
    this.generateLoading.set(true);
    this.api.getGenerationRecipients(programId).subscribe({
      next: (res) => {
        this.generateLoading.set(false);
        if (!res.success || !res.data) {
          this.generateError.set(res.message ?? this.translate.instant('empty.tryAgain'));
          this.generateRows.set([]);
          this.generateSelectedIds.set([]);
          return;
        }
        const rows: CertificateGenerateRow[] = res.data.map((d) => ({
          id: d.employeeId,
          name: d.employeeNameEn || d.employeeId,
          disabled: !d.eligible,
          hintKey: d.ineligibilityHintKey ?? undefined,
        }));
        this.generateRows.set(rows);
        const eligible = new Set(rows.filter((r) => !r.disabled).map((r) => r.id));
        const nextSel = keepSelectedIfEligible.filter((id) => eligible.has(id));
        this.generateSelectedIds.set(nextSel);
      },
      error: (err) => {
        this.generateLoading.set(false);
        this.generateError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Failed');
        this.generateRows.set([]);
        this.generateSelectedIds.set([]);
      },
    });
  }

  isGenerateSelected(id: string): boolean {
    return this.generateSelectedIds().includes(id);
  }

  toggleGenerateParticipant(id: string, checked: boolean): void {
    const row = this.generateRows().find((r) => r.id === id);
    if (!row || row.disabled) return;
    const set = new Set(this.generateSelectedIds());
    if (checked) set.add(id);
    else set.delete(id);
    this.generateSelectedIds.set([...set]);
  }

  onGenerateSelectAllChange(checked: boolean): void {
    if (checked) {
      this.generateSelectedIds.set(this.eligibleGenerateRows().map((r) => r.id));
    } else {
      this.generateSelectedIds.set([]);
    }
  }

  runGenerate(): void {
    const programId = this.generateProgramIdVal;
    const ids = this.generateSelectedIds();
    if (!programId) {
      this.generateError.set(this.translate.instant('validation.required'));
      return;
    }
    if (!ids.length) {
      this.generateError.set(this.translate.instant('certificates.selectAtLeastOne'));
      return;
    }
    this.saving.set(true);
    this.generateError.set(null);

    const requests = ids.map((employeeId) =>
      this.api.generate({ trainingProgramId: programId, employeeId }).pipe(
        map((res: ApiResponse<CertificateDto>) => ({
          ok: res.success !== false,
          employeeId,
          message: res.success === false ? res.message : undefined,
        })),
        catchError((err) =>
          of({
            ok: false,
            employeeId,
            message: (err.error?.errors?.[0] ?? err.error?.message ?? 'Failed') as string,
          }),
        ),
      ),
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        this.saving.set(false);
        const failed = results.filter((r) => !r.ok);
        const ok = results.length - failed.length;
        if (ok === results.length) {
          this.closeGenerateModal();
          this.load();
          return;
        }
        if (ok > 0) {
          const nameById = new Map(this.generateRows().map((r) => [r.id, r.name]));
          const failDetail = failed
            .map((f) => `${nameById.get(f.employeeId) ?? f.employeeId}: ${f.message}`)
            .join(' · ');
          this.generateError.set(
            this.translate.instant('certificates.bulkGeneratePartial', { ok, fail: failDetail }),
          );
          const failedIds = failed.map((f) => f.employeeId);
          this.refreshGenerateRows(programId, failedIds);
          this.load();
        } else {
          const nameById = new Map(this.generateRows().map((r) => [r.id, r.name]));
          const failDetail = failed
            .map((f) => `${nameById.get(f.employeeId) ?? f.employeeId}: ${f.message}`)
            .join(' · ');
          this.generateError.set(failDetail);
        }
      },
      error: () => {
        this.saving.set(false);
        this.generateError.set('Failed');
      },
    });
  }

  downloadAttachment(filePath: string | null | undefined): void {
    if (!filePath) return;
    const link = document.createElement('a');
    link.href = this.api.fileUrl(filePath);
    link.download = '';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  onUploadSelected(row: CertificateListDto, ev: Event): void {
    if (!this.canManage()) return;
    const input = ev.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    this.uploadError.set(null);
    this.uploadingId.set(row.id);
    this.api.uploadFile(row.id, file).subscribe({
      next: (res) => {
        this.uploadingId.set(null);
        if (res.success && res.data?.filePath) {
          const d = this.data();
          if (d) {
            this.data.set({
              ...d,
              items: d.items.map((x) => (x.id === row.id ? { ...x, filePath: res.data!.filePath } : x)),
            });
          }
        } else {
          this.uploadError.set(res.message ?? 'Upload failed');
        }
        if (input) input.value = '';
      },
      error: (err) => {
        this.uploadingId.set(null);
        this.uploadError.set(err.error?.errors?.[0] ?? err.error?.message ?? err.message ?? 'Upload failed');
        if (input) input.value = '';
      },
    });
  }

  getLocalizedText(ar?: string | null, en?: string | null): string {
    const lang = (this.translate.currentLang || this.translate.getDefaultLang() || 'en').toLowerCase();
    const arText = ar?.trim() ?? '';
    const enText = en?.trim() ?? '';
    if (lang.startsWith('ar')) return arText || enText || '—';
    return enText || arText || '—';
  }

  localizedProgramTitle(programId: string, fallbackEn: string): string {
    const p = this.programOptions().find((x) => x.id === programId);
    if (p) return this.getLocalizedText(p.titleAr, p.titleEn);
    return fallbackEn?.trim() || '—';
  }

  localizedEmployeeName(employeeId: string, fallbackEn: string): string {
    const e = this.employeeOptions().find((x) => x.id === employeeId);
    if (e) return this.getLocalizedText(e.fullNameAr, e.fullNameEn);
    return fallbackEn?.trim() || '—';
  }

  hintText(row: CertificateGenerateRow): string {
    return row.hintKey ? this.translate.instant(row.hintKey) : '';
  }
}
