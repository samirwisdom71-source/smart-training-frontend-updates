export interface EmployeeListDto {
  id: string;
  employeeNumber: string;
  fullNameEn: string;
  fullNameAr: string;
  email: string | null;
  status: string;
  positionId: string | null;
  positionCode: string | null;
  jobId: string | null;
  jobTitleEn: string | null;
  jobTitleAr?: string | null;
  organizationalUnitId: string | null;
  organizationalUnitNameEn: string | null;
  organizationalUnitNameAr?: string | null;
  managerEmployeeId: string | null;
  managerNameEn: string | null;
  managerNameAr?: string | null;
  hireDate: string | null;
  createdAt: string;
  userId: string | null;
}

export interface EmployeeDto extends EmployeeListDto {
  phone: string | null;
  positionCode: string | null;
  jobTitleEn: string | null;
  jobTitleAr?: string | null;
  organizationalUnitNameEn: string | null;
  organizationalUnitNameAr?: string | null;
  managerNameEn: string | null;
  managerNameAr?: string | null;
  profilePhotoPath: string | null;
  userId: string | null;
  modifiedAt: string | null;
}

export interface CreateEmployeeRequest {
  employeeNumber: string;
  fullNameEn: string;
  fullNameAr: string;
  email?: string | null;
  phone?: string | null;
  hireDate?: string | null;
  positionId?: string | null;
  jobId?: string | null;
  organizationalUnitId?: string | null;
  managerEmployeeId?: string | null;
  /** When creating a login account for the employee */
  password?: string | null;
  userRoleIds?: string[] | null;
}

export interface UpdateEmployeeRequest {
  employeeNumber: string;
  fullNameEn: string;
  fullNameAr: string;
  email?: string | null;
  phone?: string | null;
  hireDate?: string | null;
  positionId?: string | null;
  jobId?: string | null;
  organizationalUnitId?: string | null;
  managerEmployeeId?: string | null;
}

export interface SetEmployeeStatusRequest {
  status: string;
}
