import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface QueueForReviewInput {
  emailId: string;
  reviewType: 'LOW_CONFIDENCE' | 'PATTERN_MATCH' | 'DOMAIN_SUSPECT' | 'MANUAL_CHECK';
  reviewReason: string;
  senderEmail: string;
  senderDomain: string;
  extractedCompany?: string;
  extractedContacts?: any;
  classification?: string;
  confidence: number;
  suggestedAction: 'CREATE_CUSTOMER' | 'CREATE_VENDOR' | 'SKIP' | 'BLOCK_DOMAIN';
}

export interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  blocked: number;
  byType: Record<string, number>;
}

@Injectable()
export class ReviewQueueService {
  private readonly logger = new Logger(ReviewQueueService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add email to review queue
   */
  async queueForReview(orgId: string, input: QueueForReviewInput) {
    const review = await this.prisma.emailReviewQueue.create({
      data: {
        orgId,
        emailId: input.emailId,
        reviewType: input.reviewType,
        reviewReason: input.reviewReason,
        senderEmail: input.senderEmail,
        senderDomain: input.senderDomain,
        extractedCompany: input.extractedCompany,
        extractedContacts: input.extractedContacts || {},
        classification: input.classification,
        confidence: input.confidence,
        suggestedAction: input.suggestedAction,
        status: 'PENDING',
      },
    });

    this.logger.log(`Queued email ${input.emailId} for review: ${input.reviewReason}`);
    return review;
  }

  /**
   * Get pending reviews with optional filters
   */
  async getPendingReviews(
    orgId: string,
    filters?: {
      type?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = {
      orgId,
      status: 'PENDING',
    };

    if (filters?.type) {
      where.reviewType = filters.type;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.emailReviewQueue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      this.prisma.emailReviewQueue.count({ where }),
    ]);

    return { reviews, total };
  }

  /**
   * Get a single review by ID
   */
  async getReview(reviewId: string, orgId: string) {
    const review = await this.prisma.emailReviewQueue.findFirst({
      where: { id: reviewId, orgId },
    });

    if (!review) {
      throw new NotFoundException(`Review ${reviewId} not found`);
    }

    return review;
  }

  /**
   * Approve review and create entity
   */
  async approveReview(
    reviewId: string,
    orgId: string,
    userId: string,
    action: 'CREATE_CUSTOMER' | 'CREATE_VENDOR',
    notes?: string,
  ) {
    const review = await this.getReview(reviewId, orgId);

    // Create the entity based on action
    let entityId: string | null = null;

    if (action === 'CREATE_CUSTOMER' && review.extractedCompany) {
      // Create customer
      const customer = await this.prisma.client.create({
        data: {
          orgId,
          name: review.extractedCompany,
          email: review.senderEmail,
          type: 'COMPANY',
          status: 'ACTIVE',
          clientNumber: `C-${Date.now()}`,
          metadata: {
            source: 'EMAIL_REVIEW_QUEUE',
            reviewId,
            extractedContacts: review.extractedContacts,
            classification: review.classification,
          },
        },
      });
      entityId = customer.id;
      this.logger.log(`Created customer ${customer.id} from review ${reviewId}`);
    } else if (action === 'CREATE_VENDOR' && review.extractedCompany) {
      // Create vendor - using organisationId as per schema
      const vendor = await this.prisma.vendor.create({
        data: {
          organisationId: orgId,
          name: review.extractedCompany,
          email: review.senderEmail,
          status: 'ACTIVE',
          metadata: {
            source: 'EMAIL_REVIEW_QUEUE',
            reviewId,
            extractedContacts: review.extractedContacts,
          },
        },
      });
      entityId = vendor.id;
      this.logger.log(`Created vendor ${vendor.id} from review ${reviewId}`);
    }

    // Update review status
    const updatedReview = await this.prisma.emailReviewQueue.update({
      where: { id: reviewId },
      data: {
        status: 'APPROVED',
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes: notes,
        resultAction: action,
        resultEntityId: entityId,
      },
    });

    return { review: updatedReview, entityId };
  }

  /**
   * Reject review
   */
  async rejectReview(
    reviewId: string,
    orgId: string,
    userId: string,
    notes?: string,
  ) {
    await this.getReview(reviewId, orgId);

    const updatedReview = await this.prisma.emailReviewQueue.update({
      where: { id: reviewId },
      data: {
        status: 'REJECTED',
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes: notes,
        resultAction: 'REJECTED',
      },
    });

    this.logger.log(`Rejected review ${reviewId}`);
    return updatedReview;
  }

  /**
   * Block domain and reject review
   */
  async blockDomainAndReject(
    reviewId: string,
    orgId: string,
    userId: string,
    notes?: string,
  ) {
    const review = await this.getReview(reviewId, orgId);

    // Add domain to blacklist
    const config = await this.prisma.emailFilterConfig.findUnique({
      where: { orgId },
    });

    const currentBlacklist = config?.customDomainBlacklist || [];
    if (!currentBlacklist.includes(review.senderDomain)) {
      await this.prisma.emailFilterConfig.upsert({
        where: { orgId },
        update: {
          customDomainBlacklist: [...currentBlacklist, review.senderDomain],
        },
        create: {
          orgId,
          customDomainBlacklist: [review.senderDomain],
        },
      });
      this.logger.log(`Blocked domain ${review.senderDomain} for org ${orgId}`);
    }

    // Update review
    const updatedReview = await this.prisma.emailReviewQueue.update({
      where: { id: reviewId },
      data: {
        status: 'BLOCKED',
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes: notes || `Domain ${review.senderDomain} blocked`,
        resultAction: 'BLOCK_DOMAIN',
      },
    });

    return updatedReview;
  }

  /**
   * Get review statistics
   */
  async getReviewStats(orgId: string): Promise<ReviewStats> {
    const [total, pending, approved, rejected, blocked, byType] = await Promise.all([
      this.prisma.emailReviewQueue.count({ where: { orgId } }),
      this.prisma.emailReviewQueue.count({ where: { orgId, status: 'PENDING' } }),
      this.prisma.emailReviewQueue.count({ where: { orgId, status: 'APPROVED' } }),
      this.prisma.emailReviewQueue.count({ where: { orgId, status: 'REJECTED' } }),
      this.prisma.emailReviewQueue.count({ where: { orgId, status: 'BLOCKED' } }),
      this.prisma.emailReviewQueue.groupBy({
        by: ['reviewType'],
        where: { orgId },
        _count: true,
      }),
    ]);

    const byTypeMap: Record<string, number> = {};
    byType.forEach((item) => {
      byTypeMap[item.reviewType] = item._count;
    });

    return {
      total,
      pending,
      approved,
      rejected,
      blocked,
      byType: byTypeMap,
    };
  }

  /**
   * Bulk approve reviews
   */
  async bulkApprove(
    reviewIds: string[],
    orgId: string,
    userId: string,
    action: 'CREATE_CUSTOMER' | 'CREATE_VENDOR',
  ) {
    const results = [];
    for (const reviewId of reviewIds) {
      try {
        const result = await this.approveReview(reviewId, orgId, userId, action);
        results.push({ reviewId, success: true, entityId: result.entityId });
      } catch (error) {
        results.push({ reviewId, success: false, error: error.message });
      }
    }
    return results;
  }

  /**
   * Bulk reject reviews
   */
  async bulkReject(reviewIds: string[], orgId: string, userId: string) {
    await this.prisma.emailReviewQueue.updateMany({
      where: {
        id: { in: reviewIds },
        orgId,
        status: 'PENDING',
      },
      data: {
        status: 'REJECTED',
        reviewedBy: userId,
        reviewedAt: new Date(),
        resultAction: 'BULK_REJECTED',
      },
    });

    return { rejected: reviewIds.length };
  }
}
