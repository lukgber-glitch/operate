import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  DEFAULT_PERSONAL_DOMAINS,
  DEFAULT_SERVICE_PROVIDER_DOMAINS,
  DEFAULT_BLOCKED_EMAIL_PATTERNS,
  AUTO_REPLY_HEADERS,
  BULK_MAIL_INDICATORS,
} from './data/default-filters';

export type FilterAction = 'PROCESS' | 'SKIP' | 'REVIEW';

export type SkipCode =
  | 'PERSONAL_DOMAIN'
  | 'SERVICE_PROVIDER'
  | 'BLOCKED_PATTERN'
  | 'AUTO_REPLY'
  | 'BULK_MAIL'
  | 'LOW_CONFIDENCE'
  | 'HEADER_FLAG'
  | 'CUSTOM_BLACKLIST';

export type ReviewType =
  | 'LOW_CONFIDENCE'
  | 'PATTERN_MATCH'
  | 'DOMAIN_SUSPECT'
  | 'MANUAL_CHECK';

export interface EmailFilterResult {
  action: FilterAction;
  reason: string;
  skipCode?: SkipCode;
  reviewType?: ReviewType;
  confidence: number;
  details?: Record<string, any>;
}

export interface EmailFilterInput {
  from: string;
  to?: string[];
  subject?: string;
  headers?: Record<string, string>;
  classificationConfidence?: number;
  entityConfidence?: number;
}

export interface FilterConfig {
  personalDomainBlocklist: string[];
  serviceProviderWhitelist: string[];
  customDomainBlacklist: string[];
  customDomainWhitelist: string[];
  blockedEmailPatterns: string[];
  skipAutoReplies: boolean;
  skipBulkMail: boolean;
  skipMarketingMail: boolean;
  minEntityConfidence: number;
  minClassificationConfidence: number;
  reviewLowConfidence: boolean;
  lowConfidenceThreshold: number;
}

