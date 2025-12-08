'use client';

import { Calculator, FileText, Receipt, TrendingUp, Clock, Mail, Building2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSuggestions } from '@/hooks/useSuggestions';
import { usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface SuggestionChipsProps {
  onSelect: (suggestion: string) => void;
  className?: string;
  context?: string;
}

/**
 * Fallback suggestions when API doesn't return any or is loading
 */
const getFallbackSuggestions = (pathname: string) => {
  const hour = new Date().getHours();
  const isMorning = hour < 12;
  const isEvening = hour >= 18;

  // Time-based suggestions
  const timeBased = isMorning
    ? {
        id: 'morning',
        text: 'What should I focus on today?',
        icon: Sparkles,
      }
    : isEvening
    ? {
        id: 'evening',
        text: 'Review today\'s activities',
        icon: Clock,
      }
    : {
        id: 'afternoon',
        text: 'What needs my attention now?',
        icon: Clock,
      };

  // Context-based suggestions
  const contextBased = pathname.includes('/finance')
    ? [
        { id: 'invoices', text: 'Prepare invoices for this month', icon: FileText },
        { id: 'cashflow', text: 'Explain my cash flow', icon: TrendingUp },
      ]
    : pathname.includes('/tax')
    ? [
        { id: 'taxes', text: 'Help me with taxes', icon: Calculator },
        { id: 'deductions', text: 'Review tax deductions', icon: Receipt },
      ]
    : pathname.includes('/hr')
    ? [
        { id: 'payroll', text: 'Process this month\'s payroll', icon: Building2 },
        { id: 'leave', text: 'Check pending leave requests', icon: Clock },
      ]
    : [
        { id: 'invoices', text: 'Prepare invoices for this month', icon: FileText },
        { id: 'bills', text: 'Review client bills', icon: Receipt },
      ];

  return [
    timeBased,
    ...contextBased.slice(0, 2),
    { id: 'email', text: 'Check email for new documents', icon: Mail },
  ];
};

/**
 * SuggestionChips - Dynamic, context-aware suggestion chips
 *
 * Features:
 * - Fetches suggestions from API based on context
 * - Falls back to smart defaults when API is unavailable
 * - Context-aware based on current page
 * - Time-based suggestions (morning/afternoon/evening)
 * - Recent action awareness
 * - Pending task awareness
 */
export function SuggestionChips({ onSelect, className, context }: SuggestionChipsProps) {
  const pathname = usePathname();
  const { suggestions: apiSuggestions, isLoading } = useSuggestions({
    context: context || 'chat-landing',
    limit: 4,
  });

  // Determine suggestions to display
  const fallbackSuggestions = getFallbackSuggestions(pathname);

  const suggestions = apiSuggestions.length > 0
    ? apiSuggestions.slice(0, 4).map((s) => ({
        id: s.id,
        text: s.title,
        icon: getIconForSuggestionType(s.type),
      }))
    : fallbackSuggestions;

  if (isLoading) {
    return (
      <div className={cn('flex gap-3 justify-center flex-wrap', className)}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-32 rounded-full" />
        ))}
      </div>
    );
  }

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

/**
 * Map suggestion types from API to appropriate icons
 */
function getIconForSuggestionType(type: string) {
  const iconMap: Record<string, any> = {
    WARNING: Clock,
    DEADLINE: Clock,
    INSIGHT: TrendingUp,
    QUICK_ACTION: Sparkles,
    TIP: FileText,
    INVOICE: FileText,
    EXPENSE: Receipt,
    TAX: Calculator,
    BANK: Building2,
    EMAIL: Mail,
  };

  return iconMap[type] || Sparkles;
}
