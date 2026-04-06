import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import type { DashboardKpi } from '../../models/dashboard.models';

@Component({
  selector: 'app-dashboard-kpi-card',
  standalone: true,
  imports: [TranslateModule, RouterLink],
  template: `
    @if (kpi().link) {
      <a
        [routerLink]="kpi().link"
        class="kpi-card kpi-card--link"
        [attr.data-tone]="tone() % 8"
      >
        <div class="kpi-card__glow" aria-hidden="true"></div>
        <div class="kpi-card__accent" aria-hidden="true"></div>
        <div class="kpi-card__body">
          <span class="kpi-card__label">{{ kpi().labelKey | translate }}</span>
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
      </a>
    } @else {
      <div class="kpi-card" [attr.data-tone]="tone() % 8">
        <div class="kpi-card__glow" aria-hidden="true"></div>
        <div class="kpi-card__accent" aria-hidden="true"></div>
        <div class="kpi-card__body">
          <span class="kpi-card__label">{{ kpi().labelKey | translate }}</span>
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
      </div>
    }
  `,
  styles: [`
    .kpi-card,
    .kpi-card--link {
      --kpi-accent: #4f46e5;
      --kpi-glow: color-mix(in srgb, var(--kpi-accent) 38%, transparent);

      position: relative;
      padding: var(--space-lg);
      border-radius: var(--radius-md, 12px);
      background: linear-gradient(
        152deg,
        color-mix(in srgb, var(--color-bg-elevated) 88%, var(--kpi-accent) 12%) 0%,
        var(--color-bg-elevated) 52%
      );
      border: 1px solid color-mix(in srgb, var(--kpi-accent) 22%, var(--color-border-light));
      box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.06) inset,
        var(--shadow-sm);
      overflow: hidden;
      display: block;
      text-decoration: none;
      color: inherit;
      height: 100%;
      transition:
        transform 0.32s cubic-bezier(0.34, 1.2, 0.64, 1),
        box-shadow 0.3s ease,
        border-color 0.25s ease;
    }

    .kpi-card[data-tone='0'],
    .kpi-card--link[data-tone='0'] {
      --kpi-accent: #4f46e5;
    }
    .kpi-card[data-tone='1'],
    .kpi-card--link[data-tone='1'] {
      --kpi-accent: #0d9488;
    }
    .kpi-card[data-tone='2'],
    .kpi-card--link[data-tone='2'] {
      --kpi-accent: #d97706;
    }
    .kpi-card[data-tone='3'],
    .kpi-card--link[data-tone='3'] {
      --kpi-accent: #7c3aed;
    }
    .kpi-card[data-tone='4'],
    .kpi-card--link[data-tone='4'] {
      --kpi-accent: #e11d48;
    }
    .kpi-card[data-tone='5'],
    .kpi-card--link[data-tone='5'] {
      --kpi-accent: #0284c7;
    }
    .kpi-card[data-tone='6'],
    .kpi-card--link[data-tone='6'] {
      --kpi-accent: #059669;
    }
    .kpi-card[data-tone='7'],
    .kpi-card--link[data-tone='7'] {
      --kpi-accent: #c026d3;
    }

    .kpi-card__glow {
      position: absolute;
      inset: -35% -25% auto;
      height: 65%;
      background: radial-gradient(
        ellipse 70% 65% at 30% 110%,
        color-mix(in srgb, var(--kpi-accent) 32%, transparent),
        transparent 68%
      );
      pointer-events: none;
      opacity: 0.55;
      transition: opacity 0.3s ease;
    }

    .kpi-card__accent {
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      width: 4px;
      background: linear-gradient(
        180deg,
        var(--kpi-accent),
        color-mix(in srgb, var(--kpi-accent) 45%, var(--color-bg-elevated))
      );
      border-start-start-radius: var(--radius-md, 12px);
      border-end-start-radius: var(--radius-md, 12px);
      transition: width 0.28s ease, filter 0.28s ease;
    }

    .kpi-card:hover,
    .kpi-card--link:hover {
      transform: translateY(-6px);
      border-color: color-mix(in srgb, var(--kpi-accent) 48%, var(--color-border-light));
      box-shadow:
        0 3px 0 color-mix(in srgb, var(--kpi-accent) 14%, transparent),
        0 20px 36px rgba(0, 0, 0, 0.1),
        0 0 32px var(--kpi-glow);
    }

    .kpi-card:hover .kpi-card__glow,
    .kpi-card--link:hover .kpi-card__glow {
      opacity: 0.85;
    }

    .kpi-card:hover .kpi-card__accent,
    .kpi-card--link:hover .kpi-card__accent {
      width: 6px;
      filter: brightness(1.05);
    }

    .kpi-card:not(.kpi-card--link):hover {
      cursor: default;
    }

    .kpi-card__body {
      position: relative;
      padding-inline-start: var(--space-sm);
      z-index: 1;
    }

    .kpi-card__label {
      display: block;
      font-size: var(--text-body-sm);
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: color-mix(in srgb, var(--color-text-secondary) 82%, var(--kpi-accent) 18%);
      margin-bottom: var(--space-2xs);
      line-height: 1.3;
      transition: color 0.22s ease;
    }

    .kpi-card:hover .kpi-card__label,
    .kpi-card--link:hover .kpi-card__label {
      color: color-mix(in srgb, var(--color-text-secondary) 65%, var(--kpi-accent) 35%);
    }

    .kpi-card__value {
      font-size: 1.75rem;
      font-weight: 700;
      color: color-mix(in srgb, var(--color-text) 58%, var(--kpi-accent) 42%);
      letter-spacing: -0.02em;
      line-height: 1.15;
      font-variant-numeric: tabular-nums;
      transition: color 0.22s ease;
    }

    .kpi-card:hover .kpi-card__value,
    .kpi-card--link:hover .kpi-card__value {
      color: color-mix(in srgb, var(--color-text) 38%, var(--kpi-accent) 62%);
    }

    .kpi-card__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 0.45rem;
      max-width: 100%;
      padding: 0.2rem 0.5rem;
      border-radius: 8px;
      font-size: 0.72rem;
      font-weight: 700;
      line-height: 1.3;
      letter-spacing: 0.01em;
      font-variant-numeric: tabular-nums;
      border: 1px solid;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .kpi-card__badge--up {
      color: #0d4f3c;
      background: rgba(16, 185, 129, 0.16);
      border-color: rgba(5, 150, 105, 0.38);
    }

    .kpi-card__badge--down {
      color: #7f1d1d;
      background: rgba(248, 113, 113, 0.16);
      border-color: rgba(220, 38, 38, 0.35);
    }

    .kpi-card__badge--neutral {
      color: var(--color-text-secondary, #4b5563);
      background: rgba(100, 116, 139, 0.12);
      border-color: rgba(100, 116, 139, 0.28);
    }

    @media (prefers-reduced-motion: reduce) {
      .kpi-card,
      .kpi-card--link {
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      .kpi-card:hover,
      .kpi-card--link:hover {
        transform: none;
      }
    }
  `],
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
