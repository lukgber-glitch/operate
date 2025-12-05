'use client';

import { Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  className?: string;
}

/**
 * TypingIndicator - Shows animated dots when AI is thinking/typing
 *
 * Features:
 * - Three-dot bounce animation
 * - Consistent styling with ChatMessage
 * - Accessible with aria-live
 */
export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        'flex gap-3 animate-in fade-in-50 slide-in-from-bottom-2 duration-300',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="AI is thinking"
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-muted">
          <Bot className="h-4 w-4" aria-hidden="true" />
        </AvatarFallback>
      </Avatar>

      {/* Animated dots */}
      <div className="rounded-lg px-4 py-3 bg-muted flex items-center min-h-[44px]">
        <div className="flex gap-1.5">
          <span
            className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}
