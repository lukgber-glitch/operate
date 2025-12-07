'use client';

import { useRef, useEffect } from 'react';
import {
  FileText,
  Receipt,
  Calculator,
  ArrowRightLeft,
  Mail,
  TrendingUp,
  AlertTriangle,
  Calendar,
  DollarSign,
  Users,
  X,
} from 'lucide-react';
import { gsap } from 'gsap';

import { useSuggestions, ChatbotSuggestion } from '@/hooks/useSuggestions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProactiveSuggestionsProps {
  /**
   * Page context to filter suggestions (e.g., 'finance.invoices')
   */
  context?: string;
  /**
   * Maximum number of suggestions to display
   */
  limit?: number;
  /**
   * Custom class name for the container
   */
  className?: string;
  /**
   * Callback when a suggestion is executed
   */
  onExecute?: (suggestionId: string) => void;
  /**
   * Callback when a suggestion is dismissed
   */
  onDismiss?: (suggestionId: string) => void;
}

/**
 * ProactiveSuggestions Component
 *
 * Displays AI-generated suggestions from the backend with:
 * - Type-based icons and styling
 * - Priority indicators
 * - GSAP stagger animation on appear
 * - Execute and dismiss actions
 *
 * Suggestion types:
 * - INVOICE_REMINDER: Overdue or upcoming invoices
 * - TAX_DEADLINE: Tax filing deadlines
 * - EXPENSE_ANOMALY: Unusual expense patterns
 * - CASH_FLOW: Cash flow alerts and predictions
 * - CLIENT_FOLLOWUP: Client follow-up reminders
 * - COMPLIANCE: Compliance requirements
 * - OPTIMIZATION: Business optimization tips
 * - INSIGHT: Financial insights
 *
 * @example
 * ```tsx
 * <ProactiveSuggestions
 *   context="finance.invoices"
 *   limit={5}
 *   onExecute={(id) => console.log('Execute:', id)}
 *   onDismiss={(id) => console.log('Dismiss:', id)}
 * />
 * ```
 */
