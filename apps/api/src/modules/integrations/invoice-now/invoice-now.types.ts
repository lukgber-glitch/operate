/**
 * InvoiceNow Service-specific Types
 * Internal types used by the InvoiceNow service
 */

import {
  InvoiceNowDocument,
  InvoiceNowParticipant,
  PeppolMessageStatus,
  InvoiceNowValidationError,
} from '@operate/shared/types/integrations/invoice-now.types';

/**
 * UEN Validation Service Response
 */
export interface UenValidationServiceResponse {
  isValid: boolean;
  uen: string;
  type?: 'BUSINESS' | 'LOCAL_COMPANY' | 'FOREIGN_COMPANY' | 'OTHER';
  entityName?: string;
  registrationDate?: Date;
  status?: 'ACTIVE' | 'CANCELLED' | 'STRUCK_OFF';
  gstRegistered?: boolean;
  errors?: string[];
}

/**
 * GST Validation Service Response
 */
export interface GstValidationServiceResponse {
  isValid: boolean;
  gstNumber: string;
  uen?: string;
  effectiveDate?: Date;
  status?: 'ACTIVE' | 'INACTIVE';
  errors?: string[];
}

/**
 * Send Document Request
 */
export interface SendDocumentRequest {
  organizationId: string;
  document: InvoiceNowDocument;
}

/**
 * Send Document Response
 */
export interface SendDocumentResponse {
  messageId: string;
  conversationId: string;
  status: PeppolMessageStatus;
  timestamp: Date;
  errors?: InvoiceNowValidationError[];
}

/**
 * Receive Document Request
 */
export interface ReceiveDocumentRequest {
  organizationId: string;
  soapEnvelope: string;
}

/**
 * Receive Document Response
 */
export interface ReceiveDocumentResponse {
  messageId: string;
  receiptId: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  timestamp: Date;
  errors?: InvoiceNowValidationError[];
}

/**
 * Validate Participant Request
 */
export interface ValidateParticipantRequest {
  uen: string;
  validateGst?: boolean;
}

/**
 * Validate Participant Response
 */
export interface ValidateParticipantResponse {
  isValid: boolean;
  uen: string;
  participantId?: string;
  registered: boolean;
  documentTypes?: string[];
  errors?: string[];
}

/**
 * Get Transmission Status Request
 */
export interface GetTransmissionStatusRequest {
  messageId: string;
}

/**
 * Get Transmission Status Response
 */
export interface GetTransmissionStatusResponse {
  messageId: string;
  status: PeppolMessageStatus;
  documentType: string;
  invoiceNumber: string;
  fromUen: string;
  toUen: string;
  sentAt?: Date;
  deliveredAt?: Date;
  acknowledgedAt?: Date;
  errors?: InvoiceNowValidationError[];
}

/**
 * UBL Generation Options
 */
export interface UblGenerationOptions {
  includeAttachments?: boolean;
  includePdfRepresentation?: boolean;
  customizationId?: string;
  profileId?: string;
  validateBeforeGeneration?: boolean;
}

/**
 * Peppol Lookup Result
 */
export interface PeppolLookupResult {
  participantId: string;
  endpointUrl: string;
  certificate: string;
  transportProfile: string;
  documentTypes: string[];
}

/**
 * InvoiceNow Service Config
 */
export interface InvoiceNowServiceConfig {
  enabled: boolean;
  environment: 'production' | 'test';
  peppolAccessPointUrl: string;
  participantUen: string;
  smlDomain: string;
  mockMode: boolean;
  validateUen: boolean;
  validateGst: boolean;
  autoAcknowledge: boolean;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Message Transmission Log Entry
 */
export interface TransmissionLogEntry {
  id: string;
  organizationId: string;
  messageId: string;
  conversationId: string;
  direction: 'OUTBOUND' | 'INBOUND';
  documentType: string;
  invoiceNumber: string;
  fromUen: string;
  toUen: string;
  status: PeppolMessageStatus;
  ublXml: string;
  as4MessageId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  acknowledgedAt?: Date;
  errorCode?: string;
  errorMessage?: string;
  validationErrors?: InvoiceNowValidationError[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
