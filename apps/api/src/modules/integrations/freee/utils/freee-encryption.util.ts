import * as crypto from 'crypto';
import { FREEE_ENCRYPTION_CONFIG, FREEE_PKCE_CONFIG } from '../freee.config';
import { EncryptedToken, PKCEChallenge } from '../freee.types';

/**
 * freee Encryption Utility
 * Provides AES-256-GCM encryption for token storage and PKCE utilities
 */
export class FreeeEncryptionUtil {
  /**
   * Encrypt a string using AES-256-GCM
   */
  static encrypt(text: string, masterKey: string): EncryptedToken {
    // Generate random IV
    const iv = crypto.randomBytes(FREEE_ENCRYPTION_CONFIG.ivLength);

    // Derive encryption key from master key
    const key = crypto
      .createHash('sha256')
      .update(masterKey)
      .digest()
      .slice(0, FREEE_ENCRYPTION_CONFIG.keyLength);

    // Create cipher
    const cipher = crypto.createCipheriv(
      FREEE_ENCRYPTION_CONFIG.algorithm,
      key,
      iv,
    );

    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get auth tag
    const tag = cipher.getAuthTag();

    return {
      encryptedData: encrypted,
      iv,
      tag,
    };
  }

  /**
   * Decrypt a string using AES-256-GCM
   */
  static decrypt(
    encryptedData: string,
    iv: Buffer,
    tag: Buffer,
    masterKey: string,
  ): string {
    // Derive encryption key from master key
    const key = crypto
      .createHash('sha256')
      .update(masterKey)
      .digest()
      .slice(0, FREEE_ENCRYPTION_CONFIG.keyLength);

    // Create decipher
    const decipher = crypto.createDecipheriv(
      FREEE_ENCRYPTION_CONFIG.algorithm,
      key,
      iv,
    );

    // Set auth tag
    decipher.setAuthTag(tag);

    // Decrypt
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate PKCE challenge (SHA256)
   */
  static generatePKCEChallenge(): PKCEChallenge {
    // Generate code verifier (43-128 characters)
    const codeVerifier = crypto
      .randomBytes(FREEE_PKCE_CONFIG.codeVerifierLength)
      .toString('base64url');

    // Generate code challenge (SHA256 of verifier)
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Generate state
    const state = crypto
      .randomBytes(FREEE_PKCE_CONFIG.stateLength)
      .toString('base64url');

    return {
      codeVerifier,
      codeChallenge,
      state,
    };
  }

  /**
   * Generate a random state parameter
   */
  static generateState(): string {
    return crypto
      .randomBytes(FREEE_PKCE_CONFIG.stateLength)
      .toString('base64url');
  }

  /**
   * Validate master key format
   */
  static validateMasterKey(masterKey: string): boolean {
    if (!masterKey || typeof masterKey !== 'string') {
      return false;
    }
    // Master key should be at least 32 characters
    return masterKey.length >= 32;
  }

  /**
   * Hash a string using SHA256
   */
  static hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Compare hash with text (timing-safe)
   */
  static compareHash(text: string, hash: string): boolean {
    const computedHash = this.hash(text);
    return crypto.timingSafeEqual(
      Buffer.from(computedHash),
      Buffer.from(hash),
    );
  }

  /**
   * Generate HMAC signature for webhook verification
   */
  static generateWebhookSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Verify webhook signature (timing-safe)
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const expectedSignature = this.generateWebhookSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }
}
