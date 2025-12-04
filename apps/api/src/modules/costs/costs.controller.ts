import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CostsService } from './costs.service';
import { CreateCostEntryDto } from './dto/create-cost-entry.dto';
import { CostQueryDto } from './dto/cost-query.dto';
import { CostEntryResponseDto } from './dto/cost-entry-response.dto';
import { CostSummaryDto } from './dto/cost-summary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/rbac/rbac.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permission } from '../auth/rbac/permissions';

/**
 * Costs Controller
 * Handles cost tracking and aggregation endpoints
 */
@ApiTags('Costs')
@Controller('organisations/:orgId/costs')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class CostsController {
  constructor(private costsService: CostsService) {}

  /**
   * Record a new cost entry
   */
  @Post()
  @RequirePermissions(Permission.COSTS_CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record cost entry',
    description: 'Create a new cost tracking entry',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 201,
    description: 'Cost entry created successfully',
    type: CostEntryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async create(
    @Param('orgId') orgId: string,
    @Body() createCostEntryDto: CreateCostEntryDto,
  ): Promise<CostEntryResponseDto> {
    return this.costsService.create(orgId, createCostEntryDto);
  }

  /**
   * List cost entries with filters
   */
  @Get()
  @RequirePermissions(Permission.COSTS_READ)
  @ApiOperation({
    summary: 'List cost entries',
    description: 'Get paginated list of cost entries with filters',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Cost entries retrieved successfully',
    type: [CostEntryResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findAll(
    @Param('orgId') orgId: string,
    @Query() query: CostQueryDto,
  ) {
    return this.costsService.findAll(orgId, query);
  }

  /**
   * Get aggregated cost summary
   */
  @Get('summary')
  @RequirePermissions(Permission.COSTS_READ)
  @ApiOperation({
    summary: 'Get cost summary',
    description:
      'Get aggregated cost summary with breakdowns by category and automation',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Cost summary retrieved successfully',
    type: CostSummaryDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async getSummary(
    @Param('orgId') orgId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<CostSummaryDto> {
    return this.costsService.getSummary(orgId, startDate, endDate);
  }

  /**
   * Get costs breakdown by category
   */
  @Get('by-category')
  @RequirePermissions(Permission.COSTS_READ)
  @ApiOperation({
    summary: 'Get costs by category',
    description: 'Get cost breakdown grouped by category',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Cost breakdown retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async getCostsByCategory(
    @Param('orgId') orgId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.costsService.getCostsByCategory(orgId, startDate, endDate);
  }

  /**
   * Get costs breakdown by automation
   */
  @Get('by-automation')
  @RequirePermissions(Permission.COSTS_READ)
  @ApiOperation({
    summary: 'Get costs by automation',
    description: 'Get cost breakdown grouped by automation ID',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organisation ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Cost breakdown retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async getCostsByAutomation(
    @Param('orgId') orgId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.costsService.getCostsByAutomation(orgId, startDate, endDate);
  }
}
