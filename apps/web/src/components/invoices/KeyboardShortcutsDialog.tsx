/**
 * Keyboard Shortcuts Dialog
 * Displays available keyboard shortcuts for invoice review
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const shortcuts = [
    {
      category: 'Review Actions',
      items: [
        { key: 'A', description: 'Approve current extraction' },
        { key: 'R', description: 'Reject current extraction' },
        { key: 'E', description: 'Toggle edit mode' },
      ],
    },
    {
      category: 'Navigation',
      items: [
        { key: '→', description: 'Next extraction' },
        { key: '←', description: 'Previous extraction' },
        { key: 'Esc', description: 'Close dialog' },
      ],
    },
    {
      category: 'General',
      items: [
        { key: '?', description: 'Show keyboard shortcuts' },
        { key: 'Ctrl + S', description: 'Save changes (in edit mode)' },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>
            Use these keyboard shortcuts to speed up your invoice review workflow
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded"
                  >
                    <span className="text-sm">{item.description}</span>
                    <Badge variant="secondary" className="font-mono">
                      {item.key}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t text-sm text-muted-foreground">
          <p>
            💡 Tip: Press <kbd className="px-2 py-1 bg-muted rounded">?</kbd> at
            any time to show this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
