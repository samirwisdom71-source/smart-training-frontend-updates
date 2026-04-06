/**
 * Permission codes (module:action). Must match backend RbacDefinitions and seeded Permission.Code.
 * Use for route guards and UI visibility.
 */
export const PermissionCodes = {
  profile: { view: 'profile:view', edit: 'profile:edit', execute: 'profile:execute' },
  user: { view: 'user:view', create: 'user:create', edit: 'user:edit', delete: 'user:delete', manage: 'user:manage' },
  role: { view: 'role:view', create: 'role:create', edit: 'role:edit', delete: 'role:delete' },
  permission: { view: 'permission:view' },
  organization: { view: 'organization:view', create: 'organization:create', edit: 'organization:edit', delete: 'organization:delete' },
  job: { view: 'job:view', create: 'job:create', edit: 'job:edit', delete: 'job:delete' },
  position: { view: 'position:view', create: 'position:create', edit: 'position:edit', delete: 'position:delete' },
  employee: { view: 'employee:view', create: 'employee:create', edit: 'employee:edit', delete: 'employee:delete' },
  competency: { view: 'competency:view', create: 'competency:create', edit: 'competency:edit', delete: 'competency:delete' },
  jobCompetency: { view: 'job-competency:view', create: 'job-competency:create', edit: 'job-competency:edit', delete: 'job-competency:delete' },
  assessmentCycle: { view: 'assessment-cycle:view', create: 'assessment-cycle:create', edit: 'assessment-cycle:edit', delete: 'assessment-cycle:delete' },
  assessment: { view: 'assessment:view', execute: 'assessment:execute', review: 'assessment:review', manage: 'assessment:manage' },
  gapAnalysis: { view: 'gap-analysis:view', analyze: 'gap-analysis:analyze', export: 'gap-analysis:export' },
  trainingNeed: { view: 'training-need:view', create: 'training-need:create', edit: 'training-need:edit', delete: 'training-need:delete' },
  trainingPlan: { view: 'training-plan:view', create: 'training-plan:create', edit: 'training-plan:edit', submit: 'training-plan:submit', approve: 'training-plan:approve', delete: 'training-plan:delete', export: 'training-plan:export' },
  trainingProgram: { view: 'training-program:view', create: 'training-program:create', edit: 'training-program:edit', delete: 'training-program:delete' },
  course: { view: 'course:view', create: 'course:create', edit: 'course:edit', delete: 'course:delete' },
  session: { view: 'session:view', create: 'session:create', edit: 'session:edit', delete: 'session:delete' },
  enrollment: { view: 'enrollment:view', create: 'enrollment:create', edit: 'enrollment:edit', approve: 'enrollment:approve', delete: 'enrollment:delete' },
  attendance: { view: 'attendance:view', manage: 'attendance:manage' },
  evaluation: { view: 'evaluation:view', execute: 'evaluation:execute', analyze: 'evaluation:analyze' },
  certificate: { view: 'certificate:view', manage: 'certificate:manage' },
  knowledge: { view: 'knowledge:view', create: 'knowledge:create', edit: 'knowledge:edit', delete: 'knowledge:delete' },
  internalExpert: { view: 'internal-expert:view', edit: 'internal-expert:edit', manage: 'internal-expert:manage' },
  report: { view: 'report:view', export: 'report:export', manage: 'report:manage' },
  notification: { view: 'notification:view', manage: 'notification:manage' },
  dashboard: { view: 'dashboard:view' },
  audit: { view: 'audit:view' },
  settings: { view: 'settings:view', manage: 'settings:manage' },
  localization: { view: 'localization:view', manage: 'localization:manage' },
} as const;

export type PermissionCode = string;
