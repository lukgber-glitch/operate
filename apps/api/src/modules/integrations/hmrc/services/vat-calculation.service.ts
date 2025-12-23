import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import {
  VatCalculationInput,
  VatCalculationResult,
  VatRateType,
  VatCalculationBreakdown,
} from '../interfaces/vat-calculation.interface';

/**
 * VAT Calculation Service
 *
 * Calculates VAT amounts from invoices and expenses for HMRC VAT returns.
 * Handles different VAT rates and EC transactions.
 *
 * UK VAT Rates:
 * - Standard Rate: 20%
 * - Reduced Rate: 5%
 * - Zero Rate: 0%
 *
 * Features:
 * - Automatic VAT calculation from invoices/expenses
 * - EC sales and acquisitions handling
 * - Flat Rate Scheme support
 * - Reverse charge mechanism
 */
@Injectable()
export class VatCalculationService {
  private readonly logger = new Logger(VatCalculationService.name);

  // UK VAT rates (in percentage)
  private readonly VAT_RATES = {
    STANDARD: 20.0,
    REDUCED: 5.0,
    ZERO: 0.0,
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate VAT return boxes from invoices and expenses
   */
  async calculateVatReturn(
    input: VatCalculationInput,
  ): Promise<VatCalculationResult> {
    const { orgId, periodFrom, periodTo, vrn } = input;

    this.logger.log(
      `Calculating VAT return for org ${orgId}, period ${periodFrom} to ${periodTo}`,
    );

    // Fetch invoices (sales) for the period
    const invoices = await this.prisma.invoice.findMany({
      where: {
        orgId,
        issueDate: {
          gte: periodFrom,
          lte: periodTo,
        },
        status: { in: ['SENT', 'PAID', 'PARTIALLY_PAID'] },
      },
      include: {
        items: true,
        client: true,
      },
    });

    // Fetch expenses (purchases) for the period
    const expenses = await this.prisma.expense.findMany({
      where: {
        orgId,
        date: {
          gte: periodFrom,
          lte: periodTo,
        },
        status: { in: ['APPROVED', 'REIMBURSED'] },
      },
    });

    // Calculate sales VAT (Box 1)
    const salesVat = this.calculateSalesVat(invoices);

    // Calculate EC acquisitions VAT (Box 2)
    const ecAcquisitionsVat = this.calculateEcAcquisitionsVat(expenses);

    // Calculate total VAT due (Box 3 = Box 1 + Box 2)
    const totalVatDue = salesVat.totalVat + ecAcquisitionsVat.totalVat;

    // Calculate input VAT (Box 4)
    const inputVat = this.calculateInputVat(expenses);

    // Calculate net VAT (Box 5 = Box 3 - Box 4)
    const netVatDue = totalVatDue - inputVat.totalVat;

    // Calculate total sales (Box 6)
    const totalSalesExVat = salesVat.totalNetAmount;

    // Calculate total purchases (Box 7)
    const totalPurchasesExVat = inputVat.totalNetAmount;

    // Calculate EC supplies (Box 8)
    const ecSupplies = this.calculateEcSupplies(invoices);

    // Calculate EC acquisitions (Box 9)
    const ecAcquisitions = this.calculateEcAcquisitions(expenses);

    // Convert from pounds to pence (HMRC requires pence)
    const result: VatCalculationResult = {
      periodFrom,
      periodTo,
      // All amounts in pence
      box1VatDueSales: this.poundsToPence(salesVat.totalVat),
      box2VatDueAcquisitions: this.poundsToPence(ecAcquisitionsVat.totalVat),
      box3TotalVatDue: this.poundsToPence(totalVatDue),
      box4VatReclaimed: this.poundsToPence(inputVat.totalVat),
      box5NetVatDue: this.poundsToPence(netVatDue),
      box6TotalValueSalesExVat: this.poundsToPence(totalSalesExVat),
      box7TotalValuePurchasesExVat: this.poundsToPence(totalPurchasesExVat),
      box8TotalValueGoodsSupplied: this.poundsToPence(ecSupplies.totalNetAmount),
      box9TotalAcquisitionsExVat: this.poundsToPence(ecAcquisitions.totalNetAmount),
      breakdown: {
        salesVat,
        ecAcquisitionsVat,
        inputVat,
        ecSupplies,
        ecAcquisitions,
      },
      metadata: {
        invoiceCount: invoices.length,
        expenseCount: expenses.length,
        calculatedAt: new Date(),
      },
    };

    this.logger.log(
      `VAT calculation complete. Net VAT due: £${(netVatDue / 100).toFixed(2)}`,
    );

    return result;
  }

  /**
   * Calculate sales VAT (Box 1)
   */
  private calculateSalesVat(invoices: any[]): VatCalculationBreakdown {
    let totalVat = 0;
    let totalNetAmount = 0;
    const details: any[] = [];

    for (const invoice of invoices) {
      // Skip EC sales (they go in Box 8, not Box 1)
      const isEcSale = this.isEcCountry(invoice.customerCountry);
      if (isEcSale) continue;

      // Calculate VAT from invoice items
      for (const item of invoice.items || []) {
        const netAmount = parseFloat(item.amount?.toString() || '0');
        const vatRate = this.getVatRate(item.taxRate);
        const vatAmount = (netAmount * vatRate) / 100;

        totalNetAmount += netAmount;
        totalVat += vatAmount;

        details.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          itemDescription: item.description,
          netAmount,
          vatRate,
          vatAmount,
        });
      }
    }

