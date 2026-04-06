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
import type { CertificationStatusRow, ReportFilterParams } from '../../../core/api/reports/reports-api.models';
import { reportsStatusTone, type StatusTone } from '../reports-ui.utils';

@Component({
  selector: 'app-reports-certifications-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, TranslateModule, PageShellComponent, ShowIfPermissionDirective],
  templateUrl: './reports-certifications-page.component.html',
  styleUrls: ['./reports-certifications-page.component.scss', '../reports-analytics.scss'],
})
export class ReportsCertificationsPageComponent implements OnInit {
  private readonly reportsApi = inject(ReportsApiService);
  private readonly translate = inject(TranslateService);
  private readonly locale = inject(LocaleService);
  private readonly router = inject(Router);

  protected readonly PermissionCodes = PermissionCodes;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly rows = signal<CertificationStatusRow[]>([]);
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
    { label: this.translate.instant('reports.certifications') },
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
    if (this.filterFromDate) filter.fromDate = this.filterFromDate;
    if (this.filterToDate) filter.toDate = this.filterToDate;
    this.reportsApi.getCertificationStatus(filter).subscribe({
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
    return this.reportsApi.getCertificationStatusPdfUrl(filter);
  }

  getExcelUrl(): string {
    const filter: ReportFilterParams = { format: 'xlsx' };
    if (this.filterFromDate) filter.fromDate = this.filterFromDate;
    if (this.filterToDate) filter.toDate = this.filterToDate;
    return this.reportsApi.getCertificationStatusExcelUrl(filter);
  }

  exportPdf(): void {
    this.reportsApi.downloadReport(this.getPdfUrl(), 'certification-status.pdf');
  }
  exportExcel(): void {
    this.reportsApi.downloadReport(this.getExcelUrl(), 'certification-status.xlsx');
  }
}
