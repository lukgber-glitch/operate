import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PerformanceService } from './performance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/rbac/rbac.guard';

/**
 * Performance Metrics Controller
 * Provides endpoints for monitoring application performance
 *
 * Access: Admin only
 */
@ApiTags('Performance')
@ApiBearerAuth('JWT-auth')
@Controller('admin/performance')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  /**
   * Get overall performance metrics
   */
  @Get('metrics')
  @ApiOperation({ summary: 'Get performance metrics' })
  async getMetrics() {
    return this.performanceService.getPerformanceMetrics();
  }

  /**
   * Get cache statistics
   */
  @Get('cache')
  @ApiOperation({ summary: 'Get cache statistics' })
  async getCacheStats() {
    return this.performanceService.getCacheStatistics();
  }

  /**
   * Get database statistics
   */
  @Get('database')
  @ApiOperation({ summary: 'Get database statistics' })
  async getDatabaseStats() {
    return this.performanceService.getDatabaseStatistics();
  }

  /**
   * Get system resource usage
   */
  @Get('system')
  @ApiOperation({ summary: 'Get system resource usage' })
  async getSystemStats() {
    return this.performanceService.getSystemStatistics();
  }

  /**
   * Get API response time statistics
   */
  @Get('api')
  @ApiOperation({ summary: 'Get API response time statistics' })
  async getApiStats() {
    return this.performanceService.getApiStatistics();
  }

  /**
   * Get health check
   */
  @Get('health')
  @ApiOperation({ summary: 'Get health check status' })
  async getHealth() {
    return this.performanceService.getHealthCheck();
  }
}
