/**
 * Email Aggregation Processor
 * Background job that runs nightly to aggregate email entities
 * and generate suggestions for new potential customers
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { EmailAggregatorService } from '../email-aggregator.service';
import { EmailSuggestionPriority } from '../types/email-suggestions.types';

@Injectable()
export class EmailAggregationProcessor {
  private readonly logger = new Logger(EmailAggregationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aggregatorService: EmailAggregatorService,
  ) {}

  /**
   * Process: Aggregate emails and generate suggestions
   * Runs nightly at 2 AM to discover new potential customers
   */
  async handleDailyAggregation(orgId?: string): Promise<void> {
    this.logger.log('Processing daily email aggregation job');

    try {
      // Get all organizations to process
      const orgs = orgId
        ? [{ id: orgId }]
        : await this.prisma.organisation.findMany({
            select: { id: true },
          });

      this.logger.log(`Processing ${orgs.length} organizations`);

      let totalSuggestionsCreated = 0;

      for (const org of orgs) {
        try {
          const suggestionsCreated = await this.processOrgAggregation(org.id);
          totalSuggestionsCreated += suggestionsCreated;
        } catch (error) {
          this.logger.error(
            `Failed to process aggregation for org ${org.id}: ${error.message}`,
          );
          // Continue with other orgs
        }
      }

      this.logger.log(
        `Daily aggregation complete: ${totalSuggestionsCreated} suggestions created across ${orgs.length} organizations`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process daily email aggregation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Process aggregation for a single organization
   */
  private async processOrgAggregation(orgId: string): Promise<number> {
    this.logger.debug(`Processing aggregation for org ${orgId}`);

    // Aggregate emails from last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const summary = await this.aggregatorService.getAggregationSummary(orgId, {
      sinceDate: yesterday,
      excludeExisting: true, // Only new companies
      minEmailCount: 2, // At least 2 emails
    });

    // If no new companies found, skip
    if (summary.newCompanies === 0) {
      this.logger.debug(`No new companies found for org ${orgId}`);
      return 0;
    }

    this.logger.log(
      `Found ${summary.newCompanies} new potential customers for org ${orgId}`,
    );

    // Create suggestion
    const suggestion = await this.createAggregationSuggestion(
      orgId,
      summary.newCompanies,
    );

    if (suggestion) {
      this.logger.debug(
        `Created aggregation suggestion ${suggestion.id} for org ${orgId}`,
      );
      return 1;
    }

    return 0;
  }

  /**
   * Create a suggestion for discovered companies
   */
  private async createAggregationSuggestion(
    orgId: string,
    newCompanyCount: number,
  ): Promise<any> {
    const title =
      newCompanyCount === 1
        ? '1 new potential customer discovered from emails'
        : `${newCompanyCount} new potential customers discovered from emails`;

    const message =
      newCompanyCount === 1
        ? 'We found 1 new company in your email communications. Review and add to your customer database.'
        : `We found ${newCompanyCount} new companies in your email communications. Review and add to your customer database.`;

    try {
      return await this.prisma.emailSuggestion.create({
        data: {
          organisationId: orgId,
          type: 'NEW_CONTACT_DETECTED', // Using existing type
          priority: EmailSuggestionPriority.MEDIUM,
          status: 'PENDING',
          title,
          message,
          actionLabel: 'Review Companies',
          contextData: {
            newCompanyCount,
            aggregationDate: new Date().toISOString(),
            source: 'EMAIL_AGGREGATION_JOB',
            actionUrl: '/intelligence/email/aggregations',
          },
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create aggregation suggestion: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Process: Aggregate emails for a specific organization (on-demand)
   */
  async handleOrgAggregation(
    orgId: string,
    sinceDate?: string,
  ): Promise<void> {

    this.logger.log(`Processing on-demand aggregation for org ${orgId}`);

    try {
      const options: any = {
        excludeExisting: true,
        minEmailCount: 1,
      };

      if (sinceDate) {
        options.sinceDate = new Date(sinceDate);
      }

      const summary = await this.aggregatorService.getAggregationSummary(
        orgId,
        options,
      );

      this.logger.log(
        `Aggregation complete for org ${orgId}: ${summary.newCompanies} new companies, ${summary.totalEmails} emails`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process on-demand aggregation for org ${orgId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
