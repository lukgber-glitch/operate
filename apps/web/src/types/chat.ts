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
  // Action metadata
  action?: ActionIntent;
  actionResult?: ActionResult;
  actionType?: string;
  actionParams?: Record<string, any>;
  actionStatus?: string;
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

/**
 * Action-related types
 */
export enum ActionType {
  CREATE_INVOICE = 'create_invoice',
  SEND_REMINDER = 'send_reminder',
  GENERATE_REPORT = 'generate_report',
  CREATE_EXPENSE = 'create_expense',
  SEND_EMAIL = 'send_email',
  EXPORT_DATA = 'export_data',
  UPDATE_STATUS = 'update_status',
  SCHEDULE_TASK = 'schedule_task',
}

export interface ActionIntent {
  type: ActionType;
  parameters: Record<string, any>;
  confirmationRequired: boolean;
  description: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
  entityId?: string;
  entityType?: string;
  data?: any;
  error?: string;
}

export interface PendingAction {
  id: string;
  action: ActionIntent;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'expired';
}
