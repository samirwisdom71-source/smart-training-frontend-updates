import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse } from '../../models/api-response';
import type {
  ProgramEvaluationDto,
  ProgramEvaluationSummaryDto,
  SubmitProgramEvaluationRequest,
} from './program-evaluations-api.models';

const API = `${appConfig.apiUrl}/api/program-evaluations`;

@Injectable({ providedIn: 'root' })
export class ProgramEvaluationsApiService {
  constructor(private http: HttpClient) {}

  submit(body: SubmitProgramEvaluationRequest): Observable<ApiResponse<void>> {
    const form = new FormData();
    form.append('trainingProgramId', body.trainingProgramId);
    form.append('employeeId', body.employeeId);
    form.append('contentScore', String(body.contentScore));
    form.append('trainerScore', String(body.trainerScore));
    form.append('organizationScore', String(body.organizationScore));
    form.append('usefulnessScore', String(body.usefulnessScore));
    if (body.comments?.trim()) form.append('comments', body.comments.trim());
    if (body.file) form.append('file', body.file, body.file.name);
    return this.http.post<ApiResponse<void>>(API, form);
  }

  getByProgram(programId: string): Observable<ApiResponse<ProgramEvaluationDto[]>> {
    return this.http.get<ApiResponse<ProgramEvaluationDto[]>>(`${API}/by-program/${programId}`);
  }

  getSummary(programId: string): Observable<ApiResponse<ProgramEvaluationSummaryDto>> {
    return this.http.get<ApiResponse<ProgramEvaluationSummaryDto>>(`${API}/summary/${programId}`);
  }

  fileUrl(relativePath: string): string {
    const p = (relativePath ?? '').replace(/^\/+/, '');
    return `${appConfig.apiUrl}/files/${p}`;
  }
}
