/**
 * Chorus Pro Type Definitions (France B2G)
 *
 * Chorus Pro is the French government's e-invoicing portal for Business-to-Government (B2G)
 * transactions. It's mandatory for all suppliers invoicing French public entities since 2020.
 *
 * API Documentation: https://chorus-pro.gouv.fr/documentation
 * Authentication: OAuth2 via PISTE (https://piste.gouv.fr)
 * Invoice Format: Factur-X (PDF/A-3 with embedded XML)
 *
 * Standards:
 * - EN 16931-1:2017 (European e-invoicing)
 * - Factur-X format mandatory
 * - OAuth2 for authentication
 * - French public sector specific fields
 */

/**
 * Chorus Pro Invoice Status
 */
export enum ChorusProInvoiceStatus {
  DEPOSEE = 'DEPOSEE', // Submitted
  EN_COURS_DE_TRAITEMENT = 'EN_COURS_DE_TRAITEMENT', // Processing
  MISE_A_DISPOSITION = 'MISE_A_DISPOSITION', // Available to public entity
  REJETEE = 'REJETEE', // Rejected
  SUSPENDUE = 'SUSPENDUE', // Suspended
  RECYCLEE = 'RECYCLEE', // Recycled (resubmitted after rejection)
  MANDATEE = 'MANDATEE', // Payment ordered
  MISE_EN_PAIEMENT = 'MISE_EN_PAIEMENT', // In payment
  SOLDEE = 'SOLDEE', // Paid
}

/**
 * Chorus Pro Entity Types
 */
export enum ChorusProEntityType {
  PUBLIC_ENTITY = 'PUBLIC_ENTITY', // Entité publique
  PRIVATE_ENTITY = 'PRIVATE_ENTITY', // Entité privée (supplier)
}

/**
 * Chorus Pro Invoice Type
 */
export enum ChorusProInvoiceType {
  FACTURE = 'FACTURE', // Standard invoice
  AVOIR = 'AVOIR', // Credit note
  ACOMPTE = 'ACOMPTE', // Advance payment
  FACTURE_RECTIFICATIVE = 'FACTURE_RECTIFICATIVE', // Corrective invoice
  MEMOIRE = 'MEMOIRE', // Fee note (professions libérales)
}

/**
 * Chorus Pro Document Format
 */
export enum ChorusProDocumentFormat {
  FACTURX = 'FACTURX', // Factur-X format (mandatory)
  PDF = 'PDF', // Simple PDF (deprecated)
  UBL = 'UBL', // UBL XML format
  CII = 'CII', // Cross Industry Invoice XML
}

/**
 * Chorus Pro Structure (Public Entity)
 */
export interface ChorusProStructure {
  structureId?: string; // Chorus Pro internal ID
  siret: string; // 14-digit SIRET of public entity
  name: string; // Entity name
  serviceCode?: string; // Service code (code service destinataire)
  type: ChorusProEntityType;
  isActive: boolean;
}

/**
 * Chorus Pro Service Reference
 * Used to identify the specific department/service within a public entity
 */
export interface ChorusProServiceReference {
  serviceCode: string; // Code service (mandatory for public entities)
  serviceName?: string;
  departmentCode?: string;
  budgetCode?: string;
}

/**
 * Chorus Pro Engagement
 * Financial engagement/commitment reference required for public sector
 */
export interface ChorusProEngagement {
  engagementNumber: string; // Numéro d'engagement (mandatory for some entities)
  engagementDate?: Date;
  amount?: number;
  budgetLine?: string; // Ligne budgétaire
}

/**
 * Chorus Pro Invoice Submission Request
 */
export interface ChorusProSubmitInvoiceRequest {
  // Invoice identification
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceType: ChorusProInvoiceType;

  // Supplier (fournisseur)
  supplierSiret: string;
  supplierName: string;

  // Public entity (destinataire)
  recipientSiret: string;
  recipientName: string;
  serviceReference?: ChorusProServiceReference;

  // Engagement (optional but often required)
  engagement?: ChorusProEngagement;

  // Amounts
  amountExcludingTax: number; // Montant HT
  vatAmount: number; // Montant TVA
  amountIncludingTax: number; // Montant TTC

  // Document
  documentFormat: ChorusProDocumentFormat;
  documentData: Buffer; // Factur-X PDF or XML
  attachments?: ChorusProAttachment[];

  // References
  purchaseOrderNumber?: string; // Numéro de bon de commande
  contractReference?: string;
  customerReference?: string;

  // Comments
  comments?: string;

  // Technical routing
  structureId?: string; // Chorus Pro structure ID (optional)
  routingMode?: 'AUTO' | 'MANUAL';
}

/**
 * Chorus Pro Attachment
 */
export interface ChorusProAttachment {
  filename: string;
  mimeType: string;
  data: Buffer;
  description?: string;
  type?: 'JUSTIFICATIF' | 'AUTRE'; // Supporting document or other
}

/**
 * Chorus Pro Invoice Submission Response
 */
export interface ChorusProSubmitInvoiceResponse {
  success: boolean;
  chorusInvoiceId?: string; // Chorus Pro internal invoice ID
  depositNumber?: string; // Numéro de dépôt
  depositDate?: Date;
  status: ChorusProInvoiceStatus;
  validationMessages?: ChorusProValidationMessage[];
  errors?: string[];
}

/**
 * Chorus Pro Validation Message
 */
export interface ChorusProValidationMessage {
  code: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  field?: string;
}

