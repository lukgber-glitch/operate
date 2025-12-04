import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import {
  GenerateTaxSummaryDto,
  GenerateVatReportDto,
  GenerateIncomeTaxReportDto,
  TaxExportDto,
  TaxSummaryResponse,
  VatReportResponse,
  IncomeTaxReportResponse,
  DeductionsAnalysisResponse,
  TaxExportResponse,
  VatSummary,
  IncomeTaxSummary,
  TradeTaxSummary,
  QuarterlyEstimate,
  TaxDeadline,
  VatRateBreakdown,
  DeductionItem,
  TaxBracket,
  AuditTrailEntry,
  TaxReportCountry,
  VatRateType,
  DeductionCategory,
  TaxExportFormat,
} from './dto/tax-report.dto';
import * as crypto from 'crypto';

interface Transaction {
  id: string;
  date: Date;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  vatRate?: number;
  vatAmount?: number;
  isIntraEu?: boolean;
  isReverseCharge?: boolean;
  description: string;
  documentIds?: string[];
}

interface TaxRateConfig {
  country: TaxReportCountry;
  year: number;
  incomeTaxBrackets: Array<{
    min: number;
    max: number | null;
    rate: number;
    baseAmount?: number; // Fixed tax up to this bracket
  }>;
  vatRates: {
    standard: number;
    reduced: number;
    superReduced?: number;
  };
  tradeTax?: {
    baseRate: number;
    defaultMultiplier: number;
  };
  deductionLimits: {
    homeOffice: number;
    mileageRate: number;
    entertainmentPercent: number;
  };
}

@Injectable()
export class TaxReportService {
  private readonly logger = new Logger(TaxReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate comprehensive tax summary report
   */
  async generateTaxSummary(dto: GenerateTaxSummaryDto): Promise<TaxSummaryResponse> {
    this.logger.log(`Generating tax summary for org ${dto.organizationId}, year ${dto.taxYear}`);

    // Verify organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
      include: {
        settings: true,
      },
    });

    if (!organization) {
      throw new NotFoundException(`Organization ${dto.organizationId} not found`);
    }

    const country = dto.country || TaxReportCountry.GERMANY;
    const taxConfig = this.getTaxRateConfig(country, dto.taxYear);

    // Fetch all transactions for the tax year
    const transactions = await this.fetchTransactions(dto.organizationId, dto.taxYear);

    // Generate income tax report
    const incomeTax = await this.calculateIncomeTax(transactions, taxConfig, dto.includeDeductions);

    // Generate VAT report
    const vat = dto.includeVat
      ? await this.calculateVat(transactions, taxConfig, country)
      : this.getEmptyVatSummary();

    // Generate trade tax (Gewerbesteuer) for Germany
    const tradeTax =
      country === TaxReportCountry.GERMANY
        ? await this.calculateTradeTax(incomeTax.taxableIncome, taxConfig, organization)
        : null;

    // Calculate quarterly estimates
    const quarterlyEstimates = await this.generateQuarterlyEstimates(
      incomeTax.taxLiability,
      dto.taxYear,
    );

    // Get upcoming deadlines
    const upcomingDeadlines = this.trackDeadlines(country, dto.taxYear);

    // Audit trail if requested
    const auditTrail = dto.includeAuditTrail
      ? await this.getAuditTrail(dto.organizationId, dto.taxYear)
      : undefined;

    const reportId = this.generateReportId();

    // Save report to database
    await this.saveReport({
      id: reportId,
      organizationId: dto.organizationId,
      taxYear: dto.taxYear,
      country,
      type: 'TAX_SUMMARY',
      data: { incomeTax, vat, tradeTax, quarterlyEstimates },
    });

