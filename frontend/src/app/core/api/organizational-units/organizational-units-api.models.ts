export type OrganizationalUnitType = 'Sector' | 'Department' | 'Section' | 'Unit' | 'Office';

export interface OrganizationalUnitListDto {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  type: string;
  organizationId: string;
  parentId: string | null;
  managerEmployeeId: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface OrganizationalUnitDto extends OrganizationalUnitListDto {
  parentNameEn: string | null;
  modifiedAt: string | null;
}

export interface OrganizationalUnitTreeNodeDto {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  type: string;
  isActive: boolean;
  displayOrder: number;
  children: OrganizationalUnitTreeNodeDto[];
}

export interface CreateOrganizationalUnitRequest {
  code: string;
  nameEn: string;
  nameAr: string;
  type: OrganizationalUnitType;
  organizationId: string;
  parentId: string | null;
  managerEmployeeId: string | null;
  displayOrder: number;
}

export interface UpdateOrganizationalUnitRequest {
  code: string;
  nameEn: string;
  nameAr: string;
  type: OrganizationalUnitType;
  parentId: string | null;
  managerEmployeeId: string | null;
  displayOrder: number;
}

export interface SetStatusRequest {
  isActive: boolean;
}
