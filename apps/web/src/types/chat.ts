/**
 * Chat Interface Types
 * Type definitions for the AI assistant chat feature
 */

export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'error' | 'received' | 'streaming' | 'retrying';

export interface ChatMessage {
  id: string;
  conversationId?: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  status?: MessageStatus;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  attachments?: Attachment[];
  citations?: Citation[];
  error?: string;
  retryCount?: number;
  type?: string;
  // SSE event metadata
  transactionId?: string;
  deadlineId?: string;
  priority?: string;
  suggestionId?: string;
  suggestionType?: string;
  accountId?: string;
  count?: number;
  invoiceId?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

export interface Citation {
  text: string;
  source: string;
  url?: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: ConversationMetadata;
}

export interface ConversationMetadata {
  context?: string;
  tags?: string[];
  archived?: boolean;
}

export interface ChatState {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  isOpen: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ChatInputState {
  value: string;
  attachments: Attachment[];
  isComposing: boolean;
}
