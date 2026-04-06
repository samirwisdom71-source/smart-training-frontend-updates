export interface SystemSettingDto {
  id: string;
  key: string;
  value: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
}

export interface SetSettingValueRequest {
  value: string | null;
}
