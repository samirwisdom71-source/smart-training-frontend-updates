import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ProgramEvaluationsApiService } from '../../../core/api/program-evaluations/program-evaluations-api.service';
import { TrainingProgramsApiService } from '../../../core/api/training-programs/training-programs-api.service';
import { EnrollmentsApiService } from '../../../core/api/enrollments/enrollments-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionCodes } from '../../../core/auth/permissions';
import type { SubmitProgramEvaluationRequest } from '../../../core/api/program-evaluations/program-evaluations-api.models';
import type { ApiResponse } from '../../../core/models/api-response';

export interface EvaluationParticipantRow {
  id: string;
  name: string;
  alreadyEvaluated: boolean;
}

@Component({
  selector: 'app-program-evaluation-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, RouterLink, PageShellComponent],
  templateUrl: './program-evaluation-page.component.html',
  styleUrls: ['./program-evaluation-page.component.scss'],
})
export class ProgramEvaluationPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ProgramEvaluationsApiService);
  private readonly programsApi = inject(TrainingProgramsApiService);
  private readonly enrollmentsApi = inject(EnrollmentsApiService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);

  programId = signal<string | null>(null);
  programTitle = signal<string>('');
  readonly participants = signal<EvaluationParticipantRow[]>([]);
  /** Employee IDs selected for submission (subset of eligible only). */
  readonly selectedIds = signal<string[]>([]);
  readonly loadingData = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);
  readonly submittedCount = signal(0);
  readonly selectedFile = signal<File | null>(null);

  form: Omit<SubmitProgramEvaluationRequest, 'employeeId'> = {
    trainingProgramId: '',
    contentScore: 3,
    trainerScore: 3,
    organizationScore: 3,
    usefulnessScore: 3,
    comments: null,
  };

  readonly eligibleParticipants = computed(() =>
    this.participants().filter((p) => !p.alreadyEvaluated),
  );

  readonly allEligibleSelected = computed(() => {
    const eligible = this.eligibleParticipants();
    if (!eligible.length) return false;
    const sel = new Set(this.selectedIds());
    return eligible.every((p) => sel.has(p.id));
  });

  canSubmit = () => this.auth.hasPermission(PermissionCodes.evaluation.execute);

  breadcrumbs = computed(() => [
    { label: this.translate.instant('nav.programs'), route: '/programs' },
    { label: this.programTitle() || this.programId() || '' },
  ]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.loadingData.set(true);
    this.programId.set(id);
    this.form.trainingProgramId = id;

    forkJoin({
      program: this.programsApi.getById(id),
      enrollments: this.enrollmentsApi.getByProgram(id),
      evaluations: this.api.getByProgram(id),
    }).subscribe({
      next: ({ program, enrollments, evaluations }) => {
        this.loadingData.set(false);
        if (program.success && program.data) this.programTitle.set(program.data.titleEn);

        const evaluatedIds = new Set(
          (evaluations.success && evaluations.data ? evaluations.data : []).map((e) => e.employeeId),
        );

        if (enrollments.success && enrollments.data) {
          const excludedFromList = ['Rejected', 'Cancelled'];
          const rows = enrollments.data
            .filter((e) => !excludedFromList.includes(e.status))
            .map((e) => ({
              id: e.employeeId,
              name: e.employeeNameEn || e.employeeId,
              alreadyEvaluated: evaluatedIds.has(e.employeeId),
            }))
            .filter((item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx);

          rows.sort((a, b) => {
            if (a.alreadyEvaluated !== b.alreadyEvaluated) return a.alreadyEvaluated ? 1 : -1;
            return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
          });
          this.participants.set(rows);
        }
      },
      error: () => this.loadingData.set(false),
    });
  }

  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  toggleParticipant(id: string, checked: boolean): void {
    const row = this.participants().find((p) => p.id === id);
    if (!row || row.alreadyEvaluated) return;
    const set = new Set(this.selectedIds());
    if (checked) set.add(id);
    else set.delete(id);
    this.selectedIds.set([...set]);
  }

  onSelectAllChange(checked: boolean): void {
    if (checked) {
      this.selectedIds.set(this.eligibleParticipants().map((p) => p.id));
    } else {
      this.selectedIds.set([]);
    }
  }

  submit(): void {
    const ids = this.selectedIds();
    if (!ids.length) {
      this.error.set(this.translate.instant('evaluation.selectAtLeastOne'));
      return;
    }
    this.saving.set(true);
    this.error.set(null);

    const base = {
      trainingProgramId: this.form.trainingProgramId,
      contentScore: this.form.contentScore,
      trainerScore: this.form.trainerScore,
      organizationScore: this.form.organizationScore,
      usefulnessScore: this.form.usefulnessScore,
      comments: this.form.comments,
      file: this.selectedFile(),
    };

    const requests = ids.map((employeeId) =>
      this.api.submit({ ...base, employeeId }).pipe(
        map((res: ApiResponse<void>) => ({
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
          this.submittedCount.set(ok);
          this.selectedFile.set(null);
          this.success.set(true);
          return;
        }
        if (ok > 0) {
          const nameById = new Map(this.participants().map((p) => [p.id, p.name]));
          const failDetail = failed
            .map((f) => `${nameById.get(f.employeeId) ?? f.employeeId}: ${f.message}`)
            .join(' · ');
          this.error.set(
            this.translate.instant('evaluation.bulkSubmitPartial', {
              ok,
              fail: failDetail,
            }),
          );
          const failedSet = new Set(failed.map((f) => f.employeeId));
          this.selectedIds.set(ids.filter((id) => failedSet.has(id)));
          this.refreshEvaluatedFlags();
        } else {
          const nameById = new Map(this.participants().map((p) => [p.id, p.name]));
          const failDetail = failed
            .map((f) => `${nameById.get(f.employeeId) ?? f.employeeId}: ${f.message}`)
            .join(' · ');
          this.error.set(failDetail);
        }
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Failed');
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    this.selectedFile.set(file);
  }

  clearSelectedFile(input?: HTMLInputElement | null): void {
    this.selectedFile.set(null);
    if (input) input.value = '';
  }

  private refreshEvaluatedFlags(): void {
    const pid = this.programId();
    if (!pid) return;
    this.api.getByProgram(pid).subscribe({
      next: (res) => {
        if (!res.success || !res.data) return;
        const evaluatedIds = new Set(res.data.map((e) => e.employeeId));
        this.participants.update((list) =>
          list.map((p) => ({ ...p, alreadyEvaluated: evaluatedIds.has(p.id) })),
        );
      },
    });
  }
}
