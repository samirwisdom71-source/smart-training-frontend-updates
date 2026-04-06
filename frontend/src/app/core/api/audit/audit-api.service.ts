import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse, PagedResult } from '../../models/api-response';
import type { AuditLogEntryViewDto, AuditListParams } from './audit-api.models';

const API = `${appConfig.apiUrl}/api/audit`;

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  constructor(private http: HttpClient) {}

  getPaged(params: AuditListParams): Observable<ApiResponse<PagedResult<AuditLogEntryViewDto>>> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 20));
    if (params.fromUtc) p = p.set('fromUtc', params.fromUtc);
    if (params.toUtc) p = p.set('toUtc', params.toUtc);
    if (params.moduleName) p = p.set('moduleName', params.moduleName);
    if (params.actionType) p = p.set('actionType', params.actionType);
    if (params.userId) p = p.set('userId', params.userId);
    if (params.success !== undefined) p = p.set('success', String(params.success));
    return this.http.get<ApiResponse<PagedResult<AuditLogEntryViewDto>>>(API, { params: p });
  }
}
