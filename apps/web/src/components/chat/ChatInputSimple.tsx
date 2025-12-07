'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Mic } from 'lucide-react';
import { VoiceInputButton } from './VoiceInputButton';
import { IconButton } from '@/components/ui/icon-button';

interface ChatInputSimpleProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * ChatInputSimple - Minimal chat input for the redesigned chat page
 *
 * Matches the design spec:
 * - Simple rounded input (12px radius)
 * - Voice button on the right
 * - Brand colors and minimal design
 */
export function ChatInputSimple({
  onSend,
  disabled = false,
  placeholder = 'Ask anything...',
}: ChatInputSimpleProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setValue(transcript);
    inputRef.current?.focus();
  };

  return (
    <div className="flex items-center gap-3">
      {/* Input field */}
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-[12px] border bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text-primary)] transition-all duration-200 border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-0 placeholder:text-[var(--color-text-muted)] disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Voice button */}
      <VoiceInputButton
        onTranscript={handleVoiceTranscript}
        disabled={disabled}
        className="shrink-0 h-10 w-10"
      />
    </div>
  );
}
