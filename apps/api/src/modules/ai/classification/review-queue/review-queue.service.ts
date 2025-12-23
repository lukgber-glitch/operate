/**
 * Review Queue Service
 * Manages transactions that need human review
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { ClassificationResult } from '@operate/ai';

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RECLASSIFIED = 'RECLASSIFIED',
}

export interface AddToQueueParams {
  orgId: string;
  transactionId: string;
  transactionDescription: string;
  amount: number;
  currency: string;
  classificationResult: ClassificationResult;
  priority: number;
}

export interface ReviewDecision {
  status: ReviewStatus;
  correctedCategory?: string;
  reviewNote?: string;
  reviewedBy: string;
}

export interface QueueFilters {
  status?: ReviewStatus;
  minPriority?: number;
  limit?: number;
  offset?: number;
}

@Injectable()
export class ReviewQueueService {
  private readonly logger = new Logger(ReviewQueueService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add transaction to review queue
   */
  async addToQueue(params: AddToQueueParams): Promise<void> {
    this.logger.debug(
      `Adding transaction ${params.transactionId} to review queue (priority: ${params.priority})`,
    );

    try {
      await this.prisma.transactionClassificationReview.create({
        data: {
          orgId: params.orgId,
          transactionId: params.transactionId,
          transactionDescription: params.transactionDescription,
          amount: params.amount,
          currency: params.currency,
          aiCategory: params.classificationResult.category,
          aiConfidence: params.classificationResult.confidence,
          aiReasoning: params.classificationResult.reasoning,
          taxRelevant: params.classificationResult.taxRelevant,
          suggestedDeductionCategory:
            params.classificationResult.suggestedDeductionCategory,
          flags: params.classificationResult.flags || [],
          priority: params.priority,
          status: ReviewStatus.PENDING,
        },
      });

      this.logger.log(
        `Transaction ${params.transactionId} added to review queue`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to add transaction ${params.transactionId} to queue`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get review queue items
   */
  async getQueue(orgId: string, filters?: QueueFilters) {
    const where: any = { orgId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.minPriority) {
      where.priority = { gte: filters.minPriority };
    }

    const items = await this.prisma.transactionClassificationReview.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    const total = await this.prisma.transactionClassificationReview.count({
      where,
    });

    return {
      items,
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    };
  }

  /**
   * Submit review decision
   */
  async submitReview(itemId: string, decision: ReviewDecision) {
    this.logger.log(`Processing review decision for item ${itemId}`);

    const item = await this.prisma.transactionClassificationReview.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException(`Review item ${itemId} not found`);
    }

    const updateData: any = {
      status: decision.status,
      reviewedBy: decision.reviewedBy,
      reviewedAt: new Date(),
      reviewNote: decision.reviewNote,
    };

    if (decision.correctedCategory) {
      updateData.correctedCategory = decision.correctedCategory;
    }

    const updated = await this.prisma.transactionClassificationReview.update({
      where: { id: itemId },
      data: updateData,
    });

    this.logger.log(
      `Review decision processed: ${decision.status} for item ${itemId}`,
    );

    return updated;
  }

  /**
   * Get review statistics
   */
  async getStatistics(orgId: string) {
    const [total, pending, approved, rejected, reclassified] =
      await Promise.all([
        this.prisma.transactionClassificationReview.count({ where: { orgId } }),
        this.prisma.transactionClassificationReview.count({
          where: { orgId, status: ReviewStatus.PENDING },
        }),
        this.prisma.transactionClassificationReview.count({
          where: { orgId, status: ReviewStatus.APPROVED },
        }),
        this.prisma.transactionClassificationReview.count({
          where: { orgId, status: ReviewStatus.REJECTED },
        }),
        this.prisma.transactionClassificationReview.count({
          where: { orgId, status: ReviewStatus.RECLASSIFIED },
        }),
      ]);

    const avgConfidence = await this.prisma.transactionClassificationReview.aggregate({
      where: { orgId },
      _avg: { aiConfidence: true },
    });

    return {
      total,
      pending,
      approved,
      rejected,
      reclassified,
      averageConfidence: avgConfidence._avg.aiConfidence || 0,
    };
  }

  /**
   * Delete old reviewed items
   */
  async cleanupOldReviews(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.transactionClassificationReview.deleteMany({
      where: {
        status: { not: ReviewStatus.PENDING },
        reviewedAt: { lt: cutoffDate },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old review items`);

    return result.count;
  }
}
