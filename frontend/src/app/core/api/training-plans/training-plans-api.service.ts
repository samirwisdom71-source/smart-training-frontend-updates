import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult, PagedParams } from '../../models/api-response';
import type {
  AnnualTrainingPlanListDto,
  AnnualTrainingPlanDto,
  CreateAnnualTrainingPlanRequest,
  UpdateAnnualTrainingPlanRequest,
  AddTrainingPlanItemRequest,
  UpdateTrainingPlanItemRequest,
} from './training-plans-api.models';

const API = `${appConfig.apiUrl}/api/training-plans`;

@Injectable({ providedIn: 'root' })
export class TrainingPlansApiService {
  constructor(private http: HttpClient) {}

  getPaged(
    params: PagedParams & { organizationId?: string; year?: number; status?: string }
  ): Observable<ApiResponse<PagedResult<AnnualTrainingPlanListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 20));
    if (params.organizationId) p = p.set('organizationId', params.organizationId);
    if (params.year != null) p = p.set('year', String(params.year));
    if (params.status) p = p.set('status', params.status);
    if (params.search) p = p.set('search', params.search);
    return this.http.get<ApiResponse<PagedResult<AnnualTrainingPlanListDto>>>(API, { params: p });
  }

  getById(id: string): Observable<ApiResponse<AnnualTrainingPlanDto>> {
    return this.http.get<ApiResponse<AnnualTrainingPlanDto>>(`${API}/${id}`);
  }

  create(body: CreateAnnualTrainingPlanRequest): Observable<ApiResponse<AnnualTrainingPlanDto>> {
    return this.http.post<ApiResponse<AnnualTrainingPlanDto>>(API, body);
  }

  update(id: string, body: UpdateAnnualTrainingPlanRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/${id}`, body);
  }

  submit(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/${id}/submit`, {});
  }

  approve(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/${id}/approve`, {});
  }

  reject(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/${id}/reject`, {});
  }

  addItem(planId: string, body: AddTrainingPlanItemRequest): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${API}/${planId}/items`, body);
  }

  updateItem(planId: string, itemId: string, body: UpdateTrainingPlanItemRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/${planId}/items/${itemId}`, body);
  }

  removeItem(planId: string, itemId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/${planId}/items/${itemId}`);
  }

  deletePlan(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/${id}`);
  }
}
