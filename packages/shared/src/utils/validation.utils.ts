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

/**
 * Validate UK VAT Registration Number (VRN)
 * Format: GB + 9 digits OR GB + 12 digits (branch traders) OR GB + "GD" + 3 digits (government departments)
 */
export function isValidUKVatNumber(vatNumber: string): boolean {
  const cleanVat = vatNumber.replace(/\s/g, '').toUpperCase();

  // Standard: GB123456789 (9 digits)
  if (/^GB\d{9}$/.test(cleanVat)) {
    return true;
  }

  // Branch traders: GB123456789001 (12 digits)
  if (/^GB\d{12}$/.test(cleanVat)) {
    return true;
  }

  // Government departments: GBGD001
  if (/^GBGD\d{3}$/.test(cleanVat)) {
    return true;
  }

  // Health authorities: GBHA\d{3}
  if (/^GBHA\d{3}$/.test(cleanVat)) {
    return true;
  }

  return false;
}

/**
 * Validate UK Companies House Number
 * Format: 8 characters (2 letters + 6 digits OR 8 digits)
 * Examples: 12345678, SC123456, NI123456
 */
export function isValidUKCompanyNumber(companyNumber: string): boolean {
  const cleanNumber = companyNumber.replace(/\s/g, '').toUpperCase();

  // 8 digits
  if (/^\d{8}$/.test(cleanNumber)) {
    return true;
  }

  // Scottish companies: SC + 6 digits
  if (/^SC\d{6}$/.test(cleanNumber)) {
    return true;
  }

  // Northern Ireland companies: NI + 6 digits
  if (/^NI\d{6}$/.test(cleanNumber)) {
    return true;
  }

  // Old format (pre-1977): 6 digits (padded to 8 with leading zeros in modern format)
  if (/^\d{6}$/.test(cleanNumber)) {
    return true;
  }

  return false;
}

/**
 * Validate UK UTR (Unique Taxpayer Reference)
 * Format: 10 digits
 */
export function isValidUKUTR(utr: string): boolean {
  const cleanUTR = utr.replace(/\s/g, '');

  // Must be exactly 10 digits
  if (!/^\d{10}$/.test(cleanUTR)) {
    return false;
  }

  // UTR check digit validation (weighted modulo 11)
  const weights = [6, 7, 8, 9, 10, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    const char = cleanUTR[i];
    const weight = weights[i];
    if (char && weight !== undefined) {
      sum += parseInt(char, 10) * weight;
    }
  }

  const checkDigit = (11 - (sum % 11)) % 11;
  const lastChar = cleanUTR[9];
  const lastDigit = lastChar ? parseInt(lastChar, 10) : -1;

  // Check digit 10 is represented as 0, 11 as 1
  const expectedCheckDigit = checkDigit === 10 ? 0 : checkDigit === 11 ? 1 : checkDigit;

  return lastDigit === expectedCheckDigit;
}

/**
 * Validate UK PAYE reference
 * Format: 3 digits + "/" + 1-10 alphanumeric characters
 * Example: 123/AB456
 */
export function isValidUKPAYEReference(payeRef: string): boolean {
  const cleanRef = payeRef.replace(/\s/g, '').toUpperCase();

  // Format: 3 digits / 1-10 alphanumeric
  return /^\d{3}\/[A-Z0-9]{1,10}$/.test(cleanRef);
}

/**
 * Validate National Insurance Number (NINO)
 * Format: 2 letters + 6 digits + 1 letter (A, B, C, or D)
 * Example: AA123456C
 */
export function isValidUKNINO(nino: string): boolean {
  const cleanNINO = nino.replace(/\s/g, '').toUpperCase();

  // Format: 2 letters + 6 digits + 1 letter (A, B, C, or D)
  if (!/^[A-Z]{2}\d{6}[ABCD]$/.test(cleanNINO)) {
    return false;
  }

  // First letter cannot be D, F, I, Q, U, or V
  const invalidFirstLetters = ['D', 'F', 'I', 'Q', 'U', 'V'];
  const firstChar = cleanNINO[0];
  if (firstChar && invalidFirstLetters.includes(firstChar)) {
    return false;
  }

  // Second letter cannot be D, F, I, O, Q, U, or V
  const invalidSecondLetters = ['D', 'F', 'I', 'O', 'Q', 'U', 'V'];
  const secondChar = cleanNINO[1];
  if (secondChar && invalidSecondLetters.includes(secondChar)) {
    return false;
  }

  // Prefix cannot be BG, GB, NK, KN, TN, NT, or ZZ
  const invalidPrefixes = ['BG', 'GB', 'NK', 'KN', 'TN', 'NT', 'ZZ'];
  const prefix = cleanNINO.substring(0, 2);
  if (invalidPrefixes.includes(prefix)) {
    return false;
  }

  return true;
}
