import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse } from '../../models/api-response';
import { ToastService } from '../../toast/toast.service';
import type {
  ReportFilterParams,
  TrainingCoverageRow,
  TrainingParticipationRow,
  CompetencyGapSummaryRow,
  TrainingCostsRow,
  ProgramEffectivenessRow,
  CertificationStatusRow,
} from './reports-api.models';

const API = `${appConfig.apiUrl}/api/reports`;

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  constructor(
    private http: HttpClient,
    private toast: ToastService,
    private translate: TranslateService
  ) {}

  private params(f: ReportFilterParams, format?: string): HttpParams {
    let p = new HttpParams();
    if (f.organizationId) p = p.set('organizationId', f.organizationId);
    if (f.organizationalUnitId) p = p.set('organizationalUnitId', f.organizationalUnitId);
    if (f.jobId) p = p.set('jobId', f.jobId);
    if (f.employeeId) p = p.set('employeeId', f.employeeId);
    if (f.programId) p = p.set('programId', f.programId);
    if (f.fromDate) p = p.set('fromDate', f.fromDate);
    if (f.toDate) p = p.set('toDate', f.toDate);
    if (format || f.format) p = p.set('format', format || f.format || 'json');
    return p;
  }

  getTrainingCoverage(filter: ReportFilterParams = {}): Observable<ApiResponse<{ rows: TrainingCoverageRow[] }>> {
    return this.http.get<ApiResponse<{ rows: TrainingCoverageRow[] }>>(`${API}/training-coverage`, { params: this.params(filter) });
  }

  getTrainingParticipation(filter: ReportFilterParams = {}): Observable<ApiResponse<{ rows: TrainingParticipationRow[] }>> {
    return this.http.get<ApiResponse<{ rows: TrainingParticipationRow[] }>>(`${API}/training-participation`, { params: this.params(filter) });
  }

  getCompetencyGapSummary(filter: ReportFilterParams = {}): Observable<ApiResponse<{ rows: CompetencyGapSummaryRow[] }>> {
    return this.http.get<ApiResponse<{ rows: CompetencyGapSummaryRow[] }>>(`${API}/competency-gap-summary`, { params: this.params(filter) });
  }

  getTrainingCosts(filter: ReportFilterParams = {}): Observable<ApiResponse<{ rows: TrainingCostsRow[] }>> {
    return this.http.get<ApiResponse<{ rows: TrainingCostsRow[] }>>(`${API}/training-costs`, { params: this.params(filter) });
  }

  getProgramEffectiveness(filter: ReportFilterParams = {}): Observable<ApiResponse<{ rows: ProgramEffectivenessRow[] }>> {
    return this.http.get<ApiResponse<{ rows: ProgramEffectivenessRow[] }>>(`${API}/program-effectiveness`, { params: this.params(filter) });
  }

  getCertificationStatus(filter: ReportFilterParams = {}): Observable<ApiResponse<{ rows: CertificationStatusRow[] }>> {
    return this.http.get<ApiResponse<{ rows: CertificationStatusRow[] }>>(`${API}/certification-status`, { params: this.params(filter) });
  }

  getCompetencyGapSummaryCsvUrl(filter: ReportFilterParams = {}): string {
    return `${API}/competency-gap-summary?${this.params({ ...filter, format: 'csv' }).toString()}`;
  }

  getTrainingCoverageCsvUrl(filter: ReportFilterParams = {}): string {
    return `${API}/training-coverage?${this.params({ ...filter, format: 'csv' }).toString()}`;
  }

  getCertificationStatusCsvUrl(filter: ReportFilterParams = {}): string {
    return `${API}/certification-status?${this.params({ ...filter, format: 'csv' }).toString()}`;
  }

  getTrainingParticipationCsvUrl(filter: ReportFilterParams = {}): string {
    return `${API}/training-participation?${this.params({ ...filter, format: 'csv' }).toString()}`;
  }

  getTrainingCostsCsvUrl(filter: ReportFilterParams = {}): string {
    return `${API}/training-costs?${this.params({ ...filter, format: 'csv' }).toString()}`;
  }

  getProgramEffectivenessCsvUrl(filter: ReportFilterParams = {}): string {
    return `${API}/program-effectiveness?${this.params({ ...filter, format: 'csv' }).toString()}`;
  }

  getTrainingCoveragePdfUrl(filter: ReportFilterParams = {}): string {
    return `${API}/training-coverage?${this.params({ ...filter, format: 'pdf' }).toString()}`;
  }

  getTrainingParticipationPdfUrl(filter: ReportFilterParams = {}): string {
    return `${API}/training-participation?${this.params({ ...filter, format: 'pdf' }).toString()}`;
  }

  getTrainingCostsPdfUrl(filter: ReportFilterParams = {}): string {
    return `${API}/training-costs?${this.params({ ...filter, format: 'pdf' }).toString()}`;
  }

  getProgramEffectivenessPdfUrl(filter: ReportFilterParams = {}): string {
    return `${API}/program-effectiveness?${this.params({ ...filter, format: 'pdf' }).toString()}`;
  }

  getCompetencyGapSummaryPdfUrl(filter: ReportFilterParams = {}): string {
    return `${API}/competency-gap-summary?${this.params({ ...filter, format: 'pdf' }).toString()}`;
  }

  getCertificationStatusPdfUrl(filter: ReportFilterParams = {}): string {
    return `${API}/certification-status?${this.params({ ...filter, format: 'pdf' }).toString()}`;
  }

  getTrainingCoverageExcelUrl(filter: ReportFilterParams = {}): string {
    return `${API}/training-coverage?${this.params({ ...filter, format: 'xlsx' }).toString()}`;
  }

  getTrainingParticipationExcelUrl(filter: ReportFilterParams = {}): string {
    return `${API}/training-participation?${this.params({ ...filter, format: 'xlsx' }).toString()}`;
  }

  getTrainingCostsExcelUrl(filter: ReportFilterParams = {}): string {
    return `${API}/training-costs?${this.params({ ...filter, format: 'xlsx' }).toString()}`;
  }

  getProgramEffectivenessExcelUrl(filter: ReportFilterParams = {}): string {
    return `${API}/program-effectiveness?${this.params({ ...filter, format: 'xlsx' }).toString()}`;
  }

  getCompetencyGapSummaryExcelUrl(filter: ReportFilterParams = {}): string {
    return `${API}/competency-gap-summary?${this.params({ ...filter, format: 'xlsx' }).toString()}`;
  }

  getCertificationStatusExcelUrl(filter: ReportFilterParams = {}): string {
    return `${API}/certification-status?${this.params({ ...filter, format: 'xlsx' }).toString()}`;
  }

  /**
   * Fetches report file with Authorization header and triggers download.
   * Use instead of href so the request is authenticated.
   */
  downloadReport(url: string, defaultFilename: string): void {
    this.http.get(url, { responseType: 'blob', observe: 'response' }).subscribe({
      next: (res: HttpResponse<Blob>) => {
        const filename = this.getFilenameFromContentDisposition(res.headers.get('Content-Disposition')) ?? defaultFilename;
        this.triggerBlobDownload(res.body!, filename);
      },
      error: () => {
        this.toast.error(this.translate.instant('reports.exportError'));
      },
    });
  }

  private getFilenameFromContentDisposition(header: string | null): string | null {
    if (!header) return null;
    const match = header.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i) ?? header.match(/filename=["']?([^"';]+)["']?/i);
    return match ? decodeURIComponent(match[1].trim()) : null;
  }

  private triggerBlobDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
