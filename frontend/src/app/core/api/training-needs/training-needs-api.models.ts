import type { PagedResult } from '../../models/api-response';

export interface TrainingNeedListDto {
  id: string;
  titleEn: string;
  titleAr: string;
  status: string;
  sourceType: string;
  priority: string | null;
  employeeId: string | null;
  employeeNameEn: string | null;
  jobId: string | null;
  jobTitleEn: string | null;
  organizationalUnitId: string | null;
  organizationalUnitNameEn: string | null;
  competencyId: string | null;
  competencyNameEn: string | null;
  createdAt: string;
}

export interface TrainingNeedDto extends TrainingNeedListDto {
  descriptionEn: string | null;
  descriptionAr: string | null;
  assessmentCycleId: string | null;
  competencyGapId: string | null;
  notes: string | null;
  modifiedAt: string | null;
}

export interface CreateTrainingNeedRequest {
  sourceType: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  priority?: string | null;
  employeeId?: string | null;
  organizationalUnitId?: string | null;
  jobId?: string | null;
  competencyId?: string | null;
  assessmentCycleId?: string | null;
  competencyGapId?: string | null;
}

export interface UpdateTrainingNeedRequest {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  priority?: string | null;
}

export interface AssignTrainingNeedsToPlanRequest {
  annualTrainingPlanId: string;
  trainingNeedIds: string[];
}

export type TrainingNeedsPagedResult = PagedResult<TrainingNeedListDto>;
