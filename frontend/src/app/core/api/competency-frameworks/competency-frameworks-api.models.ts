export interface CompetencyFrameworkListDto {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  organizationId: string | null;
  organizationNameEn: string | null;
  organizationNameAr?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CompetencyFrameworkDto extends CompetencyFrameworkListDto {
  descriptionEn: string | null;
  descriptionAr: string | null;
  modifiedAt: string | null;
}

export interface CreateCompetencyFrameworkRequest {
  code: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  organizationId?: string | null;
}

export interface UpdateCompetencyFrameworkRequest {
  code: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  organizationId?: string | null;
}

export interface SetStatusRequest {
  isActive: boolean;
}
