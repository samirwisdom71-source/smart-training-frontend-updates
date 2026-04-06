import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { TrainingProgramsApiService } from '../../../core/api/training-programs/training-programs-api.service';
import { ProgramEvaluationsApiService } from '../../../core/api/program-evaluations/program-evaluations-api.service';
import { LocalizedTextPipe } from '../../../shared/pipes/localized-text.pipe';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import { ToastService } from '../../../core/toast/toast.service';
import type { TrainingProgramDto, TrainingSessionDto, CreateTrainingSessionRequest, UpdateTrainingSessionRequest } from '../../../core/api/training-programs/training-programs-api.models';
import type { ProgramEvaluationSummaryDto } from '../../../core/api/program-evaluations/program-evaluations-api.models';

@Component({
  selector: 'app-program-detail-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink, DatePipe, PageShellComponent, ConfirmDialogComponent, LocalizedTextPipe],
  templateUrl: './program-detail-page.component.html',
  styleUrls: ['./program-detail-page.component.scss'],
})
export class ProgramDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(TrainingProgramsApiService);
  private readonly evaluationsApi = inject(ProgramEvaluationsApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  readonly program = signal<TrainingProgramDto | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showSessionModal = signal(false);
  readonly editingSession = signal<TrainingSessionDto | null>(null);
  readonly saving = signal(false);
  readonly modalError = signal<string | null>(null);

  readonly showConfirm = signal(false);
  readonly toDeleteSession = signal<TrainingSessionDto | null>(null);
  readonly deleting = signal(false);
  readonly statusChanging = signal(false);
  readonly materialsUploading = signal(false);
  readonly materialsError = signal<string | null>(null);
  readonly evaluationSummary = signal<ProgramEvaluationSummaryDto | null>(null);
  readonly evaluationSummaryLoading = signal(false);
  readonly summaryExpanded = signal(false);

  /** Allowed next statuses for the current program (Draft→Planned/Cancelled, Planned→Published/Cancelled, etc.) */
  nextStatusOptions = computed(() => {
    const p = this.program();
    if (!p) return [];
    const status = p.status;
    const opts: { value: string; labelKey: string }[] = [];
    if (status === 'Draft') {
      opts.push({ value: 'Planned', labelKey: 'programs.statusActivate' });
      opts.push({ value: 'Cancelled', labelKey: 'programs.statusCancel' });
    } else if (status === 'Planned') {
      opts.push({ value: 'Published', labelKey: 'programs.statusPublish' });
      opts.push({ value: 'Cancelled', labelKey: 'programs.statusCancel' });
    } else if (status === 'Published') {
      opts.push({ value: 'Completed', labelKey: 'programs.statusComplete' });
      opts.push({ value: 'Cancelled', labelKey: 'programs.statusCancel' });
    }
    return opts;
  });

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'Published': return 'ds-badge--success';
      case 'Planned': return 'ds-badge--info';
      case 'Completed': return 'ds-badge--neutral';
      case 'Cancelled': return 'ds-badge--danger';
      default: return 'ds-badge--neutral';
    }
  }

  /** Shown in session modal: what will be saved from program settings. */
  readonly sessionPlacePreview = computed(() => {
    const p = this.program();
    if (!p) {
      return {
        hasAny: false,
        showLocation: false,
        showLink: false,
        location: null as string | null,
        onlineLink: null as string | null,
      };
    }
    const mode = p.deliveryMode;
    const showLocation = mode === 'Offline' || mode === 'Hybrid';
    const showLink = mode === 'Online' || mode === 'Hybrid';
    return {
      hasAny: showLocation || showLink,
      showLocation,
      showLink,
      location: p.location ?? null,
      onlineLink: p.onlineLink ?? null,
    };
  });

  locationScopeLabel(value: string | null | undefined): string {
    if (value == null || value === '') return '—';
    const key = `programs.locationScope.${value}`;
    const t = this.translate.instant(key);
    return t !== key ? t : value;
  }

  toggleSummaryExpanded(): void {
    this.summaryExpanded.update((value) => !value);
  }

  /** Location + online link copied onto each session from the program. */
  private sessionPlaceFromProgram(): { location: string | null; onlineLink: string | null } {
    const p = this.program();
    if (!p) return { location: null, onlineLink: null };
    const mode = p.deliveryMode;
    if (mode === 'Online') {
      return { location: null, onlineLink: p.onlineLink ?? null };
    }
    if (mode === 'Offline') {
      return { location: p.location ?? null, onlineLink: null };
    }
    if (mode === 'Hybrid') {
      return { location: p.location ?? null, onlineLink: p.onlineLink ?? null };
    }
    return { location: p.location ?? null, onlineLink: p.onlineLink ?? null };
  }

  sessionForm: CreateTrainingSessionRequest = {
    trainingProgramId: '',
    titleEn: '',
    titleAr: '',
    startDateTime: '',
    endDateTime: '',
    location: null,
    onlineLink: null,
    attendanceRule: null,
  };

  canEdit = () => this.auth.hasPermission(PermissionCodes.trainingProgram.edit);
  programId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  breadcrumbs = computed(() => {
    const p = this.program();
    const label = p ? p.titleEn : this.translate.instant('nav.programs');
    return [
      { label: this.translate.instant('nav.programs'), route: '/programs' },
      { label },
    ];
  });

  ngOnInit(): void {
    const id = this.programId();
    if (id) this.load(id);
  }

  materialsUrl(relativePath: string | null | undefined): string {
    if (!relativePath) return '';
    return this.api.fileUrl(relativePath);
  }

  onMaterialsSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    const programId = this.programId();
    if (!programId) return;

    this.materialsError.set(null);
    this.materialsUploading.set(true);
    this.api.uploadScientificMaterials(programId, file).subscribe({
      next: (res) => {
        this.materialsUploading.set(false);
        if (res.success && res.data?.scientificMaterialsPath) {
          const p = this.program();
          if (p) this.program.set({ ...p, scientificMaterialsPath: res.data.scientificMaterialsPath });
          this.toast.success(this.translate.instant('common.saved'));
        } else {
          this.materialsError.set(res.message ?? 'Upload failed');
        }
        if (input) input.value = '';
      },
      error: (err) => {
        this.materialsUploading.set(false);
        this.materialsError.set(err.error?.errors?.[0] ?? err.error?.message ?? err.message ?? 'Upload failed');
        if (input) input.value = '';
      },
    });
  }

  onSessionStartChange(): void {
    if (this.sessionForm.startDateTime && this.sessionForm.endDateTime && this.sessionForm.endDateTime < this.sessionForm.startDateTime) {
      this.sessionForm = { ...this.sessionForm, endDateTime: this.sessionForm.startDateTime };
    }
  }

  onSessionEndChange(): void {
    if (this.sessionForm.startDateTime && this.sessionForm.endDateTime && this.sessionForm.endDateTime < this.sessionForm.startDateTime) {
      this.sessionForm = { ...this.sessionForm, startDateTime: this.sessionForm.endDateTime };
    }
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.evaluationSummary.set(null);
    this.evaluationSummaryLoading.set(true);
    this.api.getById(id).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) this.program.set(res.data);
        else this.error.set(res.message ?? 'Not found');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? err.message ?? 'Failed to load');
      },
    });

    this.evaluationsApi.getSummary(id).subscribe({
      next: (res) => {
        this.evaluationSummaryLoading.set(false);
        if (res.success && res.data) this.evaluationSummary.set(res.data);
      },
      error: () => {
        this.evaluationSummaryLoading.set(false);
      },
    });
  }

  openAddSession(): void {
    const id = this.programId();
    this.editingSession.set(null);
    const place = this.sessionPlaceFromProgram();
    this.sessionForm = {
      trainingProgramId: id,
      titleEn: '',
      titleAr: '',
      startDateTime: new Date().toISOString().slice(0, 16),
      endDateTime: new Date().toISOString().slice(0, 16),
      location: place.location,
      onlineLink: place.onlineLink,
      attendanceRule: null,
    };
    this.modalError.set(null);
    this.showSessionModal.set(true);
  }

  openEditSession(session: TrainingSessionDto): void {
    this.editingSession.set(session);
    const place = this.sessionPlaceFromProgram();
    this.sessionForm = {
      trainingProgramId: session.trainingProgramId,
      titleEn: session.titleEn,
      titleAr: session.titleAr,
      startDateTime: session.startDateTime.slice(0, 16),
      endDateTime: session.endDateTime.slice(0, 16),
      location: place.location,
      onlineLink: place.onlineLink,
      attendanceRule: session.attendanceRule ?? null,
    };
    this.modalError.set(null);
    this.showSessionModal.set(true);
  }

  closeSessionModal(): void {
    this.showSessionModal.set(false);
    this.editingSession.set(null);
  }

  saveSession(): void {
    this.modalError.set(null);
    const programId = this.programId();
    const editing = this.editingSession();
    if (this.sessionForm.startDateTime && this.sessionForm.endDateTime && this.sessionForm.endDateTime < this.sessionForm.startDateTime) {
      this.modalError.set(this.translate.instant('Program end date must be after start date.'));
      return;
    }
    const place = this.sessionPlaceFromProgram();
    if (editing) {
      this.saving.set(true);
      this.api.updateSession(programId, editing.id, {
        id: editing.id,
        titleEn: this.sessionForm.titleEn,
        titleAr: this.sessionForm.titleAr,
        startDateTime: new Date(this.sessionForm.startDateTime).toISOString(),
        endDateTime: new Date(this.sessionForm.endDateTime).toISOString(),
        location: place.location,
        onlineLink: place.onlineLink,
        attendanceRule: this.sessionForm.attendanceRule,
      }).subscribe({
        next: () => { this.saving.set(false); this.closeSessionModal(); this.load(programId); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    } else {
      if (!this.sessionForm.titleEn?.trim() || !this.sessionForm.titleAr?.trim()) {
        this.modalError.set(this.translate.instant('validation.required'));
        return;
      }
      this.saving.set(true);
      this.api.createSession(programId, {
        ...this.sessionForm,
        startDateTime: new Date(this.sessionForm.startDateTime).toISOString(),
        endDateTime: new Date(this.sessionForm.endDateTime).toISOString(),
        location: place.location,
        onlineLink: place.onlineLink,
      }).subscribe({
        next: () => { this.saving.set(false); this.closeSessionModal(); this.load(programId); },
        error: (err) => { this.saving.set(false); this.modalError.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Error'); },
      });
    }
  }

  confirmDeleteSession(session: TrainingSessionDto): void {
    if (!this.canEdit()) return;
    this.toDeleteSession.set(session);
    this.showConfirm.set(true);
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
    this.toDeleteSession.set(null);
  }

  deleteConfirmMessage = computed(() => this.translate.instant('dialog.confirmDelete'));

  changeStatus(newStatus: string): void {
    if (!this.canEdit()) return;
    const programId = this.programId();
    this.statusChanging.set(true);
    this.api.setStatus(programId, newStatus).subscribe({
      next: (res) => {
        this.statusChanging.set(false);
        if (res.success) {
          this.toast.success(this.translate.instant('common.saved'));
          this.load(programId);
        } else {
          this.toast.error(res.message ?? this.translate.instant('dialog.error'));
        }
      },
      error: (err) => {
        this.statusChanging.set(false);
        this.toast.error(err.error?.message ?? err.message ?? this.translate.instant('dialog.error'));
      },
    });
  }

  doDelete(): void {
    const target = this.toDeleteSession();
    if (!target) return;
    const programId = this.programId();
    this.showConfirm.set(false);
    this.deleting.set(true);
    this.api.deleteSession(programId, target.id).subscribe({
      next: (res) => {
        this.deleting.set(false);
        if (res.success) {
          this.toast.success(this.translate.instant('common.deleted'));
          this.load(programId);
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
