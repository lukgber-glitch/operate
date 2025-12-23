import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SevDeskParserService } from './sevdesk-parser.service';
import { SevDeskMapperService } from './sevdesk-mapper.service';
import {
  SevDeskEntityType,
  SevDeskMigrationJob,
  SevDeskMigrationStatus,
  SevDeskMigrationResult,
  SevDeskMigrationSummary,
  ParsedSevDeskData,
} from './sevdesk.types';
import { SEVDESK_BATCH_SIZE } from './sevdesk.constants';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * sevDesk Migration Service
 * Orchestrates the migration process from sevDesk to Operate
 */
@Injectable()
export class SevDeskMigrationService {
  private readonly logger = new Logger(SevDeskMigrationService.name);
  private migrations: Map<string, SevDeskMigrationJob> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: SevDeskParserService,
    private readonly mapper: SevDeskMapperService,
  ) {}

  /**
   * Create new migration job
   */
  async createMigrationJob(
    organizationId: string,
    userId: string,
    filePath: string,
    fileName: string,
    entityType: SevDeskEntityType,
    dryRun: boolean = true,
  ): Promise<SevDeskMigrationJob> {
    const jobId = uuidv4();

    const job: SevDeskMigrationJob = {
      id: jobId,
      organizationId,
      userId,
      status: SevDeskMigrationStatus.PENDING,
      entityType,
      fileName,
      totalRecords: 0,
      processedRecords: 0,
      successfulRecords: 0,
      failedRecords: 0,
      dryRun,
      createdAt: new Date(),
    };

    this.migrations.set(jobId, job);

    this.logger.log(`Created migration job ${jobId} for ${entityType} (dry-run: ${dryRun})`);

    return job;
  }

  /**
   * Execute migration preview (dry-run)
   */
  async preview(
    jobId: string,
    filePath: string,
  ): Promise<SevDeskMigrationJob> {
    const job = this.migrations.get(jobId);
    if (!job) {
      throw new NotFoundException(`Migration job ${jobId} not found`);
    }

    try {
      job.status = SevDeskMigrationStatus.VALIDATING;
      job.startedAt = new Date();

      // Parse file
      const parsedData = await this.parser.parseFile(filePath, job.entityType);

      // Get data array based on entity type
      const data = this.getDataByEntityType(parsedData, job.entityType);
      job.totalRecords = data.length;

      // Validate data
      const validationReport = this.mapper.validate(data, job.entityType);
      job.validationReport = validationReport;

      job.status = validationReport.valid
        ? SevDeskMigrationStatus.COMPLETED
        : SevDeskMigrationStatus.FAILED;
      job.completedAt = new Date();

      this.logger.log(
        `Preview completed for job ${jobId}: ${validationReport.validRecords}/${validationReport.totalRecords} valid records`,
      );

      return job;
    } catch (error) {
      job.status = SevDeskMigrationStatus.FAILED;
      job.error = error.message;
      job.completedAt = new Date();
      this.logger.error(`Preview failed for job ${jobId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Execute migration
   */
  async execute(
    jobId: string,
    filePath: string,
  ): Promise<SevDeskMigrationJob> {
    const job = this.migrations.get(jobId);
    if (!job) {
      throw new NotFoundException(`Migration job ${jobId} not found`);
    }

    if (job.dryRun) {
      throw new Error('Cannot execute migration in dry-run mode. Create a new job with dryRun=false');
    }

    try {
      job.status = SevDeskMigrationStatus.PROCESSING;
      job.startedAt = new Date();

      const startTime = Date.now();

      // Parse file
      const parsedData = await this.parser.parseFile(filePath, job.entityType);
      const data = this.getDataByEntityType(parsedData, job.entityType);
      job.totalRecords = data.length;

      // Execute migration based on entity type
      const results = await this.migrateData(
        data,
        job.entityType,
        job.organizationId,
      );

      // Calculate summary
      const summary: SevDeskMigrationSummary = {
        totalRecords: data.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        skipped: 0,
        warnings: results.filter(r => r.warnings && r.warnings.length > 0).length,
        results,
        duration: Date.now() - startTime,
        startTime: new Date(startTime),
        endTime: new Date(),
      };

      job.migrationSummary = summary;
      job.successfulRecords = summary.successful;
      job.failedRecords = summary.failed;
      job.processedRecords = data.length;
      job.status = SevDeskMigrationStatus.COMPLETED;
      job.completedAt = new Date();

      this.logger.log(
        `Migration completed for job ${jobId}: ${summary.successful}/${summary.totalRecords} successful`,
      );

      // Clean up uploaded file
      this.cleanupFile(filePath);

      return job;
    } catch (error) {
      job.status = SevDeskMigrationStatus.FAILED;
      job.error = error.message;
      job.completedAt = new Date();
      this.logger.error(`Migration failed for job ${jobId}: ${error.message}`, error.stack);
      this.cleanupFile(filePath);
      throw error;
    }
  }

  /**
   * Migrate data based on entity type
   */
  private async migrateData(
    data: any[],
    entityType: SevDeskEntityType,
    organizationId: string,
  ): Promise<SevDeskMigrationResult[]> {
    const results: SevDeskMigrationResult[] = [];

    // Process in batches
    for (let i = 0; i < data.length; i += SEVDESK_BATCH_SIZE) {
      const batch = data.slice(i, i + SEVDESK_BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(item => this.migrateItem(item, entityType, organizationId)),
      );

      results.push(...batchResults);

      this.logger.log(
        `Processed batch ${Math.floor(i / SEVDESK_BATCH_SIZE) + 1}: ${i + batch.length}/${data.length}`,
      );
    }

    return results;
  }

  /**
   * Migrate single item
   */
  private async migrateItem(
    item: any,
    entityType: SevDeskEntityType,
    organizationId: string,
  ): Promise<SevDeskMigrationResult> {
    try {
      let operateId: string;

      switch (entityType) {
        case SevDeskEntityType.CONTACT:
          operateId = await this.migrateContact(item, organizationId);
          break;
        case SevDeskEntityType.INVOICE:
          operateId = await this.migrateInvoice(item, organizationId);
          break;
        case SevDeskEntityType.EXPENSE:
          operateId = await this.migrateExpense(item, organizationId);
          break;
        case SevDeskEntityType.PRODUCT:
          operateId = await this.migrateProduct(item, organizationId);
          break;
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }

      return {
        entityType,
        success: true,
        sevDeskId: item.id,
        operateId,
      };
    } catch (error) {
      return {
        entityType,
        success: false,
        sevDeskId: item.id,
        error: error.message,
      };
    }
  }

  /**
   * Migrate contact
   */
  private async migrateContact(contact: any, organizationId: string): Promise<string> {
    const mapped = this.mapper.mapContact(contact, organizationId);

    // Check for duplicates
    const existing = await this.prisma.clientContact.findFirst({
      where: {
        organizationId,
        OR: [
          { email: mapped.email },
          { customerNumber: mapped.customerNumber },
        ],
      },
    });

    if (existing) {
      this.logger.warn(`Duplicate contact found: ${mapped.email || mapped.customerNumber}`);
      return existing.id;
    }

    const created = await this.prisma.clientContact.create({
      data: mapped,
    });

    return created.id;
  }

  /**
   * Migrate invoice
   */
  private async migrateInvoice(invoice: any, organizationId: string): Promise<string> {
    // Find or create contact
    let contactId: string | undefined;

    if (invoice.contactName) {
      const contact = await this.prisma.clientContact.findFirst({
        where: {
          organizationId,
          name: { contains: invoice.contactName, mode: 'insensitive' },
        },
      });
      contactId = contact?.id;
    }

    const mapped = this.mapper.mapInvoice(invoice, organizationId, contactId);

    // Check for duplicates
    const existing = await this.prisma.invoice.findFirst({
      where: {
        organizationId,
        invoiceNumber: mapped.invoiceNumber,
      },
    });

    if (existing) {
      this.logger.warn(`Duplicate invoice found: ${mapped.invoiceNumber}`);
      return existing.id;
    }

    const created = await this.prisma.invoice.create({
      data: {
        ...mapped,
        lineItems: {
          create: mapped.lineItems,
        },
      },
    });

    return created.id;
  }

  /**
   * Migrate expense
   */
  private async migrateExpense(expense: any, organizationId: string): Promise<string> {
    const mapped = this.mapper.mapExpense(expense, organizationId);

    const created = await this.prisma.expense.create({
      data: mapped,
    });

    return created.id;
  }

  /**
   * Migrate product
   */
  private async migrateProduct(product: any, organizationId: string): Promise<string> {
    const mapped = this.mapper.mapProduct(product, organizationId);

    // Check for duplicates
    const existing = await this.prisma.product.findFirst({
      where: {
        organizationId,
        OR: [
          { sku: mapped.sku },
          { name: mapped.name },
        ],
      },
    });

    if (existing) {
      this.logger.warn(`Duplicate product found: ${mapped.sku || mapped.name}`);
      return existing.id;
    }

    const created = await this.prisma.product.create({
      data: mapped,
    });

    return created.id;
  }

  /**
   * Get migration job status
   */
  async getJobStatus(jobId: string): Promise<SevDeskMigrationJob> {
    const job = this.migrations.get(jobId);
    if (!job) {
      throw new NotFoundException(`Migration job ${jobId} not found`);
    }
    return job;
  }

  /**
   * Rollback migration
   */
  async rollback(jobId: string): Promise<void> {
    const job = this.migrations.get(jobId);
    if (!job) {
      throw new NotFoundException(`Migration job ${jobId} not found`);
    }

    if (!job.migrationSummary) {
      throw new Error('No migration data to rollback');
    }

    this.logger.log(`Starting rollback for job ${jobId}`);

    try {
      const results = job.migrationSummary.results;
      const successfulIds = results
        .filter(r => r.success && r.operateId)
        .map(r => r.operateId!);

      // Delete migrated records based on entity type
      switch (job.entityType) {
        case SevDeskEntityType.CONTACT:
          await this.prisma.clientContact.deleteMany({
            where: { id: { in: successfulIds } },
          });
          break;
        case SevDeskEntityType.INVOICE:
          await this.prisma.invoice.deleteMany({
            where: { id: { in: successfulIds } },
          });
          break;
        case SevDeskEntityType.EXPENSE:
          await this.prisma.expense.deleteMany({
            where: { id: { in: successfulIds } },
          });
          break;
        case SevDeskEntityType.PRODUCT:
          await this.prisma.product.deleteMany({
            where: { id: { in: successfulIds } },
          });
          break;
      }

      job.status = SevDeskMigrationStatus.ROLLED_BACK;
      this.logger.log(`Rollback completed for job ${jobId}: ${successfulIds.length} records deleted`);
    } catch (error) {
      this.logger.error(`Rollback failed for job ${jobId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get data array by entity type
   */
  private getDataByEntityType(parsedData: ParsedSevDeskData, entityType: SevDeskEntityType): any[] {
    switch (entityType) {
      case SevDeskEntityType.CONTACT:
        return parsedData.contacts;
      case SevDeskEntityType.INVOICE:
        return parsedData.invoices;
      case SevDeskEntityType.EXPENSE:
        return parsedData.expenses;
      case SevDeskEntityType.PRODUCT:
        return parsedData.products;
      default:
        return [];
    }
  }

  /**
   * Clean up temporary files
   */
  private cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Cleaned up file: ${filePath}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to cleanup file ${filePath}: ${error.message}`);
    }
  }
}
