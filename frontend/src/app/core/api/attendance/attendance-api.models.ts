export interface AttendanceRecordDto {
  id: string;
  trainingSessionId: string;
  sessionTitleEn: string;
  employeeId: string;
  employeeNameEn: string;
  employeeNameAr?: string | null;
  attendanceStatus: string;
  attendancePercent: number | null;
  notes: string | null;
  filePath: string | null;
}

export interface AttendanceSummaryDto {
  trainingProgramId: string;
  totalSessions: number;
  totalParticipants: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
}

export interface BulkAttendanceItemDto {
  employeeId: string;
  attendanceStatus: string;
  attendancePercent?: number | null;
  notes?: string | null;
}

export interface BulkMarkAttendanceRequest {
  trainingSessionId: string;
  items: BulkAttendanceItemDto[];
}

export interface UpdateAttendanceRecordRequest {
  id: string;
  attendanceStatus: string;
  attendancePercent?: number | null;
  notes?: string | null;
}
