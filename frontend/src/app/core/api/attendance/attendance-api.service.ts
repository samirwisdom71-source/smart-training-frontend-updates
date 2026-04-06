import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { appConfig } from '../../../config/app.config';
import type { ApiResponse } from '../../models/api-response';
import type {
  AttendanceRecordDto,
  AttendanceSummaryDto,
  BulkMarkAttendanceRequest,
  UpdateAttendanceRecordRequest,
} from './attendance-api.models';

const API = `${appConfig.apiUrl}/api/attendance`;

@Injectable({ providedIn: 'root' })
export class AttendanceApiService {
  constructor(private http: HttpClient) {}

  getBySession(sessionId: string): Observable<ApiResponse<AttendanceRecordDto[]>> {
    return this.http.get<ApiResponse<AttendanceRecordDto[]>>(`${API}/by-session/${sessionId}`);
  }

  bulkMark(sessionId: string, body: BulkMarkAttendanceRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API}/by-session/${sessionId}/bulk`, body);
  }

  update(id: string, body: UpdateAttendanceRecordRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${API}/${id}`, body);
  }

  getProgramSummary(programId: string): Observable<ApiResponse<AttendanceSummaryDto>> {
    return this.http.get<ApiResponse<AttendanceSummaryDto>>(`${API}/program-summary/${programId}`);
  }

  uploadSessionFile(sessionId: string, file: File): Observable<ApiResponse<{ filePath: string; url: string }>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<{ filePath: string; url: string }>>(`${API}/by-session/${sessionId}/file`, form);
  }

  uploadProgramAttendanceFile(programId: string, file: File): Observable<ApiResponse<{ filePath: string; url: string }>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<{ filePath: string; url: string }>>(`${API}/by-program/${programId}/file`, form);
  }

  fileUrl(relativePath: string): string {
    const p = (relativePath ?? '').replace(/^\/+/, '');
    return `${appConfig.apiUrl}/files/${p}`;
  }

  /** Fetches the file with auth and triggers a browser download (works across API vs app origin). */
  downloadStoredFile(relativePath: string): Observable<void> {
    const url = this.fileUrl(relativePath);
    const fileName = relativePath.replace(/^.*[/\\]/, '').trim() || 'attendance-attachment';
    return this.http.get(url, { responseType: 'blob' }).pipe(
      tap((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = fileName;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
      }),
      map(() => undefined),
    );
  }
}
