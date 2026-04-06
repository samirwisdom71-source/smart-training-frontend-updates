export interface RecycleBinItemDto {
  moduleKey: string;
  moduleName: string;
  entityId: string;
  displayName: string;
  deletedAt: string | null;
  deletedBy: string | null;
  relatedId?: string | null;
}

export interface RecycleBinListParams {
  page?: number;
  pageSize?: number;
  moduleKey?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}
