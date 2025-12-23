/**
 * SAF-T Export Service
 * Main service for SAF-T export management
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { StreamableFile } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { SaftBuilderService } from './saft-builder.service';
import { SaftValidator } from './utils/saft-validator.util';
import {
  CreateSaftExportDto,
  SaftExportResponseDto,
  ValidationResultDto,
} from './dto';
import {
  ExportStatus,
  ExportScope,
  SaftOptions,
  ValidationResult,
} from './interfaces';
import { createHash } from 'crypto';
import { createReadStream, promises as fs } from 'fs';
import { join } from 'path';

/**
 * SAF-T Export Service
 */
@Injectable()
export class SaftService {
  private readonly logger = new Logger(SaftService.name);
  private readonly validator: SaftValidator;
  private readonly exportDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly builder: SaftBuilderService,
  ) {
    this.validator = new SaftValidator();
    this.exportDir = process.env.SAFT_EXPORT_DIR || './exports/saft';
  }

  /**
   * Create a new SAF-T export
   */
  async createExport(
    organizationId: string,
    userId: string,
    dto: CreateSaftExportDto,
  ): Promise<SaftExportResponseDto> {
    this.logger.log(
      `Creating SAF-T export for organization ${organizationId} with variant ${dto.variant}`,
    );

    // Validate date range
    const startDate = new Date(dto.dateRange.startDate);
    const endDate = new Date(dto.dateRange.endDate);

    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Create export record
    const exportId = this.generateExportId();
    const exportRecord = await this.createExportRecord(
      exportId,
      organizationId,
      userId,
      dto,
    );

    // Start async export generation
    this.generateExportAsync(exportId, organizationId, dto).catch((error) => {
      this.logger.error(`Failed to generate export ${exportId}:`, error);
      this.updateExportStatus(exportId, ExportStatus.FAILED, error.message);
    });

    return this.mapToResponseDto(exportRecord);
  }

  /**
   * Get export status
   */
  async getExportStatus(
    organizationId: string,
    exportId: string,
  ): Promise<SaftExportResponseDto> {
    const exportRecord = await this.findExport(exportId, organizationId);
    return this.mapToResponseDto(exportRecord);
  }

  /**
   * Download export file
   */
  async downloadExport(
    organizationId: string,
    exportId: string,
  ): Promise<StreamableFile> {
    const exportRecord = await this.findExport(exportId, organizationId);

    if (exportRecord.status !== ExportStatus.COMPLETED) {
      throw new BadRequestException('Export is not ready for download');
    }

    const filePath = this.getExportFilePath(exportId);

    try {
      await fs.access(filePath);
      const file = createReadStream(filePath);
      return new StreamableFile(file, {
        type: 'application/xml',
        disposition: `attachment; filename="saft-${exportId}.xml"`,
      });
    } catch (error) {
      throw new NotFoundException('Export file not found');
    }
  }

  /**
   * Validate export
   */
  async validateExport(
    organizationId: string,
    exportId: string,
  ): Promise<ValidationResultDto> {
    const exportRecord = await this.findExport(exportId, organizationId);

    if (exportRecord.status !== ExportStatus.COMPLETED) {
      throw new BadRequestException('Export must be completed to validate');
    }

    const filePath = this.getExportFilePath(exportId);
    const xmlContent = await fs.readFile(filePath, 'utf-8');

    const result = await this.validator.validateXml(xmlContent);

    // Update export record with validation results
    await this.updateExportValidation(exportId, result);

    return {
      isValid: result.valid,
      errors: (result.errors || []).map((e) => ({
        code: e.code,
        message: e.message,
        path: e.path,
        severity: 'error' as const,
      })),
      warnings: (result.warnings || []).map((w) => ({
        code: w.code,
        message: w.message,
        path: w.path,
      })),
      validatedAt: new Date(),
      schemaVersion: result.schemaVersion || '1.0',
      totalRecords: 0,
      recordsWithErrors: result.errors?.length || 0,
      recordsWithWarnings: result.warnings?.length || 0,
    };
  }

  /**
   * List exports for organization
   */
  async listExports(
    organizationId: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{
    exports: SaftExportResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const skip = (page - 1) * pageSize;

    const [exports, total] = await Promise.all([
      this.prisma.saftExport.findMany({
        where: { orgId: organizationId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.saftExport.count({
        where: { orgId: organizationId },
      }),
    ]);

    return {
      exports: exports.map((exp) => this.mapToResponseDto(exp)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Delete export
   */
  async deleteExport(organizationId: string, exportId: string): Promise<void> {
    const exportRecord = await this.findExport(exportId, organizationId);

    // Delete file
    const filePath = this.getExportFilePath(exportId);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      this.logger.warn(`Failed to delete export file ${filePath}:`, error);
    }

    // Delete record
    await this.prisma.saftExport.delete({
      where: { id: exportId },
    });

    this.logger.log(`Export ${exportId} deleted successfully`);
  }

  /**
   * Generate export asynchronously
   */
  private async generateExportAsync(
    exportId: string,
    organizationId: string,
    dto: CreateSaftExportDto,
  ): Promise<void> {
    try {
      await this.updateExportStatus(exportId, ExportStatus.PROCESSING);

      const options: SaftOptions = {
        variant: dto.variant,
        scope: dto.scope,
        dateRange: {
          startDate: new Date(dto.dateRange.startDate),
          endDate: new Date(dto.dateRange.endDate),
        },
        includeOpeningBalances: dto.includeOpeningBalances ?? true,
        includeClosingBalances: dto.includeClosingBalances ?? true,
        includeTaxDetails: dto.includeTaxDetails ?? true,
        includeCustomerSupplierDetails: dto.includeCustomerSupplierDetails ?? true,
        compression: dto.compression ?? false,
        validation: dto.validation ?? true,
        countrySpecificExtensions: dto.countrySpecificExtensions,
      };

      const xmlContent = await this.builder.buildSaftXml(organizationId, options);

      let validationResult: ValidationResult | undefined;
      if (options.validation) {
        await this.updateExportStatus(exportId, ExportStatus.VALIDATING);
        validationResult = await this.validator.validateXml(xmlContent);

        if (!validationResult.valid) {
          throw new Error(
            `Validation failed: ${validationResult.errors.map((e) => e.message).join(', ')}`,
          );
        }
      }

      const filePath = await this.saveExportFile(exportId, xmlContent);
      const stats = await fs.stat(filePath);
      const checksum = this.calculateChecksum(xmlContent);
      const metadata = await this.extractMetadata(xmlContent);

      await this.prisma.saftExport.update({
        where: { id: exportId },
        data: {
          status: ExportStatus.COMPLETED,
          filePath,
          fileSize: stats.size,
          checksum,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Export ${exportId} completed successfully`);
    } catch (error) {
      this.logger.error(`Export ${exportId} failed:`, error);
      await this.updateExportStatus(exportId, ExportStatus.FAILED, error.message);
      throw error;
    }
  }

  private async createExportRecord(
    exportId: string,
    organizationId: string,
    userId: string,
    dto: CreateSaftExportDto,
  ): Promise<any> {
    return this.prisma.saftExport.create({
      data: {
        id: exportId,
        orgId: organizationId,
        startDate: new Date(dto.dateRange.startDate),
        endDate: new Date(dto.dateRange.endDate),
        status: ExportStatus.PENDING,
        year: new Date(dto.dateRange.startDate).getFullYear(),
        country: dto.variant,
      },
    });
  }

  private async findExport(exportId: string, organizationId: string): Promise<any> {
    const exportRecord = await this.prisma.saftExport.findFirst({
      where: { id: exportId, orgId: organizationId },
    });

    if (!exportRecord) {
      throw new NotFoundException(`Export ${exportId} not found`);
    }

    return exportRecord;
  }

  private async updateExportStatus(
    exportId: string,
    status: ExportStatus,
    error?: string,
  ): Promise<void> {
    await this.prisma.saftExport.update({
      where: { id: exportId },
      data: {
        status,
        ...(error && { errorMessage: error }),
      },
    });
  }

  private async updateExportValidation(
    exportId: string,
    result: ValidationResult,
  ): Promise<void> {
    await this.prisma.saftExport.update({
      where: { id: exportId },
      data: {
        errorMessage: result.errors.length > 0
          ? result.errors.map((e) => e.message).join('; ')
          : null
      },
    });
  }

  private async saveExportFile(exportId: string, content: string): Promise<string> {
    await fs.mkdir(this.exportDir, { recursive: true });
    const filePath = this.getExportFilePath(exportId);
    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
  }

  private getExportFilePath(exportId: string): string {
    return join(this.exportDir, `${exportId}.xml`);
  }

  private calculateChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private async extractMetadata(xmlContent: string): Promise<{
    numberOfEntries: number;
    totalDebit: number;
    totalCredit: number;
  }> {
    const numberOfEntriesMatch = xmlContent.match(/<NumberOfEntries>(\d+)<\/NumberOfEntries>/);
    const totalDebitMatch = xmlContent.match(/<TotalDebit>([\d.]+)<\/TotalDebit>/);
    const totalCreditMatch = xmlContent.match(/<TotalCredit>([\d.]+)<\/TotalCredit>/);

    return {
      numberOfEntries: numberOfEntriesMatch ? parseInt(numberOfEntriesMatch[1], 10) : 0,
      totalDebit: totalDebitMatch ? parseFloat(totalDebitMatch[1]) : 0,
      totalCredit: totalCreditMatch ? parseFloat(totalCreditMatch[1]) : 0,
    };
  }

  private generateExportId(): string {
    return `SAFT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapToResponseDto(record: any): SaftExportResponseDto {
    return {
      exportId: record.id,
      organizationId: record.orgId,
      status: record.status,
      variant: record.country,
      scope: ExportScope.FULL,
      startDate: record.startDate.toISOString().split('T')[0],
      endDate: record.endDate.toISOString().split('T')[0],
      fileSize: record.fileSize,
      numberOfEntries: 0,
      totalDebit: 0,
      totalCredit: 0,
      createdAt: record.createdAt,
      createdBy: 'system',
      completedAt: record.completedAt,
      checksum: record.checksum,
      validationErrors: record.errorMessage ? [record.errorMessage] : undefined,
      description: undefined,
    };
  }
}
