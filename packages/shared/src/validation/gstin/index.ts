/**
 * GSTIN Validation Module
 *
 * @description
 * Comprehensive Indian GSTIN validation module with support for:
 * - GSTIN format validation
 * - State code validation
 * - PAN validation
 * - Check digit calculation and verification
 *
 * @example
 * ```typescript
 * import { validateGSTIN, isValidGSTIN } from '@operate/shared/validation/gstin';
 *
 * const result = validateGSTIN('27AAPFU0939F1ZV');
 * if (result.isValid) {
 *   console.log('Valid GSTIN:', result.details);
 * }
 * ```
 */

// GSTIN Validator
export {
  validateGSTIN,
  isValidGSTIN,
  formatGSTIN,
  parseGSTIN,
  generateGSTIN,
  extractStateCode,
  isGSTINFromState,
  getEntityTypeFromGSTIN,
  validateMultipleGSTINs,
  type GSTINValidationResult,
} from './gstin.validator';

// PAN Validator
export {
  validatePAN,
  isValidPAN,
  extractPANFromGSTIN,
  formatPAN,
  getEntityTypeName,
  PANEntityType,
  VALID_PAN_ENTITY_TYPES,
  type PANValidationResult,
} from './pan.validator';

// State Codes
export {
  isValidStateCode,
  getStateName,
  getValidStateCodes,
  getStateInfo,
  STATE_CODES,
  type StateCodeInfo,
} from './state-codes';

// Check Digit
export {
  calculateCheckDigit,
  verifyCheckDigit,
  generateGSTINWithCheckDigit,
  calculateCheckDigitWithDetails,
} from './check-digit';
