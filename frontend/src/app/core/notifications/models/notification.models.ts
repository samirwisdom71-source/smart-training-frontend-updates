export interface NotificationDto {
  id: string;
  userId: string;
  notificationTypeCode: string | null;
  title: string;
  body: string | null;
  category: string | null;
  priority: number;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  deepLinkUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  errors?: string[];
}
