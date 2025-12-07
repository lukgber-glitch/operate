/**
 * Email Suggestions Service
 * Generates actionable suggestions based on email analysis and relationship health
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  EmailSuggestion,
  EmailSuggestionType,
  EmailSuggestionPriority,
  EmailSuggestionStatus,
  EmailSuggestionEntityType,
  EmailSuggestionActionType,
  EmailSuggestionInput,
  RelationshipSuggestionInput,
  GetEmailSuggestionsOptions,
  CreateEmailSuggestionDto,
  SuggestionGenerationContext,
  RelationshipMetrics,
  EMAIL_SUGGESTION_PRIORITY_MAP,
  EMAIL_SUGGESTION_EXPIRATION_MAP,
} from './types/email-suggestions.types';
import {
  EmailClassification,
  ClassificationResult,
} from './types/email-classification.types';
import { ExtractedEntities } from './types/extracted-entities.types';

interface EmailMessage {
  id?: string;
  subject?: string;
  classification?: ClassificationResult;
  entities?: ExtractedEntities;
}

@Injectable()
export class EmailSuggestionsService {
  private readonly logger = new Logger(EmailSuggestionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Generate suggestions from a single email analysis
   */
  async generateSuggestionsForEmail(
    email: EmailMessage,
    classification: ClassificationResult,
    entities: ExtractedEntities,
    orgId: string,
  ): Promise<EmailSuggestion[]> {
    this.logger.debug(
      `Generating suggestions for email: ${email.subject?.substring(0, 50)}`,
    );

    const suggestions: CreateEmailSuggestionDto[] = [];

    // Classification-based suggestions
    const classificationSuggestions = this.buildSuggestionsFromClassification(
      classification,
      entities,
      orgId,
      email.id,
      email.subject,
    );
    suggestions.push(...classificationSuggestions);

    // Entity-based suggestions
    const entitySuggestions = await this.buildSuggestionsFromEntities(
      entities,
      orgId,
      email.id,
      email.subject,
    );
    suggestions.push(...entitySuggestions);

    // Check for duplicates and create suggestions
    const created: EmailSuggestion[] = [];
    for (const suggestion of suggestions) {
      const existing = await this.checkDuplicateSuggestion(suggestion);
      if (!existing) {
        const newSuggestion = await this.createSuggestion(suggestion);
        if (newSuggestion) {
          created.push(newSuggestion);
        }
      } else {
        this.logger.debug(
          `Skipping duplicate suggestion: ${suggestion.type} for entity ${suggestion.entityId}`,
        );
      }
    }

    this.logger.log(`Generated ${created.length} new suggestions for email`);
    return created;
  }

  /**
   * Generate daily suggestions for an organization
   * This analyzes relationships, overdue items, and dormant contacts
   */
  async generateDailySuggestions(orgId: string): Promise<EmailSuggestion[]> {
    this.logger.log(`Generating daily suggestions for org ${orgId}`);

    const suggestions: CreateEmailSuggestionDto[] = [];

    // Check for dormant customers (no contact in 60+ days)
    const dormantSuggestions = await this.generateDormantEntitySuggestions(
      orgId,
      60,
    );
    suggestions.push(...dormantSuggestions);

    // Check for overdue follow-ups
    const followUpSuggestions = await this.generateFollowUpSuggestions(orgId);
    suggestions.push(...followUpSuggestions);

    // Create all suggestions
    const created: EmailSuggestion[] = [];
    for (const suggestion of suggestions) {
      const existing = await this.checkDuplicateSuggestion(suggestion);
      if (!existing) {
        const newSuggestion = await this.createSuggestion(suggestion);
        if (newSuggestion) {
          created.push(newSuggestion);
        }
      }
    }

    this.logger.log(`Generated ${created.length} daily suggestions`);
    return created;
  }

  /**
   * Get suggestions for organization with filtering
   */
  async getSuggestionsForOrg(
    orgId: string,
    options?: GetEmailSuggestionsOptions,
  ): Promise<EmailSuggestion[]> {
    const where: any = {
      organisationId: orgId,
    };

    // Filter by status (exclude expired and dismissed by default)
    if (!options?.includeExpired && !options?.includeDismissed) {
      where.status = {
        in: [
          EmailSuggestionStatus.PENDING,
          EmailSuggestionStatus.VIEWED,
          EmailSuggestionStatus.SNOOZED,
        ],
      };
    } else if (!options?.includeExpired) {
      where.status = {
        notIn: [EmailSuggestionStatus.EXPIRED],
      };
    } else if (!options?.includeDismissed) {
      where.status = {
        notIn: [EmailSuggestionStatus.DISMISSED],
      };
    }

    // Filter by type
    if (options?.types && options.types.length > 0) {
      where.type = { in: options.types };
    }

    // Filter by priority
    if (options?.priority && options.priority.length > 0) {
      where.priority = { in: options.priority };
    }

    // Filter by entity
    if (options?.entityId) {
      where.entityId = options.entityId;
    }
    if (options?.entityType) {
      where.entityType = options.entityType;
    }

    // Check for expired suggestions
    const now = new Date();
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: now } }];

    // Fetch suggestions
    const suggestions = await this.prisma.emailSuggestion.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: options?.limit || 50,
    });

    return suggestions.map(this.mapPrismaToSuggestion);
  }

  /**
   * Dismiss a suggestion
   */
  async dismissSuggestion(
    suggestionId: string,
    userId: string,
  ): Promise<void> {
    await this.prisma.emailSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: EmailSuggestionStatus.DISMISSED,
        dismissedAt: new Date(),
        dismissedBy: userId,
      },
    });

    this.logger.debug(`Suggestion ${suggestionId} dismissed by user ${userId}`);
  }

  /**
   * Complete a suggestion (mark as acted upon)
   */
  async completeSuggestion(
    suggestionId: string,
    userId: string,
  ): Promise<void> {
    await this.prisma.emailSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: EmailSuggestionStatus.COMPLETED,
        completedAt: new Date(),
        completedBy: userId,
      },
    });

    this.logger.debug(
      `Suggestion ${suggestionId} completed by user ${userId}`,
    );
  }

  /**
   * Snooze a suggestion until a specific date
   */
  async snoozeSuggestion(
    suggestionId: string,
    userId: string,
    until: Date,
  ): Promise<void> {
    await this.prisma.emailSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: EmailSuggestionStatus.SNOOZED,
        snoozedUntil: until,
      },
    });

    this.logger.debug(
      `Suggestion ${suggestionId} snoozed until ${until.toISOString()}`,
    );
  }

  /**
   * Generate suggestions from relationship metrics
   * This integrates with RelationshipTrackerService
   */
  async generateSuggestionsFromRelationship(
    input: RelationshipSuggestionInput,
  ): Promise<EmailSuggestion[]> {
    this.logger.debug(
      `Generating suggestions from relationship metrics for ${input.entityType}: ${input.entityName}`,
    );

    const suggestions: CreateEmailSuggestionDto[] = [];
    const metrics = input.relationshipMetrics;

    // Dormant relationship
    if (metrics.daysSinceLastContact > 45) {
      suggestions.push({
        type: EmailSuggestionType.REENGAGE_DORMANT,
        priority:
          metrics.daysSinceLastContact > 90
            ? EmailSuggestionPriority.HIGH
            : EmailSuggestionPriority.MEDIUM,
        title: `No contact with ${input.entityName} in ${metrics.daysSinceLastContact} days`,
        message: `It's been ${metrics.daysSinceLastContact} days since your last contact with ${input.entityName}. Consider reaching out to maintain the relationship.`,
        organisationId: input.orgId,
        entityId: input.entityId,
        entityType: input.entityType,
        entityName: input.entityName,
        actionType: EmailSuggestionActionType.CHAT_ACTION,
        actionLabel: 'Draft Email',
        actionPayload: {
          action: 'draft_email',
          entityId: input.entityId,
          entityType: input.entityType,
        },
        contextData: {
          daysSinceLastContact: metrics.daysSinceLastContact,
          healthScore: metrics.healthScore,
        },
        confidence: 0.9,
      });
    }

    // Declining relationship
    if (
      metrics.healthScore < 50 &&
      metrics.sentimentTrend === 'declining'
    ) {
      suggestions.push({
        type: EmailSuggestionType.RELATIONSHIP_DECLINING,
        priority: EmailSuggestionPriority.HIGH,
        title: `Relationship health declining for ${input.entityName}`,
        message: `Response times are increasing and sentiment is declining with ${input.entityName}. Health score: ${metrics.healthScore}/100.`,
        organisationId: input.orgId,
        entityId: input.entityId,
        entityType: input.entityType,
        entityName: input.entityName,
        actionType: EmailSuggestionActionType.NAVIGATE,
        actionLabel: 'View Details',
        actionPayload: {
          path: `/contacts/${input.entityId}`,
        },
        contextData: {
          healthScore: metrics.healthScore,
          sentimentTrend: metrics.sentimentTrend,
          responseTimeChange: metrics.responseTimeChange,
        },
        confidence: 0.85,
      });
    }

    // Payment behavior change
    if (
      metrics.paymentBehaviorChange &&
      metrics.paymentBehavior === 'late'
    ) {
      suggestions.push({
        type: EmailSuggestionType.PAYMENT_PATTERN_CHANGE,
        priority: EmailSuggestionPriority.URGENT,
        title: `Payment pattern changed for ${input.entityName}`,
        message: `${input.entityName} has started paying invoices late. Review account status and consider follow-up.`,
        organisationId: input.orgId,
        entityId: input.entityId,
        entityType: input.entityType,
        entityName: input.entityName,
        actionType: EmailSuggestionActionType.NAVIGATE,
        actionLabel: 'View Invoices',
        actionPayload: {
          path: `/invoices?customerId=${input.entityId}`,
        },
        contextData: {
          paymentBehavior: metrics.paymentBehavior,
        },
        confidence: 0.95,
      });
    }

    // Create suggestions
    const created: EmailSuggestion[] = [];
    for (const suggestion of suggestions) {
      const existing = await this.checkDuplicateSuggestion(suggestion);
      if (!existing) {
        const newSuggestion = await this.createSuggestion(suggestion);
        if (newSuggestion) {
          created.push(newSuggestion);
        }
      }
    }

    return created;
  }

  /**
   * Build suggestions from email classification
   */
  private buildSuggestionsFromClassification(
    classification: ClassificationResult,
    entities: ExtractedEntities,
    orgId: string,
    emailId?: string,
    emailSubject?: string,
  ): CreateEmailSuggestionDto[] {
    const suggestions: CreateEmailSuggestionDto[] = [];

    switch (classification.classification) {
      case EmailClassification.INVOICE_RECEIVED:
        // Suggest creating a bill
        const vendorName =
          entities.companies.find((c) => c.role === 'VENDOR')?.name ||
          'Unknown Vendor';
        const amount = entities.amounts[0];
        suggestions.push({
          type: EmailSuggestionType.CREATE_BILL,
          priority: EmailSuggestionPriority.HIGH,
          title: `Create bill from ${vendorName}`,
          message: amount
            ? `Invoice received for ${amount.currency} ${amount.value.toFixed(2)}. Create bill?`
            : `Invoice received from ${vendorName}. Create bill?`,
          organisationId: orgId,
          entityType: EmailSuggestionEntityType.VENDOR,
          entityName: vendorName,
          sourceEmailId: emailId,
          sourceEmailSubject: emailSubject,
          actionType: EmailSuggestionActionType.CHAT_ACTION,
          actionLabel: 'Create Bill',
          actionPayload: {
            action: 'create_bill',
            emailId,
            vendorName,
            amount: amount?.value,
            currency: amount?.currency,
          },
          confidence: classification.confidence,
        });
        break;

      case EmailClassification.QUOTE_REQUEST:
        // Suggest responding to quote request
        const customerName =
          entities.companies.find((c) => c.role === 'CUSTOMER')?.name ||
          'Unknown Customer';
        suggestions.push({
          type: EmailSuggestionType.FOLLOW_UP_INQUIRY,
          priority: EmailSuggestionPriority.HIGH,
          title: `Quote request from ${customerName}`,
          message: `${customerName} requested a quote. Respond within 24 hours for best results.`,
          organisationId: orgId,
          entityType: EmailSuggestionEntityType.CUSTOMER,
          entityName: customerName,
          sourceEmailId: emailId,
          sourceEmailSubject: emailSubject,
          actionType: EmailSuggestionActionType.CHAT_ACTION,
          actionLabel: 'Draft Quote',
          actionPayload: {
            action: 'create_quote',
            emailId,
            customerName,
          },
          confidence: classification.confidence,
        });
        break;

      case EmailClassification.PAYMENT_REMINDER:
        // Suggestion handled elsewhere (check overdue invoices)
        break;

      case EmailClassification.CUSTOMER_INQUIRY:
      case EmailClassification.SUPPORT_REQUEST:
        const inquiryCustomer =
          entities.companies.find((c) => c.role === 'CUSTOMER')?.name ||
          'Customer';
        suggestions.push({
          type: EmailSuggestionType.FOLLOW_UP_INQUIRY,
          priority:
            classification.classification === EmailClassification.SUPPORT_REQUEST
              ? EmailSuggestionPriority.HIGH
              : EmailSuggestionPriority.MEDIUM,
          title: `Respond to ${inquiryCustomer}`,
          message: `${inquiryCustomer} sent an inquiry. ${classification.extractedIntent || 'Respond promptly.'}`,
          organisationId: orgId,
          entityType: EmailSuggestionEntityType.CUSTOMER,
          entityName: inquiryCustomer,
          sourceEmailId: emailId,
          sourceEmailSubject: emailSubject,
          actionType: EmailSuggestionActionType.CHAT_ACTION,
          actionLabel: 'Draft Reply',
          actionPayload: {
            action: 'draft_reply',
            emailId,
          },
          confidence: classification.confidence,
        });
        break;
    }

    return suggestions;
  }

  /**
   * Build suggestions from extracted entities
   */
  private async buildSuggestionsFromEntities(
    entities: ExtractedEntities,
    orgId: string,
    emailId?: string,
    emailSubject?: string,
  ): Promise<CreateEmailSuggestionDto[]> {
    const suggestions: CreateEmailSuggestionDto[] = [];

    // New contacts detected
    for (const contact of entities.contacts) {
      if (contact.confidence > 0.7 && contact.email) {
        // Check if contact is new
        // Note: This is a simplified check - in production you'd join with client/customer
        const existingContact = await this.prisma.clientContact.findFirst({
          where: {
            email: contact.email,
          },
        });

        if (!existingContact) {
          suggestions.push({
            type: EmailSuggestionType.NEW_CONTACT_DETECTED,
            priority: EmailSuggestionPriority.MEDIUM,
            title: `New contact detected: ${contact.name}`,
            message: `Found new contact ${contact.name} (${contact.email}). Add to contacts?`,
            organisationId: orgId,
            entityType: EmailSuggestionEntityType.CONTACT,
            entityName: contact.name,
            sourceEmailId: emailId,
            sourceEmailSubject: emailSubject,
            actionType: EmailSuggestionActionType.CHAT_ACTION,
            actionLabel: 'Add Contact',
            actionPayload: {
              action: 'create_contact',
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              company: contact.company,
            },
            confidence: contact.confidence,
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Generate suggestions for dormant entities
   */
  private async generateDormantEntitySuggestions(
    orgId: string,
    daysSinceLastContact: number,
  ): Promise<CreateEmailSuggestionDto[]> {
    const suggestions: CreateEmailSuggestionDto[] = [];

    // This would integrate with relationship tracking
    // For now, return empty array
    // TODO: Integrate with RelationshipTrackerService once available

    return suggestions;
  }

  /**
   * Generate follow-up suggestions for quotes/invoices
   */
  private async generateFollowUpSuggestions(
    orgId: string,
  ): Promise<CreateEmailSuggestionDto[]> {
    const suggestions: CreateEmailSuggestionDto[] = [];

    // Check for sent quotes without follow-up (>5 days old)
    // This would check database for quotes
    // TODO: Implement quote follow-up logic

    // Check for overdue invoices
    // This would check database for invoices
    // TODO: Implement invoice follow-up logic

    return suggestions;
  }

  /**
   * Create a suggestion in the database
   */
  private async createSuggestion(
    dto: CreateEmailSuggestionDto,
  ): Promise<EmailSuggestion | null> {
    try {
      // Calculate expiration date
      const expiresAt = dto.expiresAt || this.calculateExpirationDate(dto.type);

      const suggestion = await this.prisma.emailSuggestion.create({
        data: {
          organisationId: dto.organisationId,
          type: dto.type,
          priority: dto.priority,
          status: EmailSuggestionStatus.PENDING,
          title: dto.title,
          message: dto.message,
          entityId: dto.entityId,
          entityType: dto.entityType,
          entityName: dto.entityName,
          sourceEmailId: dto.sourceEmailId,
          sourceEmailSubject: dto.sourceEmailSubject,
          actionType: dto.actionType,
          actionPayload: dto.actionPayload || {},
          actionLabel: dto.actionLabel,
          confidence: dto.confidence,
          contextData: dto.contextData || {},
          expiresAt,
        },
      });

      return this.mapPrismaToSuggestion(suggestion);
    } catch (error) {
      this.logger.error(`Failed to create suggestion: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if a similar suggestion already exists
   */
  private async checkDuplicateSuggestion(
    dto: CreateEmailSuggestionDto,
  ): Promise<boolean> {
    const existing = await this.prisma.emailSuggestion.findFirst({
      where: {
        organisationId: dto.organisationId,
        type: dto.type,
        status: {
          in: [
            EmailSuggestionStatus.PENDING,
            EmailSuggestionStatus.VIEWED,
            EmailSuggestionStatus.SNOOZED,
          ],
        },
        entityId: dto.entityId || undefined,
        entityType: dto.entityType || undefined,
      },
    });

    return !!existing;
  }

  /**
   * Calculate expiration date based on suggestion type
   */
  private calculateExpirationDate(type: EmailSuggestionType): Date {
    const daysToExpire = EMAIL_SUGGESTION_EXPIRATION_MAP[type] || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToExpire);
    return expiresAt;
  }

  /**
   * Map Prisma model to EmailSuggestion type
   */
  private mapPrismaToSuggestion(prismaModel: any): EmailSuggestion {
    return {
      id: prismaModel.id,
      type: prismaModel.type as EmailSuggestionType,
      priority: prismaModel.priority as EmailSuggestionPriority,
      status: prismaModel.status as EmailSuggestionStatus,
      title: prismaModel.title,
      message: prismaModel.message,
      entityId: prismaModel.entityId,
      entityType: prismaModel.entityType as EmailSuggestionEntityType,
      entityName: prismaModel.entityName,
      sourceEmailId: prismaModel.sourceEmailId,
      sourceEmailSubject: prismaModel.sourceEmailSubject,
      actionType: prismaModel.actionType as EmailSuggestionActionType,
      actionPayload: prismaModel.actionPayload,
      actionLabel: prismaModel.actionLabel,
      confidence: prismaModel.confidence
        ? parseFloat(prismaModel.confidence.toString())
        : undefined,
      contextData: prismaModel.contextData,
      createdAt: prismaModel.createdAt,
      expiresAt: prismaModel.expiresAt,
      dismissedAt: prismaModel.dismissedAt,
      dismissedBy: prismaModel.dismissedBy,
      completedAt: prismaModel.completedAt,
      completedBy: prismaModel.completedBy,
      snoozedUntil: prismaModel.snoozedUntil,
      organisationId: prismaModel.organisationId,
    };
  }
}
