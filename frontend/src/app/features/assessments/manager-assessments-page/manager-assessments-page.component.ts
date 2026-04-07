import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { AssessmentsApiService } from '../../../core/api/assessments/assessments-api.service';
import type { AssessmentSummaryDto } from '../../../core/api/assessments/assessments-api.models';

@Component({
  selector: 'app-manager-assessments-page',
  standalone: true,
  imports: [RouterModule, FormsModule, TranslateModule, PageShellComponent],
  template: `
    <app-page-shell
      [title]="'assessments.managerTitle' | translate"
      [breadcrumbs]="breadcrumbs()"
      [fullWidth]="true"
      [showPageTitle]="false"
    >
      <div class="ent-admin-page ent-page-fade-in">
        <header class="ent-admin-hero">
          <div class="ent-admin-hero__inner">
            <div class="ld-training-hero-top">
              <div>
                <p class="ld-training-eyebrow">{{ 'nav.learningGroup' | translate }}</p>
                <h1 class="ent-admin-hero__title">{{ 'assessments.managerTitle' | translate }}</h1>
                <p class="ent-admin-hero__subtitle">
                  {{ 'trainingHub.managerAssessmentsHeroSubtitle' | translate }}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div filters>
          <div class="ent-admin-filters ent-admin-filters--filter-matrix ent-admin-filters--matrix-5 ds-filterbar">
            <div class="ds-filterbar__controls">
              <div class="ds-filterfield">
                <div class="ds-filterfield__label">{{ 'common.search' | translate }}</div>
                <input
                  type="text"
                  class="ds-input filter-search ds-filterfield__control"
                  [(ngModel)]="searchQuery"
                  [placeholder]="'common.search' | translate"
                />
              </div>
              <div class="ds-filterfield">
                <div class="ds-filterfield__label">{{ 'assessments.employee' | translate }}</div>
                <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="employeeIdFilter">
                  <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                  @for (opt of employeePicklist(); track opt.id) {
                    <option [ngValue]="opt.id">{{ opt.name }}</option>
                  }
                </select>
              </div>
              <div class="ds-filterfield">
                <div class="ds-filterfield__label">{{ 'assessments.cycleName' | translate }}</div>
                <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="cycleIdFilter">
                  <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                  @for (opt of cyclePicklist(); track opt.id) {
                    <option [ngValue]="opt.id">{{ opt.label }}</option>
                  }
                </select>
              </div>
              <div class="ds-filterfield">
                <div class="ds-filterfield__label">{{ 'table.manager' | translate }}</div>
                <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="managerNameFilter">
                  <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                  @for (name of managerPicklist(); track name) {
                    <option [ngValue]="name">{{ name }}</option>
                  }
                </select>
              </div>
              <div class="ds-filterfield">
                <div class="ds-filterfield__label">{{ 'assessments.status' | translate }}</div>
                <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="statusFilter">
                  <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                  @for (st of statusPicklist(); track st) {
                    <option [ngValue]="st">{{ getStatusLabel(st) }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="ds-filterbar__actions">
              <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="clearFilters()">
                {{ 'common.clearFilters' | translate }}
              </button>
            </div>
          </div>
        </div>

        <div class="ent-admin-content">
          @if (loading()) {
            <div class="ent-table-panel table-loading">
              <div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div>
              <div class="ds-skeleton" style="height: 48px; margin-bottom: 8px;"></div>
              <div class="ds-skeleton" style="height: 48px;"></div>
            </div>
          } @else if (error()) {
            <div class="ent-table-panel">
              <div class="ds-error-state">
                <p class="ds-error-state__title">{{ error() }}</p>
                <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="load()">
                  {{ 'empty.tryAgain' | translate }}
                </button>
              </div>
            </div>
          } @else if (!items().length) {
            <div class="ent-table-panel">
              <div class="ds-empty">
                <p class="ds-empty__title">{{ 'empty.noItems' | translate }}</p>
              </div>
            </div>
          } @else if (!filteredRows().length) {
            <div class="ent-table-panel">
              <div class="ds-empty">
                <p class="ds-empty__title">{{ 'table.noRows' | translate }}</p>
                <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="clearFilters()">
                  {{ 'common.clearFilters' | translate }}
                </button>
              </div>
            </div>
          } @else {
            <div class="ent-table-panel">
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
                    @for (a of filteredRows(); track a.id) {
                      <tr>
                        <td>{{ a.employeeNameEn }}</td>
                        <td>{{ a.cycleNameEn }}</td>
                        <td>
                          <span
                            class="ds-badge"
                            [class.ds-badge--info]="a.status === 'NotStarted' || a.status === 'InProgress'"
                            [class.ds-badge--success]="a.status === 'Finalized'"
                            [class.ds-badge--neutral]="a.status === 'Submitted' || a.status === 'ManagerReviewed'"
                          >
                            {{ getStatusLabel(a.status) }}
                          </span>
                        </td>
                        <td class="cell-actions">
                          <a
                            class="ds-btn ds-btn--ghost ds-btn--icon"
                            [routerLink]="['/assessments/manager', a.id]"
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
        text-align: end;
        display: flex;
        justify-content: flex-end;
      }
    `,
  ],
})
export class ManagerAssessmentsPageComponent implements OnInit {
  private readonly api = inject(AssessmentsApiService);
  private readonly translate = inject(TranslateService);

