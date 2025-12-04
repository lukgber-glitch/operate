import * as crypto from 'crypto';
import { PLAID_ENCRYPTION_CONFIG } from '../plaid.types';
import { Logger } from '@nestjs/common';

/**
 * Plaid Token Encryption Utility
 * Encrypts and decrypts access tokens using AES-256-GCM
 */
export class PlaidEncryptionUtil {
  private static readonly logger = new Logger(PlaidEncryptionUtil.name);

  /**
   * Encrypt sensitive data (access tokens)
   */
  static encrypt(plainText: string, masterKey: string): string {
    try {
      // Generate random IV
      const iv = crypto.randomBytes(PLAID_ENCRYPTION_CONFIG.ivLength);

      // Derive key from master key using PBKDF2
      const salt = crypto.randomBytes(PLAID_ENCRYPTION_CONFIG.saltLength);
      const key = crypto.pbkdf2Sync(
        masterKey,
        salt,
        PLAID_ENCRYPTION_CONFIG.iterations,
        PLAID_ENCRYPTION_CONFIG.keyLength,
        PLAID_ENCRYPTION_CONFIG.digest,
      );

      // Create cipher
      const cipher = crypto.createCipheriv(
        PLAID_ENCRYPTION_CONFIG.algorithm,
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
      const salt = buffer.subarray(0, PLAID_ENCRYPTION_CONFIG.saltLength);
      const iv = buffer.subarray(
        PLAID_ENCRYPTION_CONFIG.saltLength,
        PLAID_ENCRYPTION_CONFIG.saltLength + PLAID_ENCRYPTION_CONFIG.ivLength,
      );
      const authTag = buffer.subarray(
        PLAID_ENCRYPTION_CONFIG.saltLength + PLAID_ENCRYPTION_CONFIG.ivLength,
        PLAID_ENCRYPTION_CONFIG.saltLength +
          PLAID_ENCRYPTION_CONFIG.ivLength +
          PLAID_ENCRYPTION_CONFIG.tagLength,
      );
      const encrypted = buffer.subarray(
        PLAID_ENCRYPTION_CONFIG.saltLength +
          PLAID_ENCRYPTION_CONFIG.ivLength +
          PLAID_ENCRYPTION_CONFIG.tagLength,
      );

      // Derive key
      const key = crypto.pbkdf2Sync(
        masterKey,
        salt,
        PLAID_ENCRYPTION_CONFIG.iterations,
        PLAID_ENCRYPTION_CONFIG.keyLength,
        PLAID_ENCRYPTION_CONFIG.digest,
      );

      // Create decipher
      const decipher = crypto.createDecipheriv(
        PLAID_ENCRYPTION_CONFIG.algorithm,
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
   * Generate secure random state for OAuth2 flow
   */
  static generateState(): string {
    return crypto.randomBytes(32).toString('base64url');
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
   * Hash sensitive data for comparison (e.g., webhook signatures)
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify Plaid webhook signature
   * Uses HMAC-SHA256 to verify webhook authenticity
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
        .digest('hex');

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
   * Verify hash with timing-safe comparison
   */
  static verifyHash(data: string, hash: string): boolean {
    const computed = this.hash(data);
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  }
}
