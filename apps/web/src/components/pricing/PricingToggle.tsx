'use client';

import { useState } from 'react';

interface PricingToggleProps {
  onToggle: (isAnnual: boolean) => void;
}

export function PricingToggle({ onToggle }: PricingToggleProps) {
  const [isAnnual, setIsAnnual] = useState(false);

  const handleToggle = (annual: boolean) => {
    setIsAnnual(annual);
    onToggle(annual);
  };

  return (
    <div className="flex items-center justify-center gap-4 mb-12">
      <button
        onClick={() => handleToggle(false)}
        className={`text-lg font-medium transition-colors ${
          !isAnnual ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
        }`}
        aria-pressed={!isAnnual}
      >
        Monthly
      </button>

      <div className="relative">
        <button
          onClick={() => handleToggle(!isAnnual)}
          className="relative w-14 h-8 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
          style={{
            backgroundColor: isAnnual ? 'var(--color-primary)' : 'var(--color-border)',
          }}
          role="switch"
          aria-checked={isAnnual}
          aria-label="Toggle annual pricing"
        >
          <span
            className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ease-in-out"
            style={{
              transform: isAnnual ? 'translateX(24px)' : 'translateX(0)',
            }}
          />
        </button>
      </div>

      <button
        onClick={() => handleToggle(true)}
        className={`text-lg font-medium transition-colors ${
          isAnnual ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
        }`}
        aria-pressed={isAnnual}
      >
        Annual
      </button>

      {isAnnual && (
        <span className="ml-2 px-3 py-1 text-sm font-medium rounded-full bg-[var(--color-accent-light)] text-[var(--color-primary-dark)]">
          Save 17%
        </span>
      )}
    </div>
  );
}
