'use client';

import React, { createContext, useContext, useCallback } from 'react';
import {
  useSuggestionStream,
  UseSuggestionStreamReturn,
  SuggestionEvent,
} from '@/hooks/useSuggestionStream';
import { useChatStore } from '@/stores/chatStore';
import { ConnectionStatus } from '@/components/suggestions/ConnectionStatus';
import { toast } from 'sonner';

interface SuggestionStreamContextValue extends UseSuggestionStreamReturn {
  // Additional context-specific methods can be added here
}

const SuggestionStreamContext = createContext<SuggestionStreamContextValue | null>(null);

export interface SuggestionStreamProviderProps {
  children: React.ReactNode;

  /**
   * Whether to show the connection status indicator
   * @default true
   */
  showConnectionStatus?: boolean;

  /**
   * Position of the connection status indicator
   * @default 'bottom-right'
   */
  statusPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  /**
   * Whether to show toast notifications for events
   * @default true
   */
  showToasts?: boolean;

  /**
   * Whether to auto-connect on mount
   * @default true
   */
  autoConnect?: boolean;
}

/**
 * Suggestion Stream Provider
 *
 * Wraps the application with SSE connection for real-time suggestions
 * and integrates with the chat store.
 */
export function SuggestionStreamProvider({
  children,
  showConnectionStatus = true,
  statusPosition = 'bottom-right',
  showToasts = true,
  autoConnect = true,
}: SuggestionStreamProviderProps) {
  const { addMessage, activeConversationId } = useChatStore();

  /**
   * Handle incoming suggestion events
   */
  const handleEvent = useCallback(
    (event: SuggestionEvent) => {
      console.log('[SSE] Received event:', event.type);

      switch (event.type) {
        case 'new_transaction':
          if (showToasts) {
            toast.info('New transaction detected', {
              description: `${event.data.description} - ${event.data.amount} ${event.data.currency}`,
            });
          }
          // Add AI message to chat suggesting review
          if (event.data.needsReview && activeConversationId) {
            addMessage(activeConversationId, {
              id: `msg_${Date.now()}`,
              role: 'assistant',
              content: `I've detected a new transaction that might need your attention:\n\n**${event.data.description}**\n${event.data.amount} ${event.data.currency} on ${new Date(event.data.date).toLocaleDateString()}\n\nWould you like me to help categorize this?`,
              timestamp: new Date(),
              metadata: {
                type: 'transaction_alert',
                transactionId: event.data.id,
              },
            });
          }
          break;

        case 'deadline_approaching':
          if (showToasts) {
            const urgencyEmoji =
              event.data.priority === 'urgent'
                ? '🚨'
                : event.data.priority === 'high'
                ? '⚠️'
                : 'ℹ️';
            toast.warning(`${urgencyEmoji} Deadline approaching`, {
              description: `${event.data.title} - ${event.data.daysRemaining} days remaining`,
            });
          }
          // Add reminder to chat
          if (activeConversationId) {
            addMessage(activeConversationId, {
              id: `msg_${Date.now()}`,
              role: 'assistant',
              content: `⏰ **Reminder:** ${event.data.title}\n\nDue: ${new Date(event.data.dueDate).toLocaleDateString()} (${event.data.daysRemaining} days remaining)\nPriority: ${event.data.priority.toUpperCase()}\n\nNeed help preparing for this deadline?`,
              timestamp: new Date(),
              metadata: {
                type: 'deadline_reminder',
                deadlineId: event.data.id,
                priority: event.data.priority,
              },
            });
          }
          break;

        case 'ai_suggestion':
          if (showToasts && event.data.confidence > 0.8) {
            toast.success('New AI suggestion', {
              description: event.data.title,
            });
          }
          // Add suggestion to chat if actionable
          if (event.data.actionable && activeConversationId) {
            addMessage(activeConversationId, {
              id: `msg_${Date.now()}`,
              role: 'assistant',
              content: `💡 **Suggestion:** ${event.data.title}\n\n${event.data.description}\n\nConfidence: ${Math.round(event.data.confidence * 100)}%`,
              timestamp: new Date(),
              metadata: {
                type: 'ai_suggestion',
                suggestionId: event.data.id,
                suggestionType: event.data.type,
              },
            });
          }
          break;

        case 'bank_sync_complete':
          if (showToasts) {
            toast.success('Bank sync complete', {
              description: `${event.data.count} new transactions`,
            });
          }
          if (activeConversationId) {
            addMessage(activeConversationId, {
              id: `msg_${Date.now()}`,
              role: 'assistant',
              content: `✅ Bank sync completed successfully!\n\n${event.data.count} new transactions have been imported. Would you like me to review them for categorization?`,
              timestamp: new Date(),
              metadata: {
                type: 'bank_sync',
                accountId: event.data.accountId,
                count: event.data.count,
              },
            });
          }
          break;

        case 'invoice_extracted':
          if (showToasts) {
            toast.success('Invoice extracted', {
              description: `${event.data.invoiceNumber} from ${event.data.issuer}`,
            });
          }
          if (activeConversationId) {
            addMessage(activeConversationId, {
              id: `msg_${Date.now()}`,
              role: 'assistant',
              content: `📄 **Invoice Extracted:** ${event.data.invoiceNumber}\n\nIssuer: ${event.data.issuer}\nAmount: ${event.data.amount} ${event.data.currency}\nDate: ${new Date(event.data.date).toLocaleDateString()}\n\nWould you like me to process this invoice?`,
              timestamp: new Date(),
              metadata: {
                type: 'invoice_extracted',
                invoiceId: event.data.id,
              },
            });
          }
          break;

        case 'ping':
          // Heartbeat - no action needed
          break;

        default:
          console.warn('[SSE] Unknown event type:', event);
      }
    },
    [addMessage, showToasts]
  );

  /**
   * Handle SSE errors
   */
  const handleError = useCallback(
    (error: Error) => {
      console.error('[SSE] Error:', error);
      if (showToasts) {
        toast.error('Connection error', {
          description: 'Real-time updates temporarily unavailable',
        });
      }
    },
    [showToasts]
  );

  const streamData = useSuggestionStream({
    onEvent: handleEvent,
    onError: handleError,
    autoConnect,
  });

  return (
    <SuggestionStreamContext.Provider value={streamData}>
      {children}
      {showConnectionStatus && (
        <ConnectionStatus
          state={streamData.connectionState}
          reconnectAttempts={streamData.reconnectAttempts}
          position={statusPosition}
          onReconnect={streamData.reconnect}
        />
      )}
    </SuggestionStreamContext.Provider>
  );
}

/**
 * Hook to access the suggestion stream context
 */
export function useSuggestionStreamContext(): SuggestionStreamContextValue {
  const context = useContext(SuggestionStreamContext);

  if (!context) {
    throw new Error(
      'useSuggestionStreamContext must be used within a SuggestionStreamProvider'
    );
  }

  return context;
}
