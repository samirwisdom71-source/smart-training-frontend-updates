export interface ImpactMeasurementListDto {
  id: string;
  trainingProgramId: string | null;
  programTitleEn: string | null;
  employeeId: string | null;
  employeeNameEn: string | null;
  productivityScore: number | null;
  performanceImprovement: number | null;
  measuredAt: string;
  createdAt: string;
}

export interface ImpactMeasurementDto {
  id: string;
  trainingProgramId: string | null;
  programTitleEn: string | null;
  employeeId: string | null;
  employeeNameEn: string | null;
  productivityScore: number | null;
  performanceImprovement: number | null;
  managerFeedback: string | null;
  measuredAt: string;
  notes: string | null;
  createdAt: string;
  modifiedAt: string | null;
}

export interface ImpactSummaryDto {
  totalRecords: number;
  averageProductivityScore: number | null;
  averagePerformanceImprovement: number | null;
}

export interface ImpactComparisonRowDto {
  trainingProgramId: string;
  programTitleEn: string;
  employeeId: string;
  employeeNameEn: string;
  enrollmentStatus: string | null;
  evaluationAverageScore: number | null;
  evaluationComments: string | null;
  evaluationSubmittedAt: string | null;
  postTrainingReportStatus: string | null;
  postTrainingReportNotes: string | null;
  postTrainingReportSubmittedAt: string | null;
  reportPreviousAverageLevel: number | null;
  reportCurrentAverageLevel: number | null;
  reportImprovementDelta: number | null;
  productivityScore: number | null;
  performanceImprovement: number | null;
  impactAverageScore: number | null;
  impactMeasuredAt: string | null;
  reportDetails: ImpactComparisonDetailDto[];
}

export interface ImpactComparisonDetailDto {
  competencyId: string;
  competencyCode: string;
  competencyNameEn: string;
  previousLevelCode: string | null;
  previousLevelNumber: number | null;
  currentLevelCode: string | null;
  currentLevelNumber: number | null;
  currentComment: string | null;
}

export interface ImpactComparisonSummaryDto {
  totalRows: number;
  totalPrograms: number;
  totalEmployees: number;
  withEvaluationCount: number;
  withPostTrainingReportCount: number;
  withImpactCount: number;
  averageEvaluationScore: number | null;
  averageReportCurrentLevel: number | null;
  averageReportImprovementDelta: number | null;
  averageImpactScore: number | null;
  averageImpactVsEvaluationDelta: number | null;
}

export interface ImpactComparisonDto {
  programId: string | null;
  employeeId: string | null;
  summary: ImpactComparisonSummaryDto;
  rows: ImpactComparisonRowDto[];
}
