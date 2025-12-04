import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ExportFormat, DataCategory, ExportResult } from '../types/data-tools.types';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as archiver from 'archiver';
import { createWriteStream } from 'fs';

/**
 * Data Exporter Service
 * Handles multi-format data export operations
 */
@Injectable()
export class DataExporterService {
  private readonly logger = new Logger(DataExporterService.name);
  private readonly exportDir = path.join(process.cwd(), 'storage', 'exports');

  constructor(private readonly prisma: PrismaService) {
    this.ensureExportDirectory();
  }

  /**
   * Ensure export directory exists
   */
  private async ensureExportDirectory() {
    try {
      await fs.mkdir(this.exportDir, { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create export directory: ${error.message}`);
    }
  }

  /**
   * Export user data in specified format
   */
  async exportUserData(
    userId: string,
    organisationId: string | undefined,
    format: ExportFormat,
    categories: DataCategory[],
    options: {
      encrypted?: boolean;
      includeDeleted?: boolean;
      dateRange?: { start: Date; end: Date };
      compress?: boolean;
    } = {},
  ): Promise<ExportResult> {
    this.logger.log(`Starting data export for user ${userId}, format: ${format}`);

    try {
      // Collect data from all requested categories
      const data = await this.collectUserData(userId, organisationId, categories, options);

      // Generate export file based on format
      let filePath: string;
      let recordCount = 0;

      switch (format) {
        case ExportFormat.JSON:
          filePath = await this.exportToJson(userId, data);
          recordCount = this.countRecords(data);
          break;
        case ExportFormat.CSV:
          filePath = await this.exportToCsv(userId, data);
          recordCount = this.countRecords(data);
          break;
        case ExportFormat.PDF:
          filePath = await this.exportToPdf(userId, data);
          recordCount = this.countRecords(data);
          break;
        case ExportFormat.ZIP:
          filePath = await this.exportToZip(userId, data);
          recordCount = this.countRecords(data);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      // Apply compression if requested
      if (options.compress && format !== ExportFormat.ZIP) {
        filePath = await this.compressFile(filePath);
      }

      // Apply encryption if requested
      let encryptionKey: string | undefined;
      if (options.encrypted) {
        const result = await this.encryptFile(filePath);
        filePath = result.encryptedPath;
        encryptionKey = result.key;
      }

      // Get file stats
      const stats = await fs.stat(filePath);
      const fileUrl = this.generateFileUrl(filePath);

      return {
        jobId: crypto.randomUUID(),
        status: 'completed' as any,
        fileUrl,
        fileSize: stats.size,
        downloadToken: this.generateDownloadToken(filePath),
        expiresAt: this.getExpirationDate(),
        recordsExported: recordCount,
        categoriesExported: categories,
      };
    } catch (error) {
      this.logger.error(`Export failed for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Collect user data from all requested categories
   */
  private async collectUserData(
    userId: string,
    organisationId: string | undefined,
    categories: DataCategory[],
    options: any,
  ): Promise<Record<string, any>> {
    const data: Record<string, any> = {};

    for (const category of categories) {
      switch (category) {
        case DataCategory.PROFILE:
          data.profile = await this.exportProfileData(userId);
          break;
        case DataCategory.FINANCIAL:
          data.financial = await this.exportFinancialData(userId, organisationId, options);
          break;
        case DataCategory.TAX:
          data.tax = await this.exportTaxData(userId, organisationId, options);
          break;
        case DataCategory.HR:
          data.hr = await this.exportHrData(userId, organisationId, options);
          break;
        case DataCategory.DOCUMENTS:
          data.documents = await this.exportDocumentsData(userId, organisationId, options);
          break;
        case DataCategory.ACTIVITY:
          data.activity = await this.exportActivityData(userId, options);
          break;
        case DataCategory.SETTINGS:
          data.settings = await this.exportSettingsData(userId);
          break;
        case DataCategory.ALL:
          // Export all categories
          data.profile = await this.exportProfileData(userId);
          data.financial = await this.exportFinancialData(userId, organisationId, options);
          data.tax = await this.exportTaxData(userId, organisationId, options);
          data.hr = await this.exportHrData(userId, organisationId, options);
          data.documents = await this.exportDocumentsData(userId, organisationId, options);
          data.activity = await this.exportActivityData(userId, options);
          data.settings = await this.exportSettingsData(userId);
          break;
      }
    }

    return data;
  }

  /**
   * Export profile data
   */
  private async exportProfileData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        language: true,
        timezone: true,
        country: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Export financial data (invoices, expenses, transactions)
   */
  private async exportFinancialData(userId: string, organisationId: string | undefined, options: any) {
    const where: any = organisationId ? { orgId: organisationId } : {};

    if (options.dateRange) {
      where.createdAt = {
        gte: options.dateRange.start,
        lte: options.dateRange.end,
      };
    }

    const [invoices, expenses] = await Promise.all([
      this.prisma.invoice.findMany({ where }),
      this.prisma.expense.findMany({ where }),
    ]);

    return {
      invoices,
      expenses,
      summary: {
        totalInvoices: invoices.length,
        totalExpenses: expenses.length,
      },
    };
  }

  /**
   * Export tax data
   */
  private async exportTaxData(userId: string, organisationId: string | undefined, options: any) {
    // Tax records would be exported here
    // This is a placeholder for the actual implementation
    return {
      taxReturns: [],
      taxDocuments: [],
      vatReturns: [],
    };
  }

  /**
   * Export HR/employee data
   */
  private async exportHrData(userId: string, organisationId: string | undefined, options: any) {
    if (!organisationId) return null;

    const where: any = { orgId: organisationId, userId };

    const employee = await this.prisma.employee.findFirst({
      where,
      include: {
        documents: true,
        leaveBalances: true,
      },
    });

    return employee;
  }

  /**
   * Export documents and attachments
   */
  private async exportDocumentsData(userId: string, organisationId: string | undefined, options: any) {
    // Documents export placeholder
    return {
      documents: [],
      attachments: [],
    };
  }

  /**
   * Export activity logs
   */
  private async exportActivityData(userId: string, options: any) {
    const where: any = { userId };

    if (options.dateRange) {
      where.createdAt = {
        gte: options.dateRange.start,
        lte: options.dateRange.end,
      };
    }

    const auditLogs = await this.prisma.gdprAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000, // Limit to last 1000 entries
    });

    return { auditLogs };
  }

  /**
   * Export settings and preferences
   */
  private async exportSettingsData(userId: string) {
    return {
      preferences: {},
      notifications: {},
    };
  }

  /**
   * Export to JSON format
   */
  private async exportToJson(userId: string, data: any): Promise<string> {
    const filename = `export_${userId}_${Date.now()}.json`;
    const filePath = path.join(this.exportDir, filename);

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      data,
    };

    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
    return filePath;
  }

  /**
   * Export to CSV format
   */
  private async exportToCsv(userId: string, data: any): Promise<string> {
    const filename = `export_${userId}_${Date.now()}.csv`;
    const filePath = path.join(this.exportDir, filename);

    // Flatten data structure for CSV
    const csvData = this.flattenForCsv(data);
    await fs.writeFile(filePath, csvData);

    return filePath;
  }

  /**
   * Export to PDF format
   */
  private async exportToPdf(userId: string, data: any): Promise<string> {
    const filename = `export_${userId}_${Date.now()}.pdf`;
    const filePath = path.join(this.exportDir, filename);

    // PDF generation would require a library like puppeteer or pdfkit
    // This is a placeholder - actual implementation would generate proper PDF
    await fs.writeFile(filePath, JSON.stringify(data));

    return filePath;
  }

  /**
   * Export to ZIP archive
   */
  private async exportToZip(userId: string, data: any): Promise<string> {
    const filename = `export_${userId}_${Date.now()}.zip`;
    const filePath = path.join(this.exportDir, filename);

    return new Promise((resolve, reject) => {
      const output = createWriteStream(filePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve(filePath));
      archive.on('error', reject);

      archive.pipe(output);

      // Add each data category as a separate file in the ZIP
      for (const [category, content] of Object.entries(data)) {
        archive.append(JSON.stringify(content, null, 2), { name: `${category}.json` });
      }

      archive.finalize();
    });
  }

  /**
   * Compress file
   */
  private async compressFile(filePath: string): Promise<string> {
    const compressedPath = `${filePath}.zip`;

    return new Promise((resolve, reject) => {
      const output = createWriteStream(compressedPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve(compressedPath));
      archive.on('error', reject);

      archive.pipe(output);
      archive.file(filePath, { name: path.basename(filePath) });
      archive.finalize();
    });
  }

  /**
   * Encrypt file with AES-256
   */
  private async encryptFile(filePath: string): Promise<{ encryptedPath: string; key: string }> {
    const key = crypto.randomBytes(32).toString('hex');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);

    const fileContent = await fs.readFile(filePath);
    const encrypted = Buffer.concat([cipher.update(fileContent), cipher.final()]);

    const encryptedPath = `${filePath}.encrypted`;
    await fs.writeFile(encryptedPath, Buffer.concat([iv, encrypted]));

    return { encryptedPath, key };
  }

