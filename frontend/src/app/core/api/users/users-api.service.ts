import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult, PagedParams } from '../../models/api-response';
import type { UserDto, CreateUserRequest, UpdateUserRequest } from './users-api.models';

const API = `${appConfig.apiUrl}/api/users`;

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  constructor(private http: HttpClient) {}

  getPaged(params: PagedParams): Observable<ApiResponse<PagedResult<UserDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 10));
    if (params.search) p = p.set('search', params.search);
    if (params.sortBy) p = p.set('sortBy', params.sortBy);
    if (params.sortDescending !== undefined) p = p.set('sortDescending', String(params.sortDescending));
    return this.http.get<ApiResponse<PagedResult<UserDto>>>(API, { params: p });
  }

  getById(id: string): Observable<ApiResponse<UserDto>> {
    return this.http.get<ApiResponse<UserDto>>(`${API}/${id}`);
  }

  create(body: CreateUserRequest): Observable<ApiResponse<UserDto>> {
    return this.http.post<ApiResponse<UserDto>>(API, body);
  }

  update(id: string, body: UpdateUserRequest): Observable<ApiResponse<UserDto>> {
    return this.http.put<ApiResponse<UserDto>>(`${API}/${id}`, body);
  }

  setManager(userId: string, managerUserId: string | null): Observable<ApiResponse<UserDto>> {
    return this.http.put<ApiResponse<UserDto>>(`${API}/${userId}/manager`, { managerUserId });
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/${id}`);
  }
}
