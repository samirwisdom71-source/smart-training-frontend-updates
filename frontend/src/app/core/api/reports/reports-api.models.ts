/** Report API response shapes. */

export interface ReportFilterParams {
  organizationId?: string;
  organizationalUnitId?: string;
  jobId?: string;
  employeeId?: string;
  programId?: string;
  fromDate?: string;
  toDate?: string;
  format?: 'json' | 'csv' | 'xlsx' | 'pdf';
}

export interface TrainingCoverageRow {
  organizationName: string;
  organizationalUnitName?: string;
  organizationalUnitNameEn?: string;
  organizationalUnitNameAr?: string;
  jobTitle?: string;
  totalEmployees: number;
  employeesWithTraining: number;
  coveragePercent: number;
}

export interface TrainingParticipationRow {
  programTitle: string;
  organizationName?: string;
  startDate?: string;
  totalEnrolled: number;
  completed: number;
  attendedSessions: number;
}

export interface CompetencyGapSummaryRow {
  competencyName: string;
  departmentName?: string;
  departmentNameEn?: string;
  departmentNameAr?: string;
  severity: string;
  gapCount: number;
}

export interface TrainingCostsRow {
  planTitle: string;
  year: number;
  organizationName: string;
  budget?: number;
  spentOrEstimated?: number;
  status: string;
}

export interface ProgramEffectivenessRow {
  programTitle: string;
  enrolledCount: number;
  completedCount: number;
  averageEvaluationScore?: number;
  status: string;
}

export interface CertificationStatusRow {
  employeeName: string;
  programTitle: string;
  certificateNumber: string;
  issueDate: string;
  status: string;
}
