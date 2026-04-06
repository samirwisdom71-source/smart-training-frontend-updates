import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult, PagedParams } from '../../models/api-response';
import type {
  PostTrainingReportListDto,
  PostTrainingReportDto,
  SavePostTrainingReportDraftRequest,
} from './post-training-reports-api.models';

const API = `${appConfig.apiUrl}/api/post-training-reports`;

@Injectable({ providedIn: 'root' })
export class PostTrainingReportsApiService {
  constructor(private http: HttpClient) {}

  getPaged(
    params: PagedParams & { employeeId?: string; programId?: string; status?: string }
  ): Observable<ApiResponse<PagedResult<PostTrainingReportListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 20));
    if (params.employeeId) p = p.set('employeeId', params.employeeId);
    if (params.programId) p = p.set('programId', params.programId);
    if (params.status) p = p.set('status', params.status);
    return this.http.get<ApiResponse<PagedResult<PostTrainingReportListDto>>>(API, { params: p });
  }

  getById(id: string): Observable<ApiResponse<PostTrainingReportDto>> {
    return this.http.get<ApiResponse<PostTrainingReportDto>>(`${API}/${id}`);
  }

  /** Returns new or updated report id in `data`. */
  saveDraft(body: SavePostTrainingReportDraftRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(API, body);
  }

  submit(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/${id}/submit`, {});
  }

  review(id: string, managerComment?: string | null): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/${id}/review`, JSON.stringify(managerComment ?? null), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  archive(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/${id}/archive`, {});
  }

  uploadAttachment(id: string, file: File): Observable<ApiResponse<{ url: string; originalFileName: string }>> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<ApiResponse<{ url: string; originalFileName: string }>>(`${API}/${id}/attachment`, form);
  }

  removeAttachment(id: string): Observable<ApiResponse<{ removed: boolean }>> {
    return this.http.delete<ApiResponse<{ removed: boolean }>>(`${API}/${id}/attachment`);
  }

  /**
   * Fetches the file with auth (Bearer) and triggers a browser download.
   * Needed when the UI runs on a different origin than the API (e.g. localhost:4200 → :5076).
   */
  downloadStoredAttachment(relativePath: string, originalFileName: string | null): Observable<void> {
    const url = `${appConfig.apiUrl}/files/${(relativePath ?? '').replace(/^\/+/, '').replace(/\\/g, '/')}`;
    const fileName = this.sanitizeDownloadName(originalFileName, relativePath);
    return this.http.get(url, { responseType: 'blob' }).pipe(
      tap((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = fileName;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
      }),
      map(() => undefined),
    );
  }

  private sanitizeDownloadName(original: string | null, relativePath: string): string {
    const fromOriginal = original?.trim();
    if (fromOriginal) return fromOriginal.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_');
    const leaf = relativePath.replace(/^.*[/\\]/, '').trim();
    return leaf || 'post-training-report-attachment';
  }
}
