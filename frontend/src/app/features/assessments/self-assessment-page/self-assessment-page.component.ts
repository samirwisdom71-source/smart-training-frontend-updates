import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { PortalToBodyDirective } from '../../../shared/portal/portal-to-body.directive';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { AssessmentsApiService } from '../../../core/api/assessments/assessments-api.service';
import type { AssessmentDto, SaveSelfAssessmentRequest } from '../../../core/api/assessments/assessments-api.models';

@Component({
  selector: 'app-self-assessment-page',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    TranslateModule,
    PageShellComponent,
    PortalToBodyDirective,
    TooltipDirective,
  ],
  template: `
    <app-page-shell
      [title]="'assessments.selfTitle' | translate"
      [breadcrumbs]="breadcrumbs()"
      [fullWidth]="true"
      [showPageTitle]="false"
      [showBack]="true"
    >
      <div class="ent-admin-page ent-page-fade-in">
        @if (loading()) {
          <div class="ent-table-panel">
            <div class="table-loading">
              <div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div>
              <div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div>
              <div class="ds-skeleton" style="height: 48px;"></div>
            </div>
          </div>
        } @else if (error()) {
          <div class="ent-table-panel">
            <div class="sa-error">
              <p class="sa-error__title">{{ error() }}</p>
              <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="reload()">
                {{ 'empty.tryAgain' | translate }}
              </button>
            </div>
          </div>
        } @else if (!assessment()) {
          <div class="ent-table-panel">
            <div class="sa-error sa-error--muted">
              <p class="sa-error__title">{{ 'empty.noItems' | translate }}</p>
              <a routerLink="/assessments/my" class="ds-btn ds-btn--primary ds-btn--sm">{{
                'assessments.myTitle' | translate
              }}</a>
            </div>
          </div>
        } @else {
          <header class="ent-admin-hero">
            <div class="ent-admin-hero__inner">
              <div class="ld-training-hero-top">
                <div>
                  <p class="ld-training-eyebrow">{{ 'assessments.selfTitle' | translate }}</p>
                  <h1 class="ent-admin-hero__title">{{ assessment()!.summary.cycleNameEn }}</h1>
                  <p class="ent-admin-hero__subtitle">
                    {{ 'assessments.cycleCode' | translate }}: {{ assessment()!.summary.cycleCode }}
                  </p>
                </div>
                <div class="sa-hero-badge">
                  <span
                    class="ds-badge sa-status-badge"
                    [class.ds-badge--info]="
                      assessment()!.summary.status === 'NotStarted' ||
                      assessment()!.summary.status === 'InProgress'
                    "
                    [class.ds-badge--success]="assessment()!.summary.status === 'Finalized'"
                    [class.ds-badge--neutral]="
                      assessment()!.summary.status === 'Submitted' ||
                      assessment()!.summary.status === 'ManagerReviewed'
                    "
                  >
                    {{ getStatusLabel(assessment()!.summary.status) }}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <div class="ent-admin-content">
            <div class="ent-table-panel">
              <div class="ds-table-wrap">
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
                        <td class="cell-mono">{{ d.competencyCode }}</td>
                        <td>{{ d.competencyNameEn }}</td>
                        <td>{{ d.importanceWeight ?? '—' }}</td>
                        <td>
                          <select
                            class="ds-input sa-select"
                            [(ngModel)]="selfLevels[d.id]"
                            name="selfLevel-{{ d.id }}"
                          >
                            <option [ngValue]="null">—</option>
                            @for (lvl of d.proficiencyLevelOptions || []; track lvl.id) {
                              <option [ngValue]="lvl.id">
                                {{ lvl.code }} ({{ lvl.levelNumber }})
                              </option>
                            }
                          </select>
                        </td>
                        <td>
                          <textarea
                            class="ds-textarea sa-textarea"
                            rows="2"
                            [(ngModel)]="selfComments[d.id]"
                            name="selfComment-{{ d.id }}"
                          ></textarea>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <section class="sa-actions">
              <a routerLink="/assessments/my" class="ds-btn ds-btn--secondary">{{
                'common.back' | translate
              }}</a>
              <div class="sa-actions__primary">
                <button type="button" class="ds-btn ds-btn--secondary" (click)="saveDraft()" [disabled]="saving()">
                  {{ saving() ? ('common.loading' | translate) : ('assessments.saveDraft' | translate) }}
                </button>
                <button type="button" class="ds-btn ds-btn--primary" (click)="submit()" [disabled]="saving()">
                  {{ 'assessments.submitSelf' | translate }}
                </button>
              </div>
            </section>
          </div>
        }
      </div>
    </app-page-shell>

    @if (showSubmitSuccessModal()) {
      <div class="ent-modal-overlay" appPortalToBody>
        <button
          type="button"
          class="ent-modal-backdrop"
          [attr.aria-label]="'common.close' | translate"
          (click)="closeSubmitSuccessModal()"
        ></button>
        <div
          class="ent-modal-shell ent-modal-shell--sm modal-drawer premium-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sa-success-title"
          (click)="$event.stopPropagation()"
        >
          <div class="premium-modal__header">
            <div class="premium-modal__titlewrap">
              <h3 id="sa-success-title" class="premium-modal__title">
                {{ 'assessments.submitSuccessTitle' | translate }}
              </h3>
              <p class="premium-modal__subtitle">{{ 'assessments.selfTitle' | translate }}</p>
            </div>
            <button
              type="button"
              class="ds-btn ds-btn--ghost ds-btn--icon premium-modal__close"
              (click)="closeSubmitSuccessModal()"
              [attr.aria-label]="'common.close' | translate"
              [appTooltip]="'common.close' | translate"
            >
              <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6 6 18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>
          <div class="premium-modal__body">
            <p class="sa-modal-lead">{{ 'assessments.submitSuccessMessage' | translate }}</p>
            <p class="sa-modal-sub">{{ 'assessments.submitSuccessSubtitle' | translate }}</p>
            @if (submitSuccessManagerName()) {
              <p class="sa-modal-manager">
                <span class="sa-modal-manager__label">{{ 'table.manager' | translate }}</span>
                {{ submitSuccessManagerName() }}
              </p>
            }
          </div>
          <div class="premium-modal__footer premium-modal__footer--stack">
            <button type="button" class="ds-btn ds-btn--primary" (click)="closeSubmitSuccessModal()">
              {{ 'common.ok' | translate }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .table-loading {
        padding: var(--space-md) var(--space-lg);
      }
      .sa-hero-badge {
        display: flex;
        align-items: flex-start;
      }
      .sa-status-badge {
        font-size: var(--text-caption);
        font-weight: 700;
      }
      .cell-mono {
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: var(--gulf-green-900);
      }
      .sa-select {
        min-width: 8.5rem;
        max-width: 100%;
      }
      .sa-textarea {
        min-width: 12rem;
        max-width: 100%;
        resize: vertical;
      }
      .sa-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-md);
        margin-top: var(--space-lg);
        padding: var(--space-lg);
        flex-wrap: wrap;
        border-radius: var(--ent-radius-lg, 18px);
        border: 1px solid color-mix(in srgb, var(--gulf-gold) 18%, var(--color-border-light));
        background: color-mix(in srgb, var(--color-bg-elevated) 94%, var(--gulf-emerald) 4%);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
      }
      .sa-actions__primary {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-sm);
        justify-content: flex-end;
        margin-inline-start: auto;
      }
      .sa-error {
        padding: var(--space-xl) var(--space-lg);
        text-align: center;
      }
      .sa-error--muted .sa-error__title {
        color: var(--color-text-secondary);
      }
      .sa-error__title {
        margin: 0 0 var(--space-md);
        font-weight: 600;
      }
      .sa-modal-lead {
        margin: 0 0 var(--space-sm);
        font-size: var(--text-body);
        font-weight: 600;
        color: var(--gulf-green-900);
      }
      .sa-modal-sub {
        margin: 0;
        font-size: var(--text-body-sm);
        line-height: var(--line-height-relaxed);
        color: var(--color-text-secondary);
      }
      .sa-modal-manager {
        margin: var(--space-md) 0 0;
        padding: var(--space-sm) var(--space-md);
        border-radius: var(--radius-md);
        background: color-mix(in srgb, var(--gulf-gold) 10%, var(--color-bg-subtle));
        border: 1px solid color-mix(in srgb, var(--gulf-gold) 22%, transparent);
        font-weight: 600;
      }
      .sa-modal-manager__label {
        display: block;
        font-size: var(--text-caption);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--color-text-secondary);
        margin-bottom: 2px;
      }
    `,
  ],
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
    { label: this.translate.instant('assessments.myTitle'), route: '/assessments/my' },
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
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.assessment.set(res.data);
          this.initialiseForm(res.data);
        } else {
          this.error.set(res.message ?? 'Failed to load');
        }
      },
      error: err => {
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

  getStatusLabel(status: string): string {
    const key = 'assessments.status' + status;
    const t = this.translate.instant(key);
    return t !== key ? t : status;
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
      next: res => {
        this.saving.set(false);
        if (!res.success) this.error.set(res.message ?? 'Failed to save');
      },
      error: err => {
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
      next: res => {
        this.saving.set(false);
        if (res.success) {
          this.submitSuccessManagerName.set(dto.summary.managerNameEn ?? null);
          this.showSubmitSuccessModal.set(true);
        } else {
          this.error.set(res.message ?? 'Failed to submit');
        }
      },
      error: err => {
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
