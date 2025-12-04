'use client';

import * as React from 'react';
import { Command } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Shortcut {
  key: string;
  description: string;
  category?: string;
}

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts: Shortcut[] = [
  { key: 'Ctrl/Cmd + K', description: 'Open command palette', category: 'General' },
  { key: 'Ctrl/Cmd + /', description: 'Show keyboard shortcuts', category: 'General' },
  { key: 'Escape', description: 'Close dialog or panel', category: 'General' },
  { key: 'Ctrl/Cmd + S', description: 'Save changes', category: 'General' },
  { key: 'Ctrl/Cmd + P', description: 'Print or export', category: 'General' },
  { key: 'G then D', description: 'Go to Dashboard', category: 'Navigation' },
  { key: 'G then I', description: 'Go to Invoices', category: 'Navigation' },
  { key: 'G then C', description: 'Go to Clients', category: 'Navigation' },
  { key: 'G then T', description: 'Go to Tax', category: 'Navigation' },
  { key: 'G then H', description: 'Go to HR', category: 'Navigation' },
  { key: 'A', description: 'Approve item (in review mode)', category: 'Actions' },
  { key: 'R', description: 'Reject item (in review mode)', category: 'Actions' },
  { key: 'E', description: 'Edit item', category: 'Actions' },
  { key: 'Arrow Left', description: 'Previous item', category: 'Navigation' },
  { key: 'Arrow Right', description: 'Next item', category: 'Navigation' },
];

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const groupedShortcuts = React.useMemo(() => {
    const groups: Record<string, Shortcut[]> = {};
    shortcuts.forEach((shortcut) => {
      const category = shortcut.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(shortcut);
    });
    return groups;
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and perform actions quickly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="mb-3 font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={`${category}-${index}`}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border border-border rounded">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          Press <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded">Ctrl/Cmd + /</kbd> anywhere to open this dialog
        </div>
      </DialogContent>
    </Dialog>
  );
}
