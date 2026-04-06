import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult, PagedParams } from '../../models/api-response';
import type { PositionListDto, PositionDto, CreatePositionRequest, UpdatePositionRequest, SetStatusRequest } from './positions-api.models';

const API = `${appConfig.apiUrl}/api/positions`;

@Injectable({ providedIn: 'root' })
export class PositionsApiService {
  constructor(private http: HttpClient) {}

  getPaged(params: PagedParams & { organizationalUnitId?: string; jobId?: string; isActive?: boolean }): Observable<ApiResponse<PagedResult<PositionListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 10));
    if (params.search) p = p.set('search', params.search);
    if (params.sortBy) p = p.set('sortBy', params.sortBy);
    if (params.sortDescending !== undefined) p = p.set('sortDescending', String(params.sortDescending));
    if (params.organizationalUnitId) p = p.set('organizationalUnitId', params.organizationalUnitId);
    if (params.jobId) p = p.set('jobId', params.jobId);
    if (params.isActive !== undefined) p = p.set('isActive', String(params.isActive));
    return this.http.get<ApiResponse<PagedResult<PositionListDto>>>(API, { params: p });
  }

  getByOrganizationalUnit(organizationalUnitId: string): Observable<ApiResponse<PositionListDto[]>> {
    return this.http.get<ApiResponse<PositionListDto[]>>(`${API}/by-organization-unit/${organizationalUnitId}`);
  }

  getByJob(jobId: string): Observable<ApiResponse<PositionListDto[]>> {
    return this.http.get<ApiResponse<PositionListDto[]>>(`${API}/by-job/${jobId}`);
  }

  getById(id: string): Observable<ApiResponse<PositionDto>> {
    return this.http.get<ApiResponse<PositionDto>>(`${API}/${id}`);
  }

  create(body: CreatePositionRequest): Observable<ApiResponse<PositionListDto>> {
    return this.http.post<ApiResponse<PositionListDto>>(API, body);
  }

  update(id: string, body: UpdatePositionRequest): Observable<ApiResponse<PositionListDto>> {
    return this.http.put<ApiResponse<PositionListDto>>(`${API}/${id}`, body);
  }

  setStatus(id: string, body: SetStatusRequest): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${API}/${id}/status`, body);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/${id}`);
  }
}
