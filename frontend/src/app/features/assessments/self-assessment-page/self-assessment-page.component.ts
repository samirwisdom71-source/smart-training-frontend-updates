import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { AssessmentsApiService } from '../../../core/api/assessments/assessments-api.service';
import type { AssessmentDto, SaveSelfAssessmentRequest } from '../../../core/api/assessments/assessments-api.models';

@Component({
  selector: 'app-self-assessment-page',
  standalone: true,
  imports: [RouterModule, FormsModule, TranslateModule, PageShellComponent],
  template: `
    <app-page-shell [title]="'assessments.selfTitle' | translate" [breadcrumbs]="breadcrumbs()">
      <div content>
        @if (loading()) {
          <div class="table-loading">
            <div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div>
            <div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div>
            <div class="ds-skeleton" style="height: 48px;"></div>
          </div>
        } @else if (error()) {
          <div class="ds-error-state">
            <p class="ds-error-state__title">{{ error() }}</p>
            <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="reload()">{{ 'empty.tryAgain' | translate }}</button>
          </div>
        } @else if (!assessment()) {
          <div class="ds-empty">
            <p class="ds-empty__title">{{ 'empty.noItems' | translate }}</p>
          </div>
        } @else {
          <section class="header-summary">
            <div>
              <h2 class="ds-h2">{{ assessment()!.summary.cycleNameEn }}</h2>
              <p class="ds-text-sm ds-text-muted">
                {{ 'assessments.cycleCode' | translate }}: {{ assessment()!.summary.cycleCode }}
              </p>
            </div>
            <div class="status-pill">
              <span class="ds-badge">{{ assessment()!.summary.status }}</span>
            </div>
          </section>

          <section class="competencies">
            <table class="ds-table">
              <thead>
                <tr>
                  <th>{{ 'table.code' | translate }}</th>
                  <th>{{ 'table.nameEn' | translate }}</th>
                  <th>{{ 'competency.importanceWeight' | translate }}</th>
                  <th>{{ 'assessments.selfLevel' | translate }}</th>
                  <th>{{ 'assessments.selfComment' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (d of assessment()!.details; track d.id) {
                  <tr>
                    <td>{{ d.competencyCode }}</td>
                    <td>{{ d.competencyNameEn }}</td>
                    <td>{{ d.importanceWeight ?? '—' }}</td>
                    <td>
                      <select class="ds-input" [(ngModel)]="selfLevels[d.id]" name="selfLevel-{{ d.id }}">
                        <option [ngValue]="null">—</option>
                        @for (lvl of d.proficiencyLevelOptions || []; track lvl.id) {
                          <option [ngValue]="lvl.id">{{ lvl.code }} ({{ lvl.levelNumber }})</option>
                        }
                      </select>
                    </td>
                    <td>
                      <textarea class="ds-textarea" rows="2" [(ngModel)]="selfComments[d.id]" name="selfComment-{{ d.id }}"></textarea>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </section>

          <section class="actions">
            <button type="button" class="ds-btn ds-btn--secondary" (click)="saveDraft()" [disabled]="saving()">
              {{ saving() ? ('common.loading' | translate) : ('assessments.saveDraft' | translate) }}
            </button>
            <button type="button" class="ds-btn ds-btn--primary" (click)="submit()" [disabled]="saving()">
              {{ 'assessments.submitSelf' | translate }}
            </button>
          </section>
        }
      </div>
    </app-page-shell>

    @if (showSubmitSuccessModal()) {
      <div class="modal-overlay" (click)="closeSubmitSuccessModal()">
        <div class="modal-drawer ds-card" (click)="$event.stopPropagation()">
          <h3 class="modal-drawer__title">{{ 'assessments.submitSuccessTitle' | translate }}</h3>
          <p class="modal-drawer__message">{{ 'assessments.submitSuccessMessage' | translate }}</p>
          @if (submitSuccessManagerName()) {
            <p class="modal-drawer__manager">{{ 'table.manager' | translate }}: {{ submitSuccessManagerName() }}</p>
          }
          <div class="modal-drawer__actions">
            <button type="button" class="ds-btn ds-btn--primary" (click)="closeSubmitSuccessModal()">{{ 'common.ok' | translate }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .header-summary { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-lg); gap: var(--space-md); flex-wrap: wrap; }
    .status-pill { display: flex; align-items: center; }
    .competencies { margin-top: var(--space-md); }
    .actions { display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-lg); flex-wrap: wrap; }
    .modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; padding: var(--space-lg); }
    .modal-drawer { max-width: 400px; width: 100%; }
    .modal-drawer__title { font-size: var(--text-h1); font-weight: 600; margin: 0 0 var(--space-md); }
    .modal-drawer__message { margin: 0 0 var(--space-sm); }
    .modal-drawer__manager { font-weight: 600; margin: 0 0 var(--space-md); }
    .modal-drawer__actions { display: flex; justify-content: flex-end; margin-top: var(--space-lg); }
  `]
})
export class SelfAssessmentPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AssessmentsApiService);
  private readonly translate = inject(TranslateService);

  readonly assessment = signal<AssessmentDto | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showSubmitSuccessModal = signal(false);
  readonly submitSuccessManagerName = signal<string | null>(null);

  readonly selfLevels: Record<string, string | null> = {};
  readonly selfComments: Record<string, string | null> = {};

  breadcrumbs = computed(() => [
    { label: this.translate.instant('assessments.myTitle'), link: '/assessments/my' },
    { label: this.translate.instant('assessments.selfTitle') },
  ]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getMyAssessmentById(id).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.assessment.set(res.data);
          this.initialiseForm(res.data);
        } else {
          this.error.set(res.message ?? 'Failed to load');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? err.message ?? 'Failed to load');
      },
    });
  }

  reload(): void {
    const id = this.assessment()?.id ?? this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  initialiseForm(dto: AssessmentDto): void {
    dto.details.forEach(d => {
      this.selfLevels[d.id] = d.selfProficiencyLevelId ?? null;
      this.selfComments[d.id] = d.selfComment ?? null;
    });
  }

  saveDraft(): void {
    const dto = this.assessment();
    if (!dto) return;
    const body: SaveSelfAssessmentRequest = {
      details: dto.details.map(d => ({
        detailId: d.id,
        selfProficiencyLevelId: this.selfLevels[d.id] ?? null,
        selfComment: this.selfComments[d.id] ?? null,
      })),
    };
    this.saving.set(true);
    this.api.saveSelfAssessment(dto.id, body).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (!res.success) this.error.set(res.message ?? 'Failed to save');
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Failed to save');
      },
    });
  }

  submit(): void {
    const dto = this.assessment();
    if (!dto) return;
    const body: SaveSelfAssessmentRequest = {
      details: dto.details.map(d => ({
        detailId: d.id,
        selfProficiencyLevelId: this.selfLevels[d.id] ?? null,
        selfComment: this.selfComments[d.id] ?? null,
      })),
    };
    this.saving.set(true);
    this.api.submitSelfAssessment(dto.id, body).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success) {
          this.submitSuccessManagerName.set(dto.summary.managerNameEn ?? null);
          this.showSubmitSuccessModal.set(true);
        } else {
          this.error.set(res.message ?? 'Failed to submit');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Failed to submit');
      },
    });
  }

  closeSubmitSuccessModal(): void {
    this.showSubmitSuccessModal.set(false);
    this.submitSuccessManagerName.set(null);
    this.router.navigate(['/assessments/my']);
  }
}

