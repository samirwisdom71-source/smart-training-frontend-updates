import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, switchMap } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { AssessmentsApiService } from '../../../core/api/assessments/assessments-api.service';
import { EmployeesApiService } from '../../../core/api/employees/employees-api.service';
import { OrganizationsApiService } from '../../../core/api/organizations/organizations-api.service';
import { OrganizationalUnitsApiService } from '../../../core/api/organizational-units/organizational-units-api.service';
import { JobsApiService } from '../../../core/api/jobs/jobs-api.service';
import { LocalizedTextPipe } from '../../../shared/pipes/localized-text.pipe';
import type { AssessmentCycleListDto, CompetencyGapListDto } from '../../../core/api/assessments/assessments-api.models';
import type { EmployeeListDto } from '../../../core/api/employees/employees-api.models';
import type { OrganizationalUnitListDto } from '../../../core/api/organizational-units/organizational-units-api.models';
import type { JobListDto } from '../../../core/api/jobs/jobs-api.models';
import type { PagedResult } from '../../../core/models/api-response';
import {
  DataViewPreferenceService,
  DataViewToggleComponent,
  LuxDataCardComponent,
  LuxDataCardGridComponent,
} from '../../../shared/data-view';

@Component({
  selector: 'app-gap-analysis-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, PageShellComponent, LocalizedTextPipe, DataViewToggleComponent, LuxDataCardComponent, LuxDataCardGridComponent],
  template: `
    <app-page-shell
      [title]="'assessments.gapsTitle' | translate"
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
                <h1 class="ent-admin-hero__title">{{ 'assessments.gapsTitle' | translate }}</h1>
                <p class="ent-admin-hero__subtitle">
                  {{ 'trainingHub.gapAnalysisHeroSubtitle' | translate }}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div filters>
          <div class="ent-admin-filters ent-admin-filters--filter-matrix ent-admin-filters--matrix-6 ds-filterbar">
            <div class="ds-filterbar__controls">
              <div class="ds-filterfield">
                <div class="ds-filterfield__label">{{ 'common.search' | translate }}</div>
                <input
                  type="text"
                  class="ds-input filter-search ds-filterfield__control"
                  [(ngModel)]="search"
                  (ngModelChange)="onSearchChange()"
                  [placeholder]="'common.search' | translate"
                />
              </div>
              <div class="ds-filterfield">
                <div class="ds-filterfield__label">{{ 'assessments.employee' | translate }}</div>
                <select
                  class="ds-input filter-select filter-select--employee ds-filterfield__control"
                  [(ngModel)]="employeeIdFilter"
                  (ngModelChange)="onFilterChange()"
                >
                  <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                  @for (emp of employeeOptions(); track emp.id) {
                    <option [ngValue]="emp.id">
                      {{ emp.fullNameAr | localizedText:emp.fullNameEn }} ({{ emp.employeeNumber }})
                    </option>
                  }
                </select>
              </div>
              <div class="ds-filterfield">
                <div class="ds-filterfield__label">{{ 'table.job' | translate }}</div>
                <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="jobIdFilter" (ngModelChange)="onFilterChange()">
                  <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                  @for (j of jobOptions(); track j.id) {
                    <option [ngValue]="j.id">{{ j.titleAr | localizedText:j.titleEn }}</option>
                  }
                </select>
              </div>
              <div class="ds-filterfield">
                <div class="ds-filterfield__label">{{ 'table.organizationalUnit' | translate }}</div>
                <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="orgUnitIdFilter" (ngModelChange)="onFilterChange()">
                  <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                  @for (ou of ouOptions(); track ou.id) {
                    <option [ngValue]="ou.id">{{ ou.nameAr | localizedText:ou.nameEn }}</option>
                  }
                </select>
              </div>
              <div class="ds-filterfield">
                <div class="ds-filterfield__label">{{ 'assessments.cycleName' | translate }}</div>
                <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="cycleIdFilter" (ngModelChange)="onFilterChange()">
                  <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                  @for (c of cycleOptions(); track c.id) {
                    <option [ngValue]="c.id">{{ c.nameAr | localizedText:c.nameEn }}</option>
                  }
                </select>
              </div>
              <div class="ds-filterfield">
                <div class="ds-filterfield__label">{{ 'assessments.severity' | translate }}</div>
                <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="severityFilter" (ngModelChange)="onFilterChange()">
                  <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                  <option value="Low">{{ 'assessments.gapLow' | translate }}</option>
                  <option value="Medium">{{ 'assessments.gapMedium' | translate }}</option>
                  <option value="High">{{ 'assessments.gapHigh' | translate }}</option>
                </select>
              </div>
            </div>
            <div class="ds-filterbar__actions">
              <app-data-view-toggle />
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
          } @else if (!data()?.items?.length) {
            <div class="ent-table-panel">
              <div class="ds-empty">
                <p class="ds-empty__title">{{ 'empty.noItems' | translate }}</p>
              </div>
            </div>
          } @else {
            @if (dataViewPref.mode() === 'table') {
            <div class="ent-table-panel">
              <div class="ds-table-wrap">
                <table class="ds-table">
                  <thead>
                    <tr>
                      <th>{{ 'assessments.employee' | translate }}</th>
                      <th>{{ 'table.job' | translate }}</th>
                      <th>{{ 'table.code' | translate }}</th>
                      <th>{{ 'table.name' | translate }}</th>
                      <th>{{ 'table.type' | translate }}</th>
                      <th>{{ 'assessments.requiredLevel' | translate }}</th>
                      <th>{{ 'assessments.finalLevel' | translate }}</th>
                      <th>{{ 'assessments.gap' | translate }}</th>
                      <th>{{ 'assessments.severity' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (g of data()!.items; track g.id) {
                      <tr>
                        <td>{{ g.employeeNameAr | localizedText:g.employeeNameEn }}</td>
                        <td>{{ localizedJobTitle(g) }}</td>
                        <td>{{ g.competencyCode }}</td>
                        <td>{{ g.competencyNameAr | localizedText:g.competencyNameEn }}</td>
                        <td>{{ g.competencyTypeNameAr | localizedText:g.competencyTypeNameEn }}</td>
                        <td>{{ g.requiredLevelCode }} ({{ g.requiredLevelNumber }})</td>
                        <td>{{ g.currentFinalLevelCode ?? '—' }}</td>
                        <td>{{ g.gapAmount }}</td>
                        <td>
                          <span
                            class="ds-badge"
                            [class.ds-badge--neutral]="g.severity === 'Low'"
                            [class.ds-badge--info]="g.severity === 'Medium'"
                            [class.ds-badge--danger]="g.severity === 'High'"
                          >
                            @switch (g.severity) {
                              @case ('Low') {
                                {{ 'assessments.gapLow' | translate }}
                              }
                              @case ('Medium') {
                                {{ 'assessments.gapMedium' | translate }}
                              }
                              @case ('High') {
                                {{ 'assessments.gapHigh' | translate }}
                              }
                              @default {
                                {{ g.severity || '—' }}
                              }
                            }
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
            } @else {
              <div class="ent-table-panel" style="padding: var(--space-md)">
                <app-lux-data-card-grid>
                  @for (g of data()!.items; track g.id) {
                    <app-lux-data-card [interactive]="false">
                      <div luxCardHeader class="gap-lux-head">
                        <span class="gap-lux-head__title">{{ g.competencyNameAr | localizedText:g.competencyNameEn }}</span>
                        <span
                          class="ds-badge"
                          [class.ds-badge--neutral]="g.severity === 'Low'"
                          [class.ds-badge--info]="g.severity === 'Medium'"
                          [class.ds-badge--danger]="g.severity === 'High'"
                        >
                          @switch (g.severity) {
                            @case ('Low') {
                              {{ 'assessments.gapLow' | translate }}
                            }
                            @case ('Medium') {
                              {{ 'assessments.gapMedium' | translate }}
                            }
                            @case ('High') {
                              {{ 'assessments.gapHigh' | translate }}
                            }
                            @default {
                              {{ g.severity || '—' }}
                            }
                          }
                        </span>
                      </div>
                      <div class="lux-dc-meta">
                        <div class="lux-dc-meta__row">
                          <span class="lux-dc-meta__label">{{ 'assessments.employee' | translate }}</span>
                          <span class="lux-dc-meta__value">{{ g.employeeNameAr | localizedText:g.employeeNameEn }}</span>
                        </div>
                        <div class="lux-dc-meta__row">
                          <span class="lux-dc-meta__label">{{ 'table.job' | translate }}</span>
                          <span class="lux-dc-meta__value">{{ localizedJobTitle(g) }}</span>
                        </div>
                        <div class="lux-dc-meta__row">
                          <span class="lux-dc-meta__label">{{ 'table.code' | translate }}</span>
                          <span class="lux-dc-meta__value">{{ g.competencyCode }}</span>
                        </div>
                        <div class="lux-dc-meta__row">
                          <span class="lux-dc-meta__label">{{ 'table.type' | translate }}</span>
                          <span class="lux-dc-meta__value">{{ g.competencyTypeNameAr | localizedText:g.competencyTypeNameEn }}</span>
                        </div>
                        <div class="lux-dc-meta__row">
                          <span class="lux-dc-meta__label">{{ 'assessments.requiredLevel' | translate }}</span>
                          <span class="lux-dc-meta__value">{{ g.requiredLevelCode }} ({{ g.requiredLevelNumber }})</span>
                        </div>
                        <div class="lux-dc-meta__row">
                          <span class="lux-dc-meta__label">{{ 'assessments.finalLevel' | translate }}</span>
                          <span class="lux-dc-meta__value">{{ g.currentFinalLevelCode ?? '—' }}</span>
                        </div>
                        <div class="lux-dc-meta__row">
                          <span class="lux-dc-meta__label">{{ 'assessments.gap' | translate }}</span>
                          <span class="lux-dc-meta__value">{{ g.gapAmount }}</span>
                        </div>
                      </div>
                    </app-lux-data-card>
                  }
                </app-lux-data-card-grid>
              </div>
            }
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
      .filter-select--employee {
        max-width: none;
        min-width: 0;
      }
      .gap-lux-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-sm);
        margin-bottom: var(--space-sm);
      }
      .gap-lux-head__title {
        flex: 1;
        min-width: 0;
        font-weight: 700;
        font-size: var(--text-body);
        line-height: 1.3;
      }
    `,
  ],
})
export class GapAnalysisPageComponent implements OnInit {
  private readonly api = inject(AssessmentsApiService);
  private readonly employeesApi = inject(EmployeesApiService);
  private readonly orgApi = inject(OrganizationsApiService);
  private readonly ouApi = inject(OrganizationalUnitsApiService);
  private readonly jobsApi = inject(JobsApiService);
  private readonly translate = inject(TranslateService);
  readonly dataViewPref = inject(DataViewPreferenceService);

