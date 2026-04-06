import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult, PagedParams } from '../../models/api-response';
import type {
  CertificateListDto,
  CertificateDto,
  GenerateCertificateRequest,
  CertificateGenerationRecipientDto,
} from './certificates-api.models';

const API = `${appConfig.apiUrl}/api/certificates`;

@Injectable({ providedIn: 'root' })
export class CertificatesApiService {
  constructor(private http: HttpClient) {}

  getPaged(
    params: PagedParams & { employeeId?: string; programId?: string }
  ): Observable<ApiResponse<PagedResult<CertificateListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 20));
    if (params.employeeId) p = p.set('employeeId', params.employeeId);
    if (params.programId) p = p.set('programId', params.programId);
    if (params.search) p = p.set('search', params.search);
    return this.http.get<ApiResponse<PagedResult<CertificateListDto>>>(API, { params: p });
  }

  getById(id: string): Observable<ApiResponse<CertificateDto>> {
    return this.http.get<ApiResponse<CertificateDto>>(`${API}/${id}`);
  }

  getByEmployee(employeeId: string): Observable<ApiResponse<CertificateListDto[]>> {
    return this.http.get<ApiResponse<CertificateListDto[]>>(`${API}/by-employee/${employeeId}`);
  }

  getByProgram(programId: string): Observable<ApiResponse<CertificateListDto[]>> {
    return this.http.get<ApiResponse<CertificateListDto[]>>(`${API}/by-program/${programId}`);
  }

  /** certificate:manage — list who can receive a certificate for this program (no enrollment:view needed). */
  getGenerationRecipients(programId: string): Observable<ApiResponse<CertificateGenerationRecipientDto[]>> {
    return this.http.get<ApiResponse<CertificateGenerationRecipientDto[]>>(
      `${API}/generate-recipients/${programId}`,
    );
  }

  generate(body: GenerateCertificateRequest): Observable<ApiResponse<CertificateDto>> {
    return this.http.post<ApiResponse<CertificateDto>>(`${API}/generate`, body);
  }

  uploadFile(certificateId: string, file: File): Observable<ApiResponse<{ filePath: string; url: string }>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<{ filePath: string; url: string }>>(`${API}/${certificateId}/file`, form);
  }

  fileUrl(relativePath: string): string {
    const p = (relativePath ?? '').replace(/^\/+/, '');
    return `${appConfig.apiUrl}/files/${p}`;
  }
}
