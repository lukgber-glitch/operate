'use client';

import * as React from 'react';
import type { CurrencyCode } from '@/types/currency';

interface CurrencyPreferences {
  // Organization default currency for transactions
  defaultCurrency: CurrencyCode;
  // User preferred display currency (for viewing reports, etc.)
  displayCurrency: CurrencyCode;
  // Currency format preferences
  formatPreferences: {
    showSymbol: boolean;
    showCode: boolean;
    compact: boolean;
  };
  // Available currencies for the organization
  availableCurrencies: CurrencyCode[];
}

interface CurrencyContextValue extends CurrencyPreferences {
  updateDefaultCurrency: (currency: CurrencyCode) => void;
  updateDisplayCurrency: (currency: CurrencyCode) => void;
  updateFormatPreferences: (prefs: Partial<CurrencyPreferences['formatPreferences']>) => void;
  updateAvailableCurrencies: (currencies: CurrencyCode[]) => void;
}

const CurrencyContext = React.createContext<CurrencyContextValue | undefined>(undefined);

const STORAGE_KEY = 'operate_currency_preferences';

interface CurrencyProviderProps {
  children: React.ReactNode;
  initialDefaultCurrency?: CurrencyCode;
  initialDisplayCurrency?: CurrencyCode;
  initialAvailableCurrencies?: CurrencyCode[];
}

/**
 * CurrencyProvider Component
 *
 * Provides currency preferences context throughout the application.
 * Handles organization default currency, user display currency, and format preferences.
 *
 * @example
 * ```tsx
 * <CurrencyProvider
 *   initialDefaultCurrency="EUR"
 *   initialAvailableCurrencies={['EUR', 'USD', 'GBP']}
 * >
 *   <App />
 * </CurrencyProvider>
 * ```
 */
export function CurrencyProvider({
  children,
  initialDefaultCurrency = 'EUR',
  initialDisplayCurrency,
  initialAvailableCurrencies = ['EUR', 'USD', 'GBP', 'CHF'],
}: CurrencyProviderProps) {
  // Load preferences from localStorage on mount
  const [preferences, setPreferences] = React.useState<CurrencyPreferences>(() => {
    if (typeof window === 'undefined') {
      return {
        defaultCurrency: initialDefaultCurrency,
        displayCurrency: initialDisplayCurrency || initialDefaultCurrency,
        formatPreferences: {
          showSymbol: true,
          showCode: false,
          compact: false,
        },
        availableCurrencies: initialAvailableCurrencies,
      };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CurrencyPreferences;
        return {
          ...parsed,
          // Override with initial values if provided
          defaultCurrency: initialDefaultCurrency || parsed.defaultCurrency,
          displayCurrency: initialDisplayCurrency || parsed.displayCurrency || initialDefaultCurrency,
          availableCurrencies: initialAvailableCurrencies.length > 0
            ? initialAvailableCurrencies
            : parsed.availableCurrencies,
        };
      }
    } catch (error) {
      // Use defaults if loading fails
    }

    return {
      defaultCurrency: initialDefaultCurrency,
      displayCurrency: initialDisplayCurrency || initialDefaultCurrency,
      formatPreferences: {
        showSymbol: true,
        showCode: false,
        compact: false,
      },
      availableCurrencies: initialAvailableCurrencies,
    };
  });

  // Persist preferences to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      // Silent fail on storage error
    }
  }, [preferences]);

  const updateDefaultCurrency = React.useCallback((currency: CurrencyCode) => {
    setPreferences((prev) => ({
      ...prev,
      defaultCurrency: currency,
      // If display currency was same as default, update it too
      displayCurrency: prev.displayCurrency === prev.defaultCurrency ? currency : prev.displayCurrency,
    }));
  }, []);

  const updateDisplayCurrency = React.useCallback((currency: CurrencyCode) => {
    setPreferences((prev) => ({
      ...prev,
      displayCurrency: currency,
    }));
  }, []);

  const updateFormatPreferences = React.useCallback(
    (prefs: Partial<CurrencyPreferences['formatPreferences']>) => {
      setPreferences((prev) => ({
        ...prev,
        formatPreferences: {
          ...prev.formatPreferences,
          ...prefs,
        },
      }));
    },
    []
  );

  const updateAvailableCurrencies = React.useCallback((currencies: CurrencyCode[]) => {
    setPreferences((prev) => ({
      ...prev,
      availableCurrencies: currencies,
    }));
  }, []);

  const value = React.useMemo(
    () => ({
      ...preferences,
      updateDefaultCurrency,
      updateDisplayCurrency,
      updateFormatPreferences,
      updateAvailableCurrencies,
    }),
    [
      preferences,
      updateDefaultCurrency,
      updateDisplayCurrency,
      updateFormatPreferences,
      updateAvailableCurrencies,
    ]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

/**
 * Hook to use currency context
 *
 * @example
 * ```tsx
 * const { defaultCurrency, displayCurrency, updateDefaultCurrency } = useCurrencyContext();
 * ```
 */
export function useCurrencyContext() {
  const context = React.useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrencyContext must be used within a CurrencyProvider');
  }
  return context;
}

/**
 * Hook to get default currency with fallback
 * Useful when CurrencyProvider might not be available
 *
 * @example
 * ```tsx
 * const defaultCurrency = useDefaultCurrency(); // Falls back to EUR if no context
 * ```
 */
export function useDefaultCurrency(): CurrencyCode {
  try {
    const { defaultCurrency } = useCurrencyContext();
    return defaultCurrency;
  } catch {
    // Fallback to EUR if context is not available
    return 'EUR';
  }
}