/**
 * Chorus Pro Invoice Status Query Request
 */
export interface ChorusProStatusRequest {
  chorusInvoiceId?: string;
  invoiceNumber?: string;
  supplierSiret?: string;
  recipientSiret?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Chorus Pro Invoice Status Response
 */
export interface ChorusProStatusResponse {
  success: boolean;
  invoices: ChorusProInvoiceInfo[];
}

/**
 * Chorus Pro Invoice Information
 */
export interface ChorusProInvoiceInfo {
  chorusInvoiceId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceType: ChorusProInvoiceType;
  status: ChorusProInvoiceStatus;
  statusDate: Date;
  statusHistory: ChorusProStatusHistoryEntry[];

  // Parties
  supplierSiret: string;
  supplierName: string;
  recipientSiret: string;
  recipientName: string;

  // Amounts
  amountExcludingTax: number;
  vatAmount: number;
  amountIncludingTax: number;

  // Dates
  depositDate: Date;
  processingDate?: Date;
  paymentDate?: Date;

  // References
  depositNumber: string;
  serviceCode?: string;
  engagementNumber?: string;

  // Rejection info (if applicable)
  rejectionReason?: string;
  rejectionDate?: Date;

  // Payment info (if applicable)
  paymentReference?: string;
  paymentAmount?: number;
}

/**
 * Chorus Pro Status History Entry
 */
export interface ChorusProStatusHistoryEntry {
  status: ChorusProInvoiceStatus;
  date: Date;
  comment?: string;
  author?: string;
}

/**
 * Chorus Pro Entity Lookup Request
 */
export interface ChorusProEntityLookupRequest {
  siret: string;
  name?: string;
}

/**
 * Chorus Pro Entity Lookup Response
 */
export interface ChorusProEntityLookupResponse {
  success: boolean;
  entity?: {
    siret: string;
    name: string;
    structureId?: string;
    services: ChorusProServiceInfo[];
    isRegistered: boolean;
    acceptsInvoices: boolean;
  };
  error?: string;
}

/**
 * Chorus Pro Service Info
 */
export interface ChorusProServiceInfo {
  serviceCode: string;
  serviceName: string;
  isActive: boolean;
  requiresEngagement: boolean;
  acceptedFormats: ChorusProDocumentFormat[];
}

/**
 * Chorus Pro OAuth2 Token
 */
export interface ChorusProToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: Date;
  refreshToken?: string;
  scope?: string;
}

/**
 * Chorus Pro Authentication Config
 */
export interface ChorusProAuthConfig {
  pisteUrl: string; // PISTE OAuth2 URL
  clientId: string;
  clientSecret: string;
  scope?: string;
  certificatePath?: string; // Optional client certificate
}

/**
 * Chorus Pro API Config
 */
export interface ChorusProApiConfig {
  baseUrl: string; // Chorus Pro API base URL
  version: string; // API version (e.g., 'v1')
  timeout: number; // Request timeout in ms
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Chorus Pro Service Configuration
 */
export interface ChorusProConfig {
  auth: ChorusProAuthConfig;
  api: ChorusProApiConfig;
  defaultFormat: ChorusProDocumentFormat;
  autoRetry: boolean;
  enableAuditLog: boolean;
}

/**
 * Chorus Pro API Error
 */
export interface ChorusProApiError {
  code: string;
  message: string;
  details?: unknown;
  httpStatus?: number;
  timestamp: Date;
}

/**
 * Chorus Pro Invoice Download Request
 */
export interface ChorusProDownloadRequest {
  chorusInvoiceId: string;
  format?: 'PDF' | 'XML' | 'FACTURX';
}

/**
 * Chorus Pro Invoice Download Response
 */
export interface ChorusProDownloadResponse {
  success: boolean;
  data?: Buffer;
  filename?: string;
  mimeType?: string;
  error?: string;
}

/**
 * Chorus Pro Rejection Reason Codes
 */
export enum ChorusProRejectionReason {
  MONTANT_INCORRECT = 'MONTANT_INCORRECT', // Incorrect amount
  SIRET_INVALIDE = 'SIRET_INVALIDE', // Invalid SIRET
  SERVICE_INTROUVABLE = 'SERVICE_INTROUVABLE', // Service not found
  ENGAGEMENT_ABSENT = 'ENGAGEMENT_ABSENT', // Missing engagement
  FORMAT_INVALIDE = 'FORMAT_INVALIDE', // Invalid format
  FACTURE_DOUBLON = 'FACTURE_DOUBLON', // Duplicate invoice
  DONNEES_INCOMPLETES = 'DONNEES_INCOMPLETES', // Incomplete data
  AUTRE = 'AUTRE', // Other reason
}

/**
 * Chorus Pro Statistics
 */
export interface ChorusProStatistics {
  totalSubmitted: number;
  totalAccepted: number;
  totalRejected: number;
  totalPaid: number;
  averageProcessingTime: number; // in days
  averagePaymentTime: number; // in days
  byStatus: Record<ChorusProInvoiceStatus, number>;
  byMonth: Record<string, number>;
}

/**
 * Chorus Pro Webhook Event
 */
export interface ChorusProWebhookEvent {
  eventType: 'STATUS_CHANGE' | 'PAYMENT' | 'REJECTION';
  chorusInvoiceId: string;
  invoiceNumber: string;
  status: ChorusProInvoiceStatus;
  timestamp: Date;
  data: unknown;
}
