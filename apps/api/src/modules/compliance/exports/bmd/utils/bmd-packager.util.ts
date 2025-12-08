/**
 * BMD Packager Utility
 * Handles file packaging and archive creation for BMD exports
 */

import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const rmdir = promisify(fs.rmdir);
const unlink = promisify(fs.unlink);

/**
 * Create BMD export directory structure
 */
export class BmdPackagerUtil {
  /**
   * Create export directory structure
   */
  static async createExportStructure(baseDir: string): Promise<void> {
    // Create base directory
    await mkdir(baseDir, { recursive: true });

    // Create subdirectories for different export types
    await mkdir(path.join(baseDir, 'buchungsjournal'), { recursive: true });
    await mkdir(path.join(baseDir, 'stammdaten'), { recursive: true });
    await mkdir(path.join(baseDir, 'metadata'), { recursive: true });
  }

  /**
   * Write CSV file with proper encoding
   */
  static async writeCsvFile(
    filePath: string,
    content: string,
    useIsoEncoding: boolean = false,
  ): Promise<void> {
    const dir = path.dirname(filePath);
    await mkdir(dir, { recursive: true });

    if (useIsoEncoding) {
      // Write with ISO-8859-1 encoding
      const buffer = Buffer.from(content, 'latin1');
      await writeFile(filePath, buffer);
    } else {
      // Write with UTF-8 encoding (default)
      await writeFile(filePath, content, 'utf-8');
    }
  }

  /**
   * Create ZIP archive of export directory
   */
  static async createZipArchive(sourceDir: string, targetPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Ensure target directory exists
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Create write stream
      const output = fs.createWriteStream(targetPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      });

      // Listen for events
      output.on('close', () => {
        resolve();
      });

      archive.on('error', (err) => {
        reject(err);
      });

      // Pipe archive data to the file
      archive.pipe(output);

      // Add directory contents to archive
      archive.directory(sourceDir, false);

      // Finalize the archive
      archive.finalize();
    });
  }

  /**
   * Generate temporary directory name for export
   */
  static generateTempDirName(exportId: string): string {
    return `bmd_temp_${exportId}`;
  }

  /**
   * Generate export filename
   */
  static generateExportFilename(orgId: string, year?: number): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const orgSuffix = orgId.substring(0, 8);
    const yearSuffix = year ? `_${year}` : '';
    return `bmd_export${yearSuffix}_${timestamp}_${orgSuffix}.zip`;
  }

  /**
   * Count files in directory recursively
   */
  static async countFiles(dirPath: string): Promise<number> {
    let count = 0;

    const items = await readdir(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const itemStat = await stat(itemPath);

      if (itemStat.isDirectory()) {
        count += await this.countFiles(itemPath);
      } else {
        count++;
      }
    }

    return count;
  }

  /**
   * Cleanup temporary directory
   */
  static async cleanupDirectory(dirPath: string): Promise<void> {
    try {
      const items = await readdir(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const itemStat = await stat(itemPath);

        if (itemStat.isDirectory()) {
          await this.cleanupDirectory(itemPath);
          await rmdir(itemPath);
        } else {
          await unlink(itemPath);
        }
      }

      await rmdir(dirPath);
    } catch (error) {
      // Ignore errors during cleanup
    }
  }

  /**
   * Validate export structure
   */
  static async validateExportStructure(baseDir: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check if base directory exists
    if (!fs.existsSync(baseDir)) {
      errors.push('Base directory does not exist');
      return { valid: false, errors };
    }

    // Check for required subdirectories
    const requiredDirs = ['buchungsjournal', 'stammdaten', 'metadata'];
    for (const dir of requiredDirs) {
      const dirPath = path.join(baseDir, dir);
      if (!fs.existsSync(dirPath)) {
        errors.push(`Required directory missing: ${dir}`);
      }
    }

    // Check if there are any CSV files
    const buchungsjournalDir = path.join(baseDir, 'buchungsjournal');
    const stammdatenDir = path.join(baseDir, 'stammdaten');

    let hasFiles = false;
    if (fs.existsSync(buchungsjournalDir)) {
      const files = await readdir(buchungsjournalDir);
      hasFiles = files.some(f => f.endsWith('.csv'));
    }

    if (!hasFiles && fs.existsSync(stammdatenDir)) {
      const files = await readdir(stammdatenDir);
      hasFiles = files.some(f => f.endsWith('.csv'));
    }

    if (!hasFiles) {
      errors.push('No CSV files found in export');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create README file for BMD export
   */
  static generateReadmeContent(metadata: {
    orgName: string;
    dateRange: { startDate: Date; endDate: Date };
    exportTypes: string[];
    exportDate: Date;
  }): string {
    const { orgName, dateRange, exportTypes, exportDate } = metadata;

    return `BMD Export

Organisation: ${orgName}
Zeitraum: ${this.formatDate(dateRange.startDate)} - ${this.formatDate(dateRange.endDate)}
Export-Datum: ${this.formatDate(exportDate)}

Enthaltene Exporte:
${exportTypes.map(t => `- ${t}`).join('\n')}

Verzeichnisstruktur:
- buchungsjournal/  - Buchungsjournal-Exporte
- stammdaten/       - Stammdaten (Konten, Kunden, Lieferanten)
- metadata/         - Export-Metadaten

Format:
- Trennzeichen: Semikolon (;)
- Dezimaltrennzeichen: Komma (,)
- Tausendertrennzeichen: Punkt (.)
- Datumsformat: TT.MM.JJJJ
- Zeichensatz: UTF-8

Importhinweis:
Diese Dateien sind für den Import in BMD-Software optimiert.
Bitte beachten Sie die BMD-Dokumentation für den korrekten Import.

Generiert von: Operate/CoachOS
`;
  }

  /**
   * Format date as DD.MM.YYYY
   */
  private static formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
}