@Injectable()
export class EmailFilterService {
  private readonly logger = new Logger(EmailFilterService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Main filter method - determines if an email should be processed, skipped, or reviewed
   */
  async filterEmail(
    orgId: string,
    input: EmailFilterInput,
  ): Promise<EmailFilterResult> {
    // Get org-specific filter config or use defaults
    const config = await this.getFilterConfig(orgId);
    const senderEmail = this.extractEmail(input.from);
    const senderDomain = this.extractDomain(senderEmail);

    if (!senderEmail || !senderDomain) {
      return {
        action: 'SKIP',
        reason: 'Invalid sender email format',
        skipCode: 'BLOCKED_PATTERN',
        confidence: 0,
      };
    }

    // Check custom whitelist first (always allow)
    if (this.isDomainInList(senderDomain, config.customDomainWhitelist)) {
      return {
        action: 'PROCESS',
        reason: 'Domain in custom whitelist',
        confidence: 1.0,
      };
    }

    // Check custom blacklist (always block)
    if (this.isDomainInList(senderDomain, config.customDomainBlacklist)) {
      return {
        action: 'SKIP',
        reason: `Domain ${senderDomain} in custom blacklist`,
        skipCode: 'CUSTOM_BLACKLIST',
        confidence: 1.0,
      };
    }

    // Check service provider list (skip for customer creation)
    if (this.isServiceProvider(senderDomain, config.serviceProviderWhitelist)) {
      return {
        action: 'SKIP',
        reason: `Known service provider: ${senderDomain}`,
        skipCode: 'SERVICE_PROVIDER',
        confidence: 0.95,
        details: { domain: senderDomain },
      };
    }

    // Check personal domain list
    if (this.isPersonalDomain(senderDomain, config.personalDomainBlocklist)) {
      // Get org business model to decide action
      const org = await this.prisma.organisation.findUnique({
        where: { id: orgId },
        select: { businessModel: true },
      });

      // B2B businesses should skip personal emails, B2C should process them
      if (org?.businessModel === 'B2B') {
        return {
          action: 'SKIP',
          reason: `Personal email domain: ${senderDomain} (B2B org)`,
          skipCode: 'PERSONAL_DOMAIN',
          confidence: 0.9,
          details: { domain: senderDomain, businessModel: 'B2B' },
        };
      } else if (org?.businessModel === 'HYBRID') {
        // Hybrid: queue for review
        return {
          action: 'REVIEW',
          reason: `Personal email from ${senderDomain} needs review (Hybrid org)`,
          reviewType: 'DOMAIN_SUSPECT',
          confidence: 0.7,
          details: { domain: senderDomain, businessModel: 'HYBRID' },
        };
      }
      // B2C: allow personal emails
    }

    // Check email pattern blocklist
    const patternMatch = this.matchesBlockedPattern(
      senderEmail,
      config.blockedEmailPatterns,
    );
    if (patternMatch) {
      return {
        action: 'SKIP',
        reason: `Email matches blocked pattern: ${patternMatch}`,
        skipCode: 'BLOCKED_PATTERN',
        confidence: 0.95,
        details: { pattern: patternMatch },
      };
    }

    // Check headers for auto-reply
    if (config.skipAutoReplies && input.headers) {
      const autoReplyResult = this.isAutoReply(input.headers);
      if (autoReplyResult.isAutoReply) {
        return {
          action: 'SKIP',
          reason: `Auto-reply detected: ${autoReplyResult.header}`,
          skipCode: 'AUTO_REPLY',
          confidence: 0.9,
          details: { header: autoReplyResult.header },
        };
      }
    }

    // Check headers for bulk mail
    if (config.skipBulkMail && input.headers) {
      const bulkMailResult = this.isBulkMail(input.headers);
      if (bulkMailResult.isBulk) {
        return {
          action: 'SKIP',
          reason: `Bulk mail detected: ${bulkMailResult.indicator}`,
          skipCode: 'BULK_MAIL',
          confidence: 0.85,
          details: { indicator: bulkMailResult.indicator },
        };
      }
    }

    // Check confidence thresholds
    if (input.classificationConfidence !== undefined) {
      if (input.classificationConfidence < config.lowConfidenceThreshold) {
        return {
          action: 'SKIP',
          reason: `Classification confidence too low: ${input.classificationConfidence}`,
          skipCode: 'LOW_CONFIDENCE',
          confidence: input.classificationConfidence,
        };
      }

      if (input.classificationConfidence < config.minClassificationConfidence) {
        if (config.reviewLowConfidence) {
          return {
            action: 'REVIEW',
            reason: `Classification confidence below threshold: ${input.classificationConfidence} < ${config.minClassificationConfidence}`,
            reviewType: 'LOW_CONFIDENCE',
            confidence: input.classificationConfidence,
          };
        }
      }
    }

    if (input.entityConfidence !== undefined) {
      if (input.entityConfidence < config.lowConfidenceThreshold) {
        return {
          action: 'SKIP',
          reason: `Entity confidence too low: ${input.entityConfidence}`,
          skipCode: 'LOW_CONFIDENCE',
          confidence: input.entityConfidence,
        };
      }

      if (input.entityConfidence < config.minEntityConfidence) {
        if (config.reviewLowConfidence) {
          return {
            action: 'REVIEW',
            reason: `Entity confidence below threshold: ${input.entityConfidence} < ${config.minEntityConfidence}`,
            reviewType: 'LOW_CONFIDENCE',
            confidence: input.entityConfidence,
          };
        }
      }
    }

    // All checks passed - process the email
    return {
      action: 'PROCESS',
      reason: 'Email passed all filters',
      confidence: Math.min(
        input.classificationConfidence ?? 1.0,
        input.entityConfidence ?? 1.0,
      ),
    };
  }

  /**
   * Get filter configuration for an organization
   */
  async getFilterConfig(orgId: string): Promise<FilterConfig> {
    const config = await this.prisma.emailFilterConfig.findUnique({
      where: { orgId },
    });

    if (config) {
      return {
        personalDomainBlocklist: [
          ...DEFAULT_PERSONAL_DOMAINS,
          ...config.personalDomainBlocklist,
        ],
        serviceProviderWhitelist: [
          ...DEFAULT_SERVICE_PROVIDER_DOMAINS,
          ...config.serviceProviderWhitelist,
        ],
        customDomainBlacklist: config.customDomainBlacklist,
        customDomainWhitelist: config.customDomainWhitelist,
        blockedEmailPatterns: [
          ...DEFAULT_BLOCKED_EMAIL_PATTERNS,
          ...config.blockedEmailPatterns,
        ],
        skipAutoReplies: config.skipAutoReplies,
        skipBulkMail: config.skipBulkMail,
        skipMarketingMail: config.skipMarketingMail,
        minEntityConfidence: config.minEntityConfidence,
        minClassificationConfidence: config.minClassificationConfidence,
        reviewLowConfidence: config.reviewLowConfidence,
        lowConfidenceThreshold: config.lowConfidenceThreshold,
      };
    }

    // Return defaults if no org-specific config
    return {
      personalDomainBlocklist: DEFAULT_PERSONAL_DOMAINS,
      serviceProviderWhitelist: DEFAULT_SERVICE_PROVIDER_DOMAINS,
      customDomainBlacklist: [],
      customDomainWhitelist: [],
      blockedEmailPatterns: DEFAULT_BLOCKED_EMAIL_PATTERNS,
      skipAutoReplies: true,
      skipBulkMail: true,
      skipMarketingMail: true,
      minEntityConfidence: 0.6,
      minClassificationConfidence: 0.7,
      reviewLowConfidence: true,
      lowConfidenceThreshold: 0.5,
    };
  }

  /**
   * Create default filter config for an organization
   */
  async createDefaultConfig(
    orgId: string,
    businessModel: string = 'B2B',
  ): Promise<void> {
    const isB2B = businessModel === 'B2B';

    await this.prisma.emailFilterConfig.create({
      data: {
        orgId,
        personalDomainBlocklist: [], // Use defaults from code
        serviceProviderWhitelist: [], // Use defaults from code
        blockedEmailPatterns: [], // Use defaults from code
        skipAutoReplies: true,
        skipBulkMail: true,
        skipMarketingMail: true,
        minEntityConfidence: 0.6,
        minClassificationConfidence: 0.7,
        autoCreateCustomers: true,
        autoCreateVendors: true,
        requireManualReview: !isB2B, // B2C might want manual review
        reviewLowConfidence: true,
        lowConfidenceThreshold: 0.5,
      },
    });

    this.logger.log(`Created default email filter config for org ${orgId}`);
  }

  /**
   * Update filter config for an organization
   */
  async updateConfig(
    orgId: string,
    updates: Partial<FilterConfig>,
  ): Promise<void> {
    await this.prisma.emailFilterConfig.upsert({
      where: { orgId },
      update: updates,
      create: {
        orgId,
        ...updates,
      },
    });
  }

  /**
   * Add domain to blacklist
   */
  async addToBlacklist(orgId: string, domain: string): Promise<void> {
    const config = await this.prisma.emailFilterConfig.findUnique({
      where: { orgId },
    });

    const currentBlacklist = config?.customDomainBlacklist || [];
    if (!currentBlacklist.includes(domain.toLowerCase())) {
      await this.prisma.emailFilterConfig.upsert({
        where: { orgId },
        update: {
          customDomainBlacklist: [...currentBlacklist, domain.toLowerCase()],
        },
        create: {
          orgId,
          customDomainBlacklist: [domain.toLowerCase()],
        },
      });
    }
  }

  /**
   * Add domain to whitelist
   */
  async addToWhitelist(orgId: string, domain: string): Promise<void> {
    const config = await this.prisma.emailFilterConfig.findUnique({
      where: { orgId },
    });

    const currentWhitelist = config?.customDomainWhitelist || [];
    if (!currentWhitelist.includes(domain.toLowerCase())) {
      await this.prisma.emailFilterConfig.upsert({
        where: { orgId },
        update: {
          customDomainWhitelist: [...currentWhitelist, domain.toLowerCase()],
        },
        create: {
          orgId,
          customDomainWhitelist: [domain.toLowerCase()],
        },
      });
    }
  }

  // ==================== Private Helper Methods ====================

  private extractEmail(from: string): string | null {
    // Handle formats like "John Doe <john@example.com>" or just "john@example.com"
    const emailMatch = from.match(/<([^>]+)>/) || from.match(/([^\s<>]+@[^\s<>]+)/);
    return emailMatch ? emailMatch[1].toLowerCase() : null;
  }

  private extractDomain(email: string | null): string | null {
    if (!email) return null;
    const match = email.match(/@(.+)$/);
    return match ? match[1].toLowerCase() : null;
  }

  private isDomainInList(domain: string, list: string[]): boolean {
    return list.some(
      (d) => d.toLowerCase() === domain || domain.endsWith('.' + d.toLowerCase()),
    );
  }

  private isServiceProvider(domain: string, list: string[]): boolean {
    return this.isDomainInList(domain, list);
  }

  private isPersonalDomain(domain: string, list: string[]): boolean {
    return this.isDomainInList(domain, list);
  }

  private matchesBlockedPattern(
    email: string,
    patterns: string[],
  ): string | null {
    for (const pattern of patterns) {
      // Convert glob pattern to regex
      // e.g., "noreply@*" becomes /^noreply@.+$/i
      const regexPattern = pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars except *
        .replace(/\*/g, '.+'); // Convert * to .+

      const regex = new RegExp(`^${regexPattern}$`, 'i');
      if (regex.test(email)) {
        return pattern;
      }
    }
    return null;
  }

  private isAutoReply(headers: Record<string, string>): {
    isAutoReply: boolean;
    header?: string;
  } {
    for (const header of AUTO_REPLY_HEADERS) {
      if (headers[header] || headers[header.toLowerCase()]) {
        return { isAutoReply: true, header };
      }
    }

    // Check Auto-Submitted header value
    const autoSubmitted =
      headers['Auto-Submitted'] || headers['auto-submitted'];
    if (autoSubmitted && autoSubmitted !== 'no') {
      return { isAutoReply: true, header: 'Auto-Submitted' };
    }

    return { isAutoReply: false };
  }

  private isBulkMail(headers: Record<string, string>): {
    isBulk: boolean;
    indicator?: string;
  } {
    // Check Precedence header
    const precedence =
      headers['Precedence'] || headers['precedence'];
    if (
      precedence &&
      BULK_MAIL_INDICATORS['Precedence'].includes(precedence.toLowerCase())
    ) {
      return { isBulk: true, indicator: `Precedence: ${precedence}` };
    }

    // Check X-Mailer for known bulk mailers
    const xMailer = headers['X-Mailer'] || headers['x-mailer'];
    if (xMailer) {
      const mailerLower = xMailer.toLowerCase();
      for (const knownMailer of BULK_MAIL_INDICATORS['X-Mailer']) {
        if (mailerLower.includes(knownMailer)) {
          return { isBulk: true, indicator: `X-Mailer: ${xMailer}` };
        }
      }
    }

    // Check List-Unsubscribe (newsletter indicator)
    if (headers['List-Unsubscribe'] || headers['list-unsubscribe']) {
      return { isBulk: true, indicator: 'List-Unsubscribe present' };
    }

    // Check campaign headers
    if (headers['X-Campaign'] || headers['x-campaign']) {
      return { isBulk: true, indicator: 'X-Campaign present' };
    }

    if (headers['X-MC-User'] || headers['x-mc-user']) {
      return { isBulk: true, indicator: 'Mailchimp campaign' };
    }

    return { isBulk: false };
  }
}
