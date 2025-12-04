import * as crypto from 'crypto';
import { TINK_ENCRYPTION_CONFIG } from '../tink.config';
import { Logger } from '@nestjs/common';

/**
 * Tink Token Encryption Utility
 * Encrypts and decrypts refresh tokens using AES-256-GCM
 */
export class TinkEncryptionUtil {
  private static readonly logger = new Logger(TinkEncryptionUtil.name);

  /**
   * Encrypt sensitive data (refresh tokens, access tokens)
   */
  static encrypt(plainText: string, masterKey: string): string {
    try {
      // Generate random IV
      const iv = crypto.randomBytes(TINK_ENCRYPTION_CONFIG.ivLength);

      // Derive key from master key using PBKDF2
      const salt = crypto.randomBytes(TINK_ENCRYPTION_CONFIG.saltLength);
      const key = crypto.pbkdf2Sync(
        masterKey,
        salt,
        TINK_ENCRYPTION_CONFIG.iterations,
        TINK_ENCRYPTION_CONFIG.keyLength,
        TINK_ENCRYPTION_CONFIG.digest,
      );

      // Create cipher
      const cipher = crypto.createCipheriv(
        TINK_ENCRYPTION_CONFIG.algorithm,
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
      const salt = buffer.subarray(0, TINK_ENCRYPTION_CONFIG.saltLength);
      const iv = buffer.subarray(
        TINK_ENCRYPTION_CONFIG.saltLength,
        TINK_ENCRYPTION_CONFIG.saltLength + TINK_ENCRYPTION_CONFIG.ivLength,
      );
      const authTag = buffer.subarray(
        TINK_ENCRYPTION_CONFIG.saltLength + TINK_ENCRYPTION_CONFIG.ivLength,
        TINK_ENCRYPTION_CONFIG.saltLength +
          TINK_ENCRYPTION_CONFIG.ivLength +
          TINK_ENCRYPTION_CONFIG.tagLength,
      );
      const encrypted = buffer.subarray(
        TINK_ENCRYPTION_CONFIG.saltLength +
          TINK_ENCRYPTION_CONFIG.ivLength +
          TINK_ENCRYPTION_CONFIG.tagLength,
      );

      // Derive key
      const key = crypto.pbkdf2Sync(
        masterKey,
        salt,
        TINK_ENCRYPTION_CONFIG.iterations,
        TINK_ENCRYPTION_CONFIG.keyLength,
        TINK_ENCRYPTION_CONFIG.digest,
      );

      // Create decipher
      const decipher = crypto.createDecipheriv(
        TINK_ENCRYPTION_CONFIG.algorithm,
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
   * Generate PKCE code verifier
   */
  static generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate PKCE code challenge from verifier
   */
  static generateCodeChallenge(verifier: string): string {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');
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
   * Hash sensitive data for comparison (e.g., token signatures)
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify hash
   */
  static verifyHash(data: string, hash: string): boolean {
    const computed = this.hash(data);
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  }
}
