import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Res,
  UseGuards,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  StreamableFile,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ExportService } from './export.service';
import { createReadStream } from 'fs';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as archiver from 'archiver';
import {
  ExportPdfDto,
  ExportExcelDto,
  BatchExportDto,
  TemplateConfigDto,
  DownloadResponseDto,
  ExportProgressDto,
  ExportTemplateDto,
} from './dto';

@ApiTags('Reports - Export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports/export')
export class ExportController {
  private readonly logger = new Logger(ExportController.name);

  constructor(private readonly exportService: ExportService) {}

  @Post('pdf')
  @Roles('user', 'admin', 'accountant')
  @ApiOperation({ summary: 'Generate PDF report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PDF generated successfully',
    type: DownloadResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data',
  })
  async generatePdf(@Body() dto: ExportPdfDto): Promise<DownloadResponseDto> {
    this.logger.log(`Generating PDF report with template: ${dto.template}`);

    try {
      // Generate PDF
      const pdfBuffer = await this.exportService.generatePdf(
        dto.reportData,
        dto.template,
        dto,
      );

      // Generate filename
      const filename = await this.exportService.generateFilename(
        dto.template,
        dto.reportData.dateRange,
        'pdf',
      );

      // Upload to storage
      const filePath = await this.exportService.uploadToStorage(pdfBuffer, filename);

      // Schedule cleanup
      const ttl = 86400; // 24 hours
      await this.exportService.scheduleExportCleanup(filename, ttl);

      // Get download URL
      const downloadResponse = await this.exportService.getDownloadUrl(filename);

      // Send email if requested
      if (dto.sendEmail && dto.emailRecipients && dto.emailRecipients.length > 0) {
        this.logger.log(`Sending PDF to ${dto.emailRecipients.join(', ')}`);
        // TODO: Implement email sending
      }

      return downloadResponse;
    } catch (error) {
      this.logger.error(`PDF generation failed: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to generate PDF');
    }
  }

  @Post('excel')
  @Roles('user', 'admin', 'accountant')
  @ApiOperation({ summary: 'Generate Excel report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Excel generated successfully',
    type: DownloadResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data',
  })
  async generateExcel(@Body() dto: ExportExcelDto): Promise<DownloadResponseDto> {
    this.logger.log(`Generating Excel report with template: ${dto.template}`);

    try {
      // Generate Excel
      const excelBuffer = await this.exportService.generateExcel(
        dto.reportData,
        dto.template,
        dto,
      );

      // Generate filename
      const filename = await this.exportService.generateFilename(
        dto.template,
        dto.reportData.dateRange,
        'xlsx',
      );

      // Upload to storage
      const filePath = await this.exportService.uploadToStorage(excelBuffer, filename);

      // Schedule cleanup
      const ttl = 86400; // 24 hours
      await this.exportService.scheduleExportCleanup(filename, ttl);

      // Get download URL
      const downloadResponse = await this.exportService.getDownloadUrl(filename);

      // Send email if requested
      if (dto.sendEmail && dto.emailRecipients && dto.emailRecipients.length > 0) {
        this.logger.log(`Sending Excel to ${dto.emailRecipients.join(', ')}`);
        // TODO: Implement email sending
      }

      return downloadResponse;
    } catch (error) {
      this.logger.error(`Excel generation failed: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to generate Excel');
    }
  }

  @Post('batch')
  @Roles('user', 'admin', 'accountant')
  @ApiOperation({ summary: 'Batch export multiple reports' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Batch export initiated successfully',
    type: ExportProgressDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data',
  })
  async batchExport(@Body() dto: BatchExportDto): Promise<ExportProgressDto> {
    this.logger.log(`Batch export initiated for ${dto.reports.length} reports`);

    try {
      const jobId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const exportedFiles: string[] = [];

      // Process each report
      for (let i = 0; i < dto.reports.length; i++) {
        const report = dto.reports[i];

        this.logger.log(`Processing report ${i + 1}/${dto.reports.length}: ${report.reportId}`);

        let buffer: Buffer;
        let extension: string;

        if (report.format === 'pdf') {
          buffer = await this.exportService.generatePdf(
            report.options?.reportData || {},
            report.template as any,
            report.options || {},
          );
          extension = 'pdf';
        } else {
          buffer = await this.exportService.generateExcel(
            report.options?.reportData || {},
            report.template as any,
            report.options || {},
          );
          extension = 'xlsx';
        }

        const filename = `${report.reportId}_${Date.now()}.${extension}`;
        await this.exportService.uploadToStorage(buffer, filename);
        exportedFiles.push(filename);
      }

      // Combine into ZIP if requested
      let resultFile: string;
      if (dto.combineIntoZip !== false) {
        const zipFilename = dto.zipFileName || `batch_export_${Date.now()}.zip`;
        await this.createZipArchive(exportedFiles, zipFilename);
        resultFile = zipFilename;

        // Delete individual files if requested
        if (dto.deleteAfterZip !== false) {
          for (const file of exportedFiles) {
            try {
              const filePath = join(process.cwd(), 'uploads', 'exports', file);
              await fs.unlink(filePath);
            } catch (error) {
              this.logger.warn(`Failed to delete file ${file}: ${error.message}`);
            }
          }
        }
      } else {
        resultFile = exportedFiles[0]; // Return first file
      }

      // Get download URL
      const downloadResponse = await this.exportService.getDownloadUrl(resultFile);

      // Send email if requested
      if (dto.sendEmail && dto.emailRecipients && dto.emailRecipients.length > 0) {
        this.logger.log(`Sending batch export to ${dto.emailRecipients.join(', ')}`);
        // TODO: Implement email sending
      }

      return {
        jobId,
        status: 'completed',
        progress: 100,
        currentStep: 'Export completed',
        result: downloadResponse,
        createdAt: new Date(),
        completedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Batch export failed: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to complete batch export');
    }
  }

  @Get('download/:id')
  @ApiOperation({ summary: 'Download exported file' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File downloaded successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found',
  })
  async downloadFile(@Param('id') id: string, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    this.logger.log(`Download requested for file: ${id}`);

    try {
      const filePath = join(process.cwd(), 'uploads', 'exports', id);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        throw new NotFoundException('File not found or has expired');
      }

      // Get file stats
      const stats = await fs.stat(filePath);
      const fileStream = createReadStream(filePath);

      // Set response headers
      const mimeType = this.getMimeType(id);
      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${id}"`,
        'Content-Length': stats.size,
        'Cache-Control': 'no-cache',
      });

      return new StreamableFile(fileStream);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Download failed: ${error.message}`, error.stack);
      throw new NotFoundException('File not found');
    }
  }

  @Get('templates')
  @Roles('user', 'admin', 'accountant')
  @ApiOperation({ summary: 'List available export templates' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Templates retrieved successfully',
    type: [ExportTemplateDto],
  })
  async listTemplates(): Promise<ExportTemplateDto[]> {
    this.logger.log('Listing export templates');

    // Return predefined templates
    const templates: ExportTemplateDto[] = [
      {
        id: 'pdf_pl_statement',
        name: 'P&L Statement (PDF)',
        description: 'Professional Profit & Loss statement with charts',
        type: 'pdf',
        isDefault: true,
        config: { template: 'pl_statement' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'pdf_cash_flow',
        name: 'Cash Flow Statement (PDF)',
        description: 'Detailed cash flow analysis',
        type: 'pdf',
        isDefault: false,
        config: { template: 'cash_flow' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'pdf_tax_summary',
        name: 'Tax Summary (PDF)',
        description: 'Comprehensive tax summary report',
        type: 'pdf',
        isDefault: false,
        config: { template: 'tax_summary' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'excel_financial',
        name: 'Financial Statement (Excel)',
        description: 'Multi-sheet financial workbook with formulas',
        type: 'excel',
        isDefault: true,
        config: { template: 'financial_statement' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'excel_payroll',
        name: 'Payroll Report (Excel)',
        description: 'Detailed payroll breakdown with calculations',
        type: 'excel',
        isDefault: false,
        config: { template: 'payroll_report' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return templates;
  }

  @Post('templates')
  @Roles('admin')
  @ApiOperation({ summary: 'Create custom export template' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Template created successfully',
    type: ExportTemplateDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid template data',
  })
  async createTemplate(@Body() dto: TemplateConfigDto): Promise<ExportTemplateDto> {
    this.logger.log(`Creating custom template: ${dto.name}`);

    // TODO: Implement template storage in database
    const template: ExportTemplateDto = {
      id: `custom_${Date.now()}`,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      isDefault: dto.isDefault || false,
      config: dto.config,
      createdAt: new Date(),
      updatedAt: new Date(),
      organizationId: dto.organizationId,
    };

    return template;
  }

  @Delete(':id')
  @Roles('user', 'admin', 'accountant')
  @ApiOperation({ summary: 'Delete exported file' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found',
  })
  async deleteFile(@Param('id') id: string): Promise<{ message: string }> {
    this.logger.log(`Delete requested for file: ${id}`);

    try {
      const filePath = join(process.cwd(), 'uploads', 'exports', id);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        throw new NotFoundException('File not found');
      }

      // Delete file
      await fs.unlink(filePath);

      return { message: 'File deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Delete failed: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete file');
    }
  }

  /**
   * Helper Methods
   */
  private async createZipArchive(files: string[], zipFilename: string): Promise<void> {
    const uploadsDir = join(process.cwd(), 'uploads', 'exports');
    const zipPath = join(uploadsDir, zipFilename);
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        this.logger.log(`ZIP archive created: ${zipFilename} (${archive.pointer()} bytes)`);
        resolve();
      });

      archive.on('error', (err) => {
        this.logger.error(`ZIP creation failed: ${err.message}`);
        reject(err);
      });

      archive.pipe(output);

      // Add files to archive
      files.forEach(file => {
        const filePath = join(uploadsDir, file);
        archive.file(filePath, { name: file });
      });

      archive.finalize();
    });
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
      csv: 'text/csv',
      zip: 'application/zip',
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}
