import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DataExportRequestDto } from '../dto/data-export.dto';
import { DataExportFormat, GdprEventType, ActorType } from '../types/gdpr.types';
import { AuditTrailService } from './audit-trail.service';
import { ConsentManagerService } from './consent-manager.service';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Data Portability Service
 * Implements GDPR Article 20 (Right to Data Portability)
 * Exports user data in machine-readable formats
 */
@Injectable()
export class DataPortabilityService {
  private readonly logger = new Logger(DataPortabilityService.name);
  private readonly exportDir = path.join(process.cwd(), 'exports', 'gdpr');

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditTrail: AuditTrailService,
    private readonly consentManager: ConsentManagerService,
  ) {
    // Ensure export directory exists
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
   * Export user data
   */
  async exportUserData(dto: DataExportRequestDto, actorId?: string) {
    this.logger.log(`Exporting data for user ${dto.userId}, format: ${dto.format || 'json'}`);

    try {
      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new NotFoundException(`User ${dto.userId} not found`);
      }

      // Collect all user data
      const exportData = await this.collectUserData(dto);

      // Format and save export
      const format = dto.format || DataExportFormat.JSON;
      const fileName = `user_data_export_${dto.userId}_${Date.now()}.${format}`;
      const filePath = path.join(this.exportDir, fileName);

      await this.saveExport(exportData, filePath, format);

      // Get file size
      const stats = await fs.stat(filePath);

      // Calculate expiration (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Log export
      await this.auditTrail.logEvent({
        eventType: GdprEventType.DATA_EXPORTED,
        userId: dto.userId,
        actorId: actorId || dto.userId,
        actorType: actorId && actorId !== dto.userId ? ActorType.ADMIN : ActorType.USER,
        resourceType: 'UserDataExport',
        resourceId: fileName,
        details: {
          format,
          fileSize: stats.size,
          categoriesIncluded: Object.keys(exportData.data),
          recordCount: this.countRecords(exportData.data),
        },
      });

      this.logger.log(`Data export completed: ${fileName}`);

      return {
        userId: dto.userId,
        exportedAt: new Date(),
        format,
        fileUrl: `/exports/gdpr/${fileName}`, // This would be a proper URL in production
        fileSize: stats.size,
        expiresAt,
        recordCount: this.countRecords(exportData.data),
        categoriesIncluded: Object.keys(exportData.data),
      };
    } catch (error) {
      this.logger.error(`Failed to export user data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Collect all user data
   */
  private async collectUserData(dto: DataExportRequestDto) {
    const { userId, includeCategories, excludeCategories, includeAuditLogs, includeConsents } = dto;

    const shouldInclude = (category: string) => {
      if (excludeCategories?.includes(category)) return false;
      if (includeCategories && !includeCategories.includes(category)) return false;
      return true;
    };

    const data: any = {};

    // Profile data
    if (shouldInclude('profile')) {
      data.profile = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          locale: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      });
    }

    // Memberships
    if (shouldInclude('memberships')) {
      data.memberships = await this.prisma.membership.findMany({
        where: { userId },
        include: {
          organisation: {
            select: {
              id: true,
              name: true,
              slug: true,
              country: true,
            },
          },
        },
      });
    }

    // Employee records
    if (shouldInclude('employment')) {
      data.employment = await this.prisma.employee.findMany({
        where: { userId },
      });
    }

    // Sessions
    if (shouldInclude('sessions')) {
      data.sessions = await this.prisma.session.findMany({
        where: { userId },
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          ipAddress: true,
          userAgent: true,
        },
      });
    }

    // OAuth accounts
    if (shouldInclude('oauth')) {
      data.oauthAccounts = await this.prisma.oAuthAccount.findMany({
        where: { userId },
        select: {
          provider: true,
          createdAt: true,
          // Don't include tokens or sensitive data
        },
      });
    }

    // Consents (if requested)
    if (includeConsents !== false && shouldInclude('consents')) {
      data.consents = await this.consentManager.getAllUserConsents(userId);
    }

    // Audit logs (if requested)
    if (includeAuditLogs && shouldInclude('auditLogs')) {
      data.auditLogs = await this.auditTrail.getUserAuditLogs(userId, 1000);
    }

    // Data subject requests
    if (shouldInclude('dataSubjectRequests')) {
      data.dataSubjectRequests = await this.prisma.dataSubjectRequest.findMany({
        where: { userId },
        select: {
          requestId: true,
          requestType: true,
          status: true,
          requestedAt: true,
          completedAt: true,
        },
      });
    }

    return {
      userId,
      exportedAt: new Date(),
      format: dto.format || DataExportFormat.JSON,
      data,
    };
  }

  /**
   * Save export to file
   */
  private async saveExport(data: any, filePath: string, format: DataExportFormat) {
    let content: string;

    switch (format) {
      case DataExportFormat.JSON:
        content = JSON.stringify(data, null, 2);
        break;

      case DataExportFormat.CSV:
        content = this.convertToCSV(data);
        break;

      case DataExportFormat.XML:
        content = this.convertToXML(data);
        break;

      default:
        content = JSON.stringify(data, null, 2);
    }

    await fs.writeFile(filePath, content, 'utf-8');
    this.logger.log(`Export saved to ${filePath}`);
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any): string {
    // This is a simplified CSV conversion
    // In production, use a proper CSV library
    const lines: string[] = [];

    lines.push('# User Data Export');
    lines.push(`# Exported At: ${data.exportedAt}`);
    lines.push(`# User ID: ${data.userId}`);
    lines.push('');

    for (const [category, records] of Object.entries(data.data)) {
      lines.push(`# ${category.toUpperCase()}`);

      if (Array.isArray(records)) {
        if (records.length > 0) {
          const headers = Object.keys(records[0]);
          lines.push(headers.join(','));
          records.forEach((record: any) => {
            const values = headers.map((h) => {
              const val = record[h];
              if (val === null || val === undefined) return '';
              if (typeof val === 'object') return JSON.stringify(val);
              return String(val).includes(',') ? `"${val}"` : val;
            });
            lines.push(values.join(','));
          });
        }
      } else if (typeof records === 'object') {
        lines.push('Field,Value');
        Object.entries(records).forEach(([key, value]) => {
          lines.push(`${key},${value}`);
        });
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Convert data to XML format
   */
  private convertToXML(data: any): string {
    // Simplified XML conversion
    const lines: string[] = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<UserDataExport>');
    lines.push(`  <UserId>${data.userId}</UserId>`);
    lines.push(`  <ExportedAt>${data.exportedAt}</ExportedAt>`);
    lines.push('  <Data>');

    for (const [category, records] of Object.entries(data.data)) {
      lines.push(`    <${category}>`);
      if (Array.isArray(records)) {
        records.forEach((record: any, index: number) => {
          lines.push(`      <Item index="${index}">`);
          Object.entries(record).forEach(([key, value]) => {
            lines.push(`        <${key}>${this.escapeXML(String(value))}</${key}>`);
          });
          lines.push('      </Item>');
        });
      } else if (typeof records === 'object') {
        Object.entries(records).forEach(([key, value]) => {
          lines.push(`      <${key}>${this.escapeXML(String(value))}</${key}>`);
        });
      }
      lines.push(`    </${category}>`);
    }

    lines.push('  </Data>');
    lines.push('</UserDataExport>');
    return lines.join('\n');
  }

  /**
   * Escape XML special characters
   */
  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
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
   * Clean up old exports (older than 7 days)
   */
  async cleanupOldExports() {
    this.logger.log('Cleaning up old export files');

    try {
      const files = await fs.readdir(this.exportDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

      let deletedCount = 0;
      for (const file of files) {
        const filePath = path.join(this.exportDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
          this.logger.log(`Deleted old export: ${file}`);
        }
      }

      this.logger.log(`Cleanup complete. Deleted ${deletedCount} old exports`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to cleanup old exports: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get export file
   */
  async getExportFile(fileName: string) {
    const filePath = path.join(this.exportDir, fileName);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);

      return {
        fileName,
        content,
        size: stats.size,
        createdAt: stats.birthtime,
      };
    } catch (error) {
      throw new NotFoundException(`Export file ${fileName} not found`);
    }
  }
}
