/**
 * FinanzOnline UVA (Umsatzsteuervoranmeldung) Types
 * Types for Austrian VAT advance return
 *
 * UVA = Umsatzsteuervoranmeldung (VAT advance return)
 * This is Austria's monthly/quarterly VAT declaration
 */

/**
 * Austrian VAT Rates
 */
export enum AustrianVATRate {
  /** Standard rate - 20% */
  STANDARD = 20,
  /** Reduced rate - 13% */
  REDUCED_13 = 13,
  /** Reduced rate - 10% */
  REDUCED_10 = 10,
  /** Parking rate - 13% (for specific goods/services) */
  PARKING = 13,
  /** Zero rate / Tax-free */
  ZERO = 0,
}

/**
 * UVA Period Type
 */
export enum UVAPeriodType {
  /** Monthly (for businesses with turnover > 100,000 EUR) */
  MONTHLY = 'monthly',
  /** Quarterly (for businesses with turnover <= 100,000 EUR) */
  QUARTERLY = 'quarterly',
  /** Annual (special cases) */
  ANNUAL = 'annual',
}

/**
 * UVA Submission Status
 */
export enum UVASubmissionStatus {
  /** Draft - not yet submitted */
  DRAFT = 'DRAFT',
  /** Pending submission */
  PENDING = 'PENDING',
  /** Submitted to FinanzOnline */
  SUBMITTED = 'SUBMITTED',
  /** Accepted by tax authority */
  ACCEPTED = 'ACCEPTED',
  /** Rejected by tax authority */
  REJECTED = 'REJECTED',
  /** Processing */
  PROCESSING = 'PROCESSING',
  /** Error during submission */
  ERROR = 'ERROR',
}

/**
 * UVA Kennzahlen (Form Field Codes)
 * These are the official Austrian tax form field numbers
 */
export interface UVAKennzahlen {
  // === LIEFERUNGEN UND LEISTUNGEN (Sales and Services) ===

  /** KZ 000: Gesamtbetrag der Bemessungsgrundlagen (Total tax base) */
  kz000?: number;

  /** KZ 001: davon steuerfrei mit Vorsteuerabzug (tax-free with input tax deduction) */
  kz001?: number;

  /** KZ 011: davon steuerfrei ohne Vorsteuerabzug (tax-free without input tax deduction) */
  kz011?: number;

  // === STEUERFREIE LIEFERUNGEN (Tax-free deliveries) ===

  /** KZ 020: Ausfuhrlieferungen (Exports) */
  kz020?: number;

  /** KZ 021: Innergemeinschaftliche Lieferungen (Intra-community deliveries) */
  kz021?: number;

  // === STEUERPFLICHTIGE LIEFERUNGEN (Taxable deliveries) ===

  /** KZ 022: Steuerpflichtige Lieferungen zum Normalsteuersatz 20% - Bemessungsgrundlage */
  kz022?: number;

  /** KZ 029: Steuerpflichtige Lieferungen zum Normalsteuersatz 20% - Steuer */
  kz029?: number;

  /** KZ 006: Steuerpflichtige Lieferungen zum ermäßigten Steuersatz 13% - Bemessungsgrundlage */
  kz006?: number;

  /** KZ 037: Steuerpflichtige Lieferungen zum ermäßigten Steuersatz 13% - Steuer */
  kz037?: number;

  /** KZ 007: Steuerpflichtige Lieferungen zum ermäßigten Steuersatz 10% - Bemessungsgrundlage */
  kz007?: number;

  /** KZ 008: Steuerpflichtige Lieferungen zum ermäßigten Steuersatz 10% - Steuer */
  kz008?: number;

  // === EIGENVERBRAUCH (Own consumption) ===

  /** KZ 060: Eigenverbrauch 20% - Bemessungsgrundlage */
  kz060?: number;

  /** KZ 061: Eigenverbrauch 20% - Steuer */
  kz061?: number;

  /** KZ 044: Eigenverbrauch 13% - Bemessungsgrundlage */
  kz044?: number;

  /** KZ 045: Eigenverbrauch 13% - Steuer */
  kz045?: number;

