/**
 * GDPR Type Definitions
 * Comprehensive types for GDPR compliance operations
 */

/**
 * Consent Purposes
 * Different purposes for which user consent may be required
 */
export enum ConsentPurpose {
  ESSENTIAL = 'essential', // Essential service functionality
  MARKETING = 'marketing', // Marketing communications
  ANALYTICS = 'analytics', // Usage analytics and tracking
  THIRD_PARTY = 'third_party', // Third-party integrations
  PROFILING = 'profiling', // Automated decision-making
  ADVERTISING = 'advertising', // Targeted advertising
}

/**
 * Consent Sources
 * How consent was obtained
 */
export enum ConsentSource {
  WEB_FORM = 'web_form',
  API = 'api',
  MIGRATION = 'migration',
  ADMIN = 'admin',
  MOBILE_APP = 'mobile_app',
  EMAIL = 'email',
}

/**
 * Data Subject Request Types
 * All GDPR rights under Articles 15-21
 */
export enum DataSubjectRequestType {
  ACCESS = 'access', // Article 15: Right to access
  RECTIFICATION = 'rectification', // Article 16: Right to rectification
  ERASURE = 'erasure', // Article 17: Right to erasure (right to be forgotten)
  PORTABILITY = 'portability', // Article 20: Right to data portability
  RESTRICTION = 'restriction', // Article 18: Right to restriction of processing
  OBJECTION = 'objection', // Article 21: Right to object
}

/**
 * DSR Status
 * Lifecycle states of a Data Subject Request
 */
export enum DataSubjectRequestStatus {
  PENDING = 'pending', // Just submitted, awaiting acknowledgment
  ACKNOWLEDGED = 'acknowledged', // Acknowledged, not yet processing
  PROCESSING = 'processing', // Currently being processed
  COMPLETED = 'completed', // Successfully completed
  REJECTED = 'rejected', // Rejected (with reason)
  EXTENDED = 'extended', // Deadline extended (max 2 additional months)
  CANCELLED = 'cancelled', // Cancelled by user
}

/**
 * Data Categories
 * Types of data subject to retention policies
 */
export enum DataCategory {
  FINANCIAL_RECORDS = 'financial_records', // 10 years (legal requirement)
  EMPLOYEE_DATA = 'employee_data', // 7 years after employment ends
  CUSTOMER_DATA = 'customer_data', // 3 years after last activity
  LOGS = 'logs', // 90 days (security)
  MARKETING_DATA = 'marketing_data', // Until consent revoked
  TRANSACTION_DATA = 'transaction_data', // Legal retention period
  COMMUNICATION_DATA = 'communication_data', // Customer communications
  BIOMETRIC_DATA = 'biometric_data', // Sensitive data
  HEALTH_DATA = 'health_data', // Special category data
}

/**
 * Legal Basis for Processing
 * GDPR Article 6 legal bases
 */
export enum LegalBasis {
  CONSENT = 'consent', // Article 6(1)(a)
  CONTRACT = 'contract', // Article 6(1)(b)
  LEGAL_OBLIGATION = 'legal_obligation', // Article 6(1)(c)
  VITAL_INTERESTS = 'vital_interests', // Article 6(1)(d)
  PUBLIC_TASK = 'public_task', // Article 6(1)(e)
  LEGITIMATE_INTERESTS = 'legitimate_interests', // Article 6(1)(f)
}

/**
 * GDPR Event Types
 * Events that should be logged in the audit trail
 */
export enum GdprEventType {
  // Consent events
  CONSENT_GRANTED = 'consent_granted',
  CONSENT_REVOKED = 'consent_revoked',
  CONSENT_UPDATED = 'consent_updated',

  // Data Subject Request events
  DSR_CREATED = 'dsr_created',
  DSR_ACKNOWLEDGED = 'dsr_acknowledged',
  DSR_PROCESSING = 'dsr_processing',
  DSR_COMPLETED = 'dsr_completed',
  DSR_REJECTED = 'dsr_rejected',
  DSR_EXTENDED = 'dsr_extended',

  // Data export/deletion events
  DATA_EXPORTED = 'data_exported',
  DATA_DELETED = 'data_deleted',
  DATA_ANONYMIZED = 'data_anonymized',
  DATA_RECTIFIED = 'data_rectified',

