import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EmailSyncService } from './email-sync.service';
import {
  TriggerSyncDto,
  SyncStatusDto,
  ListSyncedEmailsDto,
  SyncStatisticsDto,
  CancelSyncDto,
  RetryFailedEmailsDto,
  SyncedEmailDetailDto,
} from './dto/email-sync.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { EmailSyncJobEntity } from './entities/synced-email.entity';
import { PrismaService } from '../../database/prisma.service';

/**
 * Email Sync Controller
 * RESTful API endpoints for email synchronization operations
 *
 * Endpoints:
 * POST   /sync/trigger          - Trigger a sync operation
 * GET    /sync/status/:jobId    - Get sync job status
 * POST   /sync/cancel           - Cancel a running sync
 * GET    /sync/jobs/:connectionId - List sync jobs for a connection
 * GET    /emails                - List synced emails
 * GET    /emails/:id            - Get single email details
 * GET    /stats/:connectionId   - Get sync statistics
 * POST   /retry                 - Retry failed emails
 * GET    /extractions           - Get email invoice extractions for review
 */
@ApiTags('Email Sync')
@ApiBearerAuth()
@Controller('integrations/email-sync')
@UseGuards(JwtAuthGuard)
export class EmailSyncController {
  private readonly logger = new Logger(EmailSyncController.name);

