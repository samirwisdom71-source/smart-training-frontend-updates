import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { TooltipDirective } from '../../../shared/tooltip/tooltip.directive';
import { AssessmentsApiService } from '../../../core/api/assessments/assessments-api.service';
import type { AssessmentSummaryDto } from '../../../core/api/assessments/assessments-api.models';

@Component({
  selector: 'app-my-assessments-page',
  standalone: true,
  imports: [RouterModule, TranslateModule, PageShellComponent, DatePipe, TooltipDirective],
  template: `
    <app-page-shell
      [title]="'assessments.myTitle' | translate"
      [breadcrumbs]="breadcrumbs()"
      [fullWidth]="true"
      [showPageTitle]="false"
    >
      <div class="ent-admin-page ent-page-fade-in">
        <header class="ent-admin-hero">
          <div class="ent-admin-hero__inner">
            <div class="ld-training-hero-top">
              <div>
                <p class="ld-training-eyebrow">{{ 'nav.assessments' | translate }}</p>
                <h1 class="ent-admin-hero__title">{{ 'assessments.myTitle' | translate }}</h1>
                <p class="ent-admin-hero__subtitle">
                  {{ 'trainingHub.myAssessmentsHeroSubtitle' | translate }}
                </p>
              </div>
              <div class="ld-training-hero-actions">
                <button
                  type="button"
                  class="ds-btn ds-btn--secondary ds-btn--sm"
                  (click)="load()"
                  [disabled]="loading()"
                  [appTooltip]="'common.refresh' | translate"
                  tooltipPlacement="top"
                >
                  {{ 'common.refresh' | translate }}
                </button>
                <a routerLink="/dashboard" class="ds-btn ds-btn--ghost ds-btn--sm">
                  {{ 'dashboard.overview' | translate }}
                </a>
              </div>
            </div>
          </div>
        </header>

        <div class="ent-admin-content">
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
              <div class="my-assessments-error">
                <div class="my-assessments-error__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                    <path
                      d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
                <p class="my-assessments-error__title">{{ error() }}</p>
                <button type="button" class="ds-btn ds-btn--primary ds-btn--sm" (click)="load()">
                  {{ 'empty.tryAgain' | translate }}
                </button>
              </div>
            </div>
          } @else if (!items().length) {
            <div class="ent-table-panel">
              <div class="my-assessments-empty">
                <div class="my-assessments-empty__visual" aria-hidden="true">
                  <svg viewBox="0 0 64 64" fill="none">
                    <rect
                      x="10"
                      y="12"
                      width="44"
                      height="40"
                      rx="10"
                      stroke="currentColor"
                      stroke-width="2"
                      opacity="0.35"
                    />
                    <path
                      d="M22 24h20M22 32h14M22 40h18"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      opacity="0.45"
                    />
                    <circle cx="48" cy="20" r="12" fill="color-mix(in srgb, var(--gulf-gold) 35%, white)" />
                    <path
                      d="M44.5 20 47 22.5 51.5 18"
                      stroke="var(--gulf-green-800)"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
                <h2 class="my-assessments-empty__title">{{ 'assessments.myEmptyTitle' | translate }}</h2>
                <p class="my-assessments-empty__hint">{{ 'assessments.noAssessmentsHint' | translate }}</p>
              </div>
            </div>
          } @else {
            <div class="ent-table-panel">
              <div class="ds-table-wrap">
                <table class="ds-table">
                  <thead>
                    <tr>
                      <th>{{ 'assessments.cycleCode' | translate }}</th>
                      <th>{{ 'assessments.cycleName' | translate }}</th>
                      <th>{{ 'assessments.status' | translate }}</th>
                      <th>{{ 'assessments.startDate' | translate }}</th>
                      <th>{{ 'assessments.endDate' | translate }}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (a of items(); track a.id) {
                      <tr>
                        <td class="cell-strong">{{ a.cycleCode }}</td>
                        <td>{{ a.cycleNameEn }}</td>
                        <td>
                          <span
                            class="ds-badge"
                            [class.ds-badge--info]="a.status === 'NotStarted' || a.status === 'InProgress'"
                            [class.ds-badge--success]="a.status === 'Finalized'"
                            [class.ds-badge--neutral]="
                              a.status === 'Submitted' || a.status === 'ManagerReviewed'
                            "
                          >
                            {{ getStatusLabel(a.status) }}
                          </span>
                        </td>
                        <td>{{ a.cycleStartDate ? (a.cycleStartDate | date: 'shortDate') : '—' }}</td>
                        <td>{{ a.cycleEndDate ? (a.cycleEndDate | date: 'shortDate') : '—' }}</td>
                        <td class="cell-actions">
                          @if (a.status === 'NotStarted' || a.status === 'InProgress') {
                            <a
                              [routerLink]="['/assessments/my', a.id]"
                              class="ds-btn ds-btn--primary ds-btn--sm"
                            >
                              {{
                                a.status === 'NotStarted'
                                  ? ('assessments.startAssessment' | translate)
                                  : ('assessments.continueAssessment' | translate)
                              }}
                            </a>
                          }
                          <a
                            class="ds-btn ds-btn--ghost ds-btn--icon"
                            [routerLink]="['/assessments/my', a.id]"
                            [attr.aria-label]="'common.details' | translate"
                            [title]="'common.details' | translate"
                          >
                            <svg class="icon-svg" viewBox="0 0 24 24">
                              <circle cx="11" cy="11" r="5" fill="none" stroke="currentColor" stroke-width="1.6" />
                              <path
                                d="m16 16 3 3"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.6"
                                stroke-linecap="round"
                              />
                            </svg>
                          </a>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      </div>
    </app-page-shell>
  `,
  styles: [
    `
      .table-loading {
        padding: var(--space-md) var(--space-lg);
      }
      .cell-actions {
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--space-xs);
        flex-wrap: wrap;
      }
      .cell-strong {
        font-weight: 600;
        color: var(--gulf-green-900);
      }
      .my-assessments-empty {
        padding: var(--space-xl) var(--space-lg);
        text-align: center;
        max-width: 520px;
        margin-inline: auto;
      }
      .my-assessments-empty__visual {
        width: 88px;
        height: 88px;
        margin-inline: auto;
        margin-bottom: var(--space-md);
        color: color-mix(in srgb, var(--gulf-green-800) 55%, var(--gulf-gold));
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 22px;
        background: linear-gradient(
          160deg,
          color-mix(in srgb, var(--color-bg-elevated) 92%, var(--gulf-emerald) 6%) 0%,
          rgba(255, 255, 255, 0.72) 100%
        );
        border: 1px solid color-mix(in srgb, var(--gulf-gold) 24%, var(--color-border-light));
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.85),
          0 14px 36px rgba(15, 61, 46, 0.08);
      }
      .my-assessments-empty__visual svg {
        width: 64px;
        height: 64px;
      }
      .my-assessments-empty__title {
        margin: 0 0 var(--space-sm);
        font-size: var(--text-h2);
        font-weight: 700;
        letter-spacing: -0.02em;
        color: var(--gulf-green-900);
      }
      .my-assessments-empty__hint {
        margin: 0;
        font-size: var(--text-body-sm);
        line-height: var(--line-height-relaxed);
        color: var(--color-text-secondary);
      }
      .my-assessments-error {
        padding: var(--space-xl) var(--space-lg);
        text-align: center;
        max-width: 440px;
        margin-inline: auto;
      }
      .my-assessments-error__icon {
        width: 52px;
        height: 52px;
        margin-inline: auto;
        margin-bottom: var(--space-md);
        color: var(--color-error, #b91c1c);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .my-assessments-error__icon svg {
        width: 44px;
        height: 44px;
      }
      .my-assessments-error__title {
        margin: 0 0 var(--space-md);
        font-weight: 600;
        color: var(--color-text);
      }
    `,
  ],
})
export class MyAssessmentsPageComponent implements OnInit {
  private readonly api = inject(AssessmentsApiService);
  private readonly translate = inject(TranslateService);

  readonly items = signal<AssessmentSummaryDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  breadcrumbs = computed(() => [{ label: this.translate.instant('assessments.myTitle') }]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getMyAssessments().subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) this.items.set(res.data);
        else this.error.set(res.message ?? 'Failed to load');
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? err.message ?? 'Failed to load');
      },
    });
  }

  getStatusLabel(status: string): string {
    const key = 'assessments.status' + status;
    const t = this.translate.instant(key);
    return t !== key ? t : status;
  }
}
