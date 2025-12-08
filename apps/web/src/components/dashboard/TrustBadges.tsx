'use client';

import { Shield, Lock, Eye, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Badge {
  slug: string;
  label: string;
  icon: typeof Shield;
  justification: string;
  isActive: boolean;
}

/**
 * Legitimate compliance badges for Operate
 *
 * CRITICAL: Only include badges that are TRUTHFULLY applicable
 * Each badge must have documented justification
 */
const legitimateBadges: Badge[] = [
  {
    slug: 'bank-encryption',
    label: 'Bank-Level Encryption',
    icon: Lock,
    justification: 'Uses TLS 1.3 for data in transit via Helmet middleware, encrypted tokens at rest (TrueLayer, Tink, Plaid), and secure password hashing with bcrypt.',
    isActive: true,
  },
  {
    slug: 'data-privacy',
    label: 'Data Privacy',
    icon: Eye,
    justification: 'User data stored securely with PostgreSQL, no third-party analytics tracking, explicit consent flows for AI features, and user-controlled data deletion.',
    isActive: true,
  },
  {
    slug: 'secure-infrastructure',
    label: 'Secure Infrastructure',
    icon: Shield,
    justification: 'Hosted on Cloudways with daily backups, isolated tenant data, CORS protection, and comprehensive error handling without exposing sensitive details.',
    isActive: true,
  },
  {
    slug: 'audit-ready',
    label: 'Audit Trail',
    icon: FileCheck,
    justification: 'Comprehensive logging of all financial actions, timestamps on all database records, and change tracking for compliance requirements.',
    isActive: true,
  },
];

interface TrustBadgesProps {
  className?: string;
  variant?: 'compact' | 'full';
}

/**
 * TrustBadges Component
 *
 * Displays legitimate compliance and security badges
 * with tooltips explaining why each badge is earned.
 *
 * TRUTHFULNESS GUARANTEE:
 * - Only shows badges the app genuinely supports
 * - Each badge has documented justification
 * - No fake certifications or unearned claims
 */
export function TrustBadges({ className, variant = 'compact' }: TrustBadgesProps) {
  const activeBadges = legitimateBadges.filter(badge => badge.isActive);

  if (activeBadges.length === 0) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <div className={cn('flex items-center gap-2 flex-wrap', className)}>
          {activeBadges.map((badge) => {
            const Icon = badge.icon;
            return (
              <Tooltip key={badge.slug}>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-surface)] dark:bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors cursor-help">
                    <Icon className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                      {badge.label}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm">{badge.justification}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3', className)}>
        {activeBadges.map((badge) => {
          const Icon = badge.icon;
          return (
            <Tooltip key={badge.slug}>
              <TooltipTrigger asChild>
                <div className="flex items-start gap-3 p-4 rounded-[16px] bg-[var(--color-surface)] dark:bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all duration-300 cursor-help">
                  <div className="shrink-0 p-2 rounded-lg bg-[var(--color-primary)]/10">
                    <Icon className="h-5 w-5 text-[var(--color-primary)]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                      {badge.label}
                    </h4>
                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                      {badge.justification}
                    </p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-sm">
                <p className="text-sm">{badge.justification}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
