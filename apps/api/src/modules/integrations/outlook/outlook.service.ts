import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import axios, { AxiosInstance } from 'axios';
import {
  GRAPH_API_BASE_URL,
  OUTLOOK_QUERY_DEFAULTS,
  INVOICE_SEARCH_KEYWORDS,
  OUTLOOK_FOLDERS,
  GRAPH_ERROR_CODES,
  OUTLOOK_RETRY_CONFIG,
} from './outlook.constants';
import { OutlookOAuthService } from './outlook-oauth.service';
import {
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
 * Outlook Service
 * Handles Microsoft Graph API operations for reading emails and attachments
 */
@Injectable()
export class OutlookService {
  private readonly logger = new Logger(OutlookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly oauthService: OutlookOAuthService,
  ) {}

  /**
   * List messages from Outlook inbox
   */
  async listMessages(dto: ListMessagesDto): Promise<{
    messages: EmailMessageDto[];
    nextLink?: string;
    count: number;
  }> {
    try {
      const accessToken = await this.oauthService.getAccessToken(
        dto.userId,
        dto.orgId,
      );

      // Build OData query
      const params: any = {
        $select: OUTLOOK_QUERY_DEFAULTS.defaultSelect,
        $top: dto.maxResults || OUTLOOK_QUERY_DEFAULTS.maxResults,
        $orderby: dto.orderBy || 'receivedDateTime desc',
      };

      if (dto.filter) {
        params.$filter = dto.filter;
      }

      if (dto.search) {
        params.$search = `"${dto.search}"`;
      }

      if (dto.skip) {
        params.$skip = dto.skip;
      }

      const response = await this.graphRequest(
        accessToken,
        '/me/messages',
        'GET',
        params,
      );

      await this.createAuditLog(dto.userId, dto.orgId, {
        action: 'EMAIL_READ',
        endpoint: '/me/messages',
        statusCode: 200,
        success: true,
      });

      return {
        messages: response.value || [],
        nextLink: response['@odata.nextLink'],
        count: response.value?.length || 0,
      };
    } catch (error) {
      this.logger.error('Failed to list messages', error);
      await this.createAuditLog(dto.userId, dto.orgId, {
        action: 'EMAIL_READ',
        endpoint: '/me/messages',
        statusCode: error.response?.status,
        success: false,
        errorMessage: error.message,
      });
      throw new InternalServerErrorException('Failed to list messages');
    }
  }

  /**
   * Get a single message by ID
   */
  async getMessage(dto: GetMessageDto): Promise<EmailMessageDto> {
    try {
      const accessToken = await this.oauthService.getAccessToken(
        dto.userId,
        dto.orgId,
      );

      const response = await this.graphRequest(
        accessToken,
        `/me/messages/${dto.messageId}`,
        'GET',
      );

      await this.createAuditLog(dto.userId, dto.orgId, {
        action: 'EMAIL_READ',
        endpoint: `/me/messages/${dto.messageId}`,
        statusCode: 200,
        success: true,
      });

      return response;
    } catch (error) {
      this.logger.error(`Failed to get message ${dto.messageId}`, error);
      await this.createAuditLog(dto.userId, dto.orgId, {
        action: 'EMAIL_READ',
        endpoint: `/me/messages/${dto.messageId}`,
        statusCode: error.response?.status,
        success: false,
        errorMessage: error.message,
      });

      if (error.response?.status === 404) {
        throw new NotFoundException('Message not found');
      }

      throw new InternalServerErrorException('Failed to get message');
    }
  }

  /**
   * Get attachments for a message
   */
  async getAttachments(dto: GetAttachmentsDto): Promise<{
    attachments: AttachmentDto[];
    count: number;
  }> {
    try {
      const accessToken = await this.oauthService.getAccessToken(
        dto.userId,
        dto.orgId,
      );

      const response = await this.graphRequest(
        accessToken,
        `/me/messages/${dto.messageId}/attachments`,
        'GET',
        {
          $select: 'id,name,contentType,size,isInline',
        },
      );

      await this.createAuditLog(dto.userId, dto.orgId, {
        action: 'ATTACHMENT_DOWNLOAD',
        endpoint: `/me/messages/${dto.messageId}/attachments`,
        statusCode: 200,
        success: true,
      });

      return {
        attachments: response.value || [],
        count: response.value?.length || 0,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get attachments for message ${dto.messageId}`,
        error,
      );
      await this.createAuditLog(dto.userId, dto.orgId, {
        action: 'ATTACHMENT_DOWNLOAD',
        endpoint: `/me/messages/${dto.messageId}/attachments`,
        statusCode: error.response?.status,
        success: false,
        errorMessage: error.message,
      });

      if (error.response?.status === 404) {
        throw new NotFoundException('Message not found');
      }

      throw new InternalServerErrorException('Failed to get attachments');
    }
  }

  /**
   * Download an attachment
   */
  async downloadAttachment(dto: DownloadAttachmentDto): Promise<{
    name: string;
    contentType: string;
    contentBytes: string;
    size: number;
  }> {
    try {
      const accessToken = await this.oauthService.getAccessToken(
        dto.userId,
        dto.orgId,
      );

      const response = await this.graphRequest(
        accessToken,
        `/me/messages/${dto.messageId}/attachments/${dto.attachmentId}`,
        'GET',
      );

      await this.createAuditLog(dto.userId, dto.orgId, {
        action: 'ATTACHMENT_DOWNLOAD',
        endpoint: `/me/messages/${dto.messageId}/attachments/${dto.attachmentId}`,
        statusCode: 200,
        success: true,
      });

      return {
        name: response.name,
        contentType: response.contentType,
        contentBytes: response.contentBytes, // Base64 encoded
        size: response.size,
      };
    } catch (error) {
      this.logger.error(
        `Failed to download attachment ${dto.attachmentId}`,
        error,
      );
      await this.createAuditLog(dto.userId, dto.orgId, {
        action: 'ATTACHMENT_DOWNLOAD',
        endpoint: `/me/messages/${dto.messageId}/attachments/${dto.attachmentId}`,
        statusCode: error.response?.status,
        success: false,
        errorMessage: error.message,
      });

      if (error.response?.status === 404) {
        throw new NotFoundException('Attachment not found');
      }

      throw new InternalServerErrorException('Failed to download attachment');
    }
  }

  /**
   * Search for invoice/receipt emails
   */
  async searchInvoiceEmails(dto: SearchInvoiceEmailsDto): Promise<{
    messages: EmailMessageDto[];
    count: number;
  }> {
    try {
      const accessToken = await this.oauthService.getAccessToken(
        dto.userId,
        dto.orgId,
      );

      // Build filter for invoice keywords
      const keywordFilters = INVOICE_SEARCH_KEYWORDS.map(
        (keyword) => `contains(subject, '${keyword}')`,
      ).join(' or ');

      // Build date filter
      let dateFilter = '';
      if (dto.since) {
        dateFilter = ` and receivedDateTime ge ${dto.since}`;
      }

      // Build read filter
      let readFilter = '';
      if (dto.unreadOnly) {
        readFilter = ' and isRead eq false';
      }

      // Combine filters
      const filter = `hasAttachments eq true and (${keywordFilters})${dateFilter}${readFilter}`;

      const response = await this.graphRequest(
        accessToken,
        '/me/messages',
        'GET',
        {
          $filter: filter,
          $select: OUTLOOK_QUERY_DEFAULTS.defaultSelect,
          $top: dto.maxResults || OUTLOOK_QUERY_DEFAULTS.maxResults,
          $orderby: 'receivedDateTime desc',
        },
      );

      await this.createAuditLog(dto.userId, dto.orgId, {
        action: 'EMAIL_READ',
        endpoint: '/me/messages (invoice search)',
        statusCode: 200,
        success: true,
        metadata: { filter, resultCount: response.value?.length || 0 },
      });

      return {
        messages: response.value || [],
        count: response.value?.length || 0,
      };
    } catch (error) {
      this.logger.error('Failed to search invoice emails', error);
      await this.createAuditLog(dto.userId, dto.orgId, {
        action: 'EMAIL_READ',
        endpoint: '/me/messages (invoice search)',
        statusCode: error.response?.status,
        success: false,
        errorMessage: error.message,
      });
      throw new InternalServerErrorException(
        'Failed to search invoice emails',
      );
    }
  }

  /**
   * Create a mail folder
   */
  async createFolder(dto: CreateFolderDto): Promise<{ id: string; name: string }> {
    try {
      const accessToken = await this.oauthService.getAccessToken(
        dto.userId,
        dto.orgId,
      );

      // Check if folder already exists
      const existingFolders = await this.graphRequest(
        accessToken,
        '/me/mailFolders',
        'GET',
        {
          $filter: `displayName eq '${dto.name}'`,
        },
      );

      if (existingFolders.value && existingFolders.value.length > 0) {
        return {
          id: existingFolders.value[0].id,
          name: existingFolders.value[0].displayName,
        };
      }

      // Create new folder
      const response = await this.graphRequest(
        accessToken,
        '/me/mailFolders',
        'POST',
        {},
        {
          displayName: dto.name,
        },
      );

      await this.createAuditLog(dto.userId, dto.orgId, {
        action: 'EMAIL_READ',
        endpoint: '/me/mailFolders',
        statusCode: 201,
        success: true,
        metadata: { folderName: dto.name },
      });

      return {
        id: response.id,
        name: response.displayName,
      };
    } catch (error) {
      this.logger.error(`Failed to create folder ${dto.name}`, error);
      await this.createAuditLog(dto.userId, dto.orgId, {
        action: 'EMAIL_READ',
        endpoint: '/me/mailFolders',
        statusCode: error.response?.status,
        success: false,
        errorMessage: error.message,
      });
      throw new InternalServerErrorException('Failed to create folder');
    }
  }

  /**
   * Move message to folder
   */
  async moveToFolder(dto: MoveToFolderDto): Promise<{ success: boolean }> {
    try {
      const accessToken = await this.oauthService.getAccessToken(
        dto.userId,
        dto.orgId,
      );

      await this.graphRequest(
        accessToken,
        `/me/messages/${dto.messageId}/move`,
        'POST',
        {},
        {
          destinationId: dto.folderId,
        },
      );

      await this.createAuditLog(dto.userId, dto.orgId, {
        action: 'EMAIL_READ',
        endpoint: `/me/messages/${dto.messageId}/move`,
        statusCode: 200,
        success: true,
        metadata: { folderId: dto.folderId },
      });

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to move message ${dto.messageId} to folder ${dto.folderId}`,
        error,
      );
      await this.createAuditLog(dto.userId, dto.orgId, {
        action: 'EMAIL_READ',
        endpoint: `/me/messages/${dto.messageId}/move`,
        statusCode: error.response?.status,
        success: false,
        errorMessage: error.message,
      });

      if (error.response?.status === 404) {
        throw new NotFoundException('Message or folder not found');
      }

      throw new InternalServerErrorException('Failed to move message');
    }
  }

  /**
   * Make Graph API request with error handling and retries
   */
  private async graphRequest(
    accessToken: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    params?: any,
    data?: any,
    retryCount = 0,
  ): Promise<any> {
    try {
      const url = `${GRAPH_API_BASE_URL}${endpoint}`;
      const response = await axios({
        method,
        url,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        params,
        data,
      });

      return response.data;
    } catch (error) {
      // Handle specific Graph API errors
      const errorCode = error.response?.data?.error?.code;

      // Retry on transient errors
      if (
        retryCount < OUTLOOK_RETRY_CONFIG.maxRetries &&
        (errorCode === GRAPH_ERROR_CODES.quotaLimitReached ||
          error.response?.status === 429 ||
          error.response?.status >= 500)
      ) {
        const delay =
          OUTLOOK_RETRY_CONFIG.retryDelay *
          Math.pow(OUTLOOK_RETRY_CONFIG.retryBackoff, retryCount);

        this.logger.warn(
          `Retrying Graph API request (attempt ${retryCount + 1}/${OUTLOOK_RETRY_CONFIG.maxRetries}) after ${delay}ms`,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));

        return this.graphRequest(
          accessToken,
          endpoint,
          method,
          params,
          data,
          retryCount + 1,
        );
      }

      throw error;
    }
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    userId: string,
    orgId: string,
    log: {
      action: string;
      endpoint?: string;
      statusCode?: number;
      success: boolean;
      errorMessage?: string;
      metadata?: any;
    },
  ): Promise<void> {
    try {
      // Find connection
      const connection = await this.prisma.emailConnection.findFirst({
        where: {
          userId,
          orgId,
          provider: 'OUTLOOK',
        },
      });

      if (!connection) {
        return;
      }

      await this.prisma.emailAuditLog.create({
        data: {
          connectionId: connection.id,
          action: log.action as Prisma.InputJsonValue,
          endpoint: log.endpoint,
          statusCode: log.statusCode,
          success: log.success,
          errorMessage: log.errorMessage,
          metadata: log.metadata || {},
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
      // Don't throw - audit logging is non-critical
    }
  }
}
