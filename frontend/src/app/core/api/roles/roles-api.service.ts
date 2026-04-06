import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult, PagedParams } from '../../models/api-response';
import type { RoleDto, RoleListDto, CreateRoleRequest, UpdateRoleRequest, AssignPermissionsRequest, PermissionDto } from './roles-api.models';

const API = `${appConfig.apiUrl}/api/roles`;
const PERMISSIONS_API = `${appConfig.apiUrl}/api/permissions`;

@Injectable({ providedIn: 'root' })
export class RolesApiService {
  constructor(private http: HttpClient) {}

  getPaged(params: PagedParams): Observable<ApiResponse<PagedResult<RoleListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 10));
    if (params.search) p = p.set('search', params.search);
    if (params.sortBy) p = p.set('sortBy', params.sortBy);
    if (params.sortDescending !== undefined) p = p.set('sortDescending', String(params.sortDescending));
    return this.http.get<ApiResponse<PagedResult<RoleListDto>>>(API, { params: p });
  }

  getById(id: string): Observable<ApiResponse<RoleDto>> {
    return this.http.get<ApiResponse<RoleDto>>(`${API}/${id}`);
  }

  create(body: CreateRoleRequest): Observable<ApiResponse<RoleListDto>> {
    return this.http.post<ApiResponse<RoleListDto>>(API, body);
  }

  update(id: string, body: UpdateRoleRequest): Observable<ApiResponse<RoleListDto>> {
    return this.http.put<ApiResponse<RoleListDto>>(`${API}/${id}`, body);
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete(`${API}/${id}`);
  }

  assignPermissions(id: string, body: AssignPermissionsRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/${id}/permissions`, body);
  }

  getPermissions(): Observable<ApiResponse<PermissionDto[]>> {
    return this.http.get<ApiResponse<PermissionDto[]>>(PERMISSIONS_API);
  }
}
