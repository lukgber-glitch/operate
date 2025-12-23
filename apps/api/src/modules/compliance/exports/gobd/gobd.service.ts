import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/modules/database/prisma.service';
import { StreamableFile } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { CreateGobdExportDto } from './dto/create-gobd-export.dto';
import {
  GobdExportResponseDto,
  GobdExportListResponseDto,
  GobdExportListItemDto,
} from './dto/gobd-export-response.dto';
import { ExportStatus, GobdConfig } from './interfaces/gobd-config.interface';
import { GobdBuilderService } from './gobd-builder.service';
import { GobdXmlBuilder } from './utils/gobd-xml-builder.util';
import { GobdHashUtil } from './utils/gobd-hash.util';
import { GobdPackagerUtil } from './utils/gobd-packager.util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

/**
 * GoBD Export Service
 * Main service for creating and managing GoBD-compliant exports
 */
@Injectable()
export class GobdService {
  private readonly logger = new Logger(GobdService.name);
  private readonly exportDir: string;
  private readonly tempDir: string;
  private readonly retentionDays: number = 30;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private gobdBuilder: GobdBuilderService,
  ) {
    // Configure directories from environment
    this.exportDir =
      this.configService.get<string>('storage.gobdExportDir') ||
      '/tmp/gobd-exports';
    this.tempDir = this.configService.get<string>('storage.tempDir') || '/tmp';
    this.retentionDays =
      this.configService.get<number>('compliance.gobdRetentionDays') || 30;
  }

  /**
   * Create new GoBD export
   */
  async createExport(
    dto: CreateGobdExportDto,
  ): Promise<GobdExportResponseDto> {
    this.logger.log(`Creating GoBD export for org: ${dto.orgId}`);

    // Validate date range
    if (dto.dateRange.startDate >= dto.dateRange.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Verify organization exists
    const org = await this.prisma.organisation.findUnique({
      where: { id: dto.orgId },
    });

    if (!org) {
      throw new NotFoundException(`Organization not found: ${dto.orgId}`);
    }

    // Create export record
    const exportId = this.generateExportId();
    const filename = GobdPackagerUtil.generateExportFilename(dto.orgId);

    // Create database record
    const exportRecord = await this.createExportRecord(
      exportId,
      dto.orgId,
      filename,
      dto.dateRange.startDate,
      dto.dateRange.endDate,
    );

    // Start export generation asynchronously
    this.generateExportAsync(exportId, dto, org);

    return new GobdExportResponseDto({
      id: exportRecord.id,
      orgId: exportRecord.orgId,
      status: ExportStatus.PENDING,
      filename: exportRecord.filename,
      createdAt: exportRecord.createdAt,
      startDate: exportRecord.startDate,
      endDate: exportRecord.endDate,
    });
  }

  /**
   * Get export status
   */
  async getExportStatus(exportId: string): Promise<GobdExportResponseDto> {
    const exportRecord = await this.findExportRecord(exportId);

    const response: GobdExportResponseDto = new GobdExportResponseDto({
      id: exportRecord.id,
      orgId: exportRecord.orgId,
      status: exportRecord.status as unknown as ExportStatus,
      filename: exportRecord.filename,
      createdAt: exportRecord.createdAt,
      completedAt: exportRecord.completedAt,
      startDate: exportRecord.startDate,
      endDate: exportRecord.endDate,
      errorMessage: exportRecord.errorMessage,
    });

    // Add download URL if ready
    if (
      exportRecord.status === ExportStatus.READY ||
      exportRecord.status === ExportStatus.COMPLETED
    ) {
      response.downloadUrl = `/api/compliance/exports/gobd/${exportId}/download`;
    }

    return response;
  }

  /**
   * Download export
   */
  async downloadExport(exportId: string): Promise<StreamableFile> {
    const exportRecord = await this.findExportRecord(exportId);

    if (
      exportRecord.status !== ExportStatus.READY &&
      exportRecord.status !== ExportStatus.COMPLETED
    ) {
      throw new BadRequestException('Export is not ready for download');
    }

    const filePath = path.join(this.exportDir, exportRecord.filename);

    try {
      const fileStats = await stat(filePath);
      const fileStream = fs.createReadStream(filePath);

      // Update status to downloaded
      await this.updateExportStatus(exportId, ExportStatus.DOWNLOADED);

      this.logger.log(`Export downloaded: ${exportId}`);

      return new StreamableFile(fileStream, {
        type: 'application/zip',
        disposition: `attachment; filename="${exportRecord.filename}"`,
        length: fileStats.size,
      });
    } catch (error) {
      this.logger.error(`Failed to download export ${exportId}:`, error);
      throw new NotFoundException('Export file not found');
    }
  }

  /**
   * List exports for organization
   */
  async listExports(
    orgId: string,
    limit: number = 50,
  ): Promise<GobdExportListResponseDto> {
    const exports = await this.prisma.gobdExport.findMany({
      where: {
        orgId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    const total = await this.prisma.gobdExport.count({
      where: {
        orgId,
      },
    });

    const items: GobdExportListItemDto[] = exports.map((exp) => ({
      id: exp.id,
      status: exp.status as unknown as ExportStatus,
      filename: exp.filename,
      createdAt: exp.createdAt,
      startDate: exp.startDate,
      endDate: exp.endDate,
      fileSize: exp.fileSize,
    }));

    return new GobdExportListResponseDto(items, total);
  }

  /**
   * Delete export
   */
  async deleteExport(exportId: string): Promise<void> {
    const exportRecord = await this.findExportRecord(exportId);

    // Delete file from filesystem
    const filePath = path.join(this.exportDir, exportRecord.filename);
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      this.logger.warn(
        `Failed to delete export file ${filePath}:`,
        error.message,
      );
    }

    // Delete record
    await this.prisma.gobdExport.delete({
      where: { id: exportId },
    });

    this.logger.log(`Export deleted: ${exportId}`);
  }

  /**
   * Generate export asynchronously
   */
  private async generateExportAsync(
    exportId: string,
    dto: CreateGobdExportDto,
    org: any,
  ): Promise<void> {
    try {
      // Update status to processing
      await this.updateExportStatus(exportId, ExportStatus.PROCESSING);

      // Create temporary directory
      const tempDirName = GobdPackagerUtil.generateTempDirName(exportId);
      const tempExportDir = path.join(this.tempDir, tempDirName);

      // Create export structure
      await GobdPackagerUtil.createExportStructure(tempExportDir);

      // Build configuration
      const config: GobdConfig = {
        orgId: dto.orgId,
        dateRange: dto.dateRange,
        documentTypes: dto.documentTypes,
        format: dto.format,
        includeDocuments: dto.includeDocuments ?? true,
        includeSignature: dto.includeSignature ?? false,
        incremental: dto.incremental ?? false,
        lastExportDate: dto.lastExportDate,
        metadata: dto.metadata,
      };

      // Generate index.xml
      const indexXml = await this.gobdBuilder.buildIndexXml(config, org);
      await writeFile(
        path.join(tempExportDir, 'index.xml'),
        indexXml,
        'utf-8',
      );

      // Generate DTD file
      const dtdContent = GobdXmlBuilder.buildDtdContent();
      await writeFile(
        path.join(tempExportDir, 'gdpdu-01-09-2004.dtd'),
        dtdContent,
        'utf-8',
      );

      // Export data tables
      const dataTables = await this.gobdBuilder.exportDataTables(
        dto.orgId,
        dto.dateRange,
      );

      // Write CSV files
      await GobdPackagerUtil.writeCsvFile(
        path.join(tempExportDir, 'data', 'accounts.csv'),
        dataTables.accounts,
      );
      await GobdPackagerUtil.writeCsvFile(
        path.join(tempExportDir, 'data', 'transactions.csv'),
        dataTables.transactions,
      );
      await GobdPackagerUtil.writeCsvFile(
        path.join(tempExportDir, 'data', 'invoices.csv'),
        dataTables.invoices,
      );
      await GobdPackagerUtil.writeCsvFile(
        path.join(tempExportDir, 'data', 'customers.csv'),
        dataTables.customers,
      );
      await GobdPackagerUtil.writeCsvFile(
        path.join(tempExportDir, 'data', 'suppliers.csv'),
        dataTables.suppliers,
      );

      // Package documents if requested
      if (config.includeDocuments) {
        await this.gobdBuilder.packageDocuments(
          dto.orgId,
          dto.dateRange,
          tempExportDir,
        );
      }

      // Generate checksums
      const checksumFile =
        await this.gobdBuilder.generateChecksums(tempExportDir);
      const checksumContent = GobdHashUtil.formatChecksumFile(checksumFile);
      await writeFile(
        path.join(tempExportDir, 'checksums.sha256'),
        checksumContent,
        'utf-8',
      );

      // Validate export structure
      const validation =
        await GobdPackagerUtil.validateExportStructure(tempExportDir);
      if (!validation.valid) {
        throw new Error(
          `Export validation failed: ${validation.errors.join(', ')}`,
        );
      }

      // Create ZIP archive
      const exportRecord = await this.findExportRecord(exportId);
      const zipPath = path.join(this.exportDir, exportRecord.filename);
      await GobdPackagerUtil.createZipArchive(tempExportDir, zipPath);

      // Calculate metadata
      const fileStats = await stat(zipPath);
      const archiveHash = await GobdHashUtil.hashFile(zipPath);
      const totalFiles = await GobdPackagerUtil.countFiles(tempExportDir);

      const metadata = {
        totalFiles,
        totalSize: fileStats.size,
        transactionCount: dataTables.transactions.length,
        documentCount: 0, // TODO: Count actual documents
        archiveHash,
      };

      // Update export record
      await this.prisma.gobdExport.update({
        where: { id: exportId },
        data: {
          status: ExportStatus.READY,
          completedAt: new Date(),
          fileSize: fileStats.size,
        },
      });

      // Cleanup temporary directory
      await GobdPackagerUtil.cleanupDirectory(tempExportDir);

      this.logger.log(`Export completed successfully: ${exportId}`);
    } catch (error) {
      this.logger.error(`Export generation failed for ${exportId}:`, error);

      // Update status to failed
      await this.prisma.gobdExport.update({
        where: { id: exportId },
        data: {
          status: ExportStatus.FAILED,
          errorMessage: error.message,
        },
      });
    }
  }

  /**
   * Create export record in database
   */
  private async createExportRecord(
    id: string,
    orgId: string,
    filename: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    return this.prisma.gobdExport.create({
      data: {
        id,
        orgId,
        filename,
        status: ExportStatus.PENDING,
        startDate,
        endDate,
        year: startDate.getFullYear(),
      },
    });
  }

  /**
   * Find export record
   */
  private async findExportRecord(exportId: string): Promise<any> {
    const exportRecord = await this.prisma.gobdExport.findUnique({
      where: { id: exportId },
    });

    if (!exportRecord) {
      throw new NotFoundException(`Export not found: ${exportId}`);
    }

    return exportRecord;
  }

  /**
   * Update export status
   */
  private async updateExportStatus(
    exportId: string,
    status: ExportStatus,
  ): Promise<void> {
    await this.prisma.gobdExport.update({
      where: { id: exportId },
      data: { status },
    });
  }

  /**
   * Generate unique export ID
   */
  private generateExportId(): string {
    return `gobd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up expired exports (run as cron job)
   */
  async cleanupExpiredExports(): Promise<void> {
    // Get exports older than retention days
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - this.retentionDays);

    const expiredExports = await this.prisma.gobdExport.findMany({
      where: {
        createdAt: {
          lt: expirationDate,
        },
      },
    });

    this.logger.log(`Cleaning up ${expiredExports.length} expired exports`);

    for (const exp of expiredExports) {
      try {
        await this.deleteExport(exp.id);
      } catch (error) {
        this.logger.error(`Failed to cleanup export ${exp.id}:`, error);
      }
    }
  }
}
