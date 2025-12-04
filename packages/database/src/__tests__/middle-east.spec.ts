/**
 * Middle East Tax Validation Tests
 * Task: W28-T4 - Middle East tax rules (VAT 5%/15%)
 */

import {
  validateSaudiTRN,
  validateUAETRN,
  validateSaudiIBAN,
  validateUAEIBAN,
  validateSaudiCR,
  validateUAETradeLicense,
  formatSaudiTRN,
  formatUAETRN,
  formatIBAN,
  validateTRN,
  validateIBAN,
  extractBankCode,
  calculateMiddleEastVAT,
  calculateNetFromGross,
} from '../validators/middle-east.validator';

describe('Middle East Tax Validators', () => {
  // ============================================================================
  // SAUDI ARABIA TRN VALIDATION
  // ============================================================================

  describe('validateSaudiTRN', () => {
    it('should validate correct Saudi TRN', () => {
      // Valid Saudi TRNs starting with 3 (15 digits with Luhn check)
      expect(validateSaudiTRN('300123456789003')).toBe(true);
      expect(validateSaudiTRN('310000000000007')).toBe(true);
    });

    it('should reject TRN not starting with 3', () => {
      expect(validateSaudiTRN('100123456789003')).toBe(false);
      expect(validateSaudiTRN('200123456789003')).toBe(false);
    });

    it('should reject TRN with incorrect length', () => {
      expect(validateSaudiTRN('30012345678900')).toBe(false); // 14 digits
      expect(validateSaudiTRN('3001234567890033')).toBe(false); // 16 digits
    });

    it('should reject TRN with invalid Luhn check', () => {
      expect(validateSaudiTRN('300123456789001')).toBe(false); // Invalid check digit
    });

    it('should handle formatted TRNs', () => {
      expect(validateSaudiTRN('300 123 456 789 003')).toBe(true);
      expect(validateSaudiTRN('300-123-456-789-003')).toBe(true);
    });

    it('should reject empty or invalid input', () => {
      expect(validateSaudiTRN('')).toBe(false);
      expect(validateSaudiTRN(null as any)).toBe(false);
      expect(validateSaudiTRN(undefined as any)).toBe(false);
    });
  });

  // ============================================================================
  // UAE TRN VALIDATION
  // ============================================================================

  describe('validateUAETRN', () => {
    it('should validate correct UAE TRN', () => {
      // Valid UAE TRNs (15 digits with check digit)
      expect(validateUAETRN('100123456789012')).toBe(true);
      expect(validateUAETRN('100000000000003')).toBe(true);
    });

    it('should reject TRN with incorrect length', () => {
      expect(validateUAETRN('10012345678901')).toBe(false); // 14 digits
      expect(validateUAETRN('1001234567890123')).toBe(false); // 16 digits
    });

    it('should handle formatted TRNs', () => {
      expect(validateUAETRN('100-1234-5678-901-2')).toBe(true);
      expect(validateUAETRN('100 1234 5678 9012')).toBe(true);
    });

    it('should reject empty or invalid input', () => {
      expect(validateUAETRN('')).toBe(false);
      expect(validateUAETRN(null as any)).toBe(false);
      expect(validateUAETRN(undefined as any)).toBe(false);
    });
  });

  // ============================================================================
  // SAUDI ARABIA IBAN VALIDATION
  // ============================================================================

  describe('validateSaudiIBAN', () => {
    it('should validate correct Saudi IBAN', () => {
      // Valid Saudi IBANs (24 characters)
      expect(validateSaudiIBAN('SA0380000000608010167519')).toBe(true);
      expect(validateSaudiIBAN('SA4420000001234567891234')).toBe(true);
    });

    it('should reject IBAN not starting with SA', () => {
      expect(validateSaudiIBAN('AE0380000000608010167519')).toBe(false);
      expect(validateSaudiIBAN('GB82WEST12345698765432')).toBe(false);
    });

    it('should reject IBAN with incorrect length', () => {
      expect(validateSaudiIBAN('SA038000000060801016751')).toBe(false); // 23 chars
      expect(validateSaudiIBAN('SA03800000006080101675199')).toBe(false); // 25 chars
    });

    it('should handle formatted IBANs', () => {
      expect(validateSaudiIBAN('SA03 8000 0000 6080 1016 7519')).toBe(true);
    });

    it('should validate mod-97 check digit', () => {
      // Invalid check digits
      expect(validateSaudiIBAN('SA9980000000608010167519')).toBe(false);
    });

    it('should reject empty or invalid input', () => {
      expect(validateSaudiIBAN('')).toBe(false);
      expect(validateSaudiIBAN(null as any)).toBe(false);
    });
  });

  // ============================================================================
  // UAE IBAN VALIDATION
  // ============================================================================

  describe('validateUAEIBAN', () => {
    it('should validate correct UAE IBAN', () => {
      // Valid UAE IBANs (23 characters)
      expect(validateUAEIBAN('AE070331234567890123456')).toBe(true);
      expect(validateUAEIBAN('AE260211000000230064016')).toBe(true);
    });

    it('should reject IBAN not starting with AE', () => {
      expect(validateUAEIBAN('SA070331234567890123456')).toBe(false);
    });

    it('should reject IBAN with incorrect length', () => {
      expect(validateUAEIBAN('AE07033123456789012345')).toBe(false); // 22 chars
      expect(validateUAEIBAN('AE0703312345678901234567')).toBe(false); // 24 chars
    });

    it('should handle formatted IBANs', () => {
      expect(validateUAEIBAN('AE07 0331 2345 6789 0123 456')).toBe(true);
    });

    it('should reject empty or invalid input', () => {
      expect(validateUAEIBAN('')).toBe(false);
      expect(validateUAEIBAN(null as any)).toBe(false);
    });
  });

  // ============================================================================
  // SAUDI COMMERCIAL REGISTRATION VALIDATION
  // ============================================================================

  describe('validateSaudiCR', () => {
    it('should validate correct Saudi CR', () => {
      expect(validateSaudiCR('1010123456')).toBe(true);
      expect(validateSaudiCR('2050987654')).toBe(true);
    });

    it('should reject CR with incorrect length', () => {
      expect(validateSaudiCR('101012345')).toBe(false); // 9 digits
      expect(validateSaudiCR('10101234567')).toBe(false); // 11 digits
    });

    it('should handle formatted CRs', () => {
      expect(validateSaudiCR('1010-123456')).toBe(true);
      expect(validateSaudiCR('1010 123 456')).toBe(true);
    });

    it('should reject empty or invalid input', () => {
      expect(validateSaudiCR('')).toBe(false);
      expect(validateSaudiCR(null as any)).toBe(false);
    });
  });

  // ============================================================================
  // UAE TRADE LICENSE VALIDATION
  // ============================================================================

  describe('validateUAETradeLicense', () => {
    it('should validate correct UAE trade license', () => {
      expect(validateUAETradeLicense('123456')).toBe(true);
      expect(validateUAETradeLicense('CN1234567')).toBe(true);
      expect(validateUAETradeLicense('DED123456')).toBe(true);
    });

    it('should reject license with incorrect length', () => {
      expect(validateUAETradeLicense('12345')).toBe(false); // Too short
      expect(validateUAETradeLicense('12345678901')).toBe(false); // Too long
    });

    it('should reject empty or invalid input', () => {
      expect(validateUAETradeLicense('')).toBe(false);
      expect(validateUAETradeLicense(null as any)).toBe(false);
    });
  });

  // ============================================================================
  // FORMATTING FUNCTIONS
  // ============================================================================

  describe('formatSaudiTRN', () => {
    it('should format Saudi TRN correctly', () => {
      expect(formatSaudiTRN('300123456789003')).toBe('300 123 456 789 003');
    });

    it('should return original if invalid length', () => {
      expect(formatSaudiTRN('30012345')).toBe('30012345');
    });
  });

  describe('formatUAETRN', () => {
    it('should format UAE TRN correctly', () => {
      expect(formatUAETRN('100123456789012')).toBe('100-1234-5678-901-2');
    });

    it('should return original if invalid length', () => {
      expect(formatUAETRN('10012345')).toBe('10012345');
    });
  });

  describe('formatIBAN', () => {
    it('should format IBAN with spaces', () => {
      expect(formatIBAN('SA0380000000608010167519')).toBe('SA03 8000 0000 6080 1016 7519');
      expect(formatIBAN('AE070331234567890123456')).toBe('AE07 0331 2345 6789 0123 456');
    });

    it('should handle already formatted IBANs', () => {
      expect(formatIBAN('SA03 8000 0000 6080 1016 7519')).toBe('SA03 8000 0000 6080 1016 7519');
    });
  });

  // ============================================================================
  // AUTO-DETECTION FUNCTIONS
  // ============================================================================

  describe('validateTRN', () => {
    it('should detect and validate Saudi TRN', () => {
      const result = validateTRN('300123456789003');
      expect(result.valid).toBe(true);
      expect(result.country).toBe('SA');
      expect(result.formatted).toBe('300 123 456 789 003');
    });

    it('should detect and validate UAE TRN', () => {
      const result = validateTRN('100123456789012');
      expect(result.valid).toBe(true);
      expect(result.country).toBe('UAE');
      expect(result.formatted).toBe('100-1234-5678-901-2');
    });

    it('should return null country for invalid TRN', () => {
      const result = validateTRN('123456');
      expect(result.valid).toBe(false);
      expect(result.country).toBe(null);
    });
  });

  describe('validateIBAN', () => {
    it('should detect and validate Saudi IBAN', () => {
      const result = validateIBAN('SA0380000000608010167519');
      expect(result.valid).toBe(true);
      expect(result.country).toBe('SA');
      expect(result.formatted).toBeDefined();
    });

    it('should detect and validate UAE IBAN', () => {
      const result = validateIBAN('AE070331234567890123456');
      expect(result.valid).toBe(true);
      expect(result.country).toBe('UAE');
      expect(result.formatted).toBeDefined();
    });

    it('should return null country for invalid IBAN', () => {
      const result = validateIBAN('GB82WEST12345698765432');
      expect(result.valid).toBe(false);
      expect(result.country).toBe(null);
    });
  });

  // ============================================================================
  // BANK CODE EXTRACTION
  // ============================================================================

  describe('extractBankCode', () => {
    it('should extract bank code from Saudi IBAN', () => {
      expect(extractBankCode('SA0380000000608010167519')).toBe('80');
    });

    it('should extract bank code from UAE IBAN', () => {
      expect(extractBankCode('AE070331234567890123456')).toBe('033');
    });

    it('should return empty string for invalid IBAN', () => {
      expect(extractBankCode('INVALID')).toBe('');
      expect(extractBankCode('GB82WEST12345698765432')).toBe('');
    });
  });

  // ============================================================================
  // VAT CALCULATIONS
  // ============================================================================

  describe('calculateMiddleEastVAT', () => {
    it('should calculate UAE standard VAT (5%)', () => {
      const result = calculateMiddleEastVAT(1000, 'UAE', 'STANDARD');
      expect(result.netAmount).toBe(1000);
      expect(result.vatRate).toBe(5);
      expect(result.vatAmount).toBe(50);
      expect(result.grossAmount).toBe(1050);
      expect(result.country).toBe('UAE');
    });

    it('should calculate Saudi standard VAT (15%)', () => {
      const result = calculateMiddleEastVAT(1000, 'SA', 'STANDARD');
      expect(result.netAmount).toBe(1000);
      expect(result.vatRate).toBe(15);
      expect(result.vatAmount).toBe(150);
      expect(result.grossAmount).toBe(1150);
      expect(result.country).toBe('SA');
    });

    it('should calculate zero-rated VAT', () => {
      const uaeResult = calculateMiddleEastVAT(1000, 'UAE', 'ZERO');
      expect(uaeResult.vatRate).toBe(0);
      expect(uaeResult.vatAmount).toBe(0);
      expect(uaeResult.grossAmount).toBe(1000);

      const saResult = calculateMiddleEastVAT(1000, 'SA', 'ZERO');
      expect(saResult.vatRate).toBe(0);
      expect(saResult.vatAmount).toBe(0);
      expect(saResult.grossAmount).toBe(1000);
    });

    it('should calculate exempt VAT', () => {
      const result = calculateMiddleEastVAT(1000, 'UAE', 'EXEMPT');
      expect(result.vatRate).toBe(0);
      expect(result.vatAmount).toBe(0);
      expect(result.grossAmount).toBe(1000);
    });

    it('should handle decimal amounts', () => {
      const result = calculateMiddleEastVAT(99.99, 'UAE', 'STANDARD');
      expect(result.vatAmount).toBe(5.00);
      expect(result.grossAmount).toBe(104.99);
    });
  });

  describe('calculateNetFromGross', () => {
    it('should calculate net from gross for UAE (5%)', () => {
      const result = calculateNetFromGross(1050, 'UAE', 'STANDARD');
      expect(result.netAmount).toBe(1000);
      expect(result.vatRate).toBe(5);
      expect(result.vatAmount).toBe(50);
      expect(result.grossAmount).toBe(1050);
    });

    it('should calculate net from gross for Saudi Arabia (15%)', () => {
      const result = calculateNetFromGross(1150, 'SA', 'STANDARD');
      expect(result.netAmount).toBe(1000);
      expect(result.vatRate).toBe(15);
      expect(result.vatAmount).toBe(150);
      expect(result.grossAmount).toBe(1150);
    });

    it('should handle zero-rated transactions', () => {
      const result = calculateNetFromGross(1000, 'UAE', 'ZERO');
      expect(result.netAmount).toBe(1000);
      expect(result.vatRate).toBe(0);
      expect(result.vatAmount).toBe(0);
    });

    it('should handle decimal amounts', () => {
      const result = calculateNetFromGross(104.99, 'UAE', 'STANDARD');
      expect(result.netAmount).toBeCloseTo(99.99, 2);
      expect(result.vatAmount).toBeCloseTo(5.00, 2);
    });
  });

  // ============================================================================
  // EDGE CASES AND ERROR HANDLING
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle lowercase input', () => {
      expect(validateIBAN('ae070331234567890123456')).toBe(true);
      expect(validateIBAN('sa0380000000608010167519')).toBe(true);
    });

    it('should handle mixed case input', () => {
      expect(validateIBAN('Ae070331234567890123456')).toBe(true);
      expect(validateIBAN('Sa0380000000608010167519')).toBe(true);
    });

    it('should handle excessive whitespace', () => {
      expect(validateTRN('  300123456789003  ').valid).toBe(false); // Whitespace not removed in TRN
      expect(validateIBAN('  AE070331234567890123456  ').valid).toBe(true);
    });

    it('should handle special characters in formatted inputs', () => {
      expect(validateSaudiTRN('300-123-456-789-003')).toBe(true);
      expect(validateUAETRN('100-1234-5678-901-2')).toBe(true);
    });
  });
});
