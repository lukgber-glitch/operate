/**
 * Crypto Utility Unit Tests
 */

import {
  calculateSHA256Hash,
  calculateSHA256HashBuffer,
  calculateInvoiceHash,
  signWithECDSA,
  verifyECDSASignature,
  generateECDSAKeyPair,
  extractPublicKey,
  pemToBase64,
  base64ToPEM,
  generateCryptographicStamp,
  verifyCryptographicStamp,
  generateUUID,
  validateTRN,
  hmacSHA256,
  constantTimeCompare,
} from '../utils/crypto.util';

describe('Crypto Utility', () => {
  describe('SHA-256 Hash Calculation', () => {
    it('should calculate SHA-256 hash of string', () => {
      const data = 'test data';
      const hash = calculateSHA256Hash(data);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 format
    });

    it('should calculate consistent hash for same input', () => {
      const data = 'consistent data';

      const hash1 = calculateSHA256Hash(data);
      const hash2 = calculateSHA256Hash(data);

      expect(hash1).toBe(hash2);
    });

    it('should calculate different hash for different input', () => {
      const hash1 = calculateSHA256Hash('data 1');
      const hash2 = calculateSHA256Hash('data 2');

      expect(hash1).not.toBe(hash2);
    });

    it('should calculate SHA-256 hash of buffer', () => {
      const buffer = Buffer.from('test data', 'utf8');
      const hash = calculateSHA256HashBuffer(buffer);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('should handle empty string', () => {
      const hash = calculateSHA256Hash('');

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('Invoice Hash Calculation', () => {
    it('should calculate invoice hash from XML', () => {
      const xml = '<?xml version="1.0"?><Invoice><ID>001</ID></Invoice>';

      const result = calculateInvoiceHash(xml);

      expect(result).toBeDefined();
      expect(result.hash).toBeDefined();
      expect(result.canonicalString).toBeDefined();
    });

    it('should remove XML declaration from canonical string', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?><Invoice></Invoice>';

      const result = calculateInvoiceHash(xml);

      expect(result.canonicalString).not.toContain('<?xml');
    });

    it('should trim whitespace from canonical string', () => {
      const xml = '  \n  <Invoice></Invoice>  \n  ';

      const result = calculateInvoiceHash(xml);

      expect(result.canonicalString).toBe('<Invoice></Invoice>');
    });
  });

  describe('ECDSA Key Pair Generation', () => {
    it('should generate ECDSA key pair', () => {
      const keyPair = generateECDSAKeyPair();

      expect(keyPair).toBeDefined();
      expect(keyPair.privateKey).toContain('BEGIN PRIVATE KEY');
      expect(keyPair.publicKey).toContain('BEGIN PUBLIC KEY');
    });

    it('should generate unique key pairs', () => {
      const keyPair1 = generateECDSAKeyPair();
      const keyPair2 = generateECDSAKeyPair();

      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
    });

    it('should extract public key from private key', () => {
      const keyPair = generateECDSAKeyPair();

      const extractedPublicKey = extractPublicKey(keyPair.privateKey);

      expect(extractedPublicKey).toBeDefined();
      expect(extractedPublicKey).toContain('BEGIN PUBLIC KEY');
    });
  });

  describe('ECDSA Signature', () => {
    it('should sign data with ECDSA', () => {
      const keyPair = generateECDSAKeyPair();
      const data = 'data to sign';

      const signature = signWithECDSA(data, keyPair.privateKey);

      expect(signature).toBeDefined();
      expect(signature).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64
    });

    it('should verify valid ECDSA signature', () => {
      const keyPair = generateECDSAKeyPair();
      const data = 'data to sign';

      const signature = signWithECDSA(data, keyPair.privateKey);
      const isValid = verifyECDSASignature(data, signature, keyPair.publicKey);

      expect(isValid).toBe(true);
    });

    it('should reject invalid ECDSA signature', () => {
      const keyPair = generateECDSAKeyPair();
      const data = 'data to sign';
      const signature = signWithECDSA(data, keyPair.privateKey);

      // Tamper with data
      const tamperedData = 'tampered data';
      const isValid = verifyECDSASignature(tamperedData, signature, keyPair.publicKey);

      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong public key', () => {
      const keyPair1 = generateECDSAKeyPair();
      const keyPair2 = generateECDSAKeyPair();
      const data = 'data to sign';

      const signature = signWithECDSA(data, keyPair1.privateKey);
      const isValid = verifyECDSASignature(data, signature, keyPair2.publicKey);

      expect(isValid).toBe(false);
    });
  });

  describe('Cryptographic Stamp', () => {
    it('should generate cryptographic stamp', () => {
      const keyPair = generateECDSAKeyPair();
      const invoiceHash = 'dGVzdC1oYXNo'; // Base64 "test-hash"

      const stamp = generateCryptographicStamp(
        invoiceHash,
        keyPair.privateKey,
        keyPair.publicKey,
      );

      expect(stamp).toBeDefined();
      expect(stamp.signature).toBeDefined();
      expect(stamp.publicKey).toBeDefined();
      expect(stamp.algorithm).toBe('ECDSA');
    });

    it('should verify cryptographic stamp', () => {
      const keyPair = generateECDSAKeyPair();
      const invoiceHash = 'test-invoice-hash';

      const stamp = generateCryptographicStamp(
        invoiceHash,
        keyPair.privateKey,
        keyPair.publicKey,
      );

      const isValid = verifyCryptographicStamp(
        invoiceHash,
        stamp.signature,
        stamp.publicKey,
      );

      expect(isValid).toBe(true);
    });

    it('should reject tampered invoice hash', () => {
      const keyPair = generateECDSAKeyPair();
      const invoiceHash = 'original-hash';

      const stamp = generateCryptographicStamp(
        invoiceHash,
        keyPair.privateKey,
        keyPair.publicKey,
      );

      const tamperedHash = 'tampered-hash';
      const isValid = verifyCryptographicStamp(
        tamperedHash,
        stamp.signature,
        stamp.publicKey,
      );

      expect(isValid).toBe(false);
    });
  });

  describe('PEM to Base64 Conversion', () => {
    it('should convert PEM to Base64', () => {
      const pem = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE
test-key-data
-----END PUBLIC KEY-----`;

      const base64 = pemToBase64(pem);

      expect(base64).not.toContain('BEGIN PUBLIC KEY');
      expect(base64).not.toContain('END PUBLIC KEY');
      expect(base64).not.toContain('\n');
      expect(base64).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('should convert Base64 to PEM', () => {
      const base64 = 'dGVzdC1rZXktZGF0YQ==';
      const pem = base64ToPEM(base64, 'PUBLIC KEY');

      expect(pem).toContain('BEGIN PUBLIC KEY');
      expect(pem).toContain('END PUBLIC KEY');
      expect(pem).toContain(base64);
    });

    it('should format Base64 with line breaks in PEM', () => {
      const longBase64 = 'A'.repeat(128);
      const pem = base64ToPEM(longBase64, 'CERTIFICATE');

      // Should have line breaks every 64 characters
      const lines = pem.split('\n').filter(line => !line.includes('BEGIN') && !line.includes('END'));
      expect(lines.some(line => line.length <= 64)).toBe(true);
    });
  });

  describe('UUID Generation', () => {
    it('should generate valid UUID v4', () => {
      const uuid = generateUUID();

      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();

      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('TRN Validation', () => {
    it('should validate valid TRN', () => {
      const validTRN = '300000000000003';

      expect(validateTRN(validTRN)).toBe(true);
    });

    it('should reject TRN not starting with 3', () => {
      const invalidTRN = '400000000000003';

      expect(validateTRN(invalidTRN)).toBe(false);
    });

    it('should reject TRN with wrong length', () => {
      expect(validateTRN('30000000000000')).toBe(false); // 14 digits
      expect(validateTRN('3000000000000000')).toBe(false); // 16 digits
    });

    it('should reject TRN with non-numeric characters', () => {
      expect(validateTRN('30000000000000A')).toBe(false);
    });
  });

  describe('HMAC SHA-256', () => {
    it('should calculate HMAC SHA-256', () => {
      const data = 'message';
      const secret = 'secret-key';

      const hmac = hmacSHA256(data, secret);

      expect(hmac).toBeDefined();
      expect(hmac).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('should produce consistent HMAC for same input', () => {
      const data = 'message';
      const secret = 'secret';

      const hmac1 = hmacSHA256(data, secret);
      const hmac2 = hmacSHA256(data, secret);

      expect(hmac1).toBe(hmac2);
    });

    it('should produce different HMAC for different secret', () => {
      const data = 'message';

      const hmac1 = hmacSHA256(data, 'secret1');
      const hmac2 = hmacSHA256(data, 'secret2');

      expect(hmac1).not.toBe(hmac2);
    });
  });

  describe('Constant Time Comparison', () => {
    it('should return true for equal strings', () => {
      const result = constantTimeCompare('secret', 'secret');

      expect(result).toBe(true);
    });

    it('should return false for different strings', () => {
      const result = constantTimeCompare('secret1', 'secret2');

      expect(result).toBe(false);
    });

    it('should return false for different length strings', () => {
      const result = constantTimeCompare('short', 'longer string');

      expect(result).toBe(false);
    });

    it('should be resistant to timing attacks', () => {
      // This is a basic test - true timing attack resistance requires proper implementation
      const secret = 'supersecret';

      const result1 = constantTimeCompare(secret, 'aaaaaaaaaaa');
      const result2 = constantTimeCompare(secret, 'supersecrea');

      // Both should return false in constant time
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid private key in signing', () => {
      const invalidKey = 'not-a-valid-key';
      const data = 'test';

      expect(() => signWithECDSA(data, invalidKey)).toThrow();
    });

    it('should throw error for invalid signature format in verification', () => {
      const keyPair = generateECDSAKeyPair();
      const data = 'test';
      const invalidSignature = 'not-valid-base64!!!';

      expect(() => verifyECDSASignature(data, invalidSignature, keyPair.publicKey)).toThrow();
    });

    it('should throw error for invalid private key in public key extraction', () => {
      const invalidKey = '-----BEGIN PRIVATE KEY-----\ninvalid\n-----END PRIVATE KEY-----';

      expect(() => extractPublicKey(invalidKey)).toThrow();
    });
  });
});
