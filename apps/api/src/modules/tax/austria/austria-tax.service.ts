import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SubmitUvaDto } from './dto';
import { TaxContextService } from '../shared/tax-context.service';
import axios from 'axios';

/**
 * UVA Preview Response
 * Contains Austrian VAT return (Umsatzsteuervoranmeldung) data
 */
interface UvaPreview {
  /** Organization ID */
  orgId: string;
  /** Period in format YYYY-MM, YYYY-QN, or YYYY */
  period: string;
  /** Human-readable period label (e.g., "Janner 2025", "Q1 2025") */
  periodLabel: string;
  /** Austrian tax form field codes (Kennzahlen) */
  kennzahlen: {
    /** KZ 000: Total taxable revenue */
    kz000: number;
    /** KZ 022: Revenue at 20% VAT rate */
    kz022: number;
    /** KZ 029: Revenue at 10% VAT rate */
    kz029: number;
    /** KZ 006: Revenue at 13% VAT rate */
    kz006: number;
    /** KZ 072: Deductible input VAT (Vorsteuer) */
    kz072: number;
    /** KZ 083: Net VAT payable (positive) or refundable (negative) */
    kz083: number;
  };
  /** Detailed breakdown with source documents */
  details: {
    outputVat20: { invoices: InvoiceSummary[]; total: number };
    outputVat13: { invoices: InvoiceSummary[]; total: number };
    outputVat10: { invoices: InvoiceSummary[]; total: number };
    inputVat: { expenses: ExpenseSummary[]; total: number };
  };
  /** Net VAT amount in cents */
  netVat: number;
  /** Due date for submission (ISO 8601) */
  dueDate: string;
}

interface InvoiceSummary {
  id: string;
  invoiceNumber: string | null;
  invoiceDate: Date;
  totalAmount: number;
  taxAmount: number;
  taxRate: number;
}

interface ExpenseSummary {
  id: string;
  description: string | null;
  expenseDate: Date;
  totalAmount: number;
  taxAmount: number;
  vatRate: number;
}

interface UidVerificationResult {
  valid: boolean;
  uid: string;
  name?: string;
  address?: string;
  verifiedAt: string;
}

interface FinanzOnlineResult {
  success: boolean;
  submissionId?: string;
  referenceNumber?: string;
  timestamp: string;
  errors?: { code: string; message: string }[];
}

@Injectable()
export class AustriaTaxService {
  private readonly logger = new Logger(AustriaTaxService.name);

  constructor(
    private prisma: PrismaService,
    private taxContext: TaxContextService,
  ) {}

