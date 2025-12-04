/**
 * GoBD Compliance Report Types
 * Type definitions for GoBD compliance reporting and auditing
 */

import { RetentionCategory } from '@prisma/client';

/**
 * Main GoBD compliance report structure
 */
export interface GoBDReport {
  // Report metadata
  reportId: string;
  reportDate: Date;
  periodStart: Date;
  periodEnd: Date;
  tenantId: string;
  tenantName?: string;

  // Compliance score (0-100)
  complianceScore: number;

  // Detailed checks
  checks: ComplianceCheck[];

  // Issues found
  issues: ComplianceIssue[];

  // Recommendations for improvement
  recommendations: string[];

  // Ready for tax auditor certification
  certificationReady: boolean;

  // Statistics
  statistics: ComplianceStatistics;
}

/**
 * Individual compliance check result
 */
export interface ComplianceCheck {
  // Check identifier
  checkType: ComplianceCheckType;

  // Check name and description
  name: string;
  description: string;

  // Status
  status: ComplianceCheckStatus;

  // Score (0-100) for this check
  score: number;

  // Weight in overall compliance score
  weight: number;

  // Detailed results
  details?: Record<string, any>;

  // When check was performed
  checkedAt: Date;

  // Error message if failed
  error?: string;
}

/**
 * Types of compliance checks
 */
export enum ComplianceCheckType {
  // Hash chain integrity
  AUDIT_LOG_INTEGRITY = 'AUDIT_LOG_INTEGRITY',

  // Document archive integrity
  DOCUMENT_ARCHIVE_INTEGRITY = 'DOCUMENT_ARCHIVE_INTEGRITY',

  // Retention policy compliance
  RETENTION_POLICY = 'RETENTION_POLICY',

  // Journal completeness (no gaps)
  JOURNAL_COMPLETENESS = 'JOURNAL_COMPLETENESS',

  // Process documentation exists
  PROCESS_DOCUMENTATION = 'PROCESS_DOCUMENTATION',

  // Change tracking (all changes logged)
  CHANGE_TRACKING = 'CHANGE_TRACKING',

  // Access control (RBAC)
  ACCESS_CONTROL = 'ACCESS_CONTROL',

  // Data backup procedures
  DATA_BACKUP = 'DATA_BACKUP',

  // Tax-relevant documents archived
  TAX_DOCUMENT_ARCHIVAL = 'TAX_DOCUMENT_ARCHIVAL',

  // System configuration compliance
  SYSTEM_CONFIGURATION = 'SYSTEM_CONFIGURATION',
}

/**
 * Status of a compliance check
 */
export enum ComplianceCheckStatus {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  WARNING = 'WARNING',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  SKIPPED = 'SKIPPED',
}

/**
 * Compliance issue found during checks
 */
export interface ComplianceIssue {
  // Issue identifier
  id: string;

  // Related check
  checkType: ComplianceCheckType;

  // Severity
  severity: IssueSeverity;

  // Issue title and description
  title: string;
  description: string;

  // Affected entities
  affectedEntities?: {
    entityType: string;
    entityId: string;
    details?: string;
  }[];

  // When issue was detected
  detectedAt: Date;

  // Resolution status
  resolved: boolean;
  resolvedAt?: Date;
  resolution?: string;

  // Remediation steps
  remediation?: string[];
}

/**
 * Issue severity levels
 */
export enum IssueSeverity {
  CRITICAL = 'CRITICAL', // Must be fixed immediately
  HIGH = 'HIGH', // Should be fixed soon
  MEDIUM = 'MEDIUM', // Should be addressed
  LOW = 'LOW', // Nice to fix
  INFO = 'INFO', // Informational only
}

/**
 * Quick compliance status check
 */
export interface ComplianceStatus {
  tenantId: string;
  overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING' | 'UNKNOWN';
  complianceScore: number;
  lastCheckDate?: Date;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  certificationReady: boolean;
}

/**
 * Compliance statistics
 */
export interface ComplianceStatistics {
  // Audit log stats
  totalAuditEntries: number;
  auditChainIntact: boolean;
  oldestAuditEntry?: Date;
  newestAuditEntry?: Date;

  // Document stats
  totalArchivedDocuments: number;
  totalDocumentVersions: number;
  documentsVerified: number;
  documentsCorrupted: number;

  // Retention stats
  documentsInRetention: number;
  documentsExpiringSoon: number; // Within 90 days
  documentsOverdue: number; // Past retention date

  // Journal stats
  totalJournalEntries?: number;
  journalGapsFound?: number;
  journalPeriodStart?: Date;
  journalPeriodEnd?: Date;

  // User activity stats
  totalUsers?: number;
  activeUsers?: number;
  lastLoginDate?: Date;
}

/**
 * Export options for auditor package
 */
export interface AuditorExportOptions {
  // Time period to export
  periodStart: Date;
  periodEnd: Date;

