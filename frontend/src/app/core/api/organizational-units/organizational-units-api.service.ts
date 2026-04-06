import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult, PagedParams } from '../../models/api-response';
import type {
  OrganizationalUnitListDto,
  OrganizationalUnitDto,
  OrganizationalUnitTreeNodeDto,
  CreateOrganizationalUnitRequest,
  UpdateOrganizationalUnitRequest,
  SetStatusRequest,
} from './organizational-units-api.models';

const API = `${appConfig.apiUrl}/api/organizational-units`;

@Injectable({ providedIn: 'root' })
export class OrganizationalUnitsApiService {
  constructor(private http: HttpClient) {}

  getPaged(params: PagedParams & { organizationId?: string; parentId?: string; isActive?: boolean; rootOnly?: boolean }): Observable<ApiResponse<PagedResult<OrganizationalUnitListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 10));
    if (params.organizationId) p = p.set('organizationId', params.organizationId);
    if (params.parentId) p = p.set('parentId', params.parentId);
    if (params.search) p = p.set('search', params.search);
    if (params.sortBy) p = p.set('sortBy', params.sortBy);
    if (params.sortDescending !== undefined) p = p.set('sortDescending', String(params.sortDescending));
    if (params.isActive !== undefined) p = p.set('isActive', String(params.isActive));
    if (params.rootOnly !== undefined) p = p.set('rootOnly', String(params.rootOnly));
    return this.http.get<ApiResponse<PagedResult<OrganizationalUnitListDto>>>(API, { params: p });
  }

  getTree(organizationId: string): Observable<ApiResponse<OrganizationalUnitTreeNodeDto[]>> {
    return this.http.get<ApiResponse<OrganizationalUnitTreeNodeDto[]>>(`${API}/tree/${organizationId}`);
  }

  getById(id: string): Observable<ApiResponse<OrganizationalUnitDto>> {
    return this.http.get<ApiResponse<OrganizationalUnitDto>>(`${API}/${id}`);
  }

  create(body: CreateOrganizationalUnitRequest): Observable<ApiResponse<OrganizationalUnitListDto>> {
    return this.http.post<ApiResponse<OrganizationalUnitListDto>>(API, body);
  }

  update(id: string, body: UpdateOrganizationalUnitRequest): Observable<ApiResponse<OrganizationalUnitListDto>> {
    return this.http.put<ApiResponse<OrganizationalUnitListDto>>(`${API}/${id}`, body);
  }

  setStatus(id: string, body: SetStatusRequest): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${API}/${id}/status`, body);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/${id}`);
  }
}
