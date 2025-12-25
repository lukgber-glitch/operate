'use client';

import { useRef, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSuggestions, ChatbotSuggestion } from '@/hooks/useSuggestions';
import { Suggestion, SuggestionType } from '@/types/suggestions';
import { useConversationHistory } from '@/hooks/use-conversation-history';
import { useActionExecution } from '@/hooks/useActionExecution';
import { api } from '@/lib/api/client';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SuggestionCard } from './SuggestionCard';
import { ChatPromptSuggestions } from './ChatPromptSuggestions';
import { ConversationHistory } from './ConversationHistory';
import { ActionConfirmationDialog } from './ActionConfirmationDialog';
import { ActionResultCard } from './ActionResultCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChatMessage as ChatMessageType, ActionIntent, ActionType } from '@/types/chat';

interface ChatInterfaceProps {
  className?: string;
}

/**
 * ChatInterface - Full-page chat interface component
 *
 * This is the PRIMARY interface of the app, not a floating panel.
 *
 * Features:
 * - Conversation history sidebar (collapsible)
 * - Time-based greeting with user's first name
 * - 2x2 suggestion cards grid (when no active conversation)
 * - Scrollable messages area
 * - Fixed input at bottom with attachment, voice, and send buttons
 * - Auto-scroll to latest message
 * - Responsive layout with max-width constraint
 */