  constructor(
    private readonly emailSyncService: EmailSyncService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Trigger an email sync operation
   */
  @Post('sync/trigger')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Trigger email sync',
    description:
      'Initiates a sync operation for the specified email connection. ' +
      'Creates a background job that fetches emails from the provider.',
  })
  @ApiResponse({
    status: 202,
    description: 'Sync job created and queued for processing',
    type: EmailSyncJobEntity,
  })
  @ApiResponse({ status: 400, description: 'Invalid request or sync disabled' })
  @ApiResponse({ status: 404, description: 'Email connection not found' })
  async triggerSync(
    @Body() dto: TriggerSyncDto,
  ): Promise<EmailSyncJobEntity> {
    return this.emailSyncService.triggerSync(dto);
  }

  /**
   * Get sync job status
   */
  @Get('sync/status/:jobId')
  @ApiOperation({
    summary: 'Get sync job status',
    description: 'Retrieves the current status and progress of a sync job',
  })
  @ApiParam({ name: 'jobId', description: 'Sync job ID' })
  @ApiResponse({
    status: 200,
    description: 'Sync job status retrieved',
    type: SyncStatusDto,
  })
  @ApiResponse({ status: 404, description: 'Sync job not found' })
  async getSyncStatus(@Param('jobId') jobId: string): Promise<SyncStatusDto> {
    return this.emailSyncService.getSyncStatus(jobId);
  }

  /**
   * List sync jobs for a connection
   */
  @Get('sync/jobs/:connectionId')
  @ApiOperation({
    summary: 'List sync jobs',
    description: 'Lists recent sync jobs for an email connection',
  })
  @ApiParam({ name: 'connectionId', description: 'Email connection ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of jobs to return',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Sync jobs retrieved',
    type: [EmailSyncJobEntity],
  })
  async listSyncJobs(
    @Param('connectionId') connectionId: string,
    @Query('limit') limit?: number,
  ): Promise<EmailSyncJobEntity[]> {
    return this.emailSyncService.listSyncJobs(connectionId, limit);
  }

  /**
   * Cancel a running sync job
   */
  @Post('sync/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel sync job',
    description: 'Cancels a running or pending sync job',
  })
  @ApiResponse({ status: 200, description: 'Sync job cancelled successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel job in current state',
  })
  @ApiResponse({ status: 404, description: 'Sync job not found' })
  async cancelSync(@Body() dto: CancelSyncDto): Promise<{ message: string }> {
    await this.emailSyncService.cancelSync(dto.jobId, dto.reason);
    return { message: 'Sync job cancelled successfully' };
  }

  /**
   * List synced emails
   */
  @Get('emails')
  @ApiOperation({
    summary: 'List synced emails',
    description:
      'Lists synced emails for a connection with filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Synced emails retrieved',
    schema: {
      type: 'object',
      properties: {
        emails: { type: 'array', items: { $ref: '#/components/schemas/SyncedEmailDetailDto' } },
        total: { type: 'number' },
        page: { type: 'number' },
      },
    },
  })
  async listSyncedEmails(
    @Query() dto: ListSyncedEmailsDto,
  ): Promise<{ emails: SyncedEmailDetailDto[]; total: number; page: number }> {
    return this.emailSyncService.listSyncedEmails(dto);
  }

  /**
   * Get single synced email
   */
  @Get('emails/:id')
  @ApiOperation({
    summary: 'Get synced email details',
    description: 'Retrieves detailed information about a synced email',
  })
  @ApiParam({ name: 'id', description: 'Synced email ID' })
  @ApiResponse({
    status: 200,
    description: 'Email details retrieved',
    type: SyncedEmailDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Email not found' })
  async getSyncedEmail(
    @Param('id') id: string,
  ): Promise<SyncedEmailDetailDto> {
    return this.emailSyncService.getSyncedEmail(id);
  }

  /**
   * Get sync statistics
   */
  @Get('stats/:connectionId')
  @ApiOperation({
    summary: 'Get sync statistics',
    description:
      'Retrieves comprehensive statistics for an email connection sync history',
  })
  @ApiParam({ name: 'connectionId', description: 'Email connection ID' })
  @ApiResponse({
    status: 200,
    description: 'Sync statistics retrieved',
    type: SyncStatisticsDto,
  })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  async getSyncStatistics(
    @Param('connectionId') connectionId: string,
  ): Promise<SyncStatisticsDto> {
    return this.emailSyncService.getSyncStatistics(connectionId);
  }

  /**
   * Retry failed emails
   */
  @Post('retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retry failed emails',
    description:
      'Queues failed emails for reprocessing. Useful when processing errors were temporary.',
  })
  @ApiResponse({
    status: 200,
    description: 'Failed emails queued for retry',
    schema: {
      type: 'object',
      properties: {
        queued: { type: 'number', description: 'Number of emails queued' },
      },
    },
  })
  async retryFailedEmails(
    @Body() dto: RetryFailedEmailsDto,
  ): Promise<{ queued: number }> {
    return this.emailSyncService.retryFailedEmails(dto);
  }

  /**
   * Get extracted invoice data from emails for review
   * Returns emails with invoice attachments that have been extracted and need review
   */
  @Get('extractions')
  @ApiOperation({
    summary: 'Get email invoice extractions',
    description:
      'Returns extracted invoice data from emails that need review. ' +
      'Useful for displaying pending invoice extractions in the UI.',
  })
  @ApiQuery({
    name: 'reviewStatus',
    required: false,
    description: 'Filter by review status',
    enum: ['PENDING_REVIEW', 'APPROVED', 'REJECTED'],
    example: 'PENDING_REVIEW',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of extractions to return',
    example: 10,
    type: Number,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of extractions to skip',
    example: 0,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Email extractions retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getExtractions(
    @Query('reviewStatus') reviewStatus?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
    @CurrentUser() user?: any,
  ): Promise<{
    data: Array<{
      id: string;
      emailSubject: string;
      emailFrom: string;
      extractedAt: Date;
      reviewStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
      extractedData: {
        vendorName?: string;
        invoiceNumber?: string;
        amount?: number;
        currency?: string;
        dueDate?: string;
        confidence: number;
      };
    }>;
    total: number;
    limit: number;
    offset: number;
  }> {
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    this.logger.log(
      `Fetching email extractions for org ${user?.orgId} - reviewStatus: ${reviewStatus}, limit: ${limit}, offset: ${offset}`,
    );

    try {
      const where: any = {
        organisationId: user?.orgId,
      };

      const total = await this.prisma.extractedInvoice.count({ where });

      const extractions = await this.prisma.extractedInvoice.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const data = await Promise.all(
        extractions.map(async (extraction) => {
          const attachment = await this.prisma.emailAttachment.findFirst({
            where: {
              extractedDataId: extraction.id,
            },
            include: {
              email: true,
            },
          });

          const extractedData = extraction.extractedData as any;

          return {
            id: extraction.id,
            emailSubject: attachment?.email?.subject || 'Unknown',
            emailFrom: attachment?.email?.from || 'Unknown',
            extractedAt: extraction.createdAt,
            reviewStatus: 'PENDING_REVIEW',
            extractedData: {
              vendorName: extractedData?.vendorName,
              invoiceNumber: extractedData?.invoiceNumber,
              amount: extractedData?.totalAmount,
              currency: extractedData?.currency || 'USD',
              dueDate: extractedData?.dueDate,
              confidence: extraction.overallConfidence,
            },
          };
        }),
      );

      return {
        data,
        total,
        limit,
        offset,
      };
    } catch (error) {
      this.logger.error('Failed to fetch email extractions', error);
      return {
        data: [],
        total: 0,
        limit,
        offset,
      };
    }
  }

}
