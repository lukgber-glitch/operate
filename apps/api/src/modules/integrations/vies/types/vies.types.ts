/**
 * VIES Integration Types
 * Central type definitions for the VIES VAT validation module
 */

/**
 * VAT validation request
 */
export interface VatValidationRequest {
  vatNumber: string;
  countryCode?: string;
  skipCache?: boolean;
}

/**
 * Bulk VAT validation request
 */
export interface BulkVatValidationRequest {
  vatNumbers: string[];
  skipCache?: boolean;
}

/**
 * VIES SOAP request payload
 */
export interface ViesSoapRequest {
  countryCode: string;
  vatNumber: string;
}

/**
 * Cross-border transaction context
 */
export interface CrossBorderContext {
  supplierCountry: string;
  customerCountry: string;
  customerVatNumber?: string;
  customerVatValid?: boolean;
  transactionDate?: Date;
}

/**
 * VAT treatment rules
 */
export enum VatTreatment {
  DOMESTIC = 'DOMESTIC',
  REVERSE_CHARGE = 'REVERSE_CHARGE',
  CROSS_BORDER_B2C = 'CROSS_BORDER_B2C',
  DISTANCE_SELLING = 'DISTANCE_SELLING',
}

/**
 * Cache configuration for VIES
 */
export interface ViesCacheConfig {
  successTtl: number; // TTL for successful validations (seconds)
  failureTtl: number; // TTL for failed validations (seconds)
  prefix: string; // Redis key prefix
}

/**
 * VIES service configuration
 */
export interface ViesServiceConfig {
  wsdlUrl: string;
  endpointUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  cache: ViesCacheConfig;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // Base delay in milliseconds
  maxDelay: number; // Maximum delay in milliseconds
  backoffMultiplier: number; // Exponential backoff multiplier
}

/**
 * Service health status
 */
export interface ViesHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  viesAvailable: boolean;
  cacheAvailable: boolean;
  lastSuccessfulCheck?: string;
  lastError?: string;
  responseTime?: number;
}

/**
 * VAT validation statistics
 */
export interface ViesStatistics {
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  viesErrors: Record<string, number>;
}

/**
 * Validation metadata
 */
export interface ValidationMetadata {
  requestId?: string;
  timestamp: string;
  source: 'vies' | 'cache';
  responseTime?: number;
  retryCount?: number;
}

/**
 * Extended VAT validation result with metadata
 */
export interface ExtendedVatValidationResult {
  valid: boolean;
  countryCode: string;
  vatNumber: string;
  requestDate: string;
  name?: string;
  address?: string;
  cached: boolean;
  cacheExpiry?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: ValidationMetadata;
}

/**
 * VIES error details
 */
export interface ViesErrorDetails {
  code: string;
  message: string;
  recoverable: boolean;
  retryAfter?: number;
  timestamp: string;
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
}

/**
 * Admin operations
 */
export interface CacheClearOptions {
  countryCode?: string;
  vatNumber?: string;
  pattern?: string;
}

/**
 * Audit log entry for VAT validation
 */
export interface VatValidationAuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  organizationId?: string;
  vatNumber: string;
  countryCode: string;
  result: boolean;
  cached: boolean;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Webhook payload for VAT validation events
 */
export interface VatValidationWebhook {
  event: 'vat.validation.completed' | 'vat.validation.failed';
  timestamp: string;
  data: {
    vatNumber: string;
    countryCode: string;
    valid: boolean;
    cached: boolean;
    errorCode?: string;
  };
}

/**
 * Batch validation job
 */
export interface BatchValidationJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalCount: number;
  processedCount: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  completedAt?: string;
  results?: ExtendedVatValidationResult[];
  errors?: ViesErrorDetails[];
}
