/**
 * DATEV Import Controller
 * REST API endpoints for DATEV file imports
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
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
import { DatevImportService } from './datev-import.service';
import {
  AnalyzeDatevFileDto,
  PreviewDatevImportDto,
  ExecuteDatevImportDto,
  DatevImportAnalysisResponseDto,
  DatevImportPreviewResponseDto,
  DatevImportJobResponseDto,
} from './dto/datev-import.dto';
import { MAX_FILE_SIZE } from './datev-import.constants';

@ApiTags('DATEV Import')
@ApiBearerAuth()
@Controller('imports/datev')
export class DatevImportController {
  private readonly logger = new Logger(DatevImportController.name);

  constructor(private readonly importService: DatevImportService) {}

  /**
   * Upload and analyze DATEV file
   */
  @Post('analyze')
  @ApiOperation({
    summary: 'Analyze DATEV file',
    description:
      'Upload a DATEV ASCII CSV file and analyze its structure, detect format, and validate contents',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'orgId'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'DATEV CSV file (.csv or .txt)',
        },
        orgId: {
          type: 'string',
          description: 'Organization ID',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File analyzed successfully',
    type: DatevImportAnalysisResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or format',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async analyzeFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('orgId') orgId: string,
  ): Promise<DatevImportAnalysisResponseDto> {
    this.logger.log(`Analyzing DATEV file: ${file.originalname}`);

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!orgId) {
      throw new BadRequestException('Organization ID is required');
    }

    const analysis = await this.importService.analyzeFile(
      file.buffer,
      file.originalname,
      orgId,
    );

    return analysis as DatevImportAnalysisResponseDto;
  }

  /**
   * Preview DATEV import with mapping
   */
  @Post('preview')
  @ApiOperation({
    summary: 'Preview DATEV import',
    description:
      'Upload a DATEV file and preview the import with account mapping suggestions',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'orgId'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'DATEV CSV file',
        },
        orgId: {
          type: 'string',
          description: 'Organization ID',
        },
        mapping: {
          type: 'object',
          description: 'Custom account mapping (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Preview generated successfully',
    type: DatevImportPreviewResponseDto,
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async previewImport(
    @UploadedFile() file: Express.Multer.File,
    @Body('orgId') orgId: string,
    @Body('mapping') mapping?: string,
  ): Promise<DatevImportPreviewResponseDto> {
    this.logger.log(`Generating preview for: ${file.originalname}`);

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!orgId) {
      throw new BadRequestException('Organization ID is required');
    }

    // Parse mapping if provided
    let parsedMapping;
    if (mapping) {
      try {
        parsedMapping = JSON.parse(mapping);
      } catch (error) {
        throw new BadRequestException('Invalid mapping JSON');
      }
    }

    const preview = await this.importService.previewImport(
      file.buffer,
      file.originalname,
      orgId,
      parsedMapping,
    );

    return preview as DatevImportPreviewResponseDto;
  }

  /**
   * Execute DATEV import
   */
  @Post('execute')
  @ApiOperation({
    summary: 'Execute DATEV import',
    description:
      'Start importing DATEV file data into the system. Returns a job ID for tracking progress.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'orgId'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'DATEV CSV file',
        },
        orgId: {
          type: 'string',
          description: 'Organization ID',
        },
        dryRun: {
          type: 'boolean',
          description: 'Dry run mode (preview only)',
          default: false,
        },
        skipValidation: {
          type: 'boolean',
          description: 'Skip validation checks',
          default: false,
        },
        updateExisting: {
          type: 'boolean',
          description: 'Update existing records',
          default: false,
        },
        skipDuplicates: {
          type: 'boolean',
          description: 'Skip duplicate records',
          default: true,
        },
        batchSize: {
          type: 'number',
          description: 'Batch size for processing',
          default: 100,
        },
        continueOnError: {
          type: 'boolean',
          description: 'Continue on errors',
          default: true,
        },
        mapping: {
          type: 'object',
          description: 'Account mapping',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Import job created',
    type: DatevImportJobResponseDto,
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async executeImport(
    @UploadedFile() file: Express.Multer.File,
    @Body('orgId') orgId: string,
    @Body('dryRun') dryRun?: string,
    @Body('skipValidation') skipValidation?: string,
    @Body('updateExisting') updateExisting?: string,
    @Body('skipDuplicates') skipDuplicates?: string,
    @Body('batchSize') batchSize?: string,
    @Body('continueOnError') continueOnError?: string,
    @Body('mapping') mapping?: string,
  ): Promise<DatevImportJobResponseDto> {
    this.logger.log(`Executing import for: ${file.originalname}`);

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!orgId) {
      throw new BadRequestException('Organization ID is required');
    }

    // Parse options
    const options = {
      dryRun: dryRun === 'true' || dryRun === '1',
      skipValidation: skipValidation === 'true' || skipValidation === '1',
      updateExisting: updateExisting === 'true' || updateExisting === '1',
      skipDuplicates:
        skipDuplicates === undefined || skipDuplicates === 'true' || skipDuplicates === '1',
      batchSize: batchSize ? parseInt(batchSize, 10) : 100,
      continueOnError:
        continueOnError === undefined || continueOnError === 'true' || continueOnError === '1',
      mapping: mapping ? JSON.parse(mapping) : undefined,
    };

    const job = await this.importService.executeImport(
      file.buffer,
      file.originalname,
      orgId,
      options,
    );

    return job as DatevImportJobResponseDto;
  }

  /**
   * Get import job status
   */
  @Get('status/:jobId')
  @ApiOperation({
    summary: 'Get import job status',
    description:
      'Check the status and progress of an import job using the job ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved',
    type: DatevImportJobResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  async getJobStatus(
    @Param('jobId') jobId: string,
  ): Promise<DatevImportJobResponseDto> {
    this.logger.log(`Getting status for job: ${jobId}`);

    const job = await this.importService.getJobStatus(jobId);

    return job as DatevImportJobResponseDto;
  }
}
