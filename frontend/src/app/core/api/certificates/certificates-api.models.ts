import type { PagedResult } from '../../models/api-response';

export interface CertificateListDto {
  id: string;
  certificateNumber: string;
  trainingProgramId: string;
  programCode: string;
  programTitleEn: string;
  employeeId: string;
  employeeNameEn: string;
  issueDate: string;
  status: string;
  filePath: string | null;
}

export interface CertificateDto {
  id: string;
  certificateNumber: string;
  trainingProgramId: string;
  programCode: string;
  programTitleEn: string;
  employeeId: string;
  employeeNameEn: string;
  issueDate: string;
  status: string;
  filePath: string | null;
}

export interface GenerateCertificateRequest {
  trainingProgramId: string;
  employeeId: string;
}

/** Matches backend CertificateGenerationRecipientDto (camelCase JSON). */
export interface CertificateGenerationRecipientDto {
  employeeId: string;
  employeeNameEn: string;
  eligible: boolean;
  ineligibilityHintKey: string | null;
}

export type CertificatesPagedResult = PagedResult<CertificateListDto>;
