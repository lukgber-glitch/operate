/**
 * Classification Controller
 * API endpoints for transaction classification
 */

import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ClassificationService } from './classification.service';
import {
  ClassifyTransactionDto,
  ClassifyBatchDto,
} from './dto/classify-transaction.dto';
import {
  ClassificationResultDto,
  ClassificationResultWithActionDto,
  BatchClassificationResultDto,
} from './dto/classification-result.dto';
import { Request } from 'express';

@ApiTags('AI Classification')
@Controller('ai/classify')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClassificationController {
  private readonly logger = new Logger(ClassificationController.name);

  constructor(private readonly classificationService: ClassificationService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Classify a single transaction with auto-approval' })
  @ApiResponse({
    status: 200,
    description: 'Transaction classified successfully',
    type: ClassificationResultWithActionDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Classification failed' })
  async classifyTransaction(
    @Req() req: Request,
    @Body() dto: ClassifyTransactionDto,
  ): Promise<ClassificationResultWithActionDto> {
    this.logger.log(`Classify request: ${dto.description}`);

    // Get orgId from JWT token
    const orgId = (req as any).user?.orgId;
    if (!orgId) {
      throw new BadRequestException('Organisation ID not found in token');
    }

    const result = await this.classificationService.classifyWithAutoApproval(
      orgId,
      dto,
    );

    // Log the action taken
    if (result.autoApproved) {
      this.logger.log(
        `Transaction auto-approved (confidence: ${result.confidence})`,
      );
    } else if (result.addedToReviewQueue) {
      this.logger.warn(
        `Low confidence classification (${result.confidence}) - added to review queue`,
      );
    }

    return result;
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Classify multiple transactions' })
  @ApiResponse({
    status: 200,
    description: 'Transactions classified successfully',
    type: BatchClassificationResultDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Classification failed' })
  async classifyBatch(
    @Body() dto: ClassifyBatchDto,
  ): Promise<BatchClassificationResultDto> {
    this.logger.log(`Batch classify request: ${dto.transactions.length} transactions`);

    const results = await this.classificationService.classifyBatch(
      dto.transactions,
    );

    const needsReview = results.filter((r) =>
      this.classificationService.needsReview(r),
    ).length;

    this.logger.log(
      `Batch classification complete: ${results.length} total, ${needsReview} need review`,
    );

    return {
      results,
      total: results.length,
      successful: results.length,
      needsReview,
    };
  }
}
