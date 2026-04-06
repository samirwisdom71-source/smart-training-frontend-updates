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

@Component({
  selector: 'app-gap-analysis-page',
  standalone: true,
  imports: [FormsModule, TranslateModule, PageShellComponent, LocalizedTextPipe],
  template: `
    <app-page-shell [title]="'assessments.gapsTitle' | translate" [breadcrumbs]="breadcrumbs()">
      <div filters>
        <div class="ds-filterbar">
          <div class="ds-filterbar__controls">
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
              <div class="ds-filterfield__label">{{ 'table.organizationalUnit' | translate }}</div>
              <select class="ds-input filter-select ds-filterfield__control" [(ngModel)]="orgUnitIdFilter" (ngModelChange)="onFilterChange()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                @for (ou of ouOptions(); track ou.id) {
                  <option [ngValue]="ou.id">{{ ou.nameAr | localizedText:ou.nameEn }}</option>
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
              <div class="ds-filterfield__label">{{ 'assessments.employee' | translate }}</div>
              <select class="ds-input filter-select filter-select--employee ds-filterfield__control" [(ngModel)]="employeeIdFilter" (ngModelChange)="onFilterChange()">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                @for (emp of employeeOptions(); track emp.id) {
                  <option [ngValue]="emp.id">{{ emp.fullNameAr | localizedText:emp.fullNameEn }} ({{ emp.employeeNumber }})</option>
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
                      @switch (g.severity) {
                        @case ('Low') { {{ 'assessments.gapLow' | translate }} }
                        @case ('Medium') { {{ 'assessments.gapMedium' | translate }} }
                        @case ('High') { {{ 'assessments.gapHigh' | translate }} }
                        @default { {{ g.severity || '—' }} }
                      }
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
    .filter-row { display: flex; gap: var(--space-md); align-items: center; flex-wrap: wrap; }
    .filter-select { max-width: 200px; }
    .filter-select--employee { max-width: 360px; }
    .table-loading { padding: var(--space-md) 0; }
  `],
})
export class GapAnalysisPageComponent implements OnInit {
  private readonly api = inject(AssessmentsApiService);
  private readonly employeesApi = inject(EmployeesApiService);
  private readonly orgApi = inject(OrganizationsApiService);
  private readonly ouApi = inject(OrganizationalUnitsApiService);
  private readonly jobsApi = inject(JobsApiService);
  private readonly translate = inject(TranslateService);

  readonly data = signal<PagedResult<CompetencyGapListDto> | null>(null);
  readonly cycleOptions = signal<AssessmentCycleListDto[]>([]);
  readonly ouOptions = signal<OrganizationalUnitListDto[]>([]);
  readonly jobOptions = signal<JobListDto[]>([]);
  readonly employeeOptions = signal<EmployeeListDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
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
        switchMap((orgRes) => {
          const orgId = orgRes.success && orgRes.data?.id ? orgRes.data.id : undefined;
          return forkJoin({
            cycles: this.api.getCyclesPaged({ page: 1, pageSize: 500 }),
            ous: this.ouApi.getPaged({ page: 1, pageSize: 5000, organizationId: orgId, rootOnly: false, sortBy: 'type' }),
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
      next: (res) => {
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
        cycleId: this.cycleIdFilter ?? undefined,
        orgUnitId: this.orgUnitIdFilter ?? undefined,
        jobId: this.jobIdFilter ?? undefined,
        employeeId: this.employeeIdFilter ?? undefined,
        severity: this.severityFilter ?? undefined,
      })
      .subscribe({
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

  onFilterChange(): void {
    this.page.set(1);
    this.load();
  }

  clearFilters(): void {
    this.cycleIdFilter = null;
    this.orgUnitIdFilter = null;
    this.jobIdFilter = null;
    this.employeeIdFilter = null;
    this.severityFilter = null;
    this.page.set(1);
    this.load();
  }

  /** Prefer job picklist titles when API row has missing Arabic/English job title. */
  localizedJobTitle(g: CompetencyGapListDto): string {
    const j = g.jobId ? this.jobOptions().find((x) => x.id === g.jobId) : undefined;
    const ar = (j?.titleAr ?? g.jobTitleAr)?.trim() ?? '';
    const en = (j?.titleEn ?? g.jobTitleEn)?.trim() ?? '';
    const lang = (this.translate.currentLang || this.translate.getDefaultLang() || 'en').toLowerCase();
    if (lang.startsWith('ar')) return ar || en || '—';
    return en || ar || '—';
  }

}
