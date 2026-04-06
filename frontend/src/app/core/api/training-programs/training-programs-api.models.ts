import type { PagedResult } from '../../models/api-response';

export interface TrainingProgramListDto {
  id: string;
  code: string;
  titleEn: string;
  titleAr: string;
  organizationId: string;
  organizationNameEn: string;
  competencyId: string | null;
  competencyNameEn: string | null;
  status: string;
  deliveryMode: string | null;
  startDate: string | null;
  endDate: string | null;
  capacity: number | null;
  approvedCost: number | null;
  executorType: string | null;
  scientificMaterialsPath: string | null;
  createdAt: string;
  /** Enrollments excluding Cancelled and Rejected (same scope as programs list API). */
  activeEnrollmentCount?: number;
}

export interface TrainingSessionDto {
  id: string;
  trainingProgramId: string;
  titleEn: string;
  titleAr: string;
  startDateTime: string;
  endDateTime: string;
  location: string | null;
  onlineLink: string | null;
  filePath: string | null;
  attendanceRule: string | null;
}

export interface TrainingProgramDto {
  id: string;
  organizationId: string;
  organizationNameEn: string;
  trainingPlanItemId: string | null;
  code: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  competencyId: string | null;
  competencyNameEn: string | null;
  deliveryMode: string | null;
  location: string | null;
  onlineLink: string | null;
  executorType: string | null;
  scientificMaterialsPath: string | null;
  /** Single attendance evidence file for all sessions in the program. */
  attendanceEvidencePath: string | null;
  capacity: number | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  sessions: TrainingSessionDto[];
  createdAt: string;
  modifiedAt: string | null;
}

export interface CreateTrainingProgramRequest {
  organizationId: string;
  trainingPlanItemId?: string | null;
  code: string;
  titleEn: string;
  titleAr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  competencyId?: string | null;
  deliveryMode?: string | null;
  location?: string | null;
  onlineLink?: string | null;
  executorType?: string | null;
  capacity?: number | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateTrainingProgramRequest {
  id: string;
  organizationId: string;
  trainingPlanItemId?: string | null;
  code: string;
  titleEn: string;
  titleAr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  competencyId?: string | null;
  deliveryMode?: string | null;
  location?: string | null;
  onlineLink?: string | null;
  executorType?: string | null;
  capacity?: number | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface CreateTrainingSessionRequest {
  trainingProgramId: string;
  titleEn: string;
  titleAr: string;
  startDateTime: string;
  endDateTime: string;
  location?: string | null;
  onlineLink?: string | null;
  attendanceRule?: string | null;
}

export interface UpdateTrainingSessionRequest {
  id: string;
  titleEn: string;
  titleAr: string;
  startDateTime: string;
  endDateTime: string;
  location?: string | null;
  onlineLink?: string | null;
  attendanceRule?: string | null;
}

export type TrainingProgramsPagedResult = PagedResult<TrainingProgramListDto>;
