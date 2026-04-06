import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ReportsApiService } from '../../../core/api/reports/reports-api.service';
import { ShowIfPermissionDirective } from '../../../core/directives/show-if-permission.directive';
import { PermissionCodes } from '../../../core/auth/permissions';
import { LocaleService } from '../../../core/i18n/locale.service';
import { forkJoin } from 'rxjs';
import type {
  TrainingCoverageRow,
  TrainingParticipationRow,
  TrainingCostsRow,
  ProgramEffectivenessRow,
  ReportFilterParams,
} from '../../../core/api/reports/reports-api.models';
import { reportsPercentTone, reportsScoreTone, reportsStatusTone, type StatusTone } from '../reports-ui.utils';

@Component({
  selector: 'app-reports-training-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, DecimalPipe, RouterLink, RouterLinkActive, PageShellComponent, ShowIfPermissionDirective],
  templateUrl: './reports-training-page.component.html',
  styleUrls: ['./reports-training-page.component.scss', '../reports-analytics.scss'],
})
export class ReportsTrainingPageComponent implements OnInit {
  private readonly reportsApi = inject(ReportsApiService);
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LocaleService);
  private readonly router = inject(Router);

  protected readonly PermissionCodes = PermissionCodes;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly coverageRows = signal<TrainingCoverageRow[]>([]);
  readonly participationRows = signal<TrainingParticipationRow[]>([]);
  readonly costsRows = signal<TrainingCostsRow[]>([]);
  readonly effectivenessRows = signal<ProgramEffectivenessRow[]>([]);
  filterOrgId: string | null = null;
  filterFromDate = '';
  filterToDate = '';

  readonly reportsTabIndex = computed(() => {
    const path = this.router.url.split('?')[0];
    if (path.includes('/reports/certifications')) return 2;
    if (path.includes('/reports/competency')) return 1;
    return 0;
  });

  breadcrumbs = computed(() => [{ label: this.translate.instant('nav.reports'), route: '/reports' }, { label: this.translate.instant('reports.training') }]);

  ngOnInit(): void {
    this.locale.setLang('ar');
    this.load();
  }

  onFromDateChange(): void {
    if (this.filterFromDate && this.filterToDate && this.filterToDate < this.filterFromDate) {
      this.filterToDate = this.filterFromDate;
    }
  }

  onToDateChange(): void {
    if (this.filterFromDate && this.filterToDate && this.filterToDate < this.filterFromDate) {
      this.filterFromDate = this.filterToDate;
    }
  }

  clearFilters(): void {
    this.filterOrgId = null;
    this.filterFromDate = '';
    this.filterToDate = '';
    this.load();
  }

  percentPillClass(percent: number): string {
    return `reports-pct reports-pct--${reportsPercentTone(percent)}`;
  }

  scorePillClass(score: number | null | undefined): string {
    return `reports-pct reports-pct--${reportsScoreTone(score)}`;
  }

  statusChipClass(status: string | null | undefined): string {
    const t: StatusTone = reportsStatusTone(status);
    const map: Record<StatusTone, string> = {
      success: 'reports-chip reports-chip--success',
      warning: 'reports-chip reports-chip--warning',
      danger: 'reports-chip reports-chip--danger',
      neutral: 'reports-chip reports-chip--neutral',
    };
    return map[t];
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const filter: ReportFilterParams = {};
    if (this.filterOrgId) filter.organizationId = this.filterOrgId;
    if (this.filterFromDate) filter.fromDate = this.filterFromDate;
    if (this.filterToDate) filter.toDate = this.filterToDate;

    forkJoin({
      coverage: this.reportsApi.getTrainingCoverage(filter),
      participation: this.reportsApi.getTrainingParticipation(filter),
      costs: this.reportsApi.getTrainingCosts(filter),
      effectiveness: this.reportsApi.getProgramEffectiveness(filter),
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.coverage.success && res.coverage.data) this.coverageRows.set((res.coverage.data as { rows?: TrainingCoverageRow[] }).rows ?? []);
        if (res.participation.success && res.participation.data) this.participationRows.set((res.participation.data as { rows?: TrainingParticipationRow[] }).rows ?? []);
        if (res.costs.success && res.costs.data) this.costsRows.set((res.costs.data as { rows?: TrainingCostsRow[] }).rows ?? []);
        if (res.effectiveness.success && res.effectiveness.data) this.effectivenessRows.set((res.effectiveness.data as { rows?: ProgramEffectivenessRow[] }).rows ?? []);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load');
      },
    });
  }

  getCoverageExcelUrl(): string {
    return this.reportsApi.getTrainingCoverageExcelUrl(this.currentFilter());
  }

  getParticipationExcelUrl(): string {
    return this.reportsApi.getTrainingParticipationExcelUrl(this.currentFilter());
  }

  getCostsExcelUrl(): string {
    return this.reportsApi.getTrainingCostsExcelUrl(this.currentFilter());
  }

  getEffectivenessExcelUrl(): string {
    return this.reportsApi.getProgramEffectivenessExcelUrl(this.currentFilter());
  }

  getCoveragePdfUrl(): string {
    return this.reportsApi.getTrainingCoveragePdfUrl(this.currentFilter());
  }
  getParticipationPdfUrl(): string {
    return this.reportsApi.getTrainingParticipationPdfUrl(this.currentFilter());
  }
  getCostsPdfUrl(): string {
    return this.reportsApi.getTrainingCostsPdfUrl(this.currentFilter());
  }
  getEffectivenessPdfUrl(): string {
    return this.reportsApi.getProgramEffectivenessPdfUrl(this.currentFilter());
  }

  exportCoveragePdf(): void {
    this.reportsApi.downloadReport(this.getCoveragePdfUrl(), 'training-coverage.pdf');
  }
  exportCoverageExcel(): void {
    this.reportsApi.downloadReport(this.getCoverageExcelUrl(), 'training-coverage.xlsx');
  }
  exportParticipationPdf(): void {
    this.reportsApi.downloadReport(this.getParticipationPdfUrl(), 'training-participation.pdf');
  }
  exportParticipationExcel(): void {
    this.reportsApi.downloadReport(this.getParticipationExcelUrl(), 'training-participation.xlsx');
  }
  exportCostsPdf(): void {
    this.reportsApi.downloadReport(this.getCostsPdfUrl(), 'training-costs.pdf');
  }
  exportCostsExcel(): void {
    this.reportsApi.downloadReport(this.getCostsExcelUrl(), 'training-costs.xlsx');
  }
  exportEffectivenessPdf(): void {
    this.reportsApi.downloadReport(this.getEffectivenessPdfUrl(), 'program-effectiveness.pdf');
  }
  exportEffectivenessExcel(): void {
    this.reportsApi.downloadReport(this.getEffectivenessExcelUrl(), 'program-effectiveness.xlsx');
  }

  localizedCoverageOuName(row: TrainingCoverageRow): string {
    const lang = (this.translate.currentLang || this.translate.getDefaultLang() || 'en').toLowerCase();
    const prefersArabic = lang.startsWith('ar');
    const ar = row.organizationalUnitNameAr?.trim() ?? '';
    const en = row.organizationalUnitNameEn?.trim() ?? row.organizationalUnitName?.trim() ?? '';
    if (prefersArabic) return ar || en || '—';
    return en || ar || '—';
  }

  private currentFilter(): ReportFilterParams {
    const f: ReportFilterParams = {};
    if (this.filterOrgId) f.organizationId = this.filterOrgId;
    if (this.filterFromDate) f.fromDate = this.filterFromDate;
    if (this.filterToDate) f.toDate = this.filterToDate;
    return f;
  }
}
