import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult, PagedParams } from '../../models/api-response';
import type { CompetencyFrameworkListDto, CompetencyFrameworkDto, CreateCompetencyFrameworkRequest, UpdateCompetencyFrameworkRequest, SetStatusRequest } from './competency-frameworks-api.models';

const API = `${appConfig.apiUrl}/api/competency-frameworks`;

@Injectable({ providedIn: 'root' })
export class CompetencyFrameworksApiService {
  constructor(private http: HttpClient) {}

  getPaged(params: PagedParams & { organizationId?: string; isActive?: boolean }): Observable<ApiResponse<PagedResult<CompetencyFrameworkListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 10));
    if (params.search) p = p.set('search', params.search);
    if (params.sortBy) p = p.set('sortBy', params.sortBy);
    if (params.sortDescending !== undefined) p = p.set('sortDescending', String(params.sortDescending));
    if (params.organizationId) p = p.set('organizationId', params.organizationId);
    if (params.isActive !== undefined) p = p.set('isActive', String(params.isActive));
    return this.http.get<ApiResponse<PagedResult<CompetencyFrameworkListDto>>>(API, { params: p });
  }

  getById(id: string): Observable<ApiResponse<CompetencyFrameworkDto>> {
    return this.http.get<ApiResponse<CompetencyFrameworkDto>>(`${API}/${id}`);
  }

  create(body: CreateCompetencyFrameworkRequest): Observable<ApiResponse<CompetencyFrameworkListDto>> {
    return this.http.post<ApiResponse<CompetencyFrameworkListDto>>(API, body);
  }

  update(id: string, body: UpdateCompetencyFrameworkRequest): Observable<ApiResponse<CompetencyFrameworkListDto>> {
    return this.http.put<ApiResponse<CompetencyFrameworkListDto>>(`${API}/${id}`, body);
  }

  setStatus(id: string, body: SetStatusRequest): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${API}/${id}/status`, body);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/${id}`);
  }
}
