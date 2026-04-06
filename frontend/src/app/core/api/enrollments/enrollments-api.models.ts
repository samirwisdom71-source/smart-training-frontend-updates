import type { PagedResult } from '../../models/api-response';

export interface EnrollmentListDto {
  id: string;
  trainingProgramId: string;
  programCode: string;
  programTitleEn: string;
  employeeId: string;
  employeeNameEn: string;
  nominationSource: string;
  status: string;
  createdAt: string;
}

export interface EnrollmentDto {
  id: string;
  trainingProgramId: string;
  programCode: string;
  programTitleEn: string;
  employeeId: string;
  employeeNameEn: string;
  nominationSource: string;
  status: string;
  nominatedByEmployeeId: string | null;
  nominatedByEmployeeNameEn: string | null;
  reviewedByEmployeeId: string | null;
  reviewedByEmployeeNameEn: string | null;
  notes: string | null;
  createdAt: string;
  modifiedAt: string | null;
}

export interface NominateEnrollmentRequest {
  trainingProgramId: string;
  employeeId: string;
  nominationSource?: string;
  notes?: string | null;
}

export interface NominateEnrollmentsBulkRequest {
  trainingProgramId: string;
  employeeIds: string[];
  nominationSource?: string;
  notes?: string | null;
}

export type EnrollmentsPagedResult = PagedResult<EnrollmentListDto>;
