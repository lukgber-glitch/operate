import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@operate/database';
import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  addMonths,
  addDays
} from 'date-fns';
import {
  VatReturnPreview,
  InvoiceVatItem,
  ExpenseVatItem,
  OutputVatSummary,
  InputVatSummary,
  VatRateBreakdown,
  PeriodInfo,
} from './types/vat-return.types';
import { VatCalculationService } from './vat-calculation.service';
import {
  ElsterXmlGeneratorService,
  ElsterOrganizationData,
  ElsterXmlOptions,
} from './elster-xml-generator.service';

@Injectable()
export class VatReturnPreviewService {
  private readonly logger = new Logger(VatReturnPreviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vatCalculation: VatCalculationService,
    private readonly elsterXml: ElsterXmlGeneratorService,
  ) {}

  async generatePreview(organizationId: string, period: string): Promise<VatReturnPreview> {
    this.logger.log(`Generating VAT return preview for org ${organizationId}, period ${period}`);

    const { periodStart, periodEnd, periodType } = this.parsePeriod(period);

    // Get all invoices in period (exclude DRAFT status)
    const invoices = await this.prisma.invoice.findMany({
      where: {
        orgId: organizationId,
        issueDate: {
          gte: periodStart,
          lte: periodEnd
        },
        status: {
          notIn: ['DRAFT', 'CANCELLED']
        },
      },
      include: {
        client: true,
        items: true,
      },
      orderBy: {
        issueDate: 'asc',
      },
    });

    // Get all expenses with VAT in period
    const expenses = await this.prisma.expense.findMany({
      where: {
        orgId: organizationId,
        date: {
          gte: periodStart,
          lte: periodEnd
        },
        status: {
          in: ['APPROVED', 'PAID'],
        },
        isDeductible: true,
        vatAmount: {
          not: null,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Calculate VAT by rate
    const outputVat = this.calculateOutputVat(invoices);
    const inputVat = this.calculateInputVat(expenses);

    const netVat = outputVat.totalVat - inputVat.totalVat;
    const dueDate = this.calculateDueDate(periodEnd, periodType);
    const warnings = this.generateWarnings(invoices, expenses, periodStart, periodEnd);
    const missingData = this.findMissingData(invoices, expenses);

    const status = this.determineStatus(warnings, missingData);

    return {
      organizationId,
      period,
      periodType,
      periodStart,
      periodEnd,
      outputVat,
      inputVat,
      netVat,
      dueDate,
      status,
      warnings,
      missingData,
    };
  }

  private parsePeriod(period: string): PeriodInfo {
    // Support formats: "2025-Q1", "2025-01", "2025"
    const quarterMatch = period.match(/^(\d{4})-Q([1-4])$/);
    const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
    const yearMatch = period.match(/^(\d{4})$/);

    if (quarterMatch) {
      const year = parseInt(quarterMatch[1]);
      const quarter = parseInt(quarterMatch[2]) - 1; // 0-indexed
      const quarterStart = startOfQuarter(new Date(year, quarter * 3, 1));
      return {
        periodStart: quarterStart,
        periodEnd: endOfQuarter(quarterStart),
        periodType: 'quarterly',
      };
    } else if (monthMatch) {
      const year = parseInt(monthMatch[1]);
      const month = parseInt(monthMatch[2]) - 1; // 0-indexed
      const monthStart = startOfMonth(new Date(year, month, 1));
      return {
        periodStart: monthStart,
        periodEnd: endOfMonth(monthStart),
        periodType: 'monthly',
      };
    } else if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      const yearStart = startOfYear(new Date(year, 0, 1));
      return {
        periodStart: yearStart,
        periodEnd: endOfYear(yearStart),
        periodType: 'yearly',
      };
    } else {
      throw new BadRequestException(
        'Invalid period format. Use "YYYY-QN" for quarterly, "YYYY-MM" for monthly, or "YYYY" for yearly.',
      );
    }
  }

  private calculateOutputVat(invoices: any[]): OutputVatSummary {
    const rate19Items: InvoiceVatItem[] = [];
    const rate7Items: InvoiceVatItem[] = [];
    const rate0Items: InvoiceVatItem[] = [];

    let total19 = 0;
    let vat19 = 0;
    let total7 = 0;
    let vat7 = 0;
    let total0 = 0;

    for (const invoice of invoices) {
      // Skip reverse charge invoices (no VAT due)
      if (invoice.reverseCharge) {
        continue;
      }

      const vatRate = invoice.vatRate ? parseFloat(invoice.vatRate.toString()) : 0;
      const subtotal = parseFloat(invoice.subtotal.toString());
      const vatAmount = parseFloat(invoice.taxAmount.toString());
      const totalAmount = parseFloat(invoice.totalAmount.toString());

      const item: InvoiceVatItem = {
        id: invoice.id,
        invoiceNumber: invoice.number,
        customerName: invoice.customerName,
        issueDate: invoice.issueDate,
        subtotal,
        vatRate,
        vatAmount,
        totalAmount,
      };

      if (vatRate === 19) {
        rate19Items.push(item);
        total19 += subtotal;
        vat19 += vatAmount;
      } else if (vatRate === 7) {
        rate7Items.push(item);
        total7 += subtotal;
        vat7 += vatAmount;
      } else {
        rate0Items.push(item);
        total0 += subtotal;
      }
    }

    return {
      rate19: {
        invoices: rate19Items,
        subtotal: total19,
        vat: vat19,
        count: rate19Items.length,
      },
      rate7: {
        invoices: rate7Items,
        subtotal: total7,
        vat: vat7,
        count: rate7Items.length,
      },
      rate0: {
        invoices: rate0Items,
        subtotal: total0,
        vat: 0,
        count: rate0Items.length,
      },
      total: total19 + total7 + total0,
      totalVat: vat19 + vat7,
      totalInvoices: invoices.length,
    };
  }

  private calculateInputVat(expenses: any[]): InputVatSummary {
    const rate19Items: ExpenseVatItem[] = [];
    const rate7Items: ExpenseVatItem[] = [];

    let total19 = 0;
    let vat19 = 0;
    let total7 = 0;
    let vat7 = 0;

    for (const expense of expenses) {
      if (!expense.vatAmount) {
        continue;
      }

      const vatRate = expense.vatRate ? parseFloat(expense.vatRate.toString()) : 0;
      const amount = parseFloat(expense.amount.toString());
      const vatAmount = parseFloat(expense.vatAmount.toString());
      const subtotal = amount - vatAmount;

      const item: ExpenseVatItem = {
        id: expense.id,
        description: expense.description,
        vendorName: expense.vendorName,
        date: expense.date,
        subtotal,
        vatRate,
        vatAmount,
        totalAmount: amount,
        category: expense.category,
      };

      if (vatRate === 19) {
        rate19Items.push(item);
        total19 += subtotal;
        vat19 += vatAmount;
      } else if (vatRate === 7) {
        rate7Items.push(item);
        total7 += subtotal;
        vat7 += vatAmount;
      }
    }

    return {
      rate19: {
        expenses: rate19Items,
        subtotal: total19,
        vat: vat19,
        count: rate19Items.length,
      },
      rate7: {
        expenses: rate7Items,
        subtotal: total7,
        vat: vat7,
        count: rate7Items.length,
      },
      total: total19 + total7,
      totalVat: vat19 + vat7,
      totalExpenses: expenses.length,
    };
  }

  private calculateDueDate(periodEnd: Date, periodType: string): Date {
    // German VAT return deadlines:
    // - Monthly: 10th of the following month
    // - Quarterly: 10th of the month following the quarter end
    // - Yearly: May 31st of the following year (with tax advisor: end of Feb next year)

    if (periodType === 'monthly' || periodType === 'quarterly') {
      const nextMonth = addMonths(periodEnd, 1);
      return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 10);
    } else {
      // Yearly - May 31st of following year
      return new Date(periodEnd.getFullYear() + 1, 4, 31); // May = month 4 (0-indexed)
    }
  }

  private generateWarnings(
    invoices: any[],
    expenses: any[],
    periodStart: Date,
    periodEnd: Date,
  ): string[] {
    const warnings: string[] = [];

    // Check for invoices with missing VAT rates
    const invoicesWithoutVat = invoices.filter(
      inv => !inv.reverseCharge && (!inv.vatRate || parseFloat(inv.vatRate.toString()) === 0)
    );
    if (invoicesWithoutVat.length > 0) {
      warnings.push(
        `${invoicesWithoutVat.length} invoice(s) have no VAT rate set: ${invoicesWithoutVat.map(i => i.number).join(', ')}`
      );
    }

    // Check for expenses without VAT where VAT might be expected
    const expensesWithoutVat = expenses.filter(exp => !exp.vatAmount);
    if (expensesWithoutVat.length > 0) {
      warnings.push(
        `${expensesWithoutVat.length} expense(s) have no VAT recorded - verify if VAT is deductible`
      );
    }

    // Check for unusual VAT rates
    const unusualVatInvoices = invoices.filter(inv => {
      const rate = inv.vatRate ? parseFloat(inv.vatRate.toString()) : 0;
      return rate > 0 && rate !== 19 && rate !== 7;
    });
    if (unusualVatInvoices.length > 0) {
      warnings.push(
        `${unusualVatInvoices.length} invoice(s) with unusual VAT rates (not 19% or 7%)`
      );
    }

    // Check for missing customer VAT IDs on B2B invoices
    const b2bInvoicesWithoutVatId = invoices.filter(
      inv => !inv.customerVatId && parseFloat(inv.totalAmount.toString()) > 1000
    );
    if (b2bInvoicesWithoutVatId.length > 0) {
      warnings.push(
        `${b2bInvoicesWithoutVatId.length} high-value invoice(s) without customer VAT ID`
      );
    }

    return warnings;
  }

  private findMissingData(invoices: any[], expenses: any[]): string[] {
    const missing: string[] = [];

    // Check for draft invoices in period (not included in calculation)
    const hasData = invoices.length > 0 || expenses.length > 0;
    if (!hasData) {
      missing.push('No invoices or expenses found for this period');
    }

    return missing;
  }

  private determineStatus(warnings: string[], missingData: string[]): 'draft' | 'ready' {
    if (missingData.length > 0) {
      return 'draft';
    }
    // Even with warnings, if we have data, status is ready
    return 'ready';
  }

  /**
   * Generate ELSTER XML for submission
   */
  async generateElsterXml(
    organizationId: string,
    period: string,
    options: ElsterXmlOptions = {},
  ): Promise<string> {
    this.logger.log(
      `Generating ELSTER XML for organization ${organizationId}, period ${period}`,
    );

    // Get VAT calculation
    const calculation = await this.vatCalculation.calculateVat(
      organizationId,
      period,
    );

    // Get organization data
    const org = await this.getOrganizationData(organizationId);

    // Generate XML
    const xml = this.elsterXml.generateUstVaXml(calculation, org, options);

    // Validate XML
    const validation = this.elsterXml.validateXml(xml);
    if (!validation.isValid) {
      throw new BadRequestException(
        `Invalid ELSTER XML: ${validation.errors.join(', ')}`,
      );
    }

    return xml;
  }

  /**
   * Get VAT calculation summary
   */
  async getCalculationSummary(
    organizationId: string,
    period: string,
  ): Promise<string> {
    const calculation = await this.vatCalculation.calculateVat(
      organizationId,
      period,
    );

    return this.vatCalculation.getCalculationSummary(calculation);
  }

  /**
   * Get organization data for ELSTER submission
   */
  private async getOrganizationData(
    organizationId: string,
  ): Promise<ElsterOrganizationData> {
    const org = await this.prisma.organisation.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      throw new BadRequestException(`Organization ${organizationId} not found`);
    }

    if (!org.vatNumber) {
      throw new BadRequestException(
        'Organization does not have a VAT number (Steuernummer)',
      );
    }

    return {
      taxNumber: org.vatNumber,
      vatId: org.vatNumber, // Using vatNumber for both (should be separate in production)
      taxOfficeId: this.extractTaxOfficeId(org.vatNumber),
      name: org.name,
    };
  }

  /**
   * Extract tax office ID from German tax number
   * Format: XXX/XXX/XXXXX where first part is office ID
   */
  private extractTaxOfficeId(taxNumber: string): string | undefined {
    const match = taxNumber.match(/^(\d{3})\//);
    return match ? match[1] : undefined;
  }
}
