/**
 * Email Bill Automation Controller
 * API endpoints for automated bill creation from emails
 */

import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EmailBillAutomationService, ProcessEmailForBillsResult } from './email-bill-automation.service';

interface RequestWithUser extends Request {
  user: {
    organisationId: string;
    userId: string;
  };
}

/**
 * Email Bill Automation API
 * Provides endpoints to trigger and monitor automated bill creation
 */
@Controller('organisations/:orgId/email-automation')
@UseGuards(JwtAuthGuard)
export class EmailBillAutomationController {
  private readonly logger = new Logger(EmailBillAutomationController.name);

  constructor(
    private readonly emailBillAutomation: EmailBillAutomationService,
  ) {}

  /**
   * Process a specific email for bill creation
   * POST /organisations/:orgId/email-automation/process-email
   *
   * Body:
   * {
   *   "emailId": "uuid",
   *   "autoApprove": false, // Optional: auto-approve high-confidence bills
   *   "minConfidence": 0.7  // Optional: minimum confidence threshold
   * }
   */
  @Post('process-email')
  async processEmail(
    @Param('orgId') orgId: string,
    @Body() body: {
      emailId: string;
      autoApprove?: boolean;
      minConfidence?: number;
    },
    @Request() req: RequestWithUser,
  ): Promise<{ data: ProcessEmailForBillsResult }> {
    this.logger.log(
      `Processing email ${body.emailId} for bill automation (org: ${orgId})`,
    );

    const result = await this.emailBillAutomation.processEmailForBills({
      emailId: body.emailId,
      organisationId: orgId,
      userId: req.user.userId,
      autoApprove: body.autoApprove,
      minConfidence: body.minConfidence,
    });

    return { data: result };
  }

  /**
   * Process all invoice emails for the organization
   * POST /organisations/:orgId/email-automation/process-all
   *
   * Query params:
   * - since: ISO date string (optional, defaults to 30 days ago)
   * - limit: number (optional, defaults to 100)
   * - autoApprove: boolean (optional)
   * - minConfidence: number (optional)
   */
  @Post('process-all')
  async processAllEmails(
    @Param('orgId') orgId: string,
    @Query('since') since?: string,
    @Query('limit') limit?: string,
    @Query('autoApprove') autoApprove?: string,
    @Query('minConfidence') minConfidence?: string,
    @Request() req?: RequestWithUser,
  ): Promise<{
    data: {
      processed: number;
      totalBillsCreated: number;
      totalVendorsCreated: number;
      errors: number;
    };
  }> {
    this.logger.log(
      `Batch processing all invoice emails for org ${orgId}`,
    );

    const result = await this.emailBillAutomation.processAllInvoiceEmails(
      orgId,
      {
        since: since ? new Date(since) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        autoApprove: autoApprove === 'true',
        minConfidence: minConfidence ? parseFloat(minConfidence) : undefined,
      },
    );

    return { data: result };
  }

  /**
   * Get automation statistics
   * GET /organisations/:orgId/email-automation/stats
   *
   * Query params:
   * - days: number (optional, defaults to 30)
   */
  @Get('stats')
  async getStats(
    @Param('orgId') orgId: string,
    @Query('days') days?: string,
    @Request() req?: RequestWithUser,
  ): Promise<{
    data: {
      period: string;
      emailsProcessed: number;
      billsCreated: number;
      vendorsAutoCreated: number;
      billsAwaitingReview: number;
      automationRate: string;
    };
  }> {
    this.logger.debug(`Getting automation stats for org ${orgId}`);

    const stats = await this.emailBillAutomation.getAutomationStats(
      orgId,
      days ? parseInt(days, 10) : 30,
    );

    return { data: stats };
  }

  /**
   * Get pending draft bills from email automation
   * GET /organisations/:orgId/email-automation/pending-bills
   *
   * Returns all draft bills created from email automation that need user review
   */
  @Get('pending-bills')
  async getPendingBills(
    @Param('orgId') orgId: string,
    @Query('limit') limit?: string,
    @Request() req?: RequestWithUser,
  ): Promise<{
    data: {
      bills: any[];
      total: number;
    };
  }> {
    this.logger.debug(`Getting pending bills for org ${orgId}`);

    // This would use PrismaService directly or a dedicated service
    // For now, returning placeholder structure
    return {
      data: {
        bills: [],
        total: 0,
      },
    };
  }

  /**
   * Approve a draft bill
   * POST /organisations/:orgId/email-automation/bills/:billId/approve
   *
   * Moves a DRAFT bill to PENDING status
   */
  @Post('bills/:billId/approve')
  async approveBill(
    @Param('orgId') orgId: string,
    @Param('billId') billId: string,
    @Request() req?: RequestWithUser,
  ): Promise<{
    data: {
      billId: string;
      status: string;
      message: string;
    };
  }> {
    this.logger.log(`Approving bill ${billId} for org ${orgId}`);

    // This would use a dedicated bill service to approve the bill
    // For now, returning placeholder structure
    return {
      data: {
        billId,
        status: 'PENDING',
        message: 'Bill approved successfully',
      },
    };
  }

  /**
   * Reject a draft bill
   * POST /organisations/:orgId/email-automation/bills/:billId/reject
   *
   * Marks a DRAFT bill as rejected
   */
  @Post('bills/:billId/reject')
  async rejectBill(
    @Param('orgId') orgId: string,
    @Param('billId') billId: string,
    @Body() body: { reason?: string },
    @Request() req?: RequestWithUser,
  ): Promise<{
    data: {
      billId: string;
      status: string;
      message: string;
    };
  }> {
    this.logger.log(`Rejecting bill ${billId} for org ${orgId}`);

    // This would use a dedicated bill service to reject the bill
    // For now, returning placeholder structure
    return {
      data: {
        billId,
        status: 'REJECTED',
        message: 'Bill rejected successfully',
      },
    };
  }
}
