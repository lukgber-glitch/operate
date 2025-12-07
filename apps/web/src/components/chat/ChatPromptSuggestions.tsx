'use client';

import { useState, useMemo } from 'react';
import {
  MessageSquare,
  FileText,
  Calculator,
  TrendingUp,
  Users,
  Banknote,
  Receipt,
  Calendar,
  Search,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Chat prompt category
 */
export type PromptCategory =
  | 'getting-started'
  | 'invoices'
  | 'expenses'
  | 'tax'
  | 'cash-flow'
  | 'hr'
  | 'reports'
  | 'banking';

/**
 * Chat prompt suggestion
 */
export interface ChatPrompt {
  id: string;
  text: string;
  category: PromptCategory;
  description?: string;
  isNew?: boolean;
  isPro?: boolean;
}

/**
 * Default chat prompts organized by category
 * These help users learn what the AI can do
 */
export const CHAT_PROMPTS: ChatPrompt[] = [
  // Getting Started
  {
    id: 'gs-1',
    text: 'What can you help me with?',
    category: 'getting-started',
    description: 'Discover all AI capabilities',
    isNew: true,
  },
  {
    id: 'gs-2',
    text: 'How do I get started with Operate?',
    category: 'getting-started',
    description: 'Quick start guide',
  },
  {
    id: 'gs-3',
    text: 'Show me a summary of my business',
    category: 'getting-started',
    description: 'Overview of your finances',
  },

  // Invoices
  {
    id: 'inv-1',
    text: 'Create an invoice for €500 consulting services',
    category: 'invoices',
    description: 'AI-assisted invoice creation',
  },
  {
    id: 'inv-2',
    text: 'Which invoices are overdue?',
    category: 'invoices',
    description: 'Track unpaid invoices',
  },
  {
    id: 'inv-3',
    text: 'Send a payment reminder for invoice #1234',
    category: 'invoices',
    description: 'Automated reminders',
  },
  {
    id: 'inv-4',
    text: 'How much revenue did I make this month?',
    category: 'invoices',
    description: 'Revenue tracking',
  },

  // Expenses
  {
    id: 'exp-1',
    text: 'Record a €150 office supply expense',
    category: 'expenses',
    description: 'Quick expense entry',
  },
  {
    id: 'exp-2',
    text: 'What are my biggest expense categories?',
    category: 'expenses',
    description: 'Expense analysis',
  },
  {
    id: 'exp-3',
    text: 'Which expenses are tax deductible?',
    category: 'expenses',
    description: 'Tax deduction guidance',
  },

  // Tax
  {
    id: 'tax-1',
    text: 'What is my current VAT liability?',
    category: 'tax',
    description: 'VAT tracking',
  },
  {
    id: 'tax-2',
    text: 'When is my next tax filing deadline?',
    category: 'tax',
    description: 'Tax calendar reminders',
  },
  {
    id: 'tax-3',
    text: 'Help me prepare my quarterly VAT return',
    category: 'tax',
    description: 'ELSTER/FinanzOnline filing',
    isPro: true,
  },
  {
    id: 'tax-4',
    text: 'What tax deductions am I missing?',
    category: 'tax',
    description: 'Deduction optimization',
    isPro: true,
  },

  // Cash Flow
  {
    id: 'cf-1',
    text: 'What is my current cash balance?',
    category: 'cash-flow',
    description: 'Real-time balance',
  },
  {
    id: 'cf-2',
    text: 'How long will my cash last at current burn rate?',
    category: 'cash-flow',
    description: 'Runway calculation',
  },
  {
    id: 'cf-3',
    text: 'Show me my cash flow forecast for next 30 days',
    category: 'cash-flow',
    description: 'AI predictions',
    isPro: true,
  },
  {
    id: 'cf-4',
    text: 'What if I hire 2 new employees?',
    category: 'cash-flow',
    description: 'Scenario planning',
    isPro: true,
  },

  // HR
  {
    id: 'hr-1',
    text: 'Help me hire a new employee',
    category: 'hr',
    description: 'Employee onboarding',
    isNew: true,
  },
  {
    id: 'hr-2',
    text: 'I need to request vacation leave',
    category: 'hr',
    description: 'Leave management',
    isNew: true,
  },
  {
    id: 'hr-3',
    text: 'Show me pending leave requests to approve',
    category: 'hr',
    description: 'Leave approvals',
  },
  {
    id: 'hr-4',
    text: 'What is the payroll cost this month?',
    category: 'hr',
    description: 'Payroll overview',
  },

  // Reports
  {
    id: 'rep-1',
    text: 'Generate a profit & loss report for this quarter',
    category: 'reports',
    description: 'Financial reports',
  },
  {
    id: 'rep-2',
    text: 'Show me accounts receivable aging',
    category: 'reports',
    description: 'AR aging report',
  },
  {
    id: 'rep-3',
    text: 'Compare my revenue to last month',
    category: 'reports',
    description: 'Performance comparison',
  },

  // Banking
  {
    id: 'bank-1',
    text: 'Categorize my recent bank transactions',
    category: 'banking',
    description: 'Auto-classification',
  },
  {
    id: 'bank-2',
    text: 'Match transactions to invoices',
    category: 'banking',
    description: 'Reconciliation',
    isPro: true,
  },
  {
    id: 'bank-3',
    text: 'Find recurring charges in my bank account',
    category: 'banking',
    description: 'Recurring detection',
  },
];

/**
 * Category configuration
 */
const CATEGORY_CONFIG: Record<PromptCategory, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = {
  'getting-started': {
    label: 'Getting Started',
    icon: Sparkles,
    color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-950',
  },
  'invoices': {
    label: 'Invoices',
    icon: FileText,
    color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950',
  },
  'expenses': {
    label: 'Expenses',
    icon: Receipt,
    color: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-950',
  },
  'tax': {
    label: 'Tax & VAT',
    icon: Calculator,
    color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950',
  },
  'cash-flow': {
    label: 'Cash Flow',
    icon: TrendingUp,
    color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950',
  },
  'hr': {
    label: 'HR & Payroll',
    icon: Users,
    color: 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-950',
  },
  'reports': {
    label: 'Reports',
    icon: Banknote,
    color: 'text-teal-600 bg-teal-100 dark:text-teal-400 dark:bg-teal-950',
  },
  'banking': {
    label: 'Banking',
    icon: Calendar,
    color: 'text-cyan-600 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-950',
  },
};

interface ChatPromptSuggestionsProps {
  onSelectPrompt: (prompt: string) => void;
  className?: string;
  maxVisible?: number;
  showCategories?: boolean;
}

/**
 * ChatPromptSuggestions - Display example prompts to help users
 *
 * Features:
 * - Category filtering
 * - New/Pro badges
 * - Random selection for variety
 * - Click to use prompt
 */
export function ChatPromptSuggestions({
  onSelectPrompt,
  className,
  maxVisible = 6,
  showCategories = true,
}: ChatPromptSuggestionsProps) {
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | 'all'>('all');

  // Filter and shuffle prompts
  const displayedPrompts = useMemo(() => {
    let filtered = CHAT_PROMPTS;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Prioritize new items, then shuffle
    const newItems = filtered.filter(p => p.isNew);
    const otherItems = filtered.filter(p => !p.isNew);

    // Simple shuffle for variety
    const shuffled = [...otherItems].sort(() => Math.random() - 0.5);

    return [...newItems, ...shuffled].slice(0, maxVisible);
  }, [selectedCategory, maxVisible]);

  const categories = Object.entries(CATEGORY_CONFIG) as [PromptCategory, typeof CATEGORY_CONFIG[PromptCategory]][];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Category pills */}
      {showCategories && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="h-8"
          >
            <MessageSquare className="h-3.5 w-3.5 me-1.5" />
            All
          </Button>
          {categories.map(([key, config]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(key)}
              className="h-8"
            >
              <config.icon className="h-3.5 w-3.5 me-1.5" />
              {config.label}
            </Button>
          ))}
        </div>
      )}

      {/* Prompt cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayedPrompts.map((prompt) => {
          const config = CATEGORY_CONFIG[prompt.category];
          const Icon = config.icon;

          return (
            <button
              key={prompt.id}
              onClick={() => onSelectPrompt(prompt.text)}
              className={cn(
                'group flex items-start gap-3 p-4 rounded-lg border text-left',
                'transition-all duration-200',
                'hover:border-primary hover:bg-primary/5 hover:shadow-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/20'
              )}
            >
              <div className={cn('p-2 rounded-md shrink-0', config.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                    {prompt.text}
                  </span>
                  {prompt.isNew && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      NEW
                    </Badge>
                  )}
                  {prompt.isPro && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-purple-500 to-pink-500">
                      PRO
                    </Badge>
                  )}
                </div>
                {prompt.description && (
                  <p className="text-xs text-muted-foreground">
                    {prompt.description}
                  </p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
            </button>
          );
        })}
      </div>

      {/* Help text */}
      <p className="text-xs text-center text-muted-foreground">
        <Search className="h-3 w-3 inline-block me-1" />
        Click a prompt to try it, or type your own question
      </p>
    </div>
  );
}

