import { Bill, Vendor } from '@prisma/client';

/**
 * Match type indicating the level of confidence in the bill match
 */
export enum BillMatchType {
  EXACT = 'EXACT', // Amount and vendor match exactly
  PROBABLE = 'PROBABLE', // High confidence but not exact
  PARTIAL = 'PARTIAL', // Partial payment detected
  NONE = 'NONE', // No match found
}

/**
 * Suggested action to take based on the bill match
 */
export enum BillSuggestedAction {
  AUTO_RECONCILE = 'AUTO_RECONCILE', // Auto-reconcile the payment
  REVIEW = 'REVIEW', // Manual review needed
  PARTIAL_PAYMENT = 'PARTIAL_PAYMENT', // Record as partial payment
  CREATE_BILL = 'CREATE_BILL', // No bill found, create one
  MULTI_BILL = 'MULTI_BILL', // Payment may cover multiple bills
}

/**
 * Detailed match information for a specific bill
 */
export interface BillMatch {
  bill: Bill & { vendor?: Vendor | null };
  matchType: BillMatchType;
  confidence: number; // 0-100
  matchReasons: string[];
  suggestedAction: BillSuggestedAction;
  amountDifference?: number; // For partial payments
}

/**
 * Result of matching a payment to bill(s)
 */
export interface BillMatchResult {
  matched: boolean;
  matchType: BillMatchType;
  bill?: Bill & { vendor?: Vendor | null };
  bills?: (Bill & { vendor?: Vendor | null })[]; // For multi-bill matches
  confidence: number; // 0-100
  suggestedAction: BillSuggestedAction;
  matchReasons: string[];
  amountRemaining?: number; // For overpayments
}

/**
 * Input for matching an outgoing payment to bill
 */
export interface OutgoingPaymentInput {
  amount: number;
  description: string;
  counterparty?: string;
  counterpartyIban?: string;
  reference?: string;
  date: Date;
}

/**
 * Criteria for matching bills
 */
export interface BillMatchCriteria {
  amountTolerance: number; // Percentage (e.g., 1 for 1%)
  minAmountToleranceEuro: number; // Minimum tolerance in euros (e.g., 1)
  maxBillAgeDays: number; // Maximum age of bill to consider (e.g., 180)
  maxDueDateFutureDays: number; // How far in future to look for due bills (e.g., 30)
  minConfidenceForAutoMatch: number; // Minimum confidence for auto-reconcile (e.g., 95)
  fuzzyMatchThreshold: number; // Threshold for fuzzy name matching (e.g., 0.8)
}

/**
 * Default bill matching criteria
 */
export const DEFAULT_BILL_MATCH_CRITERIA: BillMatchCriteria = {
  amountTolerance: 1, // 1%
  minAmountToleranceEuro: 1, // €1
  maxBillAgeDays: 180, // 6 months
  maxDueDateFutureDays: 30, // 30 days in future
  minConfidenceForAutoMatch: 95, // 95%
  fuzzyMatchThreshold: 0.8, // 80% similarity
};

/**
 * Recurring payment detection result
 */
export interface RecurringPaymentInfo {
  isRecurring: boolean;
  confidence: number;
  frequency?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  vendorId?: string;
  vendorName?: string;
  averageAmount?: number;
  lastPaymentDate?: Date;
  predictedNextDate?: Date;
}
