import * as crypto from 'crypto';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Gusto Token Encryption Utility
 * Provides AES-256-GCM encryption/decryption for OAuth tokens
 *
 * Security:
 * - AES-256-GCM authenticated encryption
 * - Random IV for each encryption
 * - Authentication tag verification
 * - Base64 encoding for storage
 */
@Injectable()
export class GustoEncryptionUtil {
  private readonly logger = new Logger(GustoEncryptionUtil.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer | null = null;
  private readonly enabled: boolean;

  constructor() {
    // Get encryption key from environment
    const key = process.env.GUSTO_ENCRYPTION_KEY;
    if (!key) {
      this.logger.warn(
        'GustoEncryptionUtil disabled - GUSTO_ENCRYPTION_KEY environment variable is required. ' +
        'Generate a secure key: openssl rand -base64 32',
      );
      this.enabled = false;
      return;
    }

    // Ensure key is 32 bytes for AES-256
    this.encryptionKey = crypto
      .createHash('sha256')
      .update(key)
      .digest();
    this.enabled = true;
  }

  /**
   * Check if Gusto encryption is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get encryption key or throw if not configured
   */
  private getEncryptionKey(): Buffer {
    if (!this.encryptionKey) {
      throw new Error('Gusto encryption is not configured');
    }
    return this.encryptionKey;
  }

  /**
   * Encrypt a token
   * @param token - Plain text token to encrypt
   * @returns Base64 encoded encrypted token with IV and auth tag
   */
  encrypt(token: string): string {
    try {
      // Generate random IV (12 bytes for GCM)
      const iv = crypto.randomBytes(12);

      // Create cipher
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.getEncryptionKey(),
        iv,
      );

      // Encrypt
      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Combine IV + encrypted + authTag and encode as base64
      const combined = Buffer.concat([
        iv,
        Buffer.from(encrypted, 'hex'),
        authTag,
      ]);

      return combined.toString('base64');
    } catch (error) {
      this.logger.error('Token encryption failed', error);
      throw new Error('Failed to encrypt token');
    }
  }

  /**
   * Decrypt a token
   * @param encryptedToken - Base64 encoded encrypted token
   * @returns Plain text token
   */
  decrypt(encryptedToken: string): string {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedToken, 'base64');

      // Extract IV (first 12 bytes)
      const iv = combined.subarray(0, 12);

      // Extract auth tag (last 16 bytes)
      const authTag = combined.subarray(combined.length - 16);

      // Extract encrypted data (middle part)
      const encrypted = combined.subarray(12, combined.length - 16);

      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.getEncryptionKey(),
        iv,
      );

      // Set auth tag
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Token decryption failed', error);
      throw new Error('Failed to decrypt token');
    }
  }

  /**
   * Generate a cryptographically secure random state parameter
   * @returns Random state string (32 bytes base64 encoded)
   */
  generateState(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate PKCE code verifier
   * @returns Random code verifier (43-128 characters)
   */
  generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate PKCE code challenge from verifier
   * @param verifier - Code verifier
   * @returns Base64 URL encoded SHA256 hash of verifier
   */
  generateCodeChallenge(verifier: string): string {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');
  }

  /**
   * Verify webhook signature
   * @param payload - Webhook payload (raw string)
   * @param signature - Signature from X-Gusto-Signature header
   * @param secret - Webhook secret
   * @returns True if signature is valid
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      // Constant-time comparison to prevent timing attacks
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
   * @param data - Data to hash
   * @returns SHA256 hash (hex)
   */
  hash(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }
}
