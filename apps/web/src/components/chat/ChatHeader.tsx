'use client';

import { Minimize2, Maximize2, X, Plus, Circle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
  onNewConversation?: () => void;
  isOnline?: boolean;
  title?: string;
}

/**
 * ChatHeader - Header component for the chat interface
 *
 * Features:
 * - Title with online/offline indicator
 * - Expand/minimize toggle
 * - New conversation button
 * - Close button
 * - Keyboard accessible
 */
export function ChatHeader({
  isExpanded,
  onToggleExpand,
  onClose,
  onNewConversation,
  isOnline = true,
  title = 'AI Assistant',
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
      {/* Left section - Title and status */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'h-2 w-2 rounded-full',
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          )}
          aria-label={isOnline ? 'Online' : 'Offline'}
        />
        <span className="font-semibold text-sm">{title}</span>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-1">
        {onNewConversation && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onNewConversation}
              aria-label="Start new conversation"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-4" />
          </>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleExpand}
          aria-label={isExpanded ? 'Minimize chat' : 'Maximize chat'}
        >
          {isExpanded ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
          aria-label="Close chat"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
