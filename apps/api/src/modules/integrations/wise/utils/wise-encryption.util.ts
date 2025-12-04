import * as crypto from 'crypto';
import { WISE_ENCRYPTION_CONFIG } from '../wise.types';
import { Logger } from '@nestjs/common';

/**
 * Wise Token Encryption Utility
 * Encrypts and decrypts API tokens using AES-256-GCM
 * (Same encryption pattern as TrueLayer/Plaid for consistency)
 */
export class WiseEncryptionUtil {
  private static readonly logger = new Logger(WiseEncryptionUtil.name);

  /**
   * Encrypt sensitive data (API tokens)
   */
  static encrypt(plainText: string, masterKey: string): string {
    try {
      // Generate random IV
      const iv = crypto.randomBytes(WISE_ENCRYPTION_CONFIG.ivLength);

      // Derive key from master key using PBKDF2
      const salt = crypto.randomBytes(WISE_ENCRYPTION_CONFIG.saltLength);
      const key = crypto.pbkdf2Sync(
        masterKey,
        salt,
        WISE_ENCRYPTION_CONFIG.iterations,
        WISE_ENCRYPTION_CONFIG.keyLength,
        WISE_ENCRYPTION_CONFIG.digest,
      );

      // Create cipher
      const cipher = crypto.createCipheriv(
        WISE_ENCRYPTION_CONFIG.algorithm,
        key,
        iv,
      );

      // Encrypt
      let encrypted = cipher.update(plainText, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine: salt + iv + authTag + encrypted
      const result = Buffer.concat([
        salt,
        iv,
        authTag,
        Buffer.from(encrypted, 'hex'),
      ]);

      return result.toString('base64');
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: string, masterKey: string): string {
    try {
      // Decode from base64
      const buffer = Buffer.from(encryptedData, 'base64');

      // Extract components
      const salt = buffer.subarray(0, WISE_ENCRYPTION_CONFIG.saltLength);
      const iv = buffer.subarray(
        WISE_ENCRYPTION_CONFIG.saltLength,
        WISE_ENCRYPTION_CONFIG.saltLength + WISE_ENCRYPTION_CONFIG.ivLength,
      );
      const authTag = buffer.subarray(
        WISE_ENCRYPTION_CONFIG.saltLength + WISE_ENCRYPTION_CONFIG.ivLength,
        WISE_ENCRYPTION_CONFIG.saltLength +
          WISE_ENCRYPTION_CONFIG.ivLength +
          WISE_ENCRYPTION_CONFIG.tagLength,
      );
      const encrypted = buffer.subarray(
        WISE_ENCRYPTION_CONFIG.saltLength +
          WISE_ENCRYPTION_CONFIG.ivLength +
          WISE_ENCRYPTION_CONFIG.tagLength,
      );

      // Derive key
      const key = crypto.pbkdf2Sync(
        masterKey,
        salt,
        WISE_ENCRYPTION_CONFIG.iterations,
        WISE_ENCRYPTION_CONFIG.keyLength,
        WISE_ENCRYPTION_CONFIG.digest,
      );

      // Create decipher
      const decipher = crypto.createDecipheriv(
        WISE_ENCRYPTION_CONFIG.algorithm,
        key,
        iv,
      );

      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Validate master key strength
   */
  static validateMasterKey(key: string): boolean {
    if (!key || key.length < 32) {
      this.logger.error('Master key too short (minimum 32 characters)');
      return false;
    }
    return true;
  }

  /**
   * Verify Wise webhook signature
   * Uses X-Signature-SHA256 header to verify webhook authenticity
   * See: https://api-docs.wise.com/api-reference/webhook
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    webhookSecret: string,
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('base64');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      return false;
    }
  }

  /**
   * Hash sensitive data for comparison
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
