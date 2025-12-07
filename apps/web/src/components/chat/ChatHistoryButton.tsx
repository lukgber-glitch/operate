'use client';

import { useState } from 'react';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatHistory } from './ChatHistory';
import { cn } from '@/lib/utils';

interface ChatHistoryButtonProps {
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
}

/**
 * ChatHistoryButton - Trigger button for ChatHistory panel
 *
 * Standalone button component that can be placed anywhere in the UI
 * to trigger the conversation history dropdown/panel.
 *
 * Usage:
 * ```tsx
 * <ChatHistoryButton
 *   onNewChat={handleNewChat}
 *   onSelectConversation={handleSelectConversation}
 *   variant="ghost"
 *   showLabel={true}
 * />
 * ```
 */
export function ChatHistoryButton({
  onNewChat,
  onSelectConversation,
  variant = 'ghost',
  size = 'default',
  showLabel = false,
  className,
}: ChatHistoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleToggle}
        className={cn('gap-2', className)}
        aria-label="View conversation history"
      >
        <History className="h-5 w-5" />
        {showLabel && <span>History</span>}
      </Button>

      {isOpen && (
        <ChatHistory
          isOpen={isOpen}
          onClose={handleClose}
          onNewChat={onNewChat}
          onSelectConversation={onSelectConversation}
        />
      )}
    </>
  );
}
