import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse } from '../../models/api-response';
import type { PagedResult } from '../../models/api-response';
import type {
  KnowledgeAssetListDto,
  KnowledgeAssetDto,
  KnowledgeTransferListDto,
  KnowledgeTransferDto,
  InternalExpertListDto,
  InternalExpertDto,
} from './knowledge-api.models';

const ASSETS = `${appConfig.apiUrl}/api/knowledge-assets`;
const TRANSFER = `${appConfig.apiUrl}/api/knowledge-transfer`;
const EXPERTS = `${appConfig.apiUrl}/api/internal-experts`;

@Injectable({ providedIn: 'root' })
export class KnowledgeApiService {
  constructor(private http: HttpClient) {}

  getAssetsPaged(params: { page?: number; pageSize?: number; category?: string; search?: string; tag?: string; isActive?: boolean }): Observable<ApiResponse<PagedResult<KnowledgeAssetListDto>>> {
    let p = new HttpParams();
    if (params.page != null) p = p.set('page', params.page.toString());
    if (params.pageSize != null) p = p.set('pageSize', params.pageSize.toString());
    if (params.category) p = p.set('category', params.category);
    if (params.search) p = p.set('search', params.search);
    if (params.tag) p = p.set('tag', params.tag);
    if (params.isActive != null) p = p.set('isActive', params.isActive.toString());
    return this.http.get<ApiResponse<PagedResult<KnowledgeAssetListDto>>>(ASSETS, { params: p });
  }

  getAssetById(id: string): Observable<ApiResponse<KnowledgeAssetDto | null>> {
    return this.http.get<ApiResponse<KnowledgeAssetDto | null>>(`${ASSETS}/${id}`);
  }

  createAsset(body: Partial<KnowledgeAssetDto> & { titleEn: string; titleAr: string }): Observable<ApiResponse<KnowledgeAssetDto>> {
    return this.http.post<ApiResponse<KnowledgeAssetDto>>(ASSETS, body);
  }

  /** Multipart create: titleEn, titleAr, optional descriptionEn/Ar, category, tags, file */
  createAssetWithFile(formData: FormData): Observable<ApiResponse<KnowledgeAssetDto>> {
    return this.http.post<ApiResponse<KnowledgeAssetDto>>(`${ASSETS}/with-file`, formData);
  }

  /** Replace stored file (multipart field name: file). */
  uploadKnowledgeAssetFile(id: string, file: File): Observable<ApiResponse<KnowledgeAssetDto>> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.http.post<ApiResponse<KnowledgeAssetDto>>(`${ASSETS}/${id}/file`, fd);
  }

  updateAsset(
    id: string,
    body: Partial<KnowledgeAssetDto> & {
      titleEn: string;
      titleAr: string;
      isActive: boolean;
    },
  ): Observable<ApiResponse<KnowledgeAssetDto>> {
    return this.http.put<ApiResponse<KnowledgeAssetDto>>(`${ASSETS}/${id}`, { ...body, id });
  }

  deleteAsset(id: string): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${ASSETS}/${id}`);
  }

  getTransferPaged(params: { page?: number; pageSize?: number; fromEmployeeId?: string; toEmployeeId?: string; status?: string; search?: string }): Observable<ApiResponse<PagedResult<KnowledgeTransferListDto>>> {
    let p = new HttpParams();
    if (params.page != null) p = p.set('page', params.page.toString());
    if (params.pageSize != null) p = p.set('pageSize', params.pageSize.toString());
    if (params.fromEmployeeId) p = p.set('fromEmployeeId', params.fromEmployeeId);
    if (params.toEmployeeId) p = p.set('toEmployeeId', params.toEmployeeId);
    if (params.status) p = p.set('status', params.status);
    if (params.search) p = p.set('search', params.search);
    return this.http.get<ApiResponse<PagedResult<KnowledgeTransferListDto>>>(TRANSFER, { params: p });
  }

  getTransferById(id: string): Observable<ApiResponse<KnowledgeTransferDto | null>> {
    return this.http.get<ApiResponse<KnowledgeTransferDto | null>>(`${TRANSFER}/${id}`);
  }

  createTransfer(body: Partial<KnowledgeTransferDto> & { titleEn: string; titleAr: string }): Observable<ApiResponse<KnowledgeTransferDto>> {
    return this.http.post<ApiResponse<KnowledgeTransferDto>>(TRANSFER, body);
  }

  updateTransfer(id: string, body: Partial<KnowledgeTransferDto> & { titleEn: string; titleAr: string }): Observable<ApiResponse<KnowledgeTransferDto>> {
    return this.http.put<ApiResponse<KnowledgeTransferDto>>(`${TRANSFER}/${id}`, { ...body, id });
  }

  deleteTransfer(id: string): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${TRANSFER}/${id}`);
  }

  getExpertsPaged(params: { page?: number; pageSize?: number; employeeId?: string; competencyId?: string; organizationalUnitId?: string; search?: string; isActive?: boolean }): Observable<ApiResponse<PagedResult<InternalExpertListDto>>> {
    let p = new HttpParams();
    if (params.page != null) p = p.set('page', params.page.toString());
    if (params.pageSize != null) p = p.set('pageSize', params.pageSize.toString());
    if (params.employeeId) p = p.set('employeeId', params.employeeId);
    if (params.competencyId) p = p.set('competencyId', params.competencyId);
    if (params.organizationalUnitId) p = p.set('organizationalUnitId', params.organizationalUnitId);
    if (params.search) p = p.set('search', params.search);
    if (params.isActive != null) p = p.set('isActive', params.isActive.toString());
    return this.http.get<ApiResponse<PagedResult<InternalExpertListDto>>>(EXPERTS, { params: p });
  }

  getExpertById(id: string): Observable<ApiResponse<InternalExpertDto | null>> {
    return this.http.get<ApiResponse<InternalExpertDto | null>>(`${EXPERTS}/${id}`);
  }

  createExpert(body: {
    employeeId: string;
    competencyIds?: string[];
    organizationalUnitId?: string;
    areaOfExpertiseEn?: string;
    areaOfExpertiseAr?: string;
    notes?: string;
  }): Observable<ApiResponse<InternalExpertDto>> {
    return this.http.post<ApiResponse<InternalExpertDto>>(EXPERTS, body);
  }

  updateExpert(
    id: string,
    body: {
      id: string;
      employeeId: string;
      competencyIds?: string[];
      organizationalUnitId?: string;
      areaOfExpertiseEn?: string;
      areaOfExpertiseAr?: string;
      notes?: string;
      isActive: boolean;
    },
  ): Observable<ApiResponse<InternalExpertDto>> {
    return this.http.put<ApiResponse<InternalExpertDto>>(`${EXPERTS}/${id}`, body);
  }

  deleteExpert(id: string): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${EXPERTS}/${id}`);
  }
}
