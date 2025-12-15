'use client';

import { User, AlertCircle, CheckCircle, Bot } from 'lucide-react';
import { useMemo, useRef, useLayoutEffect, memo, useCallback } from 'react';
import gsap from 'gsap';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GuruLogo } from '@/components/ui/guru-logo';
import { cn } from '@/lib/utils';
import { ChatMessage as ChatMessageType } from '@/types/chat';

// Re-export the type for backwards compatibility
export type Message = ChatMessageType;
import {
  MessageActions,
  detectContextualActions,
  ActionType,
} from './MessageActions';

interface ChatMessageProps {
  message: ChatMessageType;
  onRetry?: (messageId: string) => void;
  onAction?: (messageId: string, action: ActionType) => void;
  /** Skip animation for performance (e.g., when loading history) */
  skipAnimation?: boolean;
}

// ============================================
// Markdown Formatting Utilities (memoized)
// ============================================

// Precompiled regex patterns for better performance
const CODE_BLOCK_REGEX = /```(\w+)?\n([\s\S]*?)```/g;
const INLINE_CODE_REGEX = /`([^`]+)`/g;
const BOLD_REGEX = /\*\*([^*]+)\*\*/g;
const ITALIC_REGEX = /\*([^*]+)\*/g;
const NEWLINE_REGEX = /\n/g;

/**
 * Format message content with markdown-like syntax
 * Optimized with precompiled regex patterns
 */
function formatMessageContent(content: string): string {
  // Apply formatting in order of precedence
  return content
    // Code blocks with ```
    .replace(
      CODE_BLOCK_REGEX,
      '<pre class="bg-muted p-3 rounded-md my-2 overflow-x-auto"><code>$2</code></pre>'
    )
    // Inline code with `
    .replace(
      INLINE_CODE_REGEX,
      '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>'
    )
    // Bold with **
    .replace(BOLD_REGEX, '<strong>$1</strong>')
    // Italic with *
    .replace(ITALIC_REGEX, '<em>$1</em>')
    // Line breaks
    .replace(NEWLINE_REGEX, '<br/>');
}

// ============================================
// Time Formatting (stable reference)
// ============================================

const TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
};

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], TIME_FORMAT_OPTIONS);
}

// ============================================
// Main Component
// ============================================

/**
 * ChatMessage - Individual message display component
 *
 * Features:
 * - User vs Assistant styling
 * - Avatar with icons
 * - Timestamp display
 * - Message status indicators (including streaming)
 * - Markdown-like formatting (bold, italic, code blocks)
 * - Error state with retry option
 * - Interactive action buttons (assistant messages)
 * - Streaming cursor animation
 * - Accessible markup with aria-live for streaming
 *
 * Performance optimizations:
 * - Memoized with React.memo
 * - Precompiled regex patterns
 * - Animation runs only on mount
 * - Stable callback references
 */
