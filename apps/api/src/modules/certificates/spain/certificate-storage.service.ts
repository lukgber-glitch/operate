import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt,
  createHash,
} from 'crypto';
import { promisify } from 'util';
import {
  EncryptionResult,
  SpainCertificateError,
  SpainCertificateErrorCode,
} from './interfaces/spain-certificate.interface';

const scryptAsync = promisify(scrypt);

/**
 * Certificate Storage Service with AES-256-GCM Encryption
 *
 * Provides secure encryption and decryption for Spanish SII certificates.
 * Uses AES-256-GCM with scrypt key derivation for strong security.
 *
 * Security Features:
 * - AES-256-GCM authenticated encryption
 * - Scrypt key derivation with random salt
 * - Unique IV per encryption operation
 * - Authentication tag verification
 * - Environment-based master key management
 *
 * @security
 * - Master key must be at least 32 characters
 * - Master key stored in environment variables
 * - Never log or expose decrypted data
 * - Use constant-time comparison for auth tags
 */
@Injectable()
export class CertificateStorageService {
  private readonly logger = new Logger(CertificateStorageService.name);
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY_LENGTH = 32; // 256 bits
  private readonly IV_LENGTH = 16; // 128 bits
  private readonly SALT_LENGTH = 32; // 256 bits
  private readonly AUTH_TAG_LENGTH = 16; // 128 bits

  constructor(private readonly config: ConfigService) {}

  /**
   * Encrypt data using AES-256-GCM
   *
   * @param data - Buffer to encrypt (certificate or password)
   * @param masterKey - Optional master key override (for key rotation)
   * @returns Encrypted data, IV, and authentication tag
   */
  async encrypt(
    data: Buffer,
    masterKey?: string,
  ): Promise<EncryptionResult> {
    try {
      const key = masterKey || this.getMasterKey();
      const salt = randomBytes(this.SALT_LENGTH);
      const iv = randomBytes(this.IV_LENGTH);

      // Derive key from master key using scrypt (CPU and memory hard)
      const derivedKey = (await scryptAsync(
        key,
        salt,
        this.KEY_LENGTH,
      )) as Buffer;

      // Create cipher with AES-256-GCM
      const cipher = createCipheriv(this.ALGORITHM, derivedKey, iv);

      // Encrypt: prepend salt to ciphertext for decryption
      const encrypted = Buffer.concat([
        salt,
        cipher.update(data),
        cipher.final(),
      ]);

      // Get authentication tag for integrity verification
      const authTag = cipher.getAuthTag();

      this.logger.debug('Data encrypted successfully');

      return {
        encrypted,
        iv,
        authTag,
      };
    } catch (error) {
      this.logger.error(`Encryption failed: ${error.message}`, error.stack);
      throw new SpainCertificateError(
        'Failed to encrypt data',
        SpainCertificateErrorCode.ENCRYPTION_FAILED,
        { originalError: error.message },
      );
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   *
   * @param encrypted - Encrypted data components
   * @param masterKey - Optional master key override (for key rotation)
   * @returns Decrypted buffer
   * @throws SpainCertificateError if decryption fails or auth tag invalid
   */
  async decrypt(
    encrypted: {
      encrypted: Buffer;
      iv: Buffer;
      authTag: Buffer;
    },
    masterKey?: string,
  ): Promise<Buffer> {
    try {
      const key = masterKey || this.getMasterKey();

      // Extract salt from the beginning of encrypted data
      const salt = encrypted.encrypted.subarray(0, this.SALT_LENGTH);
      const ciphertext = encrypted.encrypted.subarray(this.SALT_LENGTH);

      // Derive key using same scrypt parameters
      const derivedKey = (await scryptAsync(
        key,
        salt,
        this.KEY_LENGTH,
      )) as Buffer;

      // Create decipher
      const decipher = createDecipheriv(
        this.ALGORITHM,
        derivedKey,
        encrypted.iv,
      );

      // Set authentication tag for integrity verification
      decipher.setAuthTag(encrypted.authTag);

      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(), // Will throw if auth tag doesn't match
      ]);

      this.logger.debug('Data decrypted successfully');

      return decrypted;
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`);

      // Specific error handling for auth tag failures
      if (error.message.includes('Unsupported state or unable to authenticate data')) {
        throw new SpainCertificateError(
          'Data integrity check failed - possible tampering or wrong encryption key',
          SpainCertificateErrorCode.DECRYPTION_FAILED,
          { reason: 'authentication_failed' },
        );
      }

      throw new SpainCertificateError(
        'Failed to decrypt data',
        SpainCertificateErrorCode.DECRYPTION_FAILED,
        { originalError: error.message },
      );
    }
  }

  /**
   * Generate SHA-256 thumbprint from certificate data
   *
   * @param certificateData - Raw certificate buffer
   * @returns Hex-encoded SHA-256 hash (thumbprint)
   */
  generateThumbprint(certificateData: Buffer): string {
    const hash = createHash('sha256');
    hash.update(certificateData);
    return hash.digest('hex').toUpperCase();
  }

  /**
   * Verify thumbprint matches certificate data
   *
   * @param certificateData - Raw certificate buffer
   * @param expectedThumbprint - Expected thumbprint
   * @returns True if thumbprint matches
   */
  verifyThumbprint(
    certificateData: Buffer,
    expectedThumbprint: string,
  ): boolean {
    const actualThumbprint = this.generateThumbprint(certificateData);
    return actualThumbprint === expectedThumbprint.toUpperCase();
  }

  /**
   * Get master encryption key from environment
   *
   * @private
   * @returns Master encryption key
   * @throws Error if key not configured or too short
   */
  private getMasterKey(): string {
    const key = this.config.get<string>('SPAIN_SII_CERT_ENCRYPTION_KEY');

    if (!key) {
      throw new Error(
        'SPAIN_SII_CERT_ENCRYPTION_KEY environment variable is not set. ' +
          'Generate a secure key with: openssl rand -base64 32',
      );
    }

    if (key.length < 32) {
      throw new Error(
        'SPAIN_SII_CERT_ENCRYPTION_KEY must be at least 32 characters long for AES-256',
      );
    }

    return key;
  }

  /**
   * Test encryption/decryption with sample data
   * Used for health checks and key validation
   *
   * @returns True if encryption/decryption works
   */
  async testEncryption(): Promise<boolean> {
    try {
      const testData = Buffer.from('test-encryption-' + Date.now());
      const encrypted = await this.encrypt(testData);
      const decrypted = await this.decrypt(encrypted);

      return testData.equals(decrypted);
    } catch (error) {
      this.logger.error(
        `Encryption test failed: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
}
