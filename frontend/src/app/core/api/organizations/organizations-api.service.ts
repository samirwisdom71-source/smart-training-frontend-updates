import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult, PagedParams } from '../../models/api-response';
import type { OrganizationListDto, OrganizationDto, CreateOrganizationRequest, UpdateOrganizationRequest, SetStatusRequest } from './organizations-api.models';

const API = `${appConfig.apiUrl}/api/organizations`;

@Injectable({ providedIn: 'root' })
export class OrganizationsApiService {
  constructor(private http: HttpClient) {}

  getPaged(params: PagedParams & { isActive?: boolean }): Observable<ApiResponse<PagedResult<OrganizationListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 10));
    if (params.search) p = p.set('search', params.search);
    if (params.sortBy) p = p.set('sortBy', params.sortBy);
    if (params.sortDescending !== undefined) p = p.set('sortDescending', String(params.sortDescending));
    if (params.isActive !== undefined) p = p.set('isActive', String(params.isActive));
    return this.http.get<ApiResponse<PagedResult<OrganizationListDto>>>(API, { params: p });
  }

  getDefault(): Observable<ApiResponse<{ id: string | null }>> {
    return this.http.get<ApiResponse<{ id: string | null }>>(`${API}/default`);
  }

  setDefault(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/${id}/set-default`, {});
  }

  getById(id: string): Observable<ApiResponse<OrganizationDto>> {
    return this.http.get<ApiResponse<OrganizationDto>>(`${API}/${id}`);
  }

  create(body: CreateOrganizationRequest): Observable<ApiResponse<OrganizationListDto>> {
    return this.http.post<ApiResponse<OrganizationListDto>>(API, body);
  }

  update(id: string, body: UpdateOrganizationRequest): Observable<ApiResponse<OrganizationListDto>> {
    return this.http.put<ApiResponse<OrganizationListDto>>(`${API}/${id}`, body);
  }

  setStatus(id: string, body: SetStatusRequest): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${API}/${id}/status`, body);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/${id}`);
  }
}
