/**
 * Australian Tax Configuration Module
 * Provides comprehensive tax rate lookup, validation, and configuration for Australia
 * Task: W26-T4 - Canadian/Australian tax rules
 */

import {
  AustralianState,
  AustralianGSTCategory,
  AustralianTaxCalculation,
  AustralianStateTaxRules,
} from '@operate/shared/types/tax/australia-tax.types';

/**
 * Australian Tax Configuration Service
 */
export class AustraliaTaxConfig {
  /**
   * Standard GST rate (Goods and Services Tax)
   */
  static readonly GST_RATE = 10;

  /**
   * GST registration threshold for businesses
   */
  static readonly GST_REGISTRATION_THRESHOLD = 75000; // Annual turnover in AUD

  /**
   * GST registration threshold for non-profit organizations
   */
  static readonly GST_REGISTRATION_THRESHOLD_NON_PROFIT = 150000;

  /**
   * Taxable importation threshold
   */
  static readonly TAXABLE_IMPORTATION_THRESHOLD = 1000;

  /**
   * Get tax rules for a specific state/territory
   */
  static getStateTaxRules(state: AustralianState): AustralianStateTaxRules {
    const stateTaxRules: Record<AustralianState, AustralianStateTaxRules> = {
      [AustralianState.NSW]: {
        state: AustralianState.NSW,
        stateName: 'New South Wales',
        gstRate: 10,
        registrationThreshold: 75000,
        simpleGSTThreshold: 10000000,
        hasStateTax: false,
        specialRules: ['Payroll tax applies for wages above threshold'],
      },
      [AustralianState.VIC]: {
        state: AustralianState.VIC,
        stateName: 'Victoria',
        gstRate: 10,
        registrationThreshold: 75000,
        simpleGSTThreshold: 10000000,
        hasStateTax: false,
        specialRules: ['Payroll tax applies for wages above threshold'],
      },
      [AustralianState.QLD]: {
        state: AustralianState.QLD,
        stateName: 'Queensland',
        gstRate: 10,
        registrationThreshold: 75000,
        simpleGSTThreshold: 10000000,
        hasStateTax: false,
        specialRules: ['Payroll tax applies for wages above threshold'],
      },
      [AustralianState.SA]: {
        state: AustralianState.SA,
        stateName: 'South Australia',
        gstRate: 10,
        registrationThreshold: 75000,
        simpleGSTThreshold: 10000000,
        hasStateTax: false,
        specialRules: ['Payroll tax applies for wages above threshold'],
      },
      [AustralianState.WA]: {
        state: AustralianState.WA,
        stateName: 'Western Australia',
        gstRate: 10,
        registrationThreshold: 75000,
        simpleGSTThreshold: 10000000,
        hasStateTax: false,
        specialRules: ['Payroll tax applies for wages above threshold'],
      },
      [AustralianState.TAS]: {
        state: AustralianState.TAS,
        stateName: 'Tasmania',
        gstRate: 10,
        registrationThreshold: 75000,
        simpleGSTThreshold: 10000000,
        hasStateTax: false,
        specialRules: ['Payroll tax applies for wages above threshold'],
      },
      [AustralianState.NT]: {
        state: AustralianState.NT,
        stateName: 'Northern Territory',
        gstRate: 10,
        registrationThreshold: 75000,
        simpleGSTThreshold: 10000000,
        hasStateTax: false,
        specialRules: ['Lower payroll tax threshold than other states'],
      },
      [AustralianState.ACT]: {
        state: AustralianState.ACT,
        stateName: 'Australian Capital Territory',
        gstRate: 10,
        registrationThreshold: 75000,
        simpleGSTThreshold: 10000000,
        hasStateTax: false,
        specialRules: ['Payroll tax applies for wages above threshold'],
      },
    };

    return stateTaxRules[state];
  }

  /**
   * Calculate GST for a given amount
   */
  static calculateGST(
    netAmount: number,
    category: AustralianGSTCategory = AustralianGSTCategory.STANDARD,
    state: AustralianState = AustralianState.NSW,
  ): AustralianTaxCalculation {
    let rate = 0;
    let taxType: 'GST' | 'GST_FREE' | 'INPUT_TAXED' = 'GST';

    switch (category) {
      case AustralianGSTCategory.STANDARD:
        rate = this.GST_RATE;
        taxType = 'GST';
        break;
      case AustralianGSTCategory.GST_FREE:
        rate = 0;
        taxType = 'GST_FREE';
        break;
      case AustralianGSTCategory.INPUT_TAXED:
      case AustralianGSTCategory.EXEMPT:
        rate = 0;
        taxType = 'INPUT_TAXED';
        break;
    }

    const gstAmount = (netAmount * rate) / 100;
    const grossAmount = netAmount + gstAmount;

    return {
      netAmount,
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      grossAmount: parseFloat(grossAmount.toFixed(2)),
      state,
      category,
      rate,
      taxType,
    };
  }