  /** KZ 025: Eigenverbrauch 10% - Bemessungsgrundlage */
  kz025?: number;

  /** KZ 026: Eigenverbrauch 10% - Steuer */
  kz026?: number;

  // === REVERSE CHARGE ===

  /** KZ 048: Reverse Charge - Bemessungsgrundlage */
  kz048?: number;

  /** KZ 088: Reverse Charge - Steuer */
  kz088?: number;

  // === INNERGEMEINSCHAFTLICHE ERWERBE (Intra-community acquisitions) ===

  /** KZ 070: IG-Erwerb zum Normalsteuersatz 20% - Bemessungsgrundlage */
  kz070?: number;

  /** KZ 071: IG-Erwerb zum Normalsteuersatz 20% - Steuer */
  kz071?: number;

  /** KZ 072: IG-Erwerb zum ermäßigten Steuersatz 13% - Bemessungsgrundlage */
  kz072?: number;

  /** KZ 073: IG-Erwerb zum ermäßigten Steuersatz 13% - Steuer */
  kz073?: number;

  /** KZ 008: IG-Erwerb zum ermäßigten Steuersatz 10% - Bemessungsgrundlage */
  kz008_ig?: number;

  /** KZ 009: IG-Erwerb zum ermäßigten Steuersatz 10% - Steuer */
  kz009?: number;

  // === VORSTEUER (Input VAT) ===

  /** KZ 060: Vorsteuer - Gesamtbetrag (Total input VAT) */
  kz060_vorsteuer?: number;

  /** KZ 061: davon abziehbar (deductible) */
  kz061_vorsteuer?: number;

  /** KZ 083: Vorsteuer aus innergemeinschaftlichen Erwerben */
  kz083?: number;

  /** KZ 065: Vorsteuer aus Reverse Charge */
  kz065?: number;

  /** KZ 066: Vorsteuer aus Einfuhr (Import VAT) */
  kz066?: number;

  /** KZ 082: Vorsteuer aus dem innergemeinschaftlichen Dreiecksgeschäft */
  kz082?: number;

  // === VORAUSZAHLUNG (Advance payment) ===

  /** KZ 095: Vorauszahlung (Advance payment due) */
  kz095?: number;

  /** KZ 096: Gutschrift (Credit/refund) */
  kz096?: number;

  // === SONSTIGE ANGABEN (Other information) ===

  /** KZ 090: Berichtigungen (Corrections) */
  kz090?: number;

  /** KZ 092: Nachforderungen (Additional claims) */
  kz092?: number;
}

/**
 * UVA Calculation Data
 * Structured data for UVA calculation
 */
export interface UVACalculationData {
  /** Total sales at 20% */
  sales20: number;
  /** VAT at 20% */
  vat20: number;

  /** Total sales at 13% */
  sales13: number;
  /** VAT at 13% */
  vat13: number;

  /** Total sales at 10% */
  sales10: number;
  /** VAT at 10% */
  vat10: number;

  /** Tax-free sales with input tax deduction */
  taxFreeSalesWithDeduction: number;

  /** Tax-free sales without input tax deduction */
  taxFreeSalesWithoutDeduction: number;

  /** Export deliveries (tax-free) */
  exports: number;

  /** Intra-community deliveries (tax-free) */
  intraCommunityDeliveries: number;

  /** Intra-community acquisitions at 20% */
  intraCommunityAcquisitions20: number;
  /** VAT on IC acquisitions at 20% */
  vatIntraCommunity20: number;

  /** Intra-community acquisitions at 13% */
  intraCommunityAcquisitions13: number;
  /** VAT on IC acquisitions at 13% */
  vatIntraCommunity13: number;

  /** Reverse charge base */
  reverseChargeBase: number;
  /** Reverse charge VAT */
  reverseChargeVAT: number;

  /** Total input VAT (Vorsteuer) */
  totalInputVAT: number;

  /** Input VAT from intra-community acquisitions */
  inputVATIntraCommunity: number;

  /** Input VAT from reverse charge */
  inputVATReverseCharge: number;

  /** Input VAT from imports */
  inputVATImports: number;

