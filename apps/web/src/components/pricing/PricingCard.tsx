'use client';

import { CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PricingTier {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  highlighted?: boolean;
  badge?: string;
}

interface PricingCardProps {
  tier: PricingTier;
  isAnnual: boolean;
  index: number;
}

export function PricingCard({ tier, isAnnual, index }: PricingCardProps) {
  const price = isAnnual ? tier.annualPrice : tier.monthlyPrice;

  // Format price with German number format (comma instead of period)
  const formatGermanPrice = (num: number): string => {
    if (num === 0) return 'Kostenlos';
    // Check if it's a whole number or has decimals
    const hasDecimals = num % 1 !== 0;
    return `€${hasDecimals ? num.toFixed(2).replace('.', ',') : num}`;
  };

  const priceDisplay = formatGermanPrice(price);
  const period = price === 0 ? '' : isAnnual ? '/Jahr' : '/Monat';

  // Calculate savings for annual plans
  const annualSavings = tier.monthlyPrice > 0 && isAnnual
    ? Math.round(((tier.monthlyPrice * 12 - tier.annualPrice) / (tier.monthlyPrice * 12)) * 100)
    : 0;

  return (
    <div
      className={`pricing-card relative flex flex-col p-8 rounded-[var(--radius-xl)] border-2 transition-all duration-300 ${
        tier.highlighted
          ? 'border-[var(--color-primary)] shadow-xl scale-105 bg-[var(--color-surface)]'
          : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-lg bg-[var(--color-surface)]'
      }`}
      style={{
        opacity: 0,
        transform: 'translateY(30px)',
      }}
      data-index={index}
    >
      {tier.highlighted && tier.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {tier.badge}
        </div>
      )}

      <div className="flex-1">
        <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          {tier.name}
        </h3>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          {tier.description}
        </p>

        <div className="mb-8">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {priceDisplay}
            </span>
            {period && (
              <span className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                {period}
              </span>
            )}
          </div>
          {isAnnual && price > 0 && annualSavings > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold text-white"
                style={{ backgroundColor: 'var(--color-success)' }}
              >
                ~{annualSavings}% sparen
              </span>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {formatGermanPrice(price / 12)}/Monat, jährlich abgerechnet
              </p>
            </div>
          )}
        </div>

        <ul className="space-y-4 mb-8">
          {tier.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-accent-light)' }}
              >
                <CheckIcon className="w-3 h-3" style={{ color: 'var(--color-primary)' }} />
              </div>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        className={`w-full ${
          tier.highlighted
            ? 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white'
            : 'bg-[var(--color-background)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)]'
        }`}
        asChild
      >
        <a href={tier.ctaLink}>{tier.cta}</a>
      </Button>
    </div>
  );
}
