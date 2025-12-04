import { ReconciliationStatus } from '@prisma/client';

export enum MatchType {
  EXPENSE = 'EXPENSE',
  INVOICE_PAYMENT = 'INVOICE_PAYMENT',
}

export enum MatchReason {
  AMOUNT_EXACT = 'AMOUNT_EXACT',
  AMOUNT_APPROXIMATE = 'AMOUNT_APPROXIMATE',
  DESCRIPTION_CONTAINS = 'DESCRIPTION_CONTAINS',
  DATE_PROXIMITY = 'DATE_PROXIMITY',
  RULE_MATCHED = 'RULE_MATCHED',
  MERCHANT_MATCH = 'MERCHANT_MATCH',
}

export interface PotentialMatch {
  type: MatchType;
  id: string;
  confidence: number;
  reason: MatchReason[];
  metadata: {
    amount?: number;
    description?: string;
    date?: Date;
    merchantName?: string;
    category?: string;
    vendorName?: string;
    invoiceNumber?: string;
    daysFromTransaction?: number;
    amountDifference?: number;
  };
}

export interface MatchResult {
  transactionId: string;
  matchType: MatchType;
  matchId: string;
  confidence: number;
  matchedAt: Date;
  matchedBy?: string;
}

export interface ReconciliationStats {
  total: number;
  unmatched: number;
  matched: number;
  ignored: number;
  percentageReconciled: number;
  unmatchedValue: number;
  matchedValue: number;
  averageConfidence: number;
  matchesByType: {
    expense: number;
    invoicePayment: number;
  };
  matchesByReason: {
    [key in MatchReason]?: number;
  };
}

export interface ReconciliationFilter {
  status?: ReconciliationStatus;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  merchantName?: string;
  accountId?: string;
}

export interface AutoReconcileResult {
  processedCount: number;
  matchedCount: number;
  skippedCount: number;
  matches: MatchResult[];
  errors: string[];
}

export interface CreateRuleDto {
  name: string;
  description?: string;
  matchType: string;
  matchPattern: string;
  action: string;
  categoryId?: string;
  vendorId?: string;
  priority?: number;
}

export interface IgnoreTransactionDto {
  reason: string;
}

export interface ApplyMatchDto {
  matchType: MatchType;
  matchId: string;
  confidence?: number;
}
