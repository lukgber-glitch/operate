/**
 * Persona API Types
 * Type definitions for Persona KYC/KYB verification platform
 *
 * @see https://docs.withpersona.com/reference
 */

/**
 * Persona Inquiry Status
 * Represents the current state of a verification inquiry
 */
export enum PersonaInquiryStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  APPROVED = 'approved',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  NEEDS_REVIEW = 'needs_review',
  FAILED = 'failed',
}

/**
 * Persona Verification Status
 * Status of individual verification checks
 */
export enum PersonaVerificationStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  PENDING = 'pending',
  REQUIRES_RETRY = 'requires_retry',
  NOT_APPLICABLE = 'not_applicable',
}

/**
 * Persona Verification Types
 * Different types of verification checks available
 */
export enum PersonaVerificationType {
  GOVERNMENT_ID = 'government_id',
  SELFIE = 'selfie',
  DOCUMENT = 'document',
  DATABASE = 'database',
  WATCHLIST = 'watchlist',
  PHONE_NUMBER = 'phone_number',
  EMAIL_ADDRESS = 'email_address',
  BUSINESS_REGISTRATION = 'business_registration',
}

/**
 * Persona Verification Levels
 * Different depth levels for verification
 */
export enum PersonaVerificationLevel {
  BASIC = 'basic', // Name, DOB, Address
  ENHANCED = 'enhanced', // Basic + Government ID
  FULL = 'full', // Enhanced + Selfie + Database checks
  BUSINESS = 'business', // Business verification (KYB)
}

/**
 * Persona Webhook Event Types
 */
export enum PersonaWebhookEvent {
  INQUIRY_COMPLETED = 'inquiry.completed',
  INQUIRY_EXPIRED = 'inquiry.expired',
  INQUIRY_FAILED = 'inquiry.failed',
  INQUIRY_MARKED_FOR_REVIEW = 'inquiry.marked-for-review',
  INQUIRY_APPROVED = 'inquiry.approved',
  INQUIRY_DECLINED = 'inquiry.declined',
  VERIFICATION_CREATED = 'verification.created',
  VERIFICATION_PASSED = 'verification.passed',
  VERIFICATION_FAILED = 'verification.failed',
}

/**
 * Persona Configuration Interface
 */
export interface PersonaConfig {
  apiKey: string;
  environment: PersonaEnvironment;
  apiVersion: string;
  webhookSecret: string;
  baseUrl: string;
}

/**
 * Persona Environment
 */
export enum PersonaEnvironment {
  SANDBOX = 'sandbox',
  PRODUCTION = 'production',
}

/**
 * Persona API Response Types
 */
export interface PersonaApiResponse<T = any> {
  data: T;
  included?: any[];
  meta?: {
    page?: {
      size: number;
      number: number;
      total: number;
    };
  };
}

/**
 * Persona Inquiry Object
 */
export interface PersonaInquiryObject {
  type: 'inquiry';
  id: string;
  attributes: {
    status: PersonaInquiryStatus;
    'reference-id'?: string;
    'created-at': string;
    'completed-at'?: string;
    'expired-at'?: string;
    'redacted-at'?: string;
    fields?: Record<string, any>;
    tags?: string[];
  };
  relationships?: {
    template?: {
      data: {
        type: 'template';
        id: string;
      };
    };
    account?: {
      data: {
        type: 'account';
        id: string;
      };
    };
    verifications?: {
      data: Array<{
        type: string;
        id: string;
      }>;
    };
  };
}

/**
 * Persona Verification Object
 */
export interface PersonaVerificationObject {
  type: string;
  id: string;
  attributes: {
    status: PersonaVerificationStatus;
    'created-at': string;
    'submitted-at'?: string;
    'completed-at'?: string;
    'country-code'?: string;
    checks?: PersonaVerificationCheck[];
  };
}

/**
 * Persona Verification Check
 */
export interface PersonaVerificationCheck {
  name: string;
  status: PersonaVerificationStatus;
  reasons?: string[];
  requirement?: string;
  metadata?: Record<string, any>;
}

/**
 * Persona Inquiry Template
 */
export interface PersonaInquiryTemplate {
  id: string;
  name: string;
  version: number;
  verificationLevel: PersonaVerificationLevel;
  requiredFields: string[];
}

/**
 * Persona Session Token Response
 */
export interface PersonaSessionToken {
  meta: {
    'session-token': string;
  };
}

/**
 * Persona Webhook Payload
 */
export interface PersonaWebhookPayload {
  data: {
    type: string;
    id: string;
    attributes: Record<string, any>;
  };
}

/**
 * Persona Error Response
 */
export interface PersonaErrorResponse {
  errors: Array<{
    title: string;
    detail: string;
    source?: {
      pointer?: string;
      parameter?: string;
    };
    status?: string;
    code?: string;
  }>;
}

/**
 * Constants for Persona API
 */
export const PERSONA_API_BASE_URL = {
  [PersonaEnvironment.SANDBOX]: 'https://withpersona.com/api/v1',
  [PersonaEnvironment.PRODUCTION]: 'https://withpersona.com/api/v1',
};

export const PERSONA_API_VERSION = 'v1';

/**
 * Persona Webhook Event Names
 */
export const PERSONA_WEBHOOK_EVENTS = {
  INQUIRY_COMPLETED: 'inquiry.completed',
  INQUIRY_EXPIRED: 'inquiry.expired',
  INQUIRY_FAILED: 'inquiry.failed',
  INQUIRY_MARKED_FOR_REVIEW: 'inquiry.marked-for-review',
  INQUIRY_APPROVED: 'inquiry.approved',
  INQUIRY_DECLINED: 'inquiry.declined',
  VERIFICATION_CREATED: 'verification.created',
  VERIFICATION_PASSED: 'verification.passed',
  VERIFICATION_FAILED: 'verification.failed',
} as const;
