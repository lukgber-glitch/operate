'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GuruLoader } from '@/components/ui/guru-loader';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  className?: string;
}

/**
 * TypingIndicator - Shows animated logo when AI is thinking/typing
 *
 * Features:
 * - Animated guru logo with spinning face arc
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
      {/* Avatar with animated logo */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-muted">
          <GuruLoader size={24} aria-hidden="true" />
        </AvatarFallback>
      </Avatar>

      {/* Thinking message */}
      <div className="rounded-lg px-4 py-3 bg-muted flex items-center min-h-[44px]">
        <span className="text-sm text-muted-foreground">Thinking...</span>
      </div>
    </div>
  );
}
