export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  userId: string;
  email: string;
  fullName: string;
  profilePicturePath: string | null;
  roles: string[];
  permissions: string[];
}

export interface RefreshTokenResponse {
  accessToken: string;
  newRefreshToken: string;
  accessTokenExpiresAt: string;
}

export interface CurrentUserDto {
  id: string;
  email: string;
  fullName: string;
  profilePicturePath: string | null;
  roles: string[];
  permissions: string[];
  jobTitle?: string | null;
  department?: string | null;
}

export const AUTH_STORAGE_KEY = 'smart_training_auth';

export interface StoredAuth {
  accessToken: string;
  /** Optional when API does not issue refresh tokens; session still restores until access token expires. */
  refreshToken?: string;
  expiresAt?: string;
  user: CurrentUserDto;
}
