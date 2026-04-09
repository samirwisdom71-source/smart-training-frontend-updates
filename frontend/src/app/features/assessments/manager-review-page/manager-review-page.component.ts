import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { AssessmentsApiService } from '../../../core/api/assessments/assessments-api.service';
import type { AssessmentDto, SaveManagerReviewRequest } from '../../../core/api/assessments/assessments-api.models';
import {
  DataViewPreferenceService,
  DataViewToggleComponent,
  LuxDataCardComponent,
  LuxDataCardGridComponent,
} from '../../../shared/data-view';

@Component({
  selector: 'app-manager-review-page',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    TranslateModule,
    PageShellComponent,
    DataViewToggleComponent,
    LuxDataCardComponent,
    LuxDataCardGridComponent,
  ],
  template: `
    <app-page-shell
      [title]="'assessments.managerReviewTitle' | translate"
      [breadcrumbs]="breadcrumbs()"
      [showBack]="true"
    >
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
              <h2 class="ds-h2">{{ assessment()!.summary.employeeNameEn }}</h2>
              <p class="ds-text-sm ds-text-muted">
                {{ assessment()!.summary.cycleNameEn }}
              </p>
            </div>
            <div class="status-pill">
              <span class="ds-badge">{{ assessment()!.summary.status }}</span>
            </div>
          </section>

          <div class="mgr-review-view-toggle">
            <app-data-view-toggle />
          </div>

          <section class="competencies">
            @if (dataViewPref.mode() === 'table') {
            <table class="ds-table">
              <thead>
                <tr>
                  <th>{{ 'table.code' | translate }}</th>
                  <th>{{ 'table.nameEn' | translate }}</th>
                  <th>{{ 'assessments.requiredLevel' | translate }}</th>
                  <th>{{ 'assessments.selfLevel' | translate }}</th>
                  <th>{{ 'assessments.managerLevel' | translate }}</th>
                  <th>{{ 'assessments.managerComment' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (d of assessment()!.details; track d.id) {
                  <tr>
                    <td>{{ d.competencyCode }}</td>
                    <td>{{ d.competencyNameEn }}</td>
                    <td>{{ d.requiredLevelCode }} ({{ d.requiredLevelNumber }})</td>
                    <td>{{ d.selfLevelCode ?? '—' }}</td>
                    <td>
                      <select class="ds-input" [(ngModel)]="managerLevels[d.id]" name="managerLevel-{{ d.id }}">
                        <option [ngValue]="null">—</option>
                        @for (lvl of d.proficiencyLevelOptions; track lvl.id) {
                          <option [ngValue]="lvl.id">{{ lvl.code }} ({{ lvl.levelNumber }})</option>
                        }
                      </select>
                    </td>
                    <td>
                      <textarea class="ds-textarea" rows="2" [(ngModel)]="managerComments[d.id]" name="managerComment-{{ d.id }}"></textarea>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            } @else {
              <app-lux-data-card-grid>
                @for (d of assessment()!.details; track d.id) {
                  <app-lux-data-card [interactive]="false">
                    <div luxCardHeader class="mgr-review-card-head">
                      <span class="mgr-review-card-head__code">{{ d.competencyCode }}</span>
                      <span class="mgr-review-card-head__name">{{ d.competencyNameEn }}</span>
                    </div>
                    <div class="lux-dc-meta">
                      <div class="lux-dc-meta__row">
                        <span class="lux-dc-meta__label">{{ 'assessments.requiredLevel' | translate }}</span>
                        <span class="lux-dc-meta__value">{{ d.requiredLevelCode }} ({{ d.requiredLevelNumber }})</span>
                      </div>
                      <div class="lux-dc-meta__row">
                        <span class="lux-dc-meta__label">{{ 'assessments.selfLevel' | translate }}</span>
                        <span class="lux-dc-meta__value">{{ d.selfLevelCode ?? '—' }}</span>
                      </div>
                    </div>
                    <div class="mgr-review-card-fields">
                      <label class="ds-label">{{ 'assessments.managerLevel' | translate }}</label>
                      <select class="ds-input" [(ngModel)]="managerLevels[d.id]" [name]="'managerLevel-card-' + d.id">
                        <option [ngValue]="null">—</option>
                        @for (lvl of d.proficiencyLevelOptions; track lvl.id) {
                          <option [ngValue]="lvl.id">{{ lvl.code }} ({{ lvl.levelNumber }})</option>
                        }
                      </select>
                      <label class="ds-label">{{ 'assessments.managerComment' | translate }}</label>
                      <textarea class="ds-textarea" rows="2" [(ngModel)]="managerComments[d.id]" [name]="'managerComment-card-' + d.id"></textarea>
                    </div>
                  </app-lux-data-card>
                }
              </app-lux-data-card-grid>
            }
          </section>

          <section class="actions">
            <button type="button" class="ds-btn ds-btn--secondary" (click)="saveDraft()" [disabled]="saving()">
              {{ saving() ? ('common.loading' | translate) : ('assessments.saveReview' | translate) }}
            </button>
            <button type="button" class="ds-btn ds-btn--primary" (click)="complete()" [disabled]="saving()">
              {{ 'assessments.completeReview' | translate }}
            </button>
          </section>
        }
      </div>
    </app-page-shell>

    @if (showCompleteSuccessModal()) {
      <div class="modal-overlay" (click)="closeCompleteSuccessModal()">
        <div class="modal-drawer ds-card" (click)="$event.stopPropagation()">
          <h3 class="modal-drawer__title">{{ 'assessments.completeReviewSuccessTitle' | translate }}</h3>
          <p class="modal-drawer__message">{{ 'assessments.completeReviewSuccessMessage' | translate }}</p>
          <div class="modal-drawer__actions">
            <button type="button" class="ds-btn ds-btn--primary" (click)="closeCompleteSuccessModal()">{{ 'common.ok' | translate }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .header-summary { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-lg); gap: var(--space-md); flex-wrap: wrap; }
    .status-pill { display: flex; align-items: center; }
    .mgr-review-view-toggle {
      display: flex;
      justify-content: flex-end;
      margin-bottom: var(--space-md);
    }
    .mgr-review-card-head {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-bottom: var(--space-sm);
    }
    .mgr-review-card-head__code {
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .mgr-review-card-head__name {
      font-size: var(--text-body-sm);
      color: var(--color-text-secondary);
      line-height: 1.35;
    }
    .mgr-review-card-fields {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
      margin-top: var(--space-sm);
    }
    .competencies { margin-top: var(--space-md); }
    .actions { display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-lg); flex-wrap: wrap; }
    .modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; padding: var(--space-lg); }
    .modal-drawer { max-width: 400px; width: 100%; }
    .modal-drawer__title { font-size: var(--text-h1); font-weight: 600; margin: 0 0 var(--space-md); }
    .modal-drawer__message { margin: 0 0 var(--space-md); }
    .modal-drawer__actions { display: flex; justify-content: flex-end; margin-top: var(--space-lg); }
  `]
})
export class ManagerReviewPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AssessmentsApiService);
  private readonly translate = inject(TranslateService);
  readonly dataViewPref = inject(DataViewPreferenceService);

  readonly assessment = signal<AssessmentDto | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showCompleteSuccessModal = signal(false);

  readonly managerLevels: Record<string, string | null> = {};
  readonly managerComments: Record<string, string | null> = {};

  breadcrumbs = computed(() => [
    { label: this.translate.instant('assessments.managerTitle'), link: '/assessments/manager' },
    { label: this.translate.instant('assessments.managerReviewTitle') },
  ]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getAssessmentForReview(id).subscribe({
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
      this.managerLevels[d.id] = d.managerProficiencyLevelId ?? null;
      this.managerComments[d.id] = d.managerComment ?? null;
    });
  }

  saveDraft(): void {
    const dto = this.assessment();
    if (!dto) return;
    const body: SaveManagerReviewRequest = {
      details: dto.details.map(d => ({
        detailId: d.id,
        managerProficiencyLevelId: this.managerLevels[d.id] ?? null,
        managerComment: this.managerComments[d.id] ?? null,
      })),
      overallComment: null,
    };
    this.saving.set(true);
    this.api.saveManagerReview(dto.id, body).subscribe({
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

  complete(): void {
    const dto = this.assessment();
    if (!dto) return;
    this.saving.set(true);
    this.api.completeManagerReview(dto.id).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success) {
          this.showCompleteSuccessModal.set(true);
        } else {
          this.error.set(res.message ?? 'Failed to complete');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.errors?.[0] ?? err.error?.message ?? 'Failed to complete');
      },
    });
  }

  closeCompleteSuccessModal(): void {
    this.showCompleteSuccessModal.set(false);
    this.router.navigate(['/assessments/manager']);
  }
}

