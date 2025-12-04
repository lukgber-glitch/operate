import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { LexofficeParserService } from './lexoffice-parser.service';
import { LexofficeMapperService } from './lexoffice-mapper.service';
import {
  LexofficeMigrationType,
  MigrationPreview,
  MigrationProgress,
  MigrationResult,
  MigrationValidationResult,
  ParsedMigrationData,
  MigrationError,
  MigrationWarning,
} from './lexoffice.types';
import {
  SUPPORTED_FILE_TYPES,
  SUPPORTED_EXTENSIONS,
  BATCH_SIZES,
  VALIDATION_RULES,
} from './lexoffice.constants';

@Injectable()
export class LexofficeMigrationService {
  private readonly logger = new Logger(LexofficeMigrationService.name);
  private readonly jobProgress = new Map<string, MigrationProgress>();

  constructor(
    private readonly parserService: LexofficeParserService,
    private readonly mapperService: LexofficeMapperService,
  ) {}

  /**
   * Validate uploaded file
   */
  validateFile(file: Express.Multer.File): void {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Check file extension
    const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `Unsupported file type. Supported types: ${SUPPORTED_EXTENSIONS.join(', ')}`,
      );
    }

    // Check MIME type
    const isValidMimeType = [
      ...SUPPORTED_FILE_TYPES.csv,
      ...SUPPORTED_FILE_TYPES.excel,
    ].includes(file.mimetype);

    if (!isValidMimeType) {
      throw new BadRequestException('Invalid file MIME type');
    }
  }

  /**
   * Preview migration data without importing
   */
  async previewMigration(
    file: Express.Multer.File,
    migrationType: LexofficeMigrationType,
  ): Promise<MigrationPreview> {
    this.logger.log(`Previewing ${migrationType} migration from ${file.originalname}`);

    try {
      // Parse file
      const parsed = await this.parserService.parseFile(
        file.buffer,
        file.originalname,
        migrationType,
      );

      // Validate data
      const validation = this.validateParsedData(parsed);

      // Get sample data (first 5 records)
      const sampleData = this.getSampleData(parsed, 5);

      return {
        type: migrationType,
        totalRecords: this.getTotalRecords(parsed),
        validRecords: validation.stats.validRows,
        errors: parsed.errors,
        warnings: parsed.warnings,
        sampleData,
        fieldMapping: this.getFieldMapping(migrationType),
      };
    } catch (error) {
      this.logger.error(`Preview error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Execute migration
   */
  async executeMigration(
    orgId: string,
    file: Express.Multer.File,
    migrationType: LexofficeMigrationType,
    dryRun: boolean = false,
  ): Promise<MigrationResult> {
    const jobId = this.generateJobId();
    const startTime = Date.now();

    this.logger.log(`Starting ${dryRun ? 'dry-run' : 'live'} migration ${jobId} for ${migrationType}`);

    try {
      // Initialize job progress
      this.initializeJobProgress(jobId, migrationType);

      // Parse file
      const parsed = await this.parserService.parseFile(
        file.buffer,
        file.originalname,
        migrationType,
      );

      const totalRecords = this.getTotalRecords(parsed);
      this.updateJobProgress(jobId, { totalRecords });

      // Validate data
      const validation = this.validateParsedData(parsed);
      if (!validation.isValid) {
        throw new BadRequestException('Validation failed', {
          cause: validation.errors,
        });
      }

      // Import data
      this.updateJobProgress(jobId, { status: 'processing' });
      const importResult = await this.importData(orgId, parsed, dryRun, jobId);

      // Complete job
      const duration = Date.now() - startTime;
      this.updateJobProgress(jobId, {
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
      });

      const result: MigrationResult = {
        jobId,
        type: migrationType,
        status: importResult.errors.length > 0 ? 'partial' : 'completed',
        totalRecords,
        imported: importResult.imported,
        skipped: importResult.skipped,
        failed: importResult.errors.length,
        errors: importResult.errors,
        warnings: parsed.warnings,
        duration,
        createdIds: importResult.createdIds,
      };

      this.logger.log(`Migration ${jobId} completed: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Migration ${jobId} failed: ${error.message}`, error.stack);

      this.updateJobProgress(jobId, {
        status: 'failed',
        completedAt: new Date(),
      });

      const duration = Date.now() - startTime;
      return {
        jobId,
        type: migrationType,
        status: 'failed',
        totalRecords: 0,
        imported: 0,
        skipped: 0,
        failed: 0,
        errors: [{ row: 0, message: error.message }],
        warnings: [],
        duration,
      };
    }
  }

  /**
   * Get migration job status
   */
  getJobStatus(jobId: string): MigrationProgress | undefined {
    return this.jobProgress.get(jobId);
  }

  /**
   * Validate parsed data
   */
  private validateParsedData(parsed: ParsedMigrationData): MigrationValidationResult {
    const errors: MigrationError[] = [...parsed.errors];
    const warnings: MigrationWarning[] = [...parsed.warnings];

    const totalRows = this.getTotalRecords(parsed);
    let validRows = totalRows;
    let invalidRows = errors.length;

    // Type-specific validation
    if (parsed.contacts) {
      const contactValidation = this.validateContacts(parsed.contacts);
      errors.push(...contactValidation.errors);
      warnings.push(...contactValidation.warnings);
    }

    if (parsed.invoices) {
      const invoiceValidation = this.validateInvoices(parsed.invoices);
      errors.push(...invoiceValidation.errors);
      warnings.push(...invoiceValidation.warnings);
    }

    if (parsed.vouchers) {
      const voucherValidation = this.validateVouchers(parsed.vouchers);
      errors.push(...voucherValidation.errors);
      warnings.push(...voucherValidation.warnings);
    }

    if (parsed.products) {
      const productValidation = this.validateProducts(parsed.products);
      errors.push(...productValidation.errors);
      warnings.push(...productValidation.warnings);
    }

    // Detect duplicates
    const duplicates = this.detectDuplicates(parsed);

    validRows -= errors.length;
    invalidRows = errors.length;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalRows,
        validRows: Math.max(0, validRows),
        invalidRows,
        duplicates,
      },
    };
  }

  /**
   * Validate contacts
   */
  private validateContacts(contacts: any[]) {
    const errors: MigrationError[] = [];
    const warnings: MigrationWarning[] = [];

    contacts.forEach((contact, index) => {
      // Required field validation
      if (!contact.companyName && !contact.firstName && !contact.lastName) {
        errors.push({
          row: index + 1,
          message: 'Missing name: at least one of companyName, firstName, or lastName is required',
        });
      }

      // Email validation
      if (contact.email && !VALIDATION_RULES.contacts.email.test(contact.email)) {
        warnings.push({
          row: index + 1,
          field: 'email',
          message: 'Invalid email format',
          value: contact.email,
        });
      }

      // VAT ID validation
      if (contact.vatId && !VALIDATION_RULES.contacts.vatId.test(contact.vatId)) {
        warnings.push({
          row: index + 1,
          field: 'vatId',
          message: 'Invalid VAT ID format',
          value: contact.vatId,
        });
      }
    });

    return { errors, warnings };
  }

  /**
   * Validate invoices
   */
  private validateInvoices(invoices: any[]) {
    const errors: MigrationError[] = [];
    const warnings: MigrationWarning[] = [];

    invoices.forEach((invoice, index) => {
      // Required fields
      if (!invoice.invoiceNumber) {
        errors.push({ row: index + 1, field: 'invoiceNumber', message: 'Missing invoice number' });
      }

      if (!invoice.customerName) {
        errors.push({ row: index + 1, field: 'customerName', message: 'Missing customer name' });
      }

      if (!invoice.totalAmount || invoice.totalAmount <= 0) {
        errors.push({ row: index + 1, field: 'totalAmount', message: 'Invalid total amount' });
      }

      // Check if amounts match
      if (invoice.items && invoice.items.length > 0) {
        const calculatedSubtotal = invoice.items.reduce((sum: number, item: any) => sum + item.amount, 0);
        const calculatedTax = invoice.items.reduce((sum: number, item: any) => sum + (item.taxAmount || 0), 0);

        if (Math.abs(calculatedSubtotal - invoice.subtotal) > 0.01) {
          warnings.push({
            row: index + 1,
            field: 'subtotal',
            message: 'Subtotal does not match sum of line items',
            value: `Expected: ${calculatedSubtotal}, Got: ${invoice.subtotal}`,
          });
        }
      }
    });

    return { errors, warnings };
  }

  /**
   * Validate vouchers
   */
  private validateVouchers(vouchers: any[]) {
    const errors: MigrationError[] = [];
    const warnings: MigrationWarning[] = [];

    vouchers.forEach((voucher, index) => {
      if (!voucher.description) {
        errors.push({ row: index + 1, field: 'description', message: 'Missing description' });
      }

      if (!voucher.amount || voucher.amount <= 0) {
        errors.push({ row: index + 1, field: 'amount', message: 'Invalid amount' });
      }
    });

    return { errors, warnings };
  }

  /**
   * Validate products
   */
  private validateProducts(products: any[]) {
    const errors: MigrationError[] = [];
    const warnings: MigrationWarning[] = [];

    products.forEach((product, index) => {
      if (!product.name) {
        errors.push({ row: index + 1, field: 'name', message: 'Missing product name' });
      }

      if (!product.unitPrice || product.unitPrice < 0) {
        errors.push({ row: index + 1, field: 'unitPrice', message: 'Invalid unit price' });
      }
    });

    return { errors, warnings };
  }

  /**
   * Detect duplicates in parsed data
   */
  private detectDuplicates(parsed: ParsedMigrationData): number {
    let duplicates = 0;

    if (parsed.contacts) {
      const emails = parsed.contacts.map(c => c.email).filter(Boolean);
      duplicates += emails.length - new Set(emails).size;
    }

    if (parsed.invoices) {
      const numbers = parsed.invoices.map(i => i.invoiceNumber);
      duplicates += numbers.length - new Set(numbers).size;
    }

    if (parsed.products) {
      const numbers = parsed.products.map(p => p.productNumber).filter(Boolean);
      duplicates += numbers.length - new Set(numbers).size;
    }

    return duplicates;
  }

  /**
   * Import data based on type
   */
  private async importData(
    orgId: string,
    parsed: ParsedMigrationData,
    dryRun: boolean,
    jobId: string,
  ) {
    let result = { imported: 0, skipped: 0, errors: [] as MigrationError[], createdIds: [] as string[] };

    if (parsed.contacts) {
      result = await this.mapperService.importContacts(orgId, parsed.contacts, dryRun);
      this.updateJobProgress(jobId, {
        processedRecords: parsed.contacts.length,
        successCount: result.imported,
        failureCount: result.errors.length,
      });
    }

    if (parsed.invoices) {
      result = await this.mapperService.importInvoices(orgId, parsed.invoices, dryRun);
      this.updateJobProgress(jobId, {
        processedRecords: parsed.invoices.length,
        successCount: result.imported,
        failureCount: result.errors.length,
      });
    }

    if (parsed.vouchers) {
      result = await this.mapperService.importVouchers(orgId, parsed.vouchers, dryRun);
      this.updateJobProgress(jobId, {
        processedRecords: parsed.vouchers.length,
        successCount: result.imported,
        failureCount: result.errors.length,
      });
    }

    if (parsed.products) {
      result = await this.mapperService.importProducts(orgId, parsed.products, dryRun);
      this.updateJobProgress(jobId, {
        processedRecords: parsed.products.length,
        successCount: result.imported,
        failureCount: result.errors.length,
      });
    }

    return result;
  }

  /**
   * Get total records count
   */
  private getTotalRecords(parsed: ParsedMigrationData): number {
    return (
      (parsed.contacts?.length || 0) +
      (parsed.invoices?.length || 0) +
      (parsed.vouchers?.length || 0) +
      (parsed.products?.length || 0)
    );
  }

  /**
   * Get sample data
   */
  private getSampleData(parsed: ParsedMigrationData, limit: number): any[] {
    if (parsed.contacts) return parsed.contacts.slice(0, limit);
    if (parsed.invoices) return parsed.invoices.slice(0, limit);
    if (parsed.vouchers) return parsed.vouchers.slice(0, limit);
    if (parsed.products) return parsed.products.slice(0, limit);
    return [];
  }

  /**
   * Get field mapping for type
   */
  private getFieldMapping(type: LexofficeMigrationType): Record<string, string> {
    const mappings = require('./lexoffice.constants').FIELD_MAPPINGS;
    return mappings[type] || {};
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `lexoffice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize job progress tracking
   */
  private initializeJobProgress(jobId: string, type: LexofficeMigrationType): void {
    this.jobProgress.set(jobId, {
      jobId,
      status: 'pending',
      progress: 0,
      totalRecords: 0,
      processedRecords: 0,
      successCount: 0,
      failureCount: 0,
      errors: [],
      startedAt: new Date(),
    });
  }

  /**
   * Update job progress
   */
  private updateJobProgress(jobId: string, updates: Partial<MigrationProgress>): void {
    const current = this.jobProgress.get(jobId);
    if (current) {
      const updated = { ...current, ...updates };

      // Calculate progress percentage
      if (updated.totalRecords > 0) {
        updated.progress = Math.round((updated.processedRecords / updated.totalRecords) * 100);
      }

      this.jobProgress.set(jobId, updated);
    }
  }
}
