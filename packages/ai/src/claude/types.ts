/**
 * Claude AI Types
 * Type definitions for Claude API integration
 */

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeRequestParams {
  model: string;
  messages: ClaudeMessage[];
  max_tokens: number;
  temperature?: number;
  system?: string;
}

export interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClaudeError {
  type: string;
  message: string;
}
