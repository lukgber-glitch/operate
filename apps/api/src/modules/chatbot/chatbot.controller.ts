import { Controller, Post, Get, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChatbotService } from './chatbot.service';
import { SendMessageDto, CreateConversationDto } from './dto';

@ApiTags('Chatbot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chatbot')
export class ChatbotController {
  private readonly logger = new Logger(ChatbotController.name);

  constructor(private readonly chatbotService: ChatbotService) {}

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
}
