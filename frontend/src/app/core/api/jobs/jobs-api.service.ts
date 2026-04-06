import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult, PagedParams } from '../../models/api-response';
import type { JobListDto, JobDto, CreateJobRequest, UpdateJobRequest, SetStatusRequest } from './jobs-api.models';

const API = `${appConfig.apiUrl}/api/jobs`;

@Injectable({ providedIn: 'root' })
export class JobsApiService {
  constructor(private http: HttpClient) {}

  getPaged(params: PagedParams & { organizationalUnitId?: string; isActive?: boolean }): Observable<ApiResponse<PagedResult<JobListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 10));
    if (params.search) p = p.set('search', params.search);
    if (params.sortBy) p = p.set('sortBy', params.sortBy);
    if (params.sortDescending !== undefined) p = p.set('sortDescending', String(params.sortDescending));
    if (params.organizationalUnitId) p = p.set('organizationalUnitId', params.organizationalUnitId);
    if (params.isActive !== undefined) p = p.set('isActive', String(params.isActive));
    return this.http.get<ApiResponse<PagedResult<JobListDto>>>(API, { params: p });
  }

  getById(id: string): Observable<ApiResponse<JobDto>> {
    return this.http.get<ApiResponse<JobDto>>(`${API}/${id}`);
  }

  create(body: CreateJobRequest): Observable<ApiResponse<JobListDto>> {
    return this.http.post<ApiResponse<JobListDto>>(API, body);
  }

  update(id: string, body: UpdateJobRequest): Observable<ApiResponse<JobListDto>> {
    return this.http.put<ApiResponse<JobListDto>>(`${API}/${id}`, body);
  }

  setStatus(id: string, body: SetStatusRequest): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${API}/${id}/status`, body);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/${id}`);
  }
}
