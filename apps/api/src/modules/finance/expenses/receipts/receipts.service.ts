import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { MindeeService } from '../../../integrations/mindee/mindee.service';
import { ExpensesService } from '../expenses.service';
import {
  UploadReceiptDto,
  ReceiptScanResult,
  ScanStatus,
  ConfirmScanDto,
  ScanHistoryFiltersDto,
  PaginatedResult,
  ReceiptScan,
  ExtractedField,
  ConfidenceLevel,
} from './dto/receipts.dto';
import { ReceiptScanStatus, ExpenseCategory } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Receipts Service
 * Handles receipt upload, OCR scanning, and expense creation from receipts
 */
@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mindeeService: MindeeService,
    private readonly expensesService: ExpensesService,
  ) {}

  /**
   * Upload and scan a receipt
   */
  async uploadAndScan(
    orgId: string,
    userId: string,
    file: Express.Multer.File,
    uploadDto: UploadReceiptDto,
  ): Promise<ReceiptScanResult> {
    this.logger.log(
      `Starting receipt upload for org ${orgId}, file: ${file.originalname}`,
    );

    try {
      // Create initial scan record
      const scan = await this.prisma.receiptScan.create({
        data: {
          orgId,
          filename: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          status: ReceiptScanStatus.PROCESSING,
        },
      });

      this.logger.log(`Created scan record: ${scan.id}`);

      // Process receipt with Mindee OCR
      const ocrResult = await this.mindeeService.parseReceipt(
        file.buffer,
        file.mimetype,
      );

      this.logger.log(
        `OCR completed for scan ${scan.id}, success: ${ocrResult.success}`,
      );

      // Update scan with extracted data
      const updatedScan = await this.prisma.receiptScan.update({
        where: { id: scan.id },
        data: {
          status: ocrResult.success
            ? ReceiptScanStatus.COMPLETED
            : ReceiptScanStatus.FAILED,
          merchantName: ocrResult.merchant?.name,
          amount: ocrResult.totals?.amount
            ? new Decimal(ocrResult.totals.amount)
            : null,
          currency: ocrResult.totals?.currency,
          date: ocrResult.date?.value,
          confidence: ocrResult.confidence
            ? new Decimal(ocrResult.confidence * 100)
            : null,
          ocrData: ocrResult.rawResponse as Prisma.InputJsonValue,
          aiResponse: {
            merchant: ocrResult.merchant,
            date: ocrResult.date,
            totals: ocrResult.totals,
            lineItems: ocrResult.lineItems,
            paymentMethod: ocrResult.paymentMethod,
            receiptNumber: ocrResult.receiptNumber,
          },
        },
      });

      // Convert to response format
      return this.convertToScanResult(updatedScan, ocrResult);
    } catch (error) {
      this.logger.error('Failed to process receipt', error);
      throw new BadRequestException(
        `Failed to process receipt: ${error.message}`,
      );
    }
  }

  /**
   * Get scan status
   */
  async getScanStatus(
    scanId: string,
  ): Promise<{ scanId: string; status: ScanStatus; progress?: number }> {
    const scan = await this.prisma.receiptScan.findUnique({
      where: { id: scanId },
      select: { id: true, status: true },
    });

    if (!scan) {
      throw new NotFoundException(`Scan ${scanId} not found`);
    }

    // Map Prisma status to DTO status
    const status = this.mapStatus(scan.status);

    // Calculate progress based on status
    const progress =
      status === ScanStatus.PENDING
        ? 0
        : status === ScanStatus.PROCESSING
          ? 50
          : 100;

    return {
      scanId: scan.id,
      status,
      progress,
    };
  }

  /**
   * Get scan result
   */
  async getScanResult(scanId: string): Promise<ReceiptScanResult> {
    const scan = await this.prisma.receiptScan.findUnique({
      where: { id: scanId },
    });

    if (!scan) {
      throw new NotFoundException(`Scan ${scanId} not found`);
    }

    // Convert stored data to response format
    return this.convertStoredScanToResult(scan);
  }

  /**
   * Confirm scan and create expense
   */
  async confirmScan(
    orgId: string,
    scanId: string,
    userId: string,
    corrections: ConfirmScanDto,
  ): Promise<any> {
    const scan = await this.prisma.receiptScan.findUnique({
      where: { id: scanId },
    });

    if (!scan) {
      throw new NotFoundException(`Scan ${scanId} not found`);
    }

    if (scan.orgId !== orgId) {
      throw new BadRequestException('Scan does not belong to this organisation');
    }

    if (scan.status === ReceiptScanStatus.FAILED) {
      throw new BadRequestException('Cannot confirm a failed scan');
    }

    if (scan.expenseId) {
      throw new BadRequestException('Scan already confirmed and expense created');
    }

    this.logger.log(`Confirming scan ${scanId} and creating expense`);

    // Merge scan data with corrections
    const expenseData = {
      description:
        corrections.description ||
        corrections.merchantName ||
        scan.merchantName ||
        'Expense from receipt',
      vendorName: corrections.merchantName || scan.merchantName || undefined,
      amount: corrections.totalAmount
        ? new Decimal(corrections.totalAmount)
        : scan.amount || new Decimal(0),
      currency: corrections.currency || scan.currency || 'EUR',
      date: corrections.date
        ? new Date(corrections.date)
        : scan.date || new Date(),
      category:
        corrections.category ||
        (scan.category as ExpenseCategory) ||
        ExpenseCategory.OTHER,
      subcategory: corrections.subcategory || scan.subcategory || undefined,
      status: corrections.approved ? 'APPROVED' : 'PENDING',
      notes: corrections.notes,
      metadata: corrections.metadata,
    };

    // Create expense using the expenses service
    const expense = await this.expensesService.create(
      orgId,
      userId,
      expenseData as Prisma.InputJsonValue,
    );

    // Link scan to expense
    await this.prisma.receiptScan.update({
      where: { id: scanId },
      data: {
        expenseId: expense.id,
      },
    });

    this.logger.log(
      `Created expense ${expense.id} from scan ${scanId}`,
    );

    return expense;
  }

  /**
   * Reject scan
   */
  async rejectScan(scanId: string, reason?: string): Promise<void> {
    const scan = await this.prisma.receiptScan.findUnique({
      where: { id: scanId },
    });

    if (!scan) {
      throw new NotFoundException(`Scan ${scanId} not found`);
    }

    if (scan.expenseId) {
      throw new BadRequestException('Cannot reject scan that already has an expense');
    }

    this.logger.log(`Rejecting scan ${scanId}, reason: ${reason || 'none'}`);

    // Update scan status (we'll use FAILED status to indicate rejection)
    await this.prisma.receiptScan.update({
      where: { id: scanId },
      data: {
        status: ReceiptScanStatus.FAILED,
        aiResponse: {
          ...(scan.aiResponse as Prisma.InputJsonValue),
          rejectionReason: reason,
          rejectedAt: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Get scan history with filters
   */
  async getScanHistory(
    orgId: string,
    filters: ScanHistoryFiltersDto,
  ): Promise<PaginatedResult<ReceiptScan>> {
    const {
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = filters;

    // Build where clause
    const where: any = { orgId };

    if (status) {
      where.status = this.mapScanStatusToPrisma(status);
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch data
    const [scans, total] = await Promise.all([
      this.prisma.receiptScan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orgId: true,
          status: true,
          filename: true,
          expenseId: true,
          confidence: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.receiptScan.count({ where }),
    ]);

    // Map to response format
    const items = scans.map((scan) => ({
      id: scan.id,
      organisationId: scan.orgId,
      uploadedBy: 'system', // TODO: Add uploadedBy field to schema
      status: this.mapStatus(scan.status),
      receiptUrl: `/receipts/${scan.id}/file`, // TODO: Implement file storage
      expenseId: scan.expenseId || undefined,
      overallConfidence: scan.confidence
        ? Number(scan.confidence)
        : undefined,
      createdAt: scan.createdAt.toISOString(),
      completedAt: scan.updatedAt.toISOString(),
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Re-scan a receipt
   */
  async rescanReceipt(scanId: string): Promise<ReceiptScanResult> {
    const scan = await this.prisma.receiptScan.findUnique({
      where: { id: scanId },
    });

    if (!scan) {
      throw new NotFoundException(`Scan ${scanId} not found`);
    }

    if (scan.expenseId) {
      throw new BadRequestException(
        'Cannot re-scan a receipt that already has an expense',
      );
    }

    this.logger.log(`Re-scanning receipt ${scanId}`);

    // For now, just return the existing scan result
    // In production, you would:
    // 1. Fetch the original file from storage
    // 2. Re-run the OCR
    // 3. Update the scan record
    return this.convertStoredScanToResult(scan);
  }

  /**
   * Helper: Convert Prisma scan to DTO result
   */
  private convertStoredScanToResult(scan: any): ReceiptScanResult {
    const aiResponse = scan.aiResponse as Prisma.InputJsonValue;

    return {
      scanId: scan.id,
      status: this.mapStatus(scan.status),
      receiptUrl: `/receipts/${scan.id}/file`, // TODO: Implement file storage
      merchantName: this.createExtractedField(
        scan.merchantName,
        aiResponse?.merchant?.confidence,
      ),
      date: this.createExtractedField(
        scan.date?.toISOString().split('T')[0],
        aiResponse?.date?.confidence,
      ),
      totalAmount: this.createExtractedField(
        scan.amount ? Number(scan.amount) : undefined,
        aiResponse?.totals?.confidence,
      ),
      currency: this.createExtractedField(
        scan.currency,
        aiResponse?.totals?.confidence,
      ),
      category: this.createExtractedField(
        scan.category as ExpenseCategory,
        0.5,
      ),
      subcategory: this.createExtractedField(scan.subcategory, 0.5),
      receiptNumber: this.createExtractedField(
        aiResponse?.receiptNumber,
        0.8,
      ),
      paymentMethod: this.createExtractedField(
        aiResponse?.paymentMethod,
        0.8,
      ),
      overallConfidence: scan.confidence ? Number(scan.confidence) : 0,
      createdAt: scan.createdAt.toISOString(),
      completedAt: scan.updatedAt.toISOString(),
    };
  }

  /**
   * Helper: Convert Mindee result to DTO result
   */
  private convertToScanResult(scan: any, ocrResult: any): ReceiptScanResult {
    return {
      scanId: scan.id,
      status: this.mapStatus(scan.status),
      receiptUrl: `/receipts/${scan.id}/file`, // TODO: Implement file storage
      merchantName: this.createExtractedField(
        ocrResult.merchant?.name,
        ocrResult.merchant?.confidence,
      ),
      date: this.createExtractedField(
        ocrResult.date?.value?.toISOString().split('T')[0],
        ocrResult.date?.confidence,
      ),
      totalAmount: this.createExtractedField(
        ocrResult.totals?.amount,
        ocrResult.totals?.confidence,
      ),
      taxAmount: this.createExtractedField(
        ocrResult.totals?.tax,
        ocrResult.totals?.confidence,
      ),
      currency: this.createExtractedField(
        ocrResult.totals?.currency,
        ocrResult.totals?.confidence,
      ),
      receiptNumber: this.createExtractedField(
        ocrResult.receiptNumber,
        0.8,
      ),
      paymentMethod: this.createExtractedField(
        ocrResult.paymentMethod,
        0.8,
      ),
      overallConfidence: ocrResult.confidence || 0,
      createdAt: scan.createdAt.toISOString(),
      completedAt: scan.updatedAt.toISOString(),
    };
  }

  /**
   * Helper: Create extracted field with confidence
   */
  private createExtractedField<T>(
    value: T | undefined,
    confidence?: number,
  ): ExtractedField<T> | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    const conf = confidence || 0;
    const level: ConfidenceLevel =
      conf >= 0.8
        ? ConfidenceLevel.HIGH
        : conf >= 0.5
          ? ConfidenceLevel.MEDIUM
          : ConfidenceLevel.LOW;

    return {
      value,
      confidence: conf,
      confidenceLevel: level,
    };
  }

  /**
   * Helper: Map Prisma status to DTO status
   */
  private mapStatus(status: ReceiptScanStatus): ScanStatus {
    switch (status) {
      case ReceiptScanStatus.PENDING:
        return ScanStatus.PENDING;
      case ReceiptScanStatus.PROCESSING:
        return ScanStatus.PROCESSING;
      case ReceiptScanStatus.COMPLETED:
        return ScanStatus.COMPLETED;
      case ReceiptScanStatus.FAILED:
        return ScanStatus.FAILED;
      case ReceiptScanStatus.NEEDS_REVIEW:
        return ScanStatus.COMPLETED; // Map NEEDS_REVIEW to COMPLETED
      default:
        return ScanStatus.PENDING;
    }
  }

  /**
   * Helper: Map DTO status to Prisma status
   */
  private mapScanStatusToPrisma(status: ScanStatus): ReceiptScanStatus {
    switch (status) {
      case ScanStatus.PENDING:
        return ReceiptScanStatus.PENDING;
      case ScanStatus.PROCESSING:
        return ReceiptScanStatus.PROCESSING;
      case ScanStatus.COMPLETED:
        return ReceiptScanStatus.COMPLETED;
      case ScanStatus.FAILED:
        return ReceiptScanStatus.FAILED;
      case ScanStatus.CONFIRMED:
        return ReceiptScanStatus.COMPLETED; // Map CONFIRMED to COMPLETED
      case ScanStatus.REJECTED:
        return ReceiptScanStatus.FAILED; // Map REJECTED to FAILED
      default:
        return ReceiptScanStatus.PENDING;
    }
  }
}
