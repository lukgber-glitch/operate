/**
 * Transaction Categorization Types
 * Types and interfaces for AI-powered bank transaction categorization
 */

import { ExpenseCategory } from '@prisma/client';

/**
 * Category suggestion with confidence score
 */
export interface CategorySuggestion {
  categoryId: ExpenseCategory;
  categoryName: string;
  confidence: number;
  reasoning: string;
  metadata?: {
    merchantPattern?: string;
    mccCode?: string;
    historicalMatch?: boolean;
    keywordMatch?: string[];
  };
}

/**
 * Transaction categorization result
 */
export interface CategorizationResult {
  transactionId: string;
  primarySuggestion: CategorySuggestion;
  alternateSuggestions: CategorySuggestion[];
  confidence: number;
  autoCategorizationEnabled: boolean;
  categorizedAt: Date;
  metadata: {
    merchantName?: string;
    merchantCategory?: string;
    description: string;
    amount: number;
    currency: string;
  };
}

/**
 * Batch categorization result
 */
export interface BatchCategorizationResult {
  total: number;
  categorized: number;
  failed: number;
  results: CategorizationResult[];
  duration: number;
}

/**
 * User feedback for learning
 */
export interface UserCategorizationFeedback {
  transactionId: string;
  suggestedCategory: ExpenseCategory;
  chosenCategory: ExpenseCategory;
  feedbackType: 'accepted' | 'corrected' | 'rejected';
  timestamp: Date;
}

/**
 * Pattern matching result
 */
export interface PatternMatch {
  pattern: string;
  category: ExpenseCategory;
  confidence: number;
  type: 'merchant_name' | 'mcc_code' | 'keyword' | 'historical';
}

/**
 * Historical pattern for organization
 */
export interface HistoricalPattern {
  orgId: string;
  merchantName: string;
  category: ExpenseCategory;
  frequency: number;
  lastUsed: Date;
}

/**
 * Merchant category code mapping
 */
export interface MCCMapping {
  code: string;
  description: string;
  category: ExpenseCategory;
  confidence: number;
}

/**
 * Categorization request
 */
export interface CategorizationRequest {
  transactionId: string;
  merchantName?: string;
  merchantCategory?: string;
  description: string;
  amount: number;
  currency: string;
  date: Date;
  mccCode?: string;
  orgId: string;
}

/**
 * Learning data for model improvement
 */
export interface LearningData {
  orgId: string;
  merchantName?: string;
  merchantCategory?: string;
  description: string;
  category: ExpenseCategory;
  confidence: number;
  wasCorrect: boolean;
  feedback?: string;
}
