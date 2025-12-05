/**
 * Command Palette Modal Component
 * Main modal container for the command palette
 */

'use client';

import * as React from 'react';
import { CommandDialog, Command } from '@/components/ui/command';
import { useCommandPalette } from '@/hooks/useCommandPalette';

export interface CommandPaletteModalProps {
  children: React.ReactNode;
}

export function CommandPaletteModal({ children }: CommandPaletteModalProps) {
  const { isOpen, close } = useCommandPalette();

  return (
    <CommandDialog open={isOpen} onOpenChange={close}>
      <Command className="rounded-lg border shadow-md">
        {children}
      </Command>
    </CommandDialog>
  );
}
