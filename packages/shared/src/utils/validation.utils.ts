/**
 * Validation utility functions
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate German VAT ID (USt-IdNr)
 */
export function isValidGermanVatId(vatId: string): boolean {
  // DE + 9 digits
  const vatRegex = /^DE\d{9}$/;
  return vatRegex.test(vatId);
}

/**
 * Validate IBAN format
 */
export function isValidIBAN(iban: string): boolean {
  // Basic IBAN format check (simplified)
  const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]+$/;
  return ibanRegex.test(iban.replace(/\s/g, ''));
}

/**
 * Validate tax ID format (simplified)
 */
export function isValidTaxId(taxId: string, country: string): boolean {
  if (country === 'DE') {
    // German tax ID: 11 digits
    return /^\d{11}$/.test(taxId);
  }
  // Add other country validations as needed
  return taxId.length > 0;
}
