import * as crypto from 'crypto';
import { EncryptedCraCredentials } from '../interfaces/cra.interface';

/**
 * CRA Encryption Utility
 *
 * Provides AES-256-GCM encryption for CRA credentials
 * Uses authenticated encryption to ensure data integrity
 */
export class CraEncryptionUtil {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly AUTH_TAG_LENGTH = 16; // 128 bits
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly ENCODING: BufferEncoding = 'base64';
  private static readonly VERSION = '1';

  /**
   * Encrypt data using AES-256-GCM
   */
  static encrypt(plaintext: string, masterKey: string): EncryptedCraCredentials {
    try {
      // Derive encryption key from master key
      const key = this.deriveKey(masterKey);

      // Generate random IV
      const iv = crypto.randomBytes(this.IV_LENGTH);

      // Create cipher
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', this.ENCODING);
      encrypted += cipher.final(this.ENCODING);

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString(this.ENCODING),
        authTag: authTag.toString(this.ENCODING),
        version: this.VERSION,
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  static decrypt(
    encrypted: EncryptedCraCredentials,
    masterKey: string,
  ): string {
    try {
      // Derive encryption key
      const key = this.deriveKey(masterKey);

      // Convert IV and auth tag from base64
      const iv = Buffer.from(encrypted.iv, this.ENCODING);
      const authTag = Buffer.from(encrypted.authTag, this.ENCODING);

      // Create decipher
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt data
      let decrypted = decipher.update(
        encrypted.encryptedData,
        this.ENCODING,
        'utf8',
      );
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Derive encryption key from master key using PBKDF2
   */
  private static deriveKey(masterKey: string): Buffer {
    // Use PBKDF2 to derive a consistent key from the master key
    // Salt is fixed for deterministic key derivation
    const salt = 'cra-netfile-v1';
    const iterations = 100000;

    return crypto.pbkdf2Sync(
      masterKey,
      salt,
      iterations,
      this.KEY_LENGTH,
      'sha256',
    );
  }

  /**
   * Validate master key
   */
  static validateMasterKey(masterKey: string): boolean {
    if (!masterKey || typeof masterKey !== 'string') {
      return false;
    }

    // Master key should be at least 32 characters
    if (masterKey.length < 32) {
      return false;
    }

    return true;
  }

  /**
   * Generate a secure random master key
   */
  static generateMasterKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash sensitive data for comparison (one-way)
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate secure random token
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  static secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    return crypto.timingSafeEqual(bufA, bufB);
  }
}
