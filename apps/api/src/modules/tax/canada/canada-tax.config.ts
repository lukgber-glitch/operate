/**
 * Canadian Tax Configuration Module
 * Provides comprehensive tax rate lookup, validation, and configuration for Canada
 * Task: W26-T4 - Canadian/Australian tax rules
 */

import {
  CanadianProvince,
  CanadianTaxType,
  CanadianTaxCategory,
  CanadianProvinceTaxRates,
  CanadianTaxCalculation,
} from '@operate/shared/types/tax/canada-tax.types';

/**
 * Canadian Tax Configuration Service
 */
export class CanadaTaxConfig {
  /**
   * Federal GST rate (applies across Canada)
   */
  static readonly FEDERAL_GST_RATE = 5;

  /**
   * Small supplier threshold (annual revenue)
   * Below this, GST/HST registration is optional
   */
  static readonly SMALL_SUPPLIER_THRESHOLD = 30000; // CAD

  /**
   * Get tax rates for a specific province
   */
  static getProvinceTaxRates(province: CanadianProvince): CanadianProvinceTaxRates {
    const taxRates: Record<CanadianProvince, CanadianProvinceTaxRates> = {
      [CanadianProvince.ON]: {
        province: CanadianProvince.ON,
        provinceName: 'Ontario',
        hst: 13,
        combinedRate: 13,
        taxTypes: [CanadianTaxType.HST],
      },
      [CanadianProvince.NB]: {
        province: CanadianProvince.NB,
        provinceName: 'New Brunswick',
        hst: 15,
        combinedRate: 15,
        taxTypes: [CanadianTaxType.HST],
      },
      [CanadianProvince.NL]: {
        province: CanadianProvince.NL,
        provinceName: 'Newfoundland and Labrador',
        hst: 15,
        combinedRate: 15,
        taxTypes: [CanadianTaxType.HST],
      },
      [CanadianProvince.NS]: {
        province: CanadianProvince.NS,
        provinceName: 'Nova Scotia',
        hst: 15,
        combinedRate: 15,
        taxTypes: [CanadianTaxType.HST],
      },
      [CanadianProvince.PE]: {
        province: CanadianProvince.PE,
        provinceName: 'Prince Edward Island',
        hst: 15,
        combinedRate: 15,
        taxTypes: [CanadianTaxType.HST],
      },
      [CanadianProvince.BC]: {
        province: CanadianProvince.BC,
        provinceName: 'British Columbia',
        gst: 5,
        pst: 7,
        combinedRate: 12,
        taxTypes: [CanadianTaxType.GST, CanadianTaxType.PST],
      },
      [CanadianProvince.MB]: {
        province: CanadianProvince.MB,
        provinceName: 'Manitoba',
        gst: 5,
        pst: 7,
        combinedRate: 12,
        taxTypes: [CanadianTaxType.GST, CanadianTaxType.PST],
      },
      [CanadianProvince.SK]: {
        province: CanadianProvince.SK,
        provinceName: 'Saskatchewan',
        gst: 5,
        pst: 6,
        combinedRate: 11,
        taxTypes: [CanadianTaxType.GST, CanadianTaxType.PST],
      },
      [CanadianProvince.QC]: {
        province: CanadianProvince.QC,
        provinceName: 'Quebec',
        gst: 5,
        qst: 9.975,
        combinedRate: 14.975,
        taxTypes: [CanadianTaxType.GST, CanadianTaxType.QST],
      },
      [CanadianProvince.AB]: {
        province: CanadianProvince.AB,
        provinceName: 'Alberta',
        gst: 5,
        combinedRate: 5,
        taxTypes: [CanadianTaxType.GST],
      },
      [CanadianProvince.NT]: {
        province: CanadianProvince.NT,
        provinceName: 'Northwest Territories',
        gst: 5,
        combinedRate: 5,
        taxTypes: [CanadianTaxType.GST],
      },
      [CanadianProvince.NU]: {
        province: CanadianProvince.NU,
        provinceName: 'Nunavut',
        gst: 5,
        combinedRate: 5,
        taxTypes: [CanadianTaxType.GST],
      },
      [CanadianProvince.YT]: {
        province: CanadianProvince.YT,
        provinceName: 'Yukon',
        gst: 5,
        combinedRate: 5,
        taxTypes: [CanadianTaxType.GST],
      },
    };

    return taxRates[province];
  }

