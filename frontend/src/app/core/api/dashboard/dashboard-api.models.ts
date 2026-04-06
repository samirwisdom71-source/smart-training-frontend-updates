/** API response shapes for dashboard endpoints (match backend DTOs). */

export interface DashboardKpiDto {
  id: string;
  labelKey: string;
  value: number | string;
  subLabelKey?: string;
  subValue?: string;
  trend?: string;
  trendValue?: string;
  link?: string;
  icon?: string;
}

export interface DashboardSeriesPointDto {
  label: string;
  value: number;
}

export interface DashboardTopItemDto {
  id: string;
  label: string;
  value: number;
}

export interface DashboardStatusCountDto {
  status: string;
  statusKey: string;
  count: number;
}

export interface ExecutiveDashboardDto {
  kpis: DashboardKpiDto[];
  trendChart: DashboardSeriesPointDto[];
  topDepartmentsByGaps: DashboardTopItemDto[];
  planExecutionStatus: DashboardStatusCountDto[];
  impactIndicators: DashboardKpiDto[];
}

export interface UpcomingProgramDto {
  id: string;
  titleEn: string;
  titleAr?: string;
  startDate?: string;
}

export interface ManagerDashboardDto {
  kpis: DashboardKpiDto[];
  teamAssessmentCompleted: number;
  teamAssessmentTotal: number;
  teamAssessmentPercentage: number;
  teamGaps: DashboardTopItemDto[];
  pendingReviews: number;
  teamTrainingParticipation: DashboardSeriesPointDto[];
  upcomingPrograms: UpcomingProgramDto[];
}

export interface CompletedProgramDto {
  id: string;
  titleEn: string;
  completedAt?: string;
}

export interface PendingTaskDto {
  title: string;
  link?: string;
}

export interface EmployeeDashboardDto {
  kpis: DashboardKpiDto[];
  myAssessmentsOpen: number;
  myAssessmentsCompleted: number;
  myCertificates: number;
  upcomingPrograms: UpcomingProgramDto[];
  completedPrograms: CompletedProgramDto[];
  myCompetencyGaps: DashboardTopItemDto[];
  pendingTasks: PendingTaskDto[];
}
