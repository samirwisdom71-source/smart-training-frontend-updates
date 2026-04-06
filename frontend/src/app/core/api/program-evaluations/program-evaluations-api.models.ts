export interface ProgramEvaluationDto {
  id: string;
  trainingProgramId: string;
  programCode: string;
  programTitleEn: string;
  employeeId: string;
  employeeNameEn: string;
  contentScore: number;
  trainerScore: number;
  organizationScore: number;
  usefulnessScore: number;
  comments: string | null;
  filePath: string | null;
  fileName: string | null;
  submittedAt: string;
}

export interface ProgramEvaluationSummaryDto {
  trainingProgramId: string;
  avgContentScore: number;
  avgTrainerScore: number;
  avgOrganizationScore: number;
  avgUsefulnessScore: number;
  totalResponses: number;
}

export interface SubmitProgramEvaluationRequest {
  trainingProgramId: string;
  employeeId: string;
  contentScore: number;
  trainerScore: number;
  organizationScore: number;
  usefulnessScore: number;
  comments?: string | null;
  file?: File | null;
}
