import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse } from '../../models/api-response';
import type { PagedResult } from '../../models/api-response';
import type { ImpactComparisonDto, ImpactMeasurementListDto, ImpactMeasurementDto, ImpactSummaryDto } from './impact-api.models';

const API = `${appConfig.apiUrl}/api/impact-measurements`;

@Injectable({ providedIn: 'root' })
export class ImpactApiService {
  constructor(private http: HttpClient) {}

  getPaged(params: { page?: number; pageSize?: number; programId?: string; employeeId?: string; fromDate?: string; toDate?: string }): Observable<ApiResponse<PagedResult<ImpactMeasurementListDto>>> {
    let p = new HttpParams();
    if (params.page != null) p = p.set('page', params.page.toString());
    if (params.pageSize != null) p = p.set('pageSize', params.pageSize.toString());
    if (params.programId) p = p.set('programId', params.programId);
    if (params.employeeId) p = p.set('employeeId', params.employeeId);
    if (params.fromDate) p = p.set('fromDate', params.fromDate);
    if (params.toDate) p = p.set('toDate', params.toDate);
    return this.http.get<ApiResponse<PagedResult<ImpactMeasurementListDto>>>(API, { params: p });
  }

  getSummary(params: { programId?: string; employeeId?: string; fromDate?: string; toDate?: string }): Observable<ApiResponse<ImpactSummaryDto>> {
    let p = new HttpParams();
    if (params.programId) p = p.set('programId', params.programId);
    if (params.employeeId) p = p.set('employeeId', params.employeeId);
    if (params.fromDate) p = p.set('fromDate', params.fromDate);
    if (params.toDate) p = p.set('toDate', params.toDate);
    return this.http.get<ApiResponse<ImpactSummaryDto>>(`${API}/summary`, { params: p });
  }

  getComparison(params: { programId?: string; employeeId?: string }): Observable<ApiResponse<ImpactComparisonDto>> {
    let p = new HttpParams();
    if (params.programId) p = p.set('programId', params.programId);
    if (params.employeeId) p = p.set('employeeId', params.employeeId);
    return this.http.get<ApiResponse<ImpactComparisonDto>>(`${API}/comparison`, { params: p });
  }

  getById(id: string): Observable<ApiResponse<ImpactMeasurementDto | null>> {
    return this.http.get<ApiResponse<ImpactMeasurementDto | null>>(`${API}/${id}`);
  }

  create(body: { trainingProgramId?: string; employeeId?: string; productivityScore?: number; performanceImprovement?: number; managerFeedback?: string; measuredAt: string; notes?: string }): Observable<ApiResponse<ImpactMeasurementDto>> {
    return this.http.post<ApiResponse<ImpactMeasurementDto>>(API, body);
  }

  update(id: string, body: { id: string; trainingProgramId?: string; employeeId?: string; productivityScore?: number; performanceImprovement?: number; managerFeedback?: string; measuredAt: string; notes?: string }): Observable<ApiResponse<ImpactMeasurementDto>> {
    return this.http.put<ApiResponse<ImpactMeasurementDto>>(`${API}/${id}`, body);
  }
}
