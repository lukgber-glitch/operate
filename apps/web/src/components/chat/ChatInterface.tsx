'use client';

import { useRef, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSuggestions } from '@/hooks/useSuggestions';
import { useConversationHistory } from '@/hooks/use-conversation-history';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SuggestionCard } from './SuggestionCard';
import { ConversationHistory } from './ConversationHistory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChatMessage as ChatMessageType } from '@/types/chat';

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
  const { suggestions, applySuggestion, dismissSuggestion } = useSuggestions({
    page: 'chat-interface',
  });

  const {
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    addMessage,
    updateMessage,
  } = useConversationHistory();

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
      const newConversation = createConversation();
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
      // Send message to API
      const response = await fetch('/api/v1/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, conversationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Update user message status
      const sentUserMessage = { ...userMessage, status: 'sent' as const };
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? sentUserMessage : msg
        )
      );
      updateMessage(conversationId, userMessage.id, { status: 'sent' });

      // Add assistant response
      const assistantMessage: ChatMessageType = {
        id: data.id,
        conversationId,
        role: 'assistant',
        content: data.content,
        timestamp: new Date(data.timestamp),
        status: 'sent',
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      addMessage(conversationId, assistantMessage);
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
      await applySuggestion(id);

      // Create new conversation with suggestion
      const newConversation = createConversation();

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

  // Get top 4 suggestions for the grid
  const topSuggestions = suggestions.slice(0, 4);

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

            {/* Messages Area */}
            {hasMessages && (
              <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onRetry={handleRetry}
                  />
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
              onSend={handleSendMessage}
              disabled={isLoading}
              isLoading={isLoading}
              placeholder="Ask anything about your business..."
              showAttachment={true}
              showVoice={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
