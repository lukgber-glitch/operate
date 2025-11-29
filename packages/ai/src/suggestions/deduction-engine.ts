/**
 * Deduction Suggestion Engine
 *
 * Main engine for generating tax deduction suggestions
 */

import { v4 as uuidv4 } from 'uuid';

import {
  calculateDeductibleAmount,
  requiresDepreciation,
} from './matchers/amount-validator';
import {
  findBestMatch,
} from './matchers/category-matcher';
import { isWithinTaxYear } from './matchers/period-validator';
import { getAustriaRules } from './rules/austria-rules';
import { getGermanyRules } from './rules/germany-rules';
import { getSwitzerlandRules } from './rules/switzerland-rules';
import {
  ClassifiedTransaction,
  DeductionRule,
  DeductionSuggestion,
  RequirementStatus,
  DeductionEngineOptions,
} from './types';


/**
 * Deduction Suggestion Engine
 */
export class DeductionEngine {
  private rules: Map<string, DeductionRule[]> = new Map();

  constructor() {
    // Load rules for all supported countries
    this.loadRules();
  }

  /**
   * Load deduction rules for all countries
   */
  private loadRules(): void {
    this.rules.set('DE', getGermanyRules());
    this.rules.set('AT', getAustriaRules());
    this.rules.set('CH', getSwitzerlandRules());
  }

  /**
   * Generate suggestions for transactions
   */
  async generateSuggestions(
    transactions: ClassifiedTransaction[],
    options: DeductionEngineOptions,
  ): Promise<DeductionSuggestion[]> {
    const { countryCode, taxYear, minConfidence = 0.5 } = options;

    // Get rules for country
    const countryRules = this.getRulesForCountry(countryCode);
    if (countryRules.length === 0) {
      throw new Error(`No rules found for country: ${countryCode}`);
    }

    const suggestions: DeductionSuggestion[] = [];

    for (const transaction of transactions) {
      // Skip low-confidence classifications
      if (transaction.confidence < minConfidence) {
        continue;
      }

      // Skip if tax year specified and transaction not in that year
      if (taxYear && !isWithinTaxYear(transaction.date, taxYear)) {
        continue;
      }

      // Find matching rule
      const match = findBestMatch(transaction, countryRules);
      if (!match) {
        continue;
      }

      // Create suggestion
      const suggestion = this.createSuggestion(
        transaction,
        match.rule,
        match.score,
        match.reason,
      );

      suggestions.push(suggestion);
    }

    return suggestions;
  }

  /**
   * Create a deduction suggestion from transaction and rule
   */
  private createSuggestion(
    transaction: ClassifiedTransaction,
    rule: DeductionRule,
    matchScore: number,
    reasoning: string,
  ): DeductionSuggestion {
    // Calculate deductible amount
    const amountResult = calculateDeductibleAmount(transaction.amount, rule);

    // Check requirements
    const requirements = this.checkRequirements(transaction, rule);

    // Create suggestion
    const suggestion: DeductionSuggestion = {
      id: uuidv4(),
      transactionId: transaction.id,

      // Matched rule
      ruleId: rule.id,
      categoryCode: rule.categoryCode,
      categoryName: this.getCategoryName(rule.categoryCode),

      // Amounts
      originalAmount: transaction.amount,
      deductibleAmount: amountResult.deductibleAmount,
      deductiblePercentage: rule.percentageDeductible,
      currency: transaction.currency,

      // Legal info
      legalReference: rule.legalReference,
      legalDescription: rule.legalDescription,

      // Status
      status: 'suggested',

      // Requirements
      requirements,

      // AI confidence (weighted between match score and classification confidence)
      confidence: (matchScore + transaction.confidence * 100) / 2 / 100,
      reasoning: this.buildReasoning(reasoning, rule, amountResult),

      // Audit
      createdAt: new Date(),
    };

    return suggestion;
  }

  /**
   * Check requirements for a transaction
   */
  private checkRequirements(
    transaction: ClassifiedTransaction,
    rule: DeductionRule,
  ): RequirementStatus {
    const metadata = transaction.metadata || {};

    return {
      receiptAttached: Boolean(metadata.receipt || metadata.hasReceipt),
      receiptRequired: rule.requiresReceipt,
      businessPurposeProvided: Boolean(
        metadata.businessPurpose || metadata.purpose,
      ),
      businessPurposeRequired: rule.requiresBusinessPurpose,
      logbookRequired: rule.requiresLogbook,
      additionalRequirements: rule.additionalRequirements?.map((req) => ({
        requirement: req,
        fulfilled: false, // Cannot determine automatically
      })),
    };
  }

  /**
   * Build reasoning text
   */
  private buildReasoning(
    matchReason: string,
    rule: DeductionRule,
    amountResult: any,
  ): string {
    const parts: string[] = [matchReason];

    if (rule.percentageDeductible < 100) {
      parts.push(
        `Only ${rule.percentageDeductible}% of the amount is tax-deductible according to ${rule.legalReference}`,
      );
    }

    if (amountResult.warnings && amountResult.warnings.length > 0) {
      parts.push(...amountResult.warnings);
    }

    if (requiresDepreciation(amountResult.deductibleAmount, rule)) {
      parts.push(
        'Amount exceeds threshold for immediate deduction. Depreciation over multiple years may be required.',
      );
    }

    return parts.join('. ');
  }

  /**
   * Get category name from code
   */
  private getCategoryName(categoryCode: string): string {
    // Map category codes to human-readable names
    const categoryNames: Record<string, string> = {
      WORK_EQUIPMENT: 'Work Equipment',
      WORK_CLOTHING: 'Work Clothing',
      COMMUTE: 'Commute Expenses',
      PROFESSIONAL_DEVELOPMENT: 'Professional Development',
      OFFICE_COSTS: 'Office Costs',
      TRAVEL_EXPENSES: 'Travel Expenses',
      VEHICLE_EXPENSES: 'Vehicle Expenses',
      BUSINESS_MEALS: 'Business Meals',
      MARKETING_COSTS: 'Marketing & Advertising',
      PROFESSIONAL_SERVICES: 'Professional Services',
      HOME_OFFICE: 'Home Office',
      INSURANCE: 'Insurance',
      DEPRECIATION: 'Depreciation',
    };

    return categoryNames[categoryCode] || categoryCode;
  }

  /**
   * Get rules for a specific country
   */
  getRulesForCountry(countryCode: string): DeductionRule[] {
    return this.rules.get(countryCode) || [];
  }

  /**
   * Get all loaded rules
   */
  getAllRules(): DeductionRule[] {
    const allRules: DeductionRule[] = [];
    for (const rules of this.rules.values()) {
      allRules.push(...rules);
    }
    return allRules;
  }

  /**
   * Add custom rule
   */
  addRule(rule: DeductionRule): void {
    const countryRules = this.rules.get(rule.countryCode) || [];
    countryRules.push(rule);
    this.rules.set(rule.countryCode, countryRules);
  }

  /**
   * Remove rule by ID
   */
  removeRule(ruleId: string): boolean {
    for (const [countryCode, rules] of this.rules.entries()) {
      const index = rules.findIndex((r) => r.id === ruleId);
      if (index !== -1) {
        rules.splice(index, 1);
        this.rules.set(countryCode, rules);
        return true;
      }
    }
    return false;
  }
}

/**
 * Create a deduction engine instance
 */
export function createDeductionEngine(): DeductionEngine {
  return new DeductionEngine();
}
