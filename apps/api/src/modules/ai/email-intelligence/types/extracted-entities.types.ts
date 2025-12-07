/**
 * Extracted Entities Types
 * TypeScript interfaces for entity extraction from emails
 */

/**
 * Role classification for companies
 */
export enum CompanyRole {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  PARTNER = 'PARTNER',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Extracted company entity
 */
export interface ExtractedCompany {
  name: string;
  confidence: number;
  role: CompanyRole;
  normalizedName?: string; // Normalized (without GmbH, Inc, etc.)
  vatId?: string; // Tax ID if found
  domain?: string; // Email domain
}

/**
 * Extracted contact person
 */
export interface ExtractedContact {
  name: string;
  email: string;
  phone?: string;
  role?: string; // e.g., "CEO", "Billing Manager", "Sales"
  company?: string;
  confidence: number;
}

/**
 * Extracted monetary amount
 */
export interface ExtractedAmount {
  value: number;
  currency: string; // ISO 4217 code (EUR, USD, GBP, etc.)
  context: string; // e.g., "invoice total", "payment", "quote", "down payment"
  confidence: number;
}

/**
 * Extracted date with context
 */
export interface ExtractedDate {
  date: Date;
  context: string; // e.g., "due date", "meeting", "deadline", "payment date"
  confidence: number;
}

/**
 * Extracted address
 */
export interface ExtractedAddress {
  full: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  confidence: number;
}

/**
 * Complete extracted entities from an email
 */
export interface ExtractedEntities {
  // People & Organizations
  companies: ExtractedCompany[];
  contacts: ExtractedContact[];

  // Financial
  amounts: ExtractedAmount[];
  invoiceNumbers: string[];
  orderNumbers: string[];

  // Dates
  dates: ExtractedDate[];

  // References
  projectNames: string[];
  trackingNumbers: string[];

  // Location
  addresses: ExtractedAddress[];

  // Metadata
  extractedAt: Date;
  emailSubject?: string;
  overallConfidence: number;
}

/**
 * Email signature components
 */
export interface EmailSignature {
  name?: string;
  title?: string;
  company?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  address?: string;
  confidence: number;
}

/**
 * Input for entity extraction
 */
export interface EmailInput {
  subject: string;
  body: string;
  from: string;
  to: string;
  cc?: string[];
  date?: Date;
}

/**
 * AI response format for entity extraction
 */
export interface AIEntityExtractionResponse {
  companies: Array<{
    name: string;
    role: 'CUSTOMER' | 'VENDOR' | 'PARTNER' | 'UNKNOWN';
    vatId?: string;
    confidence: number;
  }>;
  contacts: Array<{
    name: string;
    email: string;
    phone?: string;
    role?: string;
    company?: string;
  }>;
  amounts: Array<{
    value: number;
    currency: string;
    context: string;
  }>;
  invoiceNumbers: string[];
  orderNumbers: string[];
  dates: Array<{
    date: string; // ISO 8601
    context: string;
  }>;
  projectNames: string[];
  trackingNumbers: string[];
  addresses: Array<{
    full: string;
    city?: string;
    country?: string;
  }>;
  confidence: number;
}
