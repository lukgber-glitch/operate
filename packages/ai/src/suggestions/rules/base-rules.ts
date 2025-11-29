/**
 * Base Deduction Rules
 *
 * Common deduction rule utilities and base configurations
 */

import { DeductionRule, DeductionCondition } from '../types';

/**
 * Common transaction categories
 */
export const TransactionCategories = {
  // Office & Equipment
  OFFICE_SUPPLIES: 'office_supplies',
  EQUIPMENT: 'equipment',
  SOFTWARE_SUBSCRIPTIONS: 'software_subscriptions',
  COMPUTER_HARDWARE: 'computer_hardware',

  // Travel & Transport
  TRAVEL_BUSINESS: 'travel_business',
  VEHICLE_BUSINESS: 'vehicle_business',
  FUEL: 'fuel',
  PARKING: 'parking',
  PUBLIC_TRANSPORT: 'public_transport',
  ACCOMMODATION: 'accommodation',

  // Meals & Entertainment
  MEALS_BUSINESS: 'meals_business',
  CLIENT_ENTERTAINMENT: 'client_entertainment',

  // Office Space
  RENT: 'rent',
  UTILITIES: 'utilities',
  INTERNET: 'internet',
  PHONE: 'phone',

  // Professional Services
  LEGAL_FEES: 'legal_fees',
  ACCOUNTING_FEES: 'accounting_fees',
  CONSULTING: 'consulting',
  TRAINING: 'training',

  // Marketing & Advertising
  ADVERTISING: 'advertising',
  MARKETING: 'marketing',
  WEBSITE: 'website',

  // Insurance
  BUSINESS_INSURANCE: 'business_insurance',
  HEALTH_INSURANCE: 'health_insurance',
  LIABILITY_INSURANCE: 'liability_insurance',

  // Other
  BANK_FEES: 'bank_fees',
  POSTAGE: 'postage',
  SUBSCRIPTIONS: 'subscriptions',
} as const;

/**
 * Create a condition helper
 */
export function condition(
  field: string,
  operator: DeductionCondition['operator'],
  value: string | number,
): DeductionCondition {
  return { field, operator, value };
}

/**
 * Validate rule configuration
 */
export function validateRule(rule: DeductionRule): string[] {
  const errors: string[] = [];

  if (!rule.id) errors.push('Rule ID is required');
  if (!rule.countryCode) errors.push('Country code is required');
  if (!rule.categoryCode) errors.push('Category code is required');
  if (!rule.transactionCategories || rule.transactionCategories.length === 0) {
    errors.push('At least one transaction category is required');
  }
  if (
    rule.percentageDeductible < 0 ||
    rule.percentageDeductible > 100
  ) {
    errors.push('Percentage deductible must be between 0 and 100');
  }
  if (!rule.legalReference) errors.push('Legal reference is required');
  if (!rule.legalDescription) errors.push('Legal description is required');

  return errors;
}

/**
 * Get all rules for a country
 */
export function getRulesByCountry(
  allRules: DeductionRule[],
  countryCode: string,
): DeductionRule[] {
  return allRules
    .filter((rule) => rule.countryCode === countryCode)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

/**
 * Get rules for specific transaction category
 */
export function getRulesByTransactionCategory(
  allRules: DeductionRule[],
  category: string,
): DeductionRule[] {
  return allRules
    .filter((rule) => rule.transactionCategories.includes(category))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

/**
 * Common deduction category codes
 */
export const DeductionCategoryCodes = {
  // Work-related expenses (Werbungskosten)
  WORK_EQUIPMENT: 'WORK_EQUIPMENT',
  WORK_CLOTHING: 'WORK_CLOTHING',
  COMMUTE: 'COMMUTE',
  PROFESSIONAL_DEVELOPMENT: 'PROFESSIONAL_DEVELOPMENT',

  // Business expenses (Betriebsausgaben)
  OFFICE_COSTS: 'OFFICE_COSTS',
  TRAVEL_EXPENSES: 'TRAVEL_EXPENSES',
  VEHICLE_EXPENSES: 'VEHICLE_EXPENSES',
  BUSINESS_MEALS: 'BUSINESS_MEALS',
  MARKETING_COSTS: 'MARKETING_COSTS',
  PROFESSIONAL_SERVICES: 'PROFESSIONAL_SERVICES',

  // Special deductions
  HOME_OFFICE: 'HOME_OFFICE',
  INSURANCE: 'INSURANCE',
  DEPRECIATION: 'DEPRECIATION',
} as const;

/**
 * Depreciation thresholds (GWG limits)
 */
export const DepreciationLimits = {
  DE_GWG_NET: 800, // Germany: Geringwertige Wirtschaftsgüter (net)
  DE_GWG_GROSS: 952, // Germany: with 19% VAT
  AT_GWG: 800, // Austria
  CH_GWG: 2000, // Switzerland (CHF)
} as const;
