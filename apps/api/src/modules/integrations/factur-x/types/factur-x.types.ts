/**
 * Factur-X Type Definitions (France)
 *
 * Factur-X is the French version of ZUGFeRD, following the same EN 16931 standard
 * with additional French regulatory requirements.
 *
 * Standards:
 * - EN 16931-1:2017 (European e-invoicing semantic model)
 * - Cross Industry Invoice (CII) D16B
 * - PDF/A-3 (ISO 19005-3)
 * - French tax regulations (TVA, SIRET)
 */

import { ZugferdProfile } from '../../../e-invoice/types/zugferd.types';

/**
 * Factur-X Profile Levels
 * Aligned with ZUGFeRD profiles but commonly used in French context
 */
export enum FacturXProfile {
  MINIMUM = 'MINIMUM',
  BASIC_WL = 'BASIC_WL',
  BASIC = 'BASIC',
  EN16931 = 'EN16931',
  EXTENDED = 'EXTENDED',
}

/**
 * French Business Identifier Types
 */
export interface FrenchBusinessIdentifiers {
  siret?: string; // 14-digit SIRET number
  siren?: string; // 9-digit SIREN number
  tva?: string; // TVA intra-communautaire (e.g., FR12345678901)
  codeAPE?: string; // Activity code (APE/NAF)
}

/**
 * French Address (with specific postal format)
 */
export interface FrenchAddress {
  line1: string;
  line2?: string;
  line3?: string;
  postalCode: string; // French postal code (5 digits)
  city: string;
  country: string; // ISO 3166-1 alpha-2 (FR for France)
  cedex?: string; // CEDEX code if applicable
}

/**
 * French Party Information
 */
export interface FrenchParty {
  name: string;
  legalName?: string; // Raison sociale
  tradeName?: string; // Nom commercial
  address: FrenchAddress;
  identifiers: FrenchBusinessIdentifiers;
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  electronicAddress?: string; // For Peppol/Chorus Pro
}

/**
 * French VAT Information
 */
export interface FrenchVATInfo {
  rate: number; // 20%, 10%, 5.5%, 2.1%, or 0%
  category: FrenchVATCategory;
  exemptionReason?: string; // Required for exempt/reverse charge
  amount: number;
}

/**
 * French VAT Categories
 */
export enum FrenchVATCategory {
  STANDARD = 'S', // Taux normal (20%)
  REDUCED = 'AA', // Taux réduit (10%)
  SUPER_REDUCED = 'AB', // Taux super réduit (5.5% or 2.1%)
  ZERO_RATED = 'Z', // Taux zéro
  EXEMPT = 'E', // Exonéré
  REVERSE_CHARGE = 'AE', // Autoliquidation
  INTRA_EU = 'K', // Intracommunautaire
  EXPORT = 'G', // Export hors UE
}

/**
 * French Invoice Type Codes
 */
export enum FrenchInvoiceType {
  COMMERCIAL = '380', // Facture commerciale
  CREDIT_NOTE = '381', // Avoir
  DEBIT_NOTE = '383', // Note de débit
  CORRECTIVE = '384', // Facture rectificative
  SELF_BILLED = '389', // Autofacture
  PREPAYMENT = '386', // Facture d'acompte
}

/**
 * French Payment Means Codes (UN/CEFACT 4461)
 */
export enum FrenchPaymentMeans {
  BANK_TRANSFER = '30', // Virement
  DIRECT_DEBIT = '49', // Prélèvement
  CARD = '48', // Carte bancaire
  CHECK = '20', // Chèque
  CASH = '10', // Espèces
  STANDING_ORDER = '42', // Ordre permanent
}

/**
 * Factur-X Invoice Data (French-specific)
 */
export interface FacturXInvoiceData {
  // Basic identification
  number: string;
  issueDate: Date;
  dueDate?: Date;
  deliveryDate?: Date;
  type: FrenchInvoiceType;

  // Currency (usually EUR for France)
  currency: string;

  // French parties
  seller: FrenchParty;
  buyer: FrenchParty;

  // Line items
  items: FacturXLineItem[];

  // French VAT breakdown
  vatBreakdown: FrenchVATBreakdown[];

  // Totals
  subtotal: number; // Total HT (hors taxes)
  totalVAT: number; // Total TVA
  totalAmount: number; // Total TTC (toutes taxes comprises)

  // Payment information
  paymentTerms?: string;
  paymentMeans?: FrenchPaymentMeans;
  paymentDueDate?: Date;
  bankAccount?: {
    iban: string;
    bic?: string;
    bankName?: string;
  };

  // French legal mentions
  legalMentions?: FrenchLegalMentions;

  // References
  purchaseOrderReference?: string;
  contractReference?: string;
  customerReference?: string;

  // Notes
  notes?: string;

  // Metadata
  metadata?: Record<string, unknown>;
}

/**
 * Factur-X Line Item
 */
