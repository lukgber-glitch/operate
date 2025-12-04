/**
 * TLV (Tag-Length-Value) Encoder Utility
 * For ZATCA QR Code Generation
 *
 * TLV Format:
 * - Tag: 1 byte (identifies the field)
 * - Length: 1 byte (length of the value)
 * - Value: N bytes (actual data)
 */

import { TLVEntry } from '../zatca.types';
import { QR_TLV_TAGS } from '../zatca.constants';

/**
 * Encode a single TLV entry
 */
export function encodeTLVEntry(tag: number, value: string | Buffer): Buffer {
  const valueBuffer = Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf8');
  const length = valueBuffer.length;

  if (length > 255) {
    throw new Error(`TLV value length exceeds maximum of 255 bytes for tag ${tag}`);
  }

  const tlvBuffer = Buffer.allocUnsafe(2 + length);
  tlvBuffer.writeUInt8(tag, 0);
  tlvBuffer.writeUInt8(length, 1);
  valueBuffer.copy(tlvBuffer, 2);

  return tlvBuffer;
}

/**
 * Encode multiple TLV entries into a single buffer
 */
export function encodeTLV(entries: TLVEntry[]): Buffer {
  const buffers: Buffer[] = [];

  for (const entry of entries) {
    buffers.push(encodeTLVEntry(entry.tag, entry.value));
  }

  return Buffer.concat(buffers);
}

/**
 * Decode TLV buffer into entries
 */
export function decodeTLV(tlvBuffer: Buffer): TLVEntry[] {
  const entries: TLVEntry[] = [];
  let offset = 0;

  while (offset < tlvBuffer.length) {
    if (offset + 2 > tlvBuffer.length) {
      throw new Error('Invalid TLV buffer: insufficient data for tag and length');
    }

    const tag = tlvBuffer.readUInt8(offset);
    const length = tlvBuffer.readUInt8(offset + 1);

    if (offset + 2 + length > tlvBuffer.length) {
      throw new Error(`Invalid TLV buffer: insufficient data for value at tag ${tag}`);
    }

    const value = tlvBuffer.subarray(offset + 2, offset + 2 + length);

    entries.push({ tag, value });
    offset += 2 + length;
  }

  return entries;
}

/**
 * Convert TLV buffer to Base64 (for QR code)
 */
export function tlvToBase64(tlvBuffer: Buffer): string {
  return tlvBuffer.toString('base64');
}

/**
 * Convert Base64 to TLV buffer
 */
export function base64ToTLV(base64: string): Buffer {
  return Buffer.from(base64, 'base64');
}

/**
 * Validate TLV tags against ZATCA specification
 */
export function validateTLVTags(entries: TLVEntry[]): boolean {
  const validTags = Object.values(QR_TLV_TAGS);

  for (const entry of entries) {
    if (!validTags.includes(entry.tag)) {
      throw new Error(`Invalid TLV tag: ${entry.tag}`);
    }
  }

  return true;
}

/**
 * Create TLV entries for ZATCA QR code
 */
export function createZatcaQRCodeTLV(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  invoiceTotal: string,
  vatTotal: string,
  invoiceHash: string,
  signature: string,
  publicKey: string,
  signatureAlgorithm: string = 'ECDSA',
): Buffer {
  const entries: TLVEntry[] = [
    { tag: QR_TLV_TAGS.SELLER_NAME, value: sellerName },
    { tag: QR_TLV_TAGS.VAT_REGISTRATION_NUMBER, value: vatNumber },
    { tag: QR_TLV_TAGS.TIMESTAMP, value: timestamp },
    { tag: QR_TLV_TAGS.INVOICE_TOTAL, value: invoiceTotal },
    { tag: QR_TLV_TAGS.VAT_TOTAL, value: vatTotal },
    { tag: QR_TLV_TAGS.INVOICE_HASH, value: invoiceHash },
    { tag: QR_TLV_TAGS.SIGNATURE, value: signature },
    { tag: QR_TLV_TAGS.PUBLIC_KEY, value: publicKey },
    { tag: QR_TLV_TAGS.SIGNATURE_ALGORITHM, value: signatureAlgorithm },
  ];

  validateTLVTags(entries);
  return encodeTLV(entries);
}

/**
 * Parse ZATCA QR code TLV data
 */
export function parseZatcaQRCodeTLV(tlvBuffer: Buffer): {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  invoiceTotal: string;
  vatTotal: string;
  invoiceHash: string;
  signature: string;
  publicKey: string;
  signatureAlgorithm: string;
} {
  const entries = decodeTLV(tlvBuffer);
  const result: any = {};

  for (const entry of entries) {
    const value = entry.value.toString('utf8');

    switch (entry.tag) {
      case QR_TLV_TAGS.SELLER_NAME:
        result.sellerName = value;
        break;
      case QR_TLV_TAGS.VAT_REGISTRATION_NUMBER:
        result.vatNumber = value;
        break;
      case QR_TLV_TAGS.TIMESTAMP:
        result.timestamp = value;
        break;
      case QR_TLV_TAGS.INVOICE_TOTAL:
        result.invoiceTotal = value;
        break;
      case QR_TLV_TAGS.VAT_TOTAL:
        result.vatTotal = value;
        break;
      case QR_TLV_TAGS.INVOICE_HASH:
        result.invoiceHash = value;
        break;
      case QR_TLV_TAGS.SIGNATURE:
        result.signature = value;
        break;
      case QR_TLV_TAGS.PUBLIC_KEY:
        result.publicKey = value;
        break;
      case QR_TLV_TAGS.SIGNATURE_ALGORITHM:
        result.signatureAlgorithm = value;
        break;
    }
  }

  // Validate all required fields are present
  const requiredFields = [
    'sellerName',
    'vatNumber',
    'timestamp',
    'invoiceTotal',
    'vatTotal',
    'invoiceHash',
    'signature',
    'publicKey',
    'signatureAlgorithm',
  ];

  for (const field of requiredFields) {
    if (!result[field]) {
      throw new Error(`Missing required TLV field: ${field}`);
    }
  }

  return result;
}
