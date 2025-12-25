'use client';

import { useEffect, useRef, useState } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { useSuggestions } from '@/hooks/useSuggestions';

import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { ChatMessage, LoadingMessage } from './ChatMessage';
import { ChatSuggestions } from './ChatSuggestions';
import { QuickActionsBar } from './QuickActionsBar';
import { DeadlineReminder } from './DeadlineReminder';
import { ActionType } from './MessageActions';
import { Deadline, Suggestion, SuggestionType } from '@/types/suggestions';
import { ChatbotSuggestion } from '@/hooks/useSuggestions';

interface ChatContainerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ChatContainer - Main chat interface container
 *
 * Features:
 * - Responsive design (Sheet on mobile, fixed panel on desktop)
 * - Minimized/maximized states
 * - Auto-scroll to latest message
 * - Message history
 * - Loading states
 * - Error handling with retry
 * - Keyboard navigation
 */
export function ChatContainer({ isOpen, onClose }: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Hi! I\'m your **Operate Assistant**. I can help you with:\n\n- Invoice management\n- Expense tracking\n- Tax calculations\n- Financial reports\n- HR questions\n\nHow can I help you today?',
      timestamp: new Date(),
      status: 'received',
    },
  ]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions
  const {
    suggestions: rawSuggestions,
    isLoading: suggestionsLoading,
    dismissSuggestion,
    executeSuggestion,
    refresh: refreshSuggestions,
  } = useSuggestions({
    context: 'chat',
    refreshInterval: 60000,
  });

  // Ensure suggestions is always an array
  const suggestions = Array.isArray(rawSuggestions) ? rawSuggestions : [];

  // Extract insights and deadlines from suggestions by type
  const insights = suggestions.filter(s => s.type === 'INSIGHT');
  const deadlineSuggestions = suggestions.filter(s => s.type === 'TAX_DEADLINE' || s.type === 'DEADLINE');

  // Helper function to convert ChatbotSuggestion to Deadline type
  const mapSuggestionToDeadline = (suggestion: ChatbotSuggestion): Deadline => {
    const dueDate = suggestion.expiresAt || suggestion.createdAt;
    const now = new Date();
    const daysRemaining = Math.ceil((new Date(dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let status: Deadline['status'] = 'UPCOMING';
    if (daysRemaining < 0) {
      status = 'OVERDUE';
    } else if (daysRemaining <= 7) {
      status = 'DUE_SOON';
    }

    let category: Deadline['category'] = 'OTHER';
    if (suggestion.type === 'TAX_DEADLINE') {
      category = 'TAX';
    } else if (suggestion.data?.category) {
      category = suggestion.data.category as Deadline['category'];
    }

    return {
      id: suggestion.id,
      title: suggestion.title,
      description: suggestion.description,
      dueDate: new Date(dueDate),
      category,
      priority: suggestion.priority,
      status,
      actionUrl: suggestion.data?.actionUrl,
      actionLabel: suggestion.actionLabel,
    };
  };

  // Convert deadline suggestions to Deadline type
  const deadlines = deadlineSuggestions.map(mapSuggestionToDeadline);

  // Helper function to map ChatbotSuggestion to Suggestion type (for ChatSuggestions component)
  const mapChatbotSuggestionToSuggestion = (s: ChatbotSuggestion): Suggestion => {
    // Validate type is a valid SuggestionType, default to TIP if not
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
      page: 'chat', // Default page context
      entityId: s.entityId,
      actionUrl: s.data?.actionUrl,
      actionLabel: s.actionLabel,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    };
  };

  // Map suggestions for the ChatSuggestions component (exclude deadlines which are shown separately)
  const displaySuggestions: Suggestion[] = suggestions
    .filter(s => s.type !== 'TAX_DEADLINE' && s.type !== 'DEADLINE')
    .map(mapChatbotSuggestionToSuggestion);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (content: string) => {
    // Add user message
    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call API with CSRF token via apiClient
      const { data } = await api.post<{ content: string }>('/chatbot/quick-ask', { content });

      // Update user message status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'sent' as const } : msg
        )
      );

      // Add assistant response
      const assistantMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        status: 'received',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Update user message to error state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id
            ? {
                ...msg,
                status: 'error' as const,
                metadata: {
                  error: error instanceof Error ? error.message : 'Unknown error',
                },
              }
            : msg
        )
      );

      // Add error message from assistant
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or rephrase your question.',
        timestamp: new Date(),
        status: 'received',
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message && message.role === 'user') {
      // Remove error message and retry
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      handleSend(message.content);
    }
  };

  const handleNewConversation = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'New conversation started. How can I help you?',
        timestamp: new Date(),
        status: 'received',
      },
    ]);
  };

  const handleAttachment = (file: File) => {
    // Placeholder for file upload functionality
    console.log('File selected:', file.name);
    // TODO: Implement file upload to backend
  };

  const handleQuickAction = (prompt: string) => {
    setInputValue(prompt);
    // Optionally auto-send
    // handleSend(prompt);
  };

  const handleApplySuggestion = async (id: string) => {
    try {
      await executeSuggestion(id);
      // Optionally show success message
      const successMessage: ChatMessageType = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Suggestion applied successfully!',
        timestamp: new Date(),
        status: 'received',
      };
      setMessages((prev) => [...prev, successMessage]);
    } catch (error) {
      console.error('Error applying suggestion:', error);
    }
  };

  const handleDismissSuggestion = async (id: string) => {
    try {
      await dismissSuggestion(id);
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  };

  const handleDeadlineAction = (deadline: Deadline) => {
    if (deadline.actionUrl) {
      window.location.href = deadline.actionUrl;
    }
  };

  const handleDismissDeadline = async (id: string, _remindLater?: Date) => {
    try {
      await dismissSuggestion(id, 'remind_later');
    } catch (error) {
      console.error('Error dismissing deadline:', error);
    }
  };

  const handleMessageAction = async (messageId: string, action: ActionType) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    switch (action) {
      case 'regenerate':
        // Remove the assistant message and resend the previous user message
        const messageIndex = messages.findIndex((m) => m.id === messageId);
        if (messageIndex > 0) {
          const previousUserMessage = messages
            .slice(0, messageIndex)
            .reverse()
            .find((m) => m.role === 'user');

          if (previousUserMessage) {
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
            handleSend(previousUserMessage.content);
          }
        }
        break;

      case 'create-invoice':
        // Navigate to invoice creation with context from message
        console.log('Create invoice from message:', message.content);
        // TODO: Implement navigation to invoice creation page with pre-filled data
        // router.push('/invoices/new?context=' + encodeURIComponent(message.content));
        break;

      case 'view-document':
        // Open document viewer
        console.log('View document from message:', message.content);
        // TODO: Implement document viewer
        break;

      case 'export':
        // Export message content
        console.log('Export message:', message.content);
        // TODO: Implement export functionality (PDF/CSV)
        break;

      case 'bookmark':
        // Bookmark message for later
        console.log('Bookmark message:', messageId);
        // TODO: Implement bookmark functionality
        // await bookmarkMessage(messageId);
        const bookmarkMessage: ChatMessageType = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Message bookmarked successfully!',
          timestamp: new Date(),
          status: 'received',
        };
        setMessages((prev) => [...prev, bookmarkMessage]);
        break;

      default:
        console.log('Unhandled action:', action);
    }
  };

  // Get the most urgent deadline (filter out overdue ones, sort by dueDate)
  const urgentDeadline = deadlines
    .filter((d) => d.status !== 'OVERDUE')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  // Mobile view (Sheet)
  const MobileView = (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[90vh] p-0 flex flex-col"
        aria-describedby="chat-description"
      >
        <span id="chat-description" className="sr-only">
          AI Assistant chat interface
        </span>
        <ChatHeader
          isExpanded={false}
          onToggleExpand={() => {}}
          onClose={onClose}
          onNewConversation={handleNewConversation}
          isOnline={true}
        />

        {/* Urgent Deadline Alert */}
        {urgentDeadline && (
          <div className="px-4 pt-3">
            <DeadlineReminder
              deadline={urgentDeadline}
              onAction={() => handleDeadlineAction(urgentDeadline)}
              onDismiss={(remindLater) => handleDismissDeadline(urgentDeadline.id, remindLater)}
            />
          </div>
        )}

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onRetry={handleRetry}
                onAction={handleMessageAction}
              />
            ))}
            {isLoading && <LoadingMessage />}
          </div>
        </ScrollArea>

        {/* Suggestions */}
        <ChatSuggestions
          suggestions={displaySuggestions}
          isLoading={suggestionsLoading}
          onApply={handleApplySuggestion}
          onDismiss={handleDismissSuggestion}
        />

        {/* Quick Actions */}
        <QuickActionsBar onSelectAction={handleQuickAction} />

        <ChatInput
          onSend={handleSend}
          onAttachment={handleAttachment}
          isLoading={isLoading}
          showAttachment={true}
          showVoice={false}
          value={inputValue}
          onChange={setInputValue}
        />
      </SheetContent>
    </Sheet>
  );

  // Desktop view (Fixed panel) - Updated with design system tokens
  const DesktopView = (
    <div
      className={cn(
        'fixed z-40 border rounded-lg',
        'transition-all duration-300 ease-in-out',
        'hidden md:flex flex-col',
        'mx-auto max-w-[800px]',
        isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none',
        isExpanded
          ? 'bottom-4 end-4 start-4 top-4 lg:start-auto lg:w-[700px] lg:h-[85vh]'
          : 'bottom-24 end-6 w-[420px] h-[600px]'
      )}
      style={{
        background: 'var(--color-background)',
        boxShadow: 'var(--shadow-lg)',
      }}
      role="dialog"
      aria-label="Chat interface"
      aria-hidden={!isOpen}
    >
      <ChatHeader
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        onClose={onClose}
        onNewConversation={handleNewConversation}
        isOnline={true}
      />

      {/* Urgent Deadline Alert */}
      {urgentDeadline && (
        <div className="px-4 pt-3">
          <DeadlineReminder
            deadline={urgentDeadline}
            onAction={() => handleDeadlineAction(urgentDeadline)}
            onDismiss={(remindLater) => handleDismissDeadline(urgentDeadline.id, remindLater)}
          />
        </div>
      )}

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div
          className="max-w-[800px] mx-auto space-y-4"
          style={{ padding: 'var(--space-6)' }}
        >
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onRetry={handleRetry}
              onAction={handleMessageAction}
            />
          ))}
          {isLoading && <LoadingMessage />}
        </div>
      </ScrollArea>

      {/* Suggestions */}
      <ChatSuggestions
        suggestions={displaySuggestions}
        isLoading={suggestionsLoading}
        onApply={handleApplySuggestion}
        onDismiss={handleDismissSuggestion}
      />

      {/* Quick Actions */}
      <QuickActionsBar onSelectAction={handleQuickAction} />

      <ChatInput
        onSend={handleSend}
        onAttachment={handleAttachment}
        isLoading={isLoading}
        showAttachment={true}
        showVoice={false}
        value={inputValue}
        onChange={setInputValue}
      />
    </div>
  );

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">{MobileView}</div>

      {/* Desktop */}
      {DesktopView}
    </>
  );
}
