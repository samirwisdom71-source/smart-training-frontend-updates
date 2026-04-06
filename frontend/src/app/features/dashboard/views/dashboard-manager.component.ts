import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { DashboardKpiCardComponent } from '../components/dashboard-kpi-card/dashboard-kpi-card.component';
import { DashboardBarChartComponent } from '../components/dashboard-bar-chart/dashboard-bar-chart.component';
import type { ManagerDashboardData } from '../models/dashboard.models';

@Component({
  selector: 'app-dashboard-manager',
  standalone: true,
  imports: [
    TranslateModule,
    RouterLink,
    PageShellComponent,
    DashboardKpiCardComponent,
    DashboardBarChartComponent
  ],
  template: `
    <app-page-shell [title]="'dashboard.title' | translate" [breadcrumbs]="[]" [fullWidth]="true">
      <p class="dashboard-intro">{{ 'dashboard.teamOverview' | translate }}</p>

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
        <section class="dashboard-widget dashboard-widget--completion" aria-labelledby="completion-heading">
          <h3 id="completion-heading" class="widget-title">{{ 'dashboard.teamCompletion' | translate }}</h3>
          <div class="completion-block">
            <div class="completion-bar-wrap">
              <div class="completion-bar" [style.width.%]="data().teamAssessmentCompletion.percentage"></div>
            </div>
            <p class="completion-text">
              {{ data().teamAssessmentCompletion.completed }} {{ 'dashboard.widgets.assessmentsCompleted' | translate }}
              {{ 'dashboard.widgets.ofTotal' | translate }} {{ data().teamAssessmentCompletion.total }}
            </p>
          </div>
        </section>
        <section class="dashboard-widget dashboard-widget--chart" aria-labelledby="participation-heading">
          <app-dashboard-bar-chart
            titleKey="dashboard.teamParticipation"
            headingId="participation-heading"
            [data]="data().teamTrainingParticipation"
            color="#b8860b"
            [allowedTypes]="['bar', 'line', 'radar']"
          />
        </section>
      </div>

      <section class="dashboard-widget" aria-labelledby="gaps-heading">
        <h3 id="gaps-heading" class="widget-title">{{ 'dashboard.teamGaps' | translate }}</h3>
        <ul class="top-list">
          @for (item of data().teamGaps; track item.id) {
            <li class="top-list__item">
              <span class="top-list__label">{{ item.label }}</span>
              <span class="top-list__value">{{ item.value }}</span>
            </li>
          }
        </ul>
        <a [routerLink]="['/competency']" class="widget-link">{{ 'common.viewAll' | translate }}</a>
      </section>
    </app-page-shell>
  `,
  styles: [`
    .dashboard-intro { margin: 0 0 var(--space-lg); color: var(--color-text-secondary); font-size: var(--text-body-sm); }
    .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
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
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
      align-items: start;
      gap: var(--space-md);
      margin-bottom: var(--space-lg);
    }
  `]
})
export class DashboardManagerComponent {
  data = input.required<ManagerDashboardData>();
}
