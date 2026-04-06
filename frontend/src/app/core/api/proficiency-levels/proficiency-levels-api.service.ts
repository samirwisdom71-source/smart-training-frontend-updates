import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult, PagedParams } from '../../models/api-response';
import type { ProficiencyLevelListDto, ProficiencyLevelDto, CreateProficiencyLevelRequest, UpdateProficiencyLevelRequest, SetStatusRequest } from './proficiency-levels-api.models';

const API = `${appConfig.apiUrl}/api/proficiency-levels`;

@Injectable({ providedIn: 'root' })
export class ProficiencyLevelsApiService {
  constructor(private http: HttpClient) {}

  getPaged(params: PagedParams & { frameworkId?: string; isActive?: boolean }): Observable<ApiResponse<PagedResult<ProficiencyLevelListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 10));
    if (params.search) p = p.set('search', params.search);
    if (params.sortBy) p = p.set('sortBy', params.sortBy);
    if (params.sortDescending !== undefined) p = p.set('sortDescending', String(params.sortDescending));
    if (params.frameworkId) p = p.set('frameworkId', params.frameworkId);
    if (params.isActive !== undefined) p = p.set('isActive', String(params.isActive));
    return this.http.get<ApiResponse<PagedResult<ProficiencyLevelListDto>>>(API, { params: p });
  }

  getById(id: string): Observable<ApiResponse<ProficiencyLevelDto>> {
    return this.http.get<ApiResponse<ProficiencyLevelDto>>(`${API}/${id}`);
  }

  create(body: CreateProficiencyLevelRequest): Observable<ApiResponse<ProficiencyLevelListDto>> {
    return this.http.post<ApiResponse<ProficiencyLevelListDto>>(API, body);
  }

  update(id: string, body: UpdateProficiencyLevelRequest): Observable<ApiResponse<ProficiencyLevelListDto>> {
    return this.http.put<ApiResponse<ProficiencyLevelListDto>>(`${API}/${id}`, body);
  }

  setStatus(id: string, body: SetStatusRequest): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${API}/${id}/status`, body);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/${id}`);
  }
}
