import { Invoice } from '@prisma/client';

/**
 * Match type indicating the level of confidence in the match
 */
export enum MatchType {
  EXACT = 'EXACT', // Amount and customer match exactly
  PROBABLE = 'PROBABLE', // High confidence but not exact
  PARTIAL = 'PARTIAL', // Partial payment detected
  NONE = 'NONE', // No match found
}

/**
 * Suggested action to take based on the match
 */
export enum SuggestedAction {
  AUTO_RECONCILE = 'AUTO_RECONCILE', // Auto-reconcile the payment
  REVIEW = 'REVIEW', // Manual review needed
  PARTIAL_PAYMENT = 'PARTIAL_PAYMENT', // Record as partial payment
  CREATE_CUSTOMER = 'CREATE_CUSTOMER', // No customer found, create one
  MULTI_INVOICE = 'MULTI_INVOICE', // Payment may cover multiple invoices
}

/**
 * Detailed match information for a specific invoice
 */
export interface InvoiceMatch {
  invoice: Invoice;
  matchType: MatchType;
  confidence: number; // 0-100
  matchReasons: string[];
  suggestedAction: SuggestedAction;
  amountDifference?: number; // For partial payments
}

/**
 * Result of matching a payment to invoice(s)
 */
export interface MatchResult {
  matched: boolean;
  matchType: MatchType;
  invoice?: Invoice;
  invoices?: Invoice[]; // For multi-invoice matches
  confidence: number; // 0-100
  suggestedAction: SuggestedAction;
  matchReasons: string[];
  amountRemaining?: number; // For overpayments
}

/**
 * Input for matching a payment
 */
export interface PaymentInput {
  amount: number;
  description: string;
  counterparty?: string;
  counterpartyIban?: string;
  reference?: string;
  date: Date;
}

/**
 * Criteria for matching invoices
 */
export interface MatchCriteria {
  amountTolerance: number; // Percentage (e.g., 1 for 1%)
  minAmountToleranceEuro: number; // Minimum tolerance in euros (e.g., 1)
  maxInvoiceAgeDays: number; // Maximum age of invoice to consider (e.g., 180)
  minConfidenceForAutoMatch: number; // Minimum confidence for auto-reconcile (e.g., 95)
  fuzzyMatchThreshold: number; // Threshold for fuzzy name matching (e.g., 0.8)
}

/**
 * Default matching criteria
 */
export const DEFAULT_MATCH_CRITERIA: MatchCriteria = {
  amountTolerance: 1, // 1%
  minAmountToleranceEuro: 1, // €1
  maxInvoiceAgeDays: 180, // 6 months
  minConfidenceForAutoMatch: 95, // 95%
  fuzzyMatchThreshold: 0.8, // 80% similarity
};

/**
 * Reconciliation record
 */
export interface ReconciliationRecord {
  transactionId: string;
  invoiceId: string;
  amount: number;
  matchType: MatchType;
  confidence: number;
  reconciledAt: Date;
  reconciledBy?: string; // User ID if manual, null if auto
}
