import * as crypto from 'crypto';
import { EncryptedToken, PKCEChallenge } from '../interfaces/hmrc.interface';

/**
 * HMRC Encryption Configuration
 */
export const HMRC_ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm' as const,
  keyLength: 32, // 256 bits
  ivLength: 16, // 128 bits
  tagLength: 16, // 128 bits
};

/**
 * HMRC PKCE Configuration
 */
export const HMRC_PKCE_CONFIG = {
  codeVerifierLength: 32, // 256 bits of entropy
  stateLength: 32, // 256 bits of entropy
  challengeMethod: 'S256' as const,
};

/**
 * HMRC Encryption Utility
 * Provides AES-256-GCM encryption for token storage and PKCE utilities
 *
 * Security Features:
 * - AES-256-GCM authenticated encryption
 * - PKCE (Proof Key for Code Exchange) support
 * - Cryptographically secure random generation
 * - Timing-safe comparison
 */
export class HmrcEncryptionUtil {
  /**
   * Encrypt a string using AES-256-GCM
   */
  static encrypt(text: string, masterKey: string): EncryptedToken {
    // Generate random IV (Initialization Vector)
    const iv = crypto.randomBytes(HMRC_ENCRYPTION_CONFIG.ivLength);

    // Derive encryption key from master key using SHA-256
    const key = crypto
      .createHash('sha256')
      .update(masterKey)
      .digest()
      .slice(0, HMRC_ENCRYPTION_CONFIG.keyLength);

    // Create cipher
    const cipher = crypto.createCipheriv(
      HMRC_ENCRYPTION_CONFIG.algorithm,
      key,
      iv,
    );

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag (for GCM mode)
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
    // Derive encryption key from master key using SHA-256
    const key = crypto
      .createHash('sha256')
      .update(masterKey)
      .digest()
      .slice(0, HMRC_ENCRYPTION_CONFIG.keyLength);

    // Create decipher
    const decipher = crypto.createDecipheriv(
      HMRC_ENCRYPTION_CONFIG.algorithm,
      key,
      iv,
    );

    // Set authentication tag (for GCM mode)
    decipher.setAuthTag(tag);

    // Decrypt the data
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate PKCE challenge (SHA256 method)
   * @see https://tools.ietf.org/html/rfc7636
   */
  static generatePKCEChallenge(): PKCEChallenge {
    // Generate code verifier (base64url-encoded random string)
    const codeVerifier = crypto
      .randomBytes(HMRC_PKCE_CONFIG.codeVerifierLength)
      .toString('base64url');

    // Generate code challenge (SHA256 hash of verifier)
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Generate state parameter for CSRF protection
    const state = crypto
      .randomBytes(HMRC_PKCE_CONFIG.stateLength)
      .toString('base64url');

    return {
      codeVerifier,
      codeChallenge,
      state,
    };
  }

  /**
   * Generate a random state parameter for CSRF protection
   */
  static generateState(): string {
    return crypto
      .randomBytes(HMRC_PKCE_CONFIG.stateLength)
      .toString('base64url');
  }

  /**
   * Validate master key format and strength
   */
  static validateMasterKey(masterKey: string): boolean {
    if (!masterKey || typeof masterKey !== 'string') {
      return false;
    }
    // Master key should be at least 32 characters for security
    return masterKey.length >= 32;
  }

  /**
   * Hash a string using SHA-256
   */
  static hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Compare hash with text using timing-safe comparison
   */
  static compareHash(text: string, hash: string): boolean {
    const computedHash = this.hash(text);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(computedHash, 'hex'),
        Buffer.from(hash, 'hex'),
      );
    } catch (error) {
      // timingSafeEqual throws if lengths don't match
      return false;
    }
  }

  /**
   * Generate a cryptographically secure random string
   */
  static generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  /**
   * Generate a device ID for fraud prevention
   */
  static generateDeviceId(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
