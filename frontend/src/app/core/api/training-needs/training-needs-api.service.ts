import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult, PagedParams } from '../../models/api-response';
import type {
  TrainingNeedListDto,
  TrainingNeedDto,
  CreateTrainingNeedRequest,
  UpdateTrainingNeedRequest,
  AssignTrainingNeedsToPlanRequest,
} from './training-needs-api.models';

const API = `${appConfig.apiUrl}/api/training-needs`;

@Injectable({ providedIn: 'root' })
export class TrainingNeedsApiService {
  constructor(private http: HttpClient) {}

  getPaged(
    params: PagedParams & {
      organizationId?: string;
      employeeId?: string;
      jobId?: string;
      organizationalUnitId?: string;
      status?: string;
    }
  ): Observable<ApiResponse<PagedResult<TrainingNeedListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 20));
    if (params.organizationId) p = p.set('organizationId', params.organizationId);
    if (params.employeeId) p = p.set('employeeId', params.employeeId);
    if (params.jobId) p = p.set('jobId', params.jobId);
    if (params.organizationalUnitId) p = p.set('organizationalUnitId', params.organizationalUnitId);
    if (params.status) p = p.set('status', params.status);
    if (params.search) p = p.set('search', params.search);
    return this.http.get<ApiResponse<PagedResult<TrainingNeedListDto>>>(API, { params: p });
  }

  getById(id: string): Observable<ApiResponse<TrainingNeedDto | null>> {
    return this.http.get<ApiResponse<TrainingNeedDto | null>>(`${API}/${id}`);
  }

  create(body: CreateTrainingNeedRequest): Observable<ApiResponse<TrainingNeedDto>> {
    return this.http.post<ApiResponse<TrainingNeedDto>>(API, body);
  }

  update(id: string, body: UpdateTrainingNeedRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/${id}`, body);
  }

  submit(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/${id}/submit`, {});
  }

  approve(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/${id}/approve`, {});
  }

  reject(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/${id}/reject`, {});
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/${id}`);
  }

  generateFromGaps(gapIds: string[]): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${API}/generate-from-gaps`, gapIds);
  }

  assignToPlan(body: AssignTrainingNeedsToPlanRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${API}/assign-to-plan`, body);
  }
}
