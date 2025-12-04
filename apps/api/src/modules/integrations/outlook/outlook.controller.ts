import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { OutlookOAuthService } from './outlook-oauth.service';
import { OutlookService } from './outlook.service';
import {
  OutlookAuthUrlRequestDto,
  OutlookAuthUrlResponseDto,
  OutlookCallbackDto,
  OutlookConnectionStatusDto,
  OutlookDisconnectDto,
  OutlookTestConnectionDto,
  ListMessagesDto,
  GetMessageDto,
  GetAttachmentsDto,
  DownloadAttachmentDto,
  SearchInvoiceEmailsDto,
  MoveToFolderDto,
  CreateFolderDto,
  EmailMessageDto,
  AttachmentDto,
} from './dto';

/**
 * Outlook Integration Controller
 * Handles OAuth2 authorization flow and email operations for Microsoft Outlook/Office 365
 *
 * Endpoints:
 * - GET /integrations/outlook/auth-url - Generate OAuth authorization URL
 * - GET /integrations/outlook/callback - Handle OAuth callback
 * - GET /integrations/outlook/status - Get connection status
 * - POST /integrations/outlook/disconnect - Disconnect Outlook
 * - GET /integrations/outlook/test - Test connection
 * - GET /integrations/outlook/messages - List messages
 * - GET /integrations/outlook/messages/:messageId - Get single message
 * - GET /integrations/outlook/messages/:messageId/attachments - Get attachments
 * - GET /integrations/outlook/attachments/:attachmentId/download - Download attachment
 * - GET /integrations/outlook/search/invoices - Search invoice emails
 * - POST /integrations/outlook/folders - Create folder
 * - POST /integrations/outlook/messages/:messageId/move - Move message to folder
 */
@ApiTags('Outlook Integration')
@Controller('integrations/outlook')
export class OutlookController {
  private readonly logger = new Logger(OutlookController.name);

  constructor(
    private readonly oauthService: OutlookOAuthService,
    private readonly outlookService: OutlookService,
  ) {}

  /**
   * Generate Outlook OAuth2 authorization URL
   */
  @Get('auth-url')
  @ApiOperation({
    summary: 'Generate Outlook authorization URL',
    description:
      'Generates an OAuth2 authorization URL with PKCE for connecting to Outlook/Office 365. ' +
      'Users should be redirected to this URL to authorize the application.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authorization URL generated successfully',
    type: OutlookAuthUrlResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to generate authorization URL',
  })
  @ApiQuery({ name: 'userId', type: String, description: 'User ID' })
  @ApiQuery({ name: 'orgId', type: String, description: 'Organization ID' })
  @ApiQuery({
    name: 'redirectUri',
    type: String,
    required: false,
    description: 'Custom redirect URI (optional)',
  })
  async getAuthUrl(
    @Query('userId') userId: string,
    @Query('orgId') orgId: string,
    @Query('redirectUri') redirectUri?: string,
  ): Promise<OutlookAuthUrlResponseDto> {
    this.logger.log(`Generating auth URL for user: ${userId}`);
    return await this.oauthService.getAuthUrl(userId, orgId, redirectUri);
  }

