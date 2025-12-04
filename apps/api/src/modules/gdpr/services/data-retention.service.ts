import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CreateRetentionPolicyDto,
  UpdateRetentionPolicyDto,
  QueryRetentionPolicyDto,
} from '../dto/retention-policy.dto';
import { DataCategory, GdprEventType, ActorType, RetentionPeriods } from '../types/gdpr.types';
import { AuditTrailService } from './audit-trail.service';

/**
 * Data Retention Service
 * Manages data retention policies and automatic deletion
 * Implements GDPR Article 5 (Storage Limitation)
 */
@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditTrail: AuditTrailService,
  ) {}

  /**
   * Create a retention policy
   */
  async createPolicy(dto: CreateRetentionPolicyDto, actorId?: string) {
    this.logger.log(`Creating retention policy for ${dto.dataCategory}`);

    try {
      // Check if policy already exists
      const existing = await this.prisma.dataRetentionPolicy.findUnique({
        where: {
          organisationId_dataCategory: {
            organisationId: dto.organisationId || null,
            dataCategory: dto.dataCategory,
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Retention policy for ${dto.dataCategory} already exists`,
        );
      }

      const policy = await this.prisma.dataRetentionPolicy.create({
        data: {
          organisationId: dto.organisationId,
          dataCategory: dto.dataCategory,
          retentionPeriod: dto.retentionPeriod,
          legalBasis: dto.legalBasis,
          description: dto.description,
          autoDelete: dto.autoDelete ?? false,
          isActive: true,
        },
      });

      // Log policy creation
      await this.auditTrail.logEvent({
        eventType: GdprEventType.RETENTION_POLICY_CREATED,
        organisationId: dto.organisationId,
        actorId: actorId || 'system',
        actorType: actorId ? ActorType.ADMIN : ActorType.SYSTEM,
        resourceType: 'DataRetentionPolicy',
        resourceId: policy.id,
        details: {
          dataCategory: dto.dataCategory,
          retentionPeriod: dto.retentionPeriod,
          legalBasis: dto.legalBasis,
          autoDelete: dto.autoDelete,
        },
      });

      this.logger.log(`Retention policy created: ${policy.id}`);
      return policy;
    } catch (error) {
      this.logger.error(`Failed to create retention policy: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update a retention policy
   */
  async updatePolicy(id: string, dto: UpdateRetentionPolicyDto, actorId?: string) {
    this.logger.log(`Updating retention policy ${id}`);

    try {
      const existing = await this.getPolicy(id);

      const policy = await this.prisma.dataRetentionPolicy.update({
        where: { id },
        data: dto,
      });

      // Log policy update
      await this.auditTrail.logEvent({
        eventType: GdprEventType.RETENTION_POLICY_UPDATED,
        organisationId: policy.organisationId,
        actorId: actorId || 'system',
        actorType: actorId ? ActorType.ADMIN : ActorType.SYSTEM,
        resourceType: 'DataRetentionPolicy',
        resourceId: policy.id,
        details: {
          dataCategory: policy.dataCategory,
          changes: dto,
          previousValues: {
            retentionPeriod: existing.retentionPeriod,
            autoDelete: existing.autoDelete,
            isActive: existing.isActive,
          },
        },
      });

      return policy;
    } catch (error) {
      this.logger.error(`Failed to update retention policy: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a policy by ID
   */
  async getPolicy(id: string) {
    const policy = await this.prisma.dataRetentionPolicy.findUnique({
      where: { id },
    });

    if (!policy) {
      throw new NotFoundException(`Retention policy ${id} not found`);
    }

    return policy;
  }

  /**
   * Get policy by category
   */
  async getPolicyByCategory(dataCategory: DataCategory, organisationId?: string) {
    const policy = await this.prisma.dataRetentionPolicy.findUnique({
      where: {
        organisationId_dataCategory: {
          organisationId: organisationId || null,
          dataCategory,
        },
      },
    });

    // If no org-specific policy, try to get global policy
    if (!policy && organisationId) {
      return this.prisma.dataRetentionPolicy.findUnique({
        where: {
          organisationId_dataCategory: {
            organisationId: null,
            dataCategory,
          },
        },
      });
    }

    return policy;
  }

  /**
   * Query retention policies
   */
  async queryPolicies(query: QueryRetentionPolicyDto) {
    const where: any = {};
    if (query.organisationId !== undefined) where.organisationId = query.organisationId;
    if (query.dataCategory) where.dataCategory = query.dataCategory;
    if (query.legalBasis) where.legalBasis = query.legalBasis;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.autoDelete !== undefined) where.autoDelete = query.autoDelete;

    return this.prisma.dataRetentionPolicy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all active policies
   */
  async getActivePolicies(organisationId?: string) {
    const where: any = { isActive: true };
    if (organisationId !== undefined) {
      where.organisationId = organisationId;
    }

    return this.prisma.dataRetentionPolicy.findMany({
      where,
      orderBy: { dataCategory: 'asc' },
    });
  }

  /**
   * Delete a policy
   */
  async deletePolicy(id: string, actorId?: string) {
    const policy = await this.getPolicy(id);

    await this.prisma.dataRetentionPolicy.delete({
      where: { id },
    });

    await this.auditTrail.logEvent({
      eventType: GdprEventType.RETENTION_POLICY_UPDATED,
      organisationId: policy.organisationId,
      actorId: actorId || 'system',
      actorType: actorId ? ActorType.ADMIN : ActorType.SYSTEM,
      resourceType: 'DataRetentionPolicy',
      resourceId: id,
      details: {
        action: 'deleted',
        dataCategory: policy.dataCategory,
      },
    });

    this.logger.log(`Retention policy deleted: ${id}`);
  }

  /**
   * Apply retention policy to a specific table/data category
   */
  async applyRetentionPolicy(
    dataCategory: DataCategory,
    organisationId?: string,
    dryRun = false,
  ) {
    this.logger.log(`Applying retention policy for ${dataCategory} (dry run: ${dryRun})`);

    const policy = await this.getPolicyByCategory(dataCategory, organisationId);

    if (!policy || !policy.isActive) {
      this.logger.warn(`No active policy found for ${dataCategory}`);
      return { deleted: 0, category: dataCategory, message: 'No active policy' };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod);

    this.logger.log(`Cutoff date for ${dataCategory}: ${cutoffDate.toISOString()}`);

    let deletedCount = 0;
    const tablesAffected: string[] = [];

    try {
      // Apply policy based on data category
      switch (dataCategory) {
        case DataCategory.LOGS:
          if (!dryRun && policy.autoDelete) {
            const result = await this.prisma.gdprAuditLog.deleteMany({
              where: {
                createdAt: { lt: cutoffDate },
                organisationId: organisationId || null,
              },
            });
            deletedCount = result.count;
            tablesAffected.push('gdpr_audit_logs');
          } else {
            deletedCount = await this.prisma.gdprAuditLog.count({
              where: {
                createdAt: { lt: cutoffDate },
                organisationId: organisationId || null,
              },
            });
          }
          break;

        case DataCategory.MARKETING_DATA:
          // Delete revoked consents older than retention period
          if (!dryRun && policy.autoDelete) {
            const result = await this.prisma.userConsent.deleteMany({
              where: {
                purpose: 'marketing',
                granted: false,
                revokedAt: { lt: cutoffDate },
              },
            });
            deletedCount = result.count;
            tablesAffected.push('user_consents');
          } else {
            deletedCount = await this.prisma.userConsent.count({
              where: {
                purpose: 'marketing',
                granted: false,
                revokedAt: { lt: cutoffDate },
              },
            });
          }
          break;

        case DataCategory.CUSTOMER_DATA:
          // This would require more complex logic to identify inactive customers
          this.logger.warn('Customer data retention requires manual review');
          break;

        case DataCategory.EMPLOYEE_DATA:
          // Employee data retention tied to employment end date
          this.logger.warn('Employee data retention requires manual review');
          break;

        default:
          this.logger.warn(`No retention logic implemented for ${dataCategory}`);
      }

      // Log execution
      if (!dryRun && deletedCount > 0) {
        await this.auditTrail.logEvent({
          eventType: GdprEventType.AUTO_DELETION_EXECUTED,
          organisationId,
          actorId: 'system',
          actorType: ActorType.AUTOMATED,
          resourceType: 'DataRetentionPolicy',
          resourceId: policy.id,
          details: {
            dataCategory,
            recordsDeleted: deletedCount,
            cutoffDate,
            tablesAffected,
          },
        });
      }

      return {
        policyId: policy.id,
        dataCategory,
        recordsDeleted: deletedCount,
        recordsAnonymized: 0,
        tablesAffected,
        cutoffDate,
        dryRun,
        executedAt: new Date(),
        success: true,
      };
    } catch (error) {
      this.logger.error(`Failed to apply retention policy: ${error.message}`, error.stack);
      return {
        policyId: policy.id,
        dataCategory,
        recordsDeleted: 0,
        recordsAnonymized: 0,
        tablesAffected: [],
        cutoffDate,
        dryRun,
        executedAt: new Date(),
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Run automatic cleanup for all policies with autoDelete enabled
   * Scheduled to run daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runAutomaticCleanup() {
    this.logger.log('Starting automatic data cleanup job');

    const policies = await this.prisma.dataRetentionPolicy.findMany({
      where: {
        isActive: true,
        autoDelete: true,
      },
    });

    this.logger.log(`Found ${policies.length} policies with auto-delete enabled`);

    const results = await Promise.all(
      policies.map((policy) =>
        this.applyRetentionPolicy(policy.dataCategory as DataCategory, policy.organisationId, false),
      ),
    );

    const totalDeleted = results.reduce((sum, result) => sum + result.recordsDeleted, 0);
    this.logger.log(`Automatic cleanup completed. Total records deleted: ${totalDeleted}`);

    return results;
  }

  /**
   * Get retention policy compliance status
   */
  async getComplianceStatus(organisationId?: string) {
    const policies = await this.getActivePolicies(organisationId);

    const status = await Promise.all(
      policies.map(async (policy) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod);

        // Count records that should be deleted
        let recordsToDelete = 0;
        switch (policy.dataCategory) {
          case DataCategory.LOGS:
            recordsToDelete = await this.prisma.gdprAuditLog.count({
              where: {
                createdAt: { lt: cutoffDate },
                organisationId: policy.organisationId || null,
              },
            });
            break;
          // Add more cases as needed
        }

        return {
          policyId: policy.id,
          dataCategory: policy.dataCategory,
          retentionPeriod: policy.retentionPeriod,
          autoDelete: policy.autoDelete,
          recordsToDelete,
          compliant: recordsToDelete === 0 || policy.autoDelete,
          lastChecked: new Date(),
        };
      }),
    );

    return {
      organisationId,
      totalPolicies: policies.length,
      compliantPolicies: status.filter((s) => s.compliant).length,
      policies: status,
    };
  }

  /**
   * Initialize default retention policies for an organisation
   */
  async initializeDefaultPolicies(organisationId?: string, actorId?: string) {
    this.logger.log(`Initializing default retention policies for org: ${organisationId}`);

    const defaultPolicies = [
      {
        dataCategory: DataCategory.FINANCIAL_RECORDS,
        retentionPeriod: RetentionPeriods.FINANCIAL_RECORDS,
        legalBasis: 'legal_obligation',
        description: 'Legal requirement to retain financial records for 10 years',
        autoDelete: false,
      },
      {
        dataCategory: DataCategory.EMPLOYEE_DATA,
        retentionPeriod: RetentionPeriods.EMPLOYEE_DATA,
        legalBasis: 'legal_obligation',
        description: 'Retain employee data for 7 years after employment ends',
        autoDelete: false,
      },
      {
        dataCategory: DataCategory.CUSTOMER_DATA,
        retentionPeriod: RetentionPeriods.CUSTOMER_DATA,
        legalBasis: 'legitimate_interests',
        description: 'Retain customer data for 3 years after last activity',
        autoDelete: false,
      },
      {
        dataCategory: DataCategory.LOGS,
        retentionPeriod: RetentionPeriods.LOGS,
        legalBasis: 'legitimate_interests',
        description: 'Security and audit logs retained for 90 days',
        autoDelete: true,
      },
    ];

    const results = [];
    for (const policyData of defaultPolicies) {
      try {
        const policy = await this.createPolicy(
          { ...policyData, organisationId } as CreateRetentionPolicyDto,
          actorId,
        );
        results.push(policy);
      } catch (error) {
        this.logger.warn(
          `Failed to create default policy for ${policyData.dataCategory}: ${error.message}`,
        );
      }
    }

    this.logger.log(`Initialized ${results.length} default policies`);
    return results;
  }
}
