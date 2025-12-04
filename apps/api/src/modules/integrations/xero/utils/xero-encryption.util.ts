import * as crypto from 'crypto';
import { XERO_ENCRYPTION_CONFIG, XERO_PKCE_CONFIG } from '../xero.config';
import { EncryptedToken, PKCEChallenge } from '../xero.types';

/**
 * Xero Encryption Utility
 * Provides AES-256-GCM encryption for token storage and PKCE utilities
 */
export class XeroEncryptionUtil {
  /**
   * Encrypt a string using AES-256-GCM
   */
  static encrypt(text: string, masterKey: string): EncryptedToken {
    // Generate random IV
    const iv = crypto.randomBytes(XERO_ENCRYPTION_CONFIG.ivLength);

    // Derive encryption key from master key
    const key = crypto
      .createHash('sha256')
      .update(masterKey)
      .digest()
      .slice(0, XERO_ENCRYPTION_CONFIG.keyLength);

    // Create cipher
    const cipher = crypto.createCipheriv(
      XERO_ENCRYPTION_CONFIG.algorithm,
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
      .slice(0, XERO_ENCRYPTION_CONFIG.keyLength);

    // Create decipher
    const decipher = crypto.createDecipheriv(
      XERO_ENCRYPTION_CONFIG.algorithm,
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
    // Generate code verifier
    const codeVerifier = crypto
      .randomBytes(XERO_PKCE_CONFIG.codeVerifierLength)
      .toString('base64url');

    // Generate code challenge (SHA256 of verifier)
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Generate state
    const state = crypto
      .randomBytes(XERO_PKCE_CONFIG.stateLength)
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
      .randomBytes(XERO_PKCE_CONFIG.stateLength)
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
   * Compare hash with text
   */
  static compareHash(text: string, hash: string): boolean {
    const computedHash = this.hash(text);
    return crypto.timingSafeEqual(
      Buffer.from(computedHash),
      Buffer.from(hash),
    );
  }
}
