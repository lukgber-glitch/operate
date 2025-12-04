import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  Logger,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GmailOAuthService } from './gmail-oauth.service';
import { GmailService } from './gmail.service';
import {
  GenerateGmailAuthUrlDto,
  GmailAuthUrlResponseDto,
  GmailCallbackQueryDto,
  GmailConnectionInfoDto,
  GmailDisconnectResponseDto,
  GmailTestConnectionResponseDto,
  ListMessagesDto,
  SearchInvoiceEmailsDto,
  GmailListMessagesResponseDto,
  GmailMessageDto,
  GmailAttachmentDto,
} from './dto';

/**
 * Gmail Integration Controller
 * Handles OAuth2 authentication and Gmail API operations
 *
 * Endpoints:
 * - POST /integrations/gmail/auth-url - Get OAuth authorization URL
 * - GET /integrations/gmail/callback - OAuth callback handler
 * - GET /integrations/gmail/status - Get connection status
 * - POST /integrations/gmail/disconnect - Disconnect Gmail
 * - GET /integrations/gmail/test - Test connection
 * - GET /integrations/gmail/messages - List messages
 * - GET /integrations/gmail/messages/:id - Get message details
 * - GET /integrations/gmail/messages/:messageId/attachments/:attachmentId - Download attachment
 * - GET /integrations/gmail/search/invoices - Search for invoice emails
 */
@ApiTags('Gmail Integration')
@Controller('integrations/gmail')
export class GmailController {
  private readonly logger = new Logger(GmailController.name);

  constructor(
    private readonly gmailOAuthService: GmailOAuthService,
    private readonly gmailService: GmailService,
  ) {}

