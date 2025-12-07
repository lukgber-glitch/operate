/**
 * Claude Service
 * Handles integration with Anthropic's Claude API for chat functionality
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClaudeClient } from '@operate/ai';
import { PiiMaskingService, MaskingLevel } from '../../common/services/pii-masking.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);
  private client: ClaudeClient;
  private readonly defaultModel: string;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(
    private configService: ConfigService,
    private piiMaskingService: PiiMaskingService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    this.defaultModel = this.configService.get<string>('ANTHROPIC_MODEL') || 'claude-3-5-sonnet-20241022';
    this.maxTokens = this.configService.get<number>('ANTHROPIC_MAX_TOKENS') || 4096;
    this.temperature = this.configService.get<number>('ANTHROPIC_TEMPERATURE') || 0.7;

    this.client = new ClaudeClient({
      apiKey,
      defaultModel: this.defaultModel,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
    });

    this.logger.log(`Claude service initialized with model: ${this.defaultModel}`);
  }

  /**
   * Send a chat message to Claude and get response
   */
  async chat(messages: ChatMessage[], systemPrompt?: string): Promise<ClaudeResponse> {
    try {
      this.logger.debug(`Sending ${messages.length} messages to Claude`);

      // Mask PII in user messages before sending to Claude
      const claudeMessages = messages.map(msg => {
        if (msg.role === 'user') {
          const maskResult = this.piiMaskingService.maskPII(msg.content, {
            level: MaskingLevel.MODERATE,
            preserveFormat: true,
          });

          // Log masked fields for audit
          if (maskResult.maskedCount > 0) {
            this.logger.warn(
              `Masked ${maskResult.maskedCount} PII fields before sending to Claude API: ${maskResult.maskedFields.map(f => f.type).join(', ')}`,
            );
          }

          return {
            role: msg.role,
            content: maskResult.maskedText,
          };
        }

        return {
          role: msg.role,
          content: msg.content,
        };
      });

      const response = await this.client.sendMessage(claudeMessages, {
        system: systemPrompt,
        model: this.defaultModel,
        maxTokens: this.maxTokens,
        temperature: this.temperature,
      });

      // Extract text from response
      const content = response.content && response.content.length > 0
        ? response.content[0].text
        : '';

      this.logger.debug(`Received response: ${response.usage.output_tokens} tokens`);

      return {
        content,
        model: response.model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      this.logger.error('Error calling Claude API:', error);
      throw new Error('Failed to get response from AI assistant');
    }
  }

  /**
   * Stream chat response from Claude (for future implementation)
   * Note: Streaming requires additional implementation with SSE or WebSockets
   */
  async *streamChat(
    messages: ChatMessage[],
    systemPrompt?: string,
  ): AsyncGenerator<string> {
    // This is a placeholder for future streaming implementation
    // For now, we'll just yield the complete response
    const response = await this.chat(messages, systemPrompt);
    yield response.content;
  }

  /**
   * Estimate token count for text
   * Claude uses ~4 characters per token as a rough estimate
   */
  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    // This is not exact but good enough for rate limiting
    return Math.ceil(text.length / 4);
  }

  /**
   * Validate message length doesn't exceed limits
   */
  validateMessageLength(messages: ChatMessage[]): boolean {
    const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    const estimatedTokens = this.estimateTokens(totalChars.toString());

    // Claude context window is 200k tokens, but we want to leave room for response
    const maxInputTokens = 150000;

    return estimatedTokens < maxInputTokens;
  }

  /**
   * Sanitize user input before sending to Claude
   */
  sanitizeInput(input: string): string {
    // Remove any potential injection attempts
    // Remove control characters except newlines and tabs
    let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Trim excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // Limit length to prevent abuse (max 10k chars per message)
    if (sanitized.length > 10000) {
      sanitized = sanitized.substring(0, 10000) + '... [truncated]';
    }

    return sanitized;
  }
}