  readonly data = signal<PagedResult<CompetencyGapListDto> | null>(null);
  readonly cycleOptions = signal<AssessmentCycleListDto[]>([]);
  readonly ouOptions = signal<OrganizationalUnitListDto[]>([]);
  readonly jobOptions = signal<JobListDto[]>([]);
  readonly employeeOptions = signal<EmployeeListDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  search = '';
  cycleIdFilter: string | null = null;
  orgUnitIdFilter: string | null = null;
  jobIdFilter: string | null = null;
  employeeIdFilter: string | null = null;
  severityFilter: string | null = null;

  breadcrumbs = computed(() => [{ label: this.translate.instant('assessments.gapsTitle') }]);

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadEmployeeOptions();
    this.load();
  }

  loadFilterOptions(): void {
    this.orgApi
      .getDefault()
      .pipe(
        switchMap(orgRes => {
          const orgId = orgRes.success && orgRes.data?.id ? orgRes.data.id : undefined;
          return forkJoin({
            cycles: this.api.getCyclesPaged({ page: 1, pageSize: 500 }),
            ous: this.ouApi.getPaged({
              page: 1,
              pageSize: 5000,
              organizationId: orgId,
              rootOnly: false,
              sortBy: 'type',
            }),
            jobs: this.jobsApi.getPaged({ page: 1, pageSize: 500, isActive: true }),
          });
        }),
      )
      .subscribe({
        next: ({ cycles, ous, jobs }) => {
          if (cycles.success && cycles.data) this.cycleOptions.set(cycles.data.items);
          if (ous.success && ous.data) this.ouOptions.set(ous.data.items);
          if (jobs.success && jobs.data) this.jobOptions.set(jobs.data.items);
        },
      });
  }

  loadEmployeeOptions(): void {
    this.employeesApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: res => {
        if (res.success && res.data) this.employeeOptions.set(res.data.items);
      },
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getGapsPaged({
        page: this.page(),
        pageSize: this.pageSize,
        search: this.search.trim() || undefined,
        cycleId: this.cycleIdFilter ?? undefined,
        orgUnitId: this.orgUnitIdFilter ?? undefined,
        jobId: this.jobIdFilter ?? undefined,
        employeeId: this.employeeIdFilter ?? undefined,
        severity: this.severityFilter ?? undefined,
      })
      .subscribe({
        next: res => {
          this.loading.set(false);
          if (res.success && res.data) this.data.set(res.data);
          else this.error.set(res.message ?? 'Failed to load');
        },
        error: err => {
          this.loading.set(false);
          this.error.set(err.error?.message ?? err.message ?? 'Failed to load');
        },
      });
  }

  onSearchChange(): void {
    this.page.set(1);
    this.load();
  }

  onFilterChange(): void {
    this.page.set(1);
    this.load();
  }

  clearFilters(): void {
    this.search = '';
    this.cycleIdFilter = null;
    this.orgUnitIdFilter = null;
    this.jobIdFilter = null;
    this.employeeIdFilter = null;
    this.severityFilter = null;
    this.page.set(1);
    this.load();
  }

  localizedJobTitle(g: CompetencyGapListDto): string {
    const j = g.jobId ? this.jobOptions().find(x => x.id === g.jobId) : undefined;
    const ar = (j?.titleAr ?? g.jobTitleAr)?.trim() ?? '';
    const en = (j?.titleEn ?? g.jobTitleEn)?.trim() ?? '';
    const lang = (this.translate.currentLang || this.translate.getDefaultLang() || 'en').toLowerCase();
    if (lang.startsWith('ar')) return ar || en || '—';
    return en || ar || '—';
  }
}
