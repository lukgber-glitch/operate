'use client';

import { Calculator, FileText, Receipt, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestionChipsProps {
  onSelect: (suggestion: string) => void;
  className?: string;
}

const suggestions = [
  {
    id: 'taxes',
    text: 'Help me with taxes',
    icon: Calculator,
  },
  {
    id: 'invoices',
    text: 'Prepare invoices for this month',
    icon: FileText,
  },
  {
    id: 'bills',
    text: 'Review client bills',
    icon: Receipt,
  },
  {
    id: 'cashflow',
    text: 'Explain my cash flow',
    icon: TrendingUp,
  },
];

export function SuggestionChips({ onSelect, className }: SuggestionChipsProps) {
  return (
    <div className={cn('flex gap-3 justify-center flex-wrap', className)}>
      {suggestions.map((suggestion) => {
        const Icon = suggestion.icon;
        return (
          <button
            key={suggestion.id}
            onClick={() => onSelect(suggestion.text)}
            className="flex items-center gap-2 px-4 py-2 shrink-0 transition-all hover:scale-105 focus-visible:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: 'var(--color-accent-3)',
              color: 'var(--color-primary)',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-sm)',
              fontWeight: '500',
              transitionDuration: 'var(--transition-fast)',
            }}
            aria-label={suggestion.text}
          >
            <Icon className="h-4 w-4" />
            <span>{suggestion.text}</span>
          </button>
        );
      })}
    </div>
  );
}
