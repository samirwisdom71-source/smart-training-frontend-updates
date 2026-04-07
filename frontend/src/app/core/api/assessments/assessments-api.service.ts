import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult, PagedParams } from '../../models/api-response';
import type {
  AssessmentCycleListDto,
  AssessmentCycleDto,
  CreateAssessmentCycleRequest,
  UpdateAssessmentCycleRequest,
  ChangeAssessmentCycleStatusRequest,
  AssessmentCycleScopeSummaryDto,
  AddScopeOrganizationalUnitsRequest,
  AddScopeJobsRequest,
  AddScopeEmployeesRequest,
  AssessmentGenerationResultDto,
  AssessmentSummaryDto,
  AssessmentDto,
  SaveSelfAssessmentRequest,
  SaveManagerReviewRequest,
  AssessmentResultListDto,
  CompetencyGapListDto,
} from './assessments-api.models';

const CYCLES_API = `${appConfig.apiUrl}/api/assessment-cycles`;
const MY_API = `${appConfig.apiUrl}/api/my-assessments`;
const MANAGER_API = `${appConfig.apiUrl}/api/manager-assessments`;
const RESULTS_API = `${appConfig.apiUrl}/api/assessment-results`;
const GAPS_API = `${appConfig.apiUrl}/api/competency-gaps`;

@Injectable({ providedIn: 'root' })
export class AssessmentsApiService {
  constructor(private http: HttpClient) {}

  getCyclesPaged(params: PagedParams & { organizationId?: string; status?: string; startFrom?: string; endTo?: string }): Observable<ApiResponse<PagedResult<AssessmentCycleListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 10));
    if (params.search) p = p.set('search', params.search);
    if (params.sortBy) p = p.set('sortBy', params.sortBy);
    if (params.sortDescending !== undefined) p = p.set('sortDescending', String(params.sortDescending));
    if (params.organizationId) p = p.set('organizationId', params.organizationId);
    if (params.status) p = p.set('status', params.status);
    if (params.startFrom) p = p.set('startFrom', params.startFrom);
    if (params.endTo) p = p.set('endTo', params.endTo);
    return this.http.get<ApiResponse<PagedResult<AssessmentCycleListDto>>>(CYCLES_API, { params: p });
  }

  getCycleById(id: string): Observable<ApiResponse<AssessmentCycleDto>> {
    return this.http.get<ApiResponse<AssessmentCycleDto>>(`${CYCLES_API}/${id}`);
  }

  createCycle(body: CreateAssessmentCycleRequest): Observable<ApiResponse<AssessmentCycleListDto>> {
    return this.http.post<ApiResponse<AssessmentCycleListDto>>(CYCLES_API, body);
  }

  updateCycle(id: string, body: UpdateAssessmentCycleRequest): Observable<ApiResponse<AssessmentCycleListDto>> {
    return this.http.put<ApiResponse<AssessmentCycleListDto>>(`${CYCLES_API}/${id}`, body);
  }

  changeCycleStatus(id: string, body: ChangeAssessmentCycleStatusRequest): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${CYCLES_API}/${id}/status`, body);
  }

  getCycleScope(cycleId: string): Observable<ApiResponse<AssessmentCycleScopeSummaryDto>> {
    return this.http.get<ApiResponse<AssessmentCycleScopeSummaryDto>>(`${CYCLES_API}/${cycleId}/scope`);
  }

  addScopeOrganizationalUnits(cycleId: string, body: AddScopeOrganizationalUnitsRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${CYCLES_API}/${cycleId}/scope/organizational-units`, body);
  }

  removeScopeOrganizationalUnit(cycleId: string, ouId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${CYCLES_API}/${cycleId}/scope/organizational-units/${ouId}`);
  }

  addScopeJobs(cycleId: string, body: AddScopeJobsRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${CYCLES_API}/${cycleId}/scope/jobs`, body);
  }

  removeScopeJob(cycleId: string, jobId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${CYCLES_API}/${cycleId}/scope/jobs/${jobId}`);
  }

  addScopeEmployees(cycleId: string, body: AddScopeEmployeesRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${CYCLES_API}/${cycleId}/scope/employees`, body);
  }

  removeScopeEmployee(cycleId: string, employeeId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${CYCLES_API}/${cycleId}/scope/employees/${employeeId}`);
  }

  generateAssessmentsForCycle(cycleId: string): Observable<ApiResponse<AssessmentGenerationResultDto>> {
    return this.http.post<ApiResponse<AssessmentGenerationResultDto>>(`${CYCLES_API}/${cycleId}/generate-assessments`, {});
  }

  getMyAssessments(): Observable<ApiResponse<AssessmentSummaryDto[]>> {
    return this.http.get<ApiResponse<AssessmentSummaryDto[]>>(MY_API);
  }

  getMyAssessmentById(id: string): Observable<ApiResponse<AssessmentDto>> {
    return this.http.get<ApiResponse<AssessmentDto>>(`${MY_API}/${id}`);
  }

  saveSelfAssessment(id: string, body: SaveSelfAssessmentRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${MY_API}/${id}/self`, body);
  }

  submitSelfAssessment(id: string, body?: SaveSelfAssessmentRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${MY_API}/${id}/self-submit`, body ?? {});
  }

  getPendingManagerReviews(): Observable<ApiResponse<AssessmentSummaryDto[]>> {
    return this.http.get<ApiResponse<AssessmentSummaryDto[]>>(`${MANAGER_API}/pending`);
  }

  getAssessmentForReview(id: string): Observable<ApiResponse<AssessmentDto>> {
    return this.http.get<ApiResponse<AssessmentDto>>(`${MANAGER_API}/${id}`);
  }

  saveManagerReview(id: string, body: SaveManagerReviewRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${MANAGER_API}/${id}/manager`, body);
  }

  completeManagerReview(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${MANAGER_API}/${id}/manager-complete`, {});
  }

  getAssessmentResultsPaged(params: PagedParams & { cycleId?: string; employeeId?: string; orgUnitId?: string; jobId?: string; status?: string }): Observable<ApiResponse<PagedResult<AssessmentResultListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 10));
    if (params.cycleId) p = p.set('cycleId', params.cycleId);
    if (params.employeeId) p = p.set('employeeId', params.employeeId);
    if (params.orgUnitId) p = p.set('orgUnitId', params.orgUnitId);
    if (params.jobId) p = p.set('jobId', params.jobId);
    if (params.status) p = p.set('status', params.status);
    return this.http.get<ApiResponse<PagedResult<AssessmentResultListDto>>>(RESULTS_API, { params: p });
  }

  getGapsPaged(params: PagedParams & { cycleId?: string; employeeId?: string; orgUnitId?: string; jobId?: string; severity?: string; search?: string }): Observable<ApiResponse<PagedResult<CompetencyGapListDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 10));
    if (params.search) p = p.set('search', params.search);
    if (params.cycleId) p = p.set('cycleId', params.cycleId);
    if (params.employeeId) p = p.set('employeeId', params.employeeId);
    if (params.orgUnitId) p = p.set('orgUnitId', params.orgUnitId);
    if (params.jobId) p = p.set('jobId', params.jobId);
    if (params.severity) p = p.set('severity', params.severity);
    return this.http.get<ApiResponse<PagedResult<CompetencyGapListDto>>>(GAPS_API, { params: p });
  }
}

