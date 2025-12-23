/**
 * IMAP Controller
 * HTTP endpoints for IMAP email integration
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { ImapService } from './imap.service';
import { ImapConnectionService } from './imap-connection.service';
import { ImapSyncService } from './imap-sync.service';
import {
  TestImapConnectionDto,
  SaveImapConnectionDto,
  TriggerSyncDto,
  StartIdleDto,
  ImapConnectionStatusDto,
  ImapFolderDto,
  ImapSyncResultDto,
  ImapServerPresetDto,
  ConnectionPoolStatsDto,
} from './dto';
import { IMAP_SERVER_PRESETS } from './imap.constants';

@ApiTags('Email - IMAP')
@Controller('email/imap')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ImapController {
  private readonly logger = new Logger(ImapController.name);

  constructor(
    private readonly imapService: ImapService,
    private readonly connectionService: ImapConnectionService,
    private readonly syncService: ImapSyncService,
  ) {}

  /**
   * Test IMAP connection without saving
   */
  @Post('connect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test IMAP connection',
    description: 'Test connection to IMAP server with provided credentials',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection test result',
    type: ImapConnectionStatusDto,
  })
  async testConnection(
    @Body() dto: TestImapConnectionDto,
  ): Promise<ImapConnectionStatusDto> {
    this.logger.log(`Testing IMAP connection to ${dto.host} for ${dto.email}`);

    const config = {
      host: dto.host,
      port: dto.port,
      secure: dto.secure,
      auth: {
        user: dto.email,
        pass: dto.password,
      },
      tls: {
        rejectUnauthorized: dto.rejectUnauthorized ?? true,
      },
    };

    return await this.imapService.testConnection(config);
  }

  /**
   * Save IMAP connection configuration
   */
  @Post('save')
  @ApiOperation({
    summary: 'Save IMAP connection',
    description: 'Save IMAP connection configuration for a user',
  })
  @ApiResponse({
    status: 201,
    description: 'Connection saved successfully',
    schema: {
      properties: {
        connectionId: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  async saveConnection(
    @CurrentUser() user: any,
    @Body() dto: SaveImapConnectionDto,
  ): Promise<{ connectionId: string; message: string }> {
    this.logger.log(`Saving IMAP connection for user ${user.id}`);

    // Build server config
    let serverConfig = undefined;

    if (dto.preset) {
      // Use preset
      const preset = IMAP_SERVER_PRESETS[dto.preset.toUpperCase()];
      if (!preset) {
        throw new Error('Invalid preset');
      }
      serverConfig = {
        host: preset.host,
        port: preset.port,
        secure: preset.secure,
        auth: { user: dto.email, pass: dto.password },
      };
    } else if (dto.host && dto.port !== undefined && dto.secure !== undefined) {
      // Use custom config
      serverConfig = {
        host: dto.host,
        port: dto.port,
        secure: dto.secure,
        auth: { user: dto.email, pass: dto.password },
      };
    }

    // Test connection first
    if (serverConfig) {
      const testResult = await this.imapService.testConnection(serverConfig);
      if (!testResult.connected) {
        throw new Error(testResult.error || 'Connection test failed');
      }
    }

    // Save connection
    const connectionId = await this.connectionService.saveConnection(
      user.id,
      user.orgId,
      dto.email,
      dto.password,
      serverConfig,
    );

    return {
      connectionId,
      message: 'IMAP connection saved successfully',
    };
  }

  /**
   * Trigger email sync
   */
  @Post(':connectionId/sync')
  @ApiOperation({
    summary: 'Sync emails',
    description: 'Trigger email synchronization for a connection',
  })
  @ApiParam({ name: 'connectionId', description: 'Email connection ID' })
  @ApiResponse({
    status: 200,
    description: 'Sync result',
    type: ImapSyncResultDto,
  })
  async syncEmails(
    @CurrentUser() user: any,
    @Param('connectionId') connectionId: string,
    @Body() dto: TriggerSyncDto,
  ): Promise<ImapSyncResultDto> {
    this.logger.log(`Triggering sync for connection ${connectionId}`);

    const syncOptions: any = {
      folder: dto.folder,
      unseenOnly: dto.unseenOnly,
      includeAttachments: dto.includeAttachments,
      limit: dto.limit,
    };

    if (dto.since) {
      syncOptions.since = new Date(dto.since);
    }

    return await this.syncService.syncEmails(connectionId, syncOptions);
  }

  /**
   * Get list of folders
   */
  @Get(':connectionId/folders')
  @ApiOperation({
    summary: 'List folders',
    description: 'Get list of available email folders',
  })
  @ApiParam({ name: 'connectionId', description: 'Email connection ID' })
  @ApiResponse({
    status: 200,
    description: 'List of folders',
    type: [ImapFolderDto],
  })
  async listFolders(
    @CurrentUser() user: any,
    @Param('connectionId') connectionId: string,
  ): Promise<ImapFolderDto[]> {
    this.logger.log(`Listing folders for connection ${connectionId}`);

    const client = await this.connectionService.getConnection(connectionId);

    try {
      const folders = await this.imapService.listFolders(client);
      return folders;
    } finally {
      this.connectionService.releaseConnection(connectionId);
    }
  }

  /**
   * Start IDLE mode for real-time sync
   */
  @Post(':connectionId/idle/start')
  @ApiOperation({
    summary: 'Start IDLE mode',
    description: 'Enable real-time email synchronization using IMAP IDLE',
  })
  @ApiParam({ name: 'connectionId', description: 'Email connection ID' })
  @ApiResponse({
    status: 200,
    description: 'IDLE mode started',
  })
  async startIdle(
    @CurrentUser() user: any,
    @Param('connectionId') connectionId: string,
    @Body() dto: StartIdleDto,
  ): Promise<{ message: string }> {
    this.logger.log(`Starting IDLE mode for connection ${connectionId}`);

    await this.syncService.startIdleSync(connectionId, {
      folder: dto.folder,
    });

    return {
      message: 'IDLE mode started successfully',
    };
  }

  /**
   * Stop IDLE mode
   */
  @Post(':connectionId/idle/stop')
  @ApiOperation({
    summary: 'Stop IDLE mode',
    description: 'Disable real-time email synchronization',
  })
  @ApiParam({ name: 'connectionId', description: 'Email connection ID' })
  @ApiResponse({
    status: 200,
    description: 'IDLE mode stopped',
  })
  async stopIdle(
    @CurrentUser() user: any,
    @Param('connectionId') connectionId: string,
  ): Promise<{ message: string }> {
    this.logger.log(`Stopping IDLE mode for connection ${connectionId}`);

    await this.syncService.stopIdleSync(connectionId);

    return {
      message: 'IDLE mode stopped successfully',
    };
  }

  /**
   * Get sync status
   */
  @Get(':connectionId/status')
  @ApiOperation({
    summary: 'Get sync status',
    description: 'Get current synchronization status',
  })
  @ApiParam({ name: 'connectionId', description: 'Email connection ID' })
  @ApiResponse({
    status: 200,
    description: 'Sync status',
  })
  async getSyncStatus(
    @CurrentUser() user: any,
    @Param('connectionId') connectionId: string,
  ): Promise<any> {
    return await this.syncService.getSyncStatus(connectionId);
  }

  /**
   * Disconnect and delete connection
   */
  @Delete(':connectionId')
  @ApiOperation({
    summary: 'Delete IMAP connection',
    description: 'Disconnect and remove IMAP connection configuration',
  })
  @ApiParam({ name: 'connectionId', description: 'Email connection ID' })
  @ApiResponse({
    status: 200,
    description: 'Connection deleted',
  })
  async deleteConnection(
    @CurrentUser() user: any,
    @Param('connectionId') connectionId: string,
  ): Promise<{ message: string }> {
    this.logger.log(`Deleting connection ${connectionId}`);

    await this.connectionService.deleteConnection(connectionId);

    return {
      message: 'IMAP connection deleted successfully',
    };
  }

  /**
   * Get available server presets
   */
  @Get('presets')
  @ApiOperation({
    summary: 'Get server presets',
    description: 'Get list of pre-configured IMAP server settings',
  })
  @ApiResponse({
    status: 200,
    description: 'List of server presets',
    type: [ImapServerPresetDto],
  })
  getServerPresets(): ImapServerPresetDto[] {
    return Object.values(IMAP_SERVER_PRESETS);
  }

  /**
   * Get connection pool statistics
   */
  @Get('pool/stats')
  @ApiOperation({
    summary: 'Get pool statistics',
    description: 'Get IMAP connection pool statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Pool statistics',
    type: ConnectionPoolStatsDto,
  })
  getPoolStats(): ConnectionPoolStatsDto {
    return this.connectionService.getPoolStats();
  }

  /**
   * Test connection by ID
   */
  @Post(':connectionId/test')
  @ApiOperation({
    summary: 'Test existing connection',
    description: 'Test an existing IMAP connection',
  })
  @ApiParam({ name: 'connectionId', description: 'Email connection ID' })
  @ApiResponse({
    status: 200,
    description: 'Connection test result',
    type: ImapConnectionStatusDto,
  })
  async testExistingConnection(
    @CurrentUser() user: any,
    @Param('connectionId') connectionId: string,
  ): Promise<ImapConnectionStatusDto> {
    this.logger.log(`Testing connection ${connectionId}`);
    return await this.connectionService.testConnection(connectionId);
  }
}
