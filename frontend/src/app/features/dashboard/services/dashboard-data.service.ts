import { Injectable } from '@angular/core';
import type {
  ExecutiveDashboardData,
  ManagerDashboardData,
  EmployeeDashboardData,
  DashboardKpi,
  DashboardTrendPoint,
  DashboardTopItem,
  DashboardStatusCount,
  DashboardSeriesPoint,
  DashboardRole
} from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  /** Resolve dashboard role from user roles (mock: use first role or default to employee).
   * For development: set sessionStorage 'dashboard_role' to 'executive' | 'manager' | 'employee' to override. */
  getDashboardRole(roles: string[]): DashboardRole {
    if (typeof sessionStorage !== 'undefined') {
      const override = sessionStorage.getItem('dashboard_role') as DashboardRole | null;
      if (override === 'executive' || override === 'manager' || override === 'employee') return override;
    }
    const r = roles?.map(x => x.toLowerCase()) ?? [];
    if (r.some(x => x.includes('admin') || x.includes('executive') || x.includes('hr'))) return 'executive';
    if (r.some(x => x.includes('manager') || x.includes('supervisor'))) return 'manager';
    return 'employee';
  }

  getExecutiveData(): ExecutiveDashboardData {
    return {
      kpis: this.getExecutiveKpis(),
      trendChart: this.getOrgTrendData(),
      topDepartmentsByGaps: this.getTopDepartmentsByGaps(),
      planExecutionStatus: this.getPlanExecutionStatus(),
      impactIndicators: this.getImpactIndicators()
    };
  }

  getManagerData(): ManagerDashboardData {
    return {
      kpis: this.getManagerKpis(),
      teamAssessmentCompletion: { completed: 18, total: 24, percentage: 75 },
      teamGaps: this.getTeamGaps(),
      pendingReviews: 5,
      teamTrainingParticipation: this.getTeamParticipation()
    };
  }

  getEmployeeData(): EmployeeDashboardData {
    return {
      kpis: this.getEmployeeKpis(),
      myAssessments: { open: 1, completed: 3 },
      myCertificates: 2,
      upcomingPrograms: [
        { title: 'Leadership Essentials', date: '2025-04-15' },
        { title: 'Project Management Foundation', date: '2025-05-01' }
      ],
      pendingTasks: [
        { title: 'Complete self-assessment Q2', link: '/assessments' },
        { title: 'Submit training need form', link: '/training-needs' }
      ]
    };
  }

  private getExecutiveKpis(): DashboardKpi[] {
    return [
      { id: 'employees', labelKey: 'dashboard.widgets.totalEmployees', value: 1247, link: '/employees', icon: 'people' },
      { id: 'assessments_open', labelKey: 'dashboard.widgets.assessmentsOpen', value: 312, subLabelKey: 'dashboard.widgets.assessmentsCompleted', subValue: '892', link: '/assessments', icon: 'clipboard' },
      { id: 'certificates', labelKey: 'dashboard.widgets.certificatesIssued', value: 456, trend: 'up', trendValue: '+12%', link: '/programs', icon: 'certificate' },
      { id: 'attendance', labelKey: 'dashboard.widgets.attendanceRate', value: 94, subValue: '%', trend: 'up', trendValue: '+2%', icon: 'chart' },
      { id: 'pending_approvals', labelKey: 'dashboard.widgets.pendingApprovals', value: 23, link: '/enrollments', icon: 'clock' },
      { id: 'plan_progress', labelKey: 'dashboard.widgets.trainingPlanProgress', value: 68, subValue: '%', trend: 'up', icon: 'book' }
    ];
  }

  private getOrgTrendData(): DashboardTrendPoint[] {
    return [
      { label: 'Jan', value: 42 },
      { label: 'Feb', value: 48 },
      { label: 'Mar', value: 55 },
      { label: 'Apr', value: 61 },
      { label: 'May', value: 58 },
      { label: 'Jun', value: 67 }
    ];
  }

  private getTopDepartmentsByGaps(): DashboardTopItem[] {
    return [
      { id: '1', label: 'Engineering', value: 24 },
      { id: '2', label: 'Operations', value: 18 },
      { id: '3', label: 'Sales', value: 14 },
      { id: '4', label: 'HR', value: 9 },
      { id: '5', label: 'Finance', value: 7 }
    ];
  }

  private getPlanExecutionStatus(): DashboardStatusCount[] {
    return [
      { status: 'Completed', statusKey: 'status.completed', count: 12 },
      { status: 'In progress', statusKey: 'status.inProgress', count: 8 },
      { status: 'Not started', statusKey: 'status.notStarted', count: 4 }
    ];
  }

  private getImpactIndicators(): DashboardKpi[] {
    return [
      { id: 'impact_1', labelKey: 'dashboard.widgets.impactCompletion', value: 89, subValue: '%', trend: 'up' },
      { id: 'impact_2', labelKey: 'dashboard.widgets.knowledgeTransfer', value: 34, subLabelKey: 'dashboard.widgets.sessions', trend: 'up', trendValue: '+5' }
    ];
  }

  private getManagerKpis(): DashboardKpi[] {
    return [
      { id: 'team_size', labelKey: 'dashboard.widgets.teamSize', value: 24, icon: 'people' },
      { id: 'assessments_done', labelKey: 'dashboard.widgets.assessmentsCompleted', value: 18, subLabelKey: 'dashboard.widgets.ofTotal', subValue: '24', icon: 'clipboard' },
      { id: 'pending_reviews', labelKey: 'dashboard.widgets.pendingReviews', value: 5, link: '/assessments', icon: 'clock' },
      { id: 'participation', labelKey: 'dashboard.widgets.teamParticipation', value: 82, subValue: '%', icon: 'chart' }
    ];
  }

  private getTeamGaps(): DashboardTopItem[] {
    return [
      { id: '1', label: 'Technical Writing', value: 8 },
      { id: '2', label: 'Data Analysis', value: 5 },
      { id: '3', label: 'Leadership', value: 4 }
    ];
  }

  private getTeamParticipation(): DashboardSeriesPoint[] {
    return [
      { label: 'Q1', value: 78 },
      { label: 'Q2', value: 85 },
      { label: 'Q3', value: 82 },
      { label: 'Q4', value: 88 }
    ];
  }

  private getEmployeeKpis(): DashboardKpi[] {
    return [
      { id: 'my_assessments', labelKey: 'dashboard.widgets.myAssessments', value: 1, subLabelKey: 'dashboard.widgets.open', link: '/assessments', icon: 'clipboard' },
      { id: 'my_certificates', labelKey: 'dashboard.widgets.myCertificates', value: 2, link: '/profile', icon: 'certificate' },
      { id: 'upcoming', labelKey: 'dashboard.widgets.upcomingPrograms', value: 2, icon: 'book' },
      { id: 'tasks', labelKey: 'dashboard.widgets.pendingTasks', value: 2, icon: 'clock' }
    ];
  }

  /** Training needs by department (for bar chart) */
  getTrainingNeedsByDepartment(): DashboardSeriesPoint[] {
    return [
      { label: 'Engineering', value: 45 },
      { label: 'Operations', value: 32 },
      { label: 'Sales', value: 28 },
      { label: 'HR', value: 18 },
      { label: 'Finance', value: 12 }
    ];
  }

  /** Programs by status (for doughnut) */
  getProgramsByStatus(): DashboardStatusCount[] {
    return [
      { status: 'Active', statusKey: 'status.active', count: 8 },
      { status: 'Completed', statusKey: 'status.completed', count: 22 },
      { status: 'Draft', statusKey: 'status.draft', count: 3 }
    ];
  }

  /** Notifications summary count */
  getNotificationsSummary(): { unread: number; total: number } {
    return { unread: 5, total: 24 };
  }
}
