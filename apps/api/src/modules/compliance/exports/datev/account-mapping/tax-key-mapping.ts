/**
 * DATEV Tax Key Mapping (BU-Schlüssel)
 * Maps German VAT rates to DATEV tax keys
 *
 * Reference: DATEV BU-Schlüssel documentation
 */

import { TaxKey } from './interfaces/skr-account.interface';

/**
 * Standard DATEV tax keys for output tax (sales)
 */
export const OUTPUT_TAX_KEYS: TaxKey[] = [
  {
    key: '3',
    vatRate: 19,
    description: '19% Umsatzsteuer (Standard rate)',
    type: 'output',
  },
  {
    key: '2',
    vatRate: 7,
    description: '7% Umsatzsteuer (Reduced rate)',
    type: 'output',
  },
  {
    key: '8',
    vatRate: 0,
    description: 'Steuerfrei (Tax-free)',
    type: 'output',
  },
  {
    key: '0',
    vatRate: 0,
    description: 'Keine USt (No VAT)',
    type: 'output',
  },
  {
    key: '9',
    vatRate: 0,
    description: 'Innergemeinschaftliche Lieferung (Intra-community supply)',
    type: 'output',
  },
  {
    key: '10',
    vatRate: 0,
    description: 'Ausfuhrlieferung (Export)',
    type: 'output',
  },
];

/**
 * Standard DATEV tax keys for input tax (purchases)
 */
export const INPUT_TAX_KEYS: TaxKey[] = [
  {
    key: '8',
    vatRate: 19,
    description: '19% Vorsteuer (Standard rate input)',
    type: 'input',
  },
  {
    key: '9',
    vatRate: 7,
    description: '7% Vorsteuer (Reduced rate input)',
    type: 'input',
  },
  {
    key: '0',
    vatRate: 0,
    description: 'Keine Vorsteuer (No input VAT)',
    type: 'input',
  },
  {
    key: '70',
    vatRate: 0,
    description: 'Innergemeinschaftlicher Erwerb (Intra-community acquisition)',
    type: 'input',
  },
  {
    key: '93',
    vatRate: 19,
    description: 'Reverse Charge 19%',
    type: 'input',
  },
  {
    key: '94',
    vatRate: 7,
    description: 'Reverse Charge 7%',
    type: 'input',
  },
];

/**
 * All tax keys combined
 */
export const ALL_TAX_KEYS = [...OUTPUT_TAX_KEYS, ...INPUT_TAX_KEYS];

/**
 * Get tax key by VAT rate and type
 */
export function getTaxKey(
  vatRate: number,
  type: 'input' | 'output',
): string | null {
  const keys = type === 'output' ? OUTPUT_TAX_KEYS : INPUT_TAX_KEYS;

  const taxKey = keys.find((tk) => tk.vatRate === vatRate);
  return taxKey ? taxKey.key : null;
}

/**
 * Get tax key description
 */
export function getTaxKeyDescription(key: string): string | null {
  const taxKey = ALL_TAX_KEYS.find((tk) => tk.key === key);
  return taxKey ? taxKey.description : null;
}

/**
 * Get VAT rate from tax key
 */
export function getVATRateFromTaxKey(key: string): number | null {
  const taxKey = ALL_TAX_KEYS.find((tk) => tk.key === key);
  return taxKey ? taxKey.vatRate : null;
}

/**
 * Validate tax key
 */
export function isValidTaxKey(key: string): boolean {
  return ALL_TAX_KEYS.some((tk) => tk.key === key);
}
