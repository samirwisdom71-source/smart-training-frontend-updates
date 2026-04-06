export interface CompetencyTypeListDto {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  frameworkId: string;
  frameworkNameEn: string | null;
  frameworkNameAr?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface CompetencyTypeDto extends CompetencyTypeListDto {
  descriptionEn: string | null;
  descriptionAr: string | null;
  modifiedAt: string | null;
}

export interface CreateCompetencyTypeRequest {
  code: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  frameworkId: string;
  displayOrder: number;
}

export interface UpdateCompetencyTypeRequest {
  code: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  displayOrder: number;
}

export interface SetStatusRequest {
  isActive: boolean;
}