export function ProactiveSuggestions({
  context,
  limit = 5,
  className,
  onExecute,
  onDismiss,
}: ProactiveSuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    suggestions,
    isLoading,
    error,
    executeSuggestion,
    dismissSuggestion,
    refresh,
  } = useSuggestions({ context, limit });

  // Stagger animation when suggestions appear
  useEffect(() => {
    if (!suggestions.length || isLoading) return;

    const cards = containerRef.current?.children;
    if (!cards || cards.length === 0) return;

    // Animate cards appearing with stagger
    gsap.fromTo(
      cards,
      {
        opacity: 0,
        y: 30,
        scale: 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'all', // Clean up inline styles after animation
      }
    );
  }, [suggestions, isLoading]);

  const handleExecute = async (suggestionId: string) => {
    await executeSuggestion(suggestionId);
    onExecute?.(suggestionId);
  };

  const handleDismiss = async (suggestionId: string) => {
    const card = document.querySelector(`[data-suggestion-id="${suggestionId}"]`);

    // Animate out before dismissing
    if (card) {
      await gsap.to(card, {
        opacity: 0,
        x: 50,
        duration: 0.3,
        ease: 'power2.in',
      });
    }

    await dismissSuggestion(suggestionId);
    onDismiss?.(suggestionId);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-gray-100 animate-pulse rounded-lg"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={cn('p-4 bg-red-50 border border-red-200 rounded-lg', className)}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-900">Failed to load suggestions</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            className="text-red-700 hover:text-red-900"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!suggestions.length) {
    return (
      <div className={cn('p-6 text-center bg-gray-50 rounded-lg border border-gray-200', className)}>
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full mb-3">
          <TrendingUp className="h-6 w-6 text-gray-500" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">All caught up!</h3>
        <p className="text-sm text-gray-600">No suggestions at the moment. Check back later.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('space-y-3', className)}>
      {suggestions.map((suggestion) => {
        const config = getSuggestionConfig(suggestion.type);
        const priorityConfig = getPriorityConfig(suggestion.priority);

        return (
          <div
            key={suggestion.id}
            data-suggestion-id={suggestion.id}
            className={cn(
              'suggestion-card',
              'bg-white rounded-lg p-4 border-l-4 shadow-sm',
              'hover:shadow-md transition-shadow duration-200',
              config.borderColor
            )}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-md shrink-0',
                  config.iconBg
                )}
              >
                <config.icon className={cn('h-5 w-5', config.iconColor)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                    {suggestion.title}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        priorityConfig.bgColor,
                        priorityConfig.textColor
                      )}
                    >
                      {suggestion.priority}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                  {suggestion.description}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {suggestion.actionLabel && (
                    <Button
                      size="sm"
                      onClick={() => handleExecute(suggestion.id)}
                      className={cn('h-8 text-xs', config.buttonClass)}
                    >
                      {suggestion.actionLabel}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(suggestion.id)}
                    className="h-8 text-xs text-gray-600 hover:text-gray-900"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>

              {/* Dismiss X button (alternative position) */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDismiss(suggestion.id)}
                className="h-6 w-6 shrink-0 -mt-1 -mr-1 text-gray-400 hover:text-gray-600"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Get styling configuration based on suggestion type
 */
function getSuggestionConfig(type: string) {
  switch (type) {
    case 'INVOICE_REMINDER':
      return {
        icon: FileText,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-50',
        borderColor: 'border-l-blue-500',
        buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
      };
    case 'TAX_DEADLINE':
      return {
        icon: Calculator,
        iconColor: 'text-orange-600',
        iconBg: 'bg-orange-50',
        borderColor: 'border-l-orange-500',
        buttonClass: 'bg-orange-600 hover:bg-orange-700 text-white',
      };
    case 'EXPENSE_ANOMALY':
      return {
        icon: AlertTriangle,
        iconColor: 'text-red-600',
        iconBg: 'bg-red-50',
        borderColor: 'border-l-red-500',
        buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
      };
    case 'CASH_FLOW':
      return {
        icon: TrendingUp,
        iconColor: 'text-green-600',
        iconBg: 'bg-green-50',
        borderColor: 'border-l-green-500',
        buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
      };
    case 'CLIENT_FOLLOWUP':
      return {
        icon: Users,
        iconColor: 'text-purple-600',
        iconBg: 'bg-purple-50',
        borderColor: 'border-l-purple-500',
        buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white',
      };
    case 'COMPLIANCE':
      return {
        icon: Receipt,
        iconColor: 'text-yellow-600',
        iconBg: 'bg-yellow-50',
        borderColor: 'border-l-yellow-500',
        buttonClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      };
    case 'OPTIMIZATION':
      return {
        icon: TrendingUp,
        iconColor: 'text-indigo-600',
        iconBg: 'bg-indigo-50',
        borderColor: 'border-l-indigo-500',
        buttonClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      };
    case 'INSIGHT':
      return {
        icon: TrendingUp,
        iconColor: 'text-teal-600',
        iconBg: 'bg-teal-50',
        borderColor: 'border-l-teal-500',
        buttonClass: 'bg-teal-600 hover:bg-teal-700 text-white',
      };
    default:
      return {
        icon: Mail,
        iconColor: 'text-gray-600',
        iconBg: 'bg-gray-50',
        borderColor: 'border-l-gray-500',
        buttonClass: 'bg-gray-600 hover:bg-gray-700 text-white',
      };
  }
}

/**
 * Get styling configuration based on priority level
 */
function getPriorityConfig(priority: string) {
  switch (priority) {
    case 'URGENT':
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
      };
    case 'HIGH':
      return {
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
      };
    case 'MEDIUM':
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
      };
    case 'LOW':
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
      };
    default:
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
      };
  }
}
