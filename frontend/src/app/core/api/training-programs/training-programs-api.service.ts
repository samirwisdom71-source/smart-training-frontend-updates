import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult, PagedParams } from '../../models/api-response';
import type {
  TrainingProgramListDto,
  TrainingProgramDto,
  CreateTrainingProgramRequest,
  UpdateTrainingProgramRequest,
  CreateTrainingSessionRequest,
  UpdateTrainingSessionRequest,
  TrainingSessionDto,
} from './training-programs-api.models';

const API = `${appConfig.apiUrl}/api/training-programs`;

@Injectable({ providedIn: 'root' })
export class TrainingProgramsApiService {
  constructor(private http: HttpClient) {}

  getPaged(
    params: PagedParams & { organizationId?: string; competencyId?: string; status?: string }
  ): Observable<ApiResponse<PagedResult<TrainingProgramListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 20));
    if (params.organizationId) p = p.set('organizationId', params.organizationId);
    if (params.competencyId) p = p.set('competencyId', params.competencyId);
    if (params.status) p = p.set('status', params.status);
    if (params.search) p = p.set('search', params.search);
    return this.http.get<ApiResponse<PagedResult<TrainingProgramListDto>>>(API, { params: p });
  }

  getById(id: string): Observable<ApiResponse<TrainingProgramDto>> {
    return this.http.get<ApiResponse<TrainingProgramDto>>(`${API}/${id}`);
  }

  create(body: CreateTrainingProgramRequest): Observable<ApiResponse<TrainingProgramDto>> {
    return this.http.post<ApiResponse<TrainingProgramDto>>(API, body);
  }

  update(id: string, body: UpdateTrainingProgramRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/${id}`, body);
  }

  setStatus(id: string, newStatus: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/${id}/status`, JSON.stringify(newStatus), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  getSessions(programId: string): Observable<ApiResponse<TrainingSessionDto[]>> {
    return this.http.get<ApiResponse<TrainingSessionDto[]>>(`${API}/${programId}/sessions`);
  }

  createSession(programId: string, body: CreateTrainingSessionRequest): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${API}/${programId}/sessions`, body);
  }

  updateSession(programId: string, sessionId: string, body: UpdateTrainingSessionRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/${programId}/sessions/${sessionId}`, body);
  }

  uploadScientificMaterials(programId: string, file: File): Observable<ApiResponse<{ scientificMaterialsPath: string; url: string }>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<{ scientificMaterialsPath: string; url: string }>>(`${API}/${programId}/materials`, form);
  }

  fileUrl(relativePath: string): string {
    const p = (relativePath ?? '').replace(/^\/+/, '');
    return `${appConfig.apiUrl}/files/${p}`;
  }

  deleteProgram(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/${id}`);
  }

  deleteSession(programId: string, sessionId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${API}/${programId}/sessions/${sessionId}`);
  }
}
