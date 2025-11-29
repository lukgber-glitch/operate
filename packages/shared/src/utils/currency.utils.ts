/**
 * Currency and number formatting utilities
 */

/**
 * Format number to German currency format (1.234,56 EUR)
 */
export function formatCurrencyDE(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format number with German decimal format (comma as decimal separator)
 */
export function formatNumberDE(value: number, decimals: number = 2): string {
  return value.toFixed(decimals).replace('.', ',');
}

/**
 * Parse German number format to number (1.234,56 -> 1234.56)
 */
export function parseGermanNumber(value: string): number {
  return parseFloat(value.replace(/\./g, '').replace(',', '.'));
}

/**
 * Round to specified decimal places
 */
export function roundTo(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}