  // Access events
  DATA_ACCESSED = 'data_accessed',
  DATA_DOWNLOADED = 'data_downloaded',

  // Retention events
  RETENTION_POLICY_CREATED = 'retention_policy_created',
  RETENTION_POLICY_UPDATED = 'retention_policy_updated',
  AUTO_DELETION_EXECUTED = 'auto_deletion_executed',

  // Processing events
  PROCESSING_RESTRICTED = 'processing_restricted',
  PROCESSING_OBJECTED = 'processing_objected',
}

/**
 * Actor Types
 * Who performed the GDPR action
 */
export enum ActorType {
  USER = 'user',
  ADMIN = 'admin',
  SYSTEM = 'system',
  AUTOMATED = 'automated',
  DPO = 'dpo', // Data Protection Officer
}

/**
 * Data Export Formats
 * Supported formats for data portability
 */
export enum DataExportFormat {
  JSON = 'json',
  CSV = 'csv',
  XML = 'xml',
  PDF = 'pdf',
}

/**
 * Retention Period Presets
 * Common retention periods in days
 */
export const RetentionPeriods = {
  FINANCIAL_RECORDS: 3650, // 10 years
  EMPLOYEE_DATA: 2555, // 7 years
  CUSTOMER_DATA: 1095, // 3 years
  LOGS: 90, // 90 days
  SESSION_DATA: 30, // 30 days
  TEMPORARY_DATA: 7, // 7 days
} as const;

/**
 * SLA Deadlines
 * GDPR-mandated response times
 */
export const SlaDeadlines = {
  DSR_RESPONSE: 30, // 30 days to respond to DSR
  DSR_EXTENSION_MAX: 60, // Can extend by 2 additional months (60 days)
  BREACH_NOTIFICATION_AUTHORITY: 3, // 72 hours to notify authority
  BREACH_NOTIFICATION_USER: 1, // Without undue delay
} as const;

/**
 * Consent Record
 */
export interface ConsentRecord {
  id: string;
  userId: string;
  purpose: ConsentPurpose;
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  source: ConsentSource;
  ipAddress?: string;
  userAgent?: string;
  version: string; // Policy version
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data Subject Request
 */
export interface DataSubjectRequest {
  id: string;
  requestId: string;
  userId: string;
  organisationId?: string;
  requestType: DataSubjectRequestType;
  status: DataSubjectRequestStatus;
  reason?: string;
  requestedAt: Date;
  acknowledgedAt?: Date;
  completedAt?: Date;
  dueDate: Date;
  extendedDueDate?: Date;
  extensionReason?: string;
  completedBy?: string;
  resultFileUrl?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data Retention Policy
 */
export interface RetentionPolicy {
  id: string;
  organisationId?: string;
  dataCategory: DataCategory;
  retentionPeriod: number; // Days
  legalBasis: LegalBasis;
  description?: string;
  autoDelete: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GDPR Audit Log Entry
 */
export interface GdprAuditLogEntry {
  id: string;
  eventType: GdprEventType;
  userId?: string;
  organisationId?: string;
  actorId?: string;
  actorType: ActorType;
  resourceType: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * Data Processing Record (ROPA)
 */
export interface DataProcessingRecord {
  id: string;
  organisationId: string;
  processName: string;
  purpose: string;
  legalBasis: LegalBasis;
  dataCategories: string[];
  dataSubjects: string[];
  recipients: string[];
  thirdCountries: string[];
  retentionPeriod: string;
  securityMeasures: string;
  dpoContact?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Data Export
 * Structure for exported user data
 */
export interface UserDataExport {
  userId: string;
  exportedAt: Date;
  format: DataExportFormat;
  data: {
    profile: any;
    memberships: any[];
    transactions: any[];
    documents: any[];
    consents: ConsentRecord[];
    auditLogs: any[];
    metadata: Record<string, any>;
  };
}

/**
 * Anonymization Result
 */
export interface AnonymizationResult {
  userId: string;
  anonymizedAt: Date;
  recordsAnonymized: number;
  tablesAffected: string[];
  success: boolean;
  errors?: string[];
}