  /**
   * Generate UVA preview from organization's invoices and expenses
   *
   * @param orgId Organization ID
   * @param period Period string (YYYY-MM, YYYY-QN, or YYYY)
   * @returns UVA preview with Kennzahlen and document details
   */
  async generateUvaPreview(
    orgId: string,
    period: string,
  ): Promise<UvaPreview> {
    this.logger.log(`Generating UVA preview for org ${orgId}, period ${period}`);

    // Parse period (e.g., "2025-01", "2025-Q1")
    const { startDate, endDate, periodLabel } = this.parsePeriod(period);

    // Fetch invoices (output VAT - what you owe)
    // Note: Uses orgId for consistency with database schema
    const invoices = await this.prisma.invoice.findMany({
      where: {
        orgId,
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { notIn: ['DRAFT', 'CANCELLED'] },
      },
      select: {
        id: true,
        invoiceNumber: true,
        issueDate: true,
        total: true,
        vatAmount: true,
        vatRate: true,
      },
    });

    // Fetch expenses (input VAT - what you can deduct)
    const expenses = await this.prisma.expense.findMany({
      where: {
        orgId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: { notIn: ['REJECTED'] },
      },
      select: {
        id: true,
        description: true,
        date: true,
        amount: true,
        vatAmount: true,
        vatRate: true,
      },
    });

    // Map invoices to consistent format and categorize by Austrian tax rates
    const mappedInvoices: InvoiceSummary[] = invoices.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.issueDate,
      totalAmount: Number(inv.total) || 0,
      taxAmount: Number(inv.vatAmount) || 0,
      taxRate: Number(inv.vatRate) || 0,
    }));

    // Map expenses to consistent format
    const mappedExpenses: ExpenseSummary[] = expenses.map(exp => ({
      id: exp.id,
      description: exp.description,
      expenseDate: exp.date,
      totalAmount: Number(exp.amount) || 0,
      taxAmount: Number(exp.vatAmount) || 0,
      vatRate: Number(exp.vatRate) || 0,
    }));

    // Categorize by Austrian VAT rates (20%, 13%, 10%)
    const outputVat20 = mappedInvoices.filter((inv) => Math.abs(inv.taxRate - 20) < 0.01);
    const outputVat13 = mappedInvoices.filter((inv) => Math.abs(inv.taxRate - 13) < 0.01);
    const outputVat10 = mappedInvoices.filter((inv) => Math.abs(inv.taxRate - 10) < 0.01);

    // Calculate net amounts (totals in cents)
    // KZ 022: Net revenue at 20% rate
    const kz022 = outputVat20.reduce((sum, inv) => sum + (inv.totalAmount - inv.taxAmount), 0);
    // KZ 006: Net revenue at 13% rate
    const kz006 = outputVat13.reduce((sum, inv) => sum + (inv.totalAmount - inv.taxAmount), 0);
    // KZ 029: Net revenue at 10% rate
    const kz029 = outputVat10.reduce((sum, inv) => sum + (inv.totalAmount - inv.taxAmount), 0);
    // KZ 000: Total taxable revenue
    const kz000 = kz022 + kz006 + kz029;

    // KZ 072: Input VAT (Vorsteuer - deductible)
    const kz072 = mappedExpenses.reduce((sum, exp) => sum + exp.taxAmount, 0);

    // Calculate output VAT amounts
    const outputVatTotal = (kz022 * 0.20) + (kz006 * 0.13) + (kz029 * 0.10);

    // KZ 083: Net VAT (positive = payable, negative = refund)
    const kz083 = Math.round(outputVatTotal - kz072);

    // Calculate due date (15th of second month after period)
    const dueDate = this.calculateDueDate(endDate);

    return {
      orgId,
      period,
      periodLabel,
      kennzahlen: {
        kz000: Math.round(kz000),
        kz022: Math.round(kz022),
        kz029: Math.round(kz029),
        kz006: Math.round(kz006),
        kz072: Math.round(kz072),
        kz083,
      },
      details: {
        outputVat20: {
          invoices: outputVat20,
          total: Math.round(kz022 * 0.20),
        },
        outputVat13: {
          invoices: outputVat13,
          total: Math.round(kz006 * 0.13),
        },
        outputVat10: {
          invoices: outputVat10,
          total: Math.round(kz029 * 0.10),
        },
        inputVat: {
          expenses: mappedExpenses,
          total: Math.round(kz072),
        },
      },
      netVat: kz083,
      dueDate: dueDate.toISOString(),
    };
  }

  /**
   * Verify Austrian UID using EU VIES system
   * Uses the official EU VIES REST API for VAT number validation
   *
   * @param uid Austrian VAT number (format: ATU + 8 digits, e.g., "ATU12345678")
   * @returns Verification result with validity status and company details if valid
   */
  async verifyUid(uid: string): Promise<UidVerificationResult> {
    this.logger.log(`Verifying Austrian UID: ${uid}`);

    // Normalize and validate format (ATU + 8 digits)
    const normalizedUid = uid.toUpperCase().replace(/\s/g, '');

    if (!/^ATU\d{8}$/.test(normalizedUid)) {
      this.logger.warn(`Invalid UID format: ${uid}`);
      return {
        valid: false,
        uid: normalizedUid,
        verifiedAt: new Date().toISOString(),
      };
    }

    try {
      // Extract VAT number without country code for API
      const vatNumber = normalizedUid.substring(2); // "U12345678"

      // EU VIES REST API (official endpoint)
      // Documentation: https://ec.europa.eu/taxation_customs/vies/
      const viesUrl = `https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number`;

      const response = await axios.post(
        viesUrl,
        {
          countryCode: 'AT',
          vatNumber: vatNumber,
        },
        {
          timeout: 10000, // 10 seconds for external API
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          validateStatus: (status) => status === 200 || status === 400 || status === 404,
        },
      );

      if (response.status === 200 && response.data?.valid === true) {
        return {
          valid: true,
          uid: normalizedUid,
          name: response.data.name?.trim() || undefined,
          address: response.data.address?.trim() || undefined,
          verifiedAt: new Date().toISOString(),
        };
      }

      // Invalid VAT number
      return {
        valid: false,
        uid: normalizedUid,
        verifiedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.warn(`VIES verification failed for ${normalizedUid}: ${error.message}`);

      // Return invalid on network errors (conservative approach)
      // In production, you might want to cache previous valid results
      return {
        valid: false,
        uid: normalizedUid,
        verifiedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Submit UVA to FinanzOnline
   * Note: This is a stub - real implementation requires FinanzOnline Web Service credentials
   *
   * @param dto Submission data including orgId, period, and UVA kennzahlen
   * @returns Submission result with reference number or errors
   */
  async submitUva(dto: SubmitUvaDto): Promise<FinanzOnlineResult> {
    const orgId = dto.organizationId;
    this.logger.log(`Submitting UVA for org ${orgId}, period ${dto.period}`);

    try {
      // TODO: Implement actual FinanzOnline Web Service integration
      // For now, we'll create a submission record and return success

      // Validate the data
      if (!dto.uva || dto.uva.kz000 < 0) {
        throw new BadRequestException('Invalid total revenue (KZ 000)');
      }

      // Store submission in database using IntegrationSubmission
      const submission = await this.prisma.integrationSubmission.create({
        data: {
          organizationId: orgId,
          provider: 'FinanzOnline',
          submissionType: 'UVA',
          status: 'SUBMITTED',
          confirmationNumber: this.generateReferenceNumber(),
          submittedAt: new Date(),
          details: {
            period: dto.period,
            periodType: dto.periodType?.toUpperCase() || 'MONTHLY',
            uva: dto.uva,
          } as any,
        },
      });

      return {
        success: true,
        submissionId: submission.id,
        referenceNumber: submission.confirmationNumber!,
        timestamp: submission.submittedAt!.toISOString(),
      };
    } catch (error) {
      this.logger.error(`UVA submission failed: ${error.message}`, error.stack);

      return {
        success: false,
        timestamp: new Date().toISOString(),
        errors: [
          {
            code: 'SUBMISSION_FAILED',
            message: error.message || 'Unknown error during submission',
          },
        ],
      };
    }
  }

  /**
   * Get submission status
   *
   * @param orgId Organization ID
   * @param submissionId Submission ID
   * @returns Submission status with reference number
   */
  async getSubmissionStatus(orgId: string, submissionId: string) {
    const submission = await this.prisma.integrationSubmission.findFirst({
      where: {
        id: submissionId,
        organizationId: orgId,
      },
    });

    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    const details = submission.details as any;

    return {
      submissionId: submission.id,
      status: submission.status.toLowerCase(),
      referenceNumber: submission.confirmationNumber,
      submittedAt: submission.submittedAt?.toISOString(),
      period: details?.period,
      taxType: submission.submissionType,
    };
  }

  /**
   * Generate PDF receipt for a submission
   *
   * @param submissionId Submission ID
   * @returns Buffer containing receipt content (text for now, PDF in production)
   */
  async generateReceipt(submissionId: string): Promise<Buffer> {
    const submission = await this.prisma.integrationSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    const org = await this.prisma.organisation.findUnique({
      where: { id: submission.organizationId },
    });

    const details = submission.details as any;

    // TODO: Generate actual PDF using a library like pdfkit or puppeteer
    // For now, return a simple text buffer
    const receiptText = `
FinanzOnline UVA Einreichungsbestätigung

Referenznummer: ${submission.confirmationNumber}
Zeitraum: ${details?.period}
Eingereicht am: ${submission.submittedAt?.toLocaleString('de-AT')}
Status: ${submission.status}

Organisation: ${org?.name || 'N/A'}

Dies ist eine vorläufige Bestätigung.
Die offizielle Bestätigung erhalten Sie von FinanzOnline.
    `.trim();

    return Buffer.from(receiptText, 'utf-8');
  }

  // Helper methods

  private parsePeriod(period: string): {
    startDate: Date;
    endDate: Date;
    periodLabel: string;
  } {
    // Handle formats: "2025-01", "2025-Q1", "2025"
    if (/^\d{4}-\d{2}$/.test(period)) {
      // Monthly: "2025-01"
      const [year, month] = period.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      const monthNames = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
      return {
        startDate,
        endDate,
        periodLabel: `${monthNames[month - 1]} ${year}`,
      };
    } else if (/^\d{4}-Q[1-4]$/.test(period)) {
      // Quarterly: "2025-Q1"
      const [year, q] = period.split('-');
      const quarter = parseInt(q.substring(1));
      const startMonth = (quarter - 1) * 3;
      const startDate = new Date(parseInt(year), startMonth, 1);
      const endDate = new Date(parseInt(year), startMonth + 3, 0, 23, 59, 59);
      return {
        startDate,
        endDate,
        periodLabel: `Q${quarter} ${year}`,
      };
    } else if (/^\d{4}$/.test(period)) {
      // Yearly: "2025"
      const year = parseInt(period);
      return {
        startDate: new Date(year, 0, 1),
        endDate: new Date(year, 11, 31, 23, 59, 59),
        periodLabel: `Jahr ${year}`,
      };
    }

    throw new BadRequestException(`Invalid period format: ${period}`);
  }

  private calculateDueDate(periodEnd: Date): Date {
    // Austrian UVA is due on the 15th of the second month after the period
    const dueMonth = periodEnd.getMonth() + 2;
    const dueYear = periodEnd.getFullYear() + Math.floor(dueMonth / 12);
    return new Date(dueYear, dueMonth % 12, 15);
  }

  private generateReferenceNumber(): string {
    // Generate a reference number similar to FinanzOnline format
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `FO-AT-${timestamp}-${random}`;
  }
}