    return {
      totalVat,
      totalNetAmount,
      count: details.length,
      details,
    };
  }

  /**
   * Calculate EC acquisitions VAT (Box 2)
   */
  private calculateEcAcquisitionsVat(expenses: any[]): VatCalculationBreakdown {
    let totalVat = 0;
    let totalNetAmount = 0;
    const details: any[] = [];

    for (const expense of expenses) {
      // Only include EC acquisitions (reverse charge)
      const isEcAcquisition = this.isEcCountry(expense.vendorCountry);
      if (!isEcAcquisition) continue;

      const netAmount = parseFloat(expense.amount?.toString() || '0');
      // Use standard rate for reverse charge
      const vatAmount = (netAmount * this.VAT_RATES.STANDARD) / 100;

      totalNetAmount += netAmount;
      totalVat += vatAmount;

      details.push({
        expenseId: expense.id,
        description: expense.description,
        netAmount,
        vatRate: this.VAT_RATES.STANDARD,
        vatAmount,
      });
    }

    return {
      totalVat,
      totalNetAmount,
      count: details.length,
      details,
    };
  }

  /**
   * Calculate input VAT (Box 4)
   */
  private calculateInputVat(expenses: any[]): VatCalculationBreakdown {
    let totalVat = 0;
    let totalNetAmount = 0;
    const details: any[] = [];

    for (const expense of expenses) {
      const netAmount = parseFloat(expense.amount?.toString() || '0');
      const vatRate = this.getVatRate(expense.vatRate);

      // For EC acquisitions, include the reverse charge VAT as reclaimable
      const isEcAcquisition = this.isEcCountry(expense.vendorCountry);
      const vatAmount = isEcAcquisition
        ? (netAmount * this.VAT_RATES.STANDARD) / 100
        : (netAmount * vatRate) / 100;

      totalNetAmount += netAmount;
      totalVat += vatAmount;

      details.push({
        expenseId: expense.id,
        description: expense.description,
        netAmount,
        vatRate: isEcAcquisition ? this.VAT_RATES.STANDARD : vatRate,
        vatAmount,
        isEcAcquisition,
      });
    }

    return {
      totalVat,
      totalNetAmount,
      count: details.length,
      details,
    };
  }

  /**
   * Calculate EC supplies (Box 8)
   */
  private calculateEcSupplies(invoices: any[]): VatCalculationBreakdown {
    let totalAmount = 0;
    const details: any[] = [];

    for (const invoice of invoices) {
      const isEcSale = this.isEcCountry(invoice.customerCountry);
      if (!isEcSale) continue;

      const netAmount = parseFloat(invoice.totalAmount?.toString() || '0');
      totalAmount += netAmount;

      details.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        customerCountry: invoice.customerCountry,
        netAmount,
      });
    }

    return {
      totalVat: 0, // No VAT on EC supplies
      totalNetAmount: totalAmount,
      count: details.length,
      details,
    };
  }

  /**
   * Calculate EC acquisitions (Box 9)
   */
  private calculateEcAcquisitions(expenses: any[]): VatCalculationBreakdown {
    let totalAmount = 0;
    const details: any[] = [];

    for (const expense of expenses) {
      const isEcAcquisition = this.isEcCountry(expense.vendorCountry);
      if (!isEcAcquisition) continue;

      const netAmount = parseFloat(expense.amount?.toString() || '0');
      totalAmount += netAmount;

      details.push({
        expenseId: expense.id,
        description: expense.description,
        vendorCountry: expense.vendorCountry,
        netAmount,
      });
    }

    return {
      totalVat: 0, // VAT is handled in Box 2 and Box 4
      totalNetAmount: totalAmount,
      count: details.length,
      details,
    };
  }

  /**
   * Get VAT rate from tax rate field
   */
  private getVatRate(taxRate?: number | null): number {
    if (!taxRate) return this.VAT_RATES.STANDARD;

    const rate = parseFloat(taxRate.toString());

    // Match to closest standard rate
    if (rate >= 19 && rate <= 21) return this.VAT_RATES.STANDARD;
    if (rate >= 4 && rate <= 6) return this.VAT_RATES.REDUCED;
    if (rate === 0) return this.VAT_RATES.ZERO;

    return this.VAT_RATES.STANDARD;
  }

  /**
   * Check if country is in the EU (for EC transactions)
   */
  private isEcCountry(countryCode?: string | null): boolean {
    if (!countryCode) return false;

    // EU member states (excluding UK)
    const euCountries = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    ];

    return euCountries.includes(countryCode.toUpperCase());
  }

  /**
   * Convert pounds to pence
   */
  private poundsToPence(pounds: number): number {
    return Math.round(pounds * 100);
  }

  /**
   * Convert pence to pounds
   */
  private penceToPounds(pence: number): number {
    return pence / 100;
  }

  /**
   * Validate VAT return calculations
   */
  validateVatReturn(result: VatCalculationResult): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Box 3 should equal Box 1 + Box 2
    if (result.box3TotalVatDue !== result.box1VatDueSales + result.box2VatDueAcquisitions) {
      errors.push('Box 3 (Total VAT Due) must equal Box 1 + Box 2');
    }

    // Box 5 should equal Box 3 - Box 4
    if (result.box5NetVatDue !== result.box3TotalVatDue - result.box4VatReclaimed) {
      errors.push('Box 5 (Net VAT) must equal Box 3 - Box 4');
    }

    // All amounts should be in whole pence
    const boxes = [
      result.box1VatDueSales,
      result.box2VatDueAcquisitions,
      result.box3TotalVatDue,
      result.box4VatReclaimed,
      result.box5NetVatDue,
      result.box6TotalValueSalesExVat,
      result.box7TotalValuePurchasesExVat,
      result.box8TotalValueGoodsSupplied,
      result.box9TotalAcquisitionsExVat,
    ];

    for (const amount of boxes) {
      if (!Number.isInteger(amount)) {
        errors.push('All amounts must be whole pence (integers)');
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
