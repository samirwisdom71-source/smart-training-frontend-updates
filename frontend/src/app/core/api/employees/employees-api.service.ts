import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult, PagedParams } from '../../models/api-response';
import type { EmployeeListDto, EmployeeDto, CreateEmployeeRequest, UpdateEmployeeRequest, SetEmployeeStatusRequest } from './employees-api.models';

const API = `${appConfig.apiUrl}/api/employees`;

@Injectable({ providedIn: 'root' })
export class EmployeesApiService {
  constructor(private http: HttpClient) {}

  getPaged(params: PagedParams & { organizationalUnitId?: string; jobId?: string; status?: string }): Observable<ApiResponse<PagedResult<EmployeeListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 10));
    if (params.search) p = p.set('search', params.search);
    if (params.sortBy) p = p.set('sortBy', params.sortBy);
    if (params.sortDescending !== undefined) p = p.set('sortDescending', String(params.sortDescending));
    if (params.organizationalUnitId) p = p.set('organizationalUnitId', params.organizationalUnitId);
    if (params.jobId) p = p.set('jobId', params.jobId);
    if (params.status) p = p.set('status', params.status);
    return this.http.get<ApiResponse<PagedResult<EmployeeListDto>>>(API, { params: p });
  }

  getById(id: string): Observable<ApiResponse<EmployeeDto>> {
    return this.http.get<ApiResponse<EmployeeDto>>(`${API}/${id}`);
  }

  getMySubordinates(): Observable<ApiResponse<EmployeeListDto[]>> {
    return this.http.get<ApiResponse<EmployeeListDto[]>>(`${API}/my-subordinates`);
  }

  create(body: CreateEmployeeRequest): Observable<ApiResponse<EmployeeListDto>> {
    return this.http.post<ApiResponse<EmployeeListDto>>(API, body);
  }

  update(id: string, body: UpdateEmployeeRequest): Observable<ApiResponse<EmployeeListDto>> {
    return this.http.put<ApiResponse<EmployeeListDto>>(`${API}/${id}`, body);
  }

  setStatus(id: string, body: SetEmployeeStatusRequest): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${API}/${id}/status`, body);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/${id}`);
  }
}