  /**
   * Generate OAuth2 authorization URL
   */
  @Post('auth-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate Gmail OAuth2 authorization URL',
    description:
      'Creates an OAuth2 authorization URL with PKCE for connecting a Gmail account. ' +
      'User should be redirected to this URL to grant permissions.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authorization URL generated successfully',
    type: GmailAuthUrlResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to generate authorization URL',
  })
  async getAuthUrl(
    @Body() dto: GenerateGmailAuthUrlDto,
    @Req() req: any,
  ): Promise<GmailAuthUrlResponseDto> {
    this.logger.log(`Generating auth URL for user ${dto.userId}`);

    return this.gmailOAuthService.getAuthUrl(
      dto.userId,
      dto.orgId,
      dto.redirectUri,
      dto.additionalScopes,
    );
  }

  /**
   * Handle OAuth2 callback
   */
  @Get('callback')
  @ApiOperation({
    summary: 'OAuth2 callback handler',
    description:
      'Handles the OAuth2 callback from Gmail. Exchanges authorization code for tokens ' +
      'and stores encrypted tokens in the database.',
  })
  @ApiQuery({
    name: 'code',
    required: false,
    description: 'Authorization code from Gmail',
  })
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'State parameter for CSRF protection',
  })
  @ApiQuery({
    name: 'error',
    required: false,
    description: 'Error code if authorization failed',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Gmail connected successfully',
    type: GmailConnectionInfoDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid OAuth parameters or authorization failed',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired state parameter',
  })
  async handleCallback(
    @Query() query: GmailCallbackQueryDto,
  ): Promise<GmailConnectionInfoDto> {
    this.logger.log('Handling OAuth callback');
    return this.gmailOAuthService.handleCallback(query);
  }

  /**
   * Get connection status
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get Gmail connection status',
    description:
      'Retrieves the current Gmail connection status for the authenticated user. ' +
      'Returns null if no connection exists.',
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'User ID to check connection status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Connection status retrieved successfully',
    type: GmailConnectionInfoDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getStatus(
    @Query('userId') userId: string,
  ): Promise<GmailConnectionInfoDto | null> {
    this.logger.log(`Getting connection status for user ${userId}`);
    return this.gmailOAuthService.getConnectionStatus(userId);
  }

  /**
   * Disconnect Gmail
   */
  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Disconnect Gmail account',
    description:
      'Revokes Gmail access tokens and removes the connection from the database. ' +
      'User will need to re-authorize to reconnect.',
  })
  @ApiQuery({
    name: 'connectionId',
    required: true,
    description: 'Connection ID to disconnect',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Gmail disconnected successfully',
    type: GmailDisconnectResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Connection not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async disconnect(
    @Query('connectionId') connectionId: string,
  ): Promise<GmailDisconnectResponseDto> {
    this.logger.log(`Disconnecting Gmail connection ${connectionId}`);
    return this.gmailOAuthService.revokeAccess(connectionId);
  }

  /**
   * Test Gmail connection
   */
  @Get('test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Test Gmail connection',
    description:
      'Tests the Gmail connection by attempting to list recent emails. ' +
      'Returns connection details and message count if successful.',
  })
  @ApiQuery({
    name: 'connectionId',
    required: true,
    description: 'Connection ID to test',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Connection test completed',
    type: GmailTestConnectionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Connection not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async testConnection(
    @Query('connectionId') connectionId: string,
  ): Promise<GmailTestConnectionResponseDto> {
    this.logger.log(`Testing Gmail connection ${connectionId}`);
    return this.gmailService.testConnection(connectionId);
  }

  /**
   * List messages
   */
  @Get('messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List Gmail messages',
    description:
      'Lists Gmail messages with optional query filter. ' +
      'Supports Gmail search syntax for advanced filtering.',
  })
  @ApiQuery({
    name: 'connectionId',
    required: true,
    description: 'Connection ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Messages retrieved successfully',
    type: GmailListMessagesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async listMessages(
    @Query('connectionId') connectionId: string,
    @Query() dto: ListMessagesDto,
  ): Promise<GmailListMessagesResponseDto> {
    this.logger.log(`Listing messages for connection ${connectionId}`);

    const result = await this.gmailService.listMessages(connectionId, {
      query: dto.query,
      maxResults: dto.maxResults,
      pageToken: dto.pageToken,
      labelIds: dto.labelIds,
      includeSpamTrash: dto.includeSpamTrash,
    });

    // Get full message details
    const messages: GmailMessageDto[] = [];
    if (result.messages && result.messages.length > 0) {
      for (const msg of result.messages) {
        const fullMessage = await this.gmailService.getMessage(
          connectionId,
          msg.id,
        );
        messages.push(fullMessage as GmailMessageDto);
      }
    }

    return {
      messages,
      nextPageToken: result.nextPageToken,
      resultSizeEstimate: result.resultSizeEstimate,
    };
  }

  /**
   * Get message details
   */
  @Get('messages/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get Gmail message details',
    description:
      'Retrieves full message details including headers, body, and attachment metadata.',
  })
  @ApiQuery({
    name: 'connectionId',
    required: true,
    description: 'Connection ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message retrieved successfully',
    type: GmailMessageDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Message not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getMessage(
    @Param('id') messageId: string,
    @Query('connectionId') connectionId: string,
  ): Promise<GmailMessageDto> {
    this.logger.log(`Getting message ${messageId} for connection ${connectionId}`);
    return this.gmailService.getMessage(connectionId, messageId) as Promise<GmailMessageDto>;
  }

  /**
   * Download attachment
   */
  @Get('messages/:messageId/attachments/:attachmentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Download Gmail attachment',
    description:
      'Downloads an attachment from a Gmail message. ' +
      'Returns base64url encoded attachment data.',
  })
  @ApiQuery({
    name: 'connectionId',
    required: true,
    description: 'Connection ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attachment downloaded successfully',
    type: GmailAttachmentDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Message or attachment not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getAttachment(
    @Param('messageId') messageId: string,
    @Param('attachmentId') attachmentId: string,
    @Query('connectionId') connectionId: string,
  ): Promise<GmailAttachmentDto> {
    this.logger.log(
      `Getting attachment ${attachmentId} from message ${messageId} for connection ${connectionId}`,
    );
    return this.gmailService.getAttachment(
      connectionId,
      messageId,
      attachmentId,
    ) as Promise<GmailAttachmentDto>;
  }

  /**
   * Search for invoice emails
   */
  @Get('search/invoices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Search for invoice emails',
    description:
      'Searches for emails likely to contain invoices or receipts. ' +
      'Uses predefined patterns to identify relevant emails with attachments.',
  })
  @ApiQuery({
    name: 'connectionId',
    required: true,
    description: 'Connection ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice emails retrieved successfully',
    type: GmailListMessagesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async searchInvoices(
    @Query('connectionId') connectionId: string,
    @Query() dto: SearchInvoiceEmailsDto,
  ): Promise<GmailListMessagesResponseDto> {
    this.logger.log(`Searching for invoice emails for connection ${connectionId}`);

    const result = await this.gmailService.searchInvoiceEmails(connectionId, {
      since: dto.since,
      until: dto.until,
      from: dto.from,
      hasAttachment: dto.hasAttachment,
      maxResults: dto.maxResults,
    });

    return {
      messages: result.messages as GmailMessageDto[],
      nextPageToken: result.nextPageToken,
      resultSizeEstimate: result.totalResults,
    };
  }
}