  /**
   * Handle OAuth callback from Microsoft
   */
  @Get('callback')
  @ApiOperation({
    summary: 'Handle Outlook OAuth callback',
    description:
      'Handles the OAuth callback from Microsoft, exchanges the authorization code for tokens, ' +
      'and stores the encrypted tokens in the database.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend success/error page',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid callback parameters',
  })
  async handleCallback(
    @Query() query: OutlookCallbackDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log('Handling Outlook callback');

      const connection = await this.oauthService.handleCallback(query);

      // Redirect to frontend success page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const successUrl = `${frontendUrl}/settings/integrations/outlook?status=connected&email=${encodeURIComponent(connection.email)}`;

      res.redirect(successUrl);
    } catch (error) {
      this.logger.error('Outlook callback error', error);

      // Redirect to frontend error page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const errorUrl = `${frontendUrl}/settings/integrations/outlook?status=error&message=${encodeURIComponent(error.message)}`;

      res.redirect(errorUrl);
    }
  }

  /**
   * Get Outlook connection status
   */
  @Get('status')
  @ApiOperation({
    summary: 'Get Outlook connection status',
    description:
      'Retrieves the current Outlook connection status, including token expiry and sync information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection status retrieved successfully',
    type: OutlookConnectionStatusDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No Outlook connection found',
  })
  @ApiQuery({ name: 'userId', type: String, description: 'User ID' })
  @ApiQuery({ name: 'orgId', type: String, description: 'Organization ID' })
  async getConnectionStatus(
    @Query('userId') userId: string,
    @Query('orgId') orgId: string,
  ): Promise<OutlookConnectionStatusDto | { connected: false }> {
    try {
      const connection = await this.oauthService.getAccessToken(userId, orgId);
      if (!connection) {
        return { connected: false };
      }

      // Get connection details
      const connectionRecord = await this.oauthService['prisma'].emailConnection.findFirst({
        where: {
          userId,
          orgId,
          provider: 'OUTLOOK',
        },
      });

      if (!connectionRecord) {
        return { connected: false };
      }

      return this.oauthService['mapConnectionToDto'](connectionRecord);
    } catch (error) {
      this.logger.error(
        `Failed to get connection status for user ${userId}`,
        error,
      );
      return { connected: false };
    }
  }

  /**
   * Disconnect Outlook
   */
  @Post('disconnect')
  @ApiOperation({
    summary: 'Disconnect Outlook',
    description:
      'Disconnects the Outlook integration by deleting the connection and tokens. ' +
      'Users will need to reconnect to use Outlook features again.',
  })
  @ApiResponse({
    status: 200,
    description: 'Outlook disconnected successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No active Outlook connection found',
  })
  async disconnect(@Body() dto: OutlookDisconnectDto): Promise<{
    success: boolean;
    message: string;
  }> {
    this.logger.log(`Disconnecting Outlook for user: ${dto.userId}`);
    await this.oauthService.revokeAccess(dto.userId, dto.orgId);
    return {
      success: true,
      message: 'Outlook disconnected successfully',
    };
  }

  /**
   * Test Outlook connection
   */
  @Get('test')
  @ApiOperation({
    summary: 'Test Outlook connection',
    description:
      'Tests the Outlook connection by fetching user profile and mailbox statistics.',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection test completed',
    type: OutlookTestConnectionDto,
  })
  @ApiQuery({ name: 'userId', type: String, description: 'User ID' })
  @ApiQuery({ name: 'orgId', type: String, description: 'Organization ID' })
  async testConnection(
    @Query('userId') userId: string,
    @Query('orgId') orgId: string,
  ): Promise<OutlookTestConnectionDto> {
    try {
      const accessToken = await this.oauthService.getAccessToken(
        userId,
        orgId,
      );

      // Test by listing messages
      const messages = await this.outlookService.listMessages({
        userId,
        orgId,
        maxResults: 1,
      });

      return {
        success: true,
        message: 'Successfully connected to Outlook.',
        stats: {
          totalMessages: messages.count,
          unreadMessages: 0, // Would need additional query
        },
      };
    } catch (error) {
      this.logger.error('Connection test failed', error);
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
      };
    }
  }

  /**
   * List messages
   */
  @Get('messages')
  @ApiOperation({
    summary: 'List messages',
    description: 'Retrieves messages from Outlook inbox with optional filtering.',
  })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
  })
  async listMessages(@Query() dto: ListMessagesDto) {
    this.logger.log(`Listing messages for user: ${dto.userId}`);
    return await this.outlookService.listMessages(dto);
  }

  /**
   * Get a single message
   */
  @Get('messages/:messageId')
  @ApiOperation({
    summary: 'Get message',
    description: 'Retrieves a single message by ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Message retrieved successfully',
    type: EmailMessageDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
  })
  async getMessage(
    @Query('userId') userId: string,
    @Query('orgId') orgId: string,
    @Query('messageId') messageId: string,
  ): Promise<EmailMessageDto> {
    this.logger.log(`Getting message ${messageId} for user: ${userId}`);
    return await this.outlookService.getMessage({
      userId,
      orgId,
      messageId,
    });
  }

  /**
   * Get attachments for a message
   */
  @Get('messages/:messageId/attachments')
  @ApiOperation({
    summary: 'Get message attachments',
    description: 'Retrieves all attachments for a message.',
  })
  @ApiResponse({
    status: 200,
    description: 'Attachments retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
  })
  async getAttachments(
    @Query('userId') userId: string,
    @Query('orgId') orgId: string,
    @Query('messageId') messageId: string,
  ) {
    this.logger.log(
      `Getting attachments for message ${messageId}, user: ${userId}`,
    );
    return await this.outlookService.getAttachments({
      userId,
      orgId,
      messageId,
    });
  }

  /**
   * Download an attachment
   */
  @Get('attachments/:attachmentId/download')
  @ApiOperation({
    summary: 'Download attachment',
    description: 'Downloads a specific attachment (returns base64 encoded content).',
  })
  @ApiResponse({
    status: 200,
    description: 'Attachment downloaded successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Attachment not found',
  })
  async downloadAttachment(
    @Query('userId') userId: string,
    @Query('orgId') orgId: string,
    @Query('messageId') messageId: string,
    @Query('attachmentId') attachmentId: string,
  ) {
    this.logger.log(`Downloading attachment ${attachmentId} for user: ${userId}`);
    return await this.outlookService.downloadAttachment({
      userId,
      orgId,
      messageId,
      attachmentId,
    });
  }

  /**
   * Search for invoice emails
   */
  @Get('search/invoices')
  @ApiOperation({
    summary: 'Search invoice emails',
    description:
      'Searches for emails that likely contain invoices or receipts based on keywords and attachments.',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice emails found',
  })
  async searchInvoiceEmails(@Query() dto: SearchInvoiceEmailsDto) {
    this.logger.log(`Searching invoice emails for user: ${dto.userId}`);
    return await this.outlookService.searchInvoiceEmails(dto);
  }

  /**
   * Create a mail folder
   */
  @Post('folders')
  @ApiOperation({
    summary: 'Create mail folder',
    description: 'Creates a new mail folder in Outlook.',
  })
  @ApiResponse({
    status: 201,
    description: 'Folder created successfully',
  })
  async createFolder(@Body() dto: CreateFolderDto) {
    this.logger.log(`Creating folder "${dto.name}" for user: ${dto.userId}`);
    return await this.outlookService.createFolder(dto);
  }

  /**
   * Move message to folder
   */
  @Post('messages/:messageId/move')
  @ApiOperation({
    summary: 'Move message to folder',
    description: 'Moves a message to a specified folder.',
  })
  @ApiResponse({
    status: 200,
    description: 'Message moved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Message or folder not found',
  })
  async moveToFolder(@Body() dto: MoveToFolderDto) {
    this.logger.log(
      `Moving message ${dto.messageId} to folder ${dto.folderId} for user: ${dto.userId}`,
    );
    return await this.outlookService.moveToFolder(dto);
  }
}
