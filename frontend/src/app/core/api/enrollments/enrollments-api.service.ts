import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult, PagedParams } from '../../models/api-response';
import type { EnrollmentListDto, NominateEnrollmentRequest, NominateEnrollmentsBulkRequest } from './enrollments-api.models';

const API = `${appConfig.apiUrl}/api/enrollments`;

@Injectable({ providedIn: 'root' })
export class EnrollmentsApiService {
  constructor(private http: HttpClient) {}

  getPaged(
    params: PagedParams & { programId?: string; employeeId?: string; status?: string }
  ): Observable<ApiResponse<PagedResult<EnrollmentListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 20));
    if (params.programId) p = p.set('programId', params.programId);
    if (params.employeeId) p = p.set('employeeId', params.employeeId);
    if (params.status) p = p.set('status', params.status);
    return this.http.get<ApiResponse<PagedResult<EnrollmentListDto>>>(API, { params: p });
  }

  getByProgram(programId: string): Observable<ApiResponse<EnrollmentListDto[]>> {
    return this.http.get<ApiResponse<EnrollmentListDto[]>>(`${API}/by-program/${programId}`);
  }

  getByEmployee(employeeId: string): Observable<ApiResponse<EnrollmentListDto[]>> {
    return this.http.get<ApiResponse<EnrollmentListDto[]>>(`${API}/by-employee/${employeeId}`);
  }

  nominate(body: NominateEnrollmentRequest): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${API}/nominate`, body);
  }

  nominateBulk(body: NominateEnrollmentsBulkRequest): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${API}/nominate-bulk`, body);
  }

  approve(id: string, notes?: string | null): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/${id}/approve`, JSON.stringify(notes ?? null), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  reject(id: string, notes?: string | null): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/${id}/reject`, JSON.stringify(notes ?? null), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  enroll(id: string, notes?: string | null): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/${id}/enroll`, JSON.stringify(notes ?? null), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  cancel(id: string, notes?: string | null): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/${id}/cancel`, JSON.stringify(notes ?? null), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  complete(id: string, notes?: string | null): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/${id}/complete`, JSON.stringify(notes ?? null), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  deleteEnrollment(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/${id}`);
  }
}