  /**
   * Calculate tax for a given amount and province
   */
  static calculateTax(
    netAmount: number,
    province: CanadianProvince,
    category: CanadianTaxCategory = CanadianTaxCategory.STANDARD,
  ): CanadianTaxCalculation {
    // Zero-rated and exempt supplies have 0% tax
    if (
      category === CanadianTaxCategory.ZERO_RATED ||
      category === CanadianTaxCategory.EXEMPT
    ) {
      return {
        netAmount,
        totalTax: 0,
        grossAmount: netAmount,
        province,
        category,
        breakdown: [],
      };
    }

    const rates = this.getProvinceTaxRates(province);
    const breakdown: Array<{
      type: CanadianTaxType;
      rate: number;
      amount: number;
    }> = [];

    let totalTax = 0;
    let gst: number | undefined;
    let hst: number | undefined;
    let pst: number | undefined;
    let qst: number | undefined;

    if (rates.hst) {
      // HST provinces - single harmonized tax
      const hstAmount = (netAmount * rates.hst) / 100;
      hst = hstAmount;
      totalTax = hstAmount;
      breakdown.push({
        type: CanadianTaxType.HST,
        rate: rates.hst,
        amount: hstAmount,
      });
    } else if (rates.qst) {
      // Quebec - GST + QST (QST is calculated on price + GST)
      const gstAmount = (netAmount * rates.gst!) / 100;
      const qstBase = netAmount + gstAmount; // QST is calculated on GST-inclusive amount
      const qstAmount = (qstBase * rates.qst) / 100;
      gst = gstAmount;
      qst = qstAmount;
      totalTax = gstAmount + qstAmount;
      breakdown.push(
        {
          type: CanadianTaxType.GST,
          rate: rates.gst!,
          amount: gstAmount,
        },
        {
          type: CanadianTaxType.QST,
          rate: rates.qst,
          amount: qstAmount,
        },
      );
    } else if (rates.pst) {
      // PST provinces - GST + PST (separate calculations)
      const gstAmount = (netAmount * rates.gst!) / 100;
      const pstAmount = (netAmount * rates.pst) / 100;
      gst = gstAmount;
      pst = pstAmount;
      totalTax = gstAmount + pstAmount;
      breakdown.push(
        {
          type: CanadianTaxType.GST,
          rate: rates.gst!,
          amount: gstAmount,
        },
        {
          type: CanadianTaxType.PST,
          rate: rates.pst,
          amount: pstAmount,
        },
      );
    } else {
      // GST-only provinces
      const gstAmount = (netAmount * rates.gst!) / 100;
      gst = gstAmount;
      totalTax = gstAmount;
      breakdown.push({
        type: CanadianTaxType.GST,
        rate: rates.gst!,
        amount: gstAmount,
      });
    }

    return {
      netAmount,
      gst,
      hst,
      pst,
      qst,
      totalTax: parseFloat(totalTax.toFixed(2)),
      grossAmount: parseFloat((netAmount + totalTax).toFixed(2)),
      province,
      category,
      breakdown,
    };
  }

  /**
   * Check if a province uses HST
   */
  static isHSTProvince(province: CanadianProvince): boolean {
    return [
      CanadianProvince.ON,
      CanadianProvince.NB,
      CanadianProvince.NL,
      CanadianProvince.NS,
      CanadianProvince.PE,
    ].includes(province);
  }

  /**
   * Check if a province uses PST
   */
  static isPSTProvince(province: CanadianProvince): boolean {
    return [
      CanadianProvince.BC,
      CanadianProvince.MB,
      CanadianProvince.SK,
    ].includes(province);
  }

  /**
   * Check if a province uses QST (Quebec)
   */
  static isQSTProvince(province: CanadianProvince): boolean {
    return province === CanadianProvince.QC;
  }

  /**
   * Get all provinces grouped by tax system
   */
  static getProvincesByTaxSystem(): {
    hst: CanadianProvince[];
    gstPst: CanadianProvince[];
    gstQst: CanadianProvince[];
    gstOnly: CanadianProvince[];
  } {
    return {
      hst: [
        CanadianProvince.ON,
        CanadianProvince.NB,
        CanadianProvince.NL,
        CanadianProvince.NS,
        CanadianProvince.PE,
      ],
      gstPst: [
        CanadianProvince.BC,
        CanadianProvince.MB,
        CanadianProvince.SK,
      ],
      gstQst: [CanadianProvince.QC],
      gstOnly: [
        CanadianProvince.AB,
        CanadianProvince.NT,
        CanadianProvince.NU,
        CanadianProvince.YT,
      ],
    };
  }

  /**
   * Get province name from code
   */
  static getProvinceName(province: CanadianProvince): string {
    const rates = this.getProvinceTaxRates(province);
    return rates.provinceName;
  }

  /**
   * Get tax system description for a province
   */
  static getTaxSystemDescription(province: CanadianProvince): string {
    if (this.isHSTProvince(province)) {
      const rate = this.getProvinceTaxRates(province).hst;
      return `Harmonized Sales Tax (HST) - ${rate}%`;
    }
    if (this.isQSTProvince(province)) {
      const rates = this.getProvinceTaxRates(province);
      return `GST (${rates.gst}%) + QST (${rates.qst}%) = ${rates.combinedRate}%`;
    }
    if (this.isPSTProvince(province)) {
      const rates = this.getProvinceTaxRates(province);
      return `GST (${rates.gst}%) + PST (${rates.pst}%) = ${rates.combinedRate}%`;
    }
    return `Goods and Services Tax (GST) - ${this.FEDERAL_GST_RATE}%`;
  }
}
