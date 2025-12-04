'use client';

import { useMemo } from 'react';
import type { CurrencyCode, Currency, CurrencyFormatOptions } from '@/types/currency';
import { CURRENCY_DATA, getCurrency as getCurrencyData } from '@/lib/currency/currency-data';

/**
 * Hook for working with currency metadata and formatting
 */
export function useCurrency(code?: CurrencyCode) {
  const currency = useMemo(() => {
    return code ? getCurrencyData(code) : null;
  }, [code]);

  /**
   * Format amount with currency
   */
  const formatAmount = useMemo(() => {
    return (
      amount: number,
      currencyCode: CurrencyCode,
      options: CurrencyFormatOptions = {}
    ): string => {
      const curr = getCurrencyData(currencyCode);
      if (!curr) return amount.toString();

      const {
        showSymbol = true,
        showCode = false,
        locale = curr.locale || 'en-US',
        minimumFractionDigits = curr.decimals,
        maximumFractionDigits = curr.decimals,
        compact = false,
      } = options;

      // Format number
      let formatted: string;
      if (compact && Math.abs(amount) >= 1000) {
        // Compact notation for large numbers
        formatted = new Intl.NumberFormat(locale, {
          notation: 'compact',
          compactDisplay: 'short',
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        }).format(amount);
      } else {
        formatted = new Intl.NumberFormat(locale, {
          minimumFractionDigits,
          maximumFractionDigits,
        }).format(amount);
      }

      // Add symbol/code
      if (showSymbol && showCode) {
        return curr.format === 'before'
          ? `${curr.symbol}${formatted} ${currencyCode}`
          : `${formatted} ${curr.symbol} ${currencyCode}`;
      } else if (showSymbol) {
        return curr.format === 'before'
          ? `${curr.symbol}${formatted}`
          : `${formatted} ${curr.symbol}`;
      } else if (showCode) {
        return `${formatted} ${currencyCode}`;
      }

      return formatted;
    };
  }, []);

  /**
   * Parse formatted string back to number
   */
  const parseAmount = useMemo(() => {
    return (value: string, currencyCode: CurrencyCode): number => {
      const curr = getCurrencyData(currencyCode);
      if (!curr) return 0;

      // Remove currency symbols and non-numeric characters except decimal separators
      const cleaned = value
        .replace(new RegExp(curr.symbol, 'g'), '')
        .replace(new RegExp(currencyCode, 'g'), '')
        .replace(/[^\d.,-]/g, '')
        .replace(',', '.');

      return parseFloat(cleaned) || 0;
    };
  }, []);

  /**
   * Get currency by code
   */
  const getCurrency = useMemo(() => {
    return (code: CurrencyCode): Currency | undefined => {
      return getCurrencyData(code);
    };
  }, []);

  return {
    currency,
    formatAmount,
    parseAmount,
    getCurrency,
    allCurrencies: CURRENCY_DATA,
  };
}
