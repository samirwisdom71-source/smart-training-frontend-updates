export interface NavItem {
  /** Translation key for the label (e.g. nav.dashboard). */
  labelKey: string;
  route: string;
  /** Any of these permissions grants visibility. */
  permissions: string[];
  /** Semantic icon name used by the sidebar (e.g. 'dashboard', 'users'). */
  icon: string;
}

export interface NavGroup {
  id: string;
  /** Translation key used as the group label. */
  labelKey: string;
  /** Icon for the group trigger. */
  icon: string;
  items: NavItem[];
}

export const SIDEBAR_GROUPS: NavGroup[] = [
  {
    id: 'dashboard',
    labelKey: 'nav.dashboardGroup',
    icon: 'dashboard',
    items: [
      { labelKey: 'nav.dashboard', route: '/dashboard', permissions: ['dashboard:view'], icon: 'dashboard' },
      { labelKey: 'nav.reports', route: '/reports', permissions: ['report:view'], icon: 'reports' },
      { labelKey: 'nav.impact', route: '/impact', permissions: ['impact:view'], icon: 'impact' },
    ],
  },
  {
    id: 'organization',
    labelKey: 'nav.organizationGroup',
    icon: 'organization',
    items: [
      { labelKey: 'nav.organization', route: '/organization', permissions: ['organization:view'], icon: 'organization' },
      { labelKey: 'nav.jobs', route: '/jobs', permissions: ['job:view'], icon: 'jobs' },
      { labelKey: 'nav.positions', route: '/positions', permissions: ['position:view'], icon: 'positions' },
      { labelKey: 'nav.employees', route: '/employees', permissions: ['employee:view'], icon: 'employees' },
    ],
  },
  {
    id: 'competency',
    labelKey: 'nav.competency',
    icon: 'competency',
    items: [
      { labelKey: 'nav.competency', route: '/competency', permissions: ['competency:view'], icon: 'competency' },
    ],
  },
  {
    id: 'training',
    labelKey: 'nav.learningGroup',
    icon: 'programs',
    items: [
      { labelKey: 'nav.assessments', route: '/assessments/my', permissions: ['assessment:view', 'assessment:execute'], icon: 'myAssessments' },
      { labelKey: 'nav.assessmentCycles', route: '/assessments/cycles', permissions: ['assessment-cycle:view'], icon: 'assessmentCycles' },
      { labelKey: 'nav.managerAssessments', route: '/assessments/manager', permissions: ['assessment:review'], icon: 'managerReviews' },
      { labelKey: 'nav.gapAnalysis', route: '/assessments/gaps', permissions: ['gap-analysis:view'], icon: 'gapAnalysis' },
      { labelKey: 'nav.trainingNeeds', route: '/training-needs', permissions: ['training-need:view'], icon: 'trainingNeeds' },
      { labelKey: 'nav.trainingPlan', route: '/training-plans', permissions: ['training-plan:view'], icon: 'trainingPlans' },
      { labelKey: 'nav.programs', route: '/programs', permissions: ['training-program:view', 'course:view', 'session:view'], icon: 'programs' },
      { labelKey: 'nav.enrollments', route: '/enrollments', permissions: ['enrollment:view'], icon: 'enrollments' },
      { labelKey: 'nav.attendance', route: '/attendance', permissions: ['attendance:view'], icon: 'attendance' },
      { labelKey: 'nav.certificates', route: '/certificates', permissions: ['certificate:view'], icon: 'certificates' },
      { labelKey: 'nav.postTrainingReports', route: '/post-training-reports', permissions: ['evaluation:view', 'evaluation:execute'], icon: 'postTrainingReports' },
    ],
  },
  {
    id: 'knowledge',
    labelKey: 'nav.knowledgeGroup',
    icon: 'knowledge',
    items: [
      { labelKey: 'nav.knowledgeLibrary', route: '/knowledge/library', permissions: ['knowledge:view'], icon: 'knowledgeLibrary' },
      { labelKey: 'nav.knowledgeTransfer', route: '/knowledge/transfer', permissions: ['knowledge:view'], icon: 'knowledgeTransfer' },
      { labelKey: 'nav.internalExperts', route: '/knowledge/internal-experts', permissions: ['internal-expert:view'], icon: 'internalExperts' },
    ],
  },
  {
    id: 'admin',
    labelKey: 'nav.settings',
    icon: 'settings',
    items: [
      { labelKey: 'nav.mySubordinates', route: '/my-subordinates', permissions: ['assessment:review'], icon: 'employees' },
      { labelKey: 'nav.notifications', route: '/notifications', permissions: ['notification:view'], icon: 'notifications' },
      { labelKey: 'nav.audit', route: '/audit', permissions: ['audit:view'], icon: 'audit' },
      { labelKey: 'nav.recycleBin', route: '/recycle-bin', permissions: ['audit:view'], icon: 'recycleBin' },
      { labelKey: 'nav.usersAndRoles', route: '/users', permissions: ['user:view'], icon: 'users' },
      { labelKey: 'nav.roles', route: '/roles', permissions: ['role:view'], icon: 'roles' },
    ],
  },
];
