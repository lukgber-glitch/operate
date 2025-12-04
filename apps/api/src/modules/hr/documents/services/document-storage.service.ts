import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { UPLOAD_CONSTRAINTS } from '../types/employee-document.types';

const scryptAsync = promisify(scrypt);

/**
 * Document Storage Service
 * Handles secure storage, encryption, and retrieval of employee documents
 */
@Injectable()
export class DocumentStorageService {
  private readonly logger = new Logger(DocumentStorageService.name);
  private readonly storageBasePath: string;
  private readonly encryptionKey: Buffer;
  private readonly useS3: boolean;

  constructor(private configService: ConfigService) {
    this.useS3 = this.configService.get<boolean>('STORAGE_USE_S3', false);
    this.storageBasePath =
      this.configService.get<string>('STORAGE_PATH') || './storage/documents';

    // For production, retrieve from secure key management service (AWS KMS, HashiCorp Vault, etc.)
    const keyString =
      this.configService.get<string>('DOCUMENT_ENCRYPTION_KEY') ||
      'CHANGE_THIS_IN_PRODUCTION_USE_KMS_OR_VAULT';

    // Derive a 32-byte key from the configuration string
    this.encryptionKey = Buffer.from(keyString.padEnd(32, '0').slice(0, 32));

    this.ensureStorageDirectory();
  }

  /**
   * Ensure storage directory exists
   */
  private async ensureStorageDirectory(): Promise<void> {
    if (!this.useS3 && !existsSync(this.storageBasePath)) {
      await mkdir(this.storageBasePath, { recursive: true });
      this.logger.log(`Created storage directory: ${this.storageBasePath}`);
    }
  }

  /**
   * Validate uploaded file
   */
  validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > UPLOAD_CONSTRAINTS.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${UPLOAD_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }

    // Check MIME type
    if (!UPLOAD_CONSTRAINTS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${UPLOAD_CONSTRAINTS.ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    // Check file extension
    const ext = this.getFileExtension(file.originalname);
    if (!UPLOAD_CONSTRAINTS.ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `File extension ${ext} is not allowed. Allowed extensions: ${UPLOAD_CONSTRAINTS.ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }
  }

  /**
   * Store document securely (encrypted)
   */
  async storeDocument(
    file: Express.Multer.File,
    metadata: {
      employeeId: string;
      documentType: string;
      orgId: string;
    },
  ): Promise<{
    storageKey: string;
    encryptionKeyId: string;
    fileSize: number;
    mimeType: string;
  }> {
    try {
      this.validateFile(file);

      // Generate unique storage key
      const storageKey = this.generateStorageKey(
        metadata.orgId,
        metadata.employeeId,
        metadata.documentType,
        file.originalname,
      );

      if (this.useS3) {
        // TODO: Implement S3 upload with encryption
        // Use AWS SDK to upload to S3 with SSE-KMS or SSE-C
        throw new InternalServerErrorException('S3 storage not yet implemented');
      } else {
        // Encrypt and store locally
        const encryptedData = await this.encryptData(file.buffer);
        const fullPath = join(this.storageBasePath, storageKey);

        // Ensure directory exists
        const dir = join(this.storageBasePath, metadata.orgId, metadata.employeeId);
        if (!existsSync(dir)) {
          await mkdir(dir, { recursive: true });
        }

        await writeFile(fullPath, encryptedData);

        this.logger.log(
          `Stored encrypted document: ${storageKey} (${file.size} bytes)`,
        );
      }

      return {
        storageKey,
        encryptionKeyId: 'local-key-v1', // In production, use KMS key ID
        fileSize: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.logger.error(`Failed to store document: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to store document securely');
    }
  }

  /**
   * Retrieve and decrypt document
   */
  async retrieveDocument(storageKey: string): Promise<Buffer> {
    try {
      if (this.useS3) {
        // TODO: Implement S3 download with decryption
        throw new InternalServerErrorException('S3 storage not yet implemented');
      } else {
        const fullPath = join(this.storageBasePath, storageKey);

        if (!existsSync(fullPath)) {
          throw new BadRequestException('Document not found');
        }

        const encryptedData = await readFile(fullPath);
        const decryptedData = await this.decryptData(encryptedData);

        this.logger.log(`Retrieved document: ${storageKey}`);

        return decryptedData;
      }
    } catch (error) {
      this.logger.error(
        `Failed to retrieve document: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve document');
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(storageKey: string): Promise<void> {
    try {
      if (this.useS3) {
        // TODO: Implement S3 delete
        throw new InternalServerErrorException('S3 storage not yet implemented');
      } else {
        const fullPath = join(this.storageBasePath, storageKey);

        if (existsSync(fullPath)) {
          await unlink(fullPath);
          this.logger.log(`Deleted document: ${storageKey}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to delete document: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to delete document');
    }
  }

  /**
   * Generate storage key
   */
  private generateStorageKey(
    orgId: string,
    employeeId: string,
    documentType: string,
    originalFilename: string,
  ): string {
    const timestamp = Date.now();
    const randomSuffix = randomBytes(8).toString('hex');
    const ext = this.getFileExtension(originalFilename);

    return `${orgId}/${employeeId}/${documentType}-${timestamp}-${randomSuffix}${ext}`;
  }

  /**
   * Get file extension
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : '';
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  private async encryptData(data: Buffer): Promise<Buffer> {
    try {
      // Generate random IV (Initialization Vector)
      const iv = randomBytes(16);

      // Create cipher
      const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);

      // Encrypt data
      const encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Combine IV + authTag + encryptedData
      return Buffer.concat([iv, authTag, encryptedData]);
    } catch (error) {
      this.logger.error(`Encryption failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Encryption failed');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  private async decryptData(encryptedBuffer: Buffer): Promise<Buffer> {
    try {
      // Extract IV (first 16 bytes)
      const iv = encryptedBuffer.subarray(0, 16);

      // Extract auth tag (next 16 bytes)
      const authTag = encryptedBuffer.subarray(16, 32);

      // Extract encrypted data (remaining bytes)
      const encryptedData = encryptedBuffer.subarray(32);

      // Create decipher
      const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt data
      return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Decryption failed');
    }
  }

  /**
   * Encrypt sensitive text (e.g., SSN)
   */
  async encryptText(plaintext: string): Promise<string> {
    const buffer = Buffer.from(plaintext, 'utf8');
    const encrypted = await this.encryptData(buffer);
    return encrypted.toString('base64');
  }

  /**
   * Decrypt sensitive text
   */
  async decryptText(ciphertext: string): Promise<string> {
    const buffer = Buffer.from(ciphertext, 'base64');
    const decrypted = await this.decryptData(buffer);
    return decrypted.toString('utf8');
  }

  /**
   * Check if document exists
   */
  async documentExists(storageKey: string): Promise<boolean> {
    if (this.useS3) {
      // TODO: Check S3 object existence
      return false;
    } else {
      const fullPath = join(this.storageBasePath, storageKey);
      return existsSync(fullPath);
    }
  }

  /**
   * Get document size
   */
  async getDocumentSize(storageKey: string): Promise<number> {
    if (this.useS3) {
      // TODO: Get S3 object size
      return 0;
    } else {
      const fullPath = join(this.storageBasePath, storageKey);
      if (!existsSync(fullPath)) {
        throw new BadRequestException('Document not found');
      }
      const stats = await readFile(fullPath);
      return stats.length;
    }
  }
}
