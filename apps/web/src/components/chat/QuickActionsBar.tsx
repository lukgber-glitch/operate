'use client';

import {
  FileText,
  Receipt,
  Calculator,
  BarChart3,
  Users,
  LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QuickAction, DEFAULT_QUICK_ACTIONS } from '@/types/suggestions';

interface QuickActionsBarProps {
  onSelectAction: (prompt: string) => void;
  actions?: QuickAction[];
  className?: string;
}

/**
 * QuickActionsBar - Fixed row of common quick actions
 *
 * Features:
 * - Pre-defined common actions
 * - Icon + text on desktop, icon-only on mobile
 * - Click to pre-fill chat input
 * - Keyboard shortcuts (optional)
 * - Responsive layout
 */
export function QuickActionsBar({
  onSelectAction,
  actions = DEFAULT_QUICK_ACTIONS,
  className,
}: QuickActionsBarProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const handleAction = (action: QuickAction) => {
    setActiveAction(action.id);
    onSelectAction(action.prompt);

    // Reset active state after animation
    setTimeout(() => setActiveAction(null), 300);
  };

  const iconMap: Record<string, LucideIcon> = {
    FileText,
    Receipt,
    Calculator,
    BarChart3,
    Users,
  };

  return (
    <div className={cn('py-2 px-4 border-t bg-background', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground hidden sm:block">
          Quick:
        </span>

        <div className="flex gap-2 flex-1 justify-start sm:justify-start overflow-x-auto">
          {actions.map((action) => {
            const Icon = iconMap[action.icon] || FileText;

            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className={cn(
                  'gap-2 transition-all shrink-0',
                  activeAction === action.id && 'scale-95 bg-accent'
                )}
                onClick={() => handleAction(action)}
                title={action.label}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{action.label}</span>
                {action.shortcut && (
                  <kbd
                    className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100"
                    aria-label={`Keyboard shortcut: ${action.shortcut}`}
                  >
                    {action.shortcut}
                  </kbd>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
