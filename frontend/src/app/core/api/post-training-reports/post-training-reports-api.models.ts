import type { PagedResult } from '../../models/api-response';

import type { ProficiencyLevelOptionDto } from '../assessments/assessments-api.models';

export interface PostTrainingReportListDto {
  id: string;
  trainingProgramId: string;
  programCode: string;
  programTitleEn: string;
  employeeId: string;
  employeeNameEn: string;
  status: string;
  createdAt: string;
  submittedAt: string | null;
  attachmentOriginalFileName: string | null;
  attachmentFilePath: string | null;
}

export interface PostTrainingReportDto {
  id: string;
  trainingProgramId: string;
  programCode: string;
  programTitleEn: string;
  employeeId: string;
  employeeNameEn: string;
  notes: string | null;
  managerComment: string | null;
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  previousAssessmentId: string | null;
  previousAssessmentCycleNameEn: string | null;
  attachmentOriginalFileName: string | null;
  attachmentFilePath: string | null;
  details: PostTrainingReportDetailDto[];
}

export interface SavePostTrainingReportDraftRequest {
  trainingProgramId: string;
  employeeId: string;
  notes?: string | null;
  details: SavePostTrainingReportDetailRequest[];
}

export interface PostTrainingReportDetailDto {
  id: string;
  competencyId: string;
  competencyCode: string;
  competencyNameEn: string;
  competencyNameAr: string | null;
  previousProficiencyLevelId: string | null;
  previousLevelCode: string | null;
  previousLevelNumber: number | null;
  currentProficiencyLevelId: string | null;
  currentLevelCode: string | null;
  currentLevelNumber: number | null;
  currentComment: string | null;
  proficiencyLevelOptions: ProficiencyLevelOptionDto[];
}

export interface SavePostTrainingReportDetailRequest {
  competencyId: string;
  currentProficiencyLevelId?: string | null;
  currentComment?: string | null;
}

export type PostTrainingReportsPagedResult = PagedResult<PostTrainingReportListDto>;
