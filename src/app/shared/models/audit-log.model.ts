export interface AuditLogResponse {
  id: number;
  userId?: number;
  username?: string;
  fullName?: string;
  action: string;
  targetEntity?: string;
  targetId?: number;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  createdAt?: string;
}

export interface AuditLogQuery {
  keyword?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}
