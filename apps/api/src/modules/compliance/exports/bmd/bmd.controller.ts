import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  StreamableFile,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { BmdExportService } from './bmd-export.service';
import { CreateBmdExportDto } from './dto/create-bmd-export.dto';
import {
  BmdExportResponseDto,
  BmdExportListResponseDto,
} from './dto/bmd-export-response.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';

/**
 * BMD Export Controller
 * Handles endpoints for Austrian BMD accounting software exports
 */
@ApiTags('Compliance - BMD Exports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('compliance/exports/bmd')
export class BmdController {
  constructor(private readonly bmdExportService: BmdExportService) {}

  /**
   * Create new BMD export
   */
  @Post()
  @Roles('ADMIN', 'ACCOUNTANT', 'TAX_ADVISOR')
  @ApiOperation({
    summary: 'Create BMD export',
    description:
      'Create a new export for Austrian BMD accounting software. ' +
      'Supports booking journal, chart of accounts, customers, suppliers, and tax accounts.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Export created successfully',
    type: BmdExportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async createExport(
    @Body() dto: CreateBmdExportDto,
  ): Promise<BmdExportResponseDto> {
    return this.bmdExportService.createExport(dto);
  }

  /**
   * Get export status
   */
  @Get(':exportId')
  @Roles('ADMIN', 'ACCOUNTANT', 'TAX_ADVISOR')
  @ApiOperation({
    summary: 'Get BMD export status',
    description: 'Retrieve the current status and details of a BMD export.',
  })
  @ApiParam({
    name: 'exportId',
    description: 'Export ID',
    example: 'bmd_1234567890_abc123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export status retrieved',
    type: BmdExportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Export not found',
  })
  async getExportStatus(
    @Param('exportId') exportId: string,
  ): Promise<BmdExportResponseDto> {
    return this.bmdExportService.getExportStatus(exportId);
  }

  /**
   * Download export
   */
  @Get(':exportId/download')
  @Roles('ADMIN', 'ACCOUNTANT', 'TAX_ADVISOR')
  @ApiOperation({
    summary: 'Download BMD export',
    description:
      'Download the completed BMD export as a ZIP file containing CSV files.',
  })
  @ApiParam({
    name: 'exportId',
    description: 'Export ID',
    example: 'bmd_1234567890_abc123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export file downloaded',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Export not found or not ready',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Export is not ready for download',
  })
  async downloadExport(
    @Param('exportId') exportId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return this.bmdExportService.downloadExport(exportId);
  }

  /**
   * List exports for organization
   */
  @Get('organization/:orgId')
  @Roles('ADMIN', 'ACCOUNTANT', 'TAX_ADVISOR')
  @ApiOperation({
    summary: 'List BMD exports',
    description: 'List all BMD exports for an organization.',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of exports to return',
    example: 50,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exports list retrieved',
    type: BmdExportListResponseDto,
  })
  async listExports(
    @Param('orgId') orgId: string,
    @Query('limit') limit?: number,
  ): Promise<BmdExportListResponseDto> {
    return this.bmdExportService.listExports(orgId, limit);
  }

  /**
   * Delete export
   */
  @Delete(':exportId')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Delete BMD export',
    description:
      'Delete a BMD export and its associated files. This action cannot be undone.',
  })
  @ApiParam({
    name: 'exportId',
    description: 'Export ID',
    example: 'bmd_1234567890_abc123',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Export deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Export not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async deleteExport(@Param('exportId') exportId: string): Promise<void> {
    return this.bmdExportService.deleteExport(exportId);
  }
}
