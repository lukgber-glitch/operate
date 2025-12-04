/**
 * Peppol Access Point TypeScript Types
 * CEF eDelivery AS4 Profile Conformant
 *
 * Standards:
 * - AS4 Profile (CEF eDelivery)
 * - UBL 2.1 (Invoice, Credit Note)
 * - ISO/IEC 6523 Participant IDs
 * - OASIS SMP 1.0
 */

/**
 * Peppol Configuration
 */
export interface PeppolConfig {
  accessPointUrl: string;
  participantId: string;
  certificatePath: string;
  privateKeyPath: string;
  certificatePassword: string;
  smlDomain: string; // e.g., 'isml.peppol.eu'
  environment: 'production' | 'test';
  mockMode: boolean;
  tlsMinVersion: 'TLSv1.3';
  certificatePinning: boolean;
  pinnedCertificates?: string[]; // SHA-256 fingerprints
}

/**
 * Peppol Participant Identifier
 * Format: scheme::identifier (e.g., "0192:987654321" for NO:ORGNR)
 */
export interface PeppolParticipantId {
  scheme: string; // ISO/IEC 6523 scheme (e.g., "0192" for NO:ORGNR)
  identifier: string; // Business identifier
  formatted: string; // Full format: "scheme::identifier"
}

/**
 * Peppol Document Identifier
 */
export interface PeppolDocumentId {
  scheme: string; // e.g., "busdox-docid-qns"
  identifier: string; // e.g., "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2::Invoice##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0::2.1"
}

/**
 * Peppol Process Identifier
 */
export interface PeppolProcessId {
  scheme: string; // e.g., "cenbii-procid-ubl"
  identifier: string; // e.g., "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0"
}

/**
 * UBL Document Types
 */
export enum PeppolDocumentType {
  INVOICE = 'Invoice',
  CREDIT_NOTE = 'CreditNote',
  APPLICATION_RESPONSE = 'ApplicationResponse',
}

/**
 * AS4 Message
 */
export interface AS4Message {
  messageId: string; // UUID
  conversationId: string; // UUID
  timestamp: Date;
  from: PeppolParticipantId;
  to: PeppolParticipantId;
  documentId: PeppolDocumentId;
  processId: PeppolProcessId;
  payload: string; // UBL XML document
  attachments?: AS4Attachment[];
}

/**
 * AS4 Attachment
 */
export interface AS4Attachment {
  contentId: string;
  mimeType: string;
  data: Buffer;
}

/**
 * AS4 Receipt/MDN (Message Disposition Notification)
 */
export interface AS4Receipt {
  messageId: string; // Original message ID
  timestamp: Date;
  status: AS4ReceiptStatus;
  errorCode?: string;
  errorDescription?: string;
  signature?: string; // Digital signature
}

/**
 * AS4 Receipt Status
 */
export enum AS4ReceiptStatus {
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  FAILURE = 'FAILURE',
}

/**
 * SMP (Service Metadata Publisher) Lookup Response
 */
export interface SMPResponse {
  participantId: PeppolParticipantId;
  documentTypes: SMPDocumentType[];
}

/**
 * SMP Document Type
 */
export interface SMPDocumentType {
  documentId: PeppolDocumentId;
  processIds: PeppolProcessId[];
  endpoints: SMPEndpoint[];
}

/**
 * SMP Endpoint
 */
export interface SMPEndpoint {
  transportProfile: string; // "peppol-transport-as4-v2_0"
  endpointUrl: string;
  requireBusinessLevelSignature: boolean;
  minimumAuthenticationLevel?: string;
  certificate: string; // X.509 certificate
  serviceActivationDate?: Date;
  serviceExpirationDate?: Date;
  technicalContactUrl?: string;
  technicalInformationUrl?: string;
}

/**
 * Peppol Certificate Info
 */
export interface PeppolCertificate {
  serialNumber: string;
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  fingerprint: string; // SHA-256
  publicKey: string;
  privateKey?: string; // Only for local certificates
  accessPointIdentifier: string;
}

/**
 * Peppol Message Status
 */
export enum PeppolMessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RECEIVED = 'RECEIVED',
  PROCESSED = 'PROCESSED',
  REJECTED = 'REJECTED',
}

/**
 * Peppol Transmission Log
 */
