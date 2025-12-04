import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NexusConfigurationService } from '../services/nexus-configuration.service';
import {
  CreateNexusDto,
  UpdateNexusDto,
  NexusResponseDto,
  StateThresholdDto,
  NexusAlertDto,
} from '../dto/nexus.dto';

/**
 * Nexus Configuration Controller
 * Manages multi-state nexus registrations and economic nexus thresholds
 */
@ApiTags('Nexus Configuration')
@Controller({ path: 'nexus', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NexusController {
  constructor(
    private readonly nexusConfigurationService: NexusConfigurationService,
  ) {}

  /**
   * Get all nexus configurations for an organization
   */
  @Get('states')
  @ApiOperation({
    summary: 'Get all nexus states',
    description: 'Retrieves all state nexus configurations for an organization, including active and inactive registrations.',
  })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: 'Organization ID',
    example: 'org_123',
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    description: 'Filter for active nexus states only',
    type: Boolean,
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of nexus configurations',
    type: [NexusResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getAllNexusStates(
    @Query('orgId') orgId: string,
    @Query('activeOnly') activeOnly?: boolean,
  ): Promise<NexusResponseDto[]> {
    if (activeOnly === true) {
      return this.nexusConfigurationService.getActiveNexusStates(orgId);
    }
    return this.nexusConfigurationService.getAllNexusStates(orgId);
  }

  /**
   * Add new state nexus registration
   */
  @Post('states')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add state nexus',
    description: 'Registers a new state nexus for the organization. Automatically applies state-specific economic nexus thresholds if not provided.',
  })
  @ApiResponse({
    status: 201,
    description: 'Nexus created successfully',
    type: NexusResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid state code or request data',
  })
  @ApiResponse({
    status: 409,
    description: 'Nexus already exists for this state',
  })
  async addStateNexus(
    @Body() dto: CreateNexusDto,
  ): Promise<NexusResponseDto> {
    return this.nexusConfigurationService.addStateNexus(dto);
  }

  /**
   * Update existing nexus configuration
   */
  @Patch('states/:stateCode')
  @ApiOperation({
    summary: 'Update state nexus',
    description: 'Updates an existing nexus configuration for a state. Can modify thresholds, status, registration ID, etc.',
  })
  @ApiParam({
    name: 'stateCode',
    description: 'Two-letter state code',
    example: 'CA',
  })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: 'Organization ID',
    example: 'org_123',
  })
  @ApiResponse({
    status: 200,
    description: 'Nexus updated successfully',
    type: NexusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Nexus not found for this state',
  })
  async updateStateNexus(
    @Param('stateCode') stateCode: string,
    @Query('orgId') orgId: string,
    @Body() dto: UpdateNexusDto,
  ): Promise<NexusResponseDto> {
    return this.nexusConfigurationService.updateStateNexus(orgId, stateCode, dto);
  }

  /**
   * Remove/deactivate state nexus
   */
  @Delete('states/:stateCode')
  @ApiOperation({
    summary: 'Remove state nexus',
    description: 'Deactivates a state nexus registration. Sets status to INACTIVE and records end date.',
  })
  @ApiParam({
    name: 'stateCode',
    description: 'Two-letter state code',
    example: 'CA',
  })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: 'Organization ID',
    example: 'org_123',
  })
  @ApiResponse({
    status: 200,
    description: 'Nexus deactivated successfully',
    type: NexusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Nexus not found for this state',
  })
  async removeStateNexus(
    @Param('stateCode') stateCode: string,
    @Query('orgId') orgId: string,
  ): Promise<NexusResponseDto> {
    return this.nexusConfigurationService.removeStateNexus(orgId, stateCode);
  }

  /**
   * Get economic nexus thresholds for all states
   */
  @Get('thresholds')
  @ApiOperation({
    summary: 'Get economic nexus thresholds',
    description: 'Retrieves economic nexus thresholds for all US states based on South Dakota v. Wayfair (2018) and state-specific rules.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of state thresholds',
    type: [StateThresholdDto],
  })
  async getEconomicNexusThresholds(): Promise<StateThresholdDto[]> {
    return this.nexusConfigurationService.getEconomicNexusThresholds();
  }

  /**
   * Get threshold information for a specific state
   */
  @Get('thresholds/:stateCode')
  @ApiOperation({
    summary: 'Get state threshold info',
    description: 'Retrieves economic nexus threshold information for a specific state.',
  })
  @ApiParam({
    name: 'stateCode',
    description: 'Two-letter state code',
    example: 'CA',
  })
  @ApiResponse({
    status: 200,
    description: 'State threshold information',
    type: StateThresholdDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid state code',
  })
  async getStateThresholdInfo(
    @Param('stateCode') stateCode: string,
  ): Promise<StateThresholdDto> {
    return this.nexusConfigurationService.getStateThresholdInfo(stateCode);
  }

  /**
   * Get threshold alerts
   */
  @Get('alerts')
  @ApiOperation({
    summary: 'Get nexus threshold alerts',
    description: 'Retrieves alerts for states where economic nexus thresholds are approaching (80%) or exceeded (100%). Helps businesses stay compliant with registration requirements.',
  })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: 'Organization ID',
    example: 'org_123',
  })
  @ApiResponse({
    status: 200,
    description: 'List of threshold alerts',
    type: [NexusAlertDto],
  })
  async getThresholdAlerts(
    @Query('orgId') orgId: string,
  ): Promise<NexusAlertDto[]> {
    return this.nexusConfigurationService.getThresholdAlerts(orgId);
  }

  /**
   * Check if should register for nexus in a state
   */
  @Get('check/:stateCode')
  @ApiOperation({
    summary: 'Check nexus registration requirement',
    description: 'Checks if organization should register for nexus in a specific state based on current sales and transaction volume.',
  })
  @ApiParam({
    name: 'stateCode',
    description: 'Two-letter state code',
    example: 'TX',
  })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: 'Organization ID',
    example: 'org_123',
  })
  @ApiResponse({
    status: 200,
    description: 'Nexus registration check result',
    schema: {
      type: 'object',
      properties: {
        shouldRegister: {
          type: 'boolean',
          example: true,
        },
        reason: {
          type: 'string',
          example: 'Economic nexus threshold exceeded',
        },
        currentSales: {
          type: 'number',
          example: 525000,
        },
        currentTransactions: {
          type: 'number',
          example: 250,
        },
        threshold: {
          type: 'object',
          description: 'State threshold information',
        },
      },
    },
  })
  async checkNexusRegistration(
    @Param('stateCode') stateCode: string,
    @Query('orgId') orgId: string,
  ) {
    return this.nexusConfigurationService.shouldRegisterForNexus(orgId, stateCode);
  }

  /**
   * Track sales for nexus monitoring
   * This endpoint can be called after each transaction to update nexus tracking
   */
  @Post('track-sales')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Track sales for nexus',
    description: 'Records a sale for nexus threshold tracking. Should be called after each completed transaction to monitor economic nexus thresholds.',
  })
  @ApiResponse({
    status: 204,
    description: 'Sale tracked successfully',
  })
  async trackSales(
    @Body()
    dto: {
      orgId: string;
      stateCode: string;
      saleAmount: number;
    },
  ): Promise<void> {
    await this.nexusConfigurationService.trackSalesForNexus(
      dto.orgId,
      dto.stateCode,
      dto.saleAmount,
    );
  }

  /**
   * Reset year-to-date counters
   * Typically called at the start of a new calendar year
   */
  @Post('reset-ytd/:orgId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reset YTD counters',
    description: 'Resets year-to-date sales and transaction counters for all nexus states. Typically called at the start of a new calendar year.',
  })
  @ApiParam({
    name: 'orgId',
    description: 'Organization ID',
    example: 'org_123',
  })
  @ApiResponse({
    status: 204,
    description: 'Counters reset successfully',
  })
  async resetYearToDateCounters(
    @Param('orgId') orgId: string,
  ): Promise<void> {
    await this.nexusConfigurationService.resetYearToDateCounters(orgId);
  }
}
