import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult, PagedParams } from '../../models/api-response';
import type { JobCompetencyMappingListDto, JobCompetencyMappingDto, CreateJobCompetencyMappingRequest, UpdateJobCompetencyMappingRequest, SetStatusRequest } from './job-competency-mappings-api.models';

const API = `${appConfig.apiUrl}/api/job-competency-mappings`;

@Injectable({ providedIn: 'root' })
export class JobCompetencyMappingsApiService {
  constructor(private http: HttpClient) {}

  getPaged(params: PagedParams & { jobId?: string; competencyId?: string; frameworkId?: string }): Observable<ApiResponse<PagedResult<JobCompetencyMappingListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 10));
    if (params.search) p = p.set('search', params.search);
    if (params.sortBy) p = p.set('sortBy', params.sortBy);
    if (params.sortDescending !== undefined) p = p.set('sortDescending', String(params.sortDescending));
    if (params.jobId) p = p.set('jobId', params.jobId);
    if (params.competencyId) p = p.set('competencyId', params.competencyId);
    if (params.frameworkId) p = p.set('frameworkId', params.frameworkId);
    return this.http.get<ApiResponse<PagedResult<JobCompetencyMappingListDto>>>(API, { params: p });
  }

  getByJob(jobId: string): Observable<ApiResponse<JobCompetencyMappingListDto[]>> {
    return this.http.get<ApiResponse<JobCompetencyMappingListDto[]>>(`${API}/by-job/${jobId}`);
  }

  getByCompetency(competencyId: string): Observable<ApiResponse<JobCompetencyMappingListDto[]>> {
    return this.http.get<ApiResponse<JobCompetencyMappingListDto[]>>(`${API}/by-competency/${competencyId}`);
  }

  getById(id: string): Observable<ApiResponse<JobCompetencyMappingDto>> {
    return this.http.get<ApiResponse<JobCompetencyMappingDto>>(`${API}/${id}`);
  }

  create(body: CreateJobCompetencyMappingRequest): Observable<ApiResponse<JobCompetencyMappingListDto>> {
    return this.http.post<ApiResponse<JobCompetencyMappingListDto>>(API, body);
  }

  update(id: string, body: UpdateJobCompetencyMappingRequest): Observable<ApiResponse<JobCompetencyMappingListDto>> {
    return this.http.put<ApiResponse<JobCompetencyMappingListDto>>(`${API}/${id}`, body);
  }

  setStatus(id: string, body: SetStatusRequest): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${API}/${id}/status`, body);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/${id}`);
  }
}
