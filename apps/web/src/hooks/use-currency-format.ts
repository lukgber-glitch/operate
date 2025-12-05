'use client';

import { useMemo, useCallback } from 'react';
import type { CurrencyCode, CurrencyFormatOptions } from '@/types/currency';
import { useCurrency } from './use-currency';

/**
 * Hook for locale-aware currency formatting
 */
export function useCurrencyFormat(defaultCurrency?: CurrencyCode, defaultLocale?: string) {
  const { formatAmount: baseFormat, parseAmount: baseParse } = useCurrency();

  /**
   * Format amount with currency
   */
  const format = useCallback(
    (amount: number, currency?: CurrencyCode, options?: CurrencyFormatOptions) => {
      const currencyCode = currency || defaultCurrency;
      if (!currencyCode) {
        return amount.toString();
      }

      const opts = {
        ...options,
        locale: options?.locale || defaultLocale,
      };

      return baseFormat(amount, currencyCode, opts);
    },
    [baseFormat, defaultCurrency, defaultLocale]
  );

  /**
   * Format with symbol
   */
  const formatWithSymbol = useCallback(
    (amount: number, currency?: CurrencyCode) => {
      const currencyCode = currency || defaultCurrency;
      if (!currencyCode) return amount.toString();

      return baseFormat(amount, currencyCode, { showSymbol: true, showCode: false });
    },
    [baseFormat, defaultCurrency]
  );

  /**
   * Format with code
   */
  const formatWithCode = useCallback(
    (amount: number, currency?: CurrencyCode) => {
      const currencyCode = currency || defaultCurrency;
      if (!currencyCode) return amount.toString();

      return baseFormat(amount, currencyCode, { showSymbol: false, showCode: true });
    },
    [baseFormat, defaultCurrency]
  );

  /**
   * Format in compact notation (1.2M, 500K)
   */
  const formatCompact = useCallback(
    (amount: number, currency?: CurrencyCode) => {
      const currencyCode = currency || defaultCurrency;
      if (!currencyCode) return amount.toString();

      return baseFormat(amount, currencyCode, { compact: true, showSymbol: true });
    },
    [baseFormat, defaultCurrency]
  );

  /**
   * Parse formatted string back to number
   */
  const parse = useCallback(
    (value: string, currency?: CurrencyCode): number => {
      const currencyCode = currency || defaultCurrency;
      if (!currencyCode) return 0;

      return baseParse(value, currencyCode);
    },
    [baseParse, defaultCurrency]
  );

  return {
    format,
    formatWithSymbol,
    formatWithCode,
    formatCompact,
    parse,
  };
}
