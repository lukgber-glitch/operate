import * as crypto from 'crypto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

/**
 * FinanzOnline Authentication Utility
 * Handles certificate processing and credential encryption
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encryption result
 */
export interface EncryptionResult {
  /** Encrypted data (base64) */
  encrypted: string;
  /** Initialization vector (base64) */
  iv: string;
  /** Authentication tag (base64) */
  authTag: string;
}

/**
 * Validate Austrian tax ID format
 */
export function validateTaxId(taxId: string): boolean {
  // Format: XX-YYY/ZZZZ (e.g., 12-345/6789)
  const taxIdRegex = /^\d{2}-\d{3}\/\d{4}$/;
  return taxIdRegex.test(taxId);
}

/**
 * Validate Austrian VAT ID format
 */
export function validateVatId(vatId: string): boolean {
  // Format: ATU12345678
  const vatIdRegex = /^ATU\d{8}$/;
  return vatIdRegex.test(vatId);
}

/**
 * Normalize tax ID (remove spaces, ensure correct format)
 */
export function normalizeTaxId(taxId: string): string {
  // Remove spaces and convert to uppercase
  const cleaned = taxId.replace(/\s/g, '').toUpperCase();

  if (!validateTaxId(cleaned)) {
    throw new BadRequestException(
      'Invalid tax ID format. Expected format: XX-YYY/ZZZZ',
    );
  }

  return cleaned;
}

/**
 * Normalize VAT ID (remove spaces, ensure correct format)
 */
export function normalizeVatId(vatId: string): string {
  // Remove spaces and convert to uppercase
  const cleaned = vatId.replace(/\s/g, '').toUpperCase();

  if (!validateVatId(cleaned)) {
    throw new BadRequestException(
      'Invalid VAT ID format. Expected format: ATU12345678',
    );
  }

  return cleaned;
}

/**
 * Validate certificate format
 */
export function validateCertificate(
  certificate: string,
  type: 'PEM' | 'P12',
): boolean {
  if (type === 'PEM') {
    // Check for PEM markers
    return (
      certificate.includes('-----BEGIN CERTIFICATE-----') &&
      certificate.includes('-----END CERTIFICATE-----')
    );
  } else if (type === 'P12') {
    // P12 should be base64 encoded
    try {
      Buffer.from(certificate, 'base64');
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Extract certificate information
 */
export function extractCertificateInfo(
  certificate: string,
  type: 'PEM' | 'P12',
): {
  validFrom?: Date;
  validTo?: Date;
  subject?: string;
  issuer?: string;
} {
  try {
    if (type === 'PEM') {
      // In production, use a proper X.509 parser
      // This is a simplified version
      const certBuffer = Buffer.from(certificate);
      // Parse certificate using crypto module
      // For now, return placeholder
      return {
        validFrom: new Date(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      };
    }
    return {};
  } catch (error) {
    throw new BadRequestException('Invalid certificate format');
  }
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encrypt(
  plaintext: string,
  encryptionKey: string,
): EncryptionResult {
  try {
    // Derive key from encryption key
    const key = crypto
      .createHash('sha256')
      .update(encryptionKey)
      .digest()
      .slice(0, KEY_LENGTH);

    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt data
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 */
export function decrypt(
  encrypted: string,
  iv: string,
  authTag: string,
  encryptionKey: string,
): string {
  try {
    // Derive key from encryption key
    const key = crypto
      .createHash('sha256')
      .update(encryptionKey)
      .digest()
      .slice(0, KEY_LENGTH);

    // Convert IV and auth tag from base64
    const ivBuffer = Buffer.from(iv, 'base64');
    const authTagBuffer = Buffer.from(authTag, 'base64');

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    // Decrypt data
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new UnauthorizedException('Decryption failed: Invalid credentials');
  }
}

/**
 * Generate session ID
 */
export function generateSessionId(): string {
  const randomBytes = crypto.randomBytes(16);
  return `sess_${randomBytes.toString('hex')}`;
}

/**
 * Generate session token
 */
export function generateSessionToken(): string {
  const randomBytes = crypto.randomBytes(32);
  return `tok_${randomBytes.toString('hex')}`;
}

/**
 * Hash password for secure comparison
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verify session token
 */
export function verifySessionToken(token: string): boolean {
  // Check token format
  const tokenRegex = /^tok_[a-f0-9]{64}$/;
  return tokenRegex.test(token);
}

/**
 * Check if certificate is expired
 */
export function isCertificateExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}

/**
 * Calculate session expiration time
 */
export function calculateSessionExpiry(timeoutMinutes: number): Date {
  const now = new Date();
  return new Date(now.getTime() + timeoutMinutes * 60 * 1000);
}

/**
 * Check if session is expired
 */
export function isSessionExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}

/**
 * Generate reference ID for submissions
 */
export function generateReferenceId(prefix: string = 'FON'): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Sanitize log data (remove sensitive information)
 */
export function sanitizeForLogging(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };
  const sensitiveFields = [
    'password',
    'certificate',
    'certificatePassword',
    'token',
    'sessionToken',
    'authToken',
    'socialSecurityNumber',
    'dateOfBirth',
  ];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}
