import {
  Component,
  input,
  signal,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  OnInit,
  effect
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import * as echarts from 'echarts';
import type { ECharts, EChartsOption } from 'echarts';
import {
  CHART_COLORS,
  PALETTE,
  buildBarVerticalOption,
  buildBarHorizontalOption,
  buildLineSimpleOption,
  buildRadarOption,
  buildPolarAreaRoseOption,
  buildDoughnutOption,
  buildPieOption
} from '../../utils/dashboard-echarts.options';
import { getChartHostPixelSize, scheduleEChartsResize } from '../../utils/dashboard-echarts-host';

export type DashboardChartType = 'bar' | 'line' | 'doughnut' | 'pie' | 'radar' | 'polarArea';

@Component({
  selector: 'app-dashboard-bar-chart',
  standalone: true,
  imports: [TranslateModule],
  template: `
    @if (showToolbar() && (titleKey() || allowedTypes().length > 1)) {
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
    <div class="chart-wrap" dir="ltr">
      <div class="echarts-host" #chartHost></div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    .chart-widget-header { flex-shrink: 0; }
    .chart-header__spacer { flex: 1; }
    .toggle-icon { opacity: 0.92; }
    .chart-wrap {
      position: relative;
      flex: 0 0 auto;
      width: 100%;
      height: 240px;
      min-height: 240px;
      overflow: hidden;
    }
    .echarts-host {
      position: absolute;
      inset: 0;
      width: auto;
      height: auto;
    }
  `]
})
export class DashboardBarChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartHost') chartHostRef!: ElementRef<HTMLDivElement>;
  private chart: ECharts | null = null;
  private resizeObserver: ResizeObserver | null = null;

  readonly chartType = signal<DashboardChartType>('bar');

  allowedTypes = input<readonly DashboardChartType[]>(['bar', 'line', 'radar']);
  showToolbar = input<boolean>(true);
  indexAxis = input<'x' | 'y'>('x');
  headingId = input<string | null>(null);
  titleKey = input<string>('');
  data = input.required<{ label: string; value: number }[]>();
  color = input<string>(CHART_COLORS.primary);

  constructor() {
    effect(() => {
      const types = this.allowedTypes();
      if (types.length > 0 && !types.includes(this.chartType())) {
        this.chartType.set(types[0]!);
      }
    });
    effect(() => {
      this.chartType();
      this.indexAxis();
      this.data();
      if (this.chartHostRef?.nativeElement) {
        this.renderChart();
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
      return types[0] ?? 'bar';
    }
    const i = types.indexOf(this.chartType());
    const idx = i < 0 ? 0 : i;
    return types[(idx + 1) % types.length]!;
  }

  toggleType(): void {
    this.chartType.set(this.nextType());
  }

  ngAfterViewInit(): void {
    this.initResizeObserver();
    this.renderChart();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.chart?.dispose();
    this.chart = null;
  }

  private initResizeObserver(): void {
    const el = this.chartHostRef?.nativeElement;
    if (!el || this.resizeObserver) return;
    this.resizeObserver = new ResizeObserver(() => {
      this.chart?.resize();
    });
    this.resizeObserver.observe(el);
  }

  private ensureChart(): void {
    const el = this.chartHostRef?.nativeElement;
    if (!el) return;
    const { width, height } = getChartHostPixelSize(el);
    if (!this.chart) {
      this.chart = echarts.init(el, undefined, {
        renderer: 'canvas',
        width,
        height
      });
    }
  }

  private renderChart(): void {
    const raw = this.data();
    const color = this.color();
    const type = this.chartType();
    const types = this.allowedTypes();
    const el = this.chartHostRef?.nativeElement;
    if (!el || !raw?.length || !types.includes(type)) return;

    this.ensureChart();
    if (!this.chart) return;

    const labels = raw.map(d => d.label);
    const values = raw.map(d => d.value);
    const palette = PALETTE.slice(0, Math.max(values.length, 1));

    let option: EChartsOption;

    switch (type) {
      case 'bar':
        option =
          this.indexAxis() === 'y'
            ? buildBarHorizontalOption(labels, values, color)
            : buildBarVerticalOption(labels, values, color);
        break;
      case 'line':
        option = buildLineSimpleOption(labels, values, color);
        break;
      case 'radar':
        option = buildRadarOption(labels, values, color);
        break;
      case 'polarArea':
        option = buildPolarAreaRoseOption(labels, values, palette);
        break;
      case 'doughnut':
        option = buildDoughnutOption(labels, values, palette, 48, 72);
        break;
      case 'pie':
        option = buildPieOption(labels, values, palette);
        break;
      default:
        option = buildBarVerticalOption(labels, values, color);
    }

    this.chart.setOption(option, { notMerge: true });
    scheduleEChartsResize(this.chart, el);
  }
}
