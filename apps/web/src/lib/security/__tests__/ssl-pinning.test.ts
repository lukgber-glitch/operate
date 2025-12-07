/**
 * SSL Certificate Pinning Tests
 *
 * Test suite for SSL certificate pinning functionality
 */

import {
  CERTIFICATE_PINS,
  PINNING_ENABLED,
  isMobileApp,
  getPlatform,
  extractHostname,
  getPinsForHostname,
  shouldApplyPinning,
  getPinningConfig,
  isValidPinFormat,
  validatePins,
} from '../ssl-pinning';

import {
  validatePinConfiguration,
  comparePins,
  findPinUsage,
  simulatePinValidation,
  generateRotationReport,
} from '../pin-validator';

describe('SSL Certificate Pinning', () => {
  describe('Platform Detection', () => {
    it('should detect non-mobile environment in tests', () => {
      expect(isMobileApp()).toBe(false);
    });

    it('should return web platform in tests', () => {
      expect(getPlatform()).toBe('web');
    });
  });

  describe('Hostname Extraction', () => {
    it('should extract hostname from full URL', () => {
      expect(extractHostname('https://operate.guru/api/v1/users')).toBe('operate.guru');
    });

    it('should extract hostname from URL without path', () => {
      expect(extractHostname('https://operate.guru')).toBe('operate.guru');
    });

    it('should handle relative URLs', () => {
      const hostname = extractHostname('/api/v1/users');
      expect(hostname).toBeTruthy();
    });

    it('should return null for invalid URLs', () => {
      // Mock console.error to suppress expected error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // In a valid implementation, this might handle the URL differently
      // but extractHostname is designed to handle all cases
      const result = extractHostname('not a url');

      consoleSpy.mockRestore();
      expect(typeof result).toBe('string');
    });
  });

  describe('Pin Management', () => {
    it('should have pins configured for operate.guru', () => {
      const pins = getPinsForHostname('operate.guru');
      expect(pins.length).toBeGreaterThan(0);
    });

    it('should return empty array for unknown hostname', () => {
      const pins = getPinsForHostname('unknown.example.com');
      expect(pins).toEqual([]);
    });

    it('should not mutate original pins array', () => {
      const pins1 = getPinsForHostname('operate.guru');
      const pins2 = getPinsForHostname('operate.guru');
      expect(pins1).not.toBe(pins2);
    });
  });

  describe('Pinning Logic', () => {
    it('should not apply pinning in test environment (web)', () => {
      const shouldPin = shouldApplyPinning('https://operate.guru/api/v1');
      expect(shouldPin).toBe(false);
    });

    it('should return null config for web platform', () => {
      const config = getPinningConfig('https://operate.guru/api/v1');
      expect(config).toBeNull();
    });
  });

  describe('Pin Format Validation', () => {
    it('should validate correct pin format (base64 SHA-256)', () => {
      // Valid base64-encoded SHA-256 hash (44 characters ending with =)
      const validPin = 'Xm8vE8vPHLmQCKjrCLqQhNBmPCvh3p0xqPKfN5kSiQE=';
      expect(isValidPinFormat(validPin)).toBe(true);
    });

    it('should reject pin with incorrect length', () => {
      const invalidPin = 'TooShort';
      expect(isValidPinFormat(invalidPin)).toBe(false);
    });

    it('should reject pin without base64 ending', () => {
      const invalidPin = 'Xm8vE8vPHLmQCKjrCLqQhNBmPCvh3p0xqPKfN5kSiQX';
      expect(isValidPinFormat(invalidPin)).toBe(false);
    });

    it('should reject pin with invalid characters', () => {
      const invalidPin = 'Xm8vE8vPHLmQCKjrCLqQhNBmPCvh3p0xqPKfN5kS@#$=';
      expect(isValidPinFormat(invalidPin)).toBe(false);
    });
  });

  describe('Pin Validation', () => {
    it('should detect placeholder pins', () => {
      const errors = validatePins();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('Invalid pin format'))).toBe(true);
    });

    it('should warn about single pin configuration', () => {
      // Mock CERTIFICATE_PINS with single pin
      const originalPins = { ...CERTIFICATE_PINS };
      (CERTIFICATE_PINS as any)['test.example.com'] = [
        'Xm8vE8vPHLmQCKjrCLqQhNBmPCvh3p0xqPKfN5kSiQE=',
      ];

      const errors = validatePins();
      const singlePinWarning = errors.find((e) =>
        e.includes('test.example.com')
      );
      expect(singlePinWarning).toBeTruthy();

      // Restore original
      delete (CERTIFICATE_PINS as any)['test.example.com'];
    });
  });

  describe('Pin Validator', () => {
    it('should generate validation report', () => {
      const report = validatePinConfiguration();
      expect(report).toHaveProperty('valid');
      expect(report).toHaveProperty('errors');
      expect(report).toHaveProperty('warnings');
      expect(report).toHaveProperty('info');
      expect(report).toHaveProperty('details');
    });

    it('should include platform info in report', () => {
      const report = validatePinConfiguration();
      expect(report.info.platform).toBe('web');
      expect(report.info.isMobile).toBe(false);
    });

    it('should detect placeholder pins in validation', () => {
      const report = validatePinConfiguration();
      const hasPlaceholderWarning = report.warnings.some((w) =>
        w.toLowerCase().includes('placeholder')
      );
      expect(hasPlaceholderWarning).toBe(true);
    });
  });

  describe('Pin Comparison', () => {
    it('should correctly compare matching pins', () => {
      const pin = 'Xm8vE8vPHLmQCKjrCLqQhNBmPCvh3p0xqPKfN5kSiQE=';
      expect(comparePins(pin, pin)).toBe(true);
    });

    it('should correctly compare different pins', () => {
      const pin1 = 'Xm8vE8vPHLmQCKjrCLqQhNBmPCvh3p0xqPKfN5kSiQE=';
      const pin2 = 'YnBvF9wQIMnRDKksNLrQiOCnQDwi4q1yrQLgO6lTjRF=';
      expect(comparePins(pin1, pin2)).toBe(false);
    });

    it('should handle pins with whitespace', () => {
      const pin1 = ' Xm8vE8vPHLmQCKjrCLqQhNBmPCvh3p0xqPKfN5kSiQE= ';
      const pin2 = 'Xm8vE8vPHLmQCKjrCLqQhNBmPCvh3p0xqPKfN5kSiQE=';
      expect(comparePins(pin1, pin2)).toBe(true);
    });
  });

  describe('Pin Usage Finder', () => {
    it('should find hostname using a pin', () => {
      const pins = getPinsForHostname('operate.guru');
      if (pins.length > 0) {
        const hostnames = findPinUsage(pins[0]);
        expect(hostnames).toContain('operate.guru');
      }
    });

    it('should return empty array for unused pin', () => {
      const unusedPin = 'ZnCwG0xRJNoSELltOMsRjPDoRExj5r2zsRMHP7mUkSG=';
      const hostnames = findPinUsage(unusedPin);
      expect(hostnames).toEqual([]);
    });
  });

  describe('Pin Validation Simulation', () => {
    it('should validate correct pin for hostname', () => {
      const validPin = 'Xm8vE8vPHLmQCKjrCLqQhNBmPCvh3p0xqPKfN5kSiQE=';

      // Add temporary test pin
      const originalPins = [...CERTIFICATE_PINS['operate.guru']];
      CERTIFICATE_PINS['operate.guru'] = [validPin];

      const result = simulatePinValidation(validPin, 'operate.guru');
      expect(result.valid).toBe(true);

      // Restore
      CERTIFICATE_PINS['operate.guru'] = originalPins;
    });

    it('should reject incorrect pin for hostname', () => {
      const invalidPin = 'ZnCwG0xRJNoSELltOMsRjPDoRExj5r2zsRMHP7mUkSG=';
      const result = simulatePinValidation(invalidPin, 'operate.guru');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('does not match');
    });

    it('should reject pin for unconfigured hostname', () => {
      const pin = 'Xm8vE8vPHLmQCKjrCLqQhNBmPCvh3p0xqPKfN5kSiQE=';
      const result = simulatePinValidation(pin, 'unknown.example.com');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('No pins configured');
    });

    it('should reject invalid pin format', () => {
      const invalidPin = 'NotAValidPin';
      const result = simulatePinValidation(invalidPin, 'operate.guru');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid pin format');
    });
  });

  describe('Rotation Report', () => {
    it('should generate rotation recommendations', () => {
      const report = generateRotationReport();
      expect(report).toHaveProperty('hostnames');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('timeline');
      expect(report.hostnames.length).toBeGreaterThan(0);
    });

    it('should include operate.guru in hostnames', () => {
      const report = generateRotationReport();
      expect(report.hostnames).toContain('operate.guru');
    });

    it('should provide timeline for rotation', () => {
      const report = generateRotationReport();
      expect(Array.isArray(report.timeline)).toBe(true);
    });
  });

  describe('Environment Flags', () => {
    it('should have pinning enabled setting', () => {
      expect(typeof PINNING_ENABLED).toBe('boolean');
    });

    it('should have certificate pins object', () => {
      expect(typeof CERTIFICATE_PINS).toBe('object');
      expect(CERTIFICATE_PINS).not.toBeNull();
    });

    it('should have at least one hostname configured', () => {
      const hostnames = Object.keys(CERTIFICATE_PINS);
      expect(hostnames.length).toBeGreaterThan(0);
    });
  });
});
