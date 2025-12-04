import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ZATCA_CONSTANTS } from '../integrations/zatca/zatca-certificate.constants';

/**
 * Key Management Service
 *
 * Provides secure key management for ZATCA certificates
 * Supports:
 * - AES-256-GCM encryption/decryption
 * - Key derivation from master key
 * - Integration with AWS KMS or Azure Key Vault (future)
 * - HSM integration interface (future)
 * - Audit logging for all operations
 */
@Injectable()
export class KeyManagementService {
  private readonly logger = new Logger(KeyManagementService.name);
  private masterKey: Buffer;
  private readonly keyCache = new Map<string, Buffer>();

  constructor(private configService: ConfigService) {
    this.initializeMasterKey();
  }

  /**
   * Initialize master key from environment
   * In production, this should be fetched from KMS/HSM
   */
  private initializeMasterKey(): void {
    const masterKeyHex = this.configService.get<string>('ZATCA_MASTER_KEY');

    if (!masterKeyHex) {
      // For development only - generate a random master key
      this.logger.warn(
        'No ZATCA_MASTER_KEY found in environment. Generating random key for development.',
      );
      this.masterKey = crypto.randomBytes(32);
    } else {
      this.masterKey = Buffer.from(masterKeyHex, 'hex');
    }

    if (this.masterKey.length !== 32) {
      throw new Error('Master key must be 256 bits (32 bytes)');
    }

    this.logger.log('Key Management Service initialized');
  }

  /**
   * Derive encryption key from master key using HKDF
   * @param keyId Unique identifier for the key
   * @param info Additional context information
   */
  private deriveKey(keyId: string, info: string = 'zatca-certificate'): Buffer {
    // Check cache
    const cacheKey = `${keyId}-${info}`;
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey)!;
    }

    // Derive key using HKDF
    const salt = Buffer.from(keyId);
    const derivedKey = crypto.hkdfSync(
      'sha256',
      this.masterKey,
      salt,
      Buffer.from(info),
      32, // 256 bits
    );

    // Cache the derived key
    this.keyCache.set(cacheKey, derivedKey);

    return derivedKey;
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param data Data to encrypt
   * @param keyId Key identifier for key derivation
   * @returns Encrypted data with IV and auth tag
   */
  encrypt(
    data: Buffer | string,
    keyId: string,
  ): {
    encryptedData: Buffer;
    iv: Buffer;
    authTag: Buffer;
  } {
    try {
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');

      // Derive encryption key
      const encryptionKey = this.deriveKey(keyId);

      // Generate random IV
      const iv = crypto.randomBytes(ZATCA_CONSTANTS.CRYPTO.ENCRYPTION.IV_LENGTH);

      // Create cipher
      const cipher = crypto.createCipheriv(
        ZATCA_CONSTANTS.CRYPTO.ENCRYPTION.ALGORITHM,
        encryptionKey,
        iv,
      );

      // Encrypt
      const encryptedData = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);

      // Get auth tag
      const authTag = cipher.getAuthTag();

      this.logger.debug(`Encrypted data with key ID: ${keyId}`);

      return {
        encryptedData,
        iv,
        authTag,
      };
    } catch (error) {
      this.logger.error(`Encryption failed: ${error.message}`, error.stack);
      throw new Error(ZATCA_CONSTANTS.ERROR_CODES.ENCRYPTION_FAILED);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param encryptedData Encrypted data
   * @param iv Initialization vector
   * @param authTag Authentication tag
   * @param keyId Key identifier for key derivation
   * @returns Decrypted data
   */
  decrypt(
    encryptedData: Buffer,
    iv: Buffer,
    authTag: Buffer,
    keyId: string,
  ): Buffer {
    try {
      // Derive encryption key
      const encryptionKey = this.deriveKey(keyId);

      // Create decipher
      const decipher = crypto.createDecipheriv(
        ZATCA_CONSTANTS.CRYPTO.ENCRYPTION.ALGORITHM,
        encryptionKey,
        iv,
      );

      // Set auth tag
      decipher.setAuthTag(authTag);

      // Decrypt
      const decryptedData = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ]);

      this.logger.debug(`Decrypted data with key ID: ${keyId}`);

      return decryptedData;
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`, error.stack);
      throw new Error(ZATCA_CONSTANTS.ERROR_CODES.DECRYPTION_FAILED);
    }
  }

  /**
   * Generate a unique key ID
   */
  generateKeyId(): string {
    return `key_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Rotate master key (future implementation)
   * This would involve re-encrypting all data with a new master key
   */
  async rotateMasterKey(): Promise<void> {
    throw new Error('Master key rotation not yet implemented');
  }

  /**
   * Integration with AWS KMS (future implementation)
   */
  async encryptWithKms(data: Buffer, kmsKeyId: string): Promise<Buffer> {
    throw new Error('KMS integration not yet implemented');
  }

  /**
   * Integration with AWS KMS (future implementation)
   */
  async decryptWithKms(encryptedData: Buffer, kmsKeyId: string): Promise<Buffer> {
    throw new Error('KMS integration not yet implemented');
  }

  /**
   * Integration with Azure Key Vault (future implementation)
   */
  async encryptWithKeyVault(data: Buffer, vaultKeyId: string): Promise<Buffer> {
    throw new Error('Azure Key Vault integration not yet implemented');
  }

  /**
   * Integration with HSM (future implementation)
   */
  async encryptWithHsm(data: Buffer, hsmKeyId: string): Promise<Buffer> {
    throw new Error('HSM integration not yet implemented');
  }

  /**
   * Clear key cache (for security)
   */
  clearKeyCache(): void {
    this.keyCache.clear();
    this.logger.log('Key cache cleared');
  }

  /**
   * Validate key ID format
   */
  validateKeyId(keyId: string): boolean {
    return /^key_[0-9]+_[a-f0-9]{16}$/.test(keyId);
  }
}
