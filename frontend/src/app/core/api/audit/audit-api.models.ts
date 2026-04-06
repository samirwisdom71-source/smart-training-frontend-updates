export interface AuditLogEntryViewDto {
  id: number;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  userFullName?: string;
  actionType: string;
  moduleName?: string;
  entityName?: string;
  entityId?: string;
  oldValuesSummary?: string;
  newValuesSummary?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
}

export interface AuditListParams {
  page?: number;
  pageSize?: number;
  fromUtc?: string;
  toUtc?: string;
  moduleName?: string;
  actionType?: string;
  userId?: string;
  success?: boolean;
}
