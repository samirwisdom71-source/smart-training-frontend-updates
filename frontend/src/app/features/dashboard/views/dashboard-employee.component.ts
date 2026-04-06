import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { DashboardKpiCardComponent } from '../components/dashboard-kpi-card/dashboard-kpi-card.component';
import type { EmployeeDashboardData } from '../models/dashboard.models';

@Component({
  selector: 'app-dashboard-employee',
  standalone: true,
  imports: [TranslateModule, RouterLink, PageShellComponent, DashboardKpiCardComponent],
  template: `
    <app-page-shell [title]="'dashboard.title' | translate" [breadcrumbs]="[]">
      <p class="dashboard-intro">{{ 'dashboard.myOverview' | translate }}</p>

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

      <div class="dashboard-two-col">
        <section class="dashboard-widget" aria-labelledby="assessments-heading">
          <h3 id="assessments-heading" class="widget-title">{{ 'dashboard.myAssessmentsSection' | translate }}</h3>
          <p class="widget-summary">
            {{ data().myAssessments.open }} {{ 'dashboard.widgets.open' | translate }} ·
            {{ data().myAssessments.completed }} {{ 'dashboard.widgets.assessmentsCompleted' | translate }}
          </p>
        </section>
        <section class="dashboard-widget" aria-labelledby="programs-heading">
          <h3 id="programs-heading" class="widget-title">{{ 'dashboard.upcomingPrograms' | translate }}</h3>
          @if (data().upcomingPrograms.length) {
            <ul class="program-list">
              @for (p of data().upcomingPrograms; track p.title) {
                <li class="program-list__item">
                  <span class="program-list__title">{{ p.title }}</span>
                  <span class="program-list__date">{{ p.date }}</span>
                </li>
              }
            </ul>
          } @else {
            <p class="widget-empty">{{ 'profile.noCertificates' | translate }}</p>
          }
        </section>
      </div>

      <section class="dashboard-widget" aria-labelledby="tasks-heading">
        <h3 id="tasks-heading" class="widget-title">{{ 'dashboard.pendingTasks' | translate }}</h3>
        @if (data().pendingTasks.length) {
          <ul class="task-list">
            @for (t of data().pendingTasks; track t.title) {
              <li class="task-list__item">
                @if (t.link) {
                  <a [routerLink]="[t.link]" class="task-list__link">{{ t.title }}</a>
                } @else {
                  <span>{{ t.title }}</span>
                }
              </li>
            }
          </ul>
        } @else {
          <p class="widget-empty">{{ 'profile.noRecentActivity' | translate }}</p>
        }
      </section>
    </app-page-shell>
  `,
  styles: [`
    .dashboard-intro { margin: 0 0 var(--space-xl); color: var(--color-text-secondary); font-size: var(--text-body-sm); }
    .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
    .dashboard-section { margin-bottom: var(--space-2xl); }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--space-md); }
    /* تحكم في الجريد فقط؛ الحركة تأتي من .ds-animate-fade-up العامة */
    .dashboard-two-col {
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
    .widget-summary { font-size: var(--text-body-sm); color: var(--color-text-secondary); margin: 0 0 var(--space-md); }
    .widget-empty { font-size: var(--text-body-sm); color: var(--color-text-muted); margin: 0; }
    .program-list, .task-list { list-style: none; margin: 0; padding: 0; }
    .program-list__item, .task-list__item {
      padding: var(--space-sm) 0;
      border-block-end: 1px solid var(--color-border-light);
      font-size: var(--text-body-sm);
    }
    .program-list__item:last-child, .task-list__item:last-child { border-block-end: none; }
    .program-list__title, .task-list__link { color: var(--color-text); }
    .program-list__date {
      display: inline-block;
      margin-inline-start: var(--space-sm);
      padding: 0.18rem 0.55rem;
      border-radius: 999px;
      font-size: var(--text-caption, 0.75rem);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: color-mix(in srgb, var(--color-text) 65%, #6366f1 35%);
      background: color-mix(in srgb, #6366f1 12%, var(--color-bg-subtle));
      border: 1px solid color-mix(in srgb, #6366f1 22%, transparent);
    }
    .task-list__link { text-decoration: none; color: var(--color-primary); }
    .task-list__link:hover { text-decoration: underline; }
    @media (prefers-reduced-motion: reduce) {
      .dashboard-widget { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
      .dashboard-widget:hover { transform: none; }
    }
  `]
})
export class DashboardEmployeeComponent {
  data = input.required<EmployeeDashboardData>();
}
