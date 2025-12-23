/**
 * DATEV Import Service
 * Main orchestrator for importing DATEV ASCII CSV files
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { DatevImportParserService } from './datev-import-parser.service';
import { DatevImportMapperService } from './datev-import-mapper.service';
import {
  DatevImportFileType,
  DatevImportStatus,
  DatevImportJob,
  DatevImportAnalysis,
  DatevImportPreview,
  DatevImportResult,
  DatevImportOptions,
  DatevImportMapping,
  ParsedDatevBooking,
  ParsedDatevAccountLabel,
  ParsedDatevBusinessPartner,
} from './datev-import.types';
import {
  MAX_FILE_SIZE,
  SUPPORTED_FILE_EXTENSIONS,
  DEFAULT_IMPORT_BATCH_SIZE,
} from './datev-import.constants';
import * as path from 'path';

@Injectable()
export class DatevImportService {
  private readonly logger = new Logger(DatevImportService.name);
  private readonly importJobs = new Map<string, DatevImportJob>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly parserService: DatevImportParserService,
    private readonly mapperService: DatevImportMapperService,
  ) {}

  /**
   * Analyze uploaded DATEV file
   */
  async analyzeFile(
    buffer: Buffer,
    filename: string,
    orgId: string,
  ): Promise<DatevImportAnalysis> {
    this.logger.log(`Analyzing DATEV file: ${filename} for org: ${orgId}`);

    // Validate file
    this.validateFile(buffer, filename);

    // Verify organization exists
    await this.verifyOrganization(orgId);

    // Parse and analyze file
    const analysis = await this.parserService.analyzeFile(buffer, filename);

    this.logger.log(
      `Analysis complete: ${analysis.recordCount} records, type: ${analysis.fileType}`,
    );

    return analysis;
  }

  /**
   * Preview import with mapping
   */
  async previewImport(
    buffer: Buffer,
    filename: string,
    orgId: string,
    customMapping?: DatevImportMapping,
  ): Promise<DatevImportPreview> {
    this.logger.log(`Generating preview for: ${filename}`);

    // Parse file
    const parsed = await this.parserService.parseFile(buffer, filename);
    const analysis = await this.parserService.analyzeFile(buffer, filename);

    // Generate or use custom mapping
    let mapping: DatevImportMapping;

    if (customMapping) {
      mapping = customMapping;
    } else {
      // Extract account labels from parsed records
      const accountLabels =
        parsed.fileType === DatevImportFileType.KONTENBESCHRIFTUNG
          ? (parsed.records as ParsedDatevAccountLabel[])
          : this.extractAccountLabelsFromBookings(
              parsed.records as ParsedDatevBooking[],
            );

      mapping = await this.mapperService.generateMapping(
        analysis.skrType,
        accountLabels,
      );
    }

    // Validate mapping
    const mappingValidation = this.mapperService.validateMapping(mapping);

    // Get sample records (first 10)
    const sampleRecords = parsed.records.slice(0, 10);

    // Count validation issues
    let validRecords = 0;
    let invalidRecords = 0;
    let warningCount = 0;

    for (const record of parsed.records) {
      if ('validationErrors' in record) {
        if (record.validationErrors.length > 0) {
          invalidRecords++;
        } else {
          validRecords++;
        }
      }
    }

    warningCount = mappingValidation.warnings.length;

    const preview: DatevImportPreview = {
      analysis,
      sampleRecords,
      mapping,
      validationSummary: {
        totalRecords: parsed.records.length,
        validRecords,
        invalidRecords,
        warnings: warningCount,
      },
    };

    return preview;
  }

  /**
   * Execute DATEV import
   */
  async executeImport(
    buffer: Buffer,
    filename: string,
    orgId: string,
    options: DatevImportOptions = {},
  ): Promise<DatevImportJob> {
    this.logger.log(
      `Starting import: ${filename} for org: ${orgId} (dryRun: ${options.dryRun})`,
    );

    // Validate file
    this.validateFile(buffer, filename);

    // Verify organization
    await this.verifyOrganization(orgId);

    // Parse file
    const parsed = await this.parserService.parseFile(buffer, filename);
    const analysis = await this.parserService.analyzeFile(buffer, filename);

    // Create import job
    const job: DatevImportJob = {
      id: this.generateJobId(),
      orgId,
      fileType: parsed.fileType,
      filename,
      status: DatevImportStatus.PENDING,
      progress: 0,
      totalRecords: parsed.records.length,
      processedRecords: 0,
      successfulRecords: 0,
      failedRecords: 0,
      warnings: [],
      errors: [],
      createdAt: new Date(),
      metadata: {
        skrType: analysis.skrType,
        dateRange: analysis.dateRange,
        consultantNumber: analysis.companyConfig.consultantNumber,
        clientNumber: analysis.companyConfig.clientNumber,
      },
    };

    this.importJobs.set(job.id, job);

    // Process import asynchronously
    this.processImportAsync(job, parsed, options);

    return job;
  }

  /**
   * Get import job status
   */
  async getJobStatus(jobId: string): Promise<DatevImportJob> {
    const job = this.importJobs.get(jobId);

    if (!job) {
      throw new NotFoundException(`Import job not found: ${jobId}`);
    }

    return job;
  }

  /**
   * Process import asynchronously
   */
  private async processImportAsync(
    job: DatevImportJob,
    parsed: {
      header: any;
      records: Array<
        | ParsedDatevBooking
        | ParsedDatevAccountLabel
        | ParsedDatevBusinessPartner
      >;
      fileType: DatevImportFileType;
    },
    options: DatevImportOptions,
  ): Promise<void> {
    try {
      job.status = DatevImportStatus.IMPORTING;
      job.startedAt = new Date();
      this.logger.log(`Processing import job: ${job.id}`);

      // Generate mapping if not provided
      const mapping =
        options.mapping ||
        (await this.generateMappingForImport(parsed, job.metadata.skrType));

      // Process records based on file type
      let result: DatevImportResult;

      switch (parsed.fileType) {
        case DatevImportFileType.BUCHUNGSSTAPEL:
          result = await this.importBookings(
            job,
            parsed.records as ParsedDatevBooking[],
            mapping,
            options,
          );
          break;

        case DatevImportFileType.KONTENBESCHRIFTUNG:
          result = await this.importAccountLabels(
            job,
            parsed.records as ParsedDatevAccountLabel[],
            options,
          );
          break;

        case DatevImportFileType.STAMMDATEN:
        case DatevImportFileType.DEBITOREN:
        case DatevImportFileType.KREDITOREN:
          result = await this.importBusinessPartners(
            job,
            parsed.records as ParsedDatevBusinessPartner[],
            options,
          );
          break;

        default:
          throw new BadRequestException(
            `Unsupported file type: ${parsed.fileType}`,
          );
      }

      // Update job status
      job.status = DatevImportStatus.COMPLETED;
      job.completedAt = new Date();
      job.progress = 100;

      this.logger.log(
        `Import job completed: ${job.id} - ${result.summary.imported} imported, ${result.summary.failed} failed`,
      );
    } catch (error) {
      this.logger.error(`Import job failed: ${job.id}`, error);
      job.status = DatevImportStatus.FAILED;
      job.errors.push(error.message);
      job.completedAt = new Date();
    }
  }

  /**
   * Import booking records (transactions)
   */
  private async importBookings(
    job: DatevImportJob,
    bookings: ParsedDatevBooking[],
    mapping: DatevImportMapping,
    options: DatevImportOptions,
  ): Promise<DatevImportResult> {
    const result: DatevImportResult = {
      jobId: job.id,
      status: DatevImportStatus.IMPORTING,
      summary: {
        totalRecords: bookings.length,
        imported: 0,
        skipped: 0,
        failed: 0,
        warnings: 0,
      },
      details: {
        transactions: {
          created: 0,
          updated: 0,
          skipped: 0,
        },
      },
      errors: [],
      warnings: [],
      processingTime: 0,
    };

    const startTime = Date.now();
    const batchSize = options.batchSize || DEFAULT_IMPORT_BATCH_SIZE;

    for (let i = 0; i < bookings.length; i += batchSize) {
      const batch = bookings.slice(i, i + batchSize);

      for (const booking of batch) {
        try {
          // Skip if validation errors and not skipping validation
          if (
            !options.skipValidation &&
            booking.validationErrors.length > 0
          ) {
            result.summary.skipped++;
            result.details.transactions!.skipped++;
            result.errors.push({
              lineNumber: booking.lineNumber,
              message: `Validation errors: ${booking.validationErrors.join(', ')}`,
              record: booking,
            });
            continue;
          }

          // Map booking to transaction
          const transaction = this.mapperService.mapBookingToTransaction(
            booking,
            mapping,
            job.orgId,
          );

          // Check for duplicates if requested
          if (options.skipDuplicates) {
            const existing = await this.prisma.transaction.findFirst({
              where: {
                orgId: job.orgId,
                reference: transaction.reference,
                amount: transaction.amount,
                date: transaction.date,
              },
            });

            if (existing) {
              result.summary.skipped++;
              result.details.transactions!.skipped++;
              result.warnings.push({
                lineNumber: booking.lineNumber,
                message: `Duplicate transaction: ${transaction.reference}`,
              });
              continue;
            }
          }

          // Create or update transaction (if not dry run)
          if (!options.dryRun) {
            if (options.updateExisting) {
              const existing = await this.prisma.transaction.findFirst({
                where: {
                  orgId: job.orgId,
                  reference: transaction.reference,
                },
              });

              if (existing) {
                await this.prisma.transaction.update({
                  where: { id: existing.id },
                  data: transaction,
                });
                result.details.transactions!.updated++;
              } else {
                await this.prisma.transaction.create({
                  data: transaction,
                });
                result.details.transactions!.created++;
              }
            } else {
              await this.prisma.transaction.create({
                data: transaction,
              });
              result.details.transactions!.created++;
            }
          }

          result.summary.imported++;
          job.successfulRecords++;
        } catch (error) {
          this.logger.error(
            `Failed to import booking on line ${booking.lineNumber}`,
            error,
          );
          result.summary.failed++;
          result.errors.push({
            lineNumber: booking.lineNumber,
            message: error.message,
            record: booking,
          });
          job.failedRecords++;

          if (!options.continueOnError) {
            throw error;
          }
        }

        job.processedRecords++;
        job.progress = Math.round((job.processedRecords / job.totalRecords) * 100);
      }
    }

    result.processingTime = Date.now() - startTime;
    result.status = DatevImportStatus.COMPLETED;

    return result;
  }

  /**
   * Import account labels
   */
  private async importAccountLabels(
    job: DatevImportJob,
    labels: ParsedDatevAccountLabel[],
    options: DatevImportOptions,
  ): Promise<DatevImportResult> {
    const result: DatevImportResult = {
      jobId: job.id,
      status: DatevImportStatus.IMPORTING,
      summary: {
        totalRecords: labels.length,
        imported: 0,
        skipped: 0,
        failed: 0,
        warnings: 0,
      },
      details: {
        accounts: {
          created: 0,
          updated: 0,
          skipped: 0,
        },
      },
      errors: [],
      warnings: [],
      processingTime: 0,
    };

    const startTime = Date.now();

    for (const label of labels) {
      try {
        // Skip if validation errors
        if (!options.skipValidation && label.validationErrors.length > 0) {
          result.summary.skipped++;
          result.details.accounts!.skipped++;
          continue;
        }

        // Import account label (placeholder - depends on your account model)
        if (!options.dryRun) {
          // TODO: Implement account label storage
          this.logger.debug(
            `Would import account label: ${label.accountNumber} - ${label.accountName}`,
          );
        }

        result.summary.imported++;
        result.details.accounts!.created++;
        job.successfulRecords++;
      } catch (error) {
        result.summary.failed++;
        result.errors.push({
          lineNumber: label.lineNumber,
          message: error.message,
        });
        job.failedRecords++;
      }

      job.processedRecords++;
      job.progress = Math.round((job.processedRecords / job.totalRecords) * 100);
    }

    result.processingTime = Date.now() - startTime;
    result.status = DatevImportStatus.COMPLETED;

    return result;
  }

  /**
   * Import business partners (customers/suppliers)
   */
  private async importBusinessPartners(
    job: DatevImportJob,
    partners: ParsedDatevBusinessPartner[],
    options: DatevImportOptions,
  ): Promise<DatevImportResult> {
    const result: DatevImportResult = {
      jobId: job.id,
      status: DatevImportStatus.IMPORTING,
      summary: {
        totalRecords: partners.length,
        imported: 0,
        skipped: 0,
        failed: 0,
        warnings: 0,
      },
      details: {
        businessPartners: {
          customers: { created: 0, updated: 0, skipped: 0 },
          suppliers: { created: 0, updated: 0, skipped: 0 },
        },
      },
      errors: [],
      warnings: [],
      processingTime: 0,
    };

    const startTime = Date.now();

    for (const partner of partners) {
      try {
        // Skip if validation errors
        if (!options.skipValidation && partner.validationErrors.length > 0) {
          result.summary.skipped++;
          continue;
        }

        // Map to customer or supplier
        const { type, data } = this.mapperService.mapBusinessPartnerToEntity(
          partner,
          job.orgId,
        );

        // Create or update
        if (!options.dryRun) {
          if (type === 'customer') {
            const existing = await this.prisma.customer.findFirst({
              where: {
                orgId: job.orgId,
                email: data.email,
              },
            });

            if (existing && options.updateExisting) {
              await this.prisma.customer.update({
                where: { id: existing.id },
                data,
              });
              result.details.businessPartners!.customers.updated++;
            } else if (!existing) {
              await this.prisma.customer.create({ data });
              result.details.businessPartners!.customers.created++;
            } else {
              result.details.businessPartners!.customers.skipped++;
              result.summary.skipped++;
              continue;
            }
          } else {
            // Supplier - similar logic
            this.logger.debug(`Would import supplier: ${data.name}`);
            result.details.businessPartners!.suppliers.created++;
          }
        }

        result.summary.imported++;
        job.successfulRecords++;
      } catch (error) {
        result.summary.failed++;
        result.errors.push({
          lineNumber: partner.lineNumber,
          message: error.message,
        });
        job.failedRecords++;

        if (!options.continueOnError) {
          throw error;
        }
      }

      job.processedRecords++;
      job.progress = Math.round((job.processedRecords / job.totalRecords) * 100);
    }

    result.processingTime = Date.now() - startTime;
    result.status = DatevImportStatus.COMPLETED;

    return result;
  }

  /**
   * Helper methods
   */

  private validateFile(buffer: Buffer, filename: string): void {
    // Check file size
    if (buffer.length > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    // Check file extension
    const ext = path.extname(filename).toLowerCase();
    if (!SUPPORTED_FILE_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `Unsupported file extension: ${ext}. Supported: ${SUPPORTED_FILE_EXTENSIONS.join(', ')}`,
      );
    }
  }

  private async verifyOrganization(orgId: string): Promise<void> {
    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException(`Organization not found: ${orgId}`);
    }
  }

  private generateJobId(): string {
    return `datev_import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateMappingForImport(
    parsed: any,
    skrType: any,
  ): Promise<DatevImportMapping> {
    const accountLabels = this.extractAccountLabelsFromBookings(
      parsed.records,
    );
    return this.mapperService.generateMapping(skrType, accountLabels);
  }

  private extractAccountLabelsFromBookings(
    records: any[],
  ): ParsedDatevAccountLabel[] {
    const accountMap = new Map<string, ParsedDatevAccountLabel>();

    for (const record of records) {
      if ('accountNumber' in record && record.accountNumber) {
        if (!accountMap.has(record.accountNumber)) {
          accountMap.set(record.accountNumber, {
            accountNumber: record.accountNumber,
            accountName: `Account ${record.accountNumber}`,
            raw: [],
            lineNumber: record.lineNumber,
            validationErrors: [],
          });
        }
      }

      if ('offsetAccount' in record && record.offsetAccount) {
        if (!accountMap.has(record.offsetAccount)) {
          accountMap.set(record.offsetAccount, {
            accountNumber: record.offsetAccount,
            accountName: `Account ${record.offsetAccount}`,
            raw: [],
            lineNumber: record.lineNumber,
            validationErrors: [],
          });
        }
      }
    }

    return Array.from(accountMap.values());
  }
}
