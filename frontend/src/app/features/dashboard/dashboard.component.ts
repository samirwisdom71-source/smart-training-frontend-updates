import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardDataService } from './services/dashboard-data.service';
import { DashboardApiService } from '../../core/api/dashboard/dashboard-api.service';
import { DashboardExecutiveComponent } from './views/dashboard-executive.component';
import { DashboardManagerComponent } from './views/dashboard-manager.component';
import { DashboardEmployeeComponent } from './views/dashboard-employee.component';
import type { DashboardRole } from './models/dashboard.models';
import type { ExecutiveDashboardData, ManagerDashboardData, EmployeeDashboardData, DashboardKpi } from './models/dashboard.models';
import type { ExecutiveDashboardDto, ManagerDashboardDto, EmployeeDashboardDto, DashboardKpiDto } from '../../core/api/dashboard/dashboard-api.models';

const ICON_KEYS = ['people', 'clipboard', 'book', 'certificate', 'check', 'clock', 'chart', 'bell'] as const;
function toDashboardKpi(k: DashboardKpiDto): DashboardKpi {
  return {
    ...k,
    trend: (k.trend as 'up' | 'down' | 'neutral') || undefined,
    icon: (ICON_KEYS.includes(k.icon as any) ? k.icon : undefined) as DashboardKpi['icon']
  };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    TranslateModule,
    PageShellComponent,
    DashboardExecutiveComponent,
    DashboardManagerComponent,
    DashboardEmployeeComponent
  ],
  template: `
    @if (loading()) {
      <app-page-shell [title]="'dashboard.title' | translate" [breadcrumbs]="[]">
        <div class="dashboard-loading">
          <div class="ds-skeleton" style="height: 120px; margin-bottom: 16px;"></div>
          <div class="ds-skeleton" style="height: 200px; margin-bottom: 16px;"></div>
          <div class="ds-skeleton" style="height: 180px;"></div>
        </div>
      </app-page-shell>
    } @else if (error()) {
      <app-page-shell [title]="'dashboard.title' | translate" [breadcrumbs]="[]">
        <div class="ds-error-state">
          <p class="ds-error-state__title">{{ error() }}</p>
          <button type="button" class="ds-btn ds-btn--secondary ds-btn--sm" (click)="load()">{{ 'empty.tryAgain' | translate }}</button>
        </div>
      </app-page-shell>
    } @else if (role() === 'executive') {
      <app-dashboard-executive
        [data]="executiveData()!"
        [trainingNeedsByDept]="trainingNeedsByDept()"
        [planStatusLabels]="planStatusLabels()"
      />
    } @else if (role() === 'manager') {
      @if (managerData(); as mgr) {
        <app-dashboard-manager [data]="mgr" />
      } @else {
        <app-page-shell [title]="'dashboard.title' | translate" [breadcrumbs]="[]">
          <div class="ds-empty"><p class="ds-empty__title">{{ 'dashboard.noManagerData' | translate }}</p></div>
        </app-page-shell>
      }
    } @else {
      @if (employeeData(); as emp) {
        <app-dashboard-employee [data]="emp" />
      } @else {
        <app-page-shell [title]="'dashboard.title' | translate" [breadcrumbs]="[]">
          <div class="ds-empty"><p class="ds-empty__title">{{ 'dashboard.noEmployeeData' | translate }}</p></div>
        </app-page-shell>
      }
    }
  `,
  styles: [`
    .dashboard-loading { padding: var(--space-lg) 0; }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly dataService = inject(DashboardDataService);
  private readonly api = inject(DashboardApiService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly role = signal<DashboardRole>('employee');
  readonly executiveData = signal<ExecutiveDashboardData | null>(null);
  readonly managerData = signal<ManagerDashboardData | null>(null);
  readonly employeeData = signal<EmployeeDashboardData | null>(null);
  readonly trainingNeedsByDept = signal<{ label: string; value: number }[]>([]);
  readonly planStatusLabels = signal<string[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const user = this.auth.user();
    const roles = user?.roles ?? [];
    const dashboardRole = this.dataService.getDashboardRole(roles);
    this.role.set(dashboardRole);

    if (dashboardRole === 'executive') {
      this.api.getExecutive().subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success && res.data) {
            this.executiveData.set(this.mapExecutive(res.data));
            this.planStatusLabels.set(res.data.planExecutionStatus.map(p => this.translate.instant(p.statusKey)));
            this.trainingNeedsByDept.set(res.data.topDepartmentsByGaps.map(x => ({ label: x.label, value: x.value })));
          } else {
            this.error.set(res.message ?? 'Failed to load dashboard');
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message ?? err.message ?? 'Failed to load dashboard');
        }
      });
    } else if (dashboardRole === 'manager') {
      this.api.getManager().subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success && res.data) {
            this.managerData.set(this.mapManager(res.data));
          } else {
            this.managerData.set(null);
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message ?? err.message ?? 'Failed to load dashboard');
        }
      });
    } else {
      this.api.getEmployee().subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success && res.data) {
            this.employeeData.set(this.mapEmployee(res.data));
          } else {
            this.employeeData.set(null);
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message ?? err.message ?? 'Failed to load dashboard');
        }
      });
    }
  }

  private mapExecutive(d: ExecutiveDashboardDto): ExecutiveDashboardData {
    return {
      kpis: d.kpis.map(toDashboardKpi),
      trendChart: d.trendChart,
      topDepartmentsByGaps: d.topDepartmentsByGaps,
      planExecutionStatus: d.planExecutionStatus,
      impactIndicators: d.impactIndicators.map(toDashboardKpi)
    };
  }

  private mapManager(d: ManagerDashboardDto): ManagerDashboardData {
    return {
      kpis: d.kpis.map(toDashboardKpi),
      teamAssessmentCompletion: {
        completed: d.teamAssessmentCompleted,
        total: d.teamAssessmentTotal,
        percentage: d.teamAssessmentPercentage
      },
      teamGaps: d.teamGaps,
      pendingReviews: d.pendingReviews,
      teamTrainingParticipation: d.teamTrainingParticipation
    };
  }

  private mapEmployee(d: EmployeeDashboardDto): EmployeeDashboardData {
    return {
      kpis: d.kpis.map(toDashboardKpi),
      myAssessments: { open: d.myAssessmentsOpen, completed: d.myAssessmentsCompleted },
      myCertificates: d.myCertificates,
      upcomingPrograms: d.upcomingPrograms.map(p => ({
        title: p.titleEn,
        date: p.startDate ? new Date(p.startDate).toISOString().slice(0, 10) : ''
      })),
      pendingTasks: d.pendingTasks
    };
  }
}
