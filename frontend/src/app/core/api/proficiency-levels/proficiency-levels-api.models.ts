export interface ProficiencyLevelListDto {
  id: string;
  frameworkId: string;
  frameworkNameEn: string | null;
  frameworkNameAr?: string | null;
  code: string;
  levelNumber: number;
  nameEn: string;
  nameAr: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface ProficiencyLevelDto extends ProficiencyLevelListDto {
  descriptionEn: string | null;
  descriptionAr: string | null;
  modifiedAt: string | null;
}

export interface CreateProficiencyLevelRequest {
  frameworkId: string;
  code: string;
  levelNumber: number;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  displayOrder: number;
}

export interface UpdateProficiencyLevelRequest {
  code: string;
  levelNumber: number;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  displayOrder: number;
}

export interface SetStatusRequest {
  isActive: boolean;
}
