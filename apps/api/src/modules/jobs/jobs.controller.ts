/**
 * Jobs Controller
 * API endpoints for manually triggering and monitoring background jobs
 */

import { Controller, Post, Get, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JobSchedulerService } from './job-scheduler.service';

@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobScheduler: JobSchedulerService) {}

  /**
   * Manually trigger daily insights for a specific organization
   */
  @Post('insights/trigger/:orgId')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Trigger daily insights for an organization',
    description: 'Manually triggers the daily insight generation job for a specific organization',
  })
  @ApiResponse({
    status: 202,
    description: 'Job has been queued successfully',
    schema: {
      example: {
        jobId: '123',
        message: 'Daily insight job scheduled for organization',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async triggerInsightsForOrg(@Param('orgId') orgId: string) {
    const result = await this.jobScheduler.triggerManualInsights(orgId);
    return {
      jobId: result.jobId,
      message: 'Daily insight job scheduled for organization',
      orgId,
    };
  }

  /**
   * Manually trigger daily insights for ALL organizations
   */
  @Post('insights/trigger-all')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Trigger daily insights for all organizations',
    description: 'Manually triggers the daily insight generation job for all active organizations',
  })
  @ApiResponse({
    status: 202,
    description: 'Jobs have been queued successfully',
    schema: {
      example: {
        jobsQueued: 5,
        organizations: [
          { orgId: 'org-1', orgName: 'Acme Corp', success: true, jobId: '123' },
          { orgId: 'org-2', orgName: 'Example Inc', success: true, jobId: '124' },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async triggerInsightsForAll() {
    const results = await this.jobScheduler.triggerAllInsights();
    const successful = results.filter(r => r.success);

    return {
      jobsQueued: successful.length,
      totalOrganizations: results.length,
      organizations: results,
    };
  }

  /**
   * Get queue statistics
   */
  @Get('insights/stats')
  @ApiOperation({
    summary: 'Get daily insights queue statistics',
    description: 'Returns statistics about the daily insights job queue',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics',
    schema: {
      example: {
        waiting: 2,
        active: 1,
        completed: 150,
        failed: 3,
        delayed: 0,
        total: 3,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getQueueStats() {
    return await this.jobScheduler.getQueueStats();
  }
}
