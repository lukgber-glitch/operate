import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatbotRepository } from './chatbot.repository';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly claudeApiKey: string;
  private readonly claudeModel: string;

  constructor(
    private readonly repository: ChatbotRepository,
    private readonly configService: ConfigService,
  ) {
    this.claudeApiKey = this.configService.get<string>('ANTHROPIC_API_KEY', '');
    this.claudeModel = this.configService.get<string>('CLAUDE_MODEL', 'claude-3-5-sonnet-20241022');
  }

  async createConversation(data: {
    userId: string;
    orgId: string;
    title?: string;
    context?: string;
  }) {
    return this.repository.createConversation({
      userId: data.userId,
      orgId: data.orgId,
      title: data.title || 'New Conversation',
      context: data.context,
    });
  }

  async getConversations(userId: string, options: { limit: number; offset: number }) {
    return this.repository.findConversationsByUser(userId, options);
  }

  async getConversation(id: string, userId: string) {
    const conversation = await this.repository.findConversationById(id);
    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  async sendMessage(data: {
    conversationId: string;
    userId: string;
    orgId: string;
    content: string;
    attachments?: string[];
  }) {
    // Get conversation and verify ownership
    const conversation = await this.getConversation(data.conversationId, data.userId);

    // Save user message
    const userMessage = await this.repository.createMessage({
      conversationId: data.conversationId,
      role: 'USER',
      content: data.content,
      attachments: data.attachments,
    });

    // Get conversation history for context
    const history = await this.repository.getMessageHistory(data.conversationId);

    // Build messages for Claude
    const claudeMessages = this.buildClaudeMessages(history, conversation.contextType);

    // Call Claude API
    const response = await this.callClaude(claudeMessages, data.orgId);

    // Save assistant response
    const assistantMessage = await this.repository.createMessage({
      conversationId: data.conversationId,
      role: 'ASSISTANT',
      content: response.content,
      metadata: { model: this.claudeModel, tokens: response.usage },
    });

    // Update conversation timestamp
    await this.repository.updateConversation(data.conversationId, {
      lastMessageAt: new Date(),
    });

    return {
      userMessage,
      assistantMessage,
    };
  }

  async quickAsk(data: { userId: string; orgId: string; content: string }) {
    const messages: ClaudeMessage[] = [{ role: 'user', content: data.content }];
    const response = await this.callClaude(messages, data.orgId);
    return { content: response.content };
  }

  async getSuggestions(orgId: string, context?: string) {
    const systemPrompt = this.buildSuggestionPrompt(context);
    const response = await this.callClaude(
      [{ role: 'user', content: 'What actions or insights would be helpful right now?' }],
      orgId,
      systemPrompt,
    );

    // Parse suggestions from response
    return this.parseSuggestions(response.content);
  }

  private buildClaudeMessages(
    history: Array<{ role: string; content: string }>,
    context?: string | null,
  ): ClaudeMessage[] {
    return history.map((msg) => ({
      role: msg.role === 'USER' ? 'user' : 'assistant',
      content: msg.content,
    }));
  }

  private async callClaude(
    messages: ClaudeMessage[],
    orgId: string,
    systemPrompt?: string,
  ): Promise<{ content: string; usage: { input: number; output: number } }> {
    const system = systemPrompt || this.getDefaultSystemPrompt(orgId);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.claudeModel,
          max_tokens: 4096,
          system,
          messages,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error('Claude API error:', error);
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return {
        content: data.content[0].text,
        usage: {
          input: data.usage.input_tokens,
          output: data.usage.output_tokens,
        },
      };
    } catch (error) {
      this.logger.error('Claude API call failed:', error);
      throw error;
    }
  }

  private getDefaultSystemPrompt(orgId: string): string {
    return `You are Operate Assistant, an AI helper for the Operate business management platform.
You help users with:
- Financial questions and tax compliance (German/Austrian tax law)
- HR management and employee-related queries
- Business operations and workflow optimization
- Integration setup and troubleshooting

Be concise, professional, and helpful. If you're unsure about specific regulations, recommend consulting a professional.
Always format responses for readability with proper structure.`;
  }

  private buildSuggestionPrompt(context?: string): string {
    return `You are an AI assistant analyzing a business dashboard.
${context ? `Current context: ${context}` : ''}
Provide 3-5 actionable suggestions based on the context.
Format each suggestion as: {"title": "...", "description": "...", "action": "...", "priority": "high|medium|low"}`;
  }

  private parseSuggestions(content: string): Array<{
    title: string;
    description: string;
    action: string;
    priority: string;
  }> {
    try {
      // Try to parse JSON array from response
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
      // Fallback: return empty array
      return [];
    } catch {
      return [];
    }
  }
}
