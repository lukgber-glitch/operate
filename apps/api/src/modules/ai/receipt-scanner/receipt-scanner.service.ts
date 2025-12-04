/**
 * Receipt Scanner Service
 * Combines Mindee OCR with AI classification and automation logic
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ClassificationService } from '../classification/classification.service';
import { AutomationSettingsService } from '../../automation/automation-settings.service';
import { AutoApproveService } from '../../automation/auto-approve.service';
import { ExpensesService } from '../../finance/expenses/expenses.service';
import { EventsGateway } from '../../../websocket/events.gateway';
import { AutomationEvent, AutomationEventPayload } from '@operate/shared';
import {
  ReceiptScanResult,
  ReceiptParseResult,
  ReceiptClassificationResult,
  ScanHistoryFiltersDto,
  ReceiptScan,
} from './dto/receipt-scanner.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReceiptScannerService {
  private readonly logger = new Logger(ReceiptScannerService.name);

  constructor(
    private readonly prisma: PrismaService,
    // Note: MindeeService will be injected once BRIDGE creates it
    // private readonly mindeeService: MindeeService,
    private readonly classificationService: ClassificationService,
    private readonly automationSettingsService: AutomationSettingsService,
    private readonly autoApproveService: AutoApproveService,
    private readonly expensesService: ExpensesService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Main scan method - processes receipt through OCR and AI classification
   */
  async scanReceipt(params: {
    organisationId: string;
    file: Buffer;
    mimeType: string;
    userId: string;
    fileName?: string;
    autoApprove?: boolean;
  }): Promise<ReceiptScanResult> {
    const { organisationId, file, mimeType, userId, fileName, autoApprove = true } = params;

    this.logger.log(
      `Scanning receipt for org ${organisationId}, user ${userId}, auto-approve: ${autoApprove}`,
    );

    // Create scan record
    const scanId = await this.createScanRecord({
      organisationId,
      userId,
      fileName: fileName || `receipt-${Date.now()}.jpg`,
      fileSize: file.length,
      mimeType,
    });

    try {
      // Update status to processing
      await this.updateScanStatus(scanId, 'PROCESSING');

      // Step 1: OCR with Mindee
      // TODO: Uncomment when MindeeService is available
      // const ocrResult = await this.mindeeService.parseReceipt({
      //   file,
      //   mimeType,
      // });

      // TEMPORARY: Mock OCR result for development
      const ocrResult: ReceiptParseResult = this.mockOcrResult();

      // Step 2: AI Classification
      const classification = await this.classifyReceipt(ocrResult);

      // Step 3: Check automation settings and auto-approval eligibility
      const autoApprovalDecision = await this.evaluateAutoApproval({
        organisationId,
        classification,
        amount: ocrResult.totalAmount,
        autoApprove,
      });

      // Step 4: Create expense if auto-approved
      let expenseId: string | undefined;
      if (autoApprovalDecision.approved) {
        expenseId = await this.createExpenseFromOcr({
          organisationId,
          userId,
          ocrResult,
          classification,
          scanId,
        });
      }

      // Update scan record with results
      await this.updateScanResults({
        scanId,
        ocrResult,
        classification,
        expenseId,
        status: autoApprovalDecision.approved ? 'COMPLETED' : 'NEEDS_REVIEW',
      });

      // Emit WebSocket event
      this.emitScanCompletedEvent({
        organisationId,
        scanId,
        autoApproved: autoApprovalDecision.approved,
        expenseId,
      });

      const result: ReceiptScanResult = {
        id: scanId,
        status: autoApprovalDecision.approved ? 'completed' : 'needs_review',
        ocrData: ocrResult,
        classification,
        autoApproval: autoApprovalDecision,
        expenseId,
        scannedAt: new Date(),
        processedAt: new Date(),
      };

      this.logger.log(
        `Receipt scan completed: ${scanId}, auto-approved: ${autoApprovalDecision.approved}`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Receipt scan failed for ${scanId}:`, error);

      // Update scan with error
      await this.updateScanStatus(scanId, 'FAILED', error.message);

      throw new BadRequestException(`Receipt scan failed: ${error.message}`);
    }
  }

  /**
   * Enhance OCR results with AI classification
   */
  async classifyReceipt(ocrResult: ReceiptParseResult): Promise<ReceiptClassificationResult> {
    this.logger.debug('Classifying receipt with AI');

    // Build description from OCR data
    const description = this.buildDescriptionFromOcr(ocrResult);

    // Use classification service
    const classificationResult = await this.classificationService.classifyTransaction({
      id: `receipt-${Date.now()}`,
      description,
      amount: ocrResult.totalAmount || 0,
      currency: ocrResult.currency || 'EUR',
      date: ocrResult.date || new Date(),
      counterparty: ocrResult.merchantName,
    });

    return {
      category: classificationResult.category,
      subcategory: classificationResult.subcategory,
      taxDeductible: classificationResult.taxRelevant,
      taxDeductionPercentage: classificationResult.taxDeductionPercentage,
      suggestedAccount: classificationResult.suggestedAccount,
      confidence: classificationResult.confidence,
      reasoning: classificationResult.reasoning,
    };
  }

  /**
   * Create expense from scan result
   */
  async createExpenseFromScan(params: {
    organisationId: string;
    scanId: string;
    userId: string;
    autoApprove?: boolean;
  }): Promise<string> {
    const { organisationId, scanId, userId, autoApprove = false } = params;

    this.logger.log(`Creating expense from scan ${scanId}`);

    // Get scan record
    const scan = await this.getScanById(scanId);

    if (!scan) {
      throw new NotFoundException(`Scan ${scanId} not found`);
    }

    if (scan.expenseId) {
      throw new BadRequestException(`Scan ${scanId} already has an associated expense`);
    }

    const ocrResult = scan.ocrData as ReceiptParseResult;
    const classification: ReceiptClassificationResult = {
      category: scan.category || 'OTHER',
      subcategory: scan.subcategory,
      taxDeductible: scan.taxDeductible,
      confidence: scan.ocrConfidence,
      reasoning: 'From receipt scan',
    };

    // Create expense
    const expenseId = await this.createExpenseFromOcr({
      organisationId,
      userId,
      ocrResult,
      classification,
      scanId,
      autoApprove,
    });

    // Update scan record
    await this.prisma.receiptScan.update({
      where: { id: scanId },
      data: {
        expenseId,
        status: 'COMPLETED',
      },
    });

    return expenseId;
  }

  /**
   * Get scan history with filters
   */
  async getScanHistory(
    organisationId: string,
    filters?: ScanHistoryFiltersDto,
  ): Promise<{ data: ReceiptScan[]; total: number; page: number; pageSize: number }> {
    const { status, userId, fromDate, toDate, page = 1, pageSize = 20 } = filters || {};

    const where: Prisma.ReceiptScanWhereInput = {
      organisationId,
      ...(status && { status: status.toUpperCase() as any }),
      ...(userId && { userId }),
    };

    // Date range filter
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt.gte = new Date(fromDate);
      }
      if (toDate) {
        where.createdAt.lte = new Date(toDate);
      }
    }

    const skip = (page - 1) * pageSize;

    const [scans, total] = await Promise.all([
      this.prisma.receiptScan.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.receiptScan.count({ where }),
    ]);

    return {
      data: scans as any,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Get scan by ID
   */
  async getScanById(scanId: string): Promise<ReceiptScan | null> {
    const scan = await this.prisma.receiptScan.findUnique({
      where: { id: scanId },
    });

    return scan as any;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Create initial scan record
   */
  private async createScanRecord(params: {
    organisationId: string;
    userId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }): Promise<string> {
    const scan = await this.prisma.receiptScan.create({
      data: {
        organisationId: params.organisationId,
        userId: params.userId,
        fileName: params.fileName,
        fileSize: params.fileSize,
        mimeType: params.mimeType,
        status: 'PENDING',
        ocrData: {},
        ocrConfidence: 0,
        taxDeductible: false,
      },
    });

    return scan.id;
  }

  /**
   * Update scan status
   */
  private async updateScanStatus(
    scanId: string,
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'NEEDS_REVIEW' | 'FAILED',
    errorMessage?: string,
  ): Promise<void> {
    await this.prisma.receiptScan.update({
      where: { id: scanId },
      data: {
        status,
        ...(errorMessage && { errorMessage }),
      },
    });
  }

  /**
   * Update scan with results
   */
  private async updateScanResults(params: {
    scanId: string;
    ocrResult: ReceiptParseResult;
    classification: ReceiptClassificationResult;
    expenseId?: string;
    status: 'COMPLETED' | 'NEEDS_REVIEW';
  }): Promise<void> {
    await this.prisma.receiptScan.update({
      where: { id: params.scanId },
      data: {
        ocrData: params.ocrResult as any,
        ocrConfidence: params.ocrResult.confidence,
        category: params.classification.category,
        subcategory: params.classification.subcategory,
        taxDeductible: params.classification.taxDeductible,
        status: params.status,
        expenseId: params.expenseId,
      },
    });
  }

  /**
   * Evaluate auto-approval decision
   */
  private async evaluateAutoApproval(params: {
    organisationId: string;
    classification: ReceiptClassificationResult;
    amount?: number;
    autoApprove: boolean;
  }): Promise<{ eligible: boolean; approved: boolean; reason: string }> {
    if (!params.autoApprove) {
      return {
        eligible: false,
        approved: false,
        reason: 'Auto-approve disabled by user',
      };
    }

    // Check automation settings
    const decision = await this.autoApproveService.shouldAutoApprove({
      organisationId: params.organisationId,
      feature: 'expenses',
      confidenceScore: params.classification.confidence,
      amount: params.amount,
    });

    return {
      eligible: decision.autoApprove,
      approved: decision.autoApprove,
      reason: decision.reason,
    };
  }

  /**
   * Create expense from OCR result
   */
  private async createExpenseFromOcr(params: {
    organisationId: string;
    userId: string;
    ocrResult: ReceiptParseResult;
    classification: ReceiptClassificationResult;
    scanId: string;
    autoApprove?: boolean;
  }): Promise<string> {
    const { organisationId, userId, ocrResult, classification, scanId } = params;

    // Create expense via ExpensesService
    const expense = await this.expensesService.create(organisationId, {
      description: ocrResult.merchantName || 'Receipt expense',
      amount: ocrResult.totalAmount || 0,
      currency: ocrResult.currency || 'EUR',
      date: ocrResult.date || new Date(),
      category: classification.category as any,
      subcategory: classification.subcategory,
      vendorName: ocrResult.merchantName,
      vendorVatId: ocrResult.merchantVatId,
      receiptNumber: ocrResult.receiptNumber,
      vatAmount: ocrResult.taxAmount,
      vatRate: ocrResult.taxRate,
      isDeductible: classification.taxDeductible,
      submittedBy: userId,
      metadata: {
        scanId,
        ocrConfidence: ocrResult.confidence,
        aiCategory: classification.category,
        aiConfidence: classification.confidence,
        autoCreated: true,
      },
    });

    // Auto-approve if eligible
    if (params.autoApprove) {
      await this.expensesService.approve(expense.id, 'system');
    }

    return expense.id;
  }

  /**
   * Build description from OCR data
   */
  private buildDescriptionFromOcr(ocrResult: ReceiptParseResult): string {
    const parts: string[] = [];

    if (ocrResult.merchantName) {
      parts.push(ocrResult.merchantName);
    }

    if (ocrResult.lineItems && ocrResult.lineItems.length > 0) {
      const itemDescriptions = ocrResult.lineItems
        .slice(0, 3)
        .map((item) => item.description)
        .join(', ');
      parts.push(itemDescriptions);
    }

    if (ocrResult.totalAmount) {
      parts.push(`${ocrResult.totalAmount} ${ocrResult.currency || 'EUR'}`);
    }

    return parts.join(' - ') || 'Receipt';
  }

  /**
   * Emit WebSocket event for scan completion
   */
  private emitScanCompletedEvent(params: {
    organisationId: string;
    scanId: string;
    autoApproved: boolean;
    expenseId?: string;
  }): void {
    try {
      const payload: AutomationEventPayload = {
        organizationId: params.organisationId,
        entityType: 'receipt_scan',
        entityId: params.scanId,
        feature: 'receipt_scanner',
        action: params.autoApproved ? 'AUTO_APPROVED' : 'NEEDS_REVIEW',
        timestamp: new Date(),
        autoApproved: params.autoApproved,
        metadata: {
          expenseId: params.expenseId,
        },
      };

      const event = params.autoApproved
        ? AutomationEvent.AUTO_APPROVED
        : AutomationEvent.CLASSIFICATION_COMPLETE;

      this.eventsGateway.emitToOrganization(params.organisationId, event, payload);

      this.logger.debug(`Emitted scan event ${event} for scan ${params.scanId}`);
    } catch (error) {
      this.logger.warn(`Failed to emit scan event: ${error.message}`);
    }
  }

  /**
   * TEMPORARY: Mock OCR result for development
   * TODO: Remove when Mindee integration is complete
   */
  private mockOcrResult(): ReceiptParseResult {
    return {
      merchantName: 'Sample Merchant',
      merchantAddress: '123 Main St, Berlin',
      receiptNumber: 'REC-123456',
      date: new Date(),
      time: '14:30',
      totalAmount: 45.99,
      subtotal: 38.65,
      taxAmount: 7.34,
      currency: 'EUR',
      taxRate: 19,
      lineItems: [
        {
          description: 'Office supplies',
          quantity: 2,
          unitPrice: 15.99,
          totalPrice: 31.98,
        },
        {
          description: 'Coffee',
          quantity: 1,
          unitPrice: 6.67,
          totalPrice: 6.67,
        },
      ],
      paymentMethod: 'credit_card',
      cardLast4: '4242',
      confidence: 0.92,
      ocrProvider: 'mindee',
    };
  }
}
