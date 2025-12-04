/**
 * Search Controller
 * REST API endpoints for global search functionality
 */

import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Req,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { SearchService } from './search.service';
import { SearchQueryDto, SearchResponseDto, ReindexResponseDto } from './dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    orgId: string;
    role: string;
  };
}

@ApiTags('Search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(
    private readonly searchService: SearchService,
    @InjectQueue('search-reindex') private readonly reindexQueue: Queue,
  ) {}

  /**
   * Global search endpoint
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
  @ApiOperation({
    summary: 'Search across all entities',
    description: 'Perform a global search across invoices, expenses, clients, reports, and employees',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query',
    required: true,
    example: 'invoice 2024',
  })
  @ApiQuery({
    name: 'types',
    description: 'Entity types to search (comma-separated)',
    required: false,
    example: 'invoice,expense',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of results',
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Offset for pagination',
    required: false,
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results returned successfully',
    type: SearchResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid search query' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async search(
    @Query() queryDto: SearchQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SearchResponseDto> {
    try {
      const { orgId, userId } = req.user;

      // Validate query
      if (!queryDto.q || queryDto.q.trim().length === 0) {
        throw new BadRequestException('Search query cannot be empty');
      }

      if (queryDto.q.length > 400) {
        throw new BadRequestException('Search query too long (max 400 characters)');
      }

      this.logger.log(
        `Search query from user ${userId}: "${queryDto.q}" types=${queryDto.types?.join(',') || 'all'}`,
      );

      const results = await this.searchService.search(orgId, queryDto);

      this.logger.debug(
        `Search completed: ${results.total} results in ${results.executionTime}ms`,
      );

      return results;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(`Search failed: ${error.message}`, error.stack);
      throw new BadRequestException('Search failed');
    }
  }

  /**
   * Trigger full reindex (admin only)
   */
  @Post('reindex')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Reindex all entities',
    description: 'Trigger a full reindex of all searchable entities (admin only)',
  })
  @ApiResponse({
    status: 202,
    description: 'Reindex job started successfully',
    type: ReindexResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async reindex(
    @Req() req: AuthenticatedRequest,
  ): Promise<ReindexResponseDto> {
    try {
      const { orgId, userId, role } = req.user;

      // Check if user is admin or owner
      if (!['ADMIN', 'OWNER'].includes(role)) {
        throw new ForbiddenException('Only admins can trigger reindexing');
      }

      this.logger.log(`Reindex triggered by user ${userId} for org ${orgId}`);

      // Add job to queue
      const job = await this.reindexQueue.add('reindex-all', {
        orgId,
        userId,
        timestamp: new Date().toISOString(),
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      });

      return {
        jobId: job.id.toString(),
        message: 'Reindex job started successfully',
        estimatedTime: 120, // Estimate 2 minutes
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(`Reindex failed: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to start reindex job');
    }
  }

  /**
   * Get search statistics
   */
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get search index statistics',
    description: 'Get statistics about the search index including entity counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics returned successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(@Req() req: AuthenticatedRequest) {
    try {
      const { userId } = req.user;

      this.logger.debug(`Stats requested by user ${userId}`);

      const stats = await this.searchService.getStats();

      return stats;
    } catch (error) {
      this.logger.error(`Failed to get stats: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to get statistics');
    }
  }

  /**
   * Get popular search queries
   */
  @Get('analytics/popular')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get popular search queries',
    description: 'Get the most popular search queries for analytics',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of queries to return',
    required: false,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Popular queries returned successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPopularQueries(
    @Query('limit') limit?: number,
    @Req() req?: AuthenticatedRequest,
  ) {
    try {
      const { userId } = req.user;

      this.logger.debug(`Popular queries requested by user ${userId}`);

      const queries = await this.searchService.getPopularQueries(limit || 10);

      return {
        queries,
        total: queries.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get popular queries: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to get popular queries');
    }
  }

  /**
   * Health check for search service
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if search service is operational',
  })
  @ApiResponse({
    status: 200,
    description: 'Search service is healthy',
  })
  async healthCheck() {
    try {
      const stats = await this.searchService.getStats();

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        indexStats: {
          totalEntities: stats.totalEntities,
          lastUpdate: stats.lastIndexUpdate,
        },
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}
