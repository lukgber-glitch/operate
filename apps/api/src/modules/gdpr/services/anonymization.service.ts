import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GdprEventType, ActorType } from '../types/gdpr.types';
import { AuditTrailService } from './audit-trail.service';
import { ConsentManagerService } from './consent-manager.service';
import * as crypto from 'crypto';

/**
 * Anonymization Service
 * Implements GDPR Article 17 (Right to Erasure / Right to be Forgotten)
 * Handles secure data deletion and anonymization
 */
@Injectable()
export class AnonymizationService {
  private readonly logger = new Logger(AnonymizationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditTrail: AuditTrailService,
    private readonly consentManager: ConsentManagerService,
  ) {}

  /**
   * Anonymize a user (Right to be forgotten)
   */
  async anonymizeUser(userId: string, actorId?: string, reason?: string) {
    this.logger.log(`Starting anonymization for user ${userId}`);

    try {
      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      const tablesAffected: string[] = [];
      let recordsAnonymized = 0;

      // Use a transaction to ensure atomicity
      await this.prisma.$transaction(async (tx) => {
        // 1. Anonymize user profile
        await tx.user.update({
          where: { id: userId },
          data: {
            email: `anonymized_${this.generateAnonymousId()}@deleted.local`,
            firstName: 'Anonymized',
            lastName: 'User',
            passwordHash: null,
            avatarUrl: null,
            mfaSecret: null,
            backupCodes: [],
            deletedAt: new Date(),
          },
        });
        tablesAffected.push('users');
        recordsAnonymized++;

        // 2. Delete sessions
        const sessionsDeleted = await tx.session.deleteMany({
          where: { userId },
        });
        if (sessionsDeleted.count > 0) {
          tablesAffected.push('sessions');
          recordsAnonymized += sessionsDeleted.count;
        }

        // 3. Delete OAuth accounts
        const oauthDeleted = await tx.oAuthAccount.deleteMany({
          where: { userId },
        });
        if (oauthDeleted.count > 0) {
          tablesAffected.push('oauth_accounts');
          recordsAnonymized += oauthDeleted.count;
        }

        // 4. Revoke all consents
        await this.consentManager.revokeAllConsents(userId, actorId);
        tablesAffected.push('user_consents');

        // 5. Anonymize employee records (keep for legal/compliance but anonymize personal data)
        const employeesUpdated = await tx.employee.updateMany({
          where: { userId },
          data: {
            firstName: 'Anonymized',
            lastName: 'Employee',
            email: `anonymized_${this.generateAnonymousId()}@deleted.local`,
            phone: null,
            address: null,
            // Keep employment history for compliance but anonymize identity
          },
        });
        if (employeesUpdated.count > 0) {
          tablesAffected.push('employees');
          recordsAnonymized += employeesUpdated.count;
        }

        // 6. Anonymize memberships (keep org relationship but remove user link)
        const membershipsDeleted = await tx.membership.deleteMany({
          where: { userId },
        });
        if (membershipsDeleted.count > 0) {
          tablesAffected.push('memberships');
          recordsAnonymized += membershipsDeleted.count;
        }

        // 7. Keep audit logs but anonymize user reference in details
        // (Required for compliance - can't delete audit logs)
        const auditLogsUpdated = await tx.gdprAuditLog.updateMany({
          where: { userId },
          data: {
            userId: null, // Remove user reference but keep the log
          },
        });
        if (auditLogsUpdated.count > 0) {
          tablesAffected.push('gdpr_audit_logs');
        }

        // 8. Mark data subject requests as anonymized
        await tx.dataSubjectRequest.updateMany({
          where: { userId },
          data: {
            metadata: {
              anonymized: true,
              anonymizedAt: new Date(),
            },
          },
        });
      });

      // Log anonymization (after transaction to ensure it was successful)
      await this.auditTrail.logEvent({
        eventType: GdprEventType.DATA_ANONYMIZED,
        userId: null, // User is now anonymized
        actorId: actorId || 'system',
        actorType: actorId ? ActorType.ADMIN : ActorType.SYSTEM,
        resourceType: 'User',
        resourceId: userId,
        details: {
          reason,
          recordsAnonymized,
          tablesAffected,
          originalUserId: userId,
        },
      });

      this.logger.log(`User ${userId} anonymized successfully. ${recordsAnonymized} records affected.`);

      return {
        userId,
        anonymizedAt: new Date(),
        recordsAnonymized,
        tablesAffected,
        success: true,
      };
    } catch (error) {
      this.logger.error(`Failed to anonymize user: ${error.message}`, error.stack);
      return {
        userId,
        anonymizedAt: new Date(),
        recordsAnonymized: 0,
        tablesAffected: [],
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Hard delete user (complete erasure)
   * WARNING: This permanently deletes all data. Use with caution.
   */
  async hardDeleteUser(userId: string, actorId?: string, reason?: string) {
    this.logger.warn(`HARD DELETE requested for user ${userId}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      const tablesAffected: string[] = [];
      let recordsDeleted = 0;

      // Log BEFORE deletion
      await this.auditTrail.logEvent({
        eventType: GdprEventType.DATA_DELETED,
        userId,
        actorId: actorId || 'system',
        actorType: actorId ? ActorType.ADMIN : ActorType.SYSTEM,
        resourceType: 'User',
        resourceId: userId,
        details: {
          reason,
          email: user.email,
          deletionType: 'hard_delete',
        },
      });

      // Use transaction for atomic deletion
      await this.prisma.$transaction(async (tx) => {
        // Delete in reverse order of dependencies

        // Sessions
        const sessionsDeleted = await tx.session.deleteMany({ where: { userId } });
        if (sessionsDeleted.count > 0) {
          tablesAffected.push('sessions');
          recordsDeleted += sessionsDeleted.count;
        }

        // OAuth accounts
        const oauthDeleted = await tx.oAuthAccount.deleteMany({ where: { userId } });
        if (oauthDeleted.count > 0) {
          tablesAffected.push('oauth_accounts');
          recordsDeleted += oauthDeleted.count;
        }

        // Consents
        const consentsDeleted = await tx.userConsent.deleteMany({ where: { userId } });
        if (consentsDeleted.count > 0) {
          tablesAffected.push('user_consents');
          recordsDeleted += consentsDeleted.count;
        }

        // Memberships
        const membershipsDeleted = await tx.membership.deleteMany({ where: { userId } });
        if (membershipsDeleted.count > 0) {
          tablesAffected.push('memberships');
          recordsDeleted += membershipsDeleted.count;
        }

        // Data Subject Requests
        const dsrDeleted = await tx.dataSubjectRequest.deleteMany({ where: { userId } });
        if (dsrDeleted.count > 0) {
          tablesAffected.push('data_subject_requests');
          recordsDeleted += dsrDeleted.count;
        }

        // Finally, delete the user
        await tx.user.delete({ where: { id: userId } });
        tablesAffected.push('users');
        recordsDeleted++;
      });

      this.logger.warn(`User ${userId} HARD DELETED. ${recordsDeleted} records removed permanently.`);

      return {
        userId,
        deletedAt: new Date(),
        recordsDeleted,
        tablesAffected,
        success: true,
      };
    } catch (error) {
      this.logger.error(`Failed to hard delete user: ${error.message}`, error.stack);
      return {
        userId,
        deletedAt: new Date(),
        recordsDeleted: 0,
        tablesAffected: [],
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Pseudonymize specific user data
   * Replaces personal data with pseudonyms while maintaining referential integrity
   */
  async pseudonymizeUserData(userId: string, fields: string[]) {
    this.logger.log(`Pseudonymizing fields for user ${userId}: ${fields.join(', ')}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const updateData: any = {};
    const pseudonyms: Record<string, string> = {};

    for (const field of fields) {
      const pseudonym = this.generatePseudonym(field);
      pseudonyms[field] = pseudonym;

      switch (field) {
        case 'email':
          updateData.email = `${pseudonym}@pseudonym.local`;
          break;
        case 'firstName':
          updateData.firstName = pseudonym;
          break;
        case 'lastName':
          updateData.lastName = pseudonym;
          break;
        case 'phone':
          // If we had phone field
          break;
        default:
          this.logger.warn(`Unknown field for pseudonymization: ${field}`);
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    await this.auditTrail.logEvent({
      eventType: GdprEventType.DATA_ANONYMIZED,
      userId,
      actorId: 'system',
      actorType: ActorType.SYSTEM,
      resourceType: 'User',
      resourceId: userId,
      details: {
        operation: 'pseudonymization',
        fields,
        pseudonyms,
      },
    });

    return {
      userId,
      pseudonymizedFields: fields,
      pseudonyms,
      updatedAt: new Date(),
    };
  }

  /**
   * Generate anonymous ID
   */
  private generateAnonymousId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate pseudonym
   */
  private generatePseudonym(field: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(field + Date.now() + Math.random());
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * Check if user is already anonymized
   */
  async isUserAnonymized(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return false;

    return (
      user.email.includes('anonymized_') &&
      user.firstName === 'Anonymized' &&
      user.deletedAt !== null
    );
  }

  /**
   * Anonymize data in bulk (for retention policy compliance)
   */
  async bulkAnonymizeUsers(userIds: string[], actorId?: string) {
    this.logger.log(`Bulk anonymization started for ${userIds.length} users`);

    const results = await Promise.allSettled(
      userIds.map((userId) => this.anonymizeUser(userId, actorId, 'bulk_retention_policy')),
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    this.logger.log(`Bulk anonymization completed. Success: ${successful}, Failed: ${failed}`);

    return {
      total: userIds.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Get anonymization preview (what would be anonymized)
   */
  async getAnonymizationPreview(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: true,
        sessions: true,
        oauthAccounts: true,
        employees: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    return {
      userId,
      estimatedRecordsAffected: {
        user: 1,
        memberships: user.memberships.length,
        sessions: user.sessions.length,
        oauthAccounts: user.oauthAccounts.length,
        employees: user.employees.length,
      },
      tablesAffected: [
        'users',
        'memberships',
        'sessions',
        'oauth_accounts',
        'user_consents',
        'employees',
      ],
      willAnonymize: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      willDelete: {
        sessions: user.sessions.length,
        oauthAccounts: user.oauthAccounts.length,
      },
    };
  }
}
