export interface JobListDto {
  id: string;
  code: string;
  titleEn: string;
  titleAr: string;
  gradeLevel: string | null;
  organizationalUnitId: string | null;
  organizationalUnitNameEn: string | null;
  organizationalUnitNameAr?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface JobDto extends JobListDto {
  descriptionEn: string | null;
  descriptionAr: string | null;
  modifiedAt: string | null;
}

export interface CreateJobRequest {
  code: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  organizationalUnitId?: string | null;
  gradeLevel?: string | null;
}

export interface UpdateJobRequest {
  code: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  organizationalUnitId?: string | null;
  gradeLevel?: string | null;
}

export interface SetStatusRequest {
  isActive: boolean;
}
