/**
 * Audit Types
 * Proper TypeScript types for audit-related data
 */

export interface AuditStateData {
  [key: string]: unknown;
}

export interface AuditMetadata {
  [key: string]: unknown;
}

export interface SecurityEventMetadata {
  eventType?: string;
  email?: string;
  reason?: string;
  mfaRequired?: boolean;
  mfaMethod?: string;
  changeType?: string;
  previousRole?: string;
  newRole?: string;
  permission?: string;
  targetUserId?: string;
  dataType?: string;
  exportFormat?: string;
  recordCount?: number;
  apiKeyId?: string;
  endpoint?: string;
  method?: string;
  success?: boolean;
  riskLevel?: string;
  [key: string]: unknown;
}
