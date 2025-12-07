/**
 * Email Intelligence Controller
 * Provides API endpoints for the Email Intelligence Dashboard
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EmailSuggestionsService } from './email-suggestions.service';
import { RelationshipTrackerService } from './relationship-tracker.service';
import { EmailClassifierService } from './email-classifier.service';
import { EmailAggregatorService } from './email-aggregator.service';
import { PrismaService } from '../../database/prisma.service';
import {
  EmailSuggestionType,
  EmailSuggestionPriority,
  EmailSuggestionStatus,
} from './types/email-suggestions.types';
import { HealthStatus } from './types/relationship-metrics.types';
import { AggregationOptions } from './types/aggregation.types';

interface RequestWithUser extends Request {
  user: {
    organisationId: string;
    userId: string;
  };
}

interface EmailActivityItem {
  id: string;
  date: Date;
  subject: string;
  from: string;
  category: string;
  action: string;
  entityType?: string;
  entityName?: string;
  amount?: number;
  currency?: string;
}

interface RelationshipHealthSummary {
  total: number;
  byStatus: {
    EXCELLENT: number;
    GOOD: number;
    NEEDS_ATTENTION: number;
    AT_RISK: number;
    DORMANT: number;
  };
}

interface AutoCreatedEntity {
  id: string;
  type: 'CUSTOMER' | 'VENDOR';
  name: string;
  email?: string;
  createdAt: Date;
  source: string;
  emailCount: number;
}

@Controller('organisations/:orgId/intelligence/email')
@UseGuards(JwtAuthGuard)
export class EmailIntelligenceController {
  private readonly logger = new Logger(EmailIntelligenceController.name);

  constructor(
    private readonly suggestionsService: EmailSuggestionsService,
    private readonly relationshipService: RelationshipTrackerService,
    private readonly classifierService: EmailClassifierService,
    private readonly aggregatorService: EmailAggregatorService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get recent email activity with classifications and actions taken
   */
  @Get('activity')
  async getEmailActivity(
    @Param('orgId') orgId: string,
    @Query('limit') limit?: string,
    @Request() req?: RequestWithUser,
  ): Promise<{ data: EmailActivityItem[] }> {
    this.logger.debug(`Getting email activity for org ${orgId}`);

    const limitNum = limit ? parseInt(limit, 10) : 50;

    // Get recent emails with their metadata
    const emails = await this.prisma.emailMessage.findMany({
      where: { organisationId: orgId },
      orderBy: { receivedAt: 'desc' },
      take: limitNum,
      select: {
        id: true,
        subject: true,
        fromAddress: true,
        receivedAt: true,
        metadata: true,
      },
    });

    // Transform into activity items
    const activities: EmailActivityItem[] = emails.map((email) => {
      const metadata = email.metadata as any;
      const classification = metadata?.classification;
      const entities = metadata?.entities;

      // Determine action taken
      let action = 'Processed';
      let entityType: string | undefined;
      let entityName: string | undefined;
      let amount: number | undefined;
      let currency: string | undefined;

      if (classification?.category === 'INVOICE_RECEIVED' && entities?.totalAmount) {
        action = 'Bill created automatically';
        amount = entities.totalAmount.amount;
        currency = entities.totalAmount.currency;
      } else if (classification?.category === 'QUOTE_REQUEST' && entities?.company) {
        action = 'Customer detected';
        entityType = 'CUSTOMER';
        entityName = entities.company.name;
      } else if (classification?.category === 'PAYMENT_CONFIRMATION') {
        action = 'Payment recorded';
        if (entities?.totalAmount) {
          amount = entities.totalAmount.amount;
          currency = entities.totalAmount.currency;
        }
      } else if (entities?.company) {
        entityType = 'COMPANY';
        entityName = entities.company.name;
      }

      return {
        id: email.id,
        date: email.receivedAt,
        subject: email.subject || 'No subject',
        from: email.fromAddress,
        category: classification?.category || 'GENERAL',
        action,
        entityType,
        entityName,
        amount,
        currency,
      };
    });

    return { data: activities };
  }

  /**
   * Get relationship health summary
   */
  @Get('relationships/summary')
  async getRelationshipSummary(
    @Param('orgId') orgId: string,
    @Request() req?: RequestWithUser,
  ): Promise<{ data: RelationshipHealthSummary }> {
    this.logger.debug(`Getting relationship summary for org ${orgId}`);

    // Get all customers and vendors with their metadata
    const [customers, vendors] = await Promise.all([
      this.prisma.customer.findMany({
        where: { organisationId: orgId },
        select: { id: true, metadata: true },
      }),
      this.prisma.vendor.findMany({
        where: { organisationId: orgId },
        select: { id: true, metadata: true },
      }),
    ]);

    // Count by health status
    const summary: RelationshipHealthSummary = {
      total: 0,
      byStatus: {
        EXCELLENT: 0,
        GOOD: 0,
        NEEDS_ATTENTION: 0,
        AT_RISK: 0,
        DORMANT: 0,
      },
    };

    // Process customers
    for (const customer of customers) {
      const metadata = customer.metadata as any;
      const healthStatus = metadata?.relationshipHealth?.healthStatus as HealthStatus;
      if (healthStatus && healthStatus in summary.byStatus) {
        summary.byStatus[healthStatus]++;
        summary.total++;
      }
    }

    // Process vendors
    for (const vendor of vendors) {
      const metadata = vendor.metadata as any;
      const healthStatus = metadata?.relationshipHealth?.healthStatus as HealthStatus;
      if (healthStatus && healthStatus in summary.byStatus) {
        summary.byStatus[healthStatus]++;
        summary.total++;
      }
    }

    return { data: summary };
  }

  /**
   * Get at-risk relationships requiring attention
   */
  @Get('relationships/at-risk')
  async getAtRiskRelationships(
    @Param('orgId') orgId: string,
    @Request() req?: RequestWithUser,
  ): Promise<{ data: any[] }> {
    this.logger.debug(`Getting at-risk relationships for org ${orgId}`);

    const atRisk: any[] = [];

    // Get customers with AT_RISK or DORMANT status
    const customers = await this.prisma.customer.findMany({
      where: { organisationId: orgId },
      select: {
        id: true,
        name: true,
        email: true,
        metadata: true,
      },
    });

    for (const customer of customers) {
      const metadata = customer.metadata as any;
      const healthStatus = metadata?.relationshipHealth?.healthStatus as HealthStatus;
      const healthScore = metadata?.relationshipHealth?.healthScore;
      const lastContactDate = metadata?.relationshipHealth?.lastContactDate;

      if (
        healthStatus === HealthStatus.AT_RISK ||
        healthStatus === HealthStatus.DORMANT ||
        healthStatus === HealthStatus.NEEDS_ATTENTION
      ) {
        atRisk.push({
          id: customer.id,
          type: 'CUSTOMER',
          name: customer.name,
          email: customer.email,
          healthStatus,
          healthScore: healthScore || 0,
          lastContactDate: lastContactDate ? new Date(lastContactDate) : null,
          daysSinceLastContact: metadata?.relationshipHealth?.daysSinceLastContact || null,
        });
      }
    }

    // Get vendors with AT_RISK or DORMANT status
    const vendors = await this.prisma.vendor.findMany({
      where: { organisationId: orgId },
      select: {
        id: true,
        name: true,
        email: true,
        metadata: true,
      },
    });

    for (const vendor of vendors) {
      const metadata = vendor.metadata as any;
      const healthStatus = metadata?.relationshipHealth?.healthStatus as HealthStatus;
      const healthScore = metadata?.relationshipHealth?.healthScore;
      const lastContactDate = metadata?.relationshipHealth?.lastContactDate;

      if (
        healthStatus === HealthStatus.AT_RISK ||
        healthStatus === HealthStatus.DORMANT ||
        healthStatus === HealthStatus.NEEDS_ATTENTION
      ) {
        atRisk.push({
          id: vendor.id,
          type: 'VENDOR',
          name: vendor.name,
          email: vendor.email,
          healthStatus,
          healthScore: healthScore || 0,
          lastContactDate: lastContactDate ? new Date(lastContactDate) : null,
          daysSinceLastContact: metadata?.relationshipHealth?.daysSinceLastContact || null,
        });
      }
    }

    // Sort by health score (lowest first)
    atRisk.sort((a, b) => a.healthScore - b.healthScore);

    return { data: atRisk };
  }

  /**
   * Get active suggestions
   */
  @Get('suggestions')
  async getSuggestions(
    @Param('orgId') orgId: string,
    @Query('type') type?: EmailSuggestionType,
    @Query('priority') priority?: EmailSuggestionPriority,
    @Query('status') status?: EmailSuggestionStatus,
    @Query('limit') limit?: string,
    @Request() req?: RequestWithUser,
  ): Promise<{ data: any[] }> {
    this.logger.debug(`Getting suggestions for org ${orgId}`);

    const limitNum = limit ? parseInt(limit, 10) : 50;

    const where: any = {
      organisationId: orgId,
    };

    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (status) where.status = status;
    else where.status = EmailSuggestionStatus.PENDING; // Default to pending

    const suggestions = await this.prisma.emailSuggestion.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: limitNum,
    });

    return { data: suggestions };
  }

  /**
   * Dismiss a suggestion
   */
  @Patch('suggestions/:suggestionId/dismiss')
  async dismissSuggestion(
    @Param('orgId') orgId: string,
    @Param('suggestionId') suggestionId: string,
    @Request() req?: RequestWithUser,
  ): Promise<{ data: any }> {
    this.logger.debug(`Dismissing suggestion ${suggestionId}`);

    const suggestion = await this.prisma.emailSuggestion.update({
      where: {
        id: suggestionId,
        organisationId: orgId,
      },
      data: {
        status: EmailSuggestionStatus.DISMISSED,
        dismissedAt: new Date(),
      },
    });

    return { data: suggestion };
  }

  /**
   * Mark suggestion as completed
   */
  @Patch('suggestions/:suggestionId/complete')
  async completeSuggestion(
    @Param('orgId') orgId: string,
    @Param('suggestionId') suggestionId: string,
    @Body() body: { actionTaken?: string },
    @Request() req?: RequestWithUser,
  ): Promise<{ data: any }> {
    this.logger.debug(`Completing suggestion ${suggestionId}`);

    const suggestion = await this.prisma.emailSuggestion.update({
      where: {
        id: suggestionId,
        organisationId: orgId,
      },
      data: {
        status: EmailSuggestionStatus.COMPLETED,
        completedAt: new Date(),
        actionTaken: body.actionTaken,
      },
    });

    return { data: suggestion };
  }

  /**
   * Get auto-created entities (customers/vendors) from email
   */
  @Get('auto-created')
  async getAutoCreatedEntities(
    @Param('orgId') orgId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Request() req?: RequestWithUser,
  ): Promise<{ data: AutoCreatedEntity[] }> {
    this.logger.debug(`Getting auto-created entities for org ${orgId}`);

    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);

    const entities: AutoCreatedEntity[] = [];

    // Get auto-created customers
    const customers = await this.prisma.customer.findMany({
      where: {
        organisationId: orgId,
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        metadata: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const customer of customers) {
      const metadata = customer.metadata as any;
      if (metadata?.autoCreated) {
        entities.push({
          id: customer.id,
          type: 'CUSTOMER',
          name: customer.name,
          email: customer.email || undefined,
          createdAt: customer.createdAt,
          source: metadata.createdFromEmail || 'Email',
          emailCount: metadata.emailCount || 0,
        });
      }
    }

    // Get auto-created vendors
    const vendors = await this.prisma.vendor.findMany({
      where: {
        organisationId: orgId,
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        metadata: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const vendor of vendors) {
      const metadata = vendor.metadata as any;
      if (metadata?.autoCreated) {
        entities.push({
          id: vendor.id,
          type: 'VENDOR',
          name: vendor.name,
          email: vendor.email || undefined,
          createdAt: vendor.createdAt,
          source: metadata.createdFromEmail || 'Email',
          emailCount: metadata.emailCount || 0,
        });
      }
    }

    // Sort by creation date (newest first)
    entities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return { data: entities };
  }

  /**
   * Get company aggregations from emails
   * Groups contacts from the same domain and identifies potential new customers
   */
  @Get('aggregations')
  async getAggregations(
    @Param('orgId') orgId: string,
    @Query('sinceDate') sinceDate?: string,
    @Query('excludeExisting') excludeExisting?: string,
    @Query('minEmailCount') minEmailCount?: string,
    @Query('minContactCount') minContactCount?: string,
    @Request() req?: RequestWithUser,
  ): Promise<{ data: any[] }> {
    this.logger.debug(`Getting email aggregations for org ${orgId}`);

    const options: AggregationOptions = {};

    if (sinceDate) {
      options.sinceDate = new Date(sinceDate);
    }

    if (excludeExisting === 'true') {
      options.excludeExisting = true;
    }

    if (minEmailCount) {
      options.minEmailCount = parseInt(minEmailCount, 10);
    }

    if (minContactCount) {
      options.minContactCount = parseInt(minContactCount, 10);
    }

    const aggregations = await this.aggregatorService.aggregateByCompany(
      orgId,
      options,
    );

    return { data: aggregations };
  }

  /**
   * Get aggregation summary statistics
   */
  @Get('aggregations/summary')
  async getAggregationSummary(
    @Param('orgId') orgId: string,
    @Query('sinceDate') sinceDate?: string,
    @Request() req?: RequestWithUser,
  ): Promise<{ data: any }> {
    this.logger.debug(`Getting aggregation summary for org ${orgId}`);

    const options: AggregationOptions = {};

    if (sinceDate) {
      options.sinceDate = new Date(sinceDate);
    }

    const summary = await this.aggregatorService.getAggregationSummary(
      orgId,
      options,
    );

    return { data: summary };
  }

  /**
   * Import selected aggregations as customers
   */
  @Post('aggregations/import')
  async importAggregations(
    @Param('orgId') orgId: string,
    @Body() body: { aggregationIds: string[] },
    @Request() req: RequestWithUser,
  ): Promise<{ data: any }> {
    this.logger.log(
      `Importing ${body.aggregationIds.length} aggregations as customers for org ${orgId}`,
    );

    if (!body.aggregationIds || !Array.isArray(body.aggregationIds)) {
      throw new BadRequestException('aggregationIds must be an array');
    }

    const result = await this.aggregatorService.importAsCustomers(
      orgId,
      body.aggregationIds,
      req.user.userId,
    );

    return { data: result };
  }
}
