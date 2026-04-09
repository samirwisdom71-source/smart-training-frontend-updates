import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { AttendanceApiService } from '../../../core/api/attendance/attendance-api.service';
import { TrainingProgramsApiService } from '../../../core/api/training-programs/training-programs-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import type { AttendanceRecordDto, BulkAttendanceItemDto } from '../../../core/api/attendance/attendance-api.models';
import type { TrainingSessionDto } from '../../../core/api/training-programs/training-programs-api.models';
import {
  DataViewPreferenceService,
  DataViewToggleComponent,
  LuxDataCardComponent,
  LuxDataCardGridComponent,
} from '../../../shared/data-view';

@Component({
  selector: 'app-attendance-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    DatePipe,
    DecimalPipe,
    NgClass,
    RouterLink,
    PageShellComponent,
    TooltipDirective,
    DataViewToggleComponent,
    LuxDataCardComponent,
    LuxDataCardGridComponent,
  ],
  templateUrl: './attendance-page.component.html',
  styleUrls: ['./attendance-page.component.scss'],
})
export class AttendancePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AttendanceApiService);
  private readonly programsApi = inject(TrainingProgramsApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  readonly dataViewPref = inject(DataViewPreferenceService);

  readonly programOptions = signal<{ id: string; titleEn: string; titleAr: string }[]>([]);
  readonly sessions = signal<TrainingSessionDto[]>([]);
  selectedProgramId: string | null = null;
  selectedSessionId: string | null = null;

  readonly records = signal<AttendanceRecordDto[]>([]);
  readonly loading = signal(false);

  /** Present / absent / late counts for the currently loaded session only (from roster rows). */
  readonly sessionStats = computed(() => {
    const list = this.records();
    let present = 0;
    let absent = 0;
    let late = 0;
    for (const r of list) {
      switch (r.attendanceStatus) {
        case 'Present':
          present++;
          break;
        case 'Absent':
          absent++;
          break;
        case 'Late':
          late++;
          break;
        default:
          break;
      }
    }
    return {
      participants: list.length,
      presentCount: present,
      absentCount: absent,
      lateCount: late,
    };
  });
  readonly error = signal<string | null>(null);

  readonly saving = signal(false);
  /** Same status applied to every row when using "Apply to all" (local only until Save). */
  bulkStatus = 'Present';
  readonly saveSuccess = signal(false);
  readonly uploadingProgram = signal(false);
  /** Program-level attendance file (applies to all sessions). */
  readonly programAttendancePath = signal<string | null>(null);
  readonly uploadError = signal<string | null>(null);
  readonly backProgramId = signal<string | null>(null);

  canManage = () => this.auth.hasPermission(PermissionCodes.attendance.manage);
  breadcrumbs = computed(() => [{ label: this.translate.instant('attendance.title') }]);

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap.get('programId');
    if (qp) {
      this.selectedProgramId = qp;
      this.backProgramId.set(qp);
    }

    this.programsApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.programOptions.set(res.data.items.map(p => ({ id: p.id, titleEn: p.titleEn, titleAr: p.titleAr })));
          if (this.selectedProgramId) {
            this.onProgramChange();
          }
        }
      },
    });
  }

  onProgramChange(): void {
    this.sessions.set([]);
    this.selectedSessionId = null;
    this.records.set([]);
    this.saveSuccess.set(false);
    this.programAttendancePath.set(null);
    this.uploadError.set(null);
    if (this.selectedProgramId) {
      this.programsApi.getById(this.selectedProgramId).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.sessions.set(res.data.sessions ?? []);
            this.programAttendancePath.set(res.data.attendanceEvidencePath ?? null);
          }
        },
      });
    }
  }

  onSessionChange(): void {
    this.records.set([]);
    this.saveSuccess.set(false);
    this.uploadError.set(null);
    if (this.selectedSessionId) this.loadSession();
  }

  loadSession(): void {
    if (!this.selectedSessionId) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.getBySession(this.selectedSessionId).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) this.records.set(res.data);
        else this.error.set(res.message ?? 'Failed to load');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? err.message ?? 'Failed to load');
      },
    });
  }

  /** Update chosen status locally; use Save to persist all rows at once. */
  patchRecordStatus(recordId: string, status: string): void {
    if (!this.canManage()) return;
    this.records.update((list) =>
      list.map((r) => (r.id === recordId ? { ...r, attendanceStatus: status } : r)),
    );
  }

  /** Set every row to `bulkStatus` in the UI only. */
  applyBulkToAll(): void {
    if (!this.canManage() || !this.records().length) return;
    const status = this.bulkStatus;
    this.records.update((list) => list.map((r) => ({ ...r, attendanceStatus: status })));
  }

  /** Persist all rows for this session (matches each student's dropdown). */
  saveAttendance(): void {
    if (!this.selectedSessionId || !this.canManage()) return;
    const items: BulkAttendanceItemDto[] = this.records().map((r) => ({
      employeeId: r.employeeId,
      attendanceStatus: r.attendanceStatus,
      attendancePercent: r.attendancePercent,
      notes: r.notes,
    }));
    this.saving.set(true);
    this.saveSuccess.set(false);
    this.error.set(null);
    this.api.bulkMark(this.selectedSessionId, { trainingSessionId: this.selectedSessionId, items }).subscribe({
      next: () => {
        this.saving.set(false);
        this.saveSuccess.set(true);
        this.loadSession();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'Failed');
      },
    });
  }

  downloadAttachment(filePath: string | null | undefined): void {
    if (!filePath) return;
    this.api.downloadStoredFile(filePath).subscribe({
      next: () => this.uploadError.set(null),
      error: () => {
        this.uploadError.set(this.translate.instant('attendance.downloadFailed'));
      },
    });
  }

  onProgramAttendanceUploadSelected(ev: Event): void {
    if (!this.canManage() || !this.selectedProgramId) return;
    const input = ev.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    this.uploadError.set(null);
    this.uploadingProgram.set(true);
    this.api.uploadProgramAttendanceFile(this.selectedProgramId, file).subscribe({
      next: (res) => {
        this.uploadingProgram.set(false);
        if (res.success && res.data?.filePath) {
          this.programAttendancePath.set(res.data.filePath);
        } else {
          this.uploadError.set(res.message ?? 'Upload failed');
        }
        if (input) input.value = '';
      },
      error: (err) => {
        this.uploadingProgram.set(false);
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

  /** ngx-translate key for API attendance status values (Present, Absent, …). */
  attendanceStatusKey(status: string | null | undefined): string {
    const s = (status ?? '').trim();
    const map: Record<string, string> = {
      Present: 'attendance.present',
      Absent: 'attendance.absent',
      Late: 'attendance.late',
      Excused: 'attendance.excused',
      Unknown: 'attendance.unknown',
    };
    return map[s] ?? 'attendance.unknown';
  }

  /** CSS modifier for status pill (present, absent, …). */
  attendanceStatusModifier(status: string | null | undefined): string {
    const key = (status ?? 'Unknown').trim().toLowerCase();
    const allowed = ['present', 'absent', 'late', 'excused', 'unknown'];
    return allowed.includes(key) ? key : 'unknown';
  }

  programLabel(): string {
    if (!this.selectedProgramId) return '';
    const p = this.programOptions().find((x) => x.id === this.selectedProgramId);
    return p ? this.getLocalizedText(p.titleAr, p.titleEn) : '';
  }

  sessionLabel(): string {
    if (!this.selectedSessionId) return '';
    const s = this.sessions().find((x) => x.id === this.selectedSessionId);
    return s ? this.getLocalizedText(s.titleAr, s.titleEn) : '';
  }

  selectedSessionStart(): string | null {
    const s = this.sessions().find((x) => x.id === this.selectedSessionId);
    return s?.startDateTime ?? null;
  }
}
