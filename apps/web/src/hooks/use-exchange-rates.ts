'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CurrencyCode, ExchangeRate } from '@/types/currency';
import { currencyApi } from '@/lib/currency/currency-api';

interface ExchangeRatesState {
  rates: ExchangeRate[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching and caching exchange rates
 */
export function useExchangeRates(baseCurrency?: CurrencyCode) {
  const [state, setState] = useState<ExchangeRatesState>({
    rates: [],
    loading: false,
    error: null,
  });

  // Cache for exchange rates (in-memory)
  const [cache, setCache] = useState<Record<string, ExchangeRate>>({});

  /**
   * Fetch all rates for a base currency
   */
  const fetchRates = useCallback(async (base: CurrencyCode) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const rates = await currencyApi.getExchangeRates(base);

      // Update cache
      const newCache: Record<string, ExchangeRate> = {};
      rates.forEach((rate) => {
        const key = `${rate.from}-${rate.to}`;
        newCache[key] = rate;
      });
      setCache((prev) => ({ ...prev, ...newCache }));

      setState({ rates, loading: false, error: null });
      return rates;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to fetch rates';
      setState({ rates: [], loading: false, error });
      throw err;
    }
  }, []);

  /**
   * Get a specific rate from cache or fetch it
   */
  const getRate = useCallback(
    async (from: CurrencyCode, to: CurrencyCode): Promise<ExchangeRate | null> => {
      // Check cache first
      const cacheKey = `${from}-${to}`;
      if (cache[cacheKey]) {
        return cache[cacheKey];
      }

      // Fetch from API
      try {
        const rate = await currencyApi.getExchangeRate(from, to);
        setCache((prev) => ({ ...prev, [cacheKey]: rate }));
        return rate;
      } catch (err) {        return null;
      }
    },
    [cache]
  );

  /**
   * Convert amount using cached or fetched rate
   */
  const convertAmount = useCallback(
    async (amount: number, from: CurrencyCode, to: CurrencyCode): Promise<number | null> => {
      if (from === to) return amount;

      const rate = await getRate(from, to);
      if (!rate) return null;

      return amount * rate.rate;
    },
    [getRate]
  );

  /**
   * Refresh rates
   */
  const refresh = useCallback(() => {
    if (baseCurrency) {
      return fetchRates(baseCurrency);
    }
    return undefined;
  }, [baseCurrency, fetchRates]);

  // Auto-fetch on mount if base currency provided
  useEffect(() => {
    if (baseCurrency) {
      fetchRates(baseCurrency);
    }
  }, [baseCurrency, fetchRates]);

  return {
    rates: state.rates,
    loading: state.loading,
    error: state.error,
    fetchRates,
    getRate,
    convertAmount,
    refresh,
    cache,
  };
}
