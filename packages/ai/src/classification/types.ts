/**
 * Transaction Classification Types
 */

export enum TransactionCategory {
  // Business Expenses
  OFFICE_SUPPLIES = 'office_supplies',
  TRAVEL_BUSINESS = 'travel_business',
  MEALS_BUSINESS = 'meals_business',
  SOFTWARE_SUBSCRIPTIONS = 'software_subscriptions',
  PROFESSIONAL_SERVICES = 'professional_services',
  MARKETING = 'marketing',
  UTILITIES = 'utilities',
  RENT = 'rent',
  EQUIPMENT = 'equipment',
  INSURANCE_BUSINESS = 'insurance_business',
  VEHICLE_BUSINESS = 'vehicle_business',

  // Personal
  PERSONAL = 'personal',

  // Revenue
  REVENUE_SALES = 'revenue_sales',
  REVENUE_SERVICES = 'revenue_services',

  // Tax-specific
  TAX_PAYMENT = 'tax_payment',
  TAX_REFUND = 'tax_refund',

  // Transfers
  TRANSFER_INTERNAL = 'transfer_internal',

  // Unknown
  UNKNOWN = 'unknown',
}

export enum ClassificationFlag {
  NEEDS_RECEIPT = 'needs_receipt',
  SPLIT_REQUIRED = 'split_required',
  HIGH_VALUE = 'high_value',
  RECURRING = 'recurring',
  FOREIGN_CURRENCY = 'foreign_currency',
}

export interface TransactionInput {
  id?: string;
  description: string;
  amount: number;
  currency: string;
  date: Date | string;
  counterparty?: string;
  mccCode?: string;
}

export interface ClassificationResult {
  category: TransactionCategory;
  confidence: number;
  reasoning: string;
  taxRelevant: boolean;
  suggestedDeductionCategory?: string;
  flags?: ClassificationFlag[];
  metadata?: {
    processingTime?: number;
    modelUsed?: string;
    tokensUsed?: number;
  };
}

export interface ClassificationResultWithId extends ClassificationResult {
  transactionId: string;
}

export enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export interface ConfidenceThresholds {
  high: number; // >= 0.8
  medium: number; // >= 0.5
  low: number; // < 0.5
}
