import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as echarts from 'echarts';
import type { ECharts, EChartsOption } from 'echarts';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ImpactApiService } from '../../../core/api/impact/impact-api.service';
import { TrainingProgramsApiService } from '../../../core/api/training-programs/training-programs-api.service';
import { EmployeesApiService } from '../../../core/api/employees/employees-api.service';
import type { ImpactComparisonDto, ImpactComparisonRowDto } from '../../../core/api/impact/impact-api.models';
import { buildGroupedBarVerticalOption } from '../../dashboard/utils/dashboard-echarts.options';
import { getChartHostPixelSize, scheduleEChartsResize } from '../../dashboard/utils/dashboard-echarts-host';

@Component({
  selector: 'app-impact-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, DecimalPipe, PageShellComponent],
  templateUrl: './impact-page.component.html',
  styleUrls: ['./impact-page.component.scss'],
})
export class ImpactPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly api = inject(ImpactApiService);
  private readonly programsApi = inject(TrainingProgramsApiService);
  private readonly employeesApi = inject(EmployeesApiService);
  private readonly translate = inject(TranslateService);

  @ViewChild('comparisonChartHost') private comparisonChartHostRef?: ElementRef<HTMLDivElement>;
  @ViewChild('deltaChartHost') private deltaChartHostRef?: ElementRef<HTMLDivElement>;
  private comparisonChart: ECharts | null = null;
  private deltaChart: ECharts | null = null;
  private comparisonResizeObserver: ResizeObserver | null = null;
  private deltaResizeObserver: ResizeObserver | null = null;
  private viewInitialized = false;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly comparison = signal<ImpactComparisonDto | null>(null);
  readonly programOptions = signal<{ id: string; titleEn: string; titleAr: string }[]>([]);
  readonly employeeOptions = signal<{ id: string; fullNameEn: string; fullNameAr: string }[]>([]);
  selectedProgramId: string | null = null;
  selectedEmployeeId: string | null = null;
  /** Both chart panels start collapsed; single trigger opens both. */
  readonly chartsExpanded = signal(false);
  readonly summary = computed(() => this.comparison()?.summary ?? null);
  readonly rows = computed(() => this.comparison()?.rows ?? []);
  readonly comparisonChartRows = computed(() => this.rows().slice(0, 12));

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.impact') }]);

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadComparison();
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.renderCharts();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  onProgramChange(): void {
    this.loadComparison();
  }

  onEmployeeChange(): void {
    this.loadComparison();
  }

  clearFilters(): void {
    this.selectedProgramId = null;
    this.selectedEmployeeId = null;
    this.error.set(null);
    this.loadComparison();
  }

  loadComparison(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getComparison({
      programId: this.selectedProgramId ?? undefined,
      employeeId: this.selectedEmployeeId ?? undefined,
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.comparison.set(res.data);
          this.queueRenderCharts();
        } else {
          this.comparison.set(null);
          this.error.set(this.translate.instant('impact.loadFailed'));
          this.destroyCharts();
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.comparison.set(null);
        this.error.set(err.error?.message ?? err.message ?? this.translate.instant('impact.loadFailed'));
        this.destroyCharts();
      },
    });
  }

  toggleCharts(): void {
    this.chartsExpanded.update((v) => !v);
    setTimeout(() => this.renderCharts(), 0);
  }

  localizedProgramTitle(id: string, fallbackEn: string): string {
    const p = this.programOptions().find((x) => x.id === id);
    if (p) return this.getLocalizedText(p.titleAr, p.titleEn);
    return fallbackEn || '—';
  }

  localizedEmployeeName(id: string, fallbackEn: string): string {
    const e = this.employeeOptions().find((x) => x.id === id);
    if (e) return this.getLocalizedText(e.fullNameAr, e.fullNameEn);
    return fallbackEn || '—';
  }

  reportStatusKey(status: string | null | undefined): string {
    return status ? `postTrainingReports.status.${status}` : 'common.noData';
  }

  impactVsEvaluationDelta(row: ImpactComparisonRowDto): number | null {
    if (row.impactAverageScore == null || row.evaluationAverageScore == null) return null;
    return Number((row.impactAverageScore - row.evaluationAverageScore).toFixed(2));
  }

  detailLevelLabel(code: string | null | undefined, level: number | null | undefined): string {
    if (!code) return '—';
    return level != null ? `${code} (${level})` : code;
  }

  employeeCardInitial(row: ImpactComparisonRowDto): string {
    const n = this.localizedEmployeeName(row.employeeId, row.employeeNameEn);
    const t = n.trim();
    if (!t || t === '—') return '?';
    return t.charAt(0).toUpperCase();
  }

  chartLabel(row: ImpactComparisonRowDto): string {
    if (this.selectedProgramId && !this.selectedEmployeeId) {
      return this.localizedEmployeeName(row.employeeId, row.employeeNameEn);
    }
    if (this.selectedEmployeeId && !this.selectedProgramId) {
      return this.localizedProgramTitle(row.trainingProgramId, row.programTitleEn);
    }
    return `${this.localizedEmployeeName(row.employeeId, row.employeeNameEn)} - ${this.localizedProgramTitle(row.trainingProgramId, row.programTitleEn)}`;
  }

  private loadFilterOptions(): void {
    this.programsApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.programOptions.set(res.data.items.map((p) => ({ id: p.id, titleEn: p.titleEn, titleAr: p.titleAr })));
        }
      },
    });

    this.employeesApi.getPaged({ page: 1, pageSize: 500 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.employeeOptions.set(
            res.data.items.map((e) => ({ id: e.id, fullNameEn: e.fullNameEn, fullNameAr: e.fullNameAr })),
          );
        }
      },
    });
  }

  private getLocalizedText(ar?: string | null, en?: string | null): string {
    const lang = (this.translate.currentLang || this.translate.getDefaultLang() || 'en').toLowerCase();
    const arText = ar?.trim() ?? '';
    const enText = en?.trim() ?? '';
    if (lang.startsWith('ar')) return arText || enText || '—';
    return enText || arText || '—';
  }

  private queueRenderCharts(): void {
    queueMicrotask(() => this.renderCharts());
  }

  private renderCharts(): void {
    if (!this.viewInitialized) return;

    const rows = this.comparisonChartRows();
    this.teardownChartObservers();

    if (this.comparisonChart) {
      this.comparisonChart.dispose();
      this.comparisonChart = null;
    }
    if (this.deltaChart) {
      this.deltaChart.dispose();
      this.deltaChart = null;
    }

    if (!rows.length) {
      return;
    }

    const labels = rows.map((row) => this.chartLabel(row));

    const comparisonOption: EChartsOption = buildGroupedBarVerticalOption(
      labels,
      [
        {
          name: this.translate.instant('impact.evaluationAverage'),
          data: rows.map((row) => row.evaluationAverageScore),
          color: '#2563eb',
        },
        {
          name: this.translate.instant('impact.reportCurrentAverage'),
          data: rows.map((row) => row.reportCurrentAverageLevel),
          color: '#10b981',
        },
        {
          name: this.translate.instant('impact.impactAverage'),
          data: rows.map((row) => row.impactAverageScore),
          color: '#f97316',
        },
      ],
      { min: 0, max: 5 }
    );

    const deltaOption: EChartsOption = buildGroupedBarVerticalOption(
      labels,
      [
        {
          name: this.translate.instant('impact.reportImprovement'),
          data: rows.map((row) => row.reportImprovementDelta),
          color: '#8b5cf6',
        },
        {
          name: this.translate.instant('impact.impactVsEvaluationDelta'),
          data: rows.map((row) => this.impactVsEvaluationDelta(row)),
          color: '#ec4899',
        },
      ],
      { min: 0 }
    );

    const cmpHost = this.comparisonChartHostRef?.nativeElement;
    const deltaHost = this.deltaChartHostRef?.nativeElement;
    if (this.chartsExpanded() && cmpHost) {
      this.comparisonChart = this.initEChart(cmpHost, comparisonOption);
      this.comparisonResizeObserver = new ResizeObserver(() => this.comparisonChart?.resize());
      this.comparisonResizeObserver.observe(cmpHost);
    }
    if (this.chartsExpanded() && deltaHost) {
      this.deltaChart = this.initEChart(deltaHost, deltaOption);
      this.deltaResizeObserver = new ResizeObserver(() => this.deltaChart?.resize());
      this.deltaResizeObserver.observe(deltaHost);
    }
  }

  private initEChart(host: HTMLDivElement, option: EChartsOption): ECharts {
    const { width, height } = getChartHostPixelSize(host);
    const chart = echarts.init(host, undefined, {
      renderer: 'canvas',
      width,
      height,
    });
    chart.setOption(option, { notMerge: true });
    scheduleEChartsResize(chart, host);
    return chart;
  }

  private teardownChartObservers(): void {
    this.comparisonResizeObserver?.disconnect();
    this.comparisonResizeObserver = null;
    this.deltaResizeObserver?.disconnect();
    this.deltaResizeObserver = null;
  }

  private destroyCharts(): void {
    this.teardownChartObservers();
    if (this.comparisonChart) {
      this.comparisonChart.dispose();
      this.comparisonChart = null;
    }
    if (this.deltaChart) {
      this.deltaChart.dispose();
      this.deltaChart = null;
    }
  }
}
