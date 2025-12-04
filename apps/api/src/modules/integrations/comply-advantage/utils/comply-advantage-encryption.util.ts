import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';

/**
 * ComplyAdvantage Encryption Utility
 * Encrypts and decrypts API credentials using AES-256-GCM
 */
export class ComplyAdvantageEncryptionUtil {
  private static readonly logger = new Logger(ComplyAdvantageEncryptionUtil.name);

  // Encryption configuration
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly SALT_LENGTH = 32;
  private static readonly TAG_LENGTH = 16; // 128 bits
  private static readonly ITERATIONS = 100000;
  private static readonly DIGEST = 'sha256';

  /**
   * Encrypt sensitive data (API keys, credentials)
   */
  static encrypt(plainText: string, masterKey: string): string {
    try {
      // Generate random IV
      const iv = crypto.randomBytes(this.IV_LENGTH);

      // Generate salt
      const salt = crypto.randomBytes(this.SALT_LENGTH);

      // Derive key from master key using PBKDF2
      const key = crypto.pbkdf2Sync(
        masterKey,
        salt,
        this.ITERATIONS,
        this.KEY_LENGTH,
        this.DIGEST,
      );

      // Create cipher
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

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
      const salt = buffer.subarray(0, this.SALT_LENGTH);
      const iv = buffer.subarray(
        this.SALT_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH,
      );
      const authTag = buffer.subarray(
        this.SALT_LENGTH + this.IV_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH,
      );
      const encrypted = buffer.subarray(
        this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH,
      );

      // Derive key
      const key = crypto.pbkdf2Sync(
        masterKey,
        salt,
        this.ITERATIONS,
        this.KEY_LENGTH,
        this.DIGEST,
      );

      // Create decipher
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
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
   * Generate webhook signature
   */
  static generateWebhookSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const computed = this.generateWebhookSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(signature),
    );
  }

  /**
   * Hash sensitive data for comparison
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate secure random identifier
   */
  static generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}
