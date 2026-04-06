import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { PostTrainingReportsApiService } from '../../../core/api/post-training-reports/post-training-reports-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import { ToastService } from '../../../core/toast/toast.service';
import { appConfig } from '../../../config/app.config';
import type { PostTrainingReportDto, SavePostTrainingReportDraftRequest } from '../../../core/api/post-training-reports/post-training-reports-api.models';

@Component({
  selector: 'app-post-training-report-review-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, RouterLink, DatePipe, PageShellComponent],
  templateUrl: './post-training-report-review-page.component.html',
  styleUrls: ['./post-training-report-review-page.component.scss'],
})
export class PostTrainingReportReviewPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(PostTrainingReportsApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  readonly report = signal<PostTrainingReportDto | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly reviewError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly attachmentBusy = signal(false);
  managerComment = '';
  draftNotes = '';
  readonly draftLevels: Record<string, string | null> = {};
  readonly draftComments: Record<string, string | null> = {};

  reportId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  canReview = () => this.auth.hasPermission(PermissionCodes.evaluation.analyze);
  canEditDraft = () => this.auth.hasPermission(PermissionCodes.evaluation.execute);
  breadcrumbs = computed(() => [
    { label: this.translate.instant('postTrainingReports.title'), route: '/post-training-reports' },
    { label: this.translate.instant('postTrainingReports.review') },
  ]);

  ngOnInit(): void {
    const id = this.reportId();
    if (id) this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getById(id).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.report.set(res.data);
          this.initialiseForm(res.data);
        } else this.error.set(res.message ?? 'Not found');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Failed');
      },
    });
  }

  initialiseForm(dto: PostTrainingReportDto): void {
    this.draftNotes = dto.notes ?? '';
    dto.details.forEach((detail) => {
      this.draftLevels[detail.competencyId] = detail.currentProficiencyLevelId ?? null;
      this.draftComments[detail.competencyId] = detail.currentComment ?? null;
    });
  }

  saveDraftEdits(): void {
    const id = this.reportId();
    const r = this.report();
    if (!id || !r) return;
    this.saving.set(true);
    this.submitError.set(null);
    this.api
      .saveDraft(this.buildDraftPayload(r))
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          if (res.success) {
            this.toast.success(this.translate.instant('postTrainingReports.draftSaved'));
            this.load(id);
          } else {
            this.submitError.set(res.errors?.[0] ?? res.message ?? 'Failed');
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.submitError.set(err.error?.errors?.[0] ?? err.error?.message ?? err.message ?? 'Failed');
        },
      });
  }

  submitReport(): void {
    const id = this.reportId();
    const r = this.report();
    if (!id || !r) return;
    this.saving.set(true);
    this.submitError.set(null);
    this.api.saveDraft(this.buildDraftPayload(r)).subscribe({
      next: (saveRes) => {
        if (!saveRes.success) {
          this.saving.set(false);
          this.submitError.set(saveRes.errors?.[0] ?? saveRes.message ?? this.translate.instant('postTrainingReports.submitReportError'));
          return;
        }

        this.api.submit(id).subscribe({
          next: (res) => {
            this.saving.set(false);
            if (res.success) {
              this.toast.success(this.translate.instant('postTrainingReports.reportSubmitted'));
              this.load(id);
            } else {
              this.submitError.set(res.errors?.[0] ?? res.message ?? this.translate.instant('postTrainingReports.submitReportError'));
            }
          },
          error: (err) => {
            this.saving.set(false);
            this.submitError.set(
              err.error?.errors?.[0] ?? err.error?.message ?? this.translate.instant('postTrainingReports.submitReportError'),
            );
          },
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.submitError.set(
          err.error?.errors?.[0] ?? err.error?.message ?? this.translate.instant('postTrainingReports.submitReportError'),
        );
      },
    });
  }

  private buildDraftPayload(r: PostTrainingReportDto): SavePostTrainingReportDraftRequest {
    return {
      trainingProgramId: r.trainingProgramId,
      employeeId: r.employeeId,
      notes: this.draftNotes.trim() || null,
      details: r.details.map((detail) => ({
        competencyId: detail.competencyId,
        currentProficiencyLevelId: this.draftLevels[detail.competencyId] ?? null,
        currentComment: this.draftComments[detail.competencyId] ?? null,
      })),
    };
  }

  submitReview(): void {
    const id = this.reportId();
    if (!id) return;
    this.saving.set(true);
    this.reviewError.set(null);
    this.api.review(id, this.managerComment || null).subscribe({
      next: () => {
        this.saving.set(false);
        this.load(id);
      },
      error: (err) => {
        this.saving.set(false);
        this.reviewError.set(err.error?.message ?? 'Failed');
      },
    });
  }

  downloadReportAttachment(r: PostTrainingReportDto): void {
    if (!r.attachmentFilePath) return;
    this.api.downloadStoredAttachment(r.attachmentFilePath, r.attachmentOriginalFileName).subscribe({
      error: () => {
        this.toast.error(this.translate.instant('postTrainingReports.downloadFailed'));
      },
    });
  }

  onAdminAttachmentSelected(event: Event): void {
    const id = this.reportId();
    if (!id || !this.canReview()) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.attachmentBusy.set(true);
    this.api.uploadAttachment(id, file).subscribe({
      next: (res) => {
        this.attachmentBusy.set(false);
        if (res.success) {
          this.toast.success(this.translate.instant('postTrainingReports.attachmentUploaded'));
          this.load(id);
        } else {
          this.toast.error(res.errors?.[0] ?? res.message ?? this.translate.instant('dialog.error'));
        }
      },
      error: (err) => {
        this.attachmentBusy.set(false);
        this.toast.error(
          err.error?.errors?.[0] ?? err.error?.message ?? err.message ?? this.translate.instant('dialog.error'),
        );
      },
    });
  }

  removeAdminAttachment(): void {
    const id = this.reportId();
    if (!id || !this.canReview()) return;
    this.attachmentBusy.set(true);
    this.api.removeAttachment(id).subscribe({
      next: (res) => {
        this.attachmentBusy.set(false);
        if (res.success) {
          this.toast.success(this.translate.instant('postTrainingReports.attachmentRemoved'));
          this.load(id);
        } else {
          this.toast.error(res.message ?? this.translate.instant('dialog.error'));
        }
      },
      error: (err) => {
        this.attachmentBusy.set(false);
        this.toast.error(err.error?.message ?? err.message ?? this.translate.instant('dialog.error'));
      },
    });
  }
}
