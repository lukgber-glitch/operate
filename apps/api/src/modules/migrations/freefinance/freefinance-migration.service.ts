import { Injectable, Logger } from '@nestjs/common';
import { FreeFinanceParserService } from './freefinance-parser.service';
import { FreeFinanceMapperService } from './freefinance-mapper.service';
import {
  FreeFinanceMigrationType,
  MigrationConfig,
  MigrationPreview,
  MigrationProgress,
  MigrationResult,
  MigrationValidationResult,
  MigrationError,
  MigrationWarning,
  FreeFinanceFileInfo,
} from './freefinance.types';
import { BATCH_SIZES, VALIDATION_RULES, DEFAULT_VALUES } from './freefinance.constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Main orchestration service for FreeFinance migrations
 * Coordinates parsing, mapping, validation, and import
 */
@Injectable()
export class FreeFinanceMigrationService {
  private readonly logger = new Logger(FreeFinanceMigrationService.name);
  private readonly migrationJobs = new Map<string, MigrationProgress>();

  constructor(
    private readonly parserService: FreeFinanceParserService,
    private readonly mapperService: FreeFinanceMapperService,
  ) {}

  /**
   * Analyze uploaded file and generate preview
   */
  async generatePreview(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    migrationType: FreeFinanceMigrationType,
  ): Promise<MigrationPreview> {
    this.logger.log(`Generating preview for ${originalName}`);

    try {
      // Detect file info
      const fileInfo = await this.parserService.detectFileInfo(buffer, originalName, mimeType);

      // Parse file
      const parsed = await this.parserService.parseFile(
        buffer,
        originalName,
        migrationType,
      );

      // Get detected columns
      const detectedColumns = await this.parserService.getDetectedColumns(buffer, originalName);

      // Get sample data (first 10 records)
      const sampleData = this.getSampleData(parsed, 10);

      // Collect stats
      const stats = this.collectStats(parsed);

      // Count valid/invalid records
      const totalRecords = this.getTotalRecords(parsed);
      const validRecords = totalRecords - parsed.errors.filter(e => e.severity === 'error').length;

      const preview: MigrationPreview = {
        type: migrationType,
        fileName: originalName,
        fileSize: fileInfo.size,
        encoding: fileInfo.encoding || 'utf8',
        delimiter: fileInfo.delimiter || ';',
        totalRecords,
        validRecords,
        invalidRecords: totalRecords - validRecords,
        errors: parsed.errors,
        warnings: parsed.warnings,
        sampleData,
        detectedColumns,
        fieldMapping: {}, // Would be populated based on migration type
        suggestedMappings: {}, // AI-suggested mappings
        stats,
      };

      this.logger.log(
        `Preview generated: ${totalRecords} records, ${validRecords} valid, ${parsed.errors.length} errors`,
      );

      return preview;
    } catch (error) {
      this.logger.error(`Error generating preview: ${error.message}`, error.stack);
      throw new Error(`Failed to generate preview: ${error.message}`);
    }
  }

