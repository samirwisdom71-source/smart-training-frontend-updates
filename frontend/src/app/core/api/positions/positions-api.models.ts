export interface PositionListDto {
  id: string;
  code: string;
  jobId: string;
  jobTitleEn: string;
  jobTitleAr?: string | null;
  organizationalUnitId: string;
  organizationalUnitNameEn: string;
  organizationalUnitNameAr?: string | null;
  isVacant: boolean;
  reportsToPositionId: string | null;
  reportsToPositionCode: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PositionDto extends PositionListDto {
  modifiedAt: string | null;
}

export interface CreatePositionRequest {
  code: string;
  jobId: string;
  organizationalUnitId: string;
  isVacant: boolean;
  reportsToPositionId?: string | null;
}

export interface UpdatePositionRequest {
  code: string;
  jobId: string;
  organizationalUnitId: string;
  isVacant: boolean;
  reportsToPositionId?: string | null;
}

export interface SetStatusRequest {
  isActive: boolean;
}