/**
 * Compact version for sidebar or minimal display
 */
export function ChatPromptPills({
  onSelectPrompt,
  className,
  maxVisible = 4,
}: Omit<ChatPromptSuggestionsProps, 'showCategories'>) {
  const prompts = useMemo(() => {
    // Get a mix of categories
    const byCategory = CHAT_PROMPTS.reduce((acc, prompt) => {
      if (!acc[prompt.category]) acc[prompt.category] = [];
      acc[prompt.category].push(prompt);
      return acc;
    }, {} as Record<PromptCategory, ChatPrompt[]>);

    // Take one from each category, prioritizing new ones
    const selected: ChatPrompt[] = [];
    for (const category of Object.keys(byCategory) as PromptCategory[]) {
      const categoryPrompts = byCategory[category];
      if (!categoryPrompts || categoryPrompts.length === 0) continue;

      const newOne = categoryPrompts.find(p => p.isNew);
      if (newOne) {
        selected.push(newOne);
      } else {
        const randomPrompt = categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];
        if (randomPrompt) {
          selected.push(randomPrompt);
        }
      }
    }

    return selected.slice(0, maxVisible);
  }, [maxVisible]);

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {prompts.map((prompt) => (
        <button
          key={prompt.id}
          onClick={() => onSelectPrompt(prompt.text)}
          className={cn(
            'px-3 py-1.5 text-sm rounded-full border',
            'bg-muted/50 hover:bg-muted hover:border-primary/50',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/20'
          )}
        >
          {prompt.text}
        </button>
      ))}
    </div>
  );
}
