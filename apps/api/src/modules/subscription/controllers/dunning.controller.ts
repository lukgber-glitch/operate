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
  ApiQuery,
} from '@nestjs/swagger';
import { DunningService } from '../services/dunning.service';
import {
  DunningStateResponseDto,
  DunningListResponseDto,
  DunningQueryDto,
  DunningStatsDto,
  ManualRetryDto,
  ManualResolveDto,
  ManualSuspendDto,
  mapDunningStateToDto,
} from '../dto/dunning.dto';
import { DunningStatus } from '@prisma/client';

/**
 * Dunning Controller
 * Admin endpoints for managing payment failure recovery process
 *
 * Endpoints:
 * - GET /admin/dunning - List all dunning states
 * - GET /admin/dunning/stats - Get dunning statistics
 * - GET /admin/dunning/:id - Get specific dunning state
 * - POST /admin/dunning/:id/retry - Manually retry payment
 * - POST /admin/dunning/:id/resolve - Manually resolve dunning
 * - POST /admin/dunning/:id/suspend - Manually suspend account
 *
 * @requires Admin role
 */
@ApiTags('Admin - Dunning')
@ApiBearerAuth()
@Controller('admin/dunning')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('ADMIN', 'OWNER')
export class DunningController {
  constructor(private readonly dunningService: DunningService) {}

  /**
   * List all dunning states
   * Filter by state, with pagination
   */
  @Get()
  @ApiOperation({
    summary: 'List dunning states',
    description: 'Get all accounts in dunning process with optional filtering',
  })
  @ApiQuery({ name: 'state', required: false, enum: DunningStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of dunning states',
    type: DunningListResponseDto,
  })
  async listDunning(
    @Query() query: DunningQueryDto,
  ): Promise<DunningListResponseDto> {
    const { state, page = 1, limit = 20 } = query;

    // Get dunning list
    const dunningStates = await this.dunningService.getDunningList(state);

    // Map to DTOs
    const items = dunningStates.map(mapDunningStateToDto);

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    // Calculate count by state
    const countByState = dunningStates.reduce((acc, state) => {
      acc[state.state] = (acc[state.state] || 0) + 1;
      return acc;
    }, {} as Record<DunningStatus, number>);

    return {
      total: items.length,
      countByState,
      items: paginatedItems,
    };
  }

  /**
   * Get dunning statistics
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get dunning statistics',
    description: 'Get overview statistics for dunning process',
  })
  @ApiResponse({
    status: 200,
    description: 'Dunning statistics',
    type: DunningStatsDto,
  })
  async getDunningStats(): Promise<DunningStatsDto> {
    const allStates = await this.dunningService.getDunningList();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate statistics
    const totalActive = allStates.filter(
      (s) => s.state !== DunningStatus.RESOLVED && s.state !== DunningStatus.SUSPENDED,
    ).length;

    const resolvedThisMonth = allStates.filter(
      (s) =>
        s.state === DunningStatus.RESOLVED &&
        s.resolvedAt &&
        new Date(s.resolvedAt) >= startOfMonth,
    ).length;

    const suspendedThisMonth = allStates.filter(
      (s) =>
        s.state === DunningStatus.SUSPENDED &&
        s.updatedAt &&
        new Date(s.updatedAt) >= startOfMonth,
    ).length;

    // Calculate average days to resolution
    const resolvedStates = allStates.filter(
      (s) => s.state === DunningStatus.RESOLVED && s.resolvedAt,
    );

    const avgDaysToResolution = resolvedStates.length
      ? resolvedStates.reduce((sum, state) => {
          const days = Math.floor(
            (new Date(state.resolvedAt!).getTime() - new Date(state.failedAt).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          return sum + days;
        }, 0) / resolvedStates.length
      : 0;

    // Calculate recovery rate
    const totalResolved = allStates.filter((s) => s.state === DunningStatus.RESOLVED).length;
    const totalProcessed = allStates.length;
    const recoveryRate = totalProcessed > 0 ? (totalResolved / totalProcessed) * 100 : 0;

    // Count by state
    const countByState = allStates.reduce((acc, state) => {
      acc[state.state] = (acc[state.state] || 0) + 1;
      return acc;
    }, {} as Record<DunningStatus, number>);

    // Estimated revenue at risk (placeholder - would need pricing data)
    const revenueAtRisk = totalActive * 100; // Placeholder calculation

    return {
      totalActive,
      resolvedThisMonth,
      suspendedThisMonth,
      avgDaysToResolution: Math.round(avgDaysToResolution * 10) / 10,
      recoveryRate: Math.round(recoveryRate * 10) / 10,
      countByState,
      revenueAtRisk,
    };
  }

  /**
   * Get specific dunning state
   */
  @Get(':subscriptionId')
  @ApiOperation({
    summary: 'Get dunning state',
    description: 'Get dunning state for a specific subscription',
  })
  @ApiParam({ name: 'subscriptionId', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Dunning state details',
    type: DunningStateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Dunning state not found' })
  async getDunningState(
    @Param('subscriptionId') subscriptionId: string,
  ): Promise<DunningStateResponseDto> {
    const state = await this.dunningService.getDunningState(subscriptionId);

    if (!state) {
      throw new Error(`Dunning state not found for subscription ${subscriptionId}`);
    }

    return mapDunningStateToDto(state);
  }

  /**
   * Manually retry payment
   */
  @Post(':subscriptionId/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually retry payment',
    description: 'Trigger manual payment retry for a subscription in dunning',
  })
  @ApiParam({ name: 'subscriptionId', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment retry initiated',
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async retryPayment(
    @Param('subscriptionId') subscriptionId: string,
  ): Promise<{ success: boolean; message: string }> {
    const success = await this.dunningService.retryPayment(subscriptionId);

    return {
      success,
      message: success
        ? 'Payment retry successful, dunning resolved'
        : 'Payment retry failed, will continue dunning process',
    };
  }

  /**
   * Manually resolve dunning
   */
  @Post(':subscriptionId/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually resolve dunning',
    description: 'Admin override to resolve dunning without payment',
  })
  @ApiParam({ name: 'subscriptionId', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Dunning resolved',
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async resolveDunning(
    @Param('subscriptionId') subscriptionId: string,
    @Body() dto: ManualResolveDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.dunningService.manualResolve(subscriptionId, dto.adminUserId);

    return {
      success: true,
      message: 'Dunning manually resolved, account reactivated',
    };
  }

  /**
   * Manually suspend account
   */
  @Post(':subscriptionId/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually suspend account',
    description: 'Admin override to immediately suspend account',
  })
  @ApiParam({ name: 'subscriptionId', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Account suspended',
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async suspendAccount(
    @Param('subscriptionId') subscriptionId: string,
    @Body() dto: ManualSuspendDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.dunningService.manualSuspend(subscriptionId, dto.adminUserId);

    return {
      success: true,
      message: 'Account manually suspended',
    };
  }
}
