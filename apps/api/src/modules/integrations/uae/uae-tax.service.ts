import { Injectable, Logger } from '@nestjs/common';
import {
  UAE_VAT_RATES,
  UAEVATRateCode,
  ZERO_RATED_CATEGORIES,
  EXEMPT_CATEGORIES,
  REVERSE_CHARGE_SCENARIOS,
  TOURIST_VAT_REFUND,
} from './constants/uae.constants';
import {
  UAEVATCalculation,
  UAEInvoiceLineItem,
  UAETaxBreakdown,
  UAEAllowanceCharge,
} from './interfaces/uae.types';

/**
 * UAE Tax Service
 * Handles VAT calculation, rate determination, and tax-related business logic
 */
@Injectable()
export class UAETaxService {
  private readonly logger = new Logger(UAETaxService.name);

  /**
   * Calculate VAT for invoice line items
   */
  calculateVAT(
    lineItems: UAEInvoiceLineItem[],
    currency: string = 'AED',
    allowances?: UAEAllowanceCharge[],
    charges?: UAEAllowanceCharge[],
  ): UAEVATCalculation {
    this.logger.debug(`Calculating VAT for ${lineItems.length} line items`);

    // Calculate line extension amount (sum of all line items)
    const lineExtensionAmount = lineItems.reduce(
      (sum, item) => sum + item.lineExtensionAmount,
      0,
    );

    // Calculate document-level allowances and charges
    const allowanceTotalAmount = this.calculateAllowancesTotal(allowances || []);
    const chargeTotalAmount = this.calculateChargesTotal(charges || []);

    // Calculate tax exclusive amount
    const taxExclusiveAmount =
      lineExtensionAmount - allowanceTotalAmount + chargeTotalAmount;

    // Group line items by tax category and calculate tax breakdown
    const taxBreakdown = this.calculateTaxBreakdown(
      lineItems,
      allowances || [],
      charges || [],
    );

    // Calculate total tax amount
    const taxTotalAmount = taxBreakdown.reduce(
      (sum, breakdown) => sum + breakdown.taxAmount,
      0,
    );

    // Calculate tax inclusive amount
    const taxInclusiveAmount = taxExclusiveAmount + taxTotalAmount;

    return {
      taxExclusiveAmount: this.roundAmount(taxExclusiveAmount),
      taxBreakdown,
      taxTotalAmount: this.roundAmount(taxTotalAmount),
      taxInclusiveAmount: this.roundAmount(taxInclusiveAmount),
      currency,
    };
  }

  /**
   * Calculate tax breakdown by category
   */
  private calculateTaxBreakdown(
    lineItems: UAEInvoiceLineItem[],
    allowances: UAEAllowanceCharge[],
    charges: UAEAllowanceCharge[],
  ): UAETaxBreakdown[] {
    const taxMap = new Map<string, UAETaxBreakdown>();

    // Process line items
    for (const item of lineItems) {
      const key = `${item.taxCategory}-${item.taxRate}`;

      if (!taxMap.has(key)) {
        taxMap.set(key, {
          taxCategory: item.taxCategory,
          taxRate: item.taxRate,
          taxableAmount: 0,
          taxAmount: 0,
        });
      }

      const breakdown = taxMap.get(key)!;
      breakdown.taxableAmount += item.lineExtensionAmount;
      breakdown.taxAmount += item.taxAmount;
    }

    // Process document-level allowances
    for (const allowance of allowances) {
      if (allowance.taxCategory && allowance.taxRate !== undefined) {
        const key = `${allowance.taxCategory}-${allowance.taxRate}`;

        if (!taxMap.has(key)) {
          taxMap.set(key, {
            taxCategory: allowance.taxCategory,
            taxRate: allowance.taxRate,
            taxableAmount: 0,
            taxAmount: 0,
          });
        }

        const breakdown = taxMap.get(key)!;
        breakdown.taxableAmount -= allowance.amount;
        if (allowance.taxAmount) {
          breakdown.taxAmount -= allowance.taxAmount;
        }
      }
    }

    // Process document-level charges
    for (const charge of charges) {
      if (charge.taxCategory && charge.taxRate !== undefined) {
        const key = `${charge.taxCategory}-${charge.taxRate}`;

        if (!taxMap.has(key)) {
          taxMap.set(key, {
            taxCategory: charge.taxCategory,
            taxRate: charge.taxRate,
            taxableAmount: 0,
            taxAmount: 0,
          });
        }

        const breakdown = taxMap.get(key)!;
        breakdown.taxableAmount += charge.amount;
        if (charge.taxAmount) {
          breakdown.taxAmount += charge.taxAmount;
        }
      }
    }

    // Round all amounts
    return Array.from(taxMap.values()).map((breakdown) => ({
      ...breakdown,
      taxableAmount: this.roundAmount(breakdown.taxableAmount),
      taxAmount: this.roundAmount(breakdown.taxAmount),
    }));
  }

