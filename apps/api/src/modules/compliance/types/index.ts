/**
 * Compliance Types Barrel Export
 *
 * Note: Some types are defined in multiple files. We use explicit exports to avoid conflicts:
 * - ExportResult: defined in document-archive.types and process-documentation.types
 * - ComplianceCheck, ProcessDocumentation, ProcessStep: defined in gobd-compliance-report.types and process-documentation.types
 */

export * from './hash-chain.types';
// Export document-archive.types except ExportResult (conflicts with process-documentation.types)
export {
  ArchiveDocumentDto,
  ArchivedDocument,
  DocumentVersion,
  ArchiveSearchQuery,
  DocumentIntegrityResult,
  ExportOptions,
  RetentionPeriod,
  RETENTION_PERIODS,
  EncryptionMetadata,
  StorageConfig,
  RetrievalOptions,
  RetrievedDocument,
} from './document-archive.types';
export * from './retention-policy.types';
// Exclude duplicates from gobd-compliance-report.types (ComplianceCheck, ProcessDocumentation, ProcessStep)
export {
  GoBDReport,
  ComplianceCheckType,
  ComplianceCheckStatus,
  ComplianceIssue,
  IssueSeverity,
  ComplianceStatus,
  ComplianceStatistics,
  AuditorExportOptions,
  AuditorExport,
  ExportManifest,
  GenerateReportOptions,
  ProcessDescription,
  RoleDescription,
  SystemConfigSnapshot,
} from './gobd-compliance-report.types';
// process-documentation.types exports the canonical versions of overlapping types
export * from './process-documentation.types';
