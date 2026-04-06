import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult, PagedParams } from '../../models/api-response';
import type { CompetencyTypeListDto, CompetencyTypeDto, CreateCompetencyTypeRequest, UpdateCompetencyTypeRequest, SetStatusRequest } from './competency-types-api.models';

const API = `${appConfig.apiUrl}/api/competency-types`;

@Injectable({ providedIn: 'root' })
export class CompetencyTypesApiService {
  constructor(private http: HttpClient) {}

  getPaged(params: PagedParams & { frameworkId?: string; isActive?: boolean }): Observable<ApiResponse<PagedResult<CompetencyTypeListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 10));
    if (params.search) p = p.set('search', params.search);
    if (params.sortBy) p = p.set('sortBy', params.sortBy);
    if (params.sortDescending !== undefined) p = p.set('sortDescending', String(params.sortDescending));
    if (params.frameworkId) p = p.set('frameworkId', params.frameworkId);
    if (params.isActive !== undefined) p = p.set('isActive', String(params.isActive));
    return this.http.get<ApiResponse<PagedResult<CompetencyTypeListDto>>>(API, { params: p });
  }

  getById(id: string): Observable<ApiResponse<CompetencyTypeDto>> {
    return this.http.get<ApiResponse<CompetencyTypeDto>>(`${API}/${id}`);
  }

  create(body: CreateCompetencyTypeRequest): Observable<ApiResponse<CompetencyTypeListDto>> {
    return this.http.post<ApiResponse<CompetencyTypeListDto>>(API, body);
  }

  update(id: string, body: UpdateCompetencyTypeRequest): Observable<ApiResponse<CompetencyTypeListDto>> {
    return this.http.put<ApiResponse<CompetencyTypeListDto>>(`${API}/${id}`, body);
  }

  setStatus(id: string, body: SetStatusRequest): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${API}/${id}/status`, body);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/${id}`);
  }
}
