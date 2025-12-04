'use client';

import { Send, Paperclip, Mic, Loader2 } from 'lucide-react';
import { useRef, useState, KeyboardEvent, ChangeEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  onAttachment?: (file: File) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
  showAttachment?: boolean;
  showVoice?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * ChatInput - Multi-line input component for chat messages
 *
 * Features:
 * - Auto-expanding textarea
 * - Send on Enter, new line on Shift+Enter
 * - Character counter
 * - Attachment button
 * - Voice input placeholder
 * - Loading state
 * - Keyboard shortcuts
 */
export function ChatInput({
  onSend,
  onAttachment,
  disabled = false,
  isLoading = false,
  placeholder = 'Type your message... (Shift + Enter for new line)',
  maxLength = 2000,
  showAttachment = true,
  showVoice = false,
  value: controlledValue,
  onChange: controlledOnChange,
}: ChatInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Support both controlled and uncontrolled usage
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const setValue = controlledOnChange || setInternalValue;

  const handleSend = () => {
    const trimmedValue = value.trim();
    if (!trimmedValue || disabled || isLoading) return;

    onSend(trimmedValue);
    setValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setValue(newValue);
    }

    // Auto-expand textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAttachment) {
      onAttachment(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const remainingChars = maxLength - value.length;
  const showCounter = value.length > maxLength * 0.8;

  return (
    <div className="p-4 border-t bg-background">
      <div className="flex gap-2">
        {/* Left buttons */}
        <div className="flex items-end gap-1">
          {showAttachment && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={handleAttachmentClick}
                disabled={disabled || isLoading}
                aria-label="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
                aria-label="File upload input"
              />
            </>
          )}

          {showVoice && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              disabled={disabled || isLoading}
              aria-label="Voice input (coming soon)"
              title="Voice input (coming soon)"
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Textarea */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={cn(
              'min-h-[40px] max-h-[200px] resize-none',
              'py-2.5 pe-12',
              showCounter && 'pb-6'
            )}
            aria-label="Message input"
          />

          {/* Character counter */}
          {showCounter && (
            <span
              className={cn(
                'absolute bottom-2 end-2 text-xs',
                remainingChars < 100 ? 'text-destructive' : 'text-muted-foreground'
              )}
              aria-live="polite"
            >
              {remainingChars}
            </span>
          )}
        </div>

        {/* Send button */}
        <div className="flex items-end">
          <Button
            onClick={handleSend}
            disabled={!value.trim() || disabled || isLoading}
            size="icon"
            className="h-10 w-10 shrink-0"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-xs text-muted-foreground mt-2 px-1">
        Press Enter to send, Shift + Enter for new line
      </p>
    </div>
  );
}