  /**
   * Calculate allowances total
   */
  private calculateAllowancesTotal(allowances: UAEAllowanceCharge[]): number {
    return allowances
      .filter((a) => a.type === 'ALLOWANCE')
      .reduce((sum, a) => sum + a.amount, 0);
  }

  /**
   * Calculate charges total
   */
  private calculateChargesTotal(charges: UAEAllowanceCharge[]): number {
    return charges
      .filter((c) => c.type === 'CHARGE')
      .reduce((sum, c) => sum + c.amount, 0);
  }

  /**
   * Calculate line item tax amount
   */
  calculateLineItemTax(
    lineExtensionAmount: number,
    taxCategory: UAEVATRateCode,
    taxRate: number,
  ): number {
    if (taxCategory === UAEVATRateCode.EXEMPT || taxCategory === UAEVATRateCode.OUT_OF_SCOPE) {
      return 0;
    }

    const taxAmount = lineExtensionAmount * taxRate;
    return this.roundAmount(taxAmount);
  }

  /**
   * Get VAT rate for a given category
   */
  getVATRate(category: UAEVATRateCode): number {
    switch (category) {
      case UAEVATRateCode.STANDARD:
        return UAE_VAT_RATES.STANDARD;
      case UAEVATRateCode.ZERO_RATED:
        return UAE_VAT_RATES.ZERO_RATED;
      case UAEVATRateCode.EXEMPT:
      case UAEVATRateCode.OUT_OF_SCOPE:
        return 0;
      default:
        return UAE_VAT_RATES.STANDARD;
    }
  }

  /**
   * Determine if supply is zero-rated
   */
  isZeroRated(category: string): boolean {
    return ZERO_RATED_CATEGORIES.includes(category as Prisma.InputJsonValue);
  }

  /**
   * Determine if supply is exempt
   */
  isExempt(category: string): boolean {
    return EXEMPT_CATEGORIES.includes(category as Prisma.InputJsonValue);
  }

  /**
   * Check if reverse charge applies
   */
  isReverseCharge(scenario: string): boolean {
    return REVERSE_CHARGE_SCENARIOS.includes(scenario as Prisma.InputJsonValue);
  }

  /**
   * Calculate tourist VAT refund
   */
  calculateTouristRefund(purchaseAmount: number, vatAmount: number): {
    refundableVAT: number;
    processingFee: number;
    adminFee: number;
    netRefund: number;
  } | null {
    // Check if purchase meets minimum threshold
    if (purchaseAmount < TOURIST_VAT_REFUND.MIN_PURCHASE_AMOUNT) {
      return null;
    }

    // Calculate fees
    const processingFee = vatAmount * TOURIST_VAT_REFUND.REFUND_PROCESSING_FEE_RATE;
    const adminFee = TOURIST_VAT_REFUND.ADMIN_FEE;

    // Calculate net refund
    const netRefund = vatAmount - processingFee - adminFee;

    return {
      refundableVAT: this.roundAmount(vatAmount),
      processingFee: this.roundAmount(processingFee),
      adminFee: this.roundAmount(adminFee),
      netRefund: this.roundAmount(Math.max(0, netRefund)),
    };
  }

  /**
   * Calculate reverse charge VAT
   * For imported services where customer is responsible for VAT
   */
  calculateReverseChargeVAT(serviceAmount: number): {
    outputVAT: number;
    inputVAT: number;
    netVAT: number;
  } {
    const vatAmount = serviceAmount * UAE_VAT_RATES.STANDARD;

    return {
      outputVAT: this.roundAmount(vatAmount),
      inputVAT: this.roundAmount(vatAmount), // Customer can claim input VAT
      netVAT: 0, // Net effect is zero if fully recoverable
    };
  }

