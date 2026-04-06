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
    <app-page-shell [title]="'dashboard.title' | translate" [breadcrumbs]="[]">
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
      margin: 0 0 var(--space-xl);
      color: var(--color-text-secondary);
      font-size: var(--text-body-sm);
    }
    .visually-hidden {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0,0,0,0); border: 0;
    }
    .dashboard-section { margin-bottom: var(--space-2xl); }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      grid-auto-rows: 1fr; /* يخلي كل الأعمدة في الصف الواحد نفس الارتفاع */
      gap: var(--space-md);
    }
    .kpi-grid--small {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    }
    .dashboard-charts-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: var(--space-lg);
      margin-bottom: var(--space-xl);
    }
    .dashboard-widget {
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-md);
      padding: var(--space-lg);
      box-shadow: var(--shadow-sm);
      transition:
        transform 0.28s cubic-bezier(0.34, 1.15, 0.64, 1),
        box-shadow 0.28s ease,
        border-color 0.22s ease;
    }
    .dashboard-widget:hover {
      transform: translateY(-3px);
      border-color: color-mix(in srgb, var(--color-primary) 28%, var(--color-border-light));
      box-shadow:
        0 4px 0 color-mix(in srgb, var(--color-primary) 10%, transparent),
        var(--shadow-md);
    }
    .widget-title {
      font-size: var(--text-h2);
      font-weight: 600;
      color: var(--color-text);
      margin: 0 0 var(--space-md);
    }
    .top-list { list-style: none; margin: 0; padding: 0; }
    .top-list__item {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-sm) 0;
      border-block-end: 1px solid var(--color-border-light);
      font-size: var(--text-body-sm);
    }
    .top-list__item:last-child { border-block-end: none; }
    .top-list__label { color: var(--color-text); }
    .top-list__value { font-weight: 600; color: var(--color-primary); }
    .widget-link {
      display: inline-block; margin-top: var(--space-sm);
      font-size: var(--text-body-sm); color: var(--color-primary);
      text-decoration: none;
    }
    .widget-link:hover { text-decoration: underline; }
    @media (prefers-reduced-motion: reduce) {
      .dashboard-widget { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
      .dashboard-widget:hover { transform: none; }
    }
  `]
})
export class DashboardExecutiveComponent {
  data = input.required<ExecutiveDashboardData>();
  trainingNeedsByDept = input.required<{ label: string; value: number }[]>();

  planStatusLabels = input.required<string[]>();
}