    return {
      reportId,
      organizationId: dto.organizationId,
      taxYear: dto.taxYear,
      country,
      generatedAt: new Date().toISOString(),
      incomeTax,
      vat,
      tradeTax,
      quarterlyEstimates,
      upcomingDeadlines,
      auditTrail,
    };
  }

  /**
   * Generate VAT report for specified period
   */
  async generateVatReport(dto: GenerateVatReportDto): Promise<VatReportResponse> {
    this.logger.log(`Generating VAT report for org ${dto.organizationId}`);

    const organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });

    if (!organization) {
      throw new NotFoundException(`Organization ${dto.organizationId} not found`);
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // Fetch transactions for period
    const transactions = await this.fetchTransactionsByDateRange(
      dto.organizationId,
      startDate,
      endDate,
    );

    const taxConfig = this.getTaxRateConfig(dto.country, startDate.getFullYear());
    const summary = await this.calculateVat(transactions, taxConfig, dto.country);

    // Calculate filing and payment deadlines
    const { filingDeadline, paymentDeadline } = this.calculateVatDeadlines(
      endDate,
      dto.country,
      dto.period,
    );

    const reportId = this.generateReportId();

    await this.saveReport({
      id: reportId,
      organizationId: dto.organizationId,
      taxYear: startDate.getFullYear(),
      country: dto.country,
      type: 'VAT',
      data: { summary, startDate: dto.startDate, endDate: dto.endDate },
    });

    return {
      reportId,
      organizationId: dto.organizationId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      country: dto.country,
      summary,
      filingDeadline: filingDeadline.toISOString(),
      paymentDeadline: paymentDeadline.toISOString(),
    };
  }

  /**
   * Generate income tax report
   */
  async generateIncomeTaxReport(dto: GenerateIncomeTaxReportDto): Promise<IncomeTaxReportResponse> {
    this.logger.log(`Generating income tax report for org ${dto.organizationId}`);

    const organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });

    if (!organization) {
      throw new NotFoundException(`Organization ${dto.organizationId} not found`);
    }

    const transactions = await this.fetchTransactions(dto.organizationId, dto.taxYear);
    const taxConfig = this.getTaxRateConfig(dto.country, dto.taxYear);

    const summary = await this.calculateIncomeTax(transactions, taxConfig, true);

    const quarterlyEstimates = dto.includeQuarterlyEstimates
      ? await this.generateQuarterlyEstimates(summary.taxLiability, dto.taxYear)
      : undefined;

    const reportId = this.generateReportId();

    await this.saveReport({
      id: reportId,
      organizationId: dto.organizationId,
      taxYear: dto.taxYear,
      country: dto.country,
      type: 'INCOME_TAX',
      data: { summary },
    });

    return {
      reportId,
      organizationId: dto.organizationId,
      taxYear: dto.taxYear,
      country: dto.country,
      summary,
      quarterlyEstimates,
    };
  }

  /**
   * Calculate income tax liability
   */
  private async calculateIncomeTax(
    transactions: Transaction[],
    taxConfig: TaxRateConfig,
    includeDeductions: boolean,
  ): Promise<IncomeTaxSummary> {
    // Calculate gross revenue
    const grossRevenue = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    // Identify and categorize deductions
    const deductions = includeDeductions
      ? await this.identifyDeductions(transactions.filter((t) => t.type === 'EXPENSE'), taxConfig)
      : [];

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

    // Calculate taxable income
    const taxableIncome = Math.max(0, grossRevenue - totalDeductions);

    // Apply tax brackets
    const { taxLiability, bracketBreakdown } = this.calculateTaxLiability(
      taxableIncome,
      taxConfig.incomeTaxBrackets,
    );

    // Tax credits (placeholder - would integrate with actual credits system)
    const taxCredits = 0;

    // Prepayments (would fetch from payment records)
    const prepayments = 0;

    // Net tax due
    const netTaxDue = taxLiability - taxCredits - prepayments;

    // Effective tax rate
    const effectiveTaxRate = grossRevenue > 0 ? (taxLiability / grossRevenue) * 100 : 0;

    return {
      grossRevenue,
      totalDeductions,
      taxableIncome,
      taxLiability,
      taxCredits,
      prepayments,
      netTaxDue,
      effectiveTaxRate,
      bracketBreakdown,
      deductions,
    };
  }

  /**
   * Calculate tax liability based on progressive tax brackets
   */
  calculateTaxLiability(
    taxableIncome: number,
    brackets: Array<{ min: number; max: number | null; rate: number; baseAmount?: number }>,
  ): { taxLiability: number; bracketBreakdown: TaxBracket[] } {
    let totalTax = 0;
    const bracketBreakdown: TaxBracket[] = [];
    let remainingIncome = taxableIncome;

    for (const bracket of brackets) {
      if (remainingIncome <= 0) break;

      const bracketMax = bracket.max || Infinity;
      const incomeInBracket = Math.min(
        remainingIncome,
        bracketMax - bracket.min,
      );

      if (incomeInBracket > 0) {
        const taxOnBracket = incomeInBracket * (bracket.rate / 100);
        totalTax += taxOnBracket;

        bracketBreakdown.push({
          min: bracket.min,
          max: bracket.max,
          rate: bracket.rate,
          incomeInBracket,
          taxOnBracket,
        });

        remainingIncome -= incomeInBracket;
      }
    }

    return {
      taxLiability: Math.round(totalTax * 100) / 100,
      bracketBreakdown,
    };
  }

  /**
   * Calculate VAT position
   */
  private async calculateVat(
    transactions: Transaction[],
    taxConfig: TaxRateConfig,
    country: TaxReportCountry,
  ): Promise<VatSummary> {
    const rateBreakdown: Map<string, VatRateBreakdown> = new Map();

    let totalVatCollected = 0;
    let totalVatPaid = 0;
    let reverseChargeVat = 0;
    let intraEuVat = 0;
    let importVat = 0;

    for (const transaction of transactions) {
      if (!transaction.vatRate && !transaction.isReverseCharge) continue;

      const vatAmount = transaction.vatAmount || 0;
      const netAmount = transaction.amount - vatAmount;

      // Determine VAT rate type
      let rateType: VatRateType;
      if (transaction.isReverseCharge) {
        rateType = VatRateType.REVERSE_CHARGE;
        reverseChargeVat += vatAmount;
      } else if (transaction.vatRate === 0) {
        rateType = VatRateType.ZERO;
      } else if (transaction.vatRate === taxConfig.vatRates.standard) {
        rateType = VatRateType.STANDARD;
      } else if (transaction.vatRate === taxConfig.vatRates.reduced) {
        rateType = VatRateType.REDUCED;
      } else {
        rateType = VatRateType.EXEMPT;
      }

      const key = `${rateType}-${transaction.vatRate || 0}`;

      if (!rateBreakdown.has(key)) {
        rateBreakdown.set(key, {
          rateType,
          rate: transaction.vatRate || 0,
          netAmount: 0,
          vatAmount: 0,
          grossAmount: 0,
          transactionCount: 0,
        });
      }

      const breakdown = rateBreakdown.get(key)!;
      breakdown.netAmount += netAmount;
      breakdown.vatAmount += vatAmount;
      breakdown.grossAmount += transaction.amount;
      breakdown.transactionCount += 1;

      // Accumulate totals
      if (transaction.type === 'INCOME') {
        totalVatCollected += vatAmount;
        if (transaction.isIntraEu) {
          intraEuVat += vatAmount;
        }
      } else {
        totalVatPaid += vatAmount;
      }
    }

    const netVatPosition = totalVatCollected - totalVatPaid;

    return {
      totalVatCollected,
      totalVatPaid,
      netVatPosition,
      reverseChargeVat,
      intraEuVat,
      importVat,
      rateBreakdown: Array.from(rateBreakdown.values()),
    };
  }

  /**
   * Calculate trade tax (Gewerbesteuer) for Germany
   */
  private async calculateTradeTax(
    taxableIncome: number,
    taxConfig: TaxRateConfig,
    organization: any,
  ): Promise<TradeTaxSummary | null> {
    if (!taxConfig.tradeTax) return null;

    // Trade tax base calculation
    // In Germany: Gewerbeertrag = taxable income + add-backs - deductions
    // Simplified: using taxable income directly
    const tradeTaxBase = taxableIncome;

    // Get municipal multiplier (Hebesatz) - would be from organization settings
    const municipalMultiplier = organization.settings?.tradeTaxMultiplier || taxConfig.tradeTax.defaultMultiplier;

    // Trade tax calculation: base * baseRate * (municipalMultiplier / 100)
    const tradeTaxLiability = tradeTaxBase * (taxConfig.tradeTax.baseRate / 100) * (municipalMultiplier / 100);

    // Trade tax credit (1.8 times the base trade tax can be credited against income tax)
    const tradeTaxCredit = Math.min(
      tradeTaxLiability,
      tradeTaxBase * (taxConfig.tradeTax.baseRate / 100) * 1.8,
    );

    return {
      tradeTaxBase,
      municipalMultiplier,
      tradeTaxLiability,
      tradeTaxCredit,
    };
  }

  /**
   * Identify deductions from expenses
   */
  async identifyDeductions(
    expenses: Transaction[],
    taxConfig: TaxRateConfig,
  ): Promise<DeductionItem[]> {
    const deductionMap: Map<DeductionCategory, DeductionItem> = new Map();

    for (const expense of expenses) {
      const category = this.categorizeDeduction(expense.category);
      let deductibleAmount = expense.amount;

      // Apply category-specific limits
      switch (category) {
        case DeductionCategory.HOME_OFFICE:
          deductibleAmount = Math.min(expense.amount, taxConfig.deductionLimits.homeOffice);
          break;
        case DeductionCategory.ENTERTAINMENT:
          deductibleAmount = expense.amount * (taxConfig.deductionLimits.entertainmentPercent / 100);
          break;
        case DeductionCategory.VEHICLE:
          // Mileage-based calculation (simplified)
          deductibleAmount = expense.amount; // Would calculate based on business vs personal use
          break;
      }

      if (!deductionMap.has(category)) {
        deductionMap.set(category, {
          category,
          description: this.getDeductionDescription(category),
          amount: 0,
          itemCount: 0,
          documentIds: [],
        });
      }

      const item = deductionMap.get(category)!;
      item.amount += deductibleAmount;
      item.itemCount += 1;
      if (expense.documentIds) {
        item.documentIds.push(...expense.documentIds);
      }
    }

    return Array.from(deductionMap.values());
  }

  /**
   * Categorize expense into deduction category
   */
  private categorizeDeduction(expenseCategory: string): DeductionCategory {
    const categoryMap: Record<string, DeductionCategory> = {
      office: DeductionCategory.HOME_OFFICE,
      'office-supplies': DeductionCategory.BUSINESS_EXPENSES,
      travel: DeductionCategory.TRAVEL,
      'meals-entertainment': DeductionCategory.ENTERTAINMENT,
      training: DeductionCategory.PROFESSIONAL_DEVELOPMENT,
      insurance: DeductionCategory.INSURANCE,
      retirement: DeductionCategory.RETIREMENT,
      vehicle: DeductionCategory.VEHICLE,
      utilities: DeductionCategory.UTILITIES,
      rent: DeductionCategory.RENT,
      interest: DeductionCategory.INTEREST,
      depreciation: DeductionCategory.DEPRECIATION,
    };

    return categoryMap[expenseCategory] || DeductionCategory.OTHER;
  }

  /**
   * Get human-readable deduction description
   */
  private getDeductionDescription(category: DeductionCategory): string {
    const descriptions: Record<DeductionCategory, string> = {
      [DeductionCategory.BUSINESS_EXPENSES]: 'General Business Expenses',
      [DeductionCategory.DEPRECIATION]: 'Asset Depreciation',
      [DeductionCategory.HOME_OFFICE]: 'Home Office Deduction',
      [DeductionCategory.TRAVEL]: 'Business Travel & Transportation',
      [DeductionCategory.ENTERTAINMENT]: 'Meals & Entertainment (50% limit)',
      [DeductionCategory.PROFESSIONAL_DEVELOPMENT]: 'Professional Development & Training',
      [DeductionCategory.INSURANCE]: 'Business Insurance Premiums',
      [DeductionCategory.RETIREMENT]: 'Retirement Contributions',
      [DeductionCategory.VEHICLE]: 'Vehicle Expenses',
      [DeductionCategory.UTILITIES]: 'Business Utilities',
      [DeductionCategory.RENT]: 'Business Rent',
      [DeductionCategory.INTEREST]: 'Business Loan Interest',
      [DeductionCategory.OTHER]: 'Other Deductible Expenses',
    };

    return descriptions[category];
  }

  /**
   * Calculate effective tax rate
   */
  calculateEffectiveTaxRate(taxPaid: number, grossIncome: number): number {
    if (grossIncome === 0) return 0;
    return (taxPaid / grossIncome) * 100;
  }

  /**
   * Generate quarterly tax estimates
   */
  async generateQuarterlyEstimates(
    annualTaxLiability: number,
    taxYear: number,
  ): Promise<QuarterlyEstimate[]> {
    const quarterlyAmount = annualTaxLiability / 4;
    const estimates: QuarterlyEstimate[] = [];

    const quarters = [
      { q: 1, month: 3, day: 10 }, // Q1: March 10
      { q: 2, month: 5, day: 10 }, // Q2: May 10
      { q: 3, month: 9, day: 10 }, // Q3: September 10
      { q: 4, month: 12, day: 10 }, // Q4: December 10 (following year)
    ];

    for (const { q, month, day } of quarters) {
      const dueDate = new Date(taxYear, month, day);
      const now = new Date();
      const isPast = dueDate < now;

      estimates.push({
        quarter: q,
        dueDate: dueDate.toISOString(),
        estimatedPayment: Math.round(quarterlyAmount * 100) / 100,
        status: isPast ? 'PAID' : 'PENDING',
      });
    }

    return estimates;
  }

  /**
   * Track tax filing deadlines
   */
  trackDeadlines(country: TaxReportCountry, taxYear: number): TaxDeadline[] {
    const deadlines: TaxDeadline[] = [];
    const now = new Date();

    if (country === TaxReportCountry.GERMANY) {
      // Income tax: July 31 of following year (or later with tax advisor)
      const incomeTaxDeadline = new Date(taxYear + 1, 6, 31);
      deadlines.push({
        description: 'Einkommensteuererklärung (Income Tax Return)',
        dueDate: incomeTaxDeadline.toISOString(),
        taxType: 'INCOME',
        isOverdue: incomeTaxDeadline < now,
        daysUntilDue: Math.ceil((incomeTaxDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      });

      // Monthly VAT: 10th of following month
      const nextMonthVat = new Date(now.getFullYear(), now.getMonth() + 1, 10);
      deadlines.push({
        description: 'Umsatzsteuer-Voranmeldung (Monthly VAT Return)',
        dueDate: nextMonthVat.toISOString(),
        taxType: 'VAT',
        isOverdue: nextMonthVat < now,
        daysUntilDue: Math.ceil((nextMonthVat.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      });

      // Trade tax: May 15 and November 15
      const tradeTaxMay = new Date(taxYear, 4, 15);
      const tradeTaxNov = new Date(taxYear, 10, 15);

      if (tradeTaxMay >= now || tradeTaxNov >= now) {
        const nextTradeTax = tradeTaxMay >= now ? tradeTaxMay : tradeTaxNov;
        deadlines.push({
          description: 'Gewerbesteuer-Vorauszahlung (Trade Tax Prepayment)',
          dueDate: nextTradeTax.toISOString(),
          taxType: 'TRADE',
          isOverdue: nextTradeTax < now,
          daysUntilDue: Math.ceil((nextTradeTax.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        });
      }
    } else if (country === TaxReportCountry.AUSTRIA) {
      // Income tax: June 30 of following year (or September 30 with tax advisor)
      const incomeTaxDeadline = new Date(taxYear + 1, 5, 30);
      deadlines.push({
        description: 'Einkommensteuererklärung (Income Tax Return)',
        dueDate: incomeTaxDeadline.toISOString(),
        taxType: 'INCOME',
        isOverdue: incomeTaxDeadline < now,
        daysUntilDue: Math.ceil((incomeTaxDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      });

      // Monthly VAT: 15th of following month
      const nextMonthVat = new Date(now.getFullYear(), now.getMonth() + 1, 15);
      deadlines.push({
        description: 'Umsatzsteuer-Voranmeldung (Monthly VAT Return)',
        dueDate: nextMonthVat.toISOString(),
        taxType: 'VAT',
        isOverdue: nextMonthVat < now,
        daysUntilDue: Math.ceil((nextMonthVat.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      });
    }

    return deadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  /**
   * Generate ELSTER XML export for Germany
   */
  async generateElsterExport(dto: TaxExportDto): Promise<TaxExportResponse> {
    this.logger.log(`Generating ELSTER export for org ${dto.organizationId}`);

    const organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
      include: { settings: true },
    });

    if (!organization) {
      throw new NotFoundException(`Organization ${dto.organizationId} not found`);
    }

    // Fetch tax data
    const transactions = await this.fetchTransactions(dto.organizationId, dto.taxYear);
    const taxConfig = this.getTaxRateConfig(TaxReportCountry.GERMANY, dto.taxYear);
    const incomeTax = await this.calculateIncomeTax(transactions, taxConfig, true);
    const vat = await this.calculateVat(transactions, taxConfig, TaxReportCountry.GERMANY);

    // Generate ELSTER XML
    const xml = this.buildElsterXml({
      organization,
      taxYear: dto.taxYear,
      incomeTax,
      vat,
      taxOfficeNumber: dto.taxOfficeNumber,
      taxIdentifier: dto.taxIdentifier,
    });

    const exportId = this.generateReportId();
    const fileName = `ELSTER_${organization.name}_${dto.taxYear}.xml`;

    await this.saveExport({
      id: exportId,
      organizationId: dto.organizationId,
      format: TaxExportFormat.ELSTER_XML,
      fileName,
      content: xml,
    });

    return {
      exportId,
      format: TaxExportFormat.ELSTER_XML,
      content: xml,
      fileName,
      mimeType: 'application/xml',
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate FinanzOnline XML export for Austria
   */
  async generateFinanzOnlineExport(dto: TaxExportDto): Promise<TaxExportResponse> {
    this.logger.log(`Generating FinanzOnline export for org ${dto.organizationId}`);

    const organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
      include: { settings: true },
    });

    if (!organization) {
      throw new NotFoundException(`Organization ${dto.organizationId} not found`);
    }

    const transactions = await this.fetchTransactions(dto.organizationId, dto.taxYear);
    const taxConfig = this.getTaxRateConfig(TaxReportCountry.AUSTRIA, dto.taxYear);
    const incomeTax = await this.calculateIncomeTax(transactions, taxConfig, true);
    const vat = await this.calculateVat(transactions, taxConfig, TaxReportCountry.AUSTRIA);

    // Generate FinanzOnline XML
    const xml = this.buildFinanzOnlineXml({
      organization,
      taxYear: dto.taxYear,
      incomeTax,
      vat,
      taxIdentifier: dto.taxIdentifier,
    });

    const exportId = this.generateReportId();
    const fileName = `FinanzOnline_${organization.name}_${dto.taxYear}.xml`;

    await this.saveExport({
      id: exportId,
      organizationId: dto.organizationId,
      format: TaxExportFormat.FINANZONLINE_XML,
      fileName,
      content: xml,
    });

    return {
      exportId,
      format: TaxExportFormat.FINANZONLINE_XML,
      content: xml,
      fileName,
      mimeType: 'application/xml',
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Build ELSTER XML format
   */
  private buildElsterXml(data: any): string {
    const { organization, taxYear, incomeTax, vat, taxOfficeNumber, taxIdentifier } = data;

    // ELSTER XML structure (simplified version)
    // Real implementation would use full ELSTER schema
    return `<?xml version="1.0" encoding="UTF-8"?>
<Elster xmlns="http://www.elster.de/elsterxml/schema/v11">
  <TransferHeader version="11">
    <Verfahren>ElsterErklaerung</Verfahren>
    <DatenArt>ESt</DatenArt>
    <Vorgang>send-Auth</Vorgang>
    <TransferTicket>${this.generateReportId()}</TransferTicket>
    <Testmerker>0</Testmerker>
    <SigUser></SigUser>
    <Empfaenger id="${taxOfficeNumber || '9198'}">
      <Kz>F</Kz>
    </Empfaenger>
    <HerstellerID>74931</HerstellerID>
    <DatenLieferant>${organization.name}</DatenLieferant>
    <Datum>${new Date().toISOString().split('T')[0]}</Datum>
  </TransferHeader>
  <DatenTeil>
    <Nutzdatenblock>
      <NutzdatenHeader version="11">
        <NutzdatenTicket>${this.generateReportId()}</NutzdatenTicket>
        <Empfaenger id="${taxOfficeNumber || '9198'}">F</Empfaenger>
        <Hersteller>
          <ProduktName>Operate TaxOS</ProduktName>
          <ProduktVersion>1.0</ProduktVersion>
        </Hersteller>
      </NutzdatenHeader>
      <Nutzdaten>
        <Einkommensteuerererklaerung version="2023">
          <Allgemeine_Angaben>
            <Veranlagungsjahr>${taxYear}</Veranlagungsjahr>
            <Steuernummer>${taxIdentifier || ''}</Steuernummer>
          </Allgemeine_Angaben>
          <Einkuenfte>
            <Summe_Einkuenfte>${Math.round(incomeTax.taxableIncome)}</Summe_Einkuenfte>
            <Einkommen>${Math.round(incomeTax.taxableIncome)}</Einkommen>
          </Einkuenfte>
          <Steuerberechnung>
            <Festzusetzende_Einkommensteuer>${Math.round(incomeTax.taxLiability)}</Festzusetzende_Einkommensteuer>
            <Verbleibende_Steuer>${Math.round(incomeTax.netTaxDue)}</Verbleibende_Steuer>
          </Steuerberechnung>
        </Einkommensteuerererklaerung>
        <Umsatzsteuererklaerung version="2023">
          <Allgemeine_Angaben>
            <Jahr>${taxYear}</Jahr>
            <Steuernummer>${taxIdentifier || ''}</Steuernummer>
          </Allgemeine_Angaben>
          <Steuerberechnung>
            <Umsaetze_19>${vat.rateBreakdown.find(r => r.rate === 19)?.netAmount || 0}</Umsaetze_19>
            <USt_19>${vat.rateBreakdown.find(r => r.rate === 19)?.vatAmount || 0}</USt_19>
            <Umsaetze_7>${vat.rateBreakdown.find(r => r.rate === 7)?.netAmount || 0}</Umsaetze_7>
            <USt_7>${vat.rateBreakdown.find(r => r.rate === 7)?.vatAmount || 0}</USt_7>
            <Abziehbare_Vorsteuer>${Math.round(vat.totalVatPaid)}</Abziehbare_Vorsteuer>
            <Verbleibende_USt>${Math.round(vat.netVatPosition)}</Verbleibende_USt>
          </Steuerberechnung>
        </Umsatzsteuererklaerung>
      </Nutzdaten>
    </Nutzdatenblock>
  </DatenTeil>
</Elster>`;
  }

  /**
   * Build FinanzOnline XML format
   */
  private buildFinanzOnlineXml(data: any): string {
    const { organization, taxYear, incomeTax, vat, taxIdentifier } = data;

    // FinanzOnline XML structure (simplified)
    return `<?xml version="1.0" encoding="UTF-8"?>
<FinanzOnline xmlns="http://www.bmf.gv.at/FinanzOnline" version="1.0">
  <MessageSpec>
    <MessageType>ESt</MessageType>
    <Year>${taxYear}</Year>
    <TaxIdentifier>${taxIdentifier || ''}</TaxIdentifier>
    <Timestamp>${new Date().toISOString()}</Timestamp>
  </MessageSpec>
  <TaxReturn>
    <IncomeTax>
      <TaxableIncome>${Math.round(incomeTax.taxableIncome)}</TaxableIncome>
      <TaxLiability>${Math.round(incomeTax.taxLiability)}</TaxLiability>
      <TaxCredits>${Math.round(incomeTax.taxCredits)}</TaxCredits>
      <Prepayments>${Math.round(incomeTax.prepayments)}</Prepayments>
      <NetTaxDue>${Math.round(incomeTax.netTaxDue)}</NetTaxDue>
      <Deductions>
        ${incomeTax.deductions.map(d => `
        <Deduction>
          <Category>${d.category}</Category>
          <Amount>${Math.round(d.amount)}</Amount>
          <ItemCount>${d.itemCount}</ItemCount>
        </Deduction>
        `).join('')}
      </Deductions>
    </IncomeTax>
    <VAT>
      <TotalVATCollected>${Math.round(vat.totalVatCollected)}</TotalVATCollected>
      <TotalVATPaid>${Math.round(vat.totalVatPaid)}</TotalVATPaid>
      <NetVATPosition>${Math.round(vat.netVatPosition)}</NetVATPosition>
      <RateBreakdown>
        ${vat.rateBreakdown.map(r => `
        <Rate>
          <Type>${r.rateType}</Type>
          <Percentage>${r.rate}</Percentage>
          <NetAmount>${Math.round(r.netAmount)}</NetAmount>
          <VATAmount>${Math.round(r.vatAmount)}</VATAmount>
        </Rate>
        `).join('')}
      </RateBreakdown>
    </VAT>
  </TaxReturn>
</FinanzOnline>`;
  }

  /**
   * Get audit trail for tax report
   */
  async getAuditTrail(organizationId: string, taxYear: number): Promise<AuditTrailEntry[]> {
    // Would fetch from audit log table
    // Placeholder implementation
    return [];
  }

  /**
   * Get tax rate configuration for country and year
   */
  private getTaxRateConfig(country: TaxReportCountry, year: number): TaxRateConfig {
    if (country === TaxReportCountry.GERMANY) {
      return {
        country,
        year,
        // Germany 2024 income tax brackets (Einkommensteuer)
        incomeTaxBrackets: [
          { min: 0, max: 11604, rate: 0 }, // Basic allowance (Grundfreibetrag)
          { min: 11604, max: 17005, rate: 14 }, // Progressive zone 1
          { min: 17005, max: 66760, rate: 24 }, // Progressive zone 2
          { min: 66760, max: 277825, rate: 42 }, // Top rate
          { min: 277825, max: null, rate: 45 }, // Rich tax (Reichensteuer)
        ],
        vatRates: {
          standard: 19,
          reduced: 7,
        },
        tradeTax: {
          baseRate: 3.5, // Steuermesszahl
          defaultMultiplier: 400, // Average Hebesatz
        },
        deductionLimits: {
          homeOffice: 1260, // 6 EUR per day, max 210 days
          mileageRate: 0.30, // EUR per km
          entertainmentPercent: 70, // 70% deductible (30% non-deductible)
        },
      };
    } else if (country === TaxReportCountry.AUSTRIA) {
      return {
        country,
        year,
        // Austria 2024 income tax brackets
        incomeTaxBrackets: [
          { min: 0, max: 12816, rate: 0 }, // Tax-free amount
          { min: 12816, max: 20818, rate: 20 },
          { min: 20818, max: 34513, rate: 30 },
          { min: 34513, max: 66612, rate: 40 },
          { min: 66612, max: 99266, rate: 48 },
          { min: 99266, max: 1000000, rate: 50 },
          { min: 1000000, max: null, rate: 55 }, // Millionaire's tax
        ],
        vatRates: {
          standard: 20,
          reduced: 10,
          superReduced: 13,
        },
        deductionLimits: {
          homeOffice: 1200, // EUR per year (simplified)
          mileageRate: 0.42, // EUR per km
          entertainmentPercent: 50, // 50% deductible
        },
      };
    }

    throw new BadRequestException(`Unsupported country: ${country}`);
  }

  /**
   * Calculate VAT deadlines
   */
  private calculateVatDeadlines(
    periodEnd: Date,
    country: TaxReportCountry,
    period: string,
  ): { filingDeadline: Date; paymentDeadline: Date } {
    const filingDeadline = new Date(periodEnd);
    const paymentDeadline = new Date(periodEnd);

    if (country === TaxReportCountry.GERMANY) {
      // Filing: 10th of following month
      filingDeadline.setMonth(filingDeadline.getMonth() + 1);
      filingDeadline.setDate(10);

      // Payment: same as filing
      paymentDeadline.setMonth(paymentDeadline.getMonth() + 1);
      paymentDeadline.setDate(10);
    } else if (country === TaxReportCountry.AUSTRIA) {
      // Filing: 15th of following month
      filingDeadline.setMonth(filingDeadline.getMonth() + 1);
      filingDeadline.setDate(15);

      // Payment: same as filing
      paymentDeadline.setMonth(paymentDeadline.getMonth() + 1);
      paymentDeadline.setDate(15);
    }

    return { filingDeadline, paymentDeadline };
  }

  /**
   * Fetch transactions for tax year
   */
  private async fetchTransactions(organizationId: string, taxYear: number): Promise<Transaction[]> {
    const startDate = new Date(taxYear, 0, 1);
    const endDate = new Date(taxYear, 11, 31, 23, 59, 59);

    return this.fetchTransactionsByDateRange(organizationId, startDate, endDate);
  }

  /**
   * Fetch transactions by date range
   */
  private async fetchTransactionsByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Transaction[]> {
    // This would fetch from actual transaction tables
    // For now, return mock data structure
    const mockTransactions: Transaction[] = [];

    // In production, would query:
    // - Invoice items (income)
    // - Expense records
    // - Bank transactions
    // - Receipt data

    // Example query structure:
    /*
    const invoices = await this.prisma.invoice.findMany({
      where: {
        organizationId,
        date: { gte: startDate, lte: endDate },
        status: 'PAID',
      },
      include: {
        items: true,
      },
    });

    const expenses = await this.prisma.expense.findMany({
      where: {
        organizationId,
        date: { gte: startDate, lte: endDate },
      },
    });
    */

    return mockTransactions;
  }

  /**
   * Save report to database
   */
  private async saveReport(data: any): Promise<void> {
    // Would save to tax_reports table
    // await this.prisma.taxReport.create({ data });
    this.logger.log(`Report ${data.id} saved`);
  }

  /**
   * Save export to database
   */
  private async saveExport(data: any): Promise<void> {
    // Would save to tax_exports table
    // await this.prisma.taxExport.create({ data });
    this.logger.log(`Export ${data.id} saved`);
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    return `TR-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  /**
   * Get empty VAT summary
   */
  private getEmptyVatSummary(): VatSummary {
    return {
      totalVatCollected: 0,
      totalVatPaid: 0,
      netVatPosition: 0,
      reverseChargeVat: 0,
      intraEuVat: 0,
      importVat: 0,
      rateBreakdown: [],
    };
  }

  /**
   * Analyze deductions and identify potential savings
   */
  async analyzeDeductions(
    organizationId: string,
    taxYear: number,
  ): Promise<DeductionsAnalysisResponse> {
    const transactions = await this.fetchTransactions(organizationId, taxYear);
    const expenses = transactions.filter((t) => t.type === 'EXPENSE');

    const taxConfig = this.getTaxRateConfig(TaxReportCountry.GERMANY, taxYear);
    const deductions = await this.identifyDeductions(expenses, taxConfig);
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

    // Identify potential deductions (expenses not yet categorized as deductible)
    const potentialDeductions: DeductionItem[] = [];
    // In production, would use AI/ML to identify missed deductions

    const estimatedSavings = potentialDeductions.reduce((sum, d) => sum + d.amount * 0.42, 0); // Assume 42% tax rate

    return {
      organizationId,
      taxYear,
      deductions,
      totalDeductions,
      potentialDeductions,
      estimatedSavings,
    };
  }
}