  /**
   * Validate migration data without importing
   */
  async validate(
    buffer: Buffer,
    originalName: string,
    migrationType: FreeFinanceMigrationType,
    config?: Partial<MigrationConfig>,
  ): Promise<MigrationValidationResult> {
    this.logger.log(`Validating ${originalName} for ${migrationType}`);

    try {
      // Parse file
      const parsed = await this.parserService.parseFile(
        buffer,
        originalName,
        migrationType,
        config?.customFieldMapping,
      );

      const errors: MigrationError[] = [...parsed.errors];
      const warnings: MigrationWarning[] = [...parsed.warnings];

      // Perform additional validation based on type
      const totalRows = this.getTotalRecords(parsed);
      let validRows = 0;
      let invalidRows = 0;
      let duplicates = 0;
      let emptyRows = 0;

      // Type-specific validation
      switch (migrationType) {
        case FreeFinanceMigrationType.CUSTOMERS:
          const customerValidation = this.validateCustomers(parsed.customers, errors, warnings);
          validRows = customerValidation.valid;
          invalidRows = customerValidation.invalid;
          duplicates = customerValidation.duplicates;
          break;

        case FreeFinanceMigrationType.VENDORS:
          const vendorValidation = this.validateVendors(parsed.vendors, errors, warnings);
          validRows = vendorValidation.valid;
          invalidRows = vendorValidation.invalid;
          duplicates = vendorValidation.duplicates;
          break;

        case FreeFinanceMigrationType.OUTGOING_INVOICES:
          const outgoingValidation = this.validateOutgoingInvoices(parsed.outgoingInvoices, errors, warnings);
          validRows = outgoingValidation.valid;
          invalidRows = outgoingValidation.invalid;
          duplicates = outgoingValidation.duplicates;
          break;

        case FreeFinanceMigrationType.INCOMING_INVOICES:
          const incomingValidation = this.validateIncomingInvoices(parsed.incomingInvoices, errors, warnings);
          validRows = incomingValidation.valid;
          invalidRows = incomingValidation.invalid;
          duplicates = incomingValidation.duplicates;
          break;

        case FreeFinanceMigrationType.PRODUCTS:
          const productValidation = this.validateProducts(parsed.products, errors, warnings);
          validRows = productValidation.valid;
          invalidRows = productValidation.invalid;
          duplicates = productValidation.duplicates;
          break;
      }

      // Calculate data quality metrics
      const completeness = totalRows > 0 ? (validRows / totalRows) * 100 : 0;
      const accuracy = errors.length === 0 ? 100 : Math.max(0, 100 - (errors.length / totalRows) * 100);
      const consistency = duplicates === 0 ? 100 : Math.max(0, 100 - (duplicates / totalRows) * 100);

      const result: MigrationValidationResult = {
        isValid: errors.filter(e => e.severity === 'error').length === 0,
        errors,
        warnings,
        stats: {
          totalRows,
          validRows,
          invalidRows,
          duplicates,
          emptyRows,
        },
        dataQuality: {
          completeness: Math.round(completeness),
          accuracy: Math.round(accuracy),
          consistency: Math.round(consistency),
        },
      };

      this.logger.log(
        `Validation complete: ${validRows}/${totalRows} valid, ${errors.length} errors, ${warnings.length} warnings`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Error during validation: ${error.message}`, error.stack);
      throw new Error(`Validation failed: ${error.message}`);
    }
  }

  /**
   * Execute migration with progress tracking
   */
  async executeMigration(
    buffer: Buffer,
    originalName: string,
    migrationType: FreeFinanceMigrationType,
    config: MigrationConfig,
  ): Promise<{ jobId: string }> {
    const jobId = uuidv4();

    this.logger.log(`Starting migration job ${jobId} for ${originalName}`);

    // Initialize progress tracking
    const progress: MigrationProgress = {
      jobId,
      status: 'pending',
      progress: 0,
      currentPhase: 'Initializing',
      totalRecords: 0,
      processedRecords: 0,
      successCount: 0,
      failureCount: 0,
      warningCount: 0,
      errors: [],
      warnings: [],
      startedAt: new Date(),
    };

    this.migrationJobs.set(jobId, progress);

    // Execute migration asynchronously
    this.executeAsync(jobId, buffer, originalName, migrationType, config).catch(error => {
      this.logger.error(`Migration job ${jobId} failed: ${error.message}`, error.stack);
      progress.status = 'failed';
      progress.errors.push({
        row: 0,
        message: `Migration failed: ${error.message}`,
        severity: 'critical',
      });
    });

    return { jobId };
  }

  /**
   * Get migration job status
   */
  getStatus(jobId: string): MigrationProgress | undefined {
    return this.migrationJobs.get(jobId);
  }

  /**
   * Cancel migration job
   */
  async cancelMigration(jobId: string): Promise<boolean> {
    const progress = this.migrationJobs.get(jobId);
    if (!progress) return false;

    if (progress.status === 'processing' || progress.status === 'validating') {
      progress.status = 'cancelled';
      this.logger.log(`Migration job ${jobId} cancelled`);
      return true;
    }

    return false;
  }

  /**
   * Execute migration asynchronously
   */
  private async executeAsync(
    jobId: string,
    buffer: Buffer,
    originalName: string,
    migrationType: FreeFinanceMigrationType,
    config: MigrationConfig,
  ): Promise<void> {
    const progress = this.migrationJobs.get(jobId);
    if (!progress) return;

    const startTime = Date.now();

    try {
      // Phase 1: Parsing
      progress.status = 'processing';
      progress.currentPhase = 'Parsing file';
      progress.progress = 10;

      const parsed = await this.parserService.parseFile(
        buffer,
        originalName,
        migrationType,
        config.customFieldMapping,
      );

      progress.totalRecords = this.getTotalRecords(parsed);
      progress.progress = 20;

      // Phase 2: Validation
      if (config.validateOnly || config.strictMode) {
        progress.status = 'validating';
        progress.currentPhase = 'Validating data';
        progress.progress = 30;

        const validation = await this.validate(buffer, originalName, migrationType, config);
        progress.errors = validation.errors;
        progress.warnings = validation.warnings;
        progress.warningCount = validation.warnings.length;

        if (!validation.isValid && config.strictMode) {
          progress.status = 'failed';
          progress.currentPhase = 'Validation failed';
          progress.progress = 100;
          return;
        }

        if (config.validateOnly) {
          progress.status = 'completed';
          progress.currentPhase = 'Validation complete';
          progress.progress = 100;
          progress.completedAt = new Date();
          return;
        }
      }

      progress.progress = 40;

      // Phase 3: Mapping and importing
      progress.status = 'importing';
      progress.currentPhase = 'Importing data';

      const result = await this.importData(parsed, migrationType, config, progress);

      // Phase 4: Complete
      progress.status = 'completed';
      progress.currentPhase = 'Migration complete';
      progress.progress = 100;
      progress.completedAt = new Date();
      progress.successCount = result.imported;
      progress.failureCount = result.failed;

      const duration = Date.now() - startTime;
      this.logger.log(
        `Migration job ${jobId} completed in ${duration}ms: ${result.imported} imported, ${result.failed} failed`,
      );
    } catch (error) {
      progress.status = 'failed';
      progress.currentPhase = 'Migration failed';
      progress.errors.push({
        row: 0,
        message: error.message,
        severity: 'critical',
      });
      this.logger.error(`Migration job ${jobId} error: ${error.message}`, error.stack);
    }
  }

  /**
   * Import parsed data
   */
  private async importData(
    parsed: any,
    migrationType: FreeFinanceMigrationType,
    config: MigrationConfig,
    progress: MigrationProgress,
  ): Promise<MigrationResult> {
    const errors: MigrationError[] = [];
    const warnings: MigrationWarning[] = [];
    const createdIds: string[] = [];

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    const batchSize = config.batchSize || BATCH_SIZES[migrationType.replace(/_/g, '').toLowerCase()] || 100;

    // Process based on type
    switch (migrationType) {
      case FreeFinanceMigrationType.CUSTOMERS:
        for (let i = 0; i < parsed.customers.length; i++) {
          const customer = parsed.customers[i];
          try {
            const mapped = this.mapperService.mapCustomer(customer, errors, warnings, i + 2);
            if (mapped) {
              if (!config.dryRun) {
                // TODO: Save to database
                // const created = await this.customerService.create(mapped);
                // createdIds.push(created.id);
              }
              imported++;
            } else {
              failed++;
            }
          } catch (error) {
            failed++;
            errors.push({
              row: i + 2,
              message: error.message,
              severity: 'error',
            });
          }

          progress.processedRecords = i + 1;
          progress.progress = 40 + Math.round((i / parsed.customers.length) * 50);
        }
        break;

      case FreeFinanceMigrationType.VENDORS:
        for (let i = 0; i < parsed.vendors.length; i++) {
          const vendor = parsed.vendors[i];
          try {
            const mapped = this.mapperService.mapVendor(vendor, errors, warnings, i + 2);
            if (mapped) {
              if (!config.dryRun) {
                // TODO: Save to database
              }
              imported++;
            } else {
              failed++;
            }
          } catch (error) {
            failed++;
          }

          progress.processedRecords = i + 1;
          progress.progress = 40 + Math.round((i / parsed.vendors.length) * 50);
        }
        break;

      case FreeFinanceMigrationType.OUTGOING_INVOICES:
        for (let i = 0; i < parsed.outgoingInvoices.length; i++) {
          const invoice = parsed.outgoingInvoices[i];
          try {
            const mapped = this.mapperService.mapOutgoingInvoice(invoice, errors, warnings, i + 2);
            if (mapped) {
              if (!config.dryRun) {
                // TODO: Save to database
              }
              imported++;
            } else {
              failed++;
            }
          } catch (error) {
            failed++;
          }

          progress.processedRecords = i + 1;
          progress.progress = 40 + Math.round((i / parsed.outgoingInvoices.length) * 50);
        }
        break;

      case FreeFinanceMigrationType.INCOMING_INVOICES:
        for (let i = 0; i < parsed.incomingInvoices.length; i++) {
          const invoice = parsed.incomingInvoices[i];
          try {
            const mapped = this.mapperService.mapIncomingInvoice(invoice, errors, warnings, i + 2);
            if (mapped) {
              if (!config.dryRun) {
                // TODO: Save to database
              }
              imported++;
            } else {
              failed++;
            }
          } catch (error) {
            failed++;
          }

          progress.processedRecords = i + 1;
          progress.progress = 40 + Math.round((i / parsed.incomingInvoices.length) * 50);
        }
        break;

      case FreeFinanceMigrationType.PRODUCTS:
        for (let i = 0; i < parsed.products.length; i++) {
          const product = parsed.products[i];
          try {
            const mapped = this.mapperService.mapProduct(product, errors, warnings, i + 2);
            if (mapped) {
              if (!config.dryRun) {
                // TODO: Save to database
              }
              imported++;
            } else {
              failed++;
            }
          } catch (error) {
            failed++;
          }

          progress.processedRecords = i + 1;
          progress.progress = 40 + Math.round((i / parsed.products.length) * 50);
        }
        break;
    }

    const result: MigrationResult = {
      jobId: progress.jobId,
      type: migrationType,
      status: failed === 0 ? 'completed' : 'partial',
      totalRecords: progress.totalRecords,
      imported,
      skipped,
      failed,
      errors,
      warnings,
      duration: Date.now() - progress.startedAt.getTime(),
      createdIds,
      summary: {},
      rollbackAvailable: !config.dryRun && imported > 0,
    };

    return result;
  }

  // Helper methods

  private getTotalRecords(parsed: any): number {
    return (
      (parsed.customers?.length || 0) +
      (parsed.vendors?.length || 0) +
      (parsed.outgoingInvoices?.length || 0) +
      (parsed.incomingInvoices?.length || 0) +
      (parsed.products?.length || 0)
    );
  }

  private getSampleData(parsed: any, limit: number): any[] {
    if (parsed.customers) return parsed.customers.slice(0, limit);
    if (parsed.vendors) return parsed.vendors.slice(0, limit);
    if (parsed.outgoingInvoices) return parsed.outgoingInvoices.slice(0, limit);
    if (parsed.incomingInvoices) return parsed.incomingInvoices.slice(0, limit);
    if (parsed.products) return parsed.products.slice(0, limit);
    return [];
  }

  private collectStats(parsed: any): any {
    const stats: any = {
      currencies: new Set<string>(),
      dateFormats: new Set<string>(),
      countries: new Set<string>(),
      vatRates: new Set<number>(),
    };

    // Collect from all record types
    const allRecords = [
      ...(parsed.customers || []),
      ...(parsed.vendors || []),
      ...(parsed.outgoingInvoices || []),
      ...(parsed.incomingInvoices || []),
      ...(parsed.products || []),
    ];

    allRecords.forEach(record => {
      if (record.currency) stats.currencies.add(record.currency);
      if (record.country) stats.countries.add(record.country);
      if (record.vatRate) stats.vatRates.add(record.vatRate);
    });

    return {
      currencies: Array.from(stats.currencies),
      dateFormats: Array.from(stats.dateFormats),
      countries: Array.from(stats.countries),
      vatRates: Array.from(stats.vatRates),
    };
  }

  private validateCustomers(customers: any[], errors: MigrationError[], warnings: MigrationWarning[]): any {
    let valid = 0;
    let invalid = 0;
    const seen = new Set<string>();
    let duplicates = 0;

    customers?.forEach((customer, idx) => {
      if (seen.has(customer.customerNumber)) {
        duplicates++;
        warnings.push({
          row: idx + 2,
          field: 'customerNumber',
          message: `Duplicate customer number: ${customer.customerNumber}`,
        });
      }
      seen.add(customer.customerNumber);

      if (customer.customerNumber && (customer.companyName || customer.firstName)) {
        valid++;
      } else {
        invalid++;
      }
    });

    return { valid, invalid, duplicates };
  }

  private validateVendors(vendors: any[], errors: MigrationError[], warnings: MigrationWarning[]): any {
    let valid = 0;
    let invalid = 0;
    const seen = new Set<string>();
    let duplicates = 0;

    vendors?.forEach((vendor, idx) => {
      if (seen.has(vendor.vendorNumber)) {
        duplicates++;
      }
      seen.add(vendor.vendorNumber);

      if (vendor.vendorNumber && (vendor.companyName || vendor.firstName)) {
        valid++;
      } else {
        invalid++;
      }
    });

    return { valid, invalid, duplicates };
  }

  private validateOutgoingInvoices(invoices: any[], errors: MigrationError[], warnings: MigrationWarning[]): any {
    let valid = 0;
    let invalid = 0;
    const seen = new Set<string>();
    let duplicates = 0;

    invoices?.forEach((invoice, idx) => {
      if (seen.has(invoice.invoiceNumber)) {
        duplicates++;
      }
      seen.add(invoice.invoiceNumber);

      if (invoice.invoiceNumber && invoice.customerNumber && invoice.grossAmount > 0) {
        valid++;
      } else {
        invalid++;
      }
    });

    return { valid, invalid, duplicates };
  }

  private validateIncomingInvoices(invoices: any[], errors: MigrationError[], warnings: MigrationWarning[]): any {
    let valid = 0;
    let invalid = 0;
    const seen = new Set<string>();
    let duplicates = 0;

    invoices?.forEach((invoice, idx) => {
      if (seen.has(invoice.invoiceNumber)) {
        duplicates++;
      }
      seen.add(invoice.invoiceNumber);

      if (invoice.invoiceNumber && invoice.vendorName && invoice.grossAmount > 0) {
        valid++;
      } else {
        invalid++;
      }
    });

    return { valid, invalid, duplicates };
  }

  private validateProducts(products: any[], errors: MigrationError[], warnings: MigrationWarning[]): any {
    let valid = 0;
    let invalid = 0;
    const seen = new Set<string>();
    let duplicates = 0;

    products?.forEach((product, idx) => {
      if (seen.has(product.productNumber)) {
        duplicates++;
      }
      seen.add(product.productNumber);

      if (product.productNumber && product.name && product.unitPrice >= 0) {
        valid++;
      } else {
        invalid++;
      }
    });

    return { valid, invalid, duplicates };
  }
}
