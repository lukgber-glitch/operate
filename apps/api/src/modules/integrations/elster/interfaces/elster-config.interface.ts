/**
 * ELSTER Configuration Interface
 * Defines configuration for ELSTER API integration
 */

/**
 * ELSTER environment types
 */
export enum ElsterEnvironment {
  SANDBOX = 'sandbox',
  PRODUCTION = 'production',
}

/**
 * ELSTER certificate configuration
 */
export interface ElsterCertificate {
  /** Certificate ID */
  id: string;

  /** Organization ID */
  organizationId: string;

  /** Certificate data (encrypted PFX file) */
  certificateData: Buffer;

  /** Certificate password (encrypted) */
  password: string;

  /** Certificate issuer */
  issuer: string;

  /** Certificate subject */
  subject: string;

  /** Valid from date */
  validFrom: Date;

  /** Valid until date */
  validUntil: Date;

  /** Is certificate active */
  active: boolean;

  /** Created at timestamp */
  createdAt: Date;

  /** Updated at timestamp */
  updatedAt: Date;
}

/**
 * ELSTER certificate validation result
 */
export interface ElsterCertificateValidation {
  /** Is certificate valid */
  valid: boolean;

  /** Certificate subject */
  subject: string;

  /** Certificate issuer */
  issuer: string;

  /** Valid from date */
  validFrom: Date;

  /** Valid until date */
  validUntil: Date;

  /** Days until expiration */
  daysUntilExpiration: number;

  /** Validation errors */
  errors: string[];
}

/**
 * ELSTER API configuration
 */
export interface ElsterConfig {
  /** API base URL */
  apiUrl: string;

  /** ELSTER vendor ID */
  vendorId: string;

  /** Environment (sandbox or production) */
  environment: ElsterEnvironment;

  /** Request timeout in milliseconds */
  timeout: number;

  /** Maximum retries for failed requests */
  maxRetries: number;

  /** Retry delay in milliseconds */
  retryDelay: number;

  /** Certificate encryption key */
  certificateEncryptionKey: string;

  /** Enable request/response logging */
  enableLogging: boolean;
}

/**
 * ELSTER authentication credentials
 */
export interface ElsterAuthCredentials {
  /** Organization tax ID (Steuernummer) */
  taxId: string;

  /** Certificate for authentication */
  certificate: ElsterCertificate;

  /** Test mode flag */
  testMode: boolean;
}

/**
 * ELSTER transmission metadata
 */
export interface ElsterTransmissionMeta {
  /** Transmission ID */
  transmissionId: string;

  /** Data type (e.g., 'UStVA', 'ESt', 'Lohn') */
  dataType: string;

  /** Tax year */
  taxYear: number;

  /** Tax period (e.g., '01' for January) */
  taxPeriod?: string;

  /** Test submission flag */
  testSubmission: boolean;

  /** Compression enabled */
  compressed: boolean;

  /** Encryption enabled */
  encrypted: boolean;
}
