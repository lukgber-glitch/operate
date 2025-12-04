import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { ChecksumEntry, ChecksumFile } from '../interfaces/gobd-document.interface';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

/**
 * GoBD Hash Utility
 * Generates SHA-256 checksums for GoBD export files
 */
export class GobdHashUtil {
  /**
   * Generate SHA-256 hash for a file
   */
  static async hashFile(filePath: string): Promise<string> {
    const fileBuffer = await readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Generate SHA-256 hash for a string
   */
  static hashString(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Generate SHA-256 hash for a buffer
   */
  static hashBuffer(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generate checksums for all files in a directory (recursive)
   */
  static async generateChecksums(
    baseDir: string,
    excludePatterns: string[] = ['checksums.sha256'],
  ): Promise<ChecksumFile> {
    const entries: ChecksumEntry[] = [];

    await this.walkDirectory(baseDir, baseDir, entries, excludePatterns);

    // Sort entries by path for consistent output
    entries.sort((a, b) => a.path.localeCompare(b.path));

    return {
      algorithm: 'SHA-256',
      entries,
      generatedAt: new Date(),
    };
  }

  /**
   * Walk directory recursively and collect file hashes
   */
  private static async walkDirectory(
    baseDir: string,
    currentDir: string,
    entries: ChecksumEntry[],
    excludePatterns: string[],
  ): Promise<void> {
    const files = await readdir(currentDir);

    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const relativePath = path.relative(baseDir, fullPath);

      // Check if file should be excluded
      if (this.shouldExclude(file, excludePatterns)) {
        continue;
      }

      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        // Recursively process subdirectory
        await this.walkDirectory(baseDir, fullPath, entries, excludePatterns);
      } else if (stats.isFile()) {
        // Generate hash for file
        const hash = await this.hashFile(fullPath);
        entries.push({
          path: relativePath.replace(/\\/g, '/'), // Use forward slashes
          hash,
        });
      }
    }
  }

  /**
   * Check if file should be excluded
   */
  private static shouldExclude(filename: string, excludePatterns: string[]): boolean {
    return excludePatterns.some(pattern => {
      if (pattern.includes('*')) {
        // Simple wildcard matching
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(filename);
      }
      return filename === pattern;
    });
  }

  /**
   * Format checksum file for output
   * Uses standard SHA256SUMS format
   */
  static formatChecksumFile(checksumFile: ChecksumFile): string {
    const lines = checksumFile.entries.map(
      entry => `${entry.hash}  ${entry.path}`,
    );

    return [
      `# SHA-256 Checksums`,
      `# Generated: ${checksumFile.generatedAt.toISOString()}`,
      `# Algorithm: ${checksumFile.algorithm}`,
      '',
      ...lines,
    ].join('\n');
  }

  /**
   * Verify checksums against a directory
   */
  static async verifyChecksums(
    baseDir: string,
    checksumFile: ChecksumFile,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const entry of checksumFile.entries) {
      const fullPath = path.join(baseDir, entry.path);

      try {
        const actualHash = await this.hashFile(fullPath);
        if (actualHash !== entry.hash) {
          errors.push(
            `Hash mismatch for ${entry.path}: expected ${entry.hash}, got ${actualHash}`,
          );
        }
      } catch (error) {
        errors.push(`Failed to verify ${entry.path}: ${error.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Parse checksum file content
   */
  static parseChecksumFile(content: string): ChecksumFile {
    const lines = content.split('\n').filter(line => line && !line.startsWith('#'));
    const entries: ChecksumEntry[] = [];

    for (const line of lines) {
      const match = line.match(/^([a-f0-9]{64})\s+(.+)$/);
      if (match) {
        entries.push({
          hash: match[1],
          path: match[2],
        });
      }
    }

    return {
      algorithm: 'SHA-256',
      entries,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate checksum for an entire directory (single hash)
   */
  static async hashDirectory(dirPath: string): Promise<string> {
    const checksumFile = await this.generateChecksums(dirPath);

    // Create a deterministic string from all file hashes
    const combined = checksumFile.entries
      .map(e => `${e.path}:${e.hash}`)
      .join('|');

    return this.hashString(combined);
  }
}
