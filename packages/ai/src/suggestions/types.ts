/**
 * Deduction Suggestion Types
 *
 * Types for AI-powered deduction suggestion engine
 */

/**
 * Transaction category from classification engine (OP-040)
 */
export interface ClassifiedTransaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  date: Date;
  category: string;
  confidence: number;
  metadata?: Record<string, any>;
}

/**
 * Condition operator types
 */
export type ConditionOperator = 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'matches';

/**
 * Deduction rule condition
 */
export interface DeductionCondition {
  field: string;
  operator: ConditionOperator;
  value: string | number;
}

/**
 * Deduction rule definition
 */
export interface DeductionRule {
  id: string;
  countryCode: string;
  categoryCode: string;
  transactionCategories: string[];

  // Limits
  maxAmountPerItem?: number;
  maxAmountPerYear?: number;
  percentageDeductible: number;

  // Legal basis
  legalReference: string;
  legalDescription: string;

  // Requirements
  requiresReceipt: boolean;
  requiresBusinessPurpose: boolean;
  requiresLogbook: boolean;
  additionalRequirements?: string[];

  // Conditions
  conditions?: DeductionCondition[];

  // Priority for matching (higher = more specific)
  priority?: number;
}

/**
 * Requirement status
 */
export interface RequirementStatus {
  receiptAttached: boolean;
  receiptRequired: boolean;
  businessPurposeProvided: boolean;
  businessPurposeRequired: boolean;
  logbookRequired: boolean;
  additionalRequirements?: {
    requirement: string;
    fulfilled: boolean;
  }[];
}

/**
 * Deduction suggestion status
 */
export type DeductionSuggestionStatus = 'suggested' | 'confirmed' | 'rejected' | 'modified';

/**
 * Deduction suggestion
 */
export interface DeductionSuggestion {
  id: string;
  transactionId: string;

  // Matched rule
  ruleId: string;
  categoryCode: string;
  categoryName: string;

  // Amounts
  originalAmount: number;
  deductibleAmount: number;
  deductiblePercentage: number;
  currency: string;

  // Legal info
  legalReference: string;
  legalDescription: string;

  // Status
  status: DeductionSuggestionStatus;

  // Requirements
  requirements: RequirementStatus;

  // AI confidence
  confidence: number;
  reasoning: string;

  // Audit
  createdAt: Date;
  confirmedAt?: Date;
  confirmedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
  modifiedAt?: Date;
  modifiedBy?: string;
}

/**
 * Deduction summary by category
 */
export interface DeductionCategorySummary {
  categoryCode: string;
  categoryName: string;
  legalReference: string;
  count: number;
  totalOriginalAmount: number;
  totalDeductibleAmount: number;
  suggestions: DeductionSuggestion[];
}

/**
 * Annual deduction summary
 */
export interface DeductionSummary {
  year: number;
  countryCode: string;
  currency: string;
  totalOriginalAmount: number;
  totalDeductibleAmount: number;
  suggestedCount: number;
  confirmedCount: number;
  rejectedCount: number;
  categories: DeductionCategorySummary[];
}

/**
 * Deduction engine options
 */
export interface DeductionEngineOptions {
  countryCode: string;
  taxYear?: number;
  includeInactive?: boolean;
  minConfidence?: number;
}

/**
 * Rule matching result
 */
export interface RuleMatchResult {
  rule: DeductionRule;
  score: number;
  reason: string;
}
