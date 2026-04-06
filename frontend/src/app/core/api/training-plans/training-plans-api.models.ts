import type { PagedResult } from '../../models/api-response';

export interface AnnualTrainingPlanListDto {
  id: string;
  year: number;
  organizationId: string;
  organizationNameEn: string;
  planType: string;
  startDate: string | null;
  endDate: string | null;
  titleEn: string;
  titleAr: string;
  status: string;
  budget: number | null;
  createdAt: string;
}

export interface TrainingPlanItemDto {
  id: string;
  annualTrainingPlanId: string;
  trainingNeedId: string | null;
  titleEn: string;
  titleAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  targetAudience: string | null;
  plannedParticipantCount: number | null;
  estimatedCost: number | null;
  priority: string | null;
  status: string;
}

export interface AnnualTrainingPlanDto {
  id: string;
  year: number;
  organizationId: string;
  organizationNameEn: string;
  planType: string;
  startDate: string | null;
  endDate: string | null;
  titleEn: string;
  titleAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  status: string;
  budget: number | null;
  notes: string | null;
  items: TrainingPlanItemDto[];
  createdAt: string;
  modifiedAt: string | null;
}

export interface CreateAnnualTrainingPlanRequest {
  year: number;
  organizationId: string;
  planType: 'Annual' | 'SemiAnnual' | 'Quarterly' | 'Monthly';
  startDate?: string | null;
  endDate?: string | null;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  budget?: number | null;
  notes?: string | null;
}

export interface UpdateAnnualTrainingPlanRequest {
  id: string;
  year: number;
  organizationId: string;
  planType: 'Annual' | 'SemiAnnual' | 'Quarterly' | 'Monthly';
  startDate?: string | null;
  endDate?: string | null;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  budget?: number | null;
  notes?: string | null;
}

export interface AddTrainingPlanItemRequest {
  annualTrainingPlanId: string;
  trainingNeedId?: string | null;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  targetAudience?: string | null;
  plannedParticipantCount?: number | null;
  estimatedCost?: number | null;
  priority?: string | null;
}

export interface UpdateTrainingPlanItemRequest {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  targetAudience?: string | null;
  plannedParticipantCount?: number | null;
  estimatedCost?: number | null;
  priority?: string | null;
  status?: string | null;
}

export type AnnualTrainingPlansPagedResult = PagedResult<AnnualTrainingPlanListDto>;