  /** Own consumption at 20% */
  ownConsumption20: number;
  /** VAT on own consumption at 20% */
  vatOwnConsumption20: number;

  /** Corrections from previous periods */
  corrections: number;

  /** Previous advance payments */
  previousAdvancePayments: number;
}

/**
 * UVA Submission Data
 */
export interface UVASubmissionData {
  /** Organization ID */
  organizationId: string;

  /** Tax year */
  taxYear: number;

  /** Tax period (Q1, Q2, Q3, Q4 for quarterly or 01-12 for monthly) */
  taxPeriod: string;

  /** Period type */
  periodType: UVAPeriodType;

  /** Participant ID (Teilnehmer-ID) */
  teilnehmerId: string;

  /** Tax number (Steuernummer) */
  taxNumber: string;

  /** VAT ID (UID-Nummer) */
  vatId?: string;

  /** UVA Kennzahlen (form fields) */
  kennzahlen: UVAKennzahlen;

  /** Calculation data (for reference) */
  calculationData: UVACalculationData;

  /** Total VAT payable (positive) or refundable (negative) */
  totalVAT: number;

  /** Test submission flag */
  testSubmission: boolean;

  /** Special circumstances note */
  specialCircumstances?: string;

  /** Submission metadata */
  metadata?: Record<string, any>;
}

/**
 * UVA Submission Result
 */
export interface UVASubmissionResult {
  /** Submission ID */
  submissionId: string;

  /** Transfer ticket from FinanzOnline */
  transferTicket?: string;

  /** Submission status */
  status: UVASubmissionStatus;

  /** Submission timestamp */
  submittedAt: Date;

  /** Response from FinanzOnline */
  response?: {
    code: string;
    message: string;
    details?: any;
  };

  /** Errors */
  errors: Array<{
    code: string;
    message: string;
    field?: string;
    severity: 'error' | 'warning' | 'info';
  }>;

  /** Warnings */
  warnings: Array<{
    code: string;
    message: string;
    field?: string;
  }>;

  /** Receipt number (if available) */
  receiptNumber?: string;

  /** Next due date (if applicable) */
  nextDueDate?: Date;
}

/**
 * UVA History Entry
 */
export interface UVAHistoryEntry {
  /** Submission ID */
  submissionId: string;

  /** Organization ID */
  organizationId: string;

  /** Tax year */
  taxYear: number;

  /** Tax period */
  taxPeriod: string;

  /** Period type */
  periodType: UVAPeriodType;

  /** Total VAT amount */
  totalVAT: number;

  /** Submission status */
  status: UVASubmissionStatus;

  /** Submitted at */
  submittedAt: Date;

  /** Submitted by user */
  submittedBy: string;

  /** Transfer ticket */
  transferTicket?: string;

  /** Receipt number */
  receiptNumber?: string;

  /** Last updated */
  updatedAt: Date;
}

/**
 * UVA Validation Result
 */
export interface UVAValidationResult {
  /** Validation passed */
  valid: boolean;

  /** Validation errors */
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;

  /** Validation warnings */
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;

  /** Business logic checks */
  businessChecks: {
    /** Total calculation matches */
    totalsMatch: boolean;
    /** Expected total VAT */
    expectedTotal: number;
    /** Calculated total VAT */
    calculatedTotal: number;
    /** Difference */
    difference: number;
  };

  /** Period validation */
  periodValidation: {
    /** Period is valid for organization */
    valid: boolean;
    /** Required period type */
    requiredPeriodType: UVAPeriodType;
    /** Reason if invalid */
    reason?: string;
  };
}

/**
 * UVA Preparation Options
 */
export interface UVAPreparationOptions {
  /** Organization ID */
  organizationId: string;

  /** Tax year */
  taxYear: number;

  /** Tax period */
  taxPeriod: string;

  /** Period type */
  periodType: UVAPeriodType;

  /** Include draft invoices */
  includeDrafts?: boolean;

  /** Apply corrections */
  applyCorrections?: boolean;

  /** Calculate automatically */
  autoCalculate?: boolean;

  /** Previous advance payment */
  previousAdvancePayment?: number;
}
