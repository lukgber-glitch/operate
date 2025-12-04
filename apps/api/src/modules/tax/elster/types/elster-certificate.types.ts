/**
 * ELSTER Certificate Management Types
 * Secure handling of digital certificates for German tax authority (ELSTER) integration
 */

/**
 * Certificate metadata provided when storing a certificate
 */
export interface CertificateMetadata {
  name: string;
  description?: string;
}

/**
 * Stored certificate summary (no sensitive data)
 */
export interface CertificateSummary {
  id: string;
  organisationId: string;
  name: string;
  serialNumber?: string;
  issuer?: string;
  subject?: string;
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  daysUntilExpiry: number;
  isExpired: boolean;
  isExpiringSoon: boolean; // < 30 days
}

/**
 * Complete stored certificate information (for internal use)
 */
export interface StoredCertificate extends CertificateSummary {
  encryptedData: Buffer;
  encryptedPassword: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

/**
 * Decrypted certificate ready for use
 */
export interface DecryptedCertificate {
  id: string;
  organisationId: string;
  name: string;
  certificate: Buffer; // Raw certificate data
  password: string; // Decrypted password
  metadata: CertificateMetadata;
  validFrom: Date;
  validTo: Date;
}

/**
 * Certificate validation result
 */
export interface CertificateValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    serialNumber: string;
    issuer: string;
    subject: string;
    validFrom: Date;
    validTo: Date;
    keyUsage?: string[];
    extendedKeyUsage?: string[];
  };
}

/**
 * Expiring certificate information for notifications
 */
export interface ExpiringCertificate {
  id: string;
  organisationId: string;
  name: string;
  validTo: Date;
  daysUntilExpiry: number;
  serialNumber?: string;
}

/**
 * Encryption result containing all components needed for decryption
 */
export interface EncryptionResult {
  encrypted: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

/**
 * Audit log action types
 */
export enum CertificateAuditAction {
  CREATED = 'CREATED',
  ACCESSED = 'ACCESSED',
  DELETED = 'DELETED',
  UPDATED = 'UPDATED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  ENCRYPTION_KEY_ROTATED = 'ENCRYPTION_KEY_ROTATED',
  EXPIRED = 'EXPIRED',
}

/**
 * Audit log entry
 */
export interface CertificateAuditEntry {
  certificateId: string;
  organisationId: string;
  action: CertificateAuditAction;
  performedBy: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  details?: Record<string, any>;
  createdAt: Date;
}

/**
 * Request context for audit logging
 */
export interface RequestContext {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Certificate storage options
 */
export interface StoreCertificateOptions {
  organisationId: string;
  certificate: Buffer;
  password: string;
  metadata: CertificateMetadata;
  context: RequestContext;
}

/**
 * Certificate retrieval options
 */
export interface GetCertificateOptions {
  organisationId: string;
  certificateId: string;
  context: RequestContext;
  updateLastUsed?: boolean; // Default: true
}

/**
 * Certificate deletion options
 */
export interface DeleteCertificateOptions {
  organisationId: string;
  certificateId: string;
  context: RequestContext;
}

/**
 * Key rotation options
 */
export interface KeyRotationOptions {
  oldKey: string;
  newKey: string;
  context: RequestContext;
}

/**
 * Error types for certificate operations
 */
export class CertificateError extends Error {
  constructor(
    message: string,
    public readonly code: CertificateErrorCode,
    public readonly details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'CertificateError';
  }
}

export enum CertificateErrorCode {
  INVALID_CERTIFICATE = 'INVALID_CERTIFICATE',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  CERTIFICATE_EXPIRED = 'CERTIFICATE_EXPIRED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  STORAGE_FAILED = 'STORAGE_FAILED',
  KEY_ROTATION_FAILED = 'KEY_ROTATION_FAILED',
}
