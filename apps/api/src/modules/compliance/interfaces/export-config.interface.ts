/**
 * Export Configuration Interface
 * Defines the configuration options for compliance exports
 */
export interface ExportConfig {
  /**
   * Export type (GoBD or SAF-T)
   */
  type: 'gobd' | 'saft';

  /**
   * Organization ID for the export
   */
  organizationId: string;

  /**
   * Start date of the export period
   */
  startDate: Date;

  /**
   * End date of the export period
   */
  endDate: Date;

  /**
   * Whether to include supporting documents (PDFs, images)
   */
  includeDocuments?: boolean;

  /**
   * Optional comment or description for the export
   */
  comment?: string;

  /**
   * Additional type-specific options
   */
  options?: Record<string, any>;
}

/**
 * Export metadata for tracking and auditing
 */
export interface ExportMetadata {
  /**
   * User ID who initiated the export
   */
  createdBy: string;

  /**
   * Export creation timestamp
   */
  createdAt: Date;

  /**
   * Export completion timestamp
   */
  completedAt?: Date;

  /**
   * File size in bytes
   */
  fileSize?: number;

  /**
   * SHA-256 checksum of the export file
   */
  checksum?: string;

  /**
   * Storage path or URL
   */
  storagePath?: string;

  /**
   * Export format version
   */
  version: string;
}
