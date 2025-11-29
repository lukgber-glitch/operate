/**
 * Deduction Suggestion Engine Exports
 */

// Main engine
export { DeductionEngine, createDeductionEngine } from './deduction-engine';

// Types
export * from './types';

// Rules
export { getGermanyRules } from './rules/germany-rules';
export { getAustriaRules } from './rules/austria-rules';
export { getSwitzerlandRules } from './rules/switzerland-rules';
export {
  TransactionCategories,
  DeductionCategoryCodes,
  DepreciationLimits,
  validateRule,
  getRulesByCountry,
  getRulesByTransactionCategory,
} from './rules/base-rules';

// Matchers
export {
  matchTransactionToRules,
  findBestMatch,
  hasMatch,
} from './matchers/category-matcher';
export {
  calculateDeductibleAmount,
  validateAmountRange,
  requiresDepreciation,
  calculateYearToDateTotal,
  getRemainingAllowance,
  formatAmount,
} from './matchers/amount-validator';
export {
  isWithinTaxYear,
  getTaxYear,
  isClaimable,
  getFiscalYearStart,
  getFiscalYearEnd,
  isFutureDate,
  getQuarter,
  getMonthName,
  formatDateRange,
} from './matchers/period-validator';
