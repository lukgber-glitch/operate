/**
 * Claude API Client
 * Handles communication with Anthropic's Claude API
 */

import Anthropic from '@anthropic-ai/sdk';

import { ClaudeMessage, ClaudeRequestParams, ClaudeResponse } from './types';

export interface ClaudeClientConfig {
  apiKey: string;
  defaultModel?: string;
  maxTokens?: number;
  temperature?: number;
}

export class ClaudeClient {
  private client: Anthropic;
  private config: Required<ClaudeClientConfig>;

  constructor(config: ClaudeClientConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });

    this.config = {
      apiKey: config.apiKey,
      defaultModel: config.defaultModel || 'claude-3-5-sonnet-20241022',
      maxTokens: config.maxTokens || 1024,
      temperature: config.temperature || 0.3,
    };
  }

  /**
   * Send a message to Claude and get a response
   */
  async sendMessage(
    messages: ClaudeMessage[],
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      system?: string;
    },
  ): Promise<ClaudeResponse> {
    const params: ClaudeRequestParams = {
      model: options?.model || this.config.defaultModel,
      messages,
      max_tokens: options?.maxTokens || this.config.maxTokens,
      temperature: options?.temperature ?? this.config.temperature,
    };

    if (options?.system) {
      params.system = options.system;
    }

    try {
      const response = await this.client.messages.create(params);
      return response as ClaudeResponse;
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        throw new Error(`Claude API Error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Send a single prompt and get text response
   */
  async prompt(
    userMessage: string,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      system?: string;
    },
  ): Promise<string> {
    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content: userMessage,
      },
    ];

    const response = await this.sendMessage(messages, options);

    // Extract text from the first content block
    if (response.content && response.content.length > 0) {
      const firstContent = response.content[0];
      if (!firstContent?.text) {
        throw new Error('No text in Claude response content block');
      }
      return firstContent.text;
    }

    throw new Error('No content in Claude response');
  }

  /**
   * Send a prompt and parse JSON response
   */
  async promptJson<T>(
    userMessage: string,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      system?: string;
    },
  ): Promise<T> {
    const text = await this.prompt(userMessage, options);

    try {
      // Try to extract JSON from code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;

      if (!jsonText) {
        throw new Error('Empty JSON text');
      }

      return JSON.parse(jsonText.trim());
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}\nResponse: ${text}`);
    }
  }
}
