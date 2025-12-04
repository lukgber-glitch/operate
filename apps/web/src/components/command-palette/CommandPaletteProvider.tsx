/**
 * Command Palette Provider
 * Provides global command palette functionality to the app
 */

'use client';

import * as React from 'react';
import { CommandPalette } from './CommandPalette';
import { useCommandPaletteShortcut } from '@/hooks/useCommandPalette';

interface CommandPaletteProviderProps {
  children: React.ReactNode;
}

export function CommandPaletteProvider({
  children,
}: CommandPaletteProviderProps) {
  // Set up global keyboard shortcut (Cmd+K / Ctrl+K)
  useCommandPaletteShortcut();

  return (
    <>
      {children}
      <CommandPalette />
    </>
  );
}
