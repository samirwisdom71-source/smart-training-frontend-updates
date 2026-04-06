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
    <app-page-shell [title]="'dashboard.title' | translate" [breadcrumbs]="[]">
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
    .dashboard-intro { margin: 0 0 var(--space-xl); color: var(--color-text-secondary); font-size: var(--text-body-sm); }
    .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
    .dashboard-section { margin-bottom: var(--space-2xl); }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--space-md); }
    /* تحكم في الجريد فقط؛ الحركة تأتي من .ds-animate-fade-up العامة */
    .dashboard-charts-row {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--space-lg); margin-bottom: var(--space-xl);
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
    .widget-title { font-size: var(--text-h2); font-weight: 600; color: var(--color-text); margin: 0 0 var(--space-md); }
    .completion-block { margin-bottom: var(--space-md); }
    .completion-bar-wrap {
      height: 10px; background: var(--color-bg-subtle);
      border-radius: var(--radius-full); overflow: hidden; margin-bottom: var(--space-sm);
    }
    .completion-bar {
      height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
      border-radius: var(--radius-full); transition: width 0.4s ease;
    }
    .completion-text { font-size: var(--text-body-sm); color: var(--color-text-secondary); margin: 0; }
    .top-list { list-style: none; margin: 0; padding: 0; }
    .top-list__item {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-sm) 0; border-block-end: 1px solid var(--color-border-light);
      font-size: var(--text-body-sm);
    }
    .top-list__item:last-child { border-block-end: none; }
    .top-list__label { color: var(--color-text); }
    .top-list__value {
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      padding: 0.2rem 0.65rem;
      border-radius: 999px;
      font-size: var(--text-body-sm);
      background: color-mix(in srgb, var(--color-primary) 14%, var(--color-bg-subtle));
      color: var(--color-primary);
      border: 1px solid color-mix(in srgb, var(--color-primary) 28%, transparent);
    }
    .widget-link { display: inline-block; margin-top: var(--space-sm); font-size: var(--text-body-sm); color: var(--color-primary); text-decoration: none; }
    .widget-link:hover { text-decoration: underline; }
    @media (prefers-reduced-motion: reduce) {
      .dashboard-widget { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
      .dashboard-widget:hover { transform: none; }
    }
  `]
})
export class DashboardManagerComponent {
  data = input.required<ManagerDashboardData>();
}
