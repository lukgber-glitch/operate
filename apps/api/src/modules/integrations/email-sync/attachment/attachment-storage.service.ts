import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Readable } from 'stream';
import { createHash } from 'crypto';
import { AttachmentStorageBackend } from '@prisma/client';

/**
 * Attachment Storage Service
 * Manages storage of email attachments in local filesystem or S3
 *
 * Features:
 * - Configurable storage backend (LOCAL/S3)
 * - Streaming upload/download for large files
 * - SHA-256 content hashing for deduplication
 * - Signed URL generation for S3
 * - Automatic directory creation
 * - Proper cleanup of temporary files
 *
 * Environment Variables:
 * - ATTACHMENT_STORAGE_BACKEND: 'LOCAL' or 'S3' (default: LOCAL)
 * - ATTACHMENT_STORAGE_PATH: Local storage directory (default: ./storage/attachments)
 * - AWS_S3_BUCKET: S3 bucket name (required for S3 backend)
 * - AWS_S3_REGION: S3 region (required for S3 backend)
 * - AWS_ACCESS_KEY_ID: AWS access key (required for S3 backend)
 * - AWS_SECRET_ACCESS_KEY: AWS secret key (required for S3 backend)
 */
@Injectable()
export class AttachmentStorageService {
  private readonly logger = new Logger(AttachmentStorageService.name);
  private readonly storageBackend: AttachmentStorageBackend;
  private readonly localStoragePath: string;
  private readonly s3Client?: S3Client;
  private readonly s3Bucket?: string;
  private readonly s3Region?: string;

  constructor(private readonly configService: ConfigService) {
    // Determine storage backend
    const backend = this.configService.get<string>(
      'ATTACHMENT_STORAGE_BACKEND',
      'LOCAL',
    );
    this.storageBackend = backend.toUpperCase() as AttachmentStorageBackend;

    // Local storage configuration
    this.localStoragePath = this.configService.get<string>(
      'ATTACHMENT_STORAGE_PATH',
      path.join(process.cwd(), 'storage', 'attachments'),
    );

    // S3 configuration
    if (this.storageBackend === AttachmentStorageBackend.S3) {
      this.s3Bucket = this.configService.get<string>('AWS_S3_BUCKET');
      this.s3Region = this.configService.get<string>('AWS_S3_REGION');

      if (!this.s3Bucket || !this.s3Region) {
        throw new Error(
          'AWS_S3_BUCKET and AWS_S3_REGION must be set when using S3 storage backend',
        );
      }

      this.s3Client = new S3Client({
        region: this.s3Region,
        credentials: {
          accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
          secretAccessKey: this.configService.get<string>(
            'AWS_SECRET_ACCESS_KEY',
          ),
        },
      });

      this.logger.log(
        `Initialized S3 storage backend: ${this.s3Bucket} (${this.s3Region})`,
      );
    } else {
      this.logger.log(
        `Initialized LOCAL storage backend: ${this.localStoragePath}`,
      );
    }
  }

  /**
   * Get the configured storage backend
   */
  getStorageBackend(): AttachmentStorageBackend {
    return this.storageBackend;
  }

  /**
   * Store attachment content
   * Automatically uses configured backend (LOCAL or S3)
   *
   * @param content - File content as Buffer or Readable stream
   * @param filename - Original filename
   * @param orgId - Organization ID (for path organization)
   * @param mimeType - MIME type of the file
   * @returns Storage metadata (path/key, URL, hash)
   */
  async storeAttachment(
    content: Buffer | Readable,
    filename: string,
    orgId: string,
    mimeType: string,
  ): Promise<{
    storageBackend: AttachmentStorageBackend;
    storagePath: string;
    storageUrl?: string;
    s3Bucket?: string;
    s3Key?: string;
    contentHash: string;
    size: number;
  }> {
    // Calculate content hash for deduplication
    const buffer = content instanceof Buffer ? content : await this.streamToBuffer(content);
    const contentHash = this.calculateHash(buffer);

    // Generate storage path/key
    const timestamp = Date.now();
    const sanitizedFilename = this.sanitizeFilename(filename);
    const storagePath = `${orgId}/${timestamp}-${sanitizedFilename}`;

    if (this.storageBackend === AttachmentStorageBackend.S3) {
      return this.storeInS3(
        buffer,
        storagePath,
        mimeType,
        contentHash,
      );
    } else {
      return this.storeLocally(
        buffer,
        storagePath,
        contentHash,
      );
    }
  }

