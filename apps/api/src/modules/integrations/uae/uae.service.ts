import { Injectable, Logger } from '@nestjs/common';
import { UAEInvoiceService } from './uae-invoice.service';
import { UAETaxService } from './uae-tax.service';
import { UAEValidationService } from './uae-validation.service';
import { UAEFTAClientService } from './uae-fta-client.service';
import {
  UAEInvoiceData,
  UAEInvoiceSubmissionResult,
  UAEInvoiceStatusResult,
  UAETRNValidation,
  FTASubmissionOptions,
  BatchSubmissionResult,
  UAEVATReturn,
  UAEVATCalculation,
} from './interfaces/uae.types';
import { VAT_RETURN_DUE_DATE_OFFSET } from './constants/uae.constants';

/**
 * UAE Integration Service
 * Main service orchestrating UAE e-invoicing and tax operations
 */
@Injectable()
export class UAEService {
  private readonly logger = new Logger(UAEService.name);

  constructor(
    private readonly invoiceService: UAEInvoiceService,
    private readonly taxService: UAETaxService,
    private readonly validationService: UAEValidationService,
    private readonly ftaClient: UAEFTAClientService,
  ) {}

  /**
   * Submit invoice to FTA
   */
  async submitInvoice(
    invoiceData: UAEInvoiceData,
    options: FTASubmissionOptions = {},
  ): Promise<UAEInvoiceSubmissionResult> {
    this.logger.log(`Submitting invoice ${invoiceData.invoiceNumber} to FTA`);

    try {
      // Validate invoice data
      const validationErrors = this.validationService.validateInvoiceData(invoiceData);
      if (validationErrors.length > 0) {
        return {
          success: false,
          invoiceNumber: invoiceData.invoiceNumber,
          status: 'REJECTED',
          validationErrors,
        };
      }

      // Generate UBL XML
      const ublDocument = await this.invoiceService.generateInvoiceXML(invoiceData);

      // Submit to FTA
      const result = await this.ftaClient.submitInvoice(ublDocument, options);

      return result;
    } catch (error) {
      this.logger.error(`Invoice submission failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validate invoice without submitting
   */
  async validateInvoice(invoiceData: UAEInvoiceData): Promise<UAEInvoiceSubmissionResult> {
    return this.submitInvoice(invoiceData, { validateOnly: true });
  }

  /**
   * Get invoice status
   */
  async getInvoiceStatus(submissionId: string): Promise<UAEInvoiceStatusResult> {
    return this.ftaClient.getInvoiceStatus(submissionId);
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(submissionId: string, reason: string): Promise<boolean> {
    return this.ftaClient.cancelInvoice(submissionId, reason);
  }

  /**
   * Validate TRN
   */
  async validateTRN(trn: string, checkWithFTA = false): Promise<UAETRNValidation> {
    // Local validation
    const localValidation = this.validationService.validateTRN(trn);

    if (!localValidation.valid || !checkWithFTA) {
      return localValidation;
    }

    // Validate with FTA if requested
    return this.ftaClient.validateTRNWithFTA(trn);
  }

  /**
   * Calculate VAT
   */
  calculateVAT(invoiceData: UAEInvoiceData): UAEVATCalculation {
    return this.taxService.calculateVAT(
      invoiceData.lineItems,
      invoiceData.totals.currency,
      invoiceData.totals.allowances,
      invoiceData.totals.charges,
    );
  }

  /**
   * Submit batch of invoices
   */
  async submitBatch(
    invoices: UAEInvoiceData[],
    options: FTASubmissionOptions = {},
  ): Promise<BatchSubmissionResult> {
    this.logger.log(`Submitting batch of ${invoices.length} invoices`);

    const results: UAEInvoiceSubmissionResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const invoice of invoices) {
      try {
        const result = await this.submitInvoice(invoice, options);
        results.push(result);

        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      } catch (error) {
        this.logger.error(`Failed to submit invoice ${invoice.invoiceNumber}: ${error.message}`);
        results.push({
          success: false,
          invoiceNumber: invoice.invoiceNumber,
          status: 'REJECTED',
          validationErrors: [{
            code: 'SUB_003',
            message: error.message,
            severity: 'FATAL',
          }],
        });
        failed++;
      }
    }

    return {
      totalInvoices: invoices.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Calculate VAT return
   */
  async calculateVATReturn(
    startDate: Date,
    endDate: Date,
    filingPeriod: 'MONTHLY' | 'QUARTERLY',
    invoices: UAEInvoiceData[],
  ): Promise<UAEVATReturn> {
    this.logger.log(`Calculating VAT return for period ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Validate period
    const periodValid = this.validationService.validateVATReturnPeriod(
      startDate,
      endDate,
      filingPeriod,
    );

    if (!periodValid) {
      throw new Error(`Invalid VAT return period for ${filingPeriod} filing`);
    }

    // Calculate output VAT (sales)
    const salesData = invoices.map((inv) => ({
      amount: inv.totals.taxExclusiveAmount,
      vatRate: inv.totals.taxBreakdown[0]?.taxRate || 0,
      category: inv.totals.taxBreakdown[0]?.taxCategory,
    }));

    const outputVATCalc = this.taxService.calculateOutputVAT(salesData);

    // Calculate totals
    const totalSales = invoices.reduce((sum, inv) => sum + inv.totals.taxInclusiveAmount, 0);
    const zeroRatedSales = invoices
      .filter((inv) => inv.totals.taxBreakdown.some((t) => t.taxRate === 0))
      .reduce((sum, inv) => sum + inv.totals.taxExclusiveAmount, 0);

    // For a complete implementation, you'd also need purchase invoices to calculate input VAT
    // This is a simplified version
    const inputVAT = 0; // Would be calculated from purchase invoices

    const netVAT = outputVATCalc.totalOutputVAT - inputVAT;

    // Calculate due date (28 days after period end)
    const dueDate = new Date(endDate);
    dueDate.setDate(dueDate.getDate() + VAT_RETURN_DUE_DATE_OFFSET);

    return {
      period: {
        startDate,
        endDate,
        filingPeriod,
      },
      outputVAT: outputVATCalc.totalOutputVAT,
      inputVAT,
      netVAT,
      totalSales,
      totalPurchases: 0, // Would be calculated from purchase invoices
      zeroRatedSales,
      exemptSales: 0, // Would be calculated from exempt sales
      amountDue: netVAT > 0 ? netVAT : undefined,
      refundDue: netVAT < 0 ? Math.abs(netVAT) : undefined,
      status: 'DRAFT',
      dueDate,
    };
  }

  /**
   * Generate invoice preview (XML without submission)
   */
  async generateInvoicePreview(invoiceData: UAEInvoiceData): Promise<string> {
    const ublDocument = await this.invoiceService.generateInvoiceXML(invoiceData);
    return ublDocument.xml;
  }

  /**
   * Format TRN
   */
  formatTRN(trn: string): string {
    return this.validationService.formatTRN(trn);
  }

  /**
   * Calculate tourist VAT refund
   */
  calculateTouristRefund(purchaseAmount: number, vatAmount: number) {
    return this.taxService.calculateTouristRefund(purchaseAmount, vatAmount);
  }

  /**
   * Calculate reverse charge VAT
   */
  calculateReverseChargeVAT(serviceAmount: number) {
    return this.taxService.calculateReverseChargeVAT(serviceAmount);
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus() {
    return this.ftaClient.getRateLimitStatus();
  }
}
