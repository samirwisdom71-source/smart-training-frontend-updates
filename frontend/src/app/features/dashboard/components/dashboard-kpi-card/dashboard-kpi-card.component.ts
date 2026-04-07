import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import type { DashboardKpi } from '../../models/dashboard.models';

@Component({
  selector: 'app-dashboard-kpi-card',
  standalone: true,
  imports: [NgTemplateOutlet, TranslateModule, RouterLink],
  template: `
    @if (kpi().link) {
      <a
        [routerLink]="kpi().link"
        class="kpi-card kpi-card--link"
        [attr.data-tone]="tone() % 8"
      >
        <ng-container *ngTemplateOutlet="kpiInner" />
      </a>
    } @else {
      <div class="kpi-card" [attr.data-tone]="tone() % 8">
        <ng-container *ngTemplateOutlet="kpiInner" />
      </div>
    }

    <ng-template #kpiInner>
      <div class="kpi-card__glow" aria-hidden="true"></div>
      <div class="kpi-card__overlay" aria-hidden="true"></div>
      <div class="kpi-card__accent" aria-hidden="true"></div>
      <div class="kpi-card__body">
        <div class="kpi-card__top">
          <span class="kpi-card__icon" aria-hidden="true">
            @switch (kpi().icon) {
              @case ('people') {
                <svg xmlns="http://www.w3.org/2000/svg"  class="icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <g clip-path="url(#clip0_3111_32702)">
                <path d="M9.15957 11.62C9.12957 11.62 9.10957 11.62 9.07957 11.62C9.02957 11.61 8.95957 11.61 8.89957 11.62C5.99957 11.53 3.80957 9.25 3.80957 6.44C3.80957 3.58 6.13957 1.25 8.99957 1.25C11.8596 1.25 14.1896 3.58 14.1896 6.44C14.1796 9.25 11.9796 11.53 9.18957 11.62C9.17957 11.62 9.16957 11.62 9.15957 11.62ZM8.99957 2.75C6.96957 2.75 5.30957 4.41 5.30957 6.44C5.30957 8.44 6.86957 10.05 8.85957 10.12C8.91957 10.11 9.04957 10.11 9.17957 10.12C11.1396 10.03 12.6796 8.42 12.6896 6.44C12.6896 4.41 11.0296 2.75 8.99957 2.75Z" fill="white" style="fill: var(--fillg);"/>
                <path d="M16.5396 11.75C16.5096 11.75 16.4796 11.75 16.4496 11.74C16.0396 11.78 15.6196 11.49 15.5796 11.08C15.5396 10.67 15.7896 10.3 16.1996 10.25C16.3196 10.24 16.4496 10.24 16.5596 10.24C18.0196 10.16 19.1596 8.96 19.1596 7.49C19.1596 5.97 17.9296 4.74 16.4096 4.74C15.9996 4.75 15.6596 4.41 15.6596 4C15.6596 3.59 15.9996 3.25 16.4096 3.25C18.7496 3.25 20.6596 5.16 20.6596 7.5C20.6596 9.8 18.8596 11.66 16.5696 11.75C16.5596 11.75 16.5496 11.75 16.5396 11.75Z" fill="white" style="fill: var(--fillg);"/>
                <path d="M9.16961 22.55C7.20961 22.55 5.23961 22.05 3.74961 21.05C2.35961 20.13 1.59961 18.87 1.59961 17.5C1.59961 16.13 2.35961 14.86 3.74961 13.93C6.74961 11.94 11.6096 11.94 14.5896 13.93C15.9696 14.85 16.7396 16.11 16.7396 17.48C16.7396 18.85 15.9796 20.12 14.5896 21.05C13.0896 22.05 11.1296 22.55 9.16961 22.55ZM4.57961 15.19C3.61961 15.83 3.09961 16.65 3.09961 17.51C3.09961 18.36 3.62961 19.18 4.57961 19.81C7.06961 21.48 11.2696 21.48 13.7596 19.81C14.7196 19.17 15.2396 18.35 15.2396 17.49C15.2396 16.64 14.7096 15.82 13.7596 15.19C11.2696 13.53 7.06961 13.53 4.57961 15.19Z" fill="white" style="fill: var(--fillg);"/>
                <path d="M18.3397 20.75C17.9897 20.75 17.6797 20.51 17.6097 20.15C17.5297 19.74 17.7897 19.35 18.1897 19.26C18.8197 19.13 19.3997 18.88 19.8497 18.53C20.4197 18.1 20.7297 17.56 20.7297 16.99C20.7297 16.42 20.4197 15.88 19.8597 15.46C19.4197 15.12 18.8697 14.88 18.2197 14.73C17.8197 14.64 17.5597 14.24 17.6497 13.83C17.7397 13.43 18.1397 13.17 18.5497 13.26C19.4097 13.45 20.1597 13.79 20.7697 14.26C21.6997 14.96 22.2297 15.95 22.2297 16.99C22.2297 18.03 21.6897 19.02 20.7597 19.73C20.1397 20.21 19.3597 20.56 18.4997 20.73C18.4397 20.75 18.3897 20.75 18.3397 20.75Z" fill="white" style="fill: var(--fillg);"/>
                </g>
                <defs>
                <clipPath id="clip0_3111_32702">
                <rect width="24" height="24" fill="white"/>
                </clipPath>
                </defs>
                </svg>
              }
              @case ('clipboard') {
                <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path d="M9 4h6l1 2h3v14H5V6h3l1-2Z" stroke-linejoin="round" />
                  <path d="M9 12h6M9 16h4" stroke-linecap="round" />
                </svg>
              }
              @case ('book') {
                <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path d="M5 4h8a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" stroke-linejoin="round" />
                  <path d="M13 4h6v13h-6" stroke-linejoin="round" />
                </svg>
              }
              @case ('certificate') {
                <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                  <circle cx="12" cy="9" r="4" />
                  <path d="M9 13.5 7 21l5-2 5 2-2-7.5" stroke-linejoin="round" />
                </svg>
              }
              @case ('check') {
                <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              }
              @case ('clock') {
                <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 8v5l3 2" stroke-linecap="round" />
                </svg>
              }
              @case ('bell') {
                <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path d="M5 17h14l-2-3v-4a5 5 0 0 0-10 0v4l-2 3Z" stroke-linejoin="round" />
                  <path d="M10 19a2 2 0 0 0 4 0" stroke-linecap="round" />
                </svg>
              }
              @case ('chart') {
                <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path d="M4 19V5M4 19h16" stroke-linecap="round" />
                  <path d="M8 16v-5M12 16V8M16 16v-3" stroke-linecap="round" />
                </svg>
              }
              @default {
                <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path d="M4 19V5M4 19h16" stroke-linecap="round" />
                  <path d="M8 16v-5M12 16V8M16 16v-3" stroke-linecap="round" />
                </svg>
              }
            }
          </span>
          <span class="kpi-card__label">{{ kpi().labelKey | translate }}</span>
        </div>
        <span class="kpi-card__value">{{ kpi().value }}{{ kpi().subValue ?? '' }}</span>
        @if (showTrendBadge()) {
          <span
            class="kpi-card__badge"
            [class.kpi-card__badge--up]="kpi().trend === 'up'"
            [class.kpi-card__badge--down]="kpi().trend === 'down'"
            [class.kpi-card__badge--neutral]="kpi().trend === 'neutral'"
          >
            {{ trendText() }}
          </span>
        }
      </div>
    </ng-template>
  `,
  styleUrl: './dashboard-kpi-card.component.scss',
})
export class DashboardKpiCardComponent {
  kpi = input.required<DashboardKpi>();
  /** Cycle through accent palette by card index. */
  tone = input(0);

  /** Avoid empty pills when API sends trend without label text. */
  readonly trendText = computed(() => (this.kpi().trendValue ?? '').trim());

  readonly showTrendBadge = computed(() => {
    const k = this.kpi();
    if (!k.trend) return false;
    return this.trendText().length > 0;
  });
}
