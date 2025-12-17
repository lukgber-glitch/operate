/**
 * Chat API Client
 * Handles all chatbot-related API requests
 */

import { api } from './client';
import { ActionResult } from '@/types/chat';

export interface SendMessageRequest {
  content: string;
  conversationId?: string;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
  }>;
}

export interface SendMessageResponse {
  id: string;
  conversationId: string;
  content: string;
  timestamp: string;
  metadata?: {
    action?: {
      type: string;
      parameters: Record<string, any>;
      confirmationRequired: boolean;
      description: string;
    };
  };
}

export interface CreateConversationRequest {
  title?: string;
  context?: string;
}

export interface CreateConversationResponse {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConfirmActionRequest {
  messageId?: string;
}

export interface CancelActionRequest {
  reason?: string;
}

export interface ActionExecutionResponse {
  success: boolean;
  message: string;
  entityId?: string;
  entityType?: string;
  data?: any;
  error?: string;
}

export interface ActionStatusResponse {
  id: string;
  type: string;
  description: string;
  parameters: Record<string, any>;
  confirmationRequired: boolean;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'expired';
}

class ChatApiClient {
  /**
   * Create a new conversation
   */
  async createConversation(data: CreateConversationRequest): Promise<CreateConversationResponse> {
    const response = await api.post<CreateConversationResponse>('/chatbot/conversations', data);
    return response.data || ({} as CreateConversationResponse);
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(conversationId: string, data: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await api.post<SendMessageResponse>(
      `/chatbot/conversations/${conversationId}/messages`,
      data
    );
    return response.data || ({} as SendMessageResponse);
  }

  /**
   * Quick ask without conversation context
   */
  async quickAsk(content: string): Promise<SendMessageResponse> {
    const response = await api.post<SendMessageResponse>('/chatbot/quick-ask', {
      content,
    });
    return response.data || ({} as SendMessageResponse);
  }

  /**
   * Get conversation history
   */
  async getConversations(limit = 20, offset = 0) {
    const response = await api.get('/chatbot/conversations', {
      params: { limit, offset },
    });
    return response.data || [];
  }

  /**
   * Get a specific conversation with messages
   */
  async getConversation(conversationId: string) {
    const response = await api.get(`/chatbot/conversations/${conversationId}`);
    return response.data || {};
  }

  /**
   * Confirm and execute a pending action
   */
  async confirmAction(
    confirmationId: string,
    data?: ConfirmActionRequest
  ): Promise<ActionExecutionResponse> {
    const response = await api.post<ActionExecutionResponse>(
      `/chatbot/actions/${confirmationId}/confirm`,
      data || {}
    );
    return response.data || ({ success: false, message: 'Unknown error' } as ActionExecutionResponse);
  }

  /**
   * Cancel a pending action
   */
  async cancelAction(confirmationId: string, data?: CancelActionRequest): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(
      `/chatbot/actions/${confirmationId}/cancel`,
      data || {}
    );
    return response.data || { success: false, message: 'Unknown error' };
  }

  /**
   * Get status of a pending action
   */
  async getActionStatus(confirmationId: string): Promise<ActionStatusResponse> {
    const response = await api.get<ActionStatusResponse>(
      `/chatbot/actions/${confirmationId}/status`
    );
    return response.data || ({} as ActionStatusResponse);
  }

  /**
   * Get AI suggestions
   */
  async getSuggestions(context?: string) {
    const response = await api.get('/chatbot/suggestions', {
      params: { context },
    });
    return response.data || [];
  }
}

export const chatApi = new ChatApiClient();
