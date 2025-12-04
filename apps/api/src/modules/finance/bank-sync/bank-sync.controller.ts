import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { BankSyncService } from './bank-sync.service';
import {
  CreateConnectionParams,
  SyncConnectionParams,
  BatchSyncParams,
  SyncResult,
  BatchSyncResult,
  ConnectionHealth,
  RefreshExpiredConsentsResult,
} from './bank-sync.types';
import { BankProvider } from '@prisma/client';
import { BankImportScheduler } from './jobs';

/**
 * Bank Sync Controller
 * RESTful API endpoints for bank connection management and synchronization
 */
@Controller('organisations/:orgId/bank-connections')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
export class BankSyncController {
  constructor(
    private readonly bankSyncService: BankSyncService,
    @Inject(forwardRef(() => BankImportScheduler))
    private readonly bankImportScheduler: BankImportScheduler,
  ) {}

  /**
   * Create a new bank connection after OAuth callback
   * POST /organisations/:orgId/bank-connections
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createConnection(
    @Param('orgId') orgId: string,
    @Body() body: {
      provider: BankProvider;
      authCode: string;
      state: string;
      institutionId?: string;
      institutionName?: string;
    },
  ): Promise<{ connectionId: string; message: string }> {
    const params: CreateConnectionParams = {
      orgId,
      provider: body.provider,
      authCode: body.authCode,
      state: body.state,
      institutionId: body.institutionId,
      institutionName: body.institutionName,
    };

    const result = await this.bankSyncService.createConnection(params);

    return {
      connectionId: result.connectionId,
      message: 'Bank connection created successfully. Initial sync is in progress.',
    };
  }

  /**
   * Trigger manual sync for a specific connection (background job)
   * POST /organisations/:orgId/bank-connections/:id/sync
   */
  @Post(':id/sync')
  @HttpCode(HttpStatus.ACCEPTED)
  async syncConnection(
    @Param('orgId') orgId: string,
    @Param('id') connectionId: string,
    @Body() body?: {
      forceFullSync?: boolean;
      accountIds?: string[];
      startDate?: string;
      endDate?: string;
      triggeredBy?: string;
    },
  ): Promise<{ jobId: string; message: string }> {
    const jobId = await this.bankImportScheduler.scheduleImmediateSync(connectionId, {
      forceFullSync: body?.forceFullSync,
      accountIds: body?.accountIds,
      startDate: body?.startDate ? new Date(body.startDate) : undefined,
      endDate: body?.endDate ? new Date(body.endDate) : undefined,
      triggeredBy: body?.triggeredBy,
    });

    return {
      jobId,
      message: 'Sync job scheduled successfully. Use the job ID to track progress.',
    };
  }

  /**
   * Get sync job status
   * GET /organisations/:orgId/bank-connections/jobs/:jobId
   */
  @Get('jobs/:jobId')
  async getJobStatus(
    @Param('orgId') orgId: string,
    @Param('jobId') jobId: string,
  ): Promise<any> {
    const status = await this.bankImportScheduler.getJobStatus(jobId);

    if (!status) {
      return {
        error: 'Job not found',
        jobId,
      };
    }

    return status;
  }

  /**
   * Sync all connections for an organization
   * POST /organisations/:orgId/bank-connections/sync-all
   */
  @Post('sync-all')
  @HttpCode(HttpStatus.OK)
  async syncAllConnections(
    @Param('orgId') orgId: string,
    @Body() body?: {
      connectionIds?: string[];
      concurrency?: number;
      continueOnError?: boolean;
    },
  ): Promise<BatchSyncResult> {
    const params: BatchSyncParams = {
      orgId,
      connectionIds: body?.connectionIds,
      concurrency: body?.concurrency,
      continueOnError: body?.continueOnError,
    };

    return await this.bankSyncService.syncAllConnections(params);
  }

  /**
   * Get all bank connections for an organization
   * GET /organisations/:orgId/bank-connections
   */
  @Get()
  async getConnections(
    @Param('orgId') orgId: string,
    @Query('status') status?: string,
    @Query('provider') provider?: BankProvider,
  ) {
    // This would typically be implemented in a separate repository/service
    // For now, return a basic implementation
    return {
      message: 'List connections endpoint - to be implemented',
      orgId,
      filters: { status, provider },
    };
  }

  /**
   * Get connection health status
   * GET /organisations/:orgId/bank-connections/:id/status
   */
  @Get(':id/status')
  async getConnectionStatus(
    @Param('orgId') orgId: string,
    @Param('id') connectionId: string,
  ): Promise<ConnectionHealth> {
    return await this.bankSyncService.getConnectionStatus(connectionId);
  }

  /**
   * Get connection details with accounts
   * GET /organisations/:orgId/bank-connections/:id
   */
  @Get(':id')
  async getConnection(
    @Param('orgId') orgId: string,
    @Param('id') connectionId: string,
  ) {
    // This would fetch full connection details with accounts
    return {
      message: 'Get connection details endpoint - to be implemented',
      orgId,
      connectionId,
    };
  }

  /**
   * Disconnect a bank connection
   * DELETE /organisations/:orgId/bank-connections/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnectBank(
    @Param('orgId') orgId: string,
    @Param('id') connectionId: string,
  ): Promise<void> {
    await this.bankSyncService.disconnectBank(connectionId);
  }

  /**
   * Refresh expired consents (admin/cron endpoint)
   * POST /organisations/:orgId/bank-connections/refresh-consents
   */
  @Post('refresh-consents')
  @HttpCode(HttpStatus.OK)
  async refreshExpiredConsents(
    @Param('orgId') orgId: string,
    @Body() body?: {
      daysBeforeExpiry?: number;
      batchSize?: number;
    },
  ): Promise<RefreshExpiredConsentsResult> {
    return await this.bankSyncService.refreshExpiredConsents({
      daysBeforeExpiry: body?.daysBeforeExpiry,
      batchSize: body?.batchSize,
    });
  }

  /**
   * Get transactions for a specific account
   * GET /organisations/:orgId/bank-connections/:id/accounts/:accountId/transactions
   */
  @Get(':id/accounts/:accountId/transactions')
  async getAccountTransactions(
    @Param('orgId') orgId: string,
    @Param('id') connectionId: string,
    @Param('accountId') accountId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    // This would fetch transactions from the database
    return {
      message: 'Get account transactions endpoint - to be implemented',
      orgId,
      connectionId,
      accountId,
      filters: { startDate, endDate, limit, offset },
    };
  }

  /**
   * Get all accounts for a connection
   * GET /organisations/:orgId/bank-connections/:id/accounts
   */
  @Get(':id/accounts')
  async getConnectionAccounts(
    @Param('orgId') orgId: string,
    @Param('id') connectionId: string,
  ) {
    // This would fetch all accounts for the connection
    return {
      message: 'Get connection accounts endpoint - to be implemented',
      orgId,
      connectionId,
    };
  }

  /**
   * Get queue health and statistics (admin endpoint)
   * GET /organisations/:orgId/bank-connections/queue/health
   */
  @Get('queue/health')
  async getQueueHealth(@Param('orgId') orgId: string): Promise<any> {
    return await this.bankImportScheduler.getQueueHealth();
  }

  /**
   * Get queue statistics (admin endpoint)
   * GET /organisations/:orgId/bank-connections/queue/stats
   */
  @Get('queue/stats')
  async getQueueStats(@Param('orgId') orgId: string): Promise<any> {
    return await this.bankImportScheduler.getQueueStats();
  }
}