  /**
   * Calculate input VAT (VAT on purchases)
   */
  calculateInputVAT(
    purchases: Array<{ amount: number; vatRate: number; recoverable: boolean }>,
  ): {
    totalInputVAT: number;
    recoverableInputVAT: number;
    nonRecoverableInputVAT: number;
  } {
    let totalInputVAT = 0;
    let recoverableInputVAT = 0;
    let nonRecoverableInputVAT = 0;

    for (const purchase of purchases) {
      const vatAmount = purchase.amount * purchase.vatRate;
      totalInputVAT += vatAmount;

      if (purchase.recoverable) {
        recoverableInputVAT += vatAmount;
      } else {
        nonRecoverableInputVAT += vatAmount;
      }
    }

    return {
      totalInputVAT: this.roundAmount(totalInputVAT),
      recoverableInputVAT: this.roundAmount(recoverableInputVAT),
      nonRecoverableInputVAT: this.roundAmount(nonRecoverableInputVAT),
    };
  }

  /**
   * Calculate output VAT (VAT on sales)
   */
  calculateOutputVAT(
    sales: Array<{ amount: number; vatRate: number; category: UAEVATRateCode }>,
  ): {
    totalOutputVAT: number;
    standardRateVAT: number;
    zeroRatedVAT: number;
  } {
    let totalOutputVAT = 0;
    let standardRateVAT = 0;
    let zeroRatedVAT = 0;

    for (const sale of sales) {
      const vatAmount = sale.amount * sale.vatRate;
      totalOutputVAT += vatAmount;

      if (sale.category === UAEVATRateCode.STANDARD) {
        standardRateVAT += vatAmount;
      } else if (sale.category === UAEVATRateCode.ZERO_RATED) {
        zeroRatedVAT += vatAmount;
      }
    }

    return {
      totalOutputVAT: this.roundAmount(totalOutputVAT),
      standardRateVAT: this.roundAmount(standardRateVAT),
      zeroRatedVAT: this.roundAmount(zeroRatedVAT),
    };
  }

  /**
   * Calculate net VAT payable
   */
  calculateNetVAT(outputVAT: number, inputVAT: number): {
    netVAT: number;
    payable: boolean;
  } {
    const netVAT = outputVAT - inputVAT;

    return {
      netVAT: this.roundAmount(netVAT),
      payable: netVAT > 0,
    };
  }

  /**
   * Convert amount from tax-inclusive to tax-exclusive
   */
  convertTaxInclusiveToExclusive(
    taxInclusiveAmount: number,
    taxRate: number,
  ): {
    taxExclusiveAmount: number;
    taxAmount: number;
  } {
    const taxExclusiveAmount = taxInclusiveAmount / (1 + taxRate);
    const taxAmount = taxInclusiveAmount - taxExclusiveAmount;

    return {
      taxExclusiveAmount: this.roundAmount(taxExclusiveAmount),
      taxAmount: this.roundAmount(taxAmount),
    };
  }

  /**
   * Convert amount from tax-exclusive to tax-inclusive
   */
  convertTaxExclusiveToInclusive(
    taxExclusiveAmount: number,
    taxRate: number,
  ): {
    taxInclusiveAmount: number;
    taxAmount: number;
  } {
    const taxAmount = taxExclusiveAmount * taxRate;
    const taxInclusiveAmount = taxExclusiveAmount + taxAmount;

    return {
      taxInclusiveAmount: this.roundAmount(taxInclusiveAmount),
      taxAmount: this.roundAmount(taxAmount),
    };
  }

  /**
   * Round amount to 2 decimal places
   */
  private roundAmount(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Calculate proportional VAT for mixed supplies
   * (Supplies that include both taxable and exempt elements)
   */
  calculateProportionalVAT(
    totalAmount: number,
    taxablePercentage: number,
    vatRate: number,
  ): {
    taxableAmount: number;
    exemptAmount: number;
    vatAmount: number;
  } {
    const taxableAmount = totalAmount * taxablePercentage;
    const exemptAmount = totalAmount - taxableAmount;
    const vatAmount = taxableAmount * vatRate;

    return {
      taxableAmount: this.roundAmount(taxableAmount),
      exemptAmount: this.roundAmount(exemptAmount),
      vatAmount: this.roundAmount(vatAmount),
    };
  }
}
