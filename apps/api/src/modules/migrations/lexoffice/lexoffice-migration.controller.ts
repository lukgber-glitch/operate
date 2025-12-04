import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LexofficeMigrationService } from './lexoffice-migration.service';
import {
  PreviewMigrationDto,
  ExecuteMigrationDto,
} from './dto';
import {
  MigrationPreview,
  MigrationResult,
  MigrationProgress,
} from './lexoffice.types';

@ApiTags('Migrations - Lexoffice')
@Controller('migrations/lexoffice')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LexofficeMigrationController {
  constructor(
    private readonly migrationService: LexofficeMigrationService,
  ) {}

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload lexoffice CSV/Excel file',
    description:
      'Upload a lexoffice export file (CSV or Excel) for validation. This endpoint checks the file format and structure without importing data.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV or Excel file from lexoffice',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File uploaded and validated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        filename: { type: 'string' },
        size: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file format or size',
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.migrationService.validateFile(file);

    return {
      success: true,
      message: 'File validated successfully',
      filename: file.originalname,
      size: file.size,
    };
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Preview migration data',
    description:
      'Parse and preview lexoffice data without importing. Returns sample data, validation errors, and statistics.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV or Excel file from lexoffice',
        },
        type: {
          type: 'string',
          enum: ['contacts', 'invoices', 'vouchers', 'products'],
          description: 'Type of data to preview',
        },
      },
      required: ['file', 'type'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Preview data returned successfully',
    type: MigrationPreview,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or migration type',
  })
  async previewMigration(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: PreviewMigrationDto,
  ): Promise<MigrationPreview> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.migrationService.validateFile(file);

    return this.migrationService.previewMigration(file, dto.type);
  }

  @Post('execute')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Execute migration',
    description:
      'Import lexoffice data into the system. Supports dry-run mode for testing without database changes.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV or Excel file from lexoffice',
        },
        type: {
          type: 'string',
          enum: ['contacts', 'invoices', 'vouchers', 'products'],
          description: 'Type of data to migrate',
        },
        dryRun: {
          type: 'boolean',
          description: 'Run in dry-run mode (no database changes)',
          default: false,
        },
      },
      required: ['file', 'type'],
    },
  })
  @ApiResponse({
    status: 202,
    description: 'Migration started successfully',
    type: MigrationResult,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or migration parameters',
  })
  async executeMigration(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ExecuteMigrationDto,
  ): Promise<MigrationResult> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.migrationService.validateFile(file);

    const orgId = req.user.organisationId;
    const dryRun = dto.dryRun || false;

    return this.migrationService.executeMigration(
      orgId,
      file,
      dto.type,
      dryRun,
    );
  }

  @Get('status/:jobId')
  @ApiOperation({
    summary: 'Get migration job status',
    description:
      'Check the progress and status of a running or completed migration job.',
  })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved successfully',
    type: MigrationProgress,
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  async getJobStatus(
    @Param('jobId') jobId: string,
  ): Promise<MigrationProgress> {
    const status = this.migrationService.getJobStatus(jobId);

    if (!status) {
      throw new BadRequestException('Job not found');
    }

    return status;
  }
}
