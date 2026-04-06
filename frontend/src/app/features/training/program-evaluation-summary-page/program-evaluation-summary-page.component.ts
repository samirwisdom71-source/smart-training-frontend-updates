import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ProgramEvaluationsApiService } from '../../../core/api/program-evaluations/program-evaluations-api.service';
import { TrainingProgramsApiService } from '../../../core/api/training-programs/training-programs-api.service';

@Component({
  selector: 'app-program-evaluation-summary-page',
  standalone: true,
  imports: [TranslateModule, RouterLink, DecimalPipe, PageShellComponent],
  templateUrl: './program-evaluation-summary-page.component.html',
  styleUrls: ['./program-evaluation-summary-page.component.scss'],
})
export class ProgramEvaluationSummaryPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ProgramEvaluationsApiService);
  private readonly programsApi = inject(TrainingProgramsApiService);
  private readonly translate = inject(TranslateService);

  programId = signal<string | null>(null);
  programTitle = signal<string>('');
  readonly summary = signal<{ avgContentScore: number; avgTrainerScore: number; avgOrganizationScore: number; avgUsefulnessScore: number; totalResponses: number } | null>(null);
  readonly evaluations = signal<{ contentScore: number; trainerScore: number; organizationScore: number; usefulnessScore: number; employeeNameEn: string; comments: string | null; filePath: string | null; fileName: string | null }[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  breadcrumbs = computed(() => [
    { label: this.translate.instant('nav.programs'), route: '/programs' },
    { label: this.programTitle() || this.programId() || '', route: '/programs/' + this.programId() },
    { label: this.translate.instant('evaluation.summary') },
  ]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.programId.set(id);
      this.programsApi.getById(id).subscribe({
        next: (res) => { if (res.success && res.data) this.programTitle.set(res.data.titleEn); },
      });
      this.loading.set(true);
      this.api.getSummary(id).subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success && res.data) this.summary.set(res.data);
          else this.error.set(res.message ?? 'Failed');
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message ?? 'Failed');
        },
      });
      this.api.getByProgram(id).subscribe({
        next: (res) => {
          if (res.success && res.data) this.evaluations.set(res.data.map(e => ({
            contentScore: e.contentScore,
            trainerScore: e.trainerScore,
            organizationScore: e.organizationScore,
            usefulnessScore: e.usefulnessScore,
            employeeNameEn: e.employeeNameEn,
            comments: e.comments,
            filePath: e.filePath,
            fileName: e.fileName,
          })));
        },
      });
    }
  }

  openAttachment(filePath: string | null | undefined): void {
    if (!filePath) return;
    window.open(this.api.fileUrl(filePath), '_blank', 'noopener');
  }
}