export interface PeppolTransmission {
  id: string;
  organizationId: string;
  messageId: string;
  conversationId: string;
  direction: 'OUTBOUND' | 'INBOUND';
  from: string; // Participant ID
  to: string; // Participant ID
  documentType: PeppolDocumentType;
  documentId: string; // Document identifier
  processId: string; // Process identifier
  status: PeppolMessageStatus;
  payload: string; // UBL XML
  receipt?: string; // AS4 receipt/MDN
  errorCode?: string;
  errorMessage?: string;
  sentAt?: Date;
  receivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Peppol Validation Error
 */
export interface PeppolValidationError {
  field: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
  code?: string;
}

/**
 * Peppol Validation Result
 */
export interface PeppolValidationResult {
  valid: boolean;
  errors: PeppolValidationError[];
  warnings: PeppolValidationError[];
}

/**
 * AS4 Security Profile
 */
export interface AS4SecurityProfile {
  signatureAlgorithm: 'RSA-SHA256';
  hashAlgorithm: 'SHA-256';
  encryptionAlgorithm?: 'AES-128-GCM' | 'AES-256-GCM';
  timestampRequired: boolean;
  certificateRequired: boolean;
}

/**
 * Peppol Audit Log Entry
 */
export interface PeppolAuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  action: PeppolAuditAction;
  messageId?: string;
  participantId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Peppol Audit Actions
 */
export enum PeppolAuditAction {
  MESSAGE_SEND = 'message:send',
  MESSAGE_RECEIVE = 'message:receive',
  SMP_LOOKUP = 'smp:lookup',
  CERTIFICATE_VALIDATE = 'certificate:validate',
  DOCUMENT_VALIDATE = 'document:validate',
  RECEIPT_SEND = 'receipt:send',
  RECEIPT_RECEIVE = 'receipt:receive',
  ERROR = 'error',
}

/**
 * Peppol Error Codes
 */
export enum PeppolErrorCode {
  INVALID_PARTICIPANT_ID = 'PEPPOL_001',
  INVALID_DOCUMENT = 'PEPPOL_002',
  SMP_LOOKUP_FAILED = 'PEPPOL_003',
  ENDPOINT_NOT_FOUND = 'PEPPOL_004',
  CERTIFICATE_INVALID = 'PEPPOL_005',
  CERTIFICATE_EXPIRED = 'PEPPOL_006',
  SIGNATURE_INVALID = 'PEPPOL_007',
  TRANSMISSION_FAILED = 'PEPPOL_008',
  RECEIPT_TIMEOUT = 'PEPPOL_009',
  UNSUPPORTED_DOCUMENT_TYPE = 'PEPPOL_010',
}

/**
 * Peppol Retry Policy
 */
export interface PeppolRetryPolicy {
  maxAttempts: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableErrors: string[];
}

/**
 * Peppol Rate Limit Info
 */
export interface PeppolRateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  endpoint: string;
}

/**
 * Peppol Webhook Event
 */
export interface PeppolWebhookEvent {
  eventType: PeppolEventType;
  messageId: string;
  participantId: string;
  timestamp: Date;
  data: Record<string, unknown>;
  signature?: string;
}

/**
 * Peppol Event Types
 */
export enum PeppolEventType {
  MESSAGE_RECEIVED = 'message:received',
  MESSAGE_DELIVERED = 'message:delivered',
  MESSAGE_FAILED = 'message:failed',
  RECEIPT_RECEIVED = 'receipt:received',
}

/**
 * UBL Invoice (simplified)
 */
export interface UBLInvoice {
  invoiceNumber: string;
  issueDate: Date;
  dueDate?: Date;
  currency: string;
  supplier: UBLParty;
  customer: UBLParty;
  lines: UBLInvoiceLine[];
  taxTotal: number;
  totalAmount: number;
  paymentMeans?: UBLPaymentMeans;
}

/**
 * UBL Party
 */
export interface UBLParty {
  participantId: PeppolParticipantId;
  name: string;
  address: {
    streetName?: string;
    cityName: string;
    postalZone: string;
    countryCode: string; // ISO 3166-1 alpha-2
  };
  vatId?: string;
  contact?: {
    name?: string;
    telephone?: string;
    email?: string;
  };
}

/**
 * UBL Invoice Line
 */
export interface UBLInvoiceLine {
  id: string;
  quantity: number;
  unitCode: string; // UN/ECE Rec 20
  description: string;
  priceAmount: number;
  lineExtensionAmount: number;
  taxPercent: number;
  taxAmount: number;
}

/**
 * UBL Payment Means
 */
export interface UBLPaymentMeans {
  paymentMeansCode: string; // UN/CEFACT 4461
  paymentId?: string;
  iban?: string;
  bic?: string;
  accountName?: string;
}
