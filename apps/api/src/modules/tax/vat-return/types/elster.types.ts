/**
 * ELSTER VAT Return Types
 *
 * Types for German VAT return submission via ELSTER
 */

/**
 * ELSTER Kennzahlen (Tax Form Fields)
 * All amounts are in cents to avoid floating-point issues
 */
export interface ElsterKennzahlen {
  kz81: number; // Steuerpflichtige Umsätze 19%
  kz86: number; // Steuerpflichtige Umsätze 7%
  kz43: number; // Steuerfreie Umsätze
  kz41: number; // Innergemeinschaftliche Lieferungen
  kz60: number; // Reverse Charge Umsätze
  kz66: number; // Vorsteuerbeträge
  kz61: number; // Innergemeinschaftliche Erwerbe
  kz62: number; // Einfuhrumsatzsteuer
  kz83: number; // Verbleibende Umsatzsteuer-Vorauszahlung
}

/**
 * ELSTER Submission Request
 */
export interface ElsterSubmissionRequest {
  steuernummer: string; // Tax number (XXX/XXX/XXXXX)
  finanzamt: string; // Tax office ID (4 digits)
  jahr: number; // Year
  zeitraum: string; // Period: "01"-"12" (monthly) or "41"-"44" (quarterly)
  kennzahlen: ElsterKennzahlen; // Tax form fields
}

/**
 * ELSTER Submission Response
 */
export interface ElsterSubmissionResponse {
  success: boolean;
  transferTicket?: string; // ELSTER transfer ticket
  submissionId?: string; // Internal submission ID
  timestamp: Date;
  status: ElsterSubmissionStatus;
  errors?: string[];
  warnings?: string[];
}

/**
 * ELSTER Submission Status
 */
export enum ElsterSubmissionStatus {
  DRAFT = 'DRAFT',
  VALIDATING = 'VALIDATING',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  ERROR = 'ERROR',
  PENDING = 'PENDING',
}

/**
 * Period type for VAT filing
 */
export enum VatPeriodType {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
}

/**
 * VAT Return Preview Data
 */
export interface VatReturnPreview {
  period: string;
  periodType: VatPeriodType;
  organizationId: string;

  // Summary
  totalRevenue: number;
  totalOutputVat: number;
  totalInputVat: number;
  vatPayable: number;

  // Breakdown
  revenue19: number;
  vat19: number;
  revenue7: number;
  vat7: number;
  taxFreeRevenue: number;
  euDeliveries: number;

  // Input VAT
  deductibleInputVat: number;
  euAcquisitionsInputVat: number;
  importVat: number;

  // Metadata
  invoiceCount: number;
  expenseCount: number;
  confidence: number;
  warnings: string[];

  // Submission status
  canSubmit: boolean;
  submissionDeadline?: Date;
  lastSubmittedAt?: Date;
}

/**
 * ELSTER Certificate Info
 */
export interface ElsterCertificate {
  id: string;
  organizationId: string;
  fileName: string;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  thumbprint?: string;
}

/**
 * ELSTER Filing Record
 */
export interface ElsterFiling {
  id: string;
  organizationId: string;
  type: 'USTVA' | 'ZM' | 'UST'; // UStVA, ZM (summary), UST (annual)
  year: number;
  period: number; // Month (1-12) or Quarter (1-4)
  periodType: VatPeriodType;
  status: ElsterSubmissionStatus;

  // Submission details
  submissionId?: string;
  transferTicket?: string;
  submittedAt?: Date;
  responseAt?: Date;

  // Data
  data: any; // UStVAData
  response?: any;
  errors?: any;

  // Certificate
  certificateId?: string;

  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

/**
 * ELSTER field reference (for documentation)
 */
export const ELSTER_KENNZAHLEN_REFERENCE = {
  KZ81: {
    name: 'Steuerpflichtige Umsätze 19%',
    description:
      'Lieferungen und sonstige Leistungen zu 19% (ohne Umsatzsteuer)',
    section: 'Output VAT',
  },
  KZ86: {
    name: 'Steuerpflichtige Umsätze 7%',
    description:
      'Lieferungen und sonstige Leistungen zu 7% (ohne Umsatzsteuer)',
    section: 'Output VAT',
  },
  KZ43: {
    name: 'Steuerfreie Umsätze',
    description:
      'Innergemeinschaftliche Lieferungen an Abnehmer mit USt-IdNr.',
    section: 'Tax-free Revenue',
  },
  KZ41: {
    name: 'Innergemeinschaftliche Lieferungen',
    description:
      'Steuerfreie innergemeinschaftliche Lieferungen (§4 Nr. 1b UStG)',
    section: 'EU Deliveries',
  },
  KZ60: {
    name: 'Reverse Charge Umsätze',
    description:
      'Steuerpflichtige Umsätze, für die der Leistungsempfänger die Steuer schuldet (§13b UStG)',
    section: 'Reverse Charge',
  },
  KZ66: {
    name: 'Vorsteuerbeträge',
    description:
      'Vorsteuerbeträge aus Rechnungen von anderen Unternehmern (§15 Abs. 1 Nr. 1 UStG)',
    section: 'Input VAT',
  },
  KZ61: {
    name: 'Innergemeinschaftliche Erwerbe Vorsteuer',
    description:
      'Vorsteuerbeträge aus dem innergemeinschaftlichen Erwerb von Gegenständen (§15 Abs. 1 Nr. 3 UStG)',
    section: 'Input VAT',
  },
  KZ62: {
    name: 'Einfuhrumsatzsteuer',
    description: 'Entstandene Einfuhrumsatzsteuer (§15 Abs. 1 Nr. 2 UStG)',
    section: 'Input VAT',
  },
  KZ83: {
    name: 'Verbleibende Umsatzsteuer-Vorauszahlung',
    description:
      'Verbleibende Umsatzsteuer-Vorauszahlung (positiv) oder Überschuss (negativ)',
    section: 'Result',
  },
} as const;