function ChatMessageComponent({
  message,
  onRetry,
  onAction,
  skipAnimation = false,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isError = message.status === 'error';
  const isSending = message.status === 'sending';
  const isStreaming = message.status === 'streaming';

  // Animation ref
  const messageRef = useRef<HTMLDivElement>(null);
  // Track if animation has run (prevents re-running on re-renders)
  const hasAnimatedRef = useRef(false);

  // GSAP appear animation - only runs on initial mount
  useLayoutEffect(() => {
    if (!messageRef.current || skipAnimation || hasAnimatedRef.current) return;

    // Mark as animated
    hasAnimatedRef.current = true;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        messageRef.current,
        {
          opacity: 0,
          y: 20,
          scale: 0.9,
          x: isUser ? 20 : -20,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          x: 0,
          duration: 0.3,
          ease: 'power2.out',
        }
      );
    });

    return () => ctx.revert();
  }, []); // Empty dependency - run only on mount

  // Memoized formatted content
  const formattedContent = useMemo(
    () => formatMessageContent(message.content),
    [message.content]
  );

  // Memoized timestamp
  const formattedTime = useMemo(
    () => formatTimestamp(message.timestamp),
    [message.timestamp]
  );

  // Detect contextual actions for assistant messages
  const contextualActions = useMemo(() => {
    if (!isAssistant) return [];
    return detectContextualActions(message.content);
  }, [isAssistant, message.content]);

  // Stable retry handler
  const handleRetry = useCallback(() => {
    onRetry?.(message.id);
  }, [onRetry, message.id]);

  return (
    <div
      ref={messageRef}
      className={cn(
        'flex gap-3 group',
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
            <GuruLogo size={20} aria-hidden="true" />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Message content */}
      <div className={cn('flex flex-col gap-2 max-w-[85%]')}>
        <div
          className={cn(
            'transition-all duration-200',
            isError && 'border-2 border-destructive',
            isSending && 'opacity-70',
            isStreaming && 'relative'
          )}
          style={
            isUser
              ? {
                  background: 'var(--color-primary)',
                  color: 'white',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-2xl)',
                  borderBottomRightRadius: 'var(--radius-sm)',
                }
              : {
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-2xl)',
                  borderBottomLeftRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-sm)',
                }
          }
          role="article"
          aria-live={isStreaming ? 'polite' : undefined}
          aria-atomic={isStreaming ? 'false' : undefined}
        >
          {/* Main content */}
          <div
            className={cn(
              'text-sm prose prose-sm max-w-none inline',
              isUser
                ? 'prose-invert [&_code]:text-primary-foreground [&_pre]:bg-primary/20'
                : '[&_code]:bg-background [&_pre]:bg-background/50'
            )}
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />

          {/* Streaming cursor */}
          {isStreaming && (
            <span
              className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse align-middle"
              aria-hidden="true"
            />
          )}

          {/* Footer with timestamp and status */}
          <div
            className={cn(
              'flex items-center gap-2 mt-2',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            {/* Status indicator */}
            {(isSending || isStreaming) && (
              <div
                className="flex gap-1"
                role="status"
                aria-label={isStreaming ? 'Receiving message' : 'Sending message'}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full animate-pulse',
                    isUser ? 'bg-primary-foreground/70' : 'bg-muted-foreground'
                  )}
                />
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full animate-pulse',
                    isUser ? 'bg-primary-foreground/70' : 'bg-muted-foreground'
                  )}
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full animate-pulse',
                    isUser ? 'bg-primary-foreground/70' : 'bg-muted-foreground'
                  )}
                  style={{ animationDelay: '300ms' }}
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
                    onClick={handleRetry}
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
              {formattedTime}
            </span>
          </div>

          {/* Error message */}
          {isError && message.metadata?.error && (
            <p className="text-xs mt-2 text-destructive">
              {message.metadata.error}
            </p>
          )}
        </div>

        {/* Action buttons (assistant messages only) */}
        {isAssistant && !isSending && !isStreaming && (
          <MessageActions
            messageId={message.id}
            content={message.content}
            onAction={onAction}
            contextualActions={contextualActions}
            className={cn(isUser && 'justify-end')}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Memoized ChatMessage component
 * Only re-renders when message props actually change
 */
export const ChatMessage = memo(ChatMessageComponent, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.skipAnimation === nextProps.skipAnimation
  );
});

ChatMessage.displayName = 'ChatMessage';

/**
 * LoadingMessage - Typing indicator component with GSAP animation
 */
export function LoadingMessage() {
  const dotsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!dotsRef.current) return;

    const ctx = gsap.context(() => {
      const dots = dotsRef.current?.children;
      if (!dots) return;

      gsap.to(dots, {
        y: -6,
        duration: 0.4,
        stagger: {
          each: 0.15,
          repeat: -1,
          yoyo: true,
        },
        ease: 'power2.inOut',
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-muted">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div
        style={{
          background: 'var(--color-surface)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-2xl)',
          borderBottomLeftRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          ref={dotsRef}
          className="flex gap-1.5 items-center"
          role="status"
          aria-label="AI is thinking"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: 'var(--color-text-muted)' }}
          />
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: 'var(--color-text-muted)' }}
          />
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: 'var(--color-text-muted)' }}
          />
        </div>
      </div>
    </div>
  );
}
