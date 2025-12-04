/**
 * Spanish Tax Configuration Module
 * Provides tax rate lookup, validation, and configuration for Spain
 * Task: W25-T2 - Spanish tax configuration
 */

import {
  SPAIN_IVA_RATES,
  SPAIN_IGIC_RATES,
  SPAIN_RECARGO_EQUIVALENCIA_RATES,
  SPAIN_TAX_REGIMES,
  SPAIN_QUARTERLY_DEADLINES,
  SPAIN_ANNUAL_DEADLINES,
  SPAIN_MODELO_347_THRESHOLD,
  SPAIN_INTRA_COMMUNITY_THRESHOLD,
} from '@operate/shared/constants/spain-tax.constants';

import {
  isValidSpanishTaxId,
  isValidSpanishVATNumber,
  getSpanishTaxIdType,
  usesIGIC,
  hasSpecialTaxTreatment,
} from '@operate/shared/utils/spain-tax.validator';

/**
 * Tax rate type
 */
export type TaxRateType = 'IVA' | 'IGIC' | 'RE';

/**
 * Tax category
 */
export type SpanishTaxCategory =
  | 'STANDARD'
  | 'REDUCED'
  | 'SUPER_REDUCED'
  | 'ZERO'
  | 'EXEMPT';

/**
 * Tax regime
 */
export type SpanishTaxRegime = keyof typeof SPAIN_TAX_REGIMES;

/**
 * Tax rate result
 */
export interface TaxRateResult {
  rate: number;
  category: SpanishTaxCategory;
  type: TaxRateType;
  description: string;
  regime?: string;
}

/**
 * Filing deadline result
 */
export interface FilingDeadline {
  form: string;
  description: string;
  period: string;
  filingStart: string;
  filingEnd: string;
}

/**
 * Spanish Tax Configuration Service
 */
export class SpainTaxConfig {
  /**
   * Get IVA rate by category
   */
  static getIVARate(category: SpanishTaxCategory): TaxRateResult | null {
    const rates: Record<SpanishTaxCategory, number | null> = {
      STANDARD: SPAIN_IVA_RATES.STANDARD,
      REDUCED: SPAIN_IVA_RATES.REDUCED,
      SUPER_REDUCED: SPAIN_IVA_RATES.SUPER_REDUCED,
      ZERO: SPAIN_IVA_RATES.ZERO,
      EXEMPT: 0,
    };

    const rate = rates[category];
    if (rate === null || rate === undefined) {
      return null;
    }

    return {
      rate,
      category,
      type: 'IVA',
      description: this.getIVADescription(category),
    };
  }

  /**
   * Get IGIC rate by category (Canary Islands)
   */
  static getIGICRate(category: SpanishTaxCategory): TaxRateResult | null {
    const rates: Record<SpanishTaxCategory, number | null> = {
      STANDARD: SPAIN_IGIC_RATES.GENERAL,
      REDUCED: SPAIN_IGIC_RATES.REDUCED,
      SUPER_REDUCED: SPAIN_IGIC_RATES.ZERO,
      ZERO: SPAIN_IGIC_RATES.ZERO,
      EXEMPT: 0,
    };

    const rate = rates[category];
    if (rate === null || rate === undefined) {
      return null;
    }

    return {
      rate,
      category,
      type: 'IGIC',
      description: this.getIGICDescription(category),
    };
  }

  /**
   * Get Recargo de Equivalencia rate
   */
  static getRecargoRate(category: SpanishTaxCategory): TaxRateResult | null {
    const rates: Record<SpanishTaxCategory, number | null> = {
      STANDARD: SPAIN_RECARGO_EQUIVALENCIA_RATES.STANDARD,
      REDUCED: SPAIN_RECARGO_EQUIVALENCIA_RATES.REDUCED,
      SUPER_REDUCED: SPAIN_RECARGO_EQUIVALENCIA_RATES.SUPER_REDUCED,
      ZERO: 0,
      EXEMPT: 0,
    };

    const rate = rates[category];
    if (rate === null || rate === undefined) {
      return null;
    }

    return {
      rate,
      category,
      type: 'RE',
      description: `Recargo de Equivalencia ${rate}% (added to IVA)`,
      regime: 'RECARGO_EQUIVALENCIA',
    };
  }

  /**
   * Get applicable tax rate based on location and regime
   */
  static getTaxRate(
    category: SpanishTaxCategory,
    province?: string,
    regime?: SpanishTaxRegime,
  ): TaxRateResult | null {
    // Check if Canary Islands (uses IGIC)
    if (province && usesIGIC(province)) {
      return this.getIGICRate(category);
    }

    // Check if Recargo de Equivalencia regime
    if (regime === 'RECARGO_EQUIVALENCIA') {
      return this.getRecargoRate(category);
    }

    // Default to IVA
    return this.getIVARate(category);
  }

  /**
   * Get combined tax rate (IVA + RE if applicable)
   */
  static getCombinedTaxRate(
    category: SpanishTaxCategory,
    province?: string,
    regime?: SpanishTaxRegime,
  ): { total: number; breakdown: TaxRateResult[] } {
    const breakdown: TaxRateResult[] = [];
    let total = 0;

    // Base tax (IVA or IGIC)
    const baseTax = this.getTaxRate(category, province, regime);
    if (baseTax) {
      breakdown.push(baseTax);
      total += baseTax.rate;
    }

    // Add Recargo de Equivalencia if applicable
    if (regime === 'RECARGO_EQUIVALENCIA' && !province?.match(/canary|las palmas|santa cruz/i)) {
      const recargo = this.getRecargoRate(category);
      if (recargo && recargo.rate > 0) {
        breakdown.push(recargo);
        total += recargo.rate;
      }
    }

    return { total, breakdown };
  }