export function ChatInterface({ className }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { suggestions, executeSuggestion, dismissSuggestion } = useSuggestions({
    context: 'chat-interface',
  });

  const {
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    addMessage,
    updateMessage,
  } = useConversationHistory();

  const {
    isExecuting,
    pendingAction,
    result: actionResult,
    setPending,
    confirm,
    cancel,
    clearResult,
  } = useActionExecution({
    onSuccess: (result) => {
      // Add result to message metadata
      if (activeConversationId) {
        const resultMessage: ChatMessageType = {
          id: crypto.randomUUID(),
          conversationId: activeConversationId,
          role: 'assistant',
          content: result.message,
          timestamp: new Date(),
          status: 'sent',
          metadata: {
            actionResult: result,
          },
        };
        setMessages((prev) => [...prev, resultMessage]);
        addMessage(activeConversationId, resultMessage);
      }
    },
  });

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Load active conversation messages
  useEffect(() => {
    if (activeConversation) {
      setMessages(activeConversation.messages);
    } else {
      setMessages([]);
    }
  }, [activeConversation]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    // Create or get conversation
    let conversationId = activeConversationId;
    if (!conversationId) {
      const newConversation = await createConversation();
      conversationId = newConversation.id;
    }

    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      conversationId,
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'sending',
    };

    // Add to local state for immediate UI update
    setMessages((prev) => [...prev, userMessage]);
    // Add to conversation history
    addMessage(conversationId, userMessage);
    setIsLoading(true);

    try {
      // Send message to API using apiClient for CSRF support
      interface MessageResponse {
        id: string;
        content: string;
        createdAt?: string;
        actionType?: string;
        actionParams?: Record<string, unknown>;
        actionResult?: {
          success: boolean;
          message: string;
          entityId?: string;
          entityType?: string;
          data?: unknown;
        };
        actionStatus?: string;
      }
      const { data } = await api.post<MessageResponse[]>(
        `/chatbot/conversations/${conversationId}/messages`,
        { content }
      );

      // Backend returns array of [userMessage, assistantMessage]
      const [userResp, assistantResp] = data || [];

      if (!userResp || !assistantResp) {
        throw new Error('Invalid response from server');
      }

      // Update user message status
      const sentUserMessage = { ...userMessage, status: 'sent' as const, id: userResp.id };
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? sentUserMessage : msg
        )
      );
      updateMessage(conversationId, userMessage.id, { status: 'sent' });

      // Add assistant response
      const assistantMessage: ChatMessageType = {
        id: assistantResp.id,
        conversationId,
        role: 'assistant',
        content: assistantResp.content,
        timestamp: assistantResp.createdAt ? new Date(assistantResp.createdAt) : new Date(),
        status: 'sent',
        metadata: {
          actionType: assistantResp.actionType,
          actionParams: assistantResp.actionParams,
          actionResult: assistantResp.actionResult,
          actionStatus: assistantResp.actionStatus,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
      addMessage(conversationId, assistantMessage);

      // Check if the response contains an action that needs confirmation
      if (assistantResp.actionType && assistantResp.actionParams) {
        const action: ActionIntent = {
          type: assistantResp.actionType as ActionType,
          parameters: assistantResp.actionParams,
          confirmationRequired: assistantResp.actionStatus === 'pending',
          description: `${assistantResp.actionType} action`,
        };
        if (action.confirmationRequired) {
          setPending(assistantResp.id, action);
        }
      }
    } catch (error) {
      // Mark message as error
      const errorMessage = {
        ...userMessage,
        status: 'error' as const,
        metadata: {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to send message',
        },
      };
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? errorMessage : msg
        )
      );
      updateMessage(conversationId, userMessage.id, {
        status: 'error',
        metadata: errorMessage.metadata,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle retrying a failed message
  const handleRetry = (messageId: string) => {
    const message = messages.find((msg) => msg.id === messageId);
    if (message && message.role === 'user') {
      // Remove the failed message
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      // Resend it
      handleSendMessage(message.content);
    }
  };

  // Handle new conversation
  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  // Handle selecting a conversation
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  // Handle applying a suggestion
  const handleApplySuggestion = async (id: string) => {
    const suggestion = suggestions.find((s) => s.id === id);
    if (!suggestion) return;

    try {
      await executeSuggestion(id);

      // Create new conversation with suggestion
      const newConversation = await createConversation();

      // Add suggestion as a user message to start conversation
      const suggestionMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        conversationId: newConversation.id,
        role: 'user',
        content: suggestion.title,
        timestamp: new Date(),
        status: 'sent',
      };

      addMessage(newConversation.id, suggestionMessage);
      setMessages([suggestionMessage]);

      // Simulate assistant response for now
      // In production, this would trigger the actual suggestion action
      const responseMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        conversationId: newConversation.id,
        role: 'assistant',
        content: `I'm helping you with: ${suggestion.title}\n\n${suggestion.description}`,
        timestamp: new Date(),
        status: 'sent',
      };

      setTimeout(() => {
        addMessage(newConversation.id, responseMessage);
        setMessages((prev) => [...prev, responseMessage]);
      }, 500);
    } catch (error) {
      console.error('Error applying suggestion:', error);
    }
  };

  // Check if we have an active conversation
  const hasMessages = messages.length > 0;

  // Helper function to map ChatbotSuggestion to Suggestion type
  const mapToSuggestion = (s: ChatbotSuggestion): Suggestion => {
    const validTypes: SuggestionType[] = ['WARNING', 'DEADLINE', 'INSIGHT', 'QUICK_ACTION', 'TIP'];
    const type: SuggestionType = validTypes.includes(s.type as SuggestionType)
      ? (s.type as SuggestionType)
      : 'TIP';
    return {
      id: s.id,
      type,
      title: s.title,
      description: s.description,
      priority: s.priority,
      page: 'chat-interface',
      entityId: s.entityId,
      actionUrl: s.data?.actionUrl,
      actionLabel: s.actionLabel,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    };
  };

  // Get top 4 suggestions for the grid (mapped to Suggestion type)
  const topSuggestions: Suggestion[] = suggestions.slice(0, 4).map(mapToSuggestion);

  return (
    <div className={cn('flex h-full bg-background chat-container-mobile', className)}>
      {/* Conversation History Sidebar - Hidden on mobile, shown as drawer */}
      <div className="hidden md:block">
        <ConversationHistory
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="h-full chat-messages-mobile">
            <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8 mobile-content-with-nav">
            {/* Greeting Section */}
            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-semibold mb-2">
                {getGreeting()}, {user?.firstName || 'there'}!
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                How can I help you manage your business today?
              </p>
            </div>

            {/* Suggestion Cards (shown when no messages) */}
            {!hasMessages && topSuggestions.length > 0 && (
              <div className="mb-6 md:mb-8">
                {/* Desktop: Grid layout */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topSuggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onApply={handleApplySuggestion}
                      onDismiss={dismissSuggestion}
                      compact
                    />
                  ))}
                </div>

                {/* Mobile: Horizontal scroll */}
                <div className="md:hidden -mx-3">
                  <div className="suggestions-mobile">
                    {topSuggestions.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        onApply={handleApplySuggestion}
                        onDismiss={dismissSuggestion}
                        compact
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Example Prompts - Help users learn what the AI can do */}
            {!hasMessages && (
              <div className="mb-6 md:mb-8">
                <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                  Try asking me something like...
                </h3>
                <ChatPromptSuggestions
                  onSelectPrompt={(prompt) => {
                    setInputValue(prompt);
                  }}
                  maxVisible={6}
                  showCategories={true}
                />
              </div>
            )}

            {/* Messages Area */}
            {hasMessages && (
              <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
                {messages.map((message) => (
                  <div key={message.id} className="space-y-3">
                    <ChatMessage
                      message={message}
                      onRetry={handleRetry}
                    />
                    {/* Show action result card if this message has one */}
                    {message.metadata?.actionResult && (
                      <ActionResultCard result={message.metadata.actionResult} />
                    )}
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce animation-delay-150" />
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce animation-delay-300" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto-scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Empty state when no suggestions and no messages */}
            {!hasMessages && topSuggestions.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <p className="text-lg mb-2">No suggestions at the moment</p>
                <p className="text-sm">
                  Start a conversation by asking me anything about your business
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

        {/* Fixed Input Area */}
        <div className="border-t bg-background">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              onSend={(message) => {
                handleSendMessage(message);
                setInputValue('');
              }}
              value={inputValue}
              onChange={setInputValue}
              disabled={isLoading}
              isLoading={isLoading}
              placeholder="Ask anything about your business..."
              showAttachment={true}
              showVoice={true}
            />
          </div>
        </div>
      </div>

      {/* Action Confirmation Dialog */}
      <ActionConfirmationDialog
        open={!!pendingAction}
        action={pendingAction?.action || null}
        isExecuting={isExecuting}
        onConfirm={confirm}
        onCancel={cancel}
      />
    </div>
  );
}
