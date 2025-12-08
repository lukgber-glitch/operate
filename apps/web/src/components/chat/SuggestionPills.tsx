'use client';

import { motion } from 'framer-motion';
import {
  Calculator,
  FileText,
  Receipt,
  TrendingUp,
  Clock,
  Mail,
  Building2,
  Sparkles,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSuggestions } from '@/hooks/useSuggestions';
import { usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface SuggestionPillsProps {
  onSelect: (suggestion: string) => void;
  className?: string;
  context?: string;
  maxItems?: number;
}

interface Pill {
  id: string;
  text: string;
  icon: LucideIcon;
  category?: string;
}

/**
 * Get smart fallback suggestions based on context and time
 */
function getFallbackSuggestions(pathname: string): Pill[] {
  const hour = new Date().getHours();
  const isMorning = hour < 12;
  const isEvening = hour >= 18;

  // Time-based primary suggestion
  const timeBased: Pill = isMorning
    ? {
        id: 'morning',
        text: "What's my focus for today?",
        icon: Sparkles,
        category: 'priority',
      }
    : isEvening
    ? {
        id: 'evening',
        text: 'Wrap up my day',
        icon: Clock,
        category: 'review',
      }
    : {
        id: 'afternoon',
        text: 'What needs attention?',
        icon: Clock,
        category: 'priority',
      };

  // Context-based suggestions
  const contextBased: Pill[] = pathname.includes('/finance')
    ? [
        { id: 'invoices', text: 'Create an invoice', icon: FileText, category: 'action' },
        { id: 'cashflow', text: 'Show cash flow', icon: TrendingUp, category: 'insight' },
      ]
    : pathname.includes('/tax')
    ? [
        { id: 'taxes', text: 'Tax prep help', icon: Calculator, category: 'action' },
        { id: 'deductions', text: 'Review deductions', icon: Receipt, category: 'insight' },
      ]
    : [
        { id: 'invoices', text: 'Create an invoice', icon: FileText, category: 'action' },
        { id: 'expenses', text: 'Log an expense', icon: Receipt, category: 'action' },
      ];

  return [
    timeBased,
    ...contextBased,
    { id: 'email', text: 'Check emails', icon: Mail, category: 'scan' },
    { id: 'banking', text: 'Bank overview', icon: Building2, category: 'insight' },
  ];
}

/**
 * Map suggestion type to icon
 */
function getIconForType(type: string): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const pillVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

/**
 * SuggestionPills - Animated, context-aware suggestion pills
 *
 * Features:
 * - Staggered entrance animation
 * - Hover/tap micro-interactions
 * - Context-aware suggestions from API or smart fallbacks
 * - Reduced motion support
 * - Glassmorphic styling
 */
export function SuggestionPills({
  onSelect,
  className,
  context,
  maxItems = 5,
}: SuggestionPillsProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const { suggestions: apiSuggestions, isLoading } = useSuggestions({
    context: context || 'chat-landing',
    limit: maxItems,
  });

  // Determine suggestions to display
  const fallbackSuggestions = getFallbackSuggestions(pathname);
  const pills: Pill[] =
    apiSuggestions.length > 0
      ? apiSuggestions.slice(0, maxItems).map((s) => ({
          id: s.id,
          text: s.title,
          icon: getIconForType(s.type),
          category: s.type.toLowerCase(),
        }))
      : fallbackSuggestions.slice(0, maxItems);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('flex gap-3 justify-center flex-wrap', className)}>
        {Array.from({ length: maxItems }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-10 w-32 rounded-full"
            style={{ background: 'var(--color-blue-200)' }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={cn('flex gap-3 justify-center flex-wrap', className)}
      variants={prefersReducedMotion ? undefined : containerVariants}
      initial="hidden"
      animate="visible"
    >
      {pills.map((pill) => {
        const Icon = pill.icon;
        return (
          <motion.button
            key={pill.id}
            onClick={() => onSelect(pill.text)}
            variants={prefersReducedMotion ? undefined : pillVariants}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05, y: -2 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 shrink-0',
              'transition-shadow focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-blue-500 focus-visible:ring-offset-2',
              'backdrop-blur-sm border'
            )}
            style={{
              background: 'rgba(227, 242, 253, 0.8)',
              borderColor: 'rgba(187, 222, 251, 0.6)',
              color: 'var(--color-blue-700)',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-sm)',
              fontWeight: '500',
              boxShadow: 'var(--shadow-sm)',
            }}
            aria-label={pill.text}
          >
            <Icon className="h-4 w-4" style={{ color: 'var(--color-blue-500)' }} />
            <span>{pill.text}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

export default SuggestionPills;
