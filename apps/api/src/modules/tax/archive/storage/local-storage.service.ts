import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageService } from '../interfaces/storage.interface';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Local Filesystem Storage Service
 *
 * Simple implementation of IStorageService that stores files
 * on the local filesystem. Suitable for development and small deployments.
 *
 * For production, consider using S3-compatible storage services.
 *
 * Configuration:
 * - TAX_STORAGE_PATH: Base directory for tax document storage
 *   Default: ./storage/tax-documents
 */
@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly basePath: string;

  constructor(private readonly config: ConfigService) {
    this.basePath = this.config.get<string>('TAX_STORAGE_PATH') || './storage/tax-documents';
    this.ensureBasePath();
  }

  /**
   * Upload a file to local storage
   */
  async upload(filePath: string, data: Buffer | string, mimeType: string): Promise<string> {
    const fullPath = path.join(this.basePath, filePath);
    const dir = path.dirname(fullPath);

    try {
      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true });

      // Write file
      const buffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
      await fs.writeFile(fullPath, buffer);

      this.logger.debug(`File uploaded to ${fullPath} (${buffer.length} bytes)`);

      // Return relative path as URL
      return filePath;
    } catch (error) {
      this.logger.error(`Failed to upload file to ${fullPath}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Download a file from local storage
   */
  async download(url: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, url);

    try {
      const data = await fs.readFile(fullPath);
      this.logger.debug(`File downloaded from ${fullPath} (${data.length} bytes)`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to download file from ${fullPath}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a file from local storage
   */
  async delete(url: string): Promise<void> {
    const fullPath = path.join(this.basePath, url);

    try {
      await fs.unlink(fullPath);
      this.logger.debug(`File deleted: ${fullPath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.logger.error(`Failed to delete file ${fullPath}: ${error.message}`);
        throw error;
      }
      // File doesn't exist - that's OK
      this.logger.debug(`File already deleted or doesn't exist: ${fullPath}`);
    }
  }

  /**
   * Check if a file exists
   */
  async exists(url: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, url);

    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ensure base storage directory exists
   */
  private async ensureBasePath(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
      this.logger.log(`Storage base path: ${this.basePath}`);
    } catch (error) {
      this.logger.error(`Failed to create storage base path: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    basePath: string;
    totalFiles: number;
    totalSize: number;
  }> {
    let totalFiles = 0;
    let totalSize = 0;

    const walkDir = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            await walkDir(fullPath);
          } else {
            const stats = await fs.stat(fullPath);
            totalFiles++;
            totalSize += stats.size;
          }
        }
      } catch (error) {
        // Ignore errors (e.g., directory doesn't exist yet)
      }
    };

    await walkDir(this.basePath);

    return {
      basePath: this.basePath,
      totalFiles,
      totalSize,
    };
  }
}
