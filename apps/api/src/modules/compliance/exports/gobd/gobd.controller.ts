import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { GobdService } from './gobd.service';
import { CreateGobdExportDto } from './dto/create-gobd-export.dto';
import {
  GobdExportResponseDto,
  GobdExportListResponseDto,
} from './dto/gobd-export-response.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';

/**
 * GoBD Export Controller
 * Handles HTTP requests for GoBD-compliant export generation
 */
@ApiTags('GoBD Exports')
@ApiBearerAuth()
@Controller('compliance/exports/gobd')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GobdController {
  private readonly logger = new Logger(GobdController.name);

  constructor(private readonly gobdService: GobdService) {}

  /**
   * Create new GoBD export
   */
  @Post()
  @Roles('ADMIN', 'ACCOUNTANT')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Create GoBD export',
    description:
      'Initiates a new GoBD-compliant export for tax audit purposes. The export is generated asynchronously.',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Export creation initiated',
    type: GobdExportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request parameters',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Organization not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async createExport(
    @Body() dto: CreateGobdExportDto,
    @CurrentUser() user: any,
  ): Promise<GobdExportResponseDto> {
    this.logger.log(
      `User ${user.id} creating GoBD export for org ${dto.orgId}`,
    );
    return this.gobdService.createExport(dto);
  }

  /**
   * Get export status
   */
  @Get(':exportId')
  @Roles('ADMIN', 'ACCOUNTANT', 'EMPLOYEE')
  @ApiOperation({
    summary: 'Get export status',
    description: 'Retrieves the current status and metadata of a GoBD export',
  })
  @ApiParam({
    name: 'exportId',
    description: 'Export ID',
    example: 'gobd_1234567890_abc123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export status retrieved',
    type: GobdExportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Export not found',
  })
  async getExportStatus(
    @Param('exportId') exportId: string,
  ): Promise<GobdExportResponseDto> {
    return this.gobdService.getExportStatus(exportId);
  }

  /**
   * Download export
   */
  @Get(':exportId/download')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Download export',
    description:
      'Downloads the GoBD export archive (ZIP file). Export must be in READY or COMPLETED status.',
  })
  @ApiParam({
    name: 'exportId',
    description: 'Export ID',
    example: 'gobd_1234567890_abc123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export file',
    content: {
      'application/zip': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Export not ready for download',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Export not found or file missing',
  })
  async downloadExport(@Param('exportId') exportId: string) {
    return this.gobdService.downloadExport(exportId);
  }

  /**
   * List exports for organization
   */
  @Get()
  @Roles('ADMIN', 'ACCOUNTANT', 'EMPLOYEE')
  @ApiOperation({
    summary: 'List exports',
    description: 'Lists all GoBD exports for the specified organization',
  })
  @ApiQuery({
    name: 'orgId',
    description: 'Organization ID',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of results',
    required: false,
    example: 50,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export list retrieved',
    type: GobdExportListResponseDto,
  })
  async listExports(
    @Query('orgId') orgId: string,
    @Query('limit') limit?: number,
  ): Promise<GobdExportListResponseDto> {
    return this.gobdService.listExports(orgId, limit ? parseInt(String(limit), 10) : undefined);
  }

  /**
   * Delete export
   */
  @Delete(':exportId')
  @Roles('ADMIN', 'ACCOUNTANT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete export',
    description:
      'Deletes a GoBD export and its associated file. This is a soft delete.',
  })
  @ApiParam({
    name: 'exportId',
    description: 'Export ID',
    example: 'gobd_1234567890_abc123',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Export deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Export not found',
  })
  async deleteExport(@Param('exportId') exportId: string): Promise<void> {
    return this.gobdService.deleteExport(exportId);
  }
}
