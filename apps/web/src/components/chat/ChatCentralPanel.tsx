'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect, useState, useCallback } from 'react';
import { Send, Loader2, Paperclip, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChatMessage, Message } from './ChatMessage';
import { GuruLoader } from '@/components/ui/guru-loader';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface ChatCentralPanelProps {
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  showAttachment?: boolean;
  showVoice?: boolean;
  emptyStateContent?: React.ReactNode;
}

// Animation variants
const panelVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 25,
    },
  },
};

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

/**
 * ChatCentralPanel - A centered, rectangular chat container
 *
 * This is the main chat interface component designed to be the
 * central focus of the page, not a floating overlay.
 *
 * Features:
 * - Glassmorphic design with rounded corners
 * - Auto-scroll to latest message
 * - Loading state with GuruLoader
 * - Customizable empty state
 * - Attachment and voice input buttons
 * - Accessible keyboard navigation
 * - Morphing message animations
 */
export function ChatCentralPanel({
  messages,
  onSendMessage,
  isLoading = false,
  disabled = false,
  placeholder = 'Ask anything about your business...',
  className,
  showAttachment = true,
  showVoice = true,
  emptyStateContent,
}: ChatCentralPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle send
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || disabled) return;

    const content = input.trim();
    setInput('');
    await onSendMessage(content);

    // Refocus input
    textareaRef.current?.focus();
  }, [input, isLoading, disabled, onSendMessage]);

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Reset height to auto to get proper scrollHeight
    e.target.style.height = 'auto';
    // Set to scrollHeight but cap at max
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  const hasMessages = messages.length > 0;

  return (
    <motion.div
      className={cn(
        'flex flex-col rounded-2xl overflow-hidden border',
        'h-full min-h-[400px] max-h-[80vh]',
        className
      )}
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderColor: 'var(--color-blue-200)',
        boxShadow: 'var(--shadow-lg)',
      }}
      variants={prefersReducedMotion ? undefined : panelVariants}
      initial="hidden"
      animate="visible"
      role="region"
      aria-label="Chat conversation"
    >
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 md:p-6">
        {hasMessages ? (
          <div className="space-y-4" role="log" aria-live="polite">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  variants={prefersReducedMotion ? undefined : messageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                >
                  <ChatMessage message={message} />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                className="flex items-center gap-3 py-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <GuruLoader size="sm" />
                <span
                  className="text-sm animate-pulse"
                  style={{ color: 'var(--color-blue-600)' }}
                >
                  Thinking...
                </span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        ) : (
          // Empty State
          <div className="h-full flex flex-col items-center justify-center py-12">
            {emptyStateContent || (
              <>
                <GuruLoader size="lg" className="mb-6 opacity-40" />
                <p
                  className="text-lg text-center"
                  style={{ color: 'var(--color-blue-600)' }}
                >
                  Start a conversation
                </p>
                <p
                  className="text-sm text-center mt-2"
                  style={{ color: 'var(--color-blue-400)' }}
                >
                  Ask me anything about your business
                </p>
              </>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div
        className="p-4 border-t"
        style={{
          borderColor: 'var(--color-blue-200)',
          background: 'rgba(227, 242, 253, 0.3)',
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end gap-2"
        >
          {/* Attachment Button */}
          {showAttachment && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-10 w-10 rounded-xl hover:bg-blue-100/80"
              disabled={disabled}
              aria-label="Attach file"
            >
              <Paperclip className="h-5 w-5" style={{ color: 'var(--color-blue-500)' }} />
            </Button>
          )}

          {/* Text Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className={cn(
                'min-h-[44px] max-h-[150px] py-3 px-4 resize-none',
                'rounded-xl border-blue-200 focus:border-blue-400',
                'focus:ring-2 focus:ring-blue-200 focus:ring-offset-0',
                'placeholder:text-blue-400'
              )}
              style={{
                background: 'white',
              }}
              rows={1}
              aria-label="Message input"
            />
          </div>

          {/* Voice Button */}
          {showVoice && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-10 w-10 rounded-xl hover:bg-blue-100/80"
              disabled={disabled}
              aria-label="Voice input"
            >
              <Mic className="h-5 w-5" style={{ color: 'var(--color-blue-500)' }} />
            </Button>
          )}

          {/* Send Button */}
          <Button
            type="submit"
            size="icon"
            className={cn(
              'shrink-0 h-10 w-10 rounded-xl',
              'transition-all duration-200'
            )}
            style={{
              background: input.trim()
                ? 'var(--color-blue-600)'
                : 'var(--color-blue-300)',
            }}
            disabled={!input.trim() || isLoading || disabled}
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <Send className="h-5 w-5 text-white" />
            )}
          </Button>
        </form>

        {/* Hint text */}
        <p
          className="text-xs mt-2 text-center"
          style={{ color: 'var(--color-blue-400)' }}
        >
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </motion.div>
  );
}

export default ChatCentralPanel;
