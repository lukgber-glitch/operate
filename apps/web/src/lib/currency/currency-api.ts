/**
 * Currency API Client
 * Handles all currency-related API calls
 */

import type { Currency, CurrencyCode, ExchangeRate, CurrencyConversion } from '@/types/currency';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Get organization ID from window (set during auth)
 */
function getOrgId(): string | null {
  if (typeof window === 'undefined') return null;
  return (window as any).__orgId || null;
}

/**
 * Base fetch wrapper with credentials
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const orgId = getOrgId();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  if (orgId) {
    headers['X-Org-Id'] = orgId;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Include cookies
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get all supported currencies
 */
export async function getCurrencies(): Promise<Currency[]> {
  return apiFetch<Currency[]>('/currency/currencies');
}

/**
 * Get a single currency by code
 */
export async function getCurrency(code: CurrencyCode): Promise<Currency> {
  return apiFetch<Currency>(`/currency/currencies/${code}`);
}

/**
 * Get exchange rate between two currencies
 */
export async function getExchangeRate(
  from: CurrencyCode,
  to: CurrencyCode
): Promise<ExchangeRate> {
  return apiFetch<ExchangeRate>(`/currency/rates/${from}/${to}`);
}

/**
 * Get all exchange rates for a base currency
 */
export async function getExchangeRates(base: CurrencyCode): Promise<ExchangeRate[]> {
  return apiFetch<ExchangeRate[]>(`/currency/rates/${base}`);
}

/**
 * Convert amount between currencies
 */
export async function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): Promise<CurrencyConversion> {
  return apiFetch<CurrencyConversion>('/currency/convert', {
    method: 'POST',
    body: JSON.stringify({ amount, from, to }),
  });
}

/**
 * Convert multiple amounts at once (batch)
 */
export interface BatchConversionRequest {
  amount: number;
  from: CurrencyCode;
  to: CurrencyCode;
}

export async function convertCurrencyBatch(
  conversions: BatchConversionRequest[]
): Promise<CurrencyConversion[]> {
  return apiFetch<CurrencyConversion[]>('/currency/convert/batch', {
    method: 'POST',
    body: JSON.stringify({ conversions }),
  });
}

export const currencyApi = {
  getCurrencies,
  getCurrency,
  getExchangeRate,
  getExchangeRates,
  convertCurrency,
  convertCurrencyBatch,
};