  readonly items = signal<AssessmentSummaryDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  searchQuery = '';
  employeeIdFilter: string | null = null;
  cycleIdFilter: string | null = null;
  managerNameFilter: string | null = null;
  statusFilter: string | null = null;

  readonly employeePicklist = computed(() => {
    const m = new Map<string, string>();
    for (const a of this.items()) {
      if (!m.has(a.employeeId)) m.set(a.employeeId, a.employeeNameEn ?? '—');
    }
    return [...m.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((x, y) => x.name.localeCompare(y.name));
  });

  readonly cyclePicklist = computed(() => {
    const m = new Map<string, { code: string; name: string }>();
    for (const a of this.items()) {
      if (!m.has(a.assessmentCycleId)) {
        m.set(a.assessmentCycleId, {
          code: a.cycleCode ?? '',
          name: a.cycleNameEn ?? '',
        });
      }
    }
    return [...m.entries()]
      .map(([id, v]) => ({
        id,
        label: v.code ? `${v.code} — ${v.name}` : v.name,
      }))
      .sort((x, y) => x.label.localeCompare(y.label));
  });

  readonly statusPicklist = computed(() => {
    const s = new Set<string>();
    for (const a of this.items()) {
      if (a.status) s.add(a.status);
    }
    return [...s].sort();
  });

  readonly managerPicklist = computed(() => {
    const s = new Set<string>();
    for (const a of this.items()) {
      const n = (a.managerNameEn ?? '').trim();
      if (n) s.add(n);
    }
    return [...s].sort();
  });

  breadcrumbs = computed(() => [{ label: this.translate.instant('assessments.managerTitle') }]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getPendingManagerReviews().subscribe({
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

  filteredRows(): AssessmentSummaryDto[] {
    let rows = [...this.items()];
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        r =>
          (r.employeeNameEn ?? '').toLowerCase().includes(q) ||
          (r.cycleNameEn ?? '').toLowerCase().includes(q) ||
          (r.cycleCode ?? '').toLowerCase().includes(q),
      );
    }
    if (this.employeeIdFilter) rows = rows.filter(r => r.employeeId === this.employeeIdFilter);
    if (this.cycleIdFilter) rows = rows.filter(r => r.assessmentCycleId === this.cycleIdFilter);
    if (this.managerNameFilter) {
      rows = rows.filter(r => (r.managerNameEn ?? '').trim() === this.managerNameFilter);
    }
    if (this.statusFilter) rows = rows.filter(r => r.status === this.statusFilter);
    return rows;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.employeeIdFilter = null;
    this.cycleIdFilter = null;
    this.managerNameFilter = null;
    this.statusFilter = null;
  }

  getStatusLabel(status: string): string {
    const key = 'assessments.status' + status;
    const t = this.translate.instant(key);
    return t !== key ? t : status;
  }
}
