'use client';

import { Bot, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useMemo } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ChatMessage as ChatMessageType } from '@/types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
  onRetry?: (messageId: string) => void;
}

/**
 * ChatMessage - Individual message display component
 *
 * Features:
 * - User vs Assistant styling
 * - Avatar with icons
 * - Timestamp display
 * - Message status indicators
 * - Markdown-like formatting (bold, italic, code blocks)
 * - Error state with retry option
 * - Accessible markup
 */
export function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const isSending = message.status === 'sending';

  // Simple markdown-like formatting
  const formattedContent = useMemo(() => {
    let content = message.content;

    // Code blocks with ```
    content = content.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      '<pre class="bg-muted p-3 rounded-md my-2 overflow-x-auto"><code>$2</code></pre>'
    );

    // Inline code with `
    content = content.replace(
      /`([^`]+)`/g,
      '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>'
    );

    // Bold with **
    content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic with *
    content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Line breaks
    content = content.replace(/\n/g, '<br/>');

    return content;
  }, [message.content]);

  return (
    <div
      className={cn(
        'flex gap-3 group animate-in fade-in-50 slide-in-from-bottom-2 duration-300',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      role="article"
      aria-label={`${isUser ? 'User' : 'Assistant'} message`}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            'transition-colors',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}
        >
          {isUser ? (
            <User className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Bot className="h-4 w-4" aria-hidden="true" />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Message content */}
      <div
        className={cn(
          'rounded-lg px-4 py-2 max-w-[85%]',
          'transition-all duration-200',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted',
          isError && 'border-2 border-destructive',
          isSending && 'opacity-70'
        )}
      >
        {/* Main content */}
        <div
          className={cn(
            'text-sm prose prose-sm max-w-none',
            isUser
              ? 'prose-invert [&_code]:text-primary-foreground [&_pre]:bg-primary/20'
              : '[&_code]:bg-background [&_pre]:bg-background/50'
          )}
          dangerouslySetInnerHTML={{ __html: formattedContent }}
        />

        {/* Footer with timestamp and status */}
        <div
          className={cn(
            'flex items-center gap-2 mt-2',
            isUser ? 'justify-end' : 'justify-start'
          )}
        >
          {/* Status indicator */}
          {isSending && (
            <div className="flex gap-1">
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full animate-pulse',
                  isUser ? 'bg-primary-foreground/70' : 'bg-muted-foreground'
                )}
              />
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full animate-pulse animation-delay-150',
                  isUser ? 'bg-primary-foreground/70' : 'bg-muted-foreground'
                )}
              />
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full animate-pulse animation-delay-300',
                  isUser ? 'bg-primary-foreground/70' : 'bg-muted-foreground'
                )}
              />
            </div>
          )}

          {message.status === 'sent' && isUser && (
            <CheckCircle
              className={cn(
                'h-3 w-3',
                isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}
              aria-label="Message sent"
            />
          )}

          {isError && (
            <>
              <AlertCircle
                className="h-3 w-3 text-destructive"
                aria-label="Error sending message"
              />
              {onRetry && (
                <button
                  onClick={() => onRetry(message.id)}
                  className={cn(
                    'text-xs underline hover:no-underline',
                    isUser ? 'text-primary-foreground/90' : 'text-foreground'
                  )}
                  aria-label="Retry sending message"
                >
                  Retry
                </button>
              )}
            </>
          )}

          {/* Timestamp */}
          <span
            className={cn(
              'text-xs',
              isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Error message */}
        {isError && message.metadata?.error && (
          <p className="text-xs mt-2 text-destructive">
            {message.metadata.error}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * LoadingMessage - Typing indicator component
 */
export function LoadingMessage() {
  return (
    <div className="flex gap-3 animate-in fade-in-50">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-muted">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="rounded-lg px-4 py-3 bg-muted">
        <div className="flex gap-1.5" role="status" aria-label="AI is thinking">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce animation-delay-150" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce animation-delay-300" />
        </div>
      </div>
    </div>
  );
}
