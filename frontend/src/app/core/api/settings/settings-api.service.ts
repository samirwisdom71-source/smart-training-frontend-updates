import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse } from '../../models/api-response';
import type { SystemSettingDto, SetSettingValueRequest } from './settings-api.models';

const API = `${appConfig.apiUrl}/api/settings`;

@Injectable({ providedIn: 'root' })
export class SettingsApiService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<SystemSettingDto[]>> {
    return this.http.get<ApiResponse<SystemSettingDto[]>>(API);
  }

  put(key: string, body: SetSettingValueRequest): Observable<void> {
    return this.http.put<void>(`${API}/${encodeURIComponent(key)}`, body);
  }
}