  // Include specific data
  includeAuditLog?: boolean;
  includeDocuments?: boolean;
  includeProcessDocs?: boolean;
  includeSystemConfig?: boolean;
  includeJournal?: boolean;

  // Export format
  format?: 'zip' | 'tar.gz';
  encryption?: boolean; // Encrypt export with password
  password?: string; // Password for encryption

  // Retention categories to include
  retentionCategories?: RetentionCategory[];

  // Digital signature
  signExport?: boolean;

  // Language
  language?: 'de' | 'en';
}

/**
 * Auditor export result
 */
export interface AuditorExport {
  exportId: string;
  tenantId: string;
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;

  // Export package location
  filePath: string;
  fileName: string;
  fileSize: number;

  // Checksum for integrity
  checksum: string;
  checksumAlgorithm: 'sha256';

  // Digital signature (if signed)
  signature?: string;
  signatureAlgorithm?: string;

  // Included data manifest
  manifest: ExportManifest;

  // Expiry (export file will be deleted)
  expiresAt: Date;

  // Metadata
  metadata?: {
    complianceScore?: number;
    documentsIncluded?: number;
    auditEntriesIncluded?: number;
  };
}

/**
 * Export manifest - what's included in the export
 */
export interface ExportManifest {
  // Compliance report
  complianceReport?: {
    included: boolean;
    fileName?: string;
    format?: 'pdf' | 'json';
  };

  // Audit log
  auditLog?: {
    included: boolean;
    fileName?: string;
    entryCount?: number;
    format?: 'csv' | 'json';
  };

  // Documents
  documents?: {
    included: boolean;
    directoryName?: string;
    documentCount?: number;
    totalSize?: number;
    inventoryFile?: string; // CSV inventory list
  };

  // Process documentation
  processDocumentation?: {
    included: boolean;
    fileName?: string;
  };

  // System configuration
  systemConfiguration?: {
    included: boolean;
    fileName?: string;
  };

  // Journal entries
  journal?: {
    included: boolean;
    fileName?: string;
    entryCount?: number;
  };

  // README
  readme?: {
    included: boolean;
    fileName?: string;
    language?: 'de' | 'en';
  };
}

/**
 * Options for generating compliance report
 */
export interface GenerateReportOptions {
  // Time period (defaults to last year)
  year?: number;
  periodStart?: Date;
  periodEnd?: Date;

  // Checks to perform (defaults to all)
  checksToPerform?: ComplianceCheckType[];

  // Include detailed audit logs in report
  includeAuditDetails?: boolean;

  // Language
  language?: 'de' | 'en';
}

/**
 * Process documentation structure
 * Verfahrensdokumentation required by GoBD
 */
export interface ProcessDocumentation {
  tenantId: string;
  version: string;
  lastUpdated: Date;
  approvedBy?: string;
  approvedAt?: Date;

  // Company information
  companyInfo: {
    name: string;
    address: string;
    taxNumber?: string;
    registrationNumber?: string;
  };

  // System description
  systemDescription: {
    name: string;
    version: string;
    vendor?: string;
    purpose: string;
    components: string[];
  };

  // Process descriptions
  processes: ProcessDescription[];

  // Organizational structure
  organization: {
    roles: RoleDescription[];
    responsibilities: string[];
  };

  // Technical documentation
  technical: {
    infrastructure: string;
    dataFlow: string;
    interfaces: string[];
    backupProcedure: string;
    securityMeasures: string[];
  };

  // Compliance statements
  compliance: {
    gobdCompliant: boolean;
    gdprCompliant: boolean;
    certifications?: string[];
    lastAudit?: Date;
    nextAudit?: Date;
  };
}

/**
 * Individual process description
 */
export interface ProcessDescription {
  name: string;
  id: string;
  description: string;
  owner: string;
  steps: ProcessStep[];
  inputs: string[];
  outputs: string[];
  frequency: string;
  controls: string[];
}

/**
 * Process step
 */
export interface ProcessStep {
  step: number;
  description: string;
  actor: string;
  system?: string;
  validation?: string;
}

/**
 * Role description
 */
export interface RoleDescription {
  roleName: string;
  responsibilities: string[];
  permissions: string[];
  requiredQualifications?: string[];
}

/**
 * System configuration snapshot
 */
export interface SystemConfigSnapshot {
  tenantId: string;
  capturedAt: Date;
  version: string;

  // Application settings
  settings: {
    retentionPolicies: Record<RetentionCategory, number>;
    encryptionEnabled: boolean;
    hashChainEnabled: boolean;
    backupFrequency: string;
    auditLogRetention: number;
  };

  // User permissions
  userRoles: {
    roleName: string;
    userCount: number;
    permissions: string[];
  }[];

  // Integration status
  integrations: {
    name: string;
    enabled: boolean;
    lastSync?: Date;
  }[];

  // Security settings
  security: {
    mfaEnabled: boolean;
    passwordPolicy: string;
    sessionTimeout: number;
    ipWhitelist?: string[];
  };
}
