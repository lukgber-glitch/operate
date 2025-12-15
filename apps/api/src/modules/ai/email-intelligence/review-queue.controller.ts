import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ReviewQueueService } from './review-queue.service';
import { RequestWithUser } from '../../../common/types/request.types';

@ApiTags('Email Review Queue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('email-intelligence/reviews')
export class ReviewQueueController {
  constructor(private readonly reviewQueueService: ReviewQueueService) {}

  @Get()
  @ApiOperation({ summary: 'Get pending email reviews' })
  async getPendingReviews(
    @Request() req: RequestWithUser,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const orgId = req.user.orgId;
    return this.reviewQueueService.getPendingReviews(orgId, {
      type,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get review queue statistics' })
  async getStats(@Request() req: RequestWithUser) {
    const orgId = req.user.orgId;
    return this.reviewQueueService.getReviewStats(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific review' })
  async getReview(@Request() req: RequestWithUser, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.reviewQueueService.getReview(id, orgId);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a review and create entity' })
  async approveReview(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: { action: 'CREATE_CUSTOMER' | 'CREATE_VENDOR'; notes?: string },
  ) {
    const orgId = req.user.orgId;
    const userId = req.user.userId;
    return this.reviewQueueService.approveReview(
      id,
      orgId,
      userId,
      body.action,
      body.notes,
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a review' })
  async rejectReview(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ) {
    const orgId = req.user.orgId;
    const userId = req.user.userId;
    return this.reviewQueueService.rejectReview(id, orgId, userId, body.notes);
  }

  @Post(':id/block-domain')
  @ApiOperation({ summary: 'Block domain and reject review' })
  async blockDomain(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ) {
    const orgId = req.user.orgId;
    const userId = req.user.userId;
    return this.reviewQueueService.blockDomainAndReject(
      id,
      orgId,
      userId,
      body.notes,
    );
  }

  @Post('bulk/approve')
  @ApiOperation({ summary: 'Bulk approve reviews' })
  async bulkApprove(
    @Request() req: RequestWithUser,
    @Body() body: {
      reviewIds: string[];
      action: 'CREATE_CUSTOMER' | 'CREATE_VENDOR';
    },
  ) {
    const orgId = req.user.orgId;
    const userId = req.user.userId;
    return this.reviewQueueService.bulkApprove(
      body.reviewIds,
      orgId,
      userId,
      body.action,
    );
  }

  @Post('bulk/reject')
  @ApiOperation({ summary: 'Bulk reject reviews' })
  async bulkReject(
    @Request() req: RequestWithUser,
    @Body() body: { reviewIds: string[] },
  ) {
    const orgId = req.user.orgId;
    const userId = req.user.userId;
    return this.reviewQueueService.bulkReject(body.reviewIds, orgId, userId);
  }
}
