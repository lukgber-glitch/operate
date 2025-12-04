/**
 * TLV Encoder Utility Unit Tests
 */

import {
  encodeTLVEntry,
  encodeTLV,
  decodeTLV,
  tlvToBase64,
  base64ToTLV,
  validateTLVTags,
  createZatcaQRCodeTLV,
  parseZatcaQRCodeTLV,
} from '../utils/tlv-encoder.util';
import { TLVEntry } from '../zatca.types';
import { QR_TLV_TAGS } from '../zatca.constants';

describe('TLV Encoder Utility', () => {
  describe('encodeTLVEntry', () => {
    it('should encode a TLV entry correctly', () => {
      const tag = 1;
      const value = 'Test Value';

      const buffer = encodeTLVEntry(tag, value);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.readUInt8(0)).toBe(tag);
      expect(buffer.readUInt8(1)).toBe(value.length);
      expect(buffer.subarray(2).toString('utf8')).toBe(value);
    });

    it('should encode TLV entry with Buffer value', () => {
      const tag = 2;
      const value = Buffer.from('Binary Data', 'utf8');

      const buffer = encodeTLVEntry(tag, value);

      expect(buffer.readUInt8(0)).toBe(tag);
      expect(buffer.readUInt8(1)).toBe(value.length);
      expect(buffer.subarray(2).equals(value)).toBe(true);
    });

    it('should throw error for value exceeding 255 bytes', () => {
      const tag = 1;
      const value = 'x'.repeat(256);

      expect(() => encodeTLVEntry(tag, value)).toThrow(
        /TLV value length exceeds maximum/,
      );
    });

    it('should handle empty value', () => {
      const tag = 1;
      const value = '';

      const buffer = encodeTLVEntry(tag, value);

      expect(buffer.readUInt8(0)).toBe(tag);
      expect(buffer.readUInt8(1)).toBe(0);
      expect(buffer.length).toBe(2);
    });
  });

  describe('encodeTLV', () => {
    it('should encode multiple TLV entries', () => {
      const entries: TLVEntry[] = [
        { tag: 1, value: 'First' },
        { tag: 2, value: 'Second' },
        { tag: 3, value: 'Third' },
      ];

      const buffer = encodeTLV(entries);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      // Verify first entry
      expect(buffer.readUInt8(0)).toBe(1);
      expect(buffer.readUInt8(1)).toBe(5); // 'First'.length
    });

    it('should handle empty entries array', () => {
      const entries: TLVEntry[] = [];

      const buffer = encodeTLV(entries);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBe(0);
    });
  });

  describe('decodeTLV', () => {
    it('should decode TLV buffer correctly', () => {
      const originalEntries: TLVEntry[] = [
        { tag: 1, value: 'Value1' },
        { tag: 2, value: 'Value2' },
      ];

      const encoded = encodeTLV(originalEntries);
      const decoded = decodeTLV(encoded);

      expect(decoded).toHaveLength(2);
      expect(decoded[0].tag).toBe(1);
      expect(decoded[0].value.toString('utf8')).toBe('Value1');
      expect(decoded[1].tag).toBe(2);
      expect(decoded[1].value.toString('utf8')).toBe('Value2');
    });

    it('should throw error for invalid TLV buffer (insufficient data)', () => {
      const invalidBuffer = Buffer.from([1]); // Only tag, no length

      expect(() => decodeTLV(invalidBuffer)).toThrow(
        /Invalid TLV buffer: insufficient data/,
      );
    });

    it('should throw error for incomplete value data', () => {
      const invalidBuffer = Buffer.from([1, 10, 65, 66]); // Tag=1, Length=10, but only 2 bytes

      expect(() => decodeTLV(invalidBuffer)).toThrow(
        /Invalid TLV buffer: insufficient data for value/,
      );
    });

    it('should handle empty TLV buffer', () => {
      const emptyBuffer = Buffer.alloc(0);

      const decoded = decodeTLV(emptyBuffer);

      expect(decoded).toHaveLength(0);
    });
  });

  describe('tlvToBase64 and base64ToTLV', () => {
    it('should convert TLV buffer to Base64 and back', () => {
      const entries: TLVEntry[] = [
        { tag: 1, value: 'Test' },
        { tag: 2, value: 'Data' },
      ];

      const tlvBuffer = encodeTLV(entries);
      const base64 = tlvToBase64(tlvBuffer);

      expect(typeof base64).toBe('string');
      expect(base64).toMatch(/^[A-Za-z0-9+/=]+$/);

      const decodedBuffer = base64ToTLV(base64);

      expect(decodedBuffer.equals(tlvBuffer)).toBe(true);
    });
  });

  describe('validateTLVTags', () => {
    it('should validate valid ZATCA QR code tags', () => {
      const entries: TLVEntry[] = [
        { tag: QR_TLV_TAGS.SELLER_NAME, value: 'Seller' },
        { tag: QR_TLV_TAGS.VAT_REGISTRATION_NUMBER, value: '300000000000003' },
        { tag: QR_TLV_TAGS.TIMESTAMP, value: '2025-12-03T10:30:00Z' },
      ];

      expect(() => validateTLVTags(entries)).not.toThrow();
    });

    it('should throw error for invalid tags', () => {
      const entries: TLVEntry[] = [
        { tag: 999, value: 'Invalid' }, // Not a valid ZATCA tag
      ];

      expect(() => validateTLVTags(entries)).toThrow(/Invalid TLV tag: 999/);
    });
  });

  describe('createZatcaQRCodeTLV', () => {
    it('should create ZATCA QR code TLV with all required fields', () => {
      const sellerName = 'Test Company Ltd';
      const vatNumber = '300000000000003';
      const timestamp = '2025-12-03T10:30:00Z';
      const invoiceTotal = '1150.00';
      const vatTotal = '150.00';
      const invoiceHash = 'base64-hash';
      const signature = 'base64-signature';
      const publicKey = 'base64-public-key';
      const signatureAlgorithm = 'ECDSA';

      const tlvBuffer = createZatcaQRCodeTLV(
        sellerName,
        vatNumber,
        timestamp,
        invoiceTotal,
        vatTotal,
        invoiceHash,
        signature,
        publicKey,
        signatureAlgorithm,
      );

      expect(tlvBuffer).toBeInstanceOf(Buffer);
      expect(tlvBuffer.length).toBeGreaterThan(0);

      // Decode and verify
      const decoded = decodeTLV(tlvBuffer);
      expect(decoded).toHaveLength(9); // All 9 ZATCA QR fields
    });

    it('should encode seller name in tag 1', () => {
      const tlvBuffer = createZatcaQRCodeTLV(
        'Test Seller',
        '300000000000003',
        '2025-12-03T10:30:00Z',
        '1000',
        '150',
        'hash',
        'sig',
        'key',
        'ECDSA',
      );

      const decoded = decodeTLV(tlvBuffer);
      const sellerNameEntry = decoded.find(e => e.tag === QR_TLV_TAGS.SELLER_NAME);

      expect(sellerNameEntry).toBeDefined();
      expect(sellerNameEntry!.value.toString('utf8')).toBe('Test Seller');
    });

    it('should encode VAT number in tag 2', () => {
      const tlvBuffer = createZatcaQRCodeTLV(
        'Seller',
        '300000000000003',
        '2025-12-03T10:30:00Z',
        '1000',
        '150',
        'hash',
        'sig',
        'key',
        'ECDSA',
      );

      const decoded = decodeTLV(tlvBuffer);
      const vatEntry = decoded.find(e => e.tag === QR_TLV_TAGS.VAT_REGISTRATION_NUMBER);

      expect(vatEntry).toBeDefined();
      expect(vatEntry!.value.toString('utf8')).toBe('300000000000003');
    });
  });

  describe('parseZatcaQRCodeTLV', () => {
    it('should parse ZATCA QR code TLV correctly', () => {
      const expectedData = {
        sellerName: 'Test Company Ltd',
        vatNumber: '300000000000003',
        timestamp: '2025-12-03T10:30:00Z',
        invoiceTotal: '1150.00',
        vatTotal: '150.00',
        invoiceHash: 'base64-hash',
        signature: 'base64-signature',
        publicKey: 'base64-public-key',
        signatureAlgorithm: 'ECDSA',
      };

      const tlvBuffer = createZatcaQRCodeTLV(
        expectedData.sellerName,
        expectedData.vatNumber,
        expectedData.timestamp,
        expectedData.invoiceTotal,
        expectedData.vatTotal,
        expectedData.invoiceHash,
        expectedData.signature,
        expectedData.publicKey,
        expectedData.signatureAlgorithm,
      );

      const parsed = parseZatcaQRCodeTLV(tlvBuffer);

      expect(parsed).toEqual(expectedData);
    });

    it('should throw error for missing required fields', () => {
      // Create TLV with only some fields
      const incompleteEntries: TLVEntry[] = [
        { tag: QR_TLV_TAGS.SELLER_NAME, value: 'Seller' },
        { tag: QR_TLV_TAGS.VAT_REGISTRATION_NUMBER, value: '300000000000003' },
        // Missing other required fields
      ];

      const tlvBuffer = encodeTLV(incompleteEntries);

      expect(() => parseZatcaQRCodeTLV(tlvBuffer)).toThrow(
        /Missing required TLV field/,
      );
    });
  });

  describe('Round-trip encoding/decoding', () => {
    it('should maintain data integrity through encode-decode cycle', () => {
      const originalData = {
        sellerName: 'عربى نص Test', // Arabic + English
        vatNumber: '300000000000003',
        timestamp: '2025-12-03T10:30:00Z',
        invoiceTotal: '1150.00',
        vatTotal: '150.00',
        invoiceHash: 'dGVzdC1oYXNo', // Base64
        signature: 'c2lnbmF0dXJl', // Base64
        publicKey: 'cHVibGljLWtleQ==', // Base64
        signatureAlgorithm: 'ECDSA',
      };

      // Encode
      const tlvBuffer = createZatcaQRCodeTLV(
        originalData.sellerName,
        originalData.vatNumber,
        originalData.timestamp,
        originalData.invoiceTotal,
        originalData.vatTotal,
        originalData.invoiceHash,
        originalData.signature,
        originalData.publicKey,
        originalData.signatureAlgorithm,
      );

      // Convert to Base64 (as used in QR codes)
      const base64 = tlvToBase64(tlvBuffer);

      // Decode from Base64
      const decodedBuffer = base64ToTLV(base64);

      // Parse
      const parsed = parseZatcaQRCodeTLV(decodedBuffer);

      expect(parsed).toEqual(originalData);
    });
  });
});
