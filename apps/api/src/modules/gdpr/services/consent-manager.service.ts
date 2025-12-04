import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  RecordConsentDto,
  UpdateConsentDto,
  RevokeConsentDto,
  QueryConsentDto,
} from '../dto/consent.dto';
import { ConsentPurpose, GdprEventType, ActorType } from '../types/gdpr.types';
import { AuditTrailService } from './audit-trail.service';

/**
 * Consent Manager Service
 * Manages user consent records for GDPR compliance
 * Implements Article 7 (Consent) requirements
 */
@Injectable()
export class ConsentManagerService {
  private readonly logger = new Logger(ConsentManagerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditTrail: AuditTrailService,
  ) {}

  /**
   * Record new user consent
   */
  async recordConsent(dto: RecordConsentDto) {
    this.logger.log(`Recording consent for user ${dto.userId}, purpose: ${dto.purpose}`);

    try {
      // Check if consent already exists
      const existing = await this.prisma.userConsent.findUnique({
        where: {
          userId_purpose: {
            userId: dto.userId,
            purpose: dto.purpose,
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Consent for purpose ${dto.purpose} already exists. Use update instead.`,
        );
      }

      // Create consent record
      const consent = await this.prisma.userConsent.create({
        data: {
          userId: dto.userId,
          purpose: dto.purpose,
          granted: dto.granted,
          grantedAt: dto.granted ? new Date() : null,
          revokedAt: null,
          source: dto.source,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
          version: dto.version,
        },
      });

      // Log to audit trail
      await this.auditTrail.logEvent({
        eventType: dto.granted ? GdprEventType.CONSENT_GRANTED : GdprEventType.CONSENT_REVOKED,
        userId: dto.userId,
        actorId: dto.userId,
        actorType: ActorType.USER,
        resourceType: 'UserConsent',
        resourceId: consent.id,
        details: {
          purpose: dto.purpose,
          granted: dto.granted,
          source: dto.source,
          version: dto.version,
        },
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      });

      this.logger.log(`Consent recorded successfully for user ${dto.userId}`);
      return consent;
    } catch (error) {
      this.logger.error(`Failed to record consent: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update existing consent
   */
  async updateConsent(userId: string, purpose: ConsentPurpose, dto: UpdateConsentDto) {
    this.logger.log(`Updating consent for user ${userId}, purpose: ${purpose}`);

    try {
      const existing = await this.prisma.userConsent.findUnique({
        where: {
          userId_purpose: {
            userId,
            purpose,
          },
        },
      });

      if (!existing) {
        throw new NotFoundException(`Consent record not found for purpose ${purpose}`);
      }

      const consent = await this.prisma.userConsent.update({
        where: {
          userId_purpose: {
            userId,
            purpose,
          },
        },
        data: {
          granted: dto.granted,
          grantedAt: dto.granted ? new Date() : existing.grantedAt,
          revokedAt: !dto.granted ? new Date() : null,
          version: dto.version || existing.version,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
        },
      });

      // Log to audit trail
      await this.auditTrail.logEvent({
        eventType: dto.granted ? GdprEventType.CONSENT_GRANTED : GdprEventType.CONSENT_REVOKED,
        userId,
        actorId: userId,
        actorType: ActorType.USER,
        resourceType: 'UserConsent',
        resourceId: consent.id,
        details: {
          purpose,
          granted: dto.granted,
          previousGranted: existing.granted,
          version: dto.version,
        },
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      });

      return consent;
    } catch (error) {
      this.logger.error(`Failed to update consent: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Revoke user consent
   */
  async revokeConsent(dto: RevokeConsentDto) {
    this.logger.log(`Revoking consent for user ${dto.userId}, purpose: ${dto.purpose}`);

    return this.updateConsent(dto.userId, dto.purpose, {
      granted: false,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
    });
  }

  /**
   * Get user's consent records
   */
  async getUserConsents(userId: string, purpose?: ConsentPurpose) {
    this.logger.log(`Fetching consents for user ${userId}`);

    const where: any = { userId };
    if (purpose) {
      where.purpose = purpose;
    }

    return this.prisma.userConsent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Query consent records
   */
  async queryConsents(query: QueryConsentDto) {
    this.logger.log(`Querying consent records`);

    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.purpose) where.purpose = query.purpose;
    if (query.granted !== undefined) where.granted = query.granted;
    if (query.version) where.version = query.version;

    return this.prisma.userConsent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check if user has granted consent for a purpose
   */
  async hasConsent(userId: string, purpose: ConsentPurpose): Promise<boolean> {
    const consent = await this.prisma.userConsent.findUnique({
      where: {
        userId_purpose: {
          userId,
          purpose,
        },
      },
    });

    return consent?.granted ?? false;
  }

  /**
   * Get all consents for a user (for data export)
   */
  async getAllUserConsents(userId: string) {
    return this.prisma.userConsent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Bulk revoke all consents for a user (for data deletion)
   */
  async revokeAllConsents(userId: string, actorId?: string) {
    this.logger.log(`Revoking all consents for user ${userId}`);

    const consents = await this.prisma.userConsent.findMany({
      where: { userId, granted: true },
    });

    const results = await Promise.all(
      consents.map((consent) =>
        this.prisma.userConsent.update({
          where: { id: consent.id },
          data: {
            granted: false,
            revokedAt: new Date(),
          },
        }),
      ),
    );

    // Log bulk revocation
    await this.auditTrail.logEvent({
      eventType: GdprEventType.CONSENT_REVOKED,
      userId,
      actorId: actorId || userId,
      actorType: actorId ? ActorType.ADMIN : ActorType.USER,
      resourceType: 'UserConsent',
      details: {
        action: 'bulk_revoke',
        count: results.length,
        purposes: consents.map((c) => c.purpose),
      },
    });

    return results;
  }

  /**
   * Get consent statistics
   */
  async getConsentStats(organisationId?: string) {
    const stats = await this.prisma.userConsent.groupBy({
      by: ['purpose', 'granted'],
      _count: true,
    });

    return stats.reduce((acc, stat) => {
      if (!acc[stat.purpose]) {
        acc[stat.purpose] = { granted: 0, revoked: 0 };
      }
      if (stat.granted) {
        acc[stat.purpose].granted = stat._count;
      } else {
        acc[stat.purpose].revoked = stat._count;
      }
      return acc;
    }, {} as Record<string, { granted: number; revoked: number }>);
  }
}
