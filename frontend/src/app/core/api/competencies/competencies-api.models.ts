export interface CompetencyListDto {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  competencyTypeId: string;
  competencyTypeNameEn: string | null;
  competencyTypeNameAr?: string | null;
  frameworkId: string;
  frameworkNameEn: string | null;
  frameworkNameAr?: string | null;
  category: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface CompetencyDto extends CompetencyListDto {
  descriptionEn: string | null;
  descriptionAr: string | null;
  modifiedAt: string | null;
}

export interface CreateCompetencyRequest {
  code: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  competencyTypeId: string;
  frameworkId: string;
  category?: string | null;
  displayOrder: number;
}

export interface UpdateCompetencyRequest {
  code: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  category?: string | null;
  displayOrder: number;
}

export interface SetStatusRequest {
  isActive: boolean;
}
