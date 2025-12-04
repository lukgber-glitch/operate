/**
 * Review Queue Controller
 * API endpoints for managing classification review queue
 */

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
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { ReviewQueueService, ReviewStatus } from './review-queue.service';

class SubmitReviewDto {
  status: ReviewStatus;
  correctedCategory?: string;
  reviewNote?: string;
}

@ApiTags('AI Review Queue')
@Controller('ai/review-queue')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReviewQueueController {
  private readonly logger = new Logger(ReviewQueueController.name);

  constructor(private readonly reviewQueueService: ReviewQueueService) {}

  @Get()
  @ApiOperation({ summary: 'Get review queue items' })
  @ApiQuery({ name: 'status', required: false, enum: ReviewStatus })
  @ApiQuery({ name: 'minPriority', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Review queue items retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getQueue(
    @CurrentUser() user: any,
    @Query('status') status?: ReviewStatus,
    @Query('minPriority') minPriority?: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const orgId = user.currentOrgId || user.orgId;

    this.logger.log(`Get review queue for org ${orgId}`);

    return this.reviewQueueService.getQueue(orgId, {
      status,
      minPriority: minPriority ? Number(minPriority) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get review queue statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatistics(@CurrentUser() user: any) {
    const orgId = user.currentOrgId || user.orgId;

    this.logger.log(`Get review queue statistics for org ${orgId}`);

    return this.reviewQueueService.getStatistics(orgId);
  }

  @Post(':id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit review decision' })
  @ApiResponse({ status: 200, description: 'Review decision submitted' })
  @ApiResponse({ status: 404, description: 'Review item not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitReview(
    @Param('id') id: string,
    @Body() dto: SubmitReviewDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Submit review for item ${id} by user ${user.id}`);

    return this.reviewQueueService.submitReview(id, {
      status: dto.status,
      correctedCategory: dto.correctedCategory,
      reviewNote: dto.reviewNote,
      reviewedBy: user.id,
    });
  }
}
