import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AnonymizationResult } from '../types/data-tools.types';
import * as crypto from 'crypto';

/**
 * Data Anonymizer Service
 * Handles GDPR-compliant data anonymization
 */
@Injectable()
export class DataAnonymizerService {
  private readonly logger = new Logger(DataAnonymizerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Anonymize user data while preserving statistical value
   */
  async anonymizeUserData(
    userId: string,
    organisationId?: string,
  ): Promise<AnonymizationResult> {
    this.logger.log(`Starting anonymization for user ${userId}`);

    const tablesAffected: string[] = [];
    const fieldsAnonymized: string[] = [];
    let recordsAnonymized = 0;
    const errors: string[] = [];

    try {
      // Anonymize User profile
      const userResult = await this.anonymizeUserProfile(userId);
      if (userResult.success) {
        tablesAffected.push('User');
        fieldsAnonymized.push(...userResult.fields);
        recordsAnonymized += userResult.count;
      } else if (userResult.error) {
        errors.push(userResult.error);
      }

      // Anonymize Employee records
      if (organisationId) {
        const employeeResult = await this.anonymizeEmployeeRecords(userId, organisationId);
        if (employeeResult.success) {
          tablesAffected.push('Employee');
          fieldsAnonymized.push(...employeeResult.fields);
          recordsAnonymized += employeeResult.count;
        } else if (employeeResult.error) {
          errors.push(employeeResult.error);
        }
      }

      // Anonymize audit logs (keep structure but remove PII)
      const auditResult = await this.anonymizeAuditLogs(userId);
      if (auditResult.success) {
        tablesAffected.push('GdprAuditLog');
        fieldsAnonymized.push(...auditResult.fields);
        recordsAnonymized += auditResult.count;
      } else if (auditResult.error) {
        errors.push(auditResult.error);
      }

      return {
        userId,
        anonymizedAt: new Date(),
        recordsAnonymized,
        tablesAffected: [...new Set(tablesAffected)],
        fieldsAnonymized: [...new Set(fieldsAnonymized)],
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error(`Anonymization failed: ${error.message}`, error.stack);
      return {
        userId,
        anonymizedAt: new Date(),
        recordsAnonymized,
        tablesAffected,
        fieldsAnonymized,
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Anonymize user profile
   */
  private async anonymizeUserProfile(
    userId: string,
  ): Promise<{ success: boolean; count: number; fields: string[]; error?: string }> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `anonymized_${this.generateAnonymousId()}@anonymized.local`,
          firstName: this.anonymizeString('FirstName'),
          lastName: this.anonymizeString('LastName'),
          phoneNumber: this.anonymizePhoneNumber(),
          address: null,
          city: null,
          postalCode: null,
          dateOfBirth: null,
          taxId: null,
          deletedAt: new Date(),
        },
      });

      return {
        success: true,
        count: 1,
        fields: ['email', 'firstName', 'lastName', 'phoneNumber', 'address', 'dateOfBirth', 'taxId'],
      };
    } catch (error) {
      this.logger.error(`Failed to anonymize user profile: ${error.message}`);
      return { success: false, count: 0, fields: [], error: error.message };
    }
  }

  /**
   * Anonymize employee records
   */
  private async anonymizeEmployeeRecords(
    userId: string,
    organisationId: string,
  ): Promise<{ success: boolean; count: number; fields: string[]; error?: string }> {
    try {
      const result = await this.prisma.employee.updateMany({
        where: { orgId: organisationId, userId },
        data: {
          firstName: this.anonymizeString('Employee'),
          lastName: this.anonymizeString('Name'),
          email: `anonymized_${this.generateAnonymousId()}@anonymized.local`,
          phoneNumber: this.anonymizePhoneNumber(),
          ssn: this.anonymizeSsn(),
          taxId: null,
          address: null,
          emergencyContactName: null,
          emergencyContactPhone: null,
          deletedAt: new Date(),
        },
      });

      return {
        success: true,
        count: result.count,
        fields: ['firstName', 'lastName', 'email', 'phoneNumber', 'ssn', 'taxId', 'address'],
      };
    } catch (error) {
      this.logger.error(`Failed to anonymize employee records: ${error.message}`);
      return { success: false, count: 0, fields: [], error: error.message };
    }
  }

  /**
   * Anonymize audit logs
   */
  private async anonymizeAuditLogs(
    userId: string,
  ): Promise<{ success: boolean; count: number; fields: string[]; error?: string }> {
    try {
      const result = await this.prisma.gdprAuditLog.updateMany({
        where: { userId },
        data: {
          ipAddress: this.anonymizeIpAddress(),
          userAgent: 'Anonymized User Agent',
          details: {},
        },
      });

      return {
        success: true,
        count: result.count,
        fields: ['ipAddress', 'userAgent', 'details'],
      };
    } catch (error) {
      this.logger.error(`Failed to anonymize audit logs: ${error.message}`);
      return { success: false, count: 0, fields: [], error: error.message };
    }
  }

  /**
   * Generate anonymous ID
   */
  private generateAnonymousId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Anonymize string while preserving format
   */
  private anonymizeString(prefix: string): string {
    return `${prefix}_${this.generateAnonymousId()}`;
  }

  /**
   * Anonymize phone number
   */
  private anonymizePhoneNumber(): string {
    return '+1-XXX-XXX-XXXX';
  }

  /**
   * Anonymize SSN/Tax ID
   */
  private anonymizeSsn(): string {
    return 'XXX-XX-XXXX';
  }

  /**
   * Anonymize IP address
   */
  private anonymizeIpAddress(): string {
    return '0.0.0.0';
  }

  /**
   * Anonymize email address
   */
  private anonymizeEmail(): string {
    return `anonymized_${this.generateAnonymousId()}@anonymized.local`;
  }

  /**
   * Check if data is already anonymized
   */
  async isDataAnonymized(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, deletedAt: true },
    });

    if (!user) return true; // User doesn't exist, consider it anonymized

    return user.email.includes('anonymized') || !!user.deletedAt;
  }

  /**
   * Get anonymization statistics
   */
  async getAnonymizationStats(organisationId?: string): Promise<{
    totalAnonymized: number;
    byTable: Record<string, number>;
  }> {
    const where = organisationId ? { deletedAt: { not: null } } : {};

    const [userCount, employeeCount, auditLogCount] = await Promise.all([
      this.prisma.user.count({
        where: { deletedAt: { not: null }, email: { contains: 'anonymized' } },
      }),
      organisationId
        ? this.prisma.employee.count({
            where: { orgId: organisationId, deletedAt: { not: null } },
          })
        : 0,
      this.prisma.gdprAuditLog.count({
        where: { ipAddress: '0.0.0.0' },
      }),
    ]);

    return {
      totalAnonymized: userCount + employeeCount + auditLogCount,
      byTable: {
        User: userCount,
        Employee: employeeCount,
        GdprAuditLog: auditLogCount,
      },
    };
  }
}
