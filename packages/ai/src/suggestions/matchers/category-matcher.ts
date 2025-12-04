/**
 * Category Matcher
 *
 * Matches transaction categories to deduction rules
 */

import {
  ClassifiedTransaction,
  DeductionRule,
  RuleMatchResult,
  DeductionCondition,
} from '../types';

/**
 * Match transaction to rules based on category
 */
export function matchTransactionToRules(
  transaction: ClassifiedTransaction,
  rules: DeductionRule[],
): RuleMatchResult[] {
  const matches: RuleMatchResult[] = [];

  for (const rule of rules) {
    const matchScore = calculateMatchScore(transaction, rule);

    if (matchScore > 0) {
      matches.push({
        rule,
        score: matchScore,
        reason: generateMatchReason(transaction, rule),
      });
    }
  }

  // Sort by score (highest first), then by priority
  return matches.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return (b.rule.priority || 0) - (a.rule.priority || 0);
  });
}

/**
 * Calculate match score for a transaction and rule
 */
function calculateMatchScore(
  transaction: ClassifiedTransaction,
  rule: DeductionRule,
): number {
  let score = 0;

  // Check if transaction category matches rule
  if (rule.transactionCategories.includes(transaction.category)) {
    score += 50; // Base score for category match
  } else {
    return 0; // No match
  }

  // Boost score based on transaction confidence
  score += transaction.confidence * 30;

  // Boost score based on rule priority
  score += (rule.priority || 0);

  // Check conditions
  if (rule.conditions && rule.conditions.length > 0) {
    const conditionsMet = evaluateConditions(transaction, rule.conditions);
    if (!conditionsMet) {
      return 0; // Conditions not met, no match
    }
    score += 10; // Bonus for meeting conditions
  }

  return Math.min(score, 100); // Cap at 100
}

/**
 * Evaluate rule conditions against transaction
 */
function evaluateConditions(
  transaction: ClassifiedTransaction,
  conditions: DeductionCondition[],
): boolean {
  return conditions.every((condition) =>
    evaluateCondition(transaction, condition),
  );
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(
  transaction: ClassifiedTransaction,
  condition: DeductionCondition,
): boolean {
  const { field, operator, value } = condition;

  // Get field value from transaction or metadata
  let fieldValue: any;
  if (field === 'amount') {
    fieldValue = transaction.amount;
  } else if (field === 'description') {
    fieldValue = transaction.description;
  } else if (field === 'category') {
    fieldValue = transaction.category;
  } else if (transaction.metadata && field in transaction.metadata) {
    fieldValue = transaction.metadata[field];
  } else {
    // Field not found, condition fails
    return false;
  }

  // Evaluate based on operator
  switch (operator) {
    case 'gt':
      return typeof fieldValue === 'number' && fieldValue > Number(value);
    case 'lt':
      return typeof fieldValue === 'number' && fieldValue < Number(value);
    case 'gte':
      return typeof fieldValue === 'number' && fieldValue >= Number(value);
    case 'lte':
      return typeof fieldValue === 'number' && fieldValue <= Number(value);
    case 'eq':
      return fieldValue === value;
    case 'contains':
      return (
        typeof fieldValue === 'string' &&
        typeof value === 'string' &&
        fieldValue.toLowerCase().includes(value.toLowerCase())
      );
    case 'matches':
      if (typeof fieldValue === 'string' && typeof value === 'string') {
        try {
          const regex = new RegExp(value, 'i');
          return regex.test(fieldValue);
        } catch {
          return false;
        }
      }
      return false;
    default:
      return false;
  }
}

/**
 * Generate human-readable match reason
 */
function generateMatchReason(
  transaction: ClassifiedTransaction,
  rule: DeductionRule,
): string {
  const reasons: string[] = [];

  reasons.push(
    `Transaction category "${transaction.category}" matches rule for ${rule.categoryCode}`,
  );

  if (transaction.confidence < 0.8) {
    reasons.push(
      `Note: Classification confidence is ${(transaction.confidence * 100).toFixed(0)}%`,
    );
  }

  if (rule.conditions && rule.conditions.length > 0) {
    reasons.push('All rule conditions are met');
  }

  return reasons.join('. ');
}

/**
 * Find best matching rule for a transaction
 */
export function findBestMatch(
  transaction: ClassifiedTransaction,
  rules: DeductionRule[],
): RuleMatchResult | null {
  const matches = matchTransactionToRules(transaction, rules);
  return matches.length > 0 ? matches[0] || null : null;
}

/**
 * Check if transaction matches any rule
 */
export function hasMatch(
  transaction: ClassifiedTransaction,
  rules: DeductionRule[],
): boolean {
  return findBestMatch(transaction, rules) !== null;
}
