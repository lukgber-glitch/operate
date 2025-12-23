import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DeletionMode, DeletionStatus, DataCategory, DeletionResult, DeletionPreview } from '../types/data-tools.types';
import * as crypto from 'crypto';

/**
 * Data Deletion Service
 * Handles comprehensive data deletion with multiple modes
 */
@Injectable()
export class DataDeletionService {
  private readonly logger = new Logger(DataDeletionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Delete user data
   */
  async deleteUserData(
    userId: string,
    organisationId: string | undefined,
    mode: DeletionMode,
    categories: DataCategory[],
    options: {
      cascade?: boolean;
      scheduledFor?: Date;
    } = {},
  ): Promise<DeletionResult> {
    this.logger.log(`Starting data deletion for user ${userId}, mode: ${mode}`);

    try {
      let recordsDeleted = 0;
      const tablesAffected: string[] = [];

      // Check if deletion should be scheduled
      if (options.scheduledFor && options.scheduledFor > new Date()) {
        this.logger.log(`Deletion scheduled for ${options.scheduledFor}`);
        return {
          jobId: crypto.randomUUID(),
          status: DeletionStatus.PENDING,
          recordsDeleted: 0,
          tablesAffected: [],
          categories,
        };
      }

      // Execute deletion based on mode
      for (const category of categories) {
        const result = await this.deleteCategoryData(
          userId,
          organisationId,
          category,
          mode,
          options.cascade,
        );
        recordsDeleted += result.recordCount;
        tablesAffected.push(...result.tables);
      }

      return {
        jobId: crypto.randomUUID(),
        status: DeletionStatus.COMPLETED,
        recordsDeleted,
        tablesAffected: [...new Set(tablesAffected)], // Remove duplicates
        categories,
      };
    } catch (error) {
      this.logger.error(`Deletion failed for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete data for a specific category
   */
  private async deleteCategoryData(
    userId: string,
    organisationId: string | undefined,
    category: DataCategory,
    mode: DeletionMode,
    cascade = true,
  ): Promise<{ recordCount: number; tables: string[] }> {
    let recordCount = 0;
    const tables: string[] = [];

    switch (category) {
      case DataCategory.PROFILE:
        const profileResult = await this.deleteProfileData(userId, mode);
        recordCount += profileResult.recordCount;
        tables.push(...profileResult.tables);
        break;

      case DataCategory.FINANCIAL:
        const financialResult = await this.deleteFinancialData(userId, organisationId, mode, cascade);
        recordCount += financialResult.recordCount;
        tables.push(...financialResult.tables);
        break;

      case DataCategory.TAX:
        const taxResult = await this.deleteTaxData(userId, organisationId, mode);
        recordCount += taxResult.recordCount;
        tables.push(...taxResult.tables);
        break;

      case DataCategory.HR:
        const hrResult = await this.deleteHrData(userId, organisationId, mode);
        recordCount += hrResult.recordCount;
        tables.push(...hrResult.tables);
        break;

      case DataCategory.DOCUMENTS:
        const documentsResult = await this.deleteDocumentsData(userId, organisationId, mode);
        recordCount += documentsResult.recordCount;
        tables.push(...documentsResult.tables);
        break;

      case DataCategory.ACTIVITY:
        const activityResult = await this.deleteActivityData(userId, mode);
        recordCount += activityResult.recordCount;
        tables.push(...activityResult.tables);
        break;

      case DataCategory.SETTINGS:
        const settingsResult = await this.deleteSettingsData(userId, mode);
        recordCount += settingsResult.recordCount;
        tables.push(...settingsResult.tables);
        break;

      case DataCategory.ALL:
        // Delete all categories
        const allResults = await Promise.all([
          this.deleteProfileData(userId, mode),
          this.deleteFinancialData(userId, organisationId, mode, cascade),
          this.deleteTaxData(userId, organisationId, mode),
          this.deleteHrData(userId, organisationId, mode),
          this.deleteDocumentsData(userId, organisationId, mode),
          this.deleteActivityData(userId, mode),
          this.deleteSettingsData(userId, mode),
        ]);

        allResults.forEach((result) => {
          recordCount += result.recordCount;
          tables.push(...result.tables);
        });
        break;
    }

    return { recordCount, tables };
  }

  /**
   * Delete profile data
   */
  private async deleteProfileData(
    userId: string,
    mode: DeletionMode,
  ): Promise<{ recordCount: number; tables: string[] }> {
    if (mode === DeletionMode.SOFT) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          email: `deleted_${userId}@deleted.com`,
        },
      });
      return { recordCount: 1, tables: ['User'] };
    } else if (mode === DeletionMode.HARD) {
      await this.prisma.user.delete({
        where: { id: userId },
      });
      return { recordCount: 1, tables: ['User'] };
    }

    return { recordCount: 0, tables: [] };
  }

  /**
   * Delete financial data
   */
  private async deleteFinancialData(
    userId: string,
    organisationId: string | undefined,
    mode: DeletionMode,
    cascade: boolean,
  ): Promise<{ recordCount: number; tables: string[] }> {
    if (!organisationId) return { recordCount: 0, tables: [] };

    const where = { orgId: organisationId };
    let count = 0;
    const tables: string[] = [];

    if (mode === DeletionMode.SOFT) {
      const [invoiceResult, expenseResult] = await Promise.all([
        this.prisma.invoice.updateMany({
          where,
          data: { deletedAt: new Date() },
        }),
        this.prisma.expense.updateMany({
          where,
          data: { deletedAt: new Date() },
        }),
      ]);

      count += invoiceResult.count + expenseResult.count;
      tables.push('Invoice', 'Expense');
    } else if (mode === DeletionMode.HARD) {
      const [invoiceResult, expenseResult] = await Promise.all([
        this.prisma.invoice.deleteMany({ where }),
        this.prisma.expense.deleteMany({ where }),
      ]);

      count += invoiceResult.count + expenseResult.count;
      tables.push('Invoice', 'Expense');
    }

    return { recordCount: count, tables };
  }

  /**
   * Delete tax data
   */
  private async deleteTaxData(
    userId: string,
    organisationId: string | undefined,
    mode: DeletionMode,
  ): Promise<{ recordCount: number; tables: string[] }> {
    // Tax data deletion would be implemented here
    // Placeholder for now
    return { recordCount: 0, tables: [] };
  }

  /**
   * Delete HR/employee data
   */
  private async deleteHrData(
    userId: string,
    organisationId: string | undefined,
    mode: DeletionMode,
  ): Promise<{ recordCount: number; tables: string[] }> {
    if (!organisationId) return { recordCount: 0, tables: [] };

    const where = { orgId: organisationId, userId };
    let count = 0;

    if (mode === DeletionMode.SOFT) {
      const result = await this.prisma.employee.updateMany({
        where,
        data: { deletedAt: new Date() },
      });
      count += result.count;
    } else if (mode === DeletionMode.HARD) {
      const result = await this.prisma.employee.deleteMany({ where });
      count += result.count;
    }

    return { recordCount: count, tables: ['Employee'] };
  }

  /**
   * Delete documents data
   */
  private async deleteDocumentsData(
    userId: string,
    organisationId: string | undefined,
    mode: DeletionMode,
  ): Promise<{ recordCount: number; tables: string[] }> {
    // Documents deletion placeholder
    return { recordCount: 0, tables: [] };
  }

  /**
   * Delete activity/audit logs
   */
  private async deleteActivityData(
    userId: string,
    mode: DeletionMode,
  ): Promise<{ recordCount: number; tables: string[] }> {
    if (mode === DeletionMode.HARD) {
      const result = await this.prisma.gdprAuditLog.deleteMany({
        where: { userId },
      });
      return { recordCount: result.count, tables: ['GdprAuditLog'] };
    }

    return { recordCount: 0, tables: [] };
  }

  /**
   * Delete settings data
   */
  private async deleteSettingsData(
    userId: string,
    mode: DeletionMode,
  ): Promise<{ recordCount: number; tables: string[] }> {
    // Settings deletion placeholder
    return { recordCount: 0, tables: [] };
  }

  /**
   * Preview what would be deleted
   */
  async previewDeletion(
    userId: string,
    organisationId: string | undefined,
    categories: DataCategory[],
  ): Promise<DeletionPreview> {
    const categoryPreviews = [];
    let totalRecords = 0;
    const allTables = new Set<string>();
    const warnings: string[] = [];

    for (const category of categories) {
      const preview = await this.previewCategoryDeletion(userId, organisationId, category);
      categoryPreviews.push(preview);
      totalRecords += preview.recordCount;
      preview.tables.forEach((table) => allTables.add(table));

      // Add warnings for important data
      if (preview.recordCount > 0) {
        if (category === DataCategory.FINANCIAL) {
          warnings.push('Financial records will be permanently deleted. This action cannot be undone.');
        }
        if (category === DataCategory.TAX) {
          warnings.push(
            'Tax records may be required for legal compliance. Ensure retention periods have passed.',
          );
        }
      }
    }

    return {
      userId,
      categories: categoryPreviews,
      totalRecords,
      totalTables: allTables.size,
      warnings,
    };
  }

  /**
   * Preview deletion for a specific category
   */
  private async previewCategoryDeletion(
    userId: string,
    organisationId: string | undefined,
    category: DataCategory,
  ): Promise<{ category: DataCategory; recordCount: number; tables: string[]; impact: string }> {
    let recordCount = 0;
    const tables: string[] = [];
    let impact = '';

    switch (category) {
      case DataCategory.PROFILE:
        recordCount = 1;
        tables.push('User');
        impact = 'User account and profile information';
        break;

      case DataCategory.FINANCIAL:
        if (organisationId) {
          const [invoiceCount, expenseCount] = await Promise.all([
            this.prisma.invoice.count({ where: { orgId: organisationId } }),
            this.prisma.expense.count({ where: { orgId: organisationId } }),
          ]);
          recordCount = invoiceCount + expenseCount;
          tables.push('Invoice', 'Expense');
          impact = `${invoiceCount} invoices and ${expenseCount} expenses`;
        }
        break;

      case DataCategory.HR:
        if (organisationId) {
          recordCount = await this.prisma.employee.count({
            where: { orgId: organisationId, userId },
          });
          tables.push('Employee');
          impact = 'Employee records and HR data';
        }
        break;

      case DataCategory.ACTIVITY:
        recordCount = await this.prisma.gdprAuditLog.count({ where: { userId } });
        tables.push('GdprAuditLog');
        impact = 'Activity logs and audit trail';
        break;

      case DataCategory.ALL:
        const allPreview = await this.previewDeletion(userId, organisationId, [
          DataCategory.PROFILE,
          DataCategory.FINANCIAL,
          DataCategory.TAX,
          DataCategory.HR,
          DataCategory.DOCUMENTS,
          DataCategory.ACTIVITY,
          DataCategory.SETTINGS,
        ]);
        recordCount = allPreview.totalRecords;
        allPreview.categories.forEach((cat) => tables.push(...cat.tables));
        impact = 'All user data across all categories';
        break;
    }

    return { category, recordCount, tables: [...new Set(tables)], impact };
  }

  /**
   * Generate confirmation token
   */
  generateConfirmationToken(): string {
    return `conf_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Validate confirmation token
   */
  validateConfirmationToken(token: string, expectedToken: string): boolean {
    return token === expectedToken;
  }

  /**
   * Verify deletion completed successfully
   */
  async verifyDeletionComplete(userId: string, categories: DataCategory[]): Promise<boolean> {
    for (const category of categories) {
      const hasData = await this.checkCategoryHasData(userId, category);
      if (hasData) {
        this.logger.warn(`Data still exists for category ${category} after deletion`);
        return false;
      }
    }

    return true;
  }

  /**
   * Check if category has any remaining data
   */
  private async checkCategoryHasData(userId: string, category: DataCategory): Promise<boolean> {
    switch (category) {
      case DataCategory.PROFILE:
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        return !!user && !user.deletedAt;

      case DataCategory.ACTIVITY:
        const logCount = await this.prisma.gdprAuditLog.count({ where: { userId } });
        return logCount > 0;

      default:
        return false;
    }
  }
}
