'use client';

import { MessageCircle, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { ChatContainer } from './ChatContainer';

/**
 * ChatBubble - Floating action button that triggers the chat interface
 *
 * Features:
 * - Fixed position in bottom-right corner
 * - Smooth rotation animation when toggled
 * - Accessible with keyboard navigation
 * - Responsive positioning
 */
export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating action button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 end-6 z-50 h-14 w-14 rounded-full shadow-lg',
          'bg-primary hover:bg-primary/90 transition-all duration-200',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isOpen && 'rotate-90'
        )}
        size="icon"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
        )}
      </Button>

      {/* Chat container */}
      <ChatContainer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
