import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FreeFinanceMigrationService } from './freefinance-migration.service';
import {
  UploadFreeFinanceFileDto,
  PreviewMigrationDto,
  ExecuteMigrationDto,
  ValidateMigrationDto,
  UploadResponseDto,
  PreviewResponseDto,
  ExecuteResponseDto,
  StatusResponseDto,
  ValidationResponseDto,
} from './dto/freefinance-migration.dto';
import { FreeFinanceMigrationType, MigrationConfig } from './freefinance.types';
import { SUPPORTED_EXTENSIONS } from './freefinance.constants';

/**
 * Controller for FreeFinance migration endpoints
 * Handles file uploads, preview, validation, and execution
 */
@ApiTags('Migrations - FreeFinance')
@ApiBearerAuth()
@Controller('migrations/freefinance')
export class FreeFinanceMigrationController {
  // In-memory file storage for demo (use S3/disk in production)
  private readonly uploadedFiles = new Map<string, { buffer: Buffer; metadata: any }>();

  constructor(
    private readonly migrationService: FreeFinanceMigrationService,
  ) {}

  /**
   * Upload FreeFinance CSV/Excel file
   * Returns file info and detected structure
   */
  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload FreeFinance CSV/Excel file',
    description: 'Upload a FreeFinance export file for migration. Detects file structure and returns metadata.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload',
    type: UploadFreeFinanceFileDto,
  })
  @ApiResponse({
    status: 200,
    description: 'File uploaded successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or file type',
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: FreeFinanceMigrationType,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file extension
    const extension = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (!extension || !SUPPORTED_EXTENSIONS.includes(extension)) {
      throw new BadRequestException(
        `Unsupported file type. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`,
      );
    }

    // Detect file info
    const fileInfo = await this.migrationService['parserService'].detectFileInfo(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    // Store file temporarily
    const fileId = this.generateFileId();
    this.uploadedFiles.set(fileId, {
      buffer: file.buffer,
      metadata: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        type,
      },
    });

    // Clean up old files (keep only last 100)
    if (this.uploadedFiles.size > 100) {
      const firstKey = this.uploadedFiles.keys().next().value;
      this.uploadedFiles.delete(firstKey);
    }

    return {
      fileId,
      originalName: file.originalname,
      size: file.size,
      detectedType: fileInfo.detectedType,
      rowCount: fileInfo.rowCount || 0,
      columnCount: fileInfo.columnCount || 0,
    };
  }

  /**
   * Generate preview of migration data
   * Shows sample records, detected fields, and validation results
   */
  @Post('preview/:fileId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Preview migration data',
    description: 'Analyze uploaded file and generate preview with sample data, field mappings, and validation results.',
  })
  @ApiResponse({
    status: 200,
    description: 'Preview generated successfully',
    type: PreviewResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async preview(
    @Param('fileId') fileId: string,
    @Body() dto: PreviewMigrationDto,
  ): Promise<PreviewResponseDto> {
    const fileData = this.uploadedFiles.get(fileId);
    if (!fileData) {
      throw new NotFoundException('File not found. Please upload the file again.');
    }

    const preview = await this.migrationService.generatePreview(
      fileData.buffer,
      fileData.metadata.originalName,
      fileData.metadata.mimeType,
      dto.type,
    );

    return preview;
  }

  /**
   * Validate migration data without importing
   * Performs comprehensive validation and returns detailed results
   */
  @Post('validate/:fileId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate migration data',
    description: 'Validate uploaded file without importing. Returns detailed validation results and data quality metrics.',
  })
  @ApiResponse({
    status: 200,
    description: 'Validation completed',
    type: ValidationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async validate(
    @Param('fileId') fileId: string,
    @Body() dto: ValidateMigrationDto,
  ): Promise<ValidationResponseDto> {
    const fileData = this.uploadedFiles.get(fileId);
    if (!fileData) {
      throw new NotFoundException('File not found. Please upload the file again.');
    }

    const validation = await this.migrationService.validate(
      fileData.buffer,
      fileData.metadata.originalName,
      dto.type,
      {
        strictMode: dto.strictMode,
        customFieldMapping: dto.customFieldMapping,
      },
    );

    return validation;
  }

  /**
   * Execute migration
   * Starts async migration job and returns job ID for tracking
   */
  @Post('execute/:fileId')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Execute migration',
    description: 'Start migration process. Returns job ID for tracking progress. Migration runs asynchronously.',
  })
  @ApiResponse({
    status: 202,
    description: 'Migration started',
    type: ExecuteResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async execute(
    @Param('fileId') fileId: string,
    @Body() dto: ExecuteMigrationDto,
  ): Promise<ExecuteResponseDto> {
    const fileData = this.uploadedFiles.get(fileId);
    if (!fileData) {
      throw new NotFoundException('File not found. Please upload the file again.');
    }

    const config: MigrationConfig = {
      dryRun: dto.dryRun || false,
      batchSize: dto.batchSize || 100,
      skipDuplicates: dto.skipDuplicates !== false,
      updateExisting: dto.updateExisting || false,
      validateOnly: dto.validateOnly || false,
      strictMode: dto.strictMode || false,
      createMissingReferences: dto.createMissingReferences || false,
      defaultCountry: dto.defaultCountry || 'AT',
      defaultCurrency: dto.defaultCurrency || 'EUR',
      dateFormat: dto.dateFormat,
      encoding: dto.encoding,
      delimiter: dto.delimiter,
      customFieldMapping: dto.customFieldMapping,
    };

    const result = await this.migrationService.executeMigration(
      fileData.buffer,
      fileData.metadata.originalName,
      dto.type,
      config,
    );

    return {
      jobId: result.jobId,
      status: 'pending',
      message: dto.dryRun
        ? 'Dry run started - no data will be imported'
        : 'Migration job started. Use the jobId to track progress.',
    };
  }

  /**
   * Get migration job status
   * Returns current progress and results
   */
  @Get('status/:jobId')
  @ApiOperation({
    summary: 'Get migration status',
    description: 'Check the status and progress of a migration job.',
  })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved',
    type: StatusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  async getStatus(@Param('jobId') jobId: string): Promise<StatusResponseDto> {
    const progress = this.migrationService.getStatus(jobId);
    if (!progress) {
      throw new NotFoundException('Migration job not found');
    }

    return {
      jobId: progress.jobId,
      status: progress.status,
      progress: progress.progress,
      currentPhase: progress.currentPhase,
      totalRecords: progress.totalRecords,
      processedRecords: progress.processedRecords,
      successCount: progress.successCount,
      failureCount: progress.failureCount,
      warningCount: progress.warningCount,
      errors: progress.errors,
      warnings: progress.warnings,
      startedAt: progress.startedAt,
      completedAt: progress.completedAt,
      estimatedCompletion: progress.estimatedCompletion,
      processingRate: progress.processingRate,
    };
  }

  /**
   * Cancel migration job
   */
  @Post('cancel/:jobId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel migration',
    description: 'Cancel a running migration job.',
  })
  @ApiResponse({
    status: 200,
    description: 'Job cancelled',
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found or cannot be cancelled',
  })
  async cancel(@Param('jobId') jobId: string): Promise<{ message: string }> {
    const cancelled = await this.migrationService.cancelMigration(jobId);
    if (!cancelled) {
      throw new NotFoundException('Job not found or cannot be cancelled');
    }

    return {
      message: 'Migration job cancelled successfully',
    };
  }

  /**
   * Get supported migration types
   */
  @Get('types')
  @ApiOperation({
    summary: 'Get supported migration types',
    description: 'List all supported FreeFinance migration types.',
  })
  @ApiResponse({
    status: 200,
    description: 'Migration types retrieved',
  })
  getTypes(): { types: FreeFinanceMigrationType[]; descriptions: Record<string, string> } {
    return {
      types: Object.values(FreeFinanceMigrationType),
      descriptions: {
        [FreeFinanceMigrationType.CUSTOMERS]: 'Kunden - Customer master data',
        [FreeFinanceMigrationType.VENDORS]: 'Lieferanten - Vendor/supplier master data',
        [FreeFinanceMigrationType.OUTGOING_INVOICES]: 'Ausgangsrechnungen - Outgoing invoices',
        [FreeFinanceMigrationType.INCOMING_INVOICES]: 'Eingangsrechnungen - Incoming invoices/expenses',
        [FreeFinanceMigrationType.PRODUCTS]: 'Artikel - Products and services',
      },
    };
  }

  /**
   * Get Austrian VAT rates
   */
  @Get('vat-rates')
  @ApiOperation({
    summary: 'Get Austrian VAT rates',
    description: 'List valid Austrian VAT rates for validation.',
  })
  @ApiResponse({
    status: 200,
    description: 'VAT rates retrieved',
  })
  getVatRates(): { rates: any } {
    return {
      rates: {
        standard: 20,
        reduced_1: 13,
        reduced_2: 10,
        zero: 0,
      },
      descriptions: {
        20: 'Standard rate (Normalsteuersatz)',
        13: 'Reduced rate 1 - Food, agriculture (Ermäßigter Steuersatz 1)',
        10: 'Reduced rate 2 - Books, culture (Ermäßigter Steuersatz 2)',
        0: 'Zero rate - Exports, intra-EU (Nullsteuersatz)',
      },
    };
  }

  /**
   * Generate unique file ID
   */
  private generateFileId(): string {
    return `ff_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}
