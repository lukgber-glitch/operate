import * as crypto from 'crypto';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Persona Encryption Utility
 * Provides AES-256-GCM encryption for sensitive Persona data
 *
 * Security Features:
 * - AES-256-GCM authenticated encryption
 * - Random IV (Initialization Vector) for each encryption
 * - Authentication tags to prevent tampering
 * - Key derivation from environment secret
 *
 * Use Cases:
 * - Encrypting Persona API keys at rest
 * - Protecting session tokens
 * - Securing PII data before storage
 */
@Injectable()
export class PersonaEncryptionUtil {
  private readonly logger = new Logger(PersonaEncryptionUtil.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16; // 128 bits
  private readonly authTagLength = 16; // 128 bits
  private readonly keyLength = 32; // 256 bits

  /**
   * Get encryption key from environment
   * In production, this should be stored in a secure key management system (KMS)
   */
  private getEncryptionKey(): Buffer {
    const secret = process.env.PERSONA_ENCRYPTION_KEY;
    if (!secret) {
      throw new Error('PERSONA_ENCRYPTION_KEY environment variable is required');
    }

    // Derive a 256-bit key from the secret using SHA-256
    return crypto.createHash('sha256').update(secret).digest();
  }

  /**
   * Encrypt data using AES-256-GCM
   *
   * @param plaintext - Data to encrypt
   * @returns Base64-encoded encrypted data with format: iv:authTag:ciphertext
   */
  encrypt(plaintext: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);

      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
      ciphertext += cipher.final('base64');

      const authTag = cipher.getAuthTag();

      // Combine IV, auth tag, and ciphertext
      const combined = `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext}`;

      return combined;
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   *
   * @param encrypted - Base64-encoded encrypted data (iv:authTag:ciphertext)
   * @returns Decrypted plaintext
   */
  decrypt(encrypted: string): string {
    try {
      const key = this.getEncryptionKey();

      // Split the combined string
      const parts = encrypted.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'base64');
      const authTag = Buffer.from(parts[1], 'base64');
      const ciphertext = parts[2];

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);

      let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
      plaintext += decipher.final('utf8');

      return plaintext;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash data using SHA-256 (one-way, for verification)
   *
   * @param data - Data to hash
   * @returns Hex-encoded hash
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify HMAC signature (for webhook verification)
   *
   * @param payload - Webhook payload
   * @param signature - Signature to verify
   * @param secret - Webhook secret
   * @returns True if signature is valid
   */
  verifyHmacSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      // Use timing-safe comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      this.logger.error('Signature verification failed', error);
      return false;
    }
  }

  /**
   * Generate a secure random token
   *
   * @param length - Length in bytes (default: 32)
   * @returns Hex-encoded random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Redact sensitive information for logging
   *
   * @param data - Data to redact
   * @returns Redacted version showing only first/last characters
   */
  redact(data: string): string {
    if (!data || data.length < 8) {
      return '***';
    }
    return `${data.slice(0, 4)}...${data.slice(-4)}`;
  }
}
