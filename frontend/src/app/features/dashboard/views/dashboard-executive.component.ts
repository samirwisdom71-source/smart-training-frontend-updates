import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { DashboardKpiCardComponent } from '../components/dashboard-kpi-card/dashboard-kpi-card.component';
import { DashboardBarChartComponent } from '../components/dashboard-bar-chart/dashboard-bar-chart.component';
import { DashboardLineChartComponent } from '../components/dashboard-line-chart/dashboard-line-chart.component';
import { DashboardDoughnutChartComponent } from '../components/dashboard-doughnut-chart/dashboard-doughnut-chart.component';
import type { ExecutiveDashboardData } from '../models/dashboard.models';

@Component({
  selector: 'app-dashboard-executive',
  standalone: true,
  imports: [
    TranslateModule,
    RouterLink,
    PageShellComponent,
    DashboardKpiCardComponent,
    DashboardBarChartComponent,
    DashboardLineChartComponent,
    DashboardDoughnutChartComponent
  ],
  template: `
    <app-page-shell [title]="'dashboard.title' | translate" [breadcrumbs]="[]" [fullWidth]="true">
      <p class="dashboard-intro">{{ 'dashboard.executiveOverview' | translate }}</p>

      <section class="dashboard-section dashboard-kpis" aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" class="visually-hidden">{{ 'dashboard.quickStats' | translate }}</h2>
        <div class="kpi-grid">
          @for (kpi of data().kpis; track kpi.id; let i = $index) {
            <div class="ds-animate-fade-up" [attr.data-delay]="i">
              <app-dashboard-kpi-card [kpi]="kpi" [tone]="i" />
            </div>
          }
        </div>
      </section>

      <div class="dashboard-charts-row">
        <section class="dashboard-widget dashboard-widget--chart ds-animate-fade-up" aria-labelledby="trend-heading" data-delay="0">
          <app-dashboard-line-chart
            titleKey="dashboard.orgTrends"
            headingId="trend-heading"
            [data]="data().trendChart"
            [allowedTypes]="['line', 'bar', 'radar']"
          />
        </section>
        <section class="dashboard-widget dashboard-widget--chart ds-animate-fade-up" aria-labelledby="gaps-heading" data-delay="1">
          <app-dashboard-bar-chart
            titleKey="dashboard.trainingNeedsByDept"
            headingId="gaps-heading"
            [data]="trainingNeedsByDept()"
            color="#0a4d52"
            [allowedTypes]="['bar', 'line', 'radar']"
          />
        </section>
      </div>

      <div class="dashboard-charts-row">
        <section class="dashboard-widget dashboard-widget--list ds-animate-fade-up" aria-labelledby="top-gaps-heading" data-delay="0">
          <h3 id="top-gaps-heading" class="widget-title">{{ 'dashboard.topGapsByDepartment' | translate }}</h3>
          <app-dashboard-bar-chart
            [data]="data().topDepartmentsByGaps"
            color="#b8860b"
            [indexAxis]="'y'"
            [showToolbar]="false"
            [allowedTypes]="['bar']"
          />
          <a [routerLink]="['/assessments/gaps']" class="widget-link">{{ 'common.viewAll' | translate }}</a>
        </section>
        <section class="dashboard-widget dashboard-widget--doughnut ds-animate-fade-up" aria-labelledby="plan-heading" data-delay="1">
          <app-dashboard-doughnut-chart
            titleKey="dashboard.planExecution"
            headingId="plan-heading"
            [data]="data().planExecutionStatus"
            [labels]="planStatusLabels()"
            [allowedTypes]="['doughnut', 'pie', 'polarArea']"
          />
        </section>
      </div>

    </app-page-shell>
  `,
  styles: [`
    .dashboard-intro {
      margin: 0 0 var(--space-lg);
      color: var(--color-text-secondary);
      font-size: var(--text-body-sm);
    }
    .visually-hidden {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0,0,0,0); border: 0;
    }
    .dashboard-section { margin-bottom: var(--space-xl); }
    .kpi-grid {
      display: grid;
      grid-template-columns: 1fr;
      grid-auto-rows: 1fr;
      gap: var(--space-md);
    }
    @media (min-width: 600px) {
      .kpi-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (min-width: 1024px) {
      .kpi-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    }
    .dashboard-charts-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
      align-items: start;
      gap: var(--space-md);
      margin-bottom: var(--space-lg);
    }
  `]
})
export class DashboardExecutiveComponent {
  data = input.required<ExecutiveDashboardData>();
  trainingNeedsByDept = input.required<{ label: string; value: number }[]>();

  planStatusLabels = input.required<string[]>();
}
