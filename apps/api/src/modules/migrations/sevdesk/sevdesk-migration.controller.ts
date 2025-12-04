import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { SevDeskMigrationService } from './sevdesk-migration.service';
import { UploadMigrationFileDto } from './dto/upload-migration-file.dto';
import { ExecuteMigrationDto } from './dto/execute-migration.dto';
import { MigrationJobResponseDto } from './dto/migration-job-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { Permission } from '../../auth/rbac/permissions';
import { SEVDESK_SUPPORTED_FORMATS, SEVDESK_MAX_FILE_SIZE } from './sevdesk.constants';

/**
 * sevDesk Migration Controller
 * Handles sevDesk CSV/Excel data migration to Operate
 */
@ApiTags('Migrations - sevDesk')
@Controller('organisations/:orgId/migrations/sevdesk')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class SevDeskMigrationController {
  constructor(private readonly migrationService: SevDeskMigrationService) {}

  /**
   * Upload sevDesk file and create migration job
   */
  @Post('upload')
  @RequirePermissions(Permission.MIGRATIONS_CREATE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/migrations/sevdesk',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `sevdesk-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: SEVDESK_MAX_FILE_SIZE,
      },
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const supportedFormats = [
          ...SEVDESK_SUPPORTED_FORMATS.CSV,
          ...SEVDESK_SUPPORTED_FORMATS.EXCEL,
        ];

        if (supportedFormats.includes(ext)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Unsupported file format. Allowed: ${supportedFormats.join(', ')}`,
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload sevDesk export file',
    description: 'Upload a CSV or Excel file exported from sevDesk to start migration process',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiBody({
    description: 'sevDesk export file and configuration',
    type: UploadMigrationFileDto,
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully, migration job created',
    type: MigrationJobResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or data',
  })
  @ApiResponse({
    status: 413,
    description: 'File too large',
  })
  async uploadFile(
    @Param('orgId') orgId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMigrationFileDto,
    @Request() req: any,
  ): Promise<MigrationJobResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const userId = req.user.id;

    // Create migration job
    const job = await this.migrationService.createMigrationJob(
      orgId,
      userId,
      file.path,
      file.originalname,
      dto.entityType,
      dto.dryRun ?? true,
    );

    return new MigrationJobResponseDto(job);
  }

  /**
   * Preview migration (dry-run)
   */
  @Post('preview')
  @RequirePermissions(Permission.MIGRATIONS_CREATE)
  @ApiOperation({
    summary: 'Preview migration',
    description: 'Validate and preview migration without making changes to the database',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiBody({
    description: 'Job ID to preview',
    type: ExecuteMigrationDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Preview completed successfully',
    type: MigrationJobResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Migration job not found',
  })
  async preview(
    @Param('orgId') orgId: string,
    @Body() dto: ExecuteMigrationDto,
    @Request() req: any,
  ): Promise<MigrationJobResponseDto> {
    const job = await this.migrationService.getJobStatus(dto.jobId);

    // Verify organization
    if (job.organizationId !== orgId) {
      throw new BadRequestException('Job does not belong to this organization');
    }

    // Get file path from job metadata (would be stored in real implementation)
    const filePath = `./uploads/migrations/sevdesk/sevdesk-${dto.jobId}.csv`;

    const updatedJob = await this.migrationService.preview(dto.jobId, filePath);

    return new MigrationJobResponseDto(updatedJob);
  }

  /**
   * Execute migration
   */
  @Post('execute')
  @RequirePermissions(Permission.MIGRATIONS_CREATE)
  @ApiOperation({
    summary: 'Execute migration',
    description: 'Execute the migration and import data into Operate database',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiBody({
    description: 'Job ID to execute',
    type: ExecuteMigrationDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Migration executed successfully',
    type: MigrationJobResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid job or already executed',
  })
  @ApiResponse({
    status: 404,
    description: 'Migration job not found',
  })
  async execute(
    @Param('orgId') orgId: string,
    @Body() dto: ExecuteMigrationDto,
    @Request() req: any,
  ): Promise<MigrationJobResponseDto> {
    const job = await this.migrationService.getJobStatus(dto.jobId);

    // Verify organization
    if (job.organizationId !== orgId) {
      throw new BadRequestException('Job does not belong to this organization');
    }

    // Get file path from job metadata (would be stored in real implementation)
    const filePath = `./uploads/migrations/sevdesk/sevdesk-${dto.jobId}.csv`;

    const updatedJob = await this.migrationService.execute(dto.jobId, filePath);

    return new MigrationJobResponseDto(updatedJob);
  }

  /**
   * Get migration job status
   */
  @Get('status/:jobId')
  @RequirePermissions(Permission.MIGRATIONS_READ)
  @ApiOperation({
    summary: 'Get migration job status',
    description: 'Check the status and progress of a migration job',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'jobId',
    description: 'Migration job ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved successfully',
    type: MigrationJobResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Migration job not found',
  })
  async getStatus(
    @Param('orgId') orgId: string,
    @Param('jobId') jobId: string,
  ): Promise<MigrationJobResponseDto> {
    const job = await this.migrationService.getJobStatus(jobId);

    // Verify organization
    if (job.organizationId !== orgId) {
      throw new BadRequestException('Job does not belong to this organization');
    }

    return new MigrationJobResponseDto(job);
  }

  /**
   * Rollback migration
   */
  @Delete('rollback/:jobId')
  @RequirePermissions(Permission.MIGRATIONS_DELETE)
  @ApiOperation({
    summary: 'Rollback migration',
    description: 'Rollback a completed migration by deleting all imported records',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiParam({
    name: 'jobId',
    description: 'Migration job ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Migration rolled back successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot rollback this migration',
  })
  @ApiResponse({
    status: 404,
    description: 'Migration job not found',
  })
  async rollback(
    @Param('orgId') orgId: string,
    @Param('jobId') jobId: string,
  ): Promise<{ message: string }> {
    const job = await this.migrationService.getJobStatus(jobId);

    // Verify organization
    if (job.organizationId !== orgId) {
      throw new BadRequestException('Job does not belong to this organization');
    }

    await this.migrationService.rollback(jobId);

    return {
      message: `Migration ${jobId} rolled back successfully`,
    };
  }
}
