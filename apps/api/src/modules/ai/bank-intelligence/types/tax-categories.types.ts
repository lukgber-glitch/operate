/**
 * Tax Categories for German EÜR (Einnahmen-Überschuss-Rechnung)
 * Maps transaction classifications to German tax form lines
 */

export enum TaxCategory {
  // German Expense Categories (EÜR Form Lines)

  /** Line 12: Waren, Roh- und Hilfsstoffe */
  WAREN_MATERIAL = 'WAREN_MATERIAL',

  /** Line 13: Bezogene Fremdleistungen */
  FREMDLEISTUNGEN = 'FREMDLEISTUNGEN',

  /** Line 14: Personalkosten (Löhne, Gehälter) */
  PERSONAL = 'PERSONAL',

  /** Line 18: Raumkosten (Miete, Pacht) */
  MIETE_PACHT = 'MIETE_PACHT',

  /** Line 20: Sonstige unbeschränkt abziehbare Betriebsausgaben */
  SONSTIGE_KOSTEN = 'SONSTIGE_KOSTEN',

  /** Line 22: Absetzung für Abnutzung (AfA) */
  ABSCHREIBUNGEN = 'ABSCHREIBUNGEN',

  /** Line 24: Kfz-Kosten (ohne AfA) */
  KFZKOSTEN = 'KFZKOSTEN',

  /** Line 25: Reisekosten (ohne Verpflegung) */
  REISEKOSTEN = 'REISEKOSTEN',

  /** Line 26: Bewirtungskosten (70% abzugsfähig) */
  BEWIRTUNG = 'BEWIRTUNG',

  /** Line 27: Telefon, Internet, Porto */
  TELEFON_INTERNET = 'TELEFON_INTERNET',

  /** Line 28: Bürobedarf, Zeitschriften */
  BUEROKOSTEN = 'BUEROKOSTEN',

  /** Line 29: Versicherungen, Beiträge */
  VERSICHERUNGEN = 'VERSICHERUNGEN',

  /** Line 30: Werbung und Repräsentation */
  WERBUNG = 'WERBUNG',

  /** Line 31: Rechts- und Beratungskosten */
  RECHTSBERATUNG = 'RECHTSBERATUNG',

  /** Line 32: Schuldzinsen */
  ZINSEN = 'ZINSEN',

  // Income Categories

  /** Einnahmen mit 7% MwSt (ermäßigter Steuersatz) */
  EINNAHMEN_7 = 'EINNAHMEN_7',

  /** Einnahmen mit 19% MwSt (Regelsteuersatz) */
  EINNAHMEN_19 = 'EINNAHMEN_19',

  /** Steuerfreie Einnahmen (z.B. §4 Nr. 8-28 UStG) */
  EINNAHMEN_STEUERFREI = 'EINNAHMEN_STEUERFREI',

  /** Kleinunternehmer ohne MwSt (§19 UStG) */
  EINNAHMEN_KLEINUNTERNEHMER = 'EINNAHMEN_KLEINUNTERNEHMER',

  // Special Categories

  /** Private Entnahme (nicht steuerrelevant) */
  PRIVATE_ENTNAHME = 'PRIVATE_ENTNAHME',

  /** Private Einlage (nicht steuerrelevant) */
  PRIVATE_EINLAGE = 'PRIVATE_EINLAGE',

  /** Keine steuerliche Relevanz */
  KEINE_STEUERRELEVANZ = 'KEINE_STEUERRELEVANZ',
}

/**
 * Enhanced transaction classification with German tax awareness
 */
export interface EnhancedTransactionClassification {
  /** Primary category (e.g., "Software Subscription", "Office Supplies") */
  category: string;

  /** Subcategory for more detailed classification */
  subcategory?: string;

  /** AI confidence score (0.0 - 1.0) */
  confidence: number;

  /** Tax-related information for German EÜR */
  tax: {
    /** Is this expense tax deductible? */
    deductible: boolean;

    /** Percentage of deduction (e.g., 70 for Bewirtung, 100 for most expenses) */
    deductionPercentage: number;

    /** Calculated deductible amount in cents */
    deductibleAmount: number;

    /** Can VAT be reclaimed? (Vorsteuerabzug) */
    vatReclaimable: boolean;

    /** VAT amount if identifiable (in cents) */
    vatAmount?: number;

    /** VAT rate (7%, 19%, or 0%) */
    vatRate?: number;

    /** German tax category for EÜR form */
    taxCategory: TaxCategory;

    /** EÜR form line number (e.g., 26 for Bewirtung) */
    eurLineNumber?: number;

    /** German description for tax form */
    eurDescription?: string;
  };

  /** Business-related information */
  business: {
    /** Is this a business expense? */
    isBusinessExpense: boolean;

    /** Business percentage (e.g., 50% for mixed-use phone) */
    businessPercentage: number;

    /** Requires supporting documentation? */
    requiresDocumentation: boolean;

    /** Type of documentation needed */
    documentationType?: 'RECEIPT' | 'INVOICE' | 'CONTRACT' | 'PROOF_OF_PAYMENT';

    /** Special documentation requirements (e.g., guest names for Bewirtung) */
    specialRequirements?: string[];
  };

  /** Pattern recognition for recurring transactions */
  pattern: {
    /** Is this likely a recurring transaction? */
    isRecurring: boolean;

    /** Frequency if recurring */
    frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

    /** Recognized vendor/merchant */
    vendor?: string;

    /** Normalized vendor name */
    vendorNormalized?: string;

    /** Vendor category (e.g., "Cloud Services", "Office Supplies") */
    vendorCategory?: string;
  };

  /** AI reasoning for classification */
  reasoning?: string;

  /** Flags for special handling */
  flags?: {
    /** Needs manual review */
    needsReview?: boolean;

    /** Unusual amount for this category */
    unusualAmount?: boolean;

    /** First time vendor */
    newVendor?: boolean;

    /** Split transaction required */
    requiresSplit?: boolean;

    /** Potentially private expense */
    possiblyPrivate?: boolean;
  };

  /** Suggested actions */
  suggestedActions?: string[];

  /** Related categories for user selection */
  alternativeCategories?: Array<{
    category: string;
    taxCategory: TaxCategory;
    confidence: number;
  }>;
}

/**
 * Transaction input for classification
 */
export interface TransactionForClassification {
  /** Transaction description from bank */
  description: string;

  /** Amount in cents (negative for expenses, positive for income) */
  amount: number;

  /** Transaction type */
  type: 'CREDIT' | 'DEBIT';

  /** Counterparty name if available */
  counterparty?: string;

  /** Transaction date */
  date?: Date;

  /** Existing category if previously classified */
  category?: string;

  /** IBAN or account number */
  accountNumber?: string;

  /** Merchant Category Code (if available) */
  mccCode?: string;

  /** Currency (default: EUR) */
  currency?: string;
}

/**
 * Batch classification result
 */
export interface BatchClassificationResult {
  /** Total transactions classified */
  total: number;

  /** Successfully classified */
  classified: number;

  /** Failed classifications */
  failed: number;

  /** Average confidence score */
  averageConfidence: number;

  /** Individual results */
  results: Array<{
    transactionId?: string;
    classification: EnhancedTransactionClassification;
    error?: string;
  }>;

  /** Processing time in milliseconds */
  processingTime: number;
}
