import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { AssessmentsApiService } from '../../../core/api/assessments/assessments-api.service';
import type { AssessmentSummaryDto } from '../../../core/api/assessments/assessments-api.models';

@Component({
  selector: 'app-manager-assessments-page',
  standalone: true,
  imports: [RouterModule, TranslateModule, PageShellComponent],
  template: `
    <app-page-shell [title]="'assessments.managerTitle' | translate" [breadcrumbs]="breadcrumbs()">
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
            <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="load()">{{ 'empty.tryAgain' | translate }}</button>
          </div>
        } @else if (!items().length) {
          <div class="ds-empty">
            <p class="ds-empty__title">{{ 'empty.noItems' | translate }}</p>
          </div>
        } @else {
          <div class="ds-table-wrap">
            <table class="ds-table">
              <thead>
                <tr>
                  <th>{{ 'assessments.employee' | translate }}</th>
                  <th>{{ 'assessments.cycleName' | translate }}</th>
                  <th>{{ 'assessments.status' | translate }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (a of items(); track a.id) {
                  <tr>
                    <td>{{ a.employeeNameEn }}</td>
                    <td>{{ a.cycleNameEn }}</td>
                    <td>{{ a.status }}</td>
                    <td class="cell-actions">
                      <a
                        class="ds-btn ds-btn--ghost ds-btn--icon"
                        [routerLink]="['/assessments/manager', a.id]"
                        [attr.aria-label]="'common.details' | translate"
                        [title]="'common.details' | translate"
                      >
                        <svg class="icon-svg" viewBox="0 0 24 24">
                          <circle cx="11" cy="11" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/>
                          <path d="m16 16 3 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                        </svg>
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </app-page-shell>
  `,
  styles: [`
    .table-loading { padding: var(--space-md) 0; }
    .cell-actions { text-align: end; }
  `]
})
export class ManagerAssessmentsPageComponent implements OnInit {
  private readonly api = inject(AssessmentsApiService);
  private readonly translate = inject(TranslateService);

  readonly items = signal<AssessmentSummaryDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  breadcrumbs = computed(() => [{ label: this.translate.instant('assessments.managerTitle') }]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getPendingManagerReviews().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) this.items.set(res.data);
        else this.error.set(res.message ?? 'Failed to load');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? err.message ?? 'Failed to load');
      },
    });
  }
}