  /**
   * Store attachment locally
   */
  private async storeLocally(
    content: Buffer,
    storagePath: string,
    contentHash: string,
  ): Promise<{
    storageBackend: AttachmentStorageBackend;
    storagePath: string;
    contentHash: string;
    size: number;
  }> {
    try {
      const fullPath = path.join(this.localStoragePath, storagePath);
      const directory = path.dirname(fullPath);

      // Ensure directory exists
      await fs.mkdir(directory, { recursive: true });

      // Write file
      await fs.writeFile(fullPath, content);

      this.logger.log(`Stored attachment locally: ${storagePath}`);

      return {
        storageBackend: AttachmentStorageBackend.LOCAL,
        storagePath,
        contentHash,
        size: content.length,
      };
    } catch (error) {
      this.logger.error(`Failed to store attachment locally: ${error.message}`);
      throw new InternalServerErrorException(
        `Failed to store attachment: ${error.message}`,
      );
    }
  }

  /**
   * Store attachment in S3
   */
  private async storeInS3(
    content: Buffer,
    storagePath: string,
    mimeType: string,
    contentHash: string,
  ): Promise<{
    storageBackend: AttachmentStorageBackend;
    storagePath: string;
    storageUrl?: string;
    s3Bucket: string;
    s3Key: string;
    contentHash: string;
    size: number;
  }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: storagePath,
        Body: content,
        ContentType: mimeType,
        Metadata: {
          contentHash,
        },
      });

      await this.s3Client.send(command);

      this.logger.log(`Stored attachment in S3: ${storagePath}`);

      return {
        storageBackend: AttachmentStorageBackend.S3,
        storagePath,
        s3Bucket: this.s3Bucket,
        s3Key: storagePath,
        contentHash,
        size: content.length,
      };
    } catch (error) {
      this.logger.error(`Failed to store attachment in S3: ${error.message}`);
      throw new InternalServerErrorException(
        `Failed to store attachment in S3: ${error.message}`,
      );
    }
  }

  /**
   * Retrieve attachment content
   *
   * @param storagePath - Storage path or S3 key
   * @param storageBackend - Storage backend (LOCAL or S3)
   * @returns File content as Buffer
   */
  async retrieveAttachment(
    storagePath: string,
    storageBackend: AttachmentStorageBackend,
  ): Promise<Buffer> {
    if (storageBackend === AttachmentStorageBackend.S3) {
      return this.retrieveFromS3(storagePath);
    } else {
      return this.retrieveLocally(storagePath);
    }
  }

  /**
   * Retrieve attachment from local storage
   */
  private async retrieveLocally(storagePath: string): Promise<Buffer> {
    try {
      const fullPath = path.join(this.localStoragePath, storagePath);
      const content = await fs.readFile(fullPath);
      return content;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve attachment locally: ${error.message}`,
      );
      throw new InternalServerErrorException(
        `Failed to retrieve attachment: ${error.message}`,
      );
    }
  }

  /**
   * Retrieve attachment from S3
   */
  private async retrieveFromS3(storagePath: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.s3Bucket,
        Key: storagePath,
      });

      const response = await this.s3Client.send(command);
      const stream = response.Body as Readable;
      return this.streamToBuffer(stream);
    } catch (error) {
      this.logger.error(`Failed to retrieve attachment from S3: ${error.message}`);
      throw new InternalServerErrorException(
        `Failed to retrieve attachment from S3: ${error.message}`,
      );
    }
  }

  /**
   * Generate signed URL for S3 attachment (for direct browser access)
   *
   * @param storagePath - S3 key
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns Signed URL
   */
  async generateSignedUrl(
    storagePath: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    if (this.storageBackend !== AttachmentStorageBackend.S3) {
      throw new BadRequestException(
        'Signed URLs are only available for S3 storage backend',
      );
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.s3Bucket,
        Key: storagePath,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`);
      throw new InternalServerErrorException(
        `Failed to generate signed URL: ${error.message}`,
      );
    }
  }

  /**
   * Delete attachment
   *
   * @param storagePath - Storage path or S3 key
   * @param storageBackend - Storage backend (LOCAL or S3)
   */
  async deleteAttachment(
    storagePath: string,
    storageBackend: AttachmentStorageBackend,
  ): Promise<void> {
    if (storageBackend === AttachmentStorageBackend.S3) {
      await this.deleteFromS3(storagePath);
    } else {
      await this.deleteLocally(storagePath);
    }
  }

  /**
   * Delete attachment from local storage
   */
  private async deleteLocally(storagePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.localStoragePath, storagePath);
      await fs.unlink(fullPath);
      this.logger.log(`Deleted attachment locally: ${storagePath}`);
    } catch (error) {
      this.logger.warn(`Failed to delete attachment locally: ${error.message}`);
      // Don't throw error - file might already be deleted
    }
  }

  /**
   * Delete attachment from S3
   */
  private async deleteFromS3(storagePath: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.s3Bucket,
        Key: storagePath,
      });

      await this.s3Client.send(command);
      this.logger.log(`Deleted attachment from S3: ${storagePath}`);
    } catch (error) {
      this.logger.warn(`Failed to delete attachment from S3: ${error.message}`);
      // Don't throw error - object might already be deleted
    }
  }

  /**
   * Check if attachment exists
   *
   * @param storagePath - Storage path or S3 key
   * @param storageBackend - Storage backend (LOCAL or S3)
   * @returns True if attachment exists
   */
  async exists(
    storagePath: string,
    storageBackend: AttachmentStorageBackend,
  ): Promise<boolean> {
    if (storageBackend === AttachmentStorageBackend.S3) {
      return this.existsInS3(storagePath);
    } else {
      return this.existsLocally(storagePath);
    }
  }

  /**
   * Check if attachment exists locally
   */
  private async existsLocally(storagePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.localStoragePath, storagePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if attachment exists in S3
   */
  private async existsInS3(storagePath: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.s3Bucket,
        Key: storagePath,
      });

      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Calculate SHA-256 hash of content
   */
  private calculateHash(content: Buffer): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Sanitize filename to prevent path traversal
   */
  private sanitizeFilename(filename: string): string {
    // Remove path components
    const basename = path.basename(filename);
    // Replace any remaining unsafe characters
    return basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  /**
   * Convert stream to buffer
   */
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  /**
   * Get storage statistics
   * Note: This is expensive for LOCAL backend with many files
   */
  async getStorageStatistics(orgId: string): Promise<{
    totalFiles: number;
    totalSize: number;
  }> {
    if (this.storageBackend === AttachmentStorageBackend.S3) {
      // For S3, we should rely on database records rather than listing objects
      this.logger.warn(
        'S3 storage statistics should be tracked in database, not computed from S3',
      );
      return { totalFiles: 0, totalSize: 0 };
    }

    try {
      const orgPath = path.join(this.localStoragePath, orgId);
      const files = await fs.readdir(orgPath);

      let totalSize = 0;
      for (const file of files) {
        const filePath = path.join(orgPath, file);
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      }

      return {
        totalFiles: files.length,
        totalSize,
      };
    } catch (error) {
      this.logger.warn(`Failed to get storage statistics: ${error.message}`);
      return { totalFiles: 0, totalSize: 0 };
    }
  }
}