  /**
   * Calculate GST from GST-inclusive amount
   */
  static calculateGSTFromGross(
    grossAmount: number,
    category: AustralianGSTCategory = AustralianGSTCategory.STANDARD,
  ): { netAmount: number; gstAmount: number; rate: number } {
    if (
      category === AustralianGSTCategory.GST_FREE ||
      category === AustralianGSTCategory.INPUT_TAXED ||
      category === AustralianGSTCategory.EXEMPT
    ) {
      return {
        netAmount: grossAmount,
        gstAmount: 0,
        rate: 0,
      };
    }

    // For 10% GST: GST = gross × 10/110 or gross × 1/11
    const gstAmount = grossAmount / 11;
    const netAmount = grossAmount - gstAmount;

    return {
      netAmount: parseFloat(netAmount.toFixed(2)),
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      rate: this.GST_RATE,
    };
  }

  /**
   * Determine if registration is required based on turnover
   */
  static isRegistrationRequired(
    annualTurnover: number,
    isNonProfit = false,
  ): {
    required: boolean;
    threshold: number;
    turnover: number;
  } {
    const threshold = isNonProfit
      ? this.GST_REGISTRATION_THRESHOLD_NON_PROFIT
      : this.GST_REGISTRATION_THRESHOLD;

    return {
      required: annualTurnover >= threshold,
      threshold,
      turnover: annualTurnover,
    };
  }

  /**
   * Get GST category description
   */
  static getGSTCategoryDescription(category: AustralianGSTCategory): string {
    const descriptions: Record<AustralianGSTCategory, string> = {
      [AustralianGSTCategory.STANDARD]:
        'Standard GST (10%) - Most goods and services',
      [AustralianGSTCategory.GST_FREE]:
        'GST-free (0%) - Basic food, health, education (can claim credits)',
      [AustralianGSTCategory.INPUT_TAXED]:
        'Input-taxed - Financial services, residential rent (no GST, cannot claim credits)',
      [AustralianGSTCategory.EXEMPT]:
        'Exempt - No GST applies',
    };

    return descriptions[category];
  }

  /**
   * Check if item is likely GST-free
   */
  static isLikelyGSTFree(itemDescription: string): boolean {
    const gstFreeKeywords = [
      'bread',
      'milk',
      'meat',
      'vegetable',
      'fruit',
      'health',
      'medical',
      'prescription',
      'education',
      'childcare',
      'export',
    ];

    const lowerDesc = itemDescription.toLowerCase();
    return gstFreeKeywords.some((keyword) => lowerDesc.includes(keyword));
  }

  /**
   * Check if item is likely input-taxed
   */
  static isLikelyInputTaxed(itemDescription: string): boolean {
    const inputTaxedKeywords = [
      'financial',
      'lending',
      'credit',
      'residential rent',
      'residential lease',
    ];

    const lowerDesc = itemDescription.toLowerCase();
    return inputTaxedKeywords.some((keyword) => lowerDesc.includes(keyword));
  }

  /**
   * Get state name from code
   */
  static getStateName(state: AustralianState): string {
    const rules = this.getStateTaxRules(state);
    return rules.stateName;
  }

  /**
   * Get all states and territories
   */
  static getAllStates(): AustralianState[] {
    return Object.values(AustralianState);
  }

  /**
   * BAS (Business Activity Statement) filing frequency determination
   */
  static determineBASFilingFrequency(annualGST: number): 'MONTHLY' | 'QUARTERLY' {
    // Monthly if annual GST over $20 million or if chosen by business
    // Quarterly for most businesses
    return annualGST > 20000000 ? 'MONTHLY' : 'QUARTERLY';
  }

  /**
   * Get BAS lodgment deadlines
   */
  static getBASDeadline(
    period: 'QUARTERLY' | 'MONTHLY',
    quarter?: number,
    month?: number,
  ): {
    lodgmentDeadline: string;
    paymentDeadline: string;
  } {
    if (period === 'QUARTERLY') {
      // Quarterly deadlines: 28 days after quarter end
      const quarterDeadlines = {
        1: { lodgment: 'April 28', payment: 'April 28' }, // Jul-Sep
        2: { lodgment: 'July 28', payment: 'July 28' }, // Oct-Dec
        3: { lodgment: 'October 28', payment: 'October 28' }, // Jan-Mar
        4: { lodgment: 'January 28', payment: 'January 28' }, // Apr-Jun
      };

      const deadline = quarterDeadlines[quarter as keyof typeof quarterDeadlines] || {
        lodgment: '28 days after quarter end',
        payment: '28 days after quarter end',
      };

      return {
        lodgmentDeadline: deadline.lodgment,
        paymentDeadline: deadline.payment,
      };
    }

    return {
      lodgmentDeadline: '21st of the following month',
      paymentDeadline: '21st of the following month',
    };
  }
}