  /**
   * Get filing deadline for a specific quarter
   */
  static getQuarterlyDeadline(quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'): FilingDeadline {
    const deadline = SPAIN_QUARTERLY_DEADLINES[quarter];
    return {
      form: deadline.form,
      description: `Quarterly VAT return for ${deadline.period}`,
      period: deadline.period,
      filingStart: deadline.filingStart,
      filingEnd: deadline.filingEnd,
    };
  }

  /**
   * Get annual filing deadlines
   */
  static getAnnualDeadlines(): FilingDeadline[] {
    return [
      {
        form: 'Modelo 390',
        description: SPAIN_ANNUAL_DEADLINES.MODELO_390.description,
        period: SPAIN_ANNUAL_DEADLINES.MODELO_390.period,
        filingStart: SPAIN_ANNUAL_DEADLINES.MODELO_390.filingStart,
        filingEnd: SPAIN_ANNUAL_DEADLINES.MODELO_390.filingEnd,
      },
      {
        form: 'Modelo 347',
        description: SPAIN_ANNUAL_DEADLINES.MODELO_347.description,
        period: SPAIN_ANNUAL_DEADLINES.MODELO_347.period,
        filingStart: SPAIN_ANNUAL_DEADLINES.MODELO_347.filingStart,
        filingEnd: SPAIN_ANNUAL_DEADLINES.MODELO_347.filingEnd,
      },
      {
        form: 'Modelo 200',
        description: SPAIN_ANNUAL_DEADLINES.MODELO_200.description,
        period: SPAIN_ANNUAL_DEADLINES.MODELO_200.period,
        filingStart: '',
        filingEnd: SPAIN_ANNUAL_DEADLINES.MODELO_200.filingEnd,
      },
    ];
  }

  /**
   * Check if transaction requires Modelo 347 reporting
   */
  static requiresModelo347(totalAmount: number): boolean {
    return totalAmount >= SPAIN_MODELO_347_THRESHOLD;
  }

  /**
   * Check if transaction is above intra-community threshold
   */
  static isAboveIntraCommunityThreshold(totalAmount: number): boolean {
    return totalAmount >= SPAIN_INTRA_COMMUNITY_THRESHOLD;
  }

  /**
   * Validate Spanish tax ID
   */
  static validateTaxId(taxId: string): {
    valid: boolean;
    type?: 'NIF' | 'NIE' | 'CIF';
    formatted?: string;
  } {
    const valid = isValidSpanishTaxId(taxId);
    if (!valid) {
      return { valid: false };
    }

    const type = getSpanishTaxIdType(taxId);
    return {
      valid: true,
      type: type !== 'INVALID' ? type : undefined,
      formatted: taxId.replace(/[\s-]/g, '').toUpperCase(),
    };
  }

  /**
   * Validate Spanish VAT number
   */
  static validateVATNumber(vatNumber: string): {
    valid: boolean;
    formatted?: string;
  } {
    const valid = isValidSpanishVATNumber(vatNumber);
    if (!valid) {
      return { valid: false };
    }

    return {
      valid: true,
      formatted: vatNumber.replace(/[\s-]/g, '').toUpperCase(),
    };
  }

  /**
   * Get IVA description by category
   */
  private static getIVADescription(category: SpanishTaxCategory): string {
    const descriptions: Record<SpanishTaxCategory, string> = {
      STANDARD: 'IVA General - Standard rate (21%)',
      REDUCED: 'IVA Reducido - Reduced rate (10%)',
      SUPER_REDUCED: 'IVA Superreducido - Super-reduced rate (4%)',
      ZERO: 'IVA Zero rate - Exports and intra-EU (0%)',
      EXEMPT: 'IVA Exempt - Healthcare, education, etc.',
    };
    return descriptions[category];
  }

  /**
   * Get IGIC description by category
   */
  private static getIGICDescription(category: SpanishTaxCategory): string {
    const descriptions: Record<SpanishTaxCategory, string> = {
      STANDARD: 'IGIC General - Standard rate for Canary Islands (7%)',
      REDUCED: 'IGIC Reducido - Reduced rate for Canary Islands (3%)',
      SUPER_REDUCED: 'IGIC Zero rate - Canary Islands (0%)',
      ZERO: 'IGIC Zero rate - Exports (0%)',
      EXEMPT: 'IGIC Exempt',
    };
    return descriptions[category];
  }

  /**
   * Get tax regime description
   */
  static getTaxRegimeDescription(regime: SpanishTaxRegime): string {
    const descriptions: Record<SpanishTaxRegime, string> = {
      REGIMEN_GENERAL: 'General Regime - Standard VAT regime',
      REGIMEN_SIMPLIFICADO: 'Simplified Regime - Module-based taxation',
      RECARGO_EQUIVALENCIA: 'Retailers Surcharge Regime - For small retailers',
      RECC: 'Cash Accounting Regime - Pay VAT when receiving payment',
      REBU: 'Second-hand Goods Regime - Special margins scheme',
      REGE: 'Group Entities Regime - Consolidated VAT for groups',
      IGIC: 'Canary Islands Regime - IGIC instead of IVA',
    };
    return descriptions[regime];
  }

  /**
   * Check if location has special tax treatment
   */
  static hasSpecialTaxTreatment(location: string): {
    special: boolean;
    type?: 'IGIC' | 'CEUTA_MELILLA';
    description?: string;
  } {
    if (usesIGIC(location)) {
      return {
        special: true,
        type: 'IGIC',
        description: 'Canary Islands - Uses IGIC instead of IVA',
      };
    }

    if (hasSpecialTaxTreatment(location)) {
      return {
        special: true,
        type: 'CEUTA_MELILLA',
        description: 'Ceuta/Melilla - Special tax rates and exemptions apply',
      };
    }

    return { special: false };
  }
}
