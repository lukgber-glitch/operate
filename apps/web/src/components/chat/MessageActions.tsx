'use client';

import {
  Copy,
  RefreshCw,
  FileText,
  Download,
  Bookmark,
  Check,
  Receipt,
  FolderOpen,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type ActionType =
  | 'copy'
  | 'regenerate'
  | 'create-invoice'
  | 'view-document'
  | 'export'
  | 'bookmark';

export interface MessageAction {
  type: ActionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled?: boolean;
}

interface MessageActionsProps {
  messageId: string;
  content: string;
  onAction?: (messageId: string, action: ActionType) => void;
  contextualActions?: MessageAction[];
  className?: string;
}

/**
 * MessageActions - Action buttons for chat messages
 *
 * Features:
 * - Copy to clipboard with feedback
 * - Regenerate response
 * - Contextual actions (invoice, documents, export)
 * - Bookmark important messages
 * - Hover reveal on desktop, tap on mobile
 * - Accessible tooltips
 */
export function MessageActions({
  messageId,
  content,
  onAction,
  contextualActions = [],
  className,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  // Default always-available actions
  const defaultActions: MessageAction[] = [
    {
      type: 'copy',
      label: copied ? 'Copied!' : 'Copy',
      icon: copied ? Check : Copy,
      enabled: true,
    },
    {
      type: 'regenerate',
      label: 'Regenerate',
      icon: RefreshCw,
      enabled: true,
    },
    {
      type: 'bookmark',
      label: 'Bookmark',
      icon: Bookmark,
      enabled: true,
    },
  ];

  // Combine default and contextual actions
  const actions = [...defaultActions, ...contextualActions];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleAction = (action: ActionType) => {
    if (action === 'copy') {
      handleCopy();
    } else if (onAction) {
      onAction(messageId, action);
    }
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          'focus-within:opacity-100', // Show on keyboard focus
          className
        )}
        role="toolbar"
        aria-label="Message actions"
      >
        {actions
          .filter((action) => action.enabled !== false)
          .map((action) => {
            const Icon = action.icon;
            return (
              <Tooltip key={action.type}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-7 w-7 p-0',
                      'hover:bg-muted/80 active:scale-95',
                      'transition-all duration-150',
                      action.type === 'copy' && copied && 'text-green-600'
                    )}
                    onClick={() => handleAction(action.type)}
                    aria-label={action.label}
                  >
                    <Icon
                      className={cn(
                        'h-3.5 w-3.5',
                        action.type === 'regenerate' &&
                          'hover:rotate-180 transition-transform duration-300'
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {action.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
      </div>
    </TooltipProvider>
  );
}

/**
 * Utility to detect contextual actions based on message content
 */
export function detectContextualActions(content: string): MessageAction[] {
  const actions: MessageAction[] = [];
  const lowerContent = content.toLowerCase();

  // Invoice-related keywords
  if (
    lowerContent.includes('invoice') ||
    lowerContent.includes('rechnung') ||
    lowerContent.includes('faktur')
  ) {
    actions.push({
      type: 'create-invoice',
      label: 'Create Invoice',
      icon: Receipt,
      enabled: true,
    });
  }

  // Document references
  if (
    lowerContent.includes('document') ||
    lowerContent.includes('file') ||
    lowerContent.includes('attachment') ||
    lowerContent.includes('pdf')
  ) {
    actions.push({
      type: 'view-document',
      label: 'View Document',
      icon: FolderOpen,
      enabled: true,
    });
  }

  // Export-related keywords
  if (
    lowerContent.includes('export') ||
    lowerContent.includes('download') ||
    lowerContent.includes('csv') ||
    lowerContent.includes('report')
  ) {
    actions.push({
      type: 'export',
      label: 'Export',
      icon: Download,
      enabled: true,
    });
  }

  return actions;
}
