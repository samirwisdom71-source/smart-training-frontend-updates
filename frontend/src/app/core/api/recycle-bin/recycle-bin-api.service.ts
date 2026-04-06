import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult } from '../../models/api-response';
import type { RecycleBinItemDto, RecycleBinListParams } from './recycle-bin-api.models';

const API = `${appConfig.apiUrl}/api/recycle-bin`;
const BASE = appConfig.apiUrl;

@Injectable({ providedIn: 'root' })
export class RecycleBinApiService {
  constructor(private http: HttpClient) {}

  getPaged(params: RecycleBinListParams): Observable<ApiResponse<PagedResult<RecycleBinItemDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 20));
    if (params.moduleKey) p = p.set('moduleKey', params.moduleKey);
    if (params.search) p = p.set('search', params.search);
    if (params.fromDate) p = p.set('fromDate', params.fromDate);
    if (params.toDate) p = p.set('toDate', params.toDate);
    return this.http.get<ApiResponse<PagedResult<RecycleBinItemDto>>>(API, { params: p });
  }

  /**
   * Restore a soft-deleted entity by calling the resource-specific restore endpoint.
   * Uses moduleKey and optional relatedId to build the correct URL.
   */
  restore(item: RecycleBinItemDto): Observable<ApiResponse<void>> {
    const url = this.getRestoreUrl(item);
    if (!url) return throwError(() => new Error('Cannot restore: missing parent context'));
    return this.http.post<ApiResponse<void>>(url, {});
  }

  private getRestoreUrl(item: RecycleBinItemDto): string {
    const id = item.entityId;
    const relatedId = item.relatedId;
    switch (item.moduleKey) {
      case 'Organization': return `${BASE}/api/organizations/${id}/restore`;
      case 'OrganizationalUnit': return `${BASE}/api/organizational-units/${id}/restore`;
      case 'Job': return `${BASE}/api/jobs/${id}/restore`;
      case 'Position': return `${BASE}/api/positions/${id}/restore`;
      case 'CompetencyFramework': return `${BASE}/api/competency-frameworks/${id}/restore`;
      case 'CompetencyType': return `${BASE}/api/competency-types/${id}/restore`;
      case 'Competency': return `${BASE}/api/competencies/${id}/restore`;
      case 'ProficiencyLevel': return `${BASE}/api/proficiency-levels/${id}/restore`;
      case 'JobCompetencyMapping': return `${BASE}/api/job-competency-mappings/${id}/restore`;
      case 'TrainingNeed': return `${BASE}/api/training-needs/${id}/restore`;
      case 'AnnualTrainingPlan': return `${BASE}/api/training-plans/${id}/restore`;
      case 'TrainingPlanItem': return relatedId ? `${BASE}/api/training-plans/${relatedId}/items/${id}/restore` : '';
      case 'TrainingProgram': return `${BASE}/api/training-programs/${id}/restore`;
      case 'TrainingSession': return relatedId ? `${BASE}/api/training-programs/${relatedId}/sessions/${id}/restore` : '';
      case 'KnowledgeAsset': return `${BASE}/api/knowledge-assets/${id}/restore`;
      case 'KnowledgeTransferRecord': return `${BASE}/api/knowledge-transfer/${id}/restore`;
      case 'InternalExpert': return `${BASE}/api/internal-experts/${id}/restore`;
      default: return '';
    }
  }
}
