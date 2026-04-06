import type { PagedResult } from '../../models/api-response';

export interface AssessmentCycleListDto {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  organizationId: string;
  organizationNameEn: string;
  startDate: string;
  endDate: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

export interface AssessmentCycleDto {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  organizationId: string;
  organizationNameEn: string;
  startDate: string;
  endDate: string;
  status: string;
  targetScopeType?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  modifiedAt?: string | null;
}

export interface CreateAssessmentCycleRequest {
  code: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  organizationId: string;
  startDate: string;
  endDate: string;
  targetScopeType?: string | null;
  notes?: string | null;
}

export interface UpdateAssessmentCycleRequest extends CreateAssessmentCycleRequest {}

export interface ChangeAssessmentCycleStatusRequest {
  status: string;
}

export interface AssessmentCycleScopeSummaryDto {
  cycleId: string;
  organizationalUnits: AssessmentCycleScopeOuItemDto[];
  jobs: AssessmentCycleScopeJobItemDto[];
  employees: AssessmentCycleScopeEmployeeItemDto[];
}

export interface AssessmentCycleScopeOuItemDto {
  id: string;
  organizationalUnitId: string;
  code: string;
  nameEn: string;
}

export interface AssessmentCycleScopeJobItemDto {
  id: string;
  jobId: string;
  code: string;
  titleEn: string;
}

export interface AssessmentCycleScopeEmployeeItemDto {
  id: string;
  employeeId: string;
  employeeNumber: string;
  fullNameEn: string;
}

export interface AddScopeOrganizationalUnitsRequest {
  organizationalUnitIds: string[];
}

export interface AddScopeJobsRequest {
  jobIds: string[];
}

export interface AddScopeEmployeesRequest {
  employeeIds: string[];
}

export interface AssessmentGenerationResultDto {
  totalEmployeesInScope: number;
  assessmentsGenerated: number;
  skippedExisting: number;
  skippedNoJobOrNoMappings: number;
  detailRowsCreated: number;
}

export interface AssessmentSummaryDto {
  id: string;
  assessmentCycleId: string;
  cycleCode: string;
  cycleNameEn: string;
  cycleStartDate: string;
  cycleEndDate: string;
  employeeId: string;
  employeeNameEn: string;
  managerNameEn?: string | null;
  status: string;
  selfSubmittedAt?: string | null;
  managerReviewedAt?: string | null;
  finalizedAt?: string | null;
}

export interface ProficiencyLevelOptionDto {
  id: string;
  code: string;
  levelNumber: number;
}

export interface AssessmentDetailDto {
  id: string;
  competencyId: string;
  competencyCode: string;
  competencyNameEn: string;
  importanceWeight?: number | null;
  requiredProficiencyLevelId: string;
  requiredLevelCode: string;
  requiredLevelNumber: number;
  proficiencyLevelOptions: ProficiencyLevelOptionDto[];
  selfProficiencyLevelId?: string | null;
  selfLevelCode?: string | null;
  selfLevelNumber?: number | null;
  managerProficiencyLevelId?: string | null;
  managerLevelCode?: string | null;
  managerLevelNumber?: number | null;
  finalProficiencyLevelId?: string | null;
  finalLevelCode?: string | null;
  finalLevelNumber?: number | null;
  selfComment?: string | null;
  managerComment?: string | null;
  finalComment?: string | null;
  gapValue?: number | null;
}

export interface AssessmentDto {
  id: string;
  summary: AssessmentSummaryDto;
  details: AssessmentDetailDto[];
}

export interface SaveSelfAssessmentDetailRequest {
  detailId: string;
  selfProficiencyLevelId?: string | null;
  selfComment?: string | null;
}

export interface SaveSelfAssessmentRequest {
  details: SaveSelfAssessmentDetailRequest[];
}

export interface ManagerReviewDetailRequest {
  detailId: string;
  managerProficiencyLevelId?: string | null;
  managerComment?: string | null;
}

export interface SaveManagerReviewRequest {
  details: ManagerReviewDetailRequest[];
  overallComment?: string | null;
}

export interface AssessmentResultListDto {
  id: string;
  assessmentCycleId: string;
  cycleCode: string;
  cycleNameEn: string;
  employeeId: string;
  employeeNameEn: string;
  jobId?: string | null;
  jobTitleEn?: string | null;
  organizationalUnitId?: string | null;
  organizationalUnitNameEn?: string | null;
  status: string;
  finalizedAt?: string | null;
  totalCompetencies: number;
  completedCompetencies: number;
  averageGap: number;
  highGapCount: number;
  mediumGapCount: number;
  lowGapCount: number;
}

export interface CompetencyGapListDto {
  id: string;
  assessmentId: string;
  assessmentCycleId: string;
  cycleCode: string;
  employeeId: string;
  employeeNameEn: string;
  employeeNameAr?: string | null;
  jobId?: string | null;
  jobTitleEn?: string | null;
  jobTitleAr?: string | null;
  organizationalUnitId?: string | null;
  organizationalUnitNameEn?: string | null;
  competencyId: string;
  competencyCode: string;
  competencyNameEn: string;
  competencyNameAr?: string | null;
  competencyTypeNameEn?: string | null;
  competencyTypeNameAr?: string | null;
  requiredProficiencyLevelId: string;
  requiredLevelCode: string;
  requiredLevelNumber: number;
  currentFinalProficiencyLevelId?: string | null;
  currentFinalLevelCode?: string | null;
  currentFinalLevelNumber?: number | null;
  gapAmount: number;
  severity: string;
  priority?: string | null;
  generatedAt: string;
}

export type AssessmentCyclePagedResult = PagedResult<AssessmentCycleListDto>;
export type AssessmentResultPagedResult = PagedResult<AssessmentResultListDto>;
export type CompetencyGapPagedResult = PagedResult<CompetencyGapListDto>;