  /**
   * Flatten data for CSV export
   */
  private flattenForCsv(data: any): string {
    // Simple CSV flattening - real implementation would be more sophisticated
    const lines: string[] = [];

    for (const [category, content] of Object.entries(data)) {
      lines.push(`Category: ${category}`);
      if (Array.isArray(content)) {
        content.forEach((item, index) => {
          lines.push(`Item ${index + 1}: ${JSON.stringify(item)}`);
        });
      } else {
        lines.push(JSON.stringify(content));
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Count total records in export
   */
  private countRecords(data: any): number {
    let count = 0;

    for (const value of Object.values(data)) {
      if (Array.isArray(value)) {
        count += value.length;
      } else if (value && typeof value === 'object') {
        count += 1;
      }
    }

    return count;
  }

  /**
   * Generate file URL
   */
  private generateFileUrl(filePath: string): string {
    const filename = path.basename(filePath);
    return `/api/data-tools/download/${filename}`;
  }

  /**
   * Generate download token
   */
  private generateDownloadToken(filePath: string): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get expiration date (7 days from now)
   */
  private getExpirationDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  }

  /**
   * Delete export file
   */
  async deleteExportFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      this.logger.log(`Deleted export file: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to delete export file: ${error.message}`);
    }
  }

  /**
   * Clean up expired exports
   */
  async cleanupExpiredExports(): Promise<number> {
    const files = await fs.readdir(this.exportDir);
    const now = Date.now();
    const expirationMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(this.exportDir, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtimeMs > expirationMs) {
        await this.deleteExportFile(filePath);
        deletedCount++;
      }
    }

    this.logger.log(`Cleaned up ${deletedCount} expired export files`);
    return deletedCount;
  }
}
