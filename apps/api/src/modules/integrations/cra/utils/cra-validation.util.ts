import {
  GstHstReturn,
  CraValidationResult,
  CraErrorCode,
} from '../interfaces/cra.interface';
import {
  CRA_VALIDATION_RULES,
  isValidBusinessNumber,
} from '../cra.constants';

/**
 * CRA Validation Utility
 *
 * Provides comprehensive validation for GST/HST returns
 */
export class CraValidationUtil {
  /**
   * Validate complete GST/HST return
   */
  static validateGstHstReturn(returnData: GstHstReturn): CraValidationResult {
    const errors: CraValidationResult['errors'] = [];

    // Business number validation
    errors.push(...this.validateBusinessNumber(returnData.businessNumber));

    // Reporting period validation
    errors.push(...this.validateReportingPeriod(returnData.reportingPeriod));

    // Revenue and tax validation
    errors.push(...this.validateRevenue(returnData));

    // Line calculation validation
    errors.push(...this.validateCalculations(returnData));

    // Declaration validation
    errors.push(...this.validateDeclaration(returnData));

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate Business Number format
   */
  private static validateBusinessNumber(bn: string): CraValidationResult['errors'] {
    const errors: CraValidationResult['errors'] = [];

    if (!bn || bn.trim().length === 0) {
      errors.push({
        code: CraErrorCode.INVALID_BUSINESS_NUMBER,
        message: 'Business Number is required',
        field: 'businessNumber',
        severity: 'error',
      });
      return errors;
    }

    if (!isValidBusinessNumber(bn)) {
      errors.push({
        code: CraErrorCode.INVALID_BUSINESS_NUMBER,
        message: 'Invalid Business Number format. Expected: 9 digits + 2 letters + 4 digits (e.g., 123456789RT0001)',
        field: 'businessNumber',
        severity: 'error',
      });
    }

    // Check for GST/HST program identifier (RT)
    const cleaned = bn.replace(/[\s-]/g, '');
    if (cleaned.length === 15 && cleaned.slice(9, 11) !== 'RT') {
      errors.push({
        code: CraErrorCode.INVALID_BUSINESS_NUMBER,
        message: 'Business Number must have "RT" program identifier for GST/HST',
        field: 'businessNumber',
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Validate reporting period
   */
  private static validateReportingPeriod(period: any): CraValidationResult['errors'] {
    const errors: CraValidationResult['errors'] = [];

    if (!period) {
      errors.push({
        code: CraErrorCode.INVALID_REPORTING_PERIOD,
        message: 'Reporting period is required',
        field: 'reportingPeriod',
        severity: 'error',
      });
      return errors;
    }

    const { startDate, endDate, frequency } = period;

    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      errors.push({
        code: CraErrorCode.INVALID_REPORTING_PERIOD,
        message: 'Invalid reporting period start date',
        field: 'reportingPeriod.startDate',
        severity: 'error',
      });
    }

    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      errors.push({
        code: CraErrorCode.INVALID_REPORTING_PERIOD,
        message: 'Invalid reporting period end date',
        field: 'reportingPeriod.endDate',
        severity: 'error',
      });
    }

    if (startDate >= endDate) {
      errors.push({
        code: CraErrorCode.INVALID_REPORTING_PERIOD,
        message: 'Reporting period start date must be before end date',
        field: 'reportingPeriod',
        severity: 'error',
      });
    }

    if (!['monthly', 'quarterly', 'annual'].includes(frequency)) {
      errors.push({
        code: CraErrorCode.INVALID_REPORTING_PERIOD,
        message: 'Invalid filing frequency. Must be monthly, quarterly, or annual',
        field: 'reportingPeriod.frequency',
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Validate revenue and tax amounts
   */
  private static validateRevenue(returnData: GstHstReturn): CraValidationResult['errors'] {
    const errors: CraValidationResult['errors'] = [];

    // Line 101 - Sales and revenue
    if (
      returnData.line101_salesRevenue < CRA_VALIDATION_RULES.MIN_SALES_REVENUE ||
      returnData.line101_salesRevenue > CRA_VALIDATION_RULES.MAX_SALES_REVENUE
    ) {
      errors.push({
        code: CraErrorCode.INVALID_RETURN_DATA,
        message: `Line 101 (Sales Revenue) out of range: ${returnData.line101_salesRevenue}. Must be between ${CRA_VALIDATION_RULES.MIN_SALES_REVENUE} and ${CRA_VALIDATION_RULES.MAX_SALES_REVENUE}`,
        field: 'line101_salesRevenue',
        severity: 'error',
      });
    }

    // Line 103 - Tax collected
    if (
      returnData.line103_taxCollected < CRA_VALIDATION_RULES.MIN_TAX_COLLECTED ||
      returnData.line103_taxCollected > CRA_VALIDATION_RULES.MAX_TAX_COLLECTED
    ) {
      errors.push({
        code: CraErrorCode.INVALID_RETURN_DATA,
        message: `Line 103 (Tax Collected) out of range: ${returnData.line103_taxCollected}`,
        field: 'line103_taxCollected',
        severity: 'error',
      });
    }

    // Sanity check: Tax collected should be reasonable compared to revenue
    if (returnData.line101_salesRevenue > 0 && returnData.line103_taxCollected > 0) {
      const taxRate = (returnData.line103_taxCollected / returnData.line101_salesRevenue) * 100;
      if (taxRate > 20) {
        // More than 20% tax rate is unusual
        errors.push({
          code: CraErrorCode.INVALID_RETURN_DATA,
          message: `Tax collected seems high relative to revenue (${taxRate.toFixed(2)}%). Please verify.`,
          field: 'line103_taxCollected',
          severity: 'warning',
        });
      }
    }

    return errors;
  }

  /**
   * Validate line calculations
   */
  private static validateCalculations(returnData: GstHstReturn): CraValidationResult['errors'] {
    const errors: CraValidationResult['errors'] = [];
    const tolerance = 0.01; // 1 cent tolerance for rounding

    // Line 105 = Line 103 + Line 104
    const expectedLine105 =
      returnData.line103_taxCollected + (returnData.line104_adjustments || 0);
    if (Math.abs(returnData.line105_totalTaxToRemit - expectedLine105) > tolerance) {
      errors.push({
        code: CraErrorCode.INVALID_RETURN_DATA,
        message: `Line 105 calculation error. Expected: ${expectedLine105.toFixed(2)}, Got: ${returnData.line105_totalTaxToRemit.toFixed(2)}`,
        field: 'line105_totalTaxToRemit',
        severity: 'error',
      });
    }

    // Line 108 = Line 106 + Line 107
    const expectedLine108 =
      returnData.line106_currentITCs + (returnData.line107_itcAdjustments || 0);
    if (Math.abs(returnData.line108_totalITCs - expectedLine108) > tolerance) {
      errors.push({
        code: CraErrorCode.INVALID_RETURN_DATA,
        message: `Line 108 calculation error. Expected: ${expectedLine108.toFixed(2)}, Got: ${returnData.line108_totalITCs.toFixed(2)}`,
        field: 'line108_totalITCs',
        severity: 'error',
      });
    }

    // Line 109 = Line 105 - Line 108
    const expectedLine109 = returnData.line105_totalTaxToRemit - returnData.line108_totalITCs;
    if (Math.abs(returnData.line109_netTax - expectedLine109) > tolerance) {
      errors.push({
        code: CraErrorCode.INVALID_RETURN_DATA,
        message: `Line 109 calculation error. Expected: ${expectedLine109.toFixed(2)}, Got: ${returnData.line109_netTax.toFixed(2)}`,
        field: 'line109_netTax',
        severity: 'error',
      });
    }

    // If credits are claimed, validate Line 112
    if (returnData.line110_installmentRefund || returnData.line111_otherCredits) {
      const expectedLine112 =
        (returnData.line110_installmentRefund || 0) + (returnData.line111_otherCredits || 0);
      if (returnData.line112_totalCredits !== undefined) {
        if (Math.abs(returnData.line112_totalCredits - expectedLine112) > tolerance) {
          errors.push({
            code: CraErrorCode.INVALID_RETURN_DATA,
            message: `Line 112 calculation error. Expected: ${expectedLine112.toFixed(2)}, Got: ${returnData.line112_totalCredits.toFixed(2)}`,
            field: 'line112_totalCredits',
            severity: 'error',
          });
        }
      }
    }

    // Validate Line 113A (amount owing) or 113B (refund claimed)
    // Only one should be present
    if (returnData.line113A_amountOwing && returnData.line113B_refundClaimed) {
      errors.push({
        code: CraErrorCode.INVALID_RETURN_DATA,
        message: 'Cannot have both amount owing (113A) and refund claimed (113B)',
        field: 'line113A_amountOwing',
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Validate declaration fields
   */
  private static validateDeclaration(returnData: GstHstReturn): CraValidationResult['errors'] {
    const errors: CraValidationResult['errors'] = [];

    if (!returnData.certifierName || returnData.certifierName.trim().length === 0) {
      errors.push({
        code: CraErrorCode.INVALID_RETURN_DATA,
        message: 'Certifier name is required',
        field: 'certifierName',
        severity: 'error',
      });
    }

    if (returnData.certifierName && returnData.certifierName.length > 100) {
      errors.push({
        code: CraErrorCode.INVALID_RETURN_DATA,
        message: 'Certifier name must be 100 characters or less',
        field: 'certifierName',
        severity: 'error',
      });
    }

    if (!returnData.certifierCapacity || returnData.certifierCapacity.trim().length === 0) {
      errors.push({
        code: CraErrorCode.INVALID_RETURN_DATA,
        message: 'Certifier capacity is required (e.g., Owner, Director, Authorized Representative)',
        field: 'certifierCapacity',
        severity: 'error',
      });
    }

    if (!(returnData.declarationDate instanceof Date) || isNaN(returnData.declarationDate.getTime())) {
      errors.push({
        code: CraErrorCode.INVALID_RETURN_DATA,
        message: 'Valid declaration date is required',
        field: 'declarationDate',
        severity: 'error',
      });
    }

    // Declaration date should not be in the future
    if (returnData.declarationDate > new Date()) {
      errors.push({
        code: CraErrorCode.INVALID_RETURN_DATA,
        message: 'Declaration date cannot be in the future',
        field: 'declarationDate',
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Quick validation for business number only
   */
  static isValidBusinessNumber(bn: string): boolean {
    const errors = this.validateBusinessNumber(bn);
    return errors.length === 0;
  }

  /**
   * Calculate expected line values
   */
  static calculateExpectedValues(returnData: Partial<GstHstReturn>): {
    line105: number;
    line108: number;
    line109: number;
    line112?: number;
  } {
    const line105 = (returnData.line103_taxCollected || 0) + (returnData.line104_adjustments || 0);
    const line108 = (returnData.line106_currentITCs || 0) + (returnData.line107_itcAdjustments || 0);
    const line109 = line105 - line108;
    const line112 =
      (returnData.line110_installmentRefund || 0) + (returnData.line111_otherCredits || 0);

    return {
      line105,
      line108,
      line109,
      line112: line112 > 0 ? line112 : undefined,
    };
  }
}
