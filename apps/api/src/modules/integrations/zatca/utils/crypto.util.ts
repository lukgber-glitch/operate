/**
 * Cryptographic Utilities for ZATCA
 * Handles hashing, signing, and key management
 */

import * as crypto from 'crypto';
import { HASH_ALGORITHM, SIGNATURE_ALGORITHM, ELLIPTIC_CURVES } from '../zatca.constants';
import { InvoiceHashResult, CryptographicStampResult } from '../zatca.types';

/**
 * Calculate SHA-256 hash of a string
 */
export function calculateSHA256Hash(data: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(data, 'utf8');
  return hash.digest('base64');
}

/**
 * Calculate SHA-256 hash of a buffer
 */
export function calculateSHA256HashBuffer(data: Buffer): string {
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('base64');
}

/**
 * Calculate invoice hash from canonical XML string
 * According to ZATCA specifications
 */
export function calculateInvoiceHash(canonicalXML: string): InvoiceHashResult {
  // Remove XML declaration and normalize whitespace
  const normalized = canonicalXML
    .replace(/<\?xml[^?]*\?>/g, '')
    .trim();

  const hash = calculateSHA256Hash(normalized);

  return {
    hash,
    canonicalString: normalized,
  };
}

/**
 * Sign data using ECDSA with private key
 */
export function signWithECDSA(data: string, privateKeyPEM: string): string {
  try {
    // Create sign object with SHA-256
    const sign = crypto.createSign('SHA256');
    sign.update(data, 'utf8');
    sign.end();

    // Sign with private key
    const signature = sign.sign(privateKeyPEM);

    // Return base64 encoded signature
    return signature.toString('base64');
  } catch (error) {
    throw new Error(`Failed to sign data with ECDSA: ${error.message}`);
  }
}

/**
 * Verify ECDSA signature
 */
export function verifyECDSASignature(
  data: string,
  signature: string,
  publicKeyPEM: string,
): boolean {
  try {
    const verify = crypto.createVerify('SHA256');
    verify.update(data, 'utf8');
    verify.end();

    const signatureBuffer = Buffer.from(signature, 'base64');
    return verify.verify(publicKeyPEM, signatureBuffer);
  } catch (error) {
    throw new Error(`Failed to verify ECDSA signature: ${error.message}`);
  }
}

/**
 * Generate ECDSA key pair (secp256r1 / P-256)
 */
export function generateECDSAKeyPair(): {
  privateKey: string;
  publicKey: string;
} {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: ELLIPTIC_CURVES.SECP256R1,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return {
    privateKey,
    publicKey,
  };
}

/**
 * Extract public key from private key
 */
export function extractPublicKey(privateKeyPEM: string): string {
  try {
    const privateKeyObject = crypto.createPrivateKey(privateKeyPEM);
    const publicKeyObject = crypto.createPublicKey(privateKeyObject);

    return publicKeyObject.export({
      type: 'spki',
      format: 'pem',
    }) as string;
  } catch (error) {
    throw new Error(`Failed to extract public key: ${error.message}`);
  }
}

/**
 * Convert PEM key to Base64 (without headers)
 */
export function pemToBase64(pem: string): string {
  return pem
    .replace(/-----BEGIN [A-Z\s]+-----/, '')
    .replace(/-----END [A-Z\s]+-----/, '')
    .replace(/\s/g, '');
}

/**
 * Convert Base64 to PEM format
 */
export function base64ToPEM(base64: string, type: 'PUBLIC KEY' | 'PRIVATE KEY' | 'CERTIFICATE'): string {
  const formatted = base64.match(/.{1,64}/g)?.join('\n') || base64;
  return `-----BEGIN ${type}-----\n${formatted}\n-----END ${type}-----`;
}

/**
 * Generate cryptographic stamp (ECDSA signature) for invoice
 */
export function generateCryptographicStamp(
  invoiceHash: string,
  privateKeyPEM: string,
  publicKeyPEM: string,
): CryptographicStampResult {
  const signature = signWithECDSA(invoiceHash, privateKeyPEM);
  const publicKeyBase64 = pemToBase64(publicKeyPEM);

  return {
    signature,
    publicKey: publicKeyBase64,
    algorithm: SIGNATURE_ALGORITHM,
  };
}

/**
 * Verify cryptographic stamp
 */
export function verifyCryptographicStamp(
  invoiceHash: string,
  signature: string,
  publicKeyBase64: string,
): boolean {
  const publicKeyPEM = base64ToPEM(publicKeyBase64, 'PUBLIC KEY');
  return verifyECDSASignature(invoiceHash, signature, publicKeyPEM);
}

/**
 * Generate random UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Generate Certificate Signing Request (CSR)
 */
export function generateCSR(config: {
  commonName: string;
  organizationalUnitName: string;
  organizationIdentifier: string;
  countryName: string;
  privateKey: string;
}): string {
  // Note: For production, you would use a library like 'node-forge' or 'asn1js'
  // This is a simplified placeholder
  // In real implementation, generate proper X.509 CSR with all required fields

  const subject = [
    { name: 'commonName', value: config.commonName },
    { name: 'organizationalUnitName', value: config.organizationalUnitName },
    { name: 'organizationIdentifier', value: config.organizationIdentifier },
    { name: 'countryName', value: config.countryName },
  ];

  // This would need proper ASN.1 encoding in production
  // For now, returning a placeholder
  const csrData = {
    subject,
    publicKey: extractPublicKey(config.privateKey),
  };

  return Buffer.from(JSON.stringify(csrData)).toString('base64');
}

/**
 * Parse certificate serial number from certificate
 */
export function getCertificateSerial(certificatePEM: string): string {
  // In production, use a proper X.509 parser
  // This is a placeholder that extracts serial from PEM
  try {
    // Use node's crypto to parse certificate
    const cert = new crypto.X509Certificate(certificatePEM);
    return cert.serialNumber;
  } catch (error) {
    throw new Error(`Failed to parse certificate serial: ${error.message}`);
  }
}

/**
 * Validate TRN (Tax Registration Number) format
 */
export function validateTRN(trn: string): boolean {
  // TRN must be 15 digits starting with '3'
  return /^3\d{14}$/.test(trn);
}

/**
 * Generate random hex string
 */
export function generateRandomHex(length: number): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * HMAC SHA-256
 */
export function hmacSHA256(data: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  return hmac.digest('base64');
}

/**
 * Constant-time string comparison (to prevent timing attacks)
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  return crypto.timingSafeEqual(bufferA, bufferB);
}
