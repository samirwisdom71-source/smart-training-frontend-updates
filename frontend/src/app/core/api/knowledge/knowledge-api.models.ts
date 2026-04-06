export interface KnowledgeAssetListDto {
  id: string;
  titleEn: string;
  titleAr: string;
  category: string | null;
  tags: string | null;
  fileName: string | null;
  uploadedByUserId: string | null;
  createdAt: string;
  isActive: boolean;
}

export interface KnowledgeAssetDto {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  category: string | null;
  tags: string | null;
  filePath: string | null;
  fileName: string | null;
  contentType: string | null;
  fileSizeBytes: number | null;
  uploadedByUserId: string | null;
  createdAt: string;
  modifiedAt: string | null;
  isActive: boolean;
}

export interface KnowledgeTransferListDto {
  id: string;
  titleEn: string;
  titleAr: string;
  fromEmployeeId: string | null;
  fromEmployeeNameEn: string | null;
  toEmployeeId: string | null;
  toEmployeeNameEn: string | null;
  transferDate: string | null;
  transferEndDate: string | null;
  status: string | null;
  createdAt: string;
}

export interface KnowledgeTransferDto {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  fromEmployeeId: string | null;
  fromEmployeeNameEn: string | null;
  toEmployeeId: string | null;
  toEmployeeNameEn: string | null;
  transferDate: string | null;
  transferEndDate: string | null;
  status: string | null;
  notes: string | null;
  relatedKnowledgeAssetId: string | null;
  createdAt: string;
  modifiedAt: string | null;
}

export interface InternalExpertListDto {
  id: string;
  employeeId: string;
  employeeNameEn: string;
  employeeNameAr: string | null;
  competencyIds: string[];
  competencyNamesEn: string | null;
  competencyNamesAr: string | null;
  organizationalUnitId: string | null;
  organizationalUnitNameEn: string | null;
  organizationalUnitNameAr?: string | null;
  areaOfExpertiseEn: string | null;
  areaOfExpertiseAr: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface InternalExpertDto {
  id: string;
  employeeId: string;
  employeeNameEn: string;
  employeeNameAr: string | null;
  competencyIds: string[];
  competencyNamesEn: string | null;
  competencyNamesAr: string | null;
  organizationalUnitId: string | null;
  organizationalUnitNameEn: string | null;
  organizationalUnitNameAr?: string | null;
  areaOfExpertiseEn: string | null;
  areaOfExpertiseAr: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  modifiedAt: string | null;
}
