import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult, PagedParams } from '../../models/api-response';
import type { CompetencyListDto, CompetencyDto, CreateCompetencyRequest, UpdateCompetencyRequest, SetStatusRequest } from './competencies-api.models';

const API = `${appConfig.apiUrl}/api/competencies`;

@Injectable({ providedIn: 'root' })
export class CompetenciesApiService {
  constructor(private http: HttpClient) {}

  getPaged(params: PagedParams & { frameworkId?: string; competencyTypeId?: string; isActive?: boolean }): Observable<ApiResponse<PagedResult<CompetencyListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 10));
    if (params.search) p = p.set('search', params.search);
    if (params.sortBy) p = p.set('sortBy', params.sortBy);
    if (params.sortDescending !== undefined) p = p.set('sortDescending', String(params.sortDescending));
    if (params.frameworkId) p = p.set('frameworkId', params.frameworkId);
    if (params.competencyTypeId) p = p.set('competencyTypeId', params.competencyTypeId);
    if (params.isActive !== undefined) p = p.set('isActive', String(params.isActive));
    return this.http.get<ApiResponse<PagedResult<CompetencyListDto>>>(API, { params: p });
  }

  getById(id: string): Observable<ApiResponse<CompetencyDto>> {
    return this.http.get<ApiResponse<CompetencyDto>>(`${API}/${id}`);
  }

  create(body: CreateCompetencyRequest): Observable<ApiResponse<CompetencyListDto>> {
    return this.http.post<ApiResponse<CompetencyListDto>>(API, body);
  }

  update(id: string, body: UpdateCompetencyRequest): Observable<ApiResponse<CompetencyListDto>> {
    return this.http.put<ApiResponse<CompetencyListDto>>(`${API}/${id}`, body);
  }

  setStatus(id: string, body: SetStatusRequest): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${API}/${id}/status`, body);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/${id}`);
  }
}
