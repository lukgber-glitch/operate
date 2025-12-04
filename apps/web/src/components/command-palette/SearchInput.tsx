/**
 * Search Input Component
 * Input field for the command palette with auto-focus
 */

'use client';

import * as React from 'react';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { CommandInput } from '@/components/ui/command';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search for invoices, expenses, clients, or navigate...',
}: SearchInputProps) {
  return (
    <div className="flex items-center border-b px-3">
      <MagnifyingGlassIcon className="mr-2 h-5 w-5 shrink-0 opacity-50" />
      <CommandInput
        value={value}
        onValueChange={onChange}
        placeholder={placeholder}
        className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        autoFocus
      />
    </div>
  );
}
