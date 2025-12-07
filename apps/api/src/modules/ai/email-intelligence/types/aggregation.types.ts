/**
 * Email Aggregation Types
 * TypeScript interfaces for company aggregation from email entities
 */

/**
 * A single contact within a company aggregation
 */
export interface EmailContact {
  email: string;
  name: string | null;
  role: string | null;
  emailCount: number;
  lastSeen: Date;
}

/**
 * Company aggregation from email entities
 * Groups all contacts from the same domain/company together
 */
export interface CompanyAggregation {
  id: string; // Generated UUID for this aggregation
  domain: string;
  companyName: string | null;
  contactCount: number;
  contacts: EmailContact[];
  emailCount: number;
  firstSeen: Date;
  lastSeen: Date;
  isExistingCustomer: boolean;
  isExistingVendor: boolean;
  confidence: number; // 0-1 confidence score
  vatId?: string | null;
  address?: string | null;
}

/**
 * Import result when converting aggregations to customers
 */
export interface ImportResult {
  imported: number;
  failed: number;
  customers: any[]; // Prisma Customer[]
  errors: ImportError[];
}

/**
 * Error during import
 */
export interface ImportError {
  companyId: string;
  companyName: string;
  error: string;
}

/**
 * Summary statistics for aggregations
 */
export interface AggregationSummary {
  totalCompanies: number;
  newCompanies: number; // Not yet customers/vendors
  existingCustomers: number;
  existingVendors: number;
  totalContacts: number;
  totalEmails: number;
}

/**
 * Options for aggregation filtering
 */
export interface AggregationOptions {
  sinceDate?: Date;
  excludeExisting?: boolean; // Only show new companies
  minEmailCount?: number; // Minimum emails to include
  minContactCount?: number; // Minimum contacts to include
}
