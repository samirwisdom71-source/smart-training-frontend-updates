import {
  Component,
  input,
  signal,
  computed,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  OnInit,
  effect
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

export type DashboardChartType = 'bar' | 'line' | 'doughnut' | 'pie' | 'radar' | 'polarArea';

const CHART_COLORS = {
  primary: '#0a4d52',
  accent: '#b8860b',
  success: '#047857',
  info: '#0369a1',
  coral: '#c2410c',
  muted: 'rgba(148, 163, 184, 0.6)',
  grid: 'rgba(226, 232, 240, 0.8)'
};

const PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.accent,
  CHART_COLORS.success,
  CHART_COLORS.info,
  CHART_COLORS.coral,
  '#5b21b6',
  '#64748b'
];

@Component({
  selector: 'app-dashboard-doughnut-chart',
  standalone: true,
  imports: [TranslateModule],
  template: `
    @if (titleKey() || allowedTypes().length > 1) {
      <div class="chart-widget-header">
        @if (titleKey()) {
          <h3
            class="chart-header__title"
            [attr.id]="headingId() || null"
          >{{ titleKey() | translate }}</h3>
        } @else {
          <div class="chart-header__spacer"></div>
        }
        @if (allowedTypes().length > 1) {
          <button
            type="button"
            class="chart-type-toggle chart-type-toggle--icon"
            (click)="toggleType()"
            [attr.aria-label]="'dashboard.toggleChartType' | translate"
            [title]="'dashboard.toggleChartType' | translate"
          >
            <svg class="toggle-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M21 12a9 9 0 0 1-9 9"/>
              <path d="M3 12a9 9 0 0 1 9-9"/>
              <path d="M16 7h5V2"/>
              <path d="M8 17H3v5"/>
            </svg>
          </button>
        }
      </div>
    }
    <div class="chart-wrap" [class.chart-wrap--cartesian]="chartType() === 'bar' || chartType() === 'line' || chartType() === 'radar'">
      <canvas #canvas></canvas>
    </div>
  `,
  styles: [`
    .chart-widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-md);
      margin-bottom: var(--space-md);
      flex-wrap: wrap;
    }
    .chart-header__title {
      font-size: var(--text-h2);
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
      flex: 1;
      min-width: 0;
    }
    .chart-header__spacer { flex: 1; }
    .chart-type-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      height: 36px;
      width: 36px;
      padding: 0;
      border: 1px solid var(--color-border);
      background: var(--color-bg-elevated);
      color: var(--color-text);
      border-radius: var(--radius-sm);
      cursor: pointer;
      box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
      transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;
    }
    .chart-type-toggle:hover { background: var(--color-bg-hover); border-color: var(--color-border-strong, var(--color-border)); }
    .chart-type-toggle:active { transform: translateY(1px); }
    .toggle-icon { opacity: 0.85; }
    .chart-wrap { position: relative; height: 220px; width: 100%; max-width: 280px; margin: 0 auto; }
    .chart-wrap canvas { max-height: 220px; }
    .chart-wrap--cartesian { height: 260px; max-width: none; }
    .chart-wrap--cartesian canvas { max-height: 260px; }
  `]
})
export class DashboardDoughnutChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;
  readonly chartType = signal<DashboardChartType>('doughnut');

  allowedTypes = input<readonly DashboardChartType[]>(['doughnut', 'pie', 'polarArea']);
  headingId = input<string | null>(null);
  titleKey = input<string>('');
  /** [{ statusKey, count }] */
  data = input.required<{ statusKey: string; count: number }[]>();
  /** Translated labels in same order as data */
  labels = input.required<string[]>();

  /** Normalized to { label, value }[] for bar/line/doughnut/pie */
  private normalizedData = computed(() => {
    const d = this.data();
    const lbls = this.labels();
    if (!d?.length || lbls.length !== d.length) return [];
    return d.map((item, i) => ({ label: lbls[i], value: item.count }));
  });

  constructor() {
    effect(() => {
      const types = this.allowedTypes();
      if (types.length > 0 && !types.includes(this.chartType())) {
        this.chartType.set(types[0]!);
      }
    });
    effect(() => {
      this.chartType();
      const norm = this.normalizedData();
      if (this.canvasRef?.nativeElement && norm.length) {
        this.buildChart();
      }
    });
  }

  ngOnInit(): void {
    const types = this.allowedTypes();
    if (types.length) {
      this.chartType.set(types[0]!);
    }
  }

  nextType(): DashboardChartType {
    const types = this.allowedTypes();
    if (types.length < 2) {
      return types[0] ?? 'doughnut';
    }
    const i = types.indexOf(this.chartType());
    const idx = i < 0 ? 0 : i;
    return types[(idx + 1) % types.length]!;
  }

  toggleType(): void {
    this.chartType.set(this.nextType());
  }

  ngAfterViewInit(): void {
    this.buildChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private buildChart(): void {
    const norm = this.normalizedData();
    const type = this.chartType();
    const types = this.allowedTypes();
    if (!this.canvasRef?.nativeElement || !norm.length || !types.includes(type)) return;

    this.chart?.destroy();
    this.chart = null;

    const labels = norm.map(d => d.label);
    const values = norm.map(d => d.value);
    const color = CHART_COLORS.primary;
    const palette = PALETTE.slice(0, Math.max(values.length, 1));

    if (type === 'bar') {
      const config: ChartConfiguration<'bar'> = {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: '',
            data: values,
            backgroundColor: color + '40',
            borderColor: color,
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(30, 41, 59, 0.95)', padding: 12 } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 12 }, color: CHART_COLORS.muted, maxRotation: 45 } },
            y: { beginAtZero: true, grid: { color: CHART_COLORS.grid }, ticks: { font: { size: 11 }, color: CHART_COLORS.muted } }
          }
        }
      };
      this.chart = new Chart(this.canvasRef.nativeElement, config);
      return;
    }

    if (type === 'line') {
      const config: ChartConfiguration<'line'> = {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: '',
            data: values,
            borderColor: color,
            backgroundColor: color + '18',
            fill: true,
            tension: 0.45,
            cubicInterpolationMode: 'monotone',
            pointRadius: 4,
            pointBackgroundColor: color,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(30, 41, 59, 0.95)', padding: 12 } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 12 }, color: CHART_COLORS.muted } },
            y: { beginAtZero: true, grid: { color: CHART_COLORS.grid }, ticks: { font: { size: 11 }, color: CHART_COLORS.muted } }
          }
        }
      };
      this.chart = new Chart(this.canvasRef.nativeElement, config);
      return;
    }

    if (type === 'radar') {
      const config: ChartConfiguration<'radar'> = {
        type: 'radar',
        data: {
          labels,
          datasets: [{
            label: '',
            data: values,
            borderColor: CHART_COLORS.primary,
            backgroundColor: CHART_COLORS.primary + '2e',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: CHART_COLORS.primary,
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: CHART_COLORS.primary
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              grid: { color: CHART_COLORS.grid },
              angleLines: { color: CHART_COLORS.grid },
              pointLabels: { font: { size: 11 }, color: CHART_COLORS.muted },
              ticks: {
                backdropColor: 'transparent',
                color: CHART_COLORS.muted,
                font: { size: 10 }
              }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: 'rgba(30, 41, 59, 0.95)', padding: 12 }
          }
        }
      };
      this.chart = new Chart(this.canvasRef.nativeElement, config);
      return;
    }

    if (type === 'doughnut') {
      const config: ChartConfiguration<'doughnut'> = {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: palette,
            borderColor: '#fff',
            borderWidth: 2,
            hoverOffset: 6,
            borderRadius: 6,
            spacing: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 12 }, color: CHART_COLORS.muted, padding: 16 } },
            tooltip: { backgroundColor: 'rgba(30, 41, 59, 0.95)', padding: 12 }
          }
        }
      };
      this.chart = new Chart(this.canvasRef.nativeElement, config);
      return;
    }

    if (type === 'polarArea') {
      const config: ChartConfiguration<'polarArea'> = {
        type: 'polarArea',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: palette.map(c => (c.length === 7 ? `${c}c4` : c)),
            borderColor: 'rgba(255, 255, 255, 0.94)',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              grid: { color: CHART_COLORS.grid },
              ticks: { backdropColor: 'transparent', color: CHART_COLORS.muted }
            }
          },
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 12 }, color: CHART_COLORS.muted, padding: 16 } },
            tooltip: { backgroundColor: 'rgba(30, 41, 59, 0.95)', padding: 12 }
          }
        }
      };
      this.chart = new Chart(this.canvasRef.nativeElement, config);
      return;
    }

    if (type === 'pie') {
      const config: ChartConfiguration<'pie'> = {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: palette,
            borderColor: '#fff',
            borderWidth: 2,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 12 }, color: CHART_COLORS.muted, padding: 16 } },
            tooltip: { backgroundColor: 'rgba(30, 41, 59, 0.95)', padding: 12 }
          }
        }
      };
      this.chart = new Chart(this.canvasRef.nativeElement, config);
    }
  }
}
