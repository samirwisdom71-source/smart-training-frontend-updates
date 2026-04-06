export interface OrganizationListDto {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface OrganizationDto extends OrganizationListDto {
  modifiedAt: string | null;
}

export interface CreateOrganizationRequest {
  code: string;
  nameEn: string;
  nameAr: string;
}

export interface UpdateOrganizationRequest {
  code: string;
  nameEn: string;
  nameAr: string;
}

export interface SetStatusRequest {
  isActive: boolean;
}
