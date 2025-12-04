/**
 * Spanish SII Certificate Management Types
 * Secure handling of FNMT digital certificates for Spanish Tax Agency (AEAT) integration
 */

/**
 * Certificate metadata provided when storing a certificate
 */
export interface SpainCertificateMetadata {
  name: string;
  description?: string;
  cifNif?: string; // Spanish tax ID from certificate
  environment?: 'production' | 'test'; // AEAT environment
}

/**
 * Stored certificate summary (no sensitive data)
 */
export interface SpainCertificateSummary {
  id: string;
  organisationId: string;
  name: string;
  cifNif?: string; // Spanish tax ID
  serialNumber?: string;
  issuer?: string;
  subject?: string;
  validFrom: Date;
  validTo: Date;
  environment: 'production' | 'test';
  isActive: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  daysUntilExpiry: number;
  isExpired: boolean;
  isExpiringSoon: boolean; // < 30 days
  thumbprint?: string; // Certificate thumbprint for identification
}

/**
 * Complete stored certificate information (for internal use)
 */
export interface StoredSpainCertificate extends SpainCertificateSummary {
  encryptedData: Buffer;
  encryptedPassword: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

/**
 * Decrypted certificate ready for use with AEAT/SII
 */
export interface DecryptedSpainCertificate {
  id: string;
  organisationId: string;
  name: string;
  certificate: Buffer; // Raw PKCS#12 certificate data
  password: string; // Decrypted password
  metadata: SpainCertificateMetadata;
  validFrom: Date;
  validTo: Date;
  environment: 'production' | 'test';
}

/**
 * Certificate validation result for FNMT certificates
 */
export interface SpainCertificateValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    serialNumber: string;
    issuer: string;
    subject: string;
    validFrom: Date;
    validTo: Date;
    cifNif?: string; // Extracted from certificate subject
    thumbprint: string; // SHA-256 thumbprint
    keyUsage?: string[];
    extendedKeyUsage?: string[];
    isFNMT?: boolean; // Whether issued by FNMT
  };
}

/**
 * Expiring certificate information for notifications
 */
export interface ExpiringSpainCertificate {
  id: string;
  organisationId: string;
  name: string;
  cifNif?: string;
  validTo: Date;
  daysUntilExpiry: number;
  serialNumber?: string;
  environment: 'production' | 'test';
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
 * Audit log action types for Spanish certificates
 */
export enum SpainCertificateAuditAction {
  CREATED = 'CREATED',
  ACCESSED = 'ACCESSED',
  DELETED = 'DELETED',
  UPDATED = 'UPDATED',
  ROTATED = 'ROTATED', // Certificate rotation
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  ENCRYPTION_KEY_ROTATED = 'ENCRYPTION_KEY_ROTATED',
  EXPIRED = 'EXPIRED',
  AEAT_TEST_SUCCESS = 'AEAT_TEST_SUCCESS', // Test connection to AEAT
  AEAT_TEST_FAILED = 'AEAT_TEST_FAILED',
}

/**
 * Audit log entry
 */
export interface SpainCertificateAuditEntry {
  certificateId: string;
  organisationId: string;
  action: SpainCertificateAuditAction;
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
export interface StoreSpainCertificateOptions {
  organisationId: string;
  certificate: Buffer; // PKCS#12 (.p12/.pfx) file
  password: string; // Certificate password
  metadata: SpainCertificateMetadata;
  context: RequestContext;
}

/**
 * Certificate retrieval options
 */
export interface GetSpainCertificateOptions {
  organisationId: string;
  certificateId: string;
  context: RequestContext;
  updateLastUsed?: boolean; // Default: true
}

/**
 * Certificate deletion options
 */
export interface DeleteSpainCertificateOptions {
  organisationId: string;
  certificateId: string;
  context: RequestContext;
}

/**
 * Certificate rotation options (for zero-downtime updates)
 */
export interface CertificateRotationOptions {
  organisationId: string;
  oldCertificateId: string;
  newCertificate: Buffer;
  newPassword: string;
  metadata: SpainCertificateMetadata;
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
 * AEAT connectivity test options
 */
export interface AEATTestOptions {
  organisationId: string;
  certificateId: string;
  environment?: 'production' | 'test';
  context: RequestContext;
}

/**
 * AEAT connectivity test result
 */
export interface AEATTestResult {
  success: boolean;
  environment: 'production' | 'test';
  endpoint: string;
  responseTime: number; // milliseconds
  certificateValid: boolean;
  errors?: string[];
  timestamp: Date;
}

/**
 * Error types for certificate operations
 */
export class SpainCertificateError extends Error {
  constructor(
    message: string,
    public readonly code: SpainCertificateErrorCode,
    public readonly details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'SpainCertificateError';
  }
}

export enum SpainCertificateErrorCode {
  INVALID_CERTIFICATE = 'INVALID_CERTIFICATE',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  CERTIFICATE_EXPIRED = 'CERTIFICATE_EXPIRED',
  NOT_FNMT_CERTIFICATE = 'NOT_FNMT_CERTIFICATE', // Not issued by FNMT
  INVALID_PKCS12_FORMAT = 'INVALID_PKCS12_FORMAT',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  STORAGE_FAILED = 'STORAGE_FAILED',
  KEY_ROTATION_FAILED = 'KEY_ROTATION_FAILED',
  AEAT_CONNECTION_FAILED = 'AEAT_CONNECTION_FAILED',
  CERTIFICATE_ROTATION_FAILED = 'CERTIFICATE_ROTATION_FAILED',
}
