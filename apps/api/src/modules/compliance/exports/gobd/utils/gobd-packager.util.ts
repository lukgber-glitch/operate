import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const copyFile = promisify(fs.copyFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);

/**
 * GoBD Packager Utility
 * Creates and manages GoBD export directory structures and ZIP archives
 */
export class GobdPackagerUtil {
  /**
   * Create base directory structure for GoBD export
   */
  static async createExportStructure(baseDir: string): Promise<void> {
    await mkdir(baseDir, { recursive: true });
    await mkdir(path.join(baseDir, 'documents'), { recursive: true });
    await mkdir(path.join(baseDir, 'documents', 'invoices'), { recursive: true });
    await mkdir(path.join(baseDir, 'documents', 'receipts'), { recursive: true });
    await mkdir(path.join(baseDir, 'documents', 'contracts'), { recursive: true });
    await mkdir(path.join(baseDir, 'data'), { recursive: true });
  }

  /**
   * Write CSV file with proper formatting
   */
  static async writeCsvFile(
    filePath: string,
    data: any[],
    delimiter: string = ';',
    encapsulator: string = '"',
  ): Promise<void> {
    if (data.length === 0) {
      await writeFile(filePath, '');
      return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Format CSV rows
    const rows = [
      headers.join(delimiter), // Header row
      ...data.map(row => this.formatCsvRow(row, headers, delimiter, encapsulator)),
    ];

    await writeFile(filePath, rows.join('\n'), 'utf-8');
  }

  /**
   * Format a single CSV row
   */
  private static formatCsvRow(
    row: any,
    headers: string[],
    delimiter: string,
    encapsulator: string,
  ): string {
    return headers
      .map(header => {
        const value = row[header];
        return this.formatCsvValue(value, encapsulator);
      })
      .join(delimiter);
  }

  /**
   * Format a single CSV value
   */
  private static formatCsvValue(value: any, encapsulator: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    // Convert to string
    let stringValue = String(value);

    // Escape encapsulator characters
    if (stringValue.includes(encapsulator)) {
      stringValue = stringValue.replace(
        new RegExp(encapsulator, 'g'),
        encapsulator + encapsulator,
      );
    }

    // Encapsulate if contains delimiter, newline, or encapsulator
    if (
      stringValue.includes(';') ||
      stringValue.includes(',') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r') ||
      stringValue.includes(encapsulator)
    ) {
      return `${encapsulator}${stringValue}${encapsulator}`;
    }

    return stringValue;
  }

  /**
   * Copy document to export structure
   */
  static async copyDocument(
    sourcePath: string,
    destDir: string,
    category: string,
    filename: string,
  ): Promise<string> {
    const categoryDir = path.join(destDir, 'documents', category);
    await mkdir(categoryDir, { recursive: true });

    const destPath = path.join(categoryDir, filename);
    await copyFile(sourcePath, destPath);

    return path.relative(destDir, destPath).replace(/\\/g, '/');
  }

  /**
   * Create ZIP archive from directory
   */
  static async createZipArchive(
    sourceDir: string,
    outputPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      });

      output.on('close', () => {
        resolve();
      });

      archive.on('error', (err: Error) => {
        reject(err);
      });

      archive.pipe(output);

      // Add all files from source directory
      archive.directory(sourceDir, false);

      archive.finalize();
    });
  }

  /**
   * Get directory size in bytes
   */
  static async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    const files = await readdir(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await stat(filePath);

      if (stats.isDirectory()) {
        totalSize += await this.getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }

    return totalSize;
  }

  /**
   * Count files in directory (recursive)
   */
  static async countFiles(dirPath: string): Promise<number> {
    let count = 0;

    const files = await readdir(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await stat(filePath);

      if (stats.isDirectory()) {
        count += await this.countFiles(filePath);
      } else {
        count++;
      }
    }

    return count;
  }

  /**
   * Clean up temporary directory
   */
  static async cleanupDirectory(dirPath: string): Promise<void> {
    try {
      const files = await readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await stat(filePath);

        if (stats.isDirectory()) {
          await this.cleanupDirectory(filePath);
          await rmdir(filePath);
        } else {
          await unlink(filePath);
        }
      }

      await rmdir(dirPath);
    } catch (error) {
      // Ignore errors during cleanup
      console.error(`Failed to cleanup directory ${dirPath}:`, error.message);
    }
  }

  /**
   * Generate export filename
   */
  static generateExportFilename(orgId: string, timestamp: Date = new Date()): string {
    const year = timestamp.getFullYear();
    const month = (timestamp.getMonth() + 1).toString().padStart(2, '0');
    const day = timestamp.getDate().toString().padStart(2, '0');
    const hours = timestamp.getHours().toString().padStart(2, '0');
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    const seconds = timestamp.getSeconds().toString().padStart(2, '0');

    return `gobd_export_${year}${month}${day}_${hours}${minutes}${seconds}.zip`;
  }

  /**
   * Generate temporary directory name
   */
  static generateTempDirName(exportId: string): string {
    return `gobd_temp_${exportId}`;
  }

  /**
   * Sanitize filename (remove special characters)
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 255); // Max filename length
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Validate export structure
   */
  static async validateExportStructure(baseDir: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    const requiredPaths = [
      'data',
      'documents',
      'index.xml',
      'gdpdu-01-09-2004.dtd',
    ];

    for (const requiredPath of requiredPaths) {
      const fullPath = path.join(baseDir, requiredPath);
      try {
        await stat(fullPath);
      } catch (error) {
        errors.push(`Missing required file/directory: ${requiredPath}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
