import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageShellComponent } from '../../../shared/page-shell/page-shell.component';
import { ReportsApiService } from '../../../core/api/reports/reports-api.service';
import { ShowIfPermissionDirective } from '../../../core/directives/show-if-permission.directive';
import { PermissionCodes } from '../../../core/auth/permissions';
import { LocaleService } from '../../../core/i18n/locale.service';
import type { CompetencyGapSummaryRow, ReportFilterParams } from '../../../core/api/reports/reports-api.models';
import { reportsSeverityTone, type SeverityTone } from '../reports-ui.utils';

@Component({
  selector: 'app-reports-competency-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, TranslateModule, PageShellComponent, ShowIfPermissionDirective],
  templateUrl: './reports-competency-page.component.html',
  styleUrls: ['./reports-competency-page.component.scss', '../reports-analytics.scss'],
})
export class ReportsCompetencyPageComponent implements OnInit {
  private readonly reportsApi = inject(ReportsApiService);
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LocaleService);
  private readonly router = inject(Router);

  protected readonly PermissionCodes = PermissionCodes;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly rows = signal<CompetencyGapSummaryRow[]>([]);
  filterFromDate = '';
  filterToDate = '';

  readonly reportsTabIndex = computed(() => {
    const path = this.router.url.split('?')[0];
    if (path.includes('/reports/certifications')) return 2;
    if (path.includes('/reports/competency')) return 1;
    return 0;
  });

  breadcrumbs = computed(() => [
    { label: this.translate.instant('nav.reports'), route: '/reports' },
    { label: this.translate.instant('reports.competency') },
  ]);

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
    this.filterFromDate = '';
    this.filterToDate = '';
    this.load();
  }

  severityChipClass(severity: string | null | undefined): string {
    const t: SeverityTone = reportsSeverityTone(severity);
    const map: Record<SeverityTone, string> = {
      high: 'reports-chip reports-chip--sev-high',
      mid: 'reports-chip reports-chip--sev-mid',
      low: 'reports-chip reports-chip--sev-low',
      neutral: 'reports-chip reports-chip--neutral',
    };
    return map[t];
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const filter: ReportFilterParams = {};
    if (this.filterFromDate) filter.fromDate = this.filterFromDate;
    if (this.filterToDate) filter.toDate = this.filterToDate;
    this.reportsApi.getCompetencyGapSummary(filter).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data?.rows) this.rows.set(res.data.rows);
        else this.rows.set([]);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load');
      },
    });
  }

  getPdfUrl(): string {
    const filter: ReportFilterParams = { format: 'pdf' };
    if (this.filterFromDate) filter.fromDate = this.filterFromDate;
    if (this.filterToDate) filter.toDate = this.filterToDate;
    return this.reportsApi.getCompetencyGapSummaryPdfUrl(filter);
  }

  getExcelUrl(): string {
    const filter: ReportFilterParams = { format: 'xlsx' };
    if (this.filterFromDate) filter.fromDate = this.filterFromDate;
    if (this.filterToDate) filter.toDate = this.filterToDate;
    return this.reportsApi.getCompetencyGapSummaryExcelUrl(filter);
  }

  exportPdf(): void {
    this.reportsApi.downloadReport(this.getPdfUrl(), 'competency-gap-summary.pdf');
  }
  exportExcel(): void {
    this.reportsApi.downloadReport(this.getExcelUrl(), 'competency-gap-summary.xlsx');
  }

  localizedDepartmentName(row: CompetencyGapSummaryRow): string {
    const lang = (this.translate.currentLang || this.translate.getDefaultLang() || 'en').toLowerCase();
    const prefersArabic = lang.startsWith('ar');
    const ar = row.departmentNameAr?.trim() ?? '';
    const en = row.departmentNameEn?.trim() ?? row.departmentName?.trim() ?? '';
    if (prefersArabic) return ar || en || '—';
    return en || ar || '—';
  }
}
