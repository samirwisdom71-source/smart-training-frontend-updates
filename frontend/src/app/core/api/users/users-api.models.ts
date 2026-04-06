export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  profilePicturePath: string | null;
  isActive: boolean;
  preferredLocale: string | null;
  createdAt: string;
  roleIds: string[];
  managerName?: string | null;
  roleNames?: string | null;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  profilePicturePath?: string | null;
  isActive?: boolean;
  preferredLocale?: string | null;
  roleIds?: string[] | null;
}

export interface UpdateUserRequest {
  fullName: string;
  profilePicturePath?: string | null;
  isActive: boolean;
  preferredLocale?: string | null;
  roleIds?: string[] | null;
}
