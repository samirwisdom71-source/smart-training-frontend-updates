/** Dashboard role context for layout and widgets */
export type DashboardRole = 'executive' | 'manager' | 'employee';

/** Single KPI card data */
export interface DashboardKpi {
  id: string;
  labelKey: string;
  value: number | string;
  subLabelKey?: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  link?: string;
  icon?: 'people' | 'clipboard' | 'book' | 'certificate' | 'check' | 'clock' | 'chart' | 'bell';
}

/** Label-value pair for bars/lists */
export interface DashboardSeriesPoint {
  label: string;
  value: number;
  color?: string;
}

/** Time-series point for trend charts */
export interface DashboardTrendPoint {
  label: string;
  value: number;
}

/** Top gaps / department data */
export interface DashboardTopItem {
  id: string;
  label: string;
  value: number;
  unit?: string;
}

/** Program / plan status count */
export interface DashboardStatusCount {
  status: string;
  statusKey: string;
  count: number;
}

/** Executive dashboard data */
export interface ExecutiveDashboardData {
  kpis: DashboardKpi[];
  trendChart: DashboardTrendPoint[];
  topDepartmentsByGaps: DashboardTopItem[];
  planExecutionStatus: DashboardStatusCount[];
  impactIndicators: DashboardKpi[];
}

/** Manager dashboard data */
export interface ManagerDashboardData {
  kpis: DashboardKpi[];
  teamAssessmentCompletion: { completed: number; total: number; percentage: number };
  teamGaps: DashboardTopItem[];
  pendingReviews: number;
  teamTrainingParticipation: DashboardSeriesPoint[];
}

/** Employee dashboard data */
export interface EmployeeDashboardData {
  kpis: DashboardKpi[];
  myAssessments: { open: number; completed: number };
  myCertificates: number;
  upcomingPrograms: { title: string; date: string }[];
  pendingTasks: { title: string; link?: string }[];
}
