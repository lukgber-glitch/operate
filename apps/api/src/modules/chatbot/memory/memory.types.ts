import { Message } from '@prisma/client';

/**
 * Memory Types
 * Defines the structure and types for conversation memory management
 */

export enum MemoryType {
  PREFERENCE = 'PREFERENCE',     // e.g., "User prefers detailed explanations"
  FACT = 'FACT',                 // e.g., "Company uses SKR04"
  INSTRUCTION = 'INSTRUCTION',   // e.g., "Always use formal German"
  CONTEXT = 'CONTEXT',           // e.g., "Main business is software consulting"
}

export enum MemorySource {
  EXTRACTED = 'extracted',       // Automatically extracted from conversation
  USER = 'user',                 // Explicitly provided by user
  SYSTEM = 'system',             // System-generated
}

export interface Memory {
  id: string;
  type: MemoryType;
  content: string;
  confidence: number;            // 0-1 how confident we are in this memory
  source: MemorySource;
  conversationId?: string;       // Optional conversation reference
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface ConversationContext {
  recentMessages: Message[];     // Last N messages (sliding window)
  summary: string | null;        // Summary of older messages
  userMemories: Memory[];        // Important facts about user
  totalTokensUsed: number;
}

export interface ConversationSummary {
  id: string;
  conversationId: string;
  summary: string;
  messagesIncluded: number;
  tokensUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryExtractionResult {
  memories: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>[];
  confidence: number;
}

export interface TokenEstimate {
  messages: number;
  summary: number;
  userMemories: number;
  systemPrompt: number;
  total: number;
}

export interface SlidingWindowConfig {
  recentMessageCount: number;    // Number of recent messages to keep in full
  maxTokens: number;              // Maximum tokens for conversation context
  summaryTriggerCount: number;   // Number of messages before creating summary
}

export const DEFAULT_SLIDING_WINDOW_CONFIG: SlidingWindowConfig = {
  recentMessageCount: 10,
  maxTokens: 8000,
  summaryTriggerCount: 15,
};

export const TOKEN_LIMITS = {
  CONVERSATION_HISTORY: 8000,
  SYSTEM_PROMPT: 1500,
  RESPONSE: 4000,
  TOTAL: 13500,
};
