/**
 * Chat Controller
 * REST API endpoints for AI assistant chatbot
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PromptSanitizerGuard } from './guards/prompt-sanitizer.guard';
import { ChatService } from './chat.service';
import { ContextService } from './context/context.service';
import {
  CreateConversationDto,
  SendMessageDto,
  ConversationResponseDto,
  MessageResponseDto,
  PaginatedConversationsResponseDto,
  QuickAskDto,
  QuickAskResponseDto,
  ContextRequestDto,
  ContextResponseDto,
} from './dto';

// Import EmailSuggestionsService for suggestion endpoints
import { EmailSuggestionsService } from '../ai/email-intelligence/email-suggestions.service';

@ApiTags('Chatbot')
@Controller('chatbot')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(
    private chatService: ChatService,
    private contextService: ContextService,
    private emailSuggestionsService: EmailSuggestionsService,
  ) {}

  /**
   * Create a new conversation
   */
  @Post('conversations')
  @ApiOperation({ summary: 'Create a new AI assistant conversation' })
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully',
    type: ConversationResponseDto,
  })
  async createConversation(
    @Request() req: any,
    @Body() dto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.chatService.createConversation(
      req.user.id,
      req.user.orgId,
      dto,
    );

    return this.mapConversationToDto(conversation);
  }

  /**
   * List user's conversations
   */
  @Get('conversations')
  @ApiOperation({ summary: 'List all conversations for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Conversations retrieved successfully',
    type: PaginatedConversationsResponseDto,
  })
  async listConversations(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<PaginatedConversationsResponseDto> {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    const { conversations, total } = await this.chatService.listConversations(
      req.user.id,
      req.user.orgId,
      { limit: limitNum, offset: offsetNum },
    );

    return {
      conversations: conversations.map(c => this.mapConversationToDto(c)),
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
    };
  }

  /**
   * Get a specific conversation
   */
  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a conversation by ID with all messages' })
  @ApiResponse({
    status: 200,
    description: 'Conversation retrieved successfully',
    type: ConversationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your conversation' })
  async getConversation(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.chatService.getConversation(
      id,
      req.user.id,
      req.user.orgId,
    );

    return this.mapConversationToDto(conversation);
  }

  /**
   * Send a message in a conversation
   */
  @Post('conversations/:id/messages')
  @UseGuards(PromptSanitizerGuard)
  @ApiOperation({ summary: 'Send a message and get AI response' })
  @ApiResponse({
    status: 201,
    description: 'Message sent and response received',
    type: [MessageResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your conversation' })
  async sendMessage(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ): Promise<MessageResponseDto[]> {
    const { userMessage, assistantMessage } = await this.chatService.sendMessage(
      id,
      req.user.id,
      req.user.orgId,
      dto,
    );

    return [
      this.mapMessageToDto(userMessage),
      this.mapMessageToDto(assistantMessage),
    ];
  }

  /**
   * Delete a conversation
   */
  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiResponse({ status: 204, description: 'Conversation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your conversation' })
  async deleteConversation(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<void> {
    await this.chatService.deleteConversation(id, req.user.id, req.user.orgId);
  }

  /**
   * Archive a conversation
   */
  @Post('conversations/:id/archive')
  @ApiOperation({ summary: 'Archive a conversation' })
  @ApiResponse({
    status: 200,
    description: 'Conversation archived successfully',
    type: ConversationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your conversation' })
  async archiveConversation(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.chatService.archiveConversation(
      id,
      req.user.id,
      req.user.orgId,
    );

    return this.mapConversationToDto(conversation);
  }

  /**
   * Quick ask - one-off question without persistence
   */
  @Post('quick-ask')
  @UseGuards(PromptSanitizerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ask a quick question without creating a conversation',
    description: 'For simple, one-off questions that don\'t need to be saved',
  })
  @ApiResponse({
    status: 200,
    description: 'Answer received successfully',
    type: QuickAskResponseDto,
  })
  async quickAsk(
    @Request() req: any,
    @Body() dto: QuickAskDto,
  ): Promise<QuickAskResponseDto> {
    const response = await this.chatService.quickAsk(
      req.user.id,
      req.user.orgId,
      dto.question,
      dto.context,
    );

    return {
      answer: response.answer,
      model: response.model,
      usage: {
        input: response.usage.input,
        output: response.usage.output,
      },
    };
  }

  /**
   * Get context for current page/entity
   */
  @Post('context')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get contextual information for AI assistant',
    description: 'Returns context about current page, user, org, and entity being viewed',
  })
  @ApiResponse({
    status: 200,
    description: 'Context retrieved successfully',
    type: ContextResponseDto,
  })
  async getContext(
    @Request() req: any,
    @Body() dto: ContextRequestDto,
  ): Promise<ContextResponseDto> {
    const context = await this.contextService.buildContext({
      userId: req.user.id,
      organizationId: req.user.orgId,
      currentPage: dto.currentPage,
      selectedEntityType: dto.selectedEntityType,
      selectedEntityId: dto.selectedEntityId,
      additionalContext: dto.additionalContext,
    });

    return {
      user: context.user,
      organization: context.organization,
      page: context.page,
      entity: context.entity,
      recentActivity: context.recentActivity,
      suggestions: context.suggestions,
      metadata: context.metadata,
    };
  }

  /**
   * Get pending suggestions for the organization
   * Returns AI-generated suggestions from email analysis
   */
  @Get('suggestions')
  @ApiOperation({ summary: 'Get pending email-based suggestions for chat' })
  @ApiResponse({
    status: 200,
    description: 'Suggestions retrieved successfully',
  })
  async getSuggestions(
    @Request() req: any,
    @Query('types') types?: string,
    @Query('priority') priority?: string,
    @Query('entityId') entityId?: string,
    @Query('limit') limit?: string,
  ): Promise<any> {
    const options: any = {
      limit: limit ? parseInt(limit, 10) : 50,
    };

    // Parse types filter (comma-separated)
    if (types) {
      options.types = types.split(',');
    }

    // Parse priority filter (comma-separated)
    if (priority) {
      options.priority = priority.split(',');
    }

    // Filter by entity
    if (entityId) {
      options.entityId = entityId;
    }

    const suggestions = await this.emailSuggestionsService.getSuggestionsForOrg(
      req.user.orgId,
      options,
    );

    return {
      suggestions,
      total: suggestions.length,
    };
  }

  /**
   * Execute a suggestion
   * This processes the suggestion's action and creates a chat response
   */
  @Post('suggestions/:id/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute a suggestion action' })
  @ApiResponse({
    status: 200,
    description: 'Suggestion executed successfully',
  })
  @ApiResponse({ status: 404, description: 'Suggestion not found' })
  async executeSuggestion(
    @Request() req: any,
    @Param('id') suggestionId: string,
  ): Promise<any> {
    // Mark suggestion as completed
    await this.emailSuggestionsService.completeSuggestion(
      suggestionId,
      req.user.id,
    );

    return {
      success: true,
      message: 'Suggestion marked as completed',
    };
  }

  /**
   * Dismiss a suggestion
   */
  @Post('suggestions/:id/dismiss')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dismiss a suggestion' })
  @ApiResponse({
    status: 200,
    description: 'Suggestion dismissed successfully',
  })
  @ApiResponse({ status: 404, description: 'Suggestion not found' })
  async dismissSuggestion(
    @Request() req: any,
    @Param('id') suggestionId: string,
  ): Promise<any> {
    await this.emailSuggestionsService.dismissSuggestion(
      suggestionId,
      req.user.id,
    );

    return {
      success: true,
      message: 'Suggestion dismissed',
    };
  }

  /**
   * Snooze a suggestion
   */
  @Post('suggestions/:id/snooze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Snooze a suggestion until a specific date' })
  @ApiResponse({
    status: 200,
    description: 'Suggestion snoozed successfully',
  })
  @ApiResponse({ status: 404, description: 'Suggestion not found' })
  async snoozeSuggestion(
    @Request() req: any,
    @Param('id') suggestionId: string,
    @Body() body: { until: string },
  ): Promise<any> {
    const until = new Date(body.until);

    await this.emailSuggestionsService.snoozeSuggestion(
      suggestionId,
      req.user.id,
      until,
    );

    return {
      success: true,
      message: `Suggestion snoozed until ${until.toISOString()}`,
    };
  }

  /**
   * Map Prisma Conversation to DTO
   */
  private mapConversationToDto(conversation: any): ConversationResponseDto {
    return {
      id: conversation.id,
      orgId: conversation.orgId,
      userId: conversation.userId,
      title: conversation.title,
      status: conversation.status,
      contextType: conversation.contextType,
      contextId: conversation.contextId,
      pageContext: conversation.pageContext,
      metadata: conversation.metadata as Record<string, any>,
      messageCount: conversation.messageCount,
      lastMessageAt: conversation.lastMessageAt,
      resolvedAt: conversation.resolvedAt,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages?.map((m: any) => this.mapMessageToDto(m)),
    };
  }

  /**
   * Map Prisma Message to DTO
   */
  private mapMessageToDto(message: any): MessageResponseDto {
    return {
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      type: message.type,
      content: message.content,
      actionType: message.actionType,
      actionParams: message.actionParams as Record<string, any>,
      actionResult: message.actionResult as Record<string, any>,
      actionStatus: message.actionStatus,
      componentType: message.componentType,
      componentData: message.componentData as Record<string, any>,
      model: message.model,
      tokenCount: message.tokenCount,
      createdAt: message.createdAt,
      attachments: message.attachments?.map((att: any) => ({
        id: att.id,
        fileName: att.fileName,
        fileType: att.fileType,
        fileSize: att.fileSize,
        storagePath: att.storagePath,
      })),
    };
  }
}
