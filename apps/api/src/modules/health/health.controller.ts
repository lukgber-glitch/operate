import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../../common/decorators/public.decorator';
import * as Sentry from '@sentry/nestjs';

@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: { type: 'object' },
        error: { type: 'object' },
        details: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service is unhealthy',
  })
  check(): Promise<HealthCheckResult> {
    // Disk threshold: 50% by default, 90% in CI (builds consume disk space)
    const diskThreshold = parseFloat(process.env.HEALTH_DISK_THRESHOLD || '0.5');

    return this.health.check([
      // Memory check: heap should not exceed 600MB
      () => this.memory.checkHeap('memory_heap', 600 * 1024 * 1024),

      // Memory check: RSS should not exceed 800MB
      // Note: NestJS app with multiple modules typically uses 400-500MB
      () => this.memory.checkRSS('memory_rss', 800 * 1024 * 1024),

      // Disk check: configured threshold of disk space should be available
      () =>
        this.disk.checkStorage('disk', {
          path: process.platform === 'win32' ? 'C:\\' : '/',
          thresholdPercent: diskThreshold,
        }),
    ]);
  }

  @Get('sentry-test')
  @Public()
  @ApiOperation({ summary: 'Test Sentry error tracking' })
  @ApiResponse({
    status: 500,
    description: 'Throws a test error to verify Sentry integration',
  })
  testSentry(): void {
    // Add breadcrumb for context
    Sentry.addBreadcrumb({
      category: 'test',
      message: 'Testing Sentry integration',
      level: 'info',
      data: {
        endpoint: '/health/sentry-test',
        timestamp: new Date().toISOString(),
      },
    });

    // Set custom tag
    Sentry.setTag('test', 'sentry-integration');

    // Throw test error
    throw new HttpException(
      'This is a test error to verify Sentry integration is working correctly',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