export interface FacturXLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string; // UN/ECE Rec 20 code
  unitPrice: number; // Prix unitaire HT
  netAmount: number; // Montant HT ligne
  vat: FrenchVATInfo;
  productCode?: string;
  discount?: {
    rate?: number;
    amount?: number;
    reason?: string;
  };
}

/**
 * French VAT Breakdown by Rate
 */
export interface FrenchVATBreakdown {
  rate: number;
  category: FrenchVATCategory;
  taxableAmount: number; // Base HT
  vatAmount: number; // Montant TVA
}

/**
 * French Legal Mentions Required on Invoices
 */
export interface FrenchLegalMentions {
  // Mandatory mentions
  rcs?: string; // RCS registration (if company)
  capital?: string; // Capital social
  tvaExemptionMention?: string; // For TVA-exempt entities

  // Optional but recommended
  intracommunautaryNotice?: boolean; // "Autoliquidation" mention
  reverseChargeMention?: string; // Custom reverse charge text
  penaltyClause?: string; // Clause pénale (late payment)
  discountTerms?: string; // Conditions d'escompte

  // For specific cases
  microEnterpriseMention?: boolean; // "TVA non applicable, art. 293 B du CGI"
  customMention?: string; // Any other legal text
}

/**
 * Factur-X Generation Options
 */
export interface FacturXGenerationOptions {
  profile: FacturXProfile;
  language?: 'fr-FR' | 'en-GB'; // Invoice language
  includeVisualPdf?: boolean; // Generate human-readable PDF
  embedXmlOnly?: boolean; // Only embed XML, don't generate PDF
  validateSIRET?: boolean; // Validate SIRET number
  validateTVA?: boolean; // Validate TVA number
  pdfTemplate?: Buffer; // Optional custom PDF template
  additionalAttachments?: FacturXAttachment[];
}

/**
 * Factur-X Attachment
 */
export interface FacturXAttachment {
  filename: string;
  mimeType: string;
  data: Buffer;
  description?: string;
}

/**
 * Factur-X Validation Result
 */
export interface FacturXValidationResult {
  valid: boolean;
  errors: FacturXValidationError[];
  warnings: FacturXValidationWarning[];
  profile?: FacturXProfile;
  metadata?: {
    hasEmbeddedXml: boolean;
    isPdfA3: boolean;
    xmlValidated: boolean;
    frenchComplianceChecked: boolean;
  };
}

/**
 * Factur-X Validation Error
 */
export interface FacturXValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error';
  regulation?: string; // e.g., 'EN 16931', 'TVA', 'SIRET'
}

/**
 * Factur-X Validation Warning
 */
export interface FacturXValidationWarning {
  code: string;
  message: string;
  field?: string;
  severity: 'warning';
  regulation?: string;
}

/**
 * Factur-X Parser Result
 */
export interface FacturXParseResult {
  success: boolean;
  invoice?: FacturXInvoiceData;
  xml?: string;
  errors?: FacturXValidationError[];
  metadata?: {
    profile: FacturXProfile;
    version: string;
    createdAt: Date;
  };
}

/**
 * Peppol Integration Options for Factur-X
 */
export interface FacturXPeppolOptions {
  sendViaPeppol?: boolean;
  recipientParticipantId?: string; // Peppol participant ID
  recipientScheme?: string; // e.g., "0002" for SIRET in Peppol
  attachOriginalPdf?: boolean; // Attach visual PDF to Peppol message
}

/**
 * Chorus Pro Integration Options (French B2G)
 */
export interface ChorusProOptions {
  sendToChorusPro?: boolean;
  recipientSIRET?: string;
  serviceCode?: string; // Code service
  commitment?: string; // Engagement number
  structureId?: string; // Chorus Pro structure ID
}

/**
 * Factur-X Transmission Result
 */
export interface FacturXTransmissionResult {
  success: boolean;
  messageId?: string;
  transmissionId?: string;
  peppolMessageId?: string;
  chorusProId?: string;
  status: 'SENT' | 'PENDING' | 'FAILED';
  timestamp: Date;
  errors?: string[];
}

/**
 * French Tax Regime Types
 */
export enum FrenchTaxRegime {
  REAL_NORMAL = 'REAL_NORMAL', // Régime réel normal
  REAL_SIMPLIFIED = 'REAL_SIMPLIFIED', // Régime réel simplifié
  MICRO = 'MICRO', // Micro-entreprise
  FRANCHISE = 'FRANCHISE', // Franchise en base de TVA
}

/**
 * Factur-X Configuration
 */
export interface FacturXConfig {
  defaultProfile: FacturXProfile;
  defaultLanguage: 'fr-FR' | 'en-GB';
  validateBeforeGeneration: boolean;
  autoSendViaPeppol: boolean;
  enableChorusPro: boolean;
  siretValidationEnabled: boolean;
  tvaValidationEnabled: boolean;
  defaultCurrency: string;
  pdfGenerator: 'internal' | 'external';
}
