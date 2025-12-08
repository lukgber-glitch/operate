import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SubmitUvaDto } from './dto';
import axios from 'axios';

interface UvaPreview {
  organizationId: string;
  period: string;
  periodLabel: string;
  kennzahlen: {
    kz000: number;
    kz022: number;
    kz029: number;
    kz006: number;
    kz072: number;
    kz083: number;
  };
  details: {
    outputVat20: { invoices: any[]; total: number };
    outputVat13: { invoices: any[]; total: number };
    outputVat10: { invoices: any[]; total: number };
    inputVat: { expenses: any[]; total: number };
  };
  netVat: number;
  dueDate: string;
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

  constructor(private prisma: PrismaService) {}

  /**
   * Generate UVA preview from organization's invoices and expenses
   */
  async generateUvaPreview(
    organizationId: string,
    period: string,
  ): Promise<UvaPreview> {
    this.logger.log(`Generating UVA preview for org ${organizationId}, period ${period}`);

    // Parse period (e.g., "2025-01", "2025-Q1")
    const { startDate, endDate, periodLabel } = this.parsePeriod(period);

    // Fetch invoices (output VAT - what you owe)
    const invoices = await this.prisma.invoice.findMany({
      where: {
        organizationId,
        invoiceDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { notIn: ['DRAFT', 'CANCELLED'] },
      },
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        totalAmount: true,
        taxAmount: true,
        taxRate: true,
      },
    });

    // Fetch expenses (input VAT - what you can deduct)
    const expenses = await this.prisma.expense.findMany({
      where: {
        organizationId,
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { notIn: ['DRAFT', 'REJECTED'] },
      },
      select: {
        id: true,
        description: true,
        expenseDate: true,
        totalAmount: true,
        taxAmount: true,
        taxRate: true,
      },
    });

    // Categorize by Austrian tax rates
    const outputVat20 = invoices.filter((inv) => Math.abs(inv.taxRate - 20) < 0.01);
    const outputVat13 = invoices.filter((inv) => Math.abs(inv.taxRate - 13) < 0.01);
    const outputVat10 = invoices.filter((inv) => Math.abs(inv.taxRate - 10) < 0.01);

    // Calculate totals (in cents)
    const kz022 = outputVat20.reduce((sum, inv) => sum + inv.totalAmount - inv.taxAmount, 0);
    const kz006 = outputVat13.reduce((sum, inv) => sum + inv.totalAmount - inv.taxAmount, 0);
    const kz029 = outputVat10.reduce((sum, inv) => sum + inv.totalAmount - inv.taxAmount, 0);
    const kz000 = kz022 + kz006 + kz029;

    // Input VAT (deductible)
    const kz072 = expenses.reduce((sum, exp) => sum + exp.taxAmount, 0);

    // Net VAT (positive = payable, negative = refund)
    const outputVatTotal =
      kz022 * 0.20 +
      kz006 * 0.13 +
      kz029 * 0.10;
    const kz083 = Math.round(outputVatTotal - kz072);

    // Calculate due date (15th of second month after period)
    const dueDate = this.calculateDueDate(endDate);

    return {
      organizationId,
      period,
      periodLabel,
      kennzahlen: {
        kz000: Math.round(kz000),
        kz022: Math.round(kz022),
        kz029: Math.round(kz029),
        kz006: Math.round(kz006),
        kz072: Math.round(kz072),
        kz083: Math.round(kz083),
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
          expenses,
          total: Math.round(kz072),
        },
      },
      netVat: Math.round(kz083),
      dueDate: dueDate.toISOString(),
    };
  }

  /**
   * Verify Austrian UID using EU VIES system
   */
  async verifyUid(uid: string): Promise<UidVerificationResult> {
    this.logger.log(`Verifying Austrian UID: ${uid}`);

    // Validate format (ATU + 8 digits)
    if (!/^ATU\d{8}$/.test(uid)) {
      return {
        valid: false,
        uid,
        verifiedAt: new Date().toISOString(),
      };
    }

    try {
      // Extract country code and VAT number
      const countryCode = uid.substring(0, 2); // "AT"
      const vatNumber = uid.substring(2); // "U12345678"

      // Call EU VIES SOAP API
      // Note: In production, use proper SOAP client or EU VIES REST API
      const viesUrl = 'https://ec.europa.eu/taxation_customs/vies/rest-api/ms/AT/vat/' + vatNumber;

      const response = await axios.get(viesUrl, {
        timeout: 5000,
        validateStatus: (status) => status === 200 || status === 404,
      });

      if (response.status === 200 && response.data?.valid) {
        return {
          valid: true,
          uid,
          name: response.data.name || undefined,
          address: response.data.address || undefined,
          verifiedAt: new Date().toISOString(),
        };
      }

      return {
        valid: false,
        uid,
        verifiedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.warn(`VIES verification failed for ${uid}: ${error.message}`);

      // Return invalid on network errors (conservative approach)
      return {
        valid: false,
        uid,
        verifiedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Submit UVA to FinanzOnline
   * Note: This is a stub - real implementation requires FinanzOnline Web Service credentials
   */
  async submitUva(dto: SubmitUvaDto): Promise<FinanzOnlineResult> {
    this.logger.log(`Submitting UVA for org ${dto.organizationId}, period ${dto.period}`);

    try {
      // TODO: Implement actual FinanzOnline Web Service integration
      // For now, we'll create a submission record and return success

      // Validate the data
      if (dto.uva.kz000 < 0) {
        throw new BadRequestException('Invalid total revenue (KZ 000)');
      }

      // Store submission in database
      const submission = await this.prisma.taxSubmission.create({
        data: {
          organizationId: dto.organizationId,
          country: 'AT',
          taxType: 'UVA',
          period: dto.period,
          periodType: dto.periodType.toUpperCase(),
          status: 'SUBMITTED',
          submittedAt: new Date(),
          data: dto.uva as Prisma.InputJsonValue,
          referenceNumber: this.generateReferenceNumber(),
        },
      });

      return {
        success: true,
        submissionId: submission.id,
        referenceNumber: submission.referenceNumber,
        timestamp: submission.submittedAt.toISOString(),
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
   */
  async getSubmissionStatus(orgId: string, submissionId: string) {
    const submission = await this.prisma.taxSubmission.findFirst({
      where: {
        id: submissionId,
        organizationId: orgId,
      },
    });

    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    return {
      submissionId: submission.id,
      status: submission.status.toLowerCase(),
      referenceNumber: submission.referenceNumber,
      submittedAt: submission.submittedAt?.toISOString(),
    };
  }

  /**
   * Generate PDF receipt
   */
  async generateReceipt(submissionId: string): Promise<Buffer> {
    const submission = await this.prisma.taxSubmission.findUnique({
      where: { id: submissionId },
      include: { organization: true },
    });

    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    // TODO: Generate actual PDF using a library like pdfkit or puppeteer
    // For now, return a simple text buffer
    const receiptText = `
FinanzOnline UVA Einreichungsbestätigung

Referenznummer: ${submission.referenceNumber}
Zeitraum: ${submission.period}
Eingereicht am: ${submission.submittedAt?.toLocaleString('de-AT')}
Status: ${submission.status}

Organisation: ${submission.organization.name}

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
