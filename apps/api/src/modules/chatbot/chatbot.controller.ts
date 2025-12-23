import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  NotFoundException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChatbotService } from './chatbot.service';
import {
  SendMessageDto,
  CreateConversationDto,
  ConfirmActionDto,
  CancelActionDto,
  ActionStatusResponseDto,
  ActionExecutionResponseDto,
} from './dto';
import { ActionExecutorService } from './actions/action-executor.service';
import { ConfirmationService } from './actions/confirmation.service';

@ApiTags('Chatbot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chatbot')
export class ChatbotController {
  private readonly logger = new Logger(ChatbotController.name);

  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly actionExecutor: ActionExecutorService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiBody({ type: CreateConversationDto })
  async createConversation(
    @CurrentUser() user: { id: string; orgId: string },
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatbotService.createConversation({
      userId: user.id,
      orgId: user.orgId,
      title: dto.title,
      context: dto.context,
    });
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversations' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getConversations(
    @CurrentUser() user: { id: string; orgId: string },
    @Query('limit') limit = 20,
    @Query('offset') offset = 0,
  ) {
    return this.chatbotService.getConversations(user.id, { limit, offset });
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation with messages' })
  @ApiParam({ name: 'id', type: String })
  async getConversation(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.chatbotService.getConversation(id, user.id);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send message to chatbot' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: SendMessageDto })
  async sendMessage(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatbotService.sendMessage({
      conversationId,
      userId: user.id,
      orgId: user.orgId,
      content: dto.content,
      attachments: dto.attachments,
    });
  }

  @Post('quick-ask')
  @ApiOperation({ summary: 'Quick question without conversation context' })
  @ApiBody({ type: SendMessageDto })
  async quickAsk(
    @CurrentUser() user: { id: string; orgId: string },
    @Body() dto: SendMessageDto,
  ) {
    return this.chatbotService.quickAsk({
      userId: user.id,
      orgId: user.orgId,
      content: dto.content,
    });
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get AI suggestions based on current context' })
  @ApiQuery({ name: 'context', required: false, type: String })
  async getSuggestions(
    @CurrentUser() user: { id: string; orgId: string },
    @Query('context') context?: string,
  ) {
    return this.chatbotService.getSuggestions(user.orgId, context);
  }

  @Post('actions/:confirmationId/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm and execute a pending action' })
  @ApiParam({
    name: 'confirmationId',
    type: String,
    description: 'The confirmation ID of the pending action',
  })
  @ApiBody({ type: ConfirmActionDto })
  @ApiResponse({
    status: 200,
    description: 'Action confirmed and executed successfully',
    type: ActionExecutionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Confirmation not found or expired',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid action or execution failed',
  })
  async confirmAction(
    @CurrentUser() user: { id: string; orgId: string },
    @Param('confirmationId') confirmationId: string,
    @Body() dto: ConfirmActionDto,
  ): Promise<ActionExecutionResponseDto> {
    this.logger.log(
      `User ${user.id} confirming action ${confirmationId}`,
    );

    // Validate confirmation exists and belongs to user
    const pendingAction = await this.confirmationService.getPendingAction(confirmationId);

    if (!pendingAction) {
      throw new NotFoundException('Confirmation not found or has expired');
    }

    if (pendingAction.context.userId !== user.id) {
      throw new BadRequestException('This action does not belong to you');
    }

    // Generate a message ID for the action log
    const messageId = dto.messageId || `action-${Date.now()}`;

    // Execute the action
    const result = await this.actionExecutor.confirmAndExecute(
      confirmationId,
      user.id,
      messageId,
    );

    if (!result.success) {
      this.logger.error(
        `Action execution failed for confirmation ${confirmationId}: ${result.error}`,
      );
    }

    return {
      success: result.success,
      message: result.message,
      entityId: result.entityId,
      entityType: result.entityType,
      data: result.data,
      error: result.error,
    };
  }

  @Post('actions/:confirmationId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending action' })
  @ApiParam({
    name: 'confirmationId',
    type: String,
    description: 'The confirmation ID of the pending action',
  })
  @ApiBody({ type: CancelActionDto })
  @ApiResponse({
    status: 200,
    description: 'Action cancelled successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Action cancelled successfully' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Confirmation not found or expired',
  })
  async cancelAction(
    @CurrentUser() user: { id: string },
    @Param('confirmationId') confirmationId: string,
    @Body() dto: CancelActionDto,
  ) {
    this.logger.log(
      `User ${user.id} cancelling action ${confirmationId}${dto.reason ? `: ${dto.reason}` : ''}`,
    );

    const cancelled = this.actionExecutor.cancelPendingAction(
      confirmationId,
      user.id,
    );

    if (!cancelled) {
      throw new NotFoundException('Confirmation not found or has expired');
    }

    return {
      success: true,
      message: 'Action cancelled successfully',
    };
  }

  @Get('actions/:confirmationId/status')
  @ApiOperation({ summary: 'Get status of a pending action' })
  @ApiParam({
    name: 'confirmationId',
    type: String,
    description: 'The confirmation ID of the pending action',
  })
  @ApiResponse({
    status: 200,
    description: 'Action status retrieved successfully',
    type: ActionStatusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Confirmation not found or expired',
  })
  async getActionStatus(
    @CurrentUser() user: { id: string },
    @Param('confirmationId') confirmationId: string,
  ): Promise<ActionStatusResponseDto> {
    const pendingAction = await this.confirmationService.getPendingAction(confirmationId);

    if (!pendingAction) {
      throw new NotFoundException('Confirmation not found or has expired');
    }

    // Verify ownership
    if (pendingAction.context.userId !== user.id) {
      throw new NotFoundException('Confirmation not found');
    }

    // Check if expired
    const now = new Date();
    const isExpired = now > pendingAction.expiresAt;

    return {
      id: pendingAction.id,
      type: pendingAction.action.type,
      description: pendingAction.action.description,
      parameters: pendingAction.action.parameters,
      confirmationRequired: pendingAction.action.confirmationRequired,
      createdAt: pendingAction.createdAt,
      expiresAt: pendingAction.expiresAt,
      status: isExpired ? 'expired' : 'pending',
    };
  }
}
