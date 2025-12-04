/**
 * ZATCA Interfaces
 *
 * TypeScript interfaces for ZATCA certificate management
 */

export interface ZatcaCertificateDto {
  id: string;
  organisationId: string;
  name: string;
  description?: string;
  certificateType: 'COMPLIANCE' | 'PRODUCTION';
  invoiceType: 'TAX_INVOICE' | 'SIMPLIFIED_INVOICE';
  commonName: string;
  organizationName: string;
  organizationUnit: string;
  serialNumber?: string;
  csid?: string;
  csidStatus: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'RENEWAL_PENDING' | 'FAILED';
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
  environment: string;
  invoicesSigned: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SigningResult {
  signingOperationId: string;
  invoiceHash: string;
  signature: string;
  publicKeyHash: string;
  certificateId: string;
  timestamp: Date;
}

export interface CertificateExpiryCheck {
  isExpired: boolean;
  daysUntilExpiry: number;
  needsRenewal: boolean;
}

export interface CertificateValidation {
  isValid: boolean;
  errors: string[];
}

export interface RotationResult {
  oldCertificateId: string;
  newCertificateId: string;
  rotation: {
    id: string;
    rotationType: string;
    rotationStatus: string;
    createdAt: Date;
  };
}

export interface AuditStatistics {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  byAction: Array<{
    action: string;
    count: number;
  }>;
}

export interface SigningStatistics {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  byCertificate: Array<{
    certificateId: string;
    count: number;
  }>;
}

export interface KeyManagementConfig {
  masterKey?: string;
  kmsKeyId?: string;
  hsmKeyId?: string;
  provider: 'local' | 'aws-kms' | 'azure-keyvault' | 'hsm';
}

export interface CertificateFilter {
  isActive?: boolean;
  certificateType?: 'COMPLIANCE' | 'PRODUCTION';
  environment?: 'sandbox' | 'production';
  csidStatus?: string;
}
