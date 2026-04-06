import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse } from '../../models/api-response';
import type {
  ExecutiveDashboardDto,
  ManagerDashboardDto,
  EmployeeDashboardDto,
} from './dashboard-api.models';

const API = `${appConfig.apiUrl}/api/dashboard`;

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  constructor(private http: HttpClient) {}

  getExecutive(): Observable<ApiResponse<ExecutiveDashboardDto>> {
    return this.http.get<ApiResponse<ExecutiveDashboardDto>>(`${API}/executive`);
  }

  getManager(): Observable<ApiResponse<ManagerDashboardDto | null>> {
    return this.http.get<ApiResponse<ManagerDashboardDto | null>>(`${API}/manager`);
  }

  getEmployee(): Observable<ApiResponse<EmployeeDashboardDto | null>> {
    return this.http.get<ApiResponse<EmployeeDashboardDto | null>>(`${API}/employee`);
  }
}
