import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Conditional AWS SDK imports - only available if package is installed
let S3Client: any;
let PutObjectCommand: any;
let GetObjectCommand: any;
let DeleteObjectCommand: any;
let HeadObjectCommand: any;
let getSignedUrl: any;

try {
  const s3Client = require('@aws-sdk/client-s3');
  const s3Presigner = require('@aws-sdk/s3-request-presigner');

  S3Client = s3Client.S3Client;
  PutObjectCommand = s3Client.PutObjectCommand;
  GetObjectCommand = s3Client.GetObjectCommand;
  DeleteObjectCommand = s3Client.DeleteObjectCommand;
  HeadObjectCommand = s3Client.HeadObjectCommand;
  getSignedUrl = s3Presigner.getSignedUrl;
} catch (error) {
  // AWS SDK not installed - S3 storage will not be available
}

/**
 * S3 Storage Service
 * Manages document storage in AWS S3
 *
 * Features:
 * - Upload documents to S3
 * - Download documents from S3
 * - Delete documents from S3
 * - Generate signed URLs for temporary access
 * - Content type detection and handling
 *
 * Environment Variables:
 * - AWS_S3_BUCKET: S3 bucket name (required)
 * - AWS_S3_REGION: S3 region (required)
 * - AWS_ACCESS_KEY_ID: AWS access key (required)
 * - AWS_SECRET_ACCESS_KEY: AWS secret key (required)
 */
@Injectable()
export class S3StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly s3Client: any;
  private readonly s3Bucket: string;
  private readonly s3Region: string;

  constructor(private readonly configService: ConfigService) {
    // Check if S3 storage is enabled
    const storageType = this.configService.get<string>('STORAGE_TYPE', 'local');

    if (storageType !== 's3') {
      // S3 storage not enabled, skip initialization
      this.logger.log('S3 storage not enabled (STORAGE_TYPE != s3)');
      return;
    }

    // Check if AWS SDK is available
    if (!S3Client) {
      throw new Error(
        'AWS SDK (@aws-sdk/client-s3 and @aws-sdk/s3-request-presigner) is not installed. Install it to use S3 storage.',
      );
    }

    // Get S3 configuration
    this.s3Bucket = this.configService.get<string>('AWS_S3_BUCKET');
    this.s3Region = this.configService.get<string>('AWS_S3_REGION');

    if (!this.s3Bucket || !this.s3Region) {
      throw new Error(
        'AWS_S3_BUCKET and AWS_S3_REGION must be set in environment variables',
      );
    }

    // Initialize S3 client
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
      `Initialized S3 storage service: ${this.s3Bucket} (${this.s3Region})`,
    );
  }

  /**
   * Upload document to S3
   *
   * @param file - File content as Buffer
   * @param key - S3 object key (path)
   * @param contentType - MIME type of the file
   * @returns Public URL or S3 URL of the uploaded document
   */
  async upload(
    file: Buffer,
    key: string,
    contentType?: string,
  ): Promise<string> {
    if (!this.s3Client) {
      throw new BadRequestException(
        'S3 storage is not initialized. Check STORAGE_TYPE and AWS credentials.',
      );
    }

    try {
      const params = {
        Bucket: this.s3Bucket,
        Key: key,
        Body: file,
        ContentType: contentType || 'application/octet-stream',
      };

      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      this.logger.log(`Uploaded document to S3: ${key}`);

      // Return S3 URL
      return `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${key}`;
    } catch (error) {
      this.logger.error(`S3 upload failed for key ${key}: ${error.message}`);
      throw new BadRequestException('Failed to upload document to S3');
    }
  }

  /**
   * Download document from S3
   *
   * @param key - S3 object key (path)
   * @returns File content as Buffer
   */
  async download(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const stream = response.Body;

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }

      this.logger.log(`Downloaded document from S3: ${key}`);

      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.error(`S3 download failed for key ${key}: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to download document from S3',
      );
    }
  }

  /**
   * Delete document from S3
   *
   * @param key - S3 object key (path)
   */
  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
      });

      await this.s3Client.send(command);

      this.logger.log(`Deleted document from S3: ${key}`);
    } catch (error) {
      this.logger.warn(`S3 delete failed for key ${key}: ${error.message}`);
      // Don't throw error - object might already be deleted
    }
  }

  /**
   * Check if document exists in S3
   *
   * @param key - S3 object key (path)
   * @returns True if document exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate signed URL for temporary access to document
   *
   * @param key - S3 object key (path)
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns Signed URL
   */
  async generateSignedUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      this.logger.log(`Generated signed URL for S3 key: ${key}`);

      return url;
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL for key ${key}: ${error.message}`,
      );
      throw new InternalServerErrorException('Failed to generate signed URL');
    }
  }

  /**
   * Get S3 bucket name
   */
  getBucket(): string {
    return this.s3Bucket;
  }

  /**
   * Get S3 region
   */
  getRegion(): string {
    return this.s3Region;
  }
}
