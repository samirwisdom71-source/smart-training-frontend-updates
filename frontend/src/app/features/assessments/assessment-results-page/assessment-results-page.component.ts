import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { AssessmentsApiService } from '../../../core/api/assessments/assessments-api.service';
import type { AssessmentResultListDto } from '../../../core/api/assessments/assessments-api.models';
import type { PagedResult } from '../../../core/models/api-response';

@Component({
  selector: 'app-assessment-results-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, PageShellComponent, DecimalPipe],
  template: `
    <app-page-shell [title]="'assessments.resultsTitle' | translate" [breadcrumbs]="breadcrumbs()">
      <div filters>
        <div class="ds-filterbar">
          <div class="ds-filterbar__controls">
            <div class="ds-filterfield" style="max-width: 280px;">
              <div class="ds-filterfield__label">{{ 'common.search' | translate }}</div>
              <input type="text" class="ds-input filter-search ds-filterfield__control" [(ngModel)]="search" (ngModelChange)="onSearchChange()" />
            </div>
          </div>
          <div class="ds-filterbar__actions">
            <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="clearFilters()">
              {{ 'common.clearFilters' | translate }}
            </button>
          </div>
        </div>
      </div>
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
        } @else if (!data()?.items?.length) {
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
                  <th>{{ 'assessments.gap' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (r of data()!.items; track r.id) {
                  <tr>
                    <td>{{ r.employeeNameEn }}</td>
                    <td>{{ r.cycleNameEn }}</td>
                    <td>{{ r.status }}</td>
                    <td>{{ r.averageGap | number:'1.1-1' }}</td>
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
    .filter-row { display: flex; gap: var(--space-md); align-items: center; flex-wrap: wrap; }
    .filter-search { max-width: 280px; }
    .table-loading { padding: var(--space-md) 0; }
  `]
})
export class AssessmentResultsPageComponent implements OnInit {
  private readonly api = inject(AssessmentsApiService);
  private readonly translate = inject(TranslateService);

  readonly data = signal<PagedResult<AssessmentResultListDto> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  search = '';
  searchDebounce: ReturnType<typeof setTimeout> | null = null;

  breadcrumbs = computed(() => [{ label: this.translate.instant('assessments.resultsTitle') }]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getAssessmentResultsPaged({
      page: this.page(),
      pageSize: this.pageSize,
      status: undefined,
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) this.data.set(res.data);
        else this.error.set(res.message ?? 'Failed to load');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? err.message ?? 'Failed to load');
      },
    });
  }

  onSearchChange(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => { this.page.set(1); this.load(); }, 300);
  }

  clearFilters(): void {
    this.search = '';
    this.page.set(1);
    this.load();
  }
}

