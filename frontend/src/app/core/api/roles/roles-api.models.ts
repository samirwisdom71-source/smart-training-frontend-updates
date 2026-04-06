export interface RoleDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  permissions: PermissionDto[];
}

export interface RoleListDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface PermissionDto {
  id: string;
  code: string;
  description: string | null;
}

export interface CreateRoleRequest {
  name: string;
  description?: string | null;
}

export interface UpdateRoleRequest {
  name: string;
  description?: string | null;
}

export interface AssignPermissionsRequest {
  permissionIds: string[];
}
