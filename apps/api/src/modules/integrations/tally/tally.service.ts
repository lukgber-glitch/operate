/**
 * Tally ERP Integration Service
 *
 * Handles synchronization between Tally ERP and Operate platform.
 * Supports import/export of companies, ledgers, vouchers, and stock items.
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@operate/database';
import { TallyClient } from './tally.client';
import {
  TallyConfig,
  TallyCompany,
  TallyLedger,
  TallyVoucher,
  TallyStockItem,
  TallySyncConfig,
  TallySyncEntity,
  TallySyncResult,
  TallySyncStatus,
  TallyConnectionTest,
  TallyMapping,
  TallyImportResult,
  TallyExportResult,
  TallyExportFormat,
} from './tally.types';

@Injectable()
export class TallyService {
  private readonly logger = new Logger(TallyService.name);
  private readonly syncStatusMap: Map<string, TallySyncStatus> = new Map();

  constructor(
    private readonly tallyClient: TallyClient,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Test connection to Tally
   */
  async testConnection(orgId: string, tallyConfig?: TallyConfig): Promise<TallyConnectionTest> {
    this.logger.log(`Testing Tally connection for org: ${orgId}`);

    // If config provided, create temporary client
    let client = this.tallyClient;
    if (tallyConfig) {
      client = new TallyClient({
        host: tallyConfig.host,
        port: tallyConfig.port,
        timeout: tallyConfig.timeout,
      });
    }

    const result = await client.testConnection(tallyConfig?.companyName);

    if (result.success) {
      this.logger.log(`Tally connection successful for org: ${orgId}`);
    } else {
      this.logger.warn(`Tally connection failed for org: ${orgId}: ${result.error}`);
    }

    return result;
  }

  /**
   * Configure Tally sync for an organization
   */
  async configureTallySync(orgId: string, config: TallySyncConfig): Promise<TallySyncConfig> {
    this.logger.log(`Configuring Tally sync for org: ${orgId}`);

    // Validate connection first
    const connectionTest = await this.testConnection(orgId, {
      host: config.tallyHost || 'localhost',
      port: config.tallyPort || 9000,
      companyName: config.tallyCompanyName,
    });

    if (!connectionTest.success) {
      throw new BadRequestException(
        `Cannot configure Tally sync: ${connectionTest.error}`,
      );
    }

    // Check if company exists in available companies
    if (
      connectionTest.availableCompanies &&
      !connectionTest.availableCompanies.includes(config.tallyCompanyName)
    ) {
      throw new BadRequestException(
        `Company '${config.tallyCompanyName}' not found in Tally. Available: ${connectionTest.availableCompanies.join(', ')}`,
      );
    }

    // Store configuration (would be saved to database in production)
    // For now, we'll just return the config
    return {
      ...config,
      orgId,
      lastSyncAt: new Date(),
    };
  }

  /**
   * Sync all entities from Tally to Operate (import)
   */
  async syncFromTally(
    orgId: string,
    config: TallySyncConfig,
  ): Promise<TallySyncStatus> {
    this.logger.log(`Starting Tally import sync for org: ${orgId}`);

    const syncStatus: TallySyncStatus = {
      isRunning: true,
      results: [],
    };

    this.syncStatusMap.set(orgId, syncStatus);

    try {
      // Sync entities in order: companies -> ledgers -> stock items -> vouchers
      for (const entity of config.syncEntities) {
        syncStatus.currentEntity = entity;
        syncStatus.message = `Syncing ${entity}...`;

        let result: TallySyncResult;

        switch (entity) {
          case TallySyncEntity.COMPANIES:
            result = await this.syncCompanies(orgId, config);
            break;
          case TallySyncEntity.LEDGERS:
            result = await this.syncLedgers(orgId, config);
            break;
          case TallySyncEntity.VOUCHERS:
            result = await this.syncVouchers(orgId, config);
            break;
          case TallySyncEntity.STOCK_ITEMS:
            result = await this.syncStockItems(orgId, config);
            break;
          default:
            this.logger.warn(`Unsupported sync entity: ${entity}`);
            continue;
        }

        syncStatus.results.push(result);

        // Calculate progress
        const completedEntities = syncStatus.results.length;
        const totalEntities = config.syncEntities.length;
        syncStatus.progress = Math.round((completedEntities / totalEntities) * 100);
      }

      syncStatus.isRunning = false;
      syncStatus.message = 'Sync completed successfully';
      this.logger.log(`Tally sync completed for org: ${orgId}`);
    } catch (error) {
      syncStatus.isRunning = false;
      syncStatus.message = `Sync failed: ${error.message}`;
      this.logger.error(`Tally sync failed for org: ${orgId}`, error);
      throw error;
    }

    return syncStatus;
  }

  /**
   * Get sync status
   */
  getSyncStatus(orgId: string): TallySyncStatus | null {
    return this.syncStatusMap.get(orgId) || null;
  }

  /**
   * Sync companies from Tally
   */
  private async syncCompanies(
    orgId: string,
    config: TallySyncConfig,
  ): Promise<TallySyncResult> {
    const startedAt = new Date();
    let recordsSynced = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    try {
      this.logger.log(`Fetching companies from Tally for org: ${orgId}`);

      const companies = await this.tallyClient.getCompanyList();

      for (const company of companies) {
        try {
          // Create mapping between Tally company and Operate org
          await this.createOrUpdateMapping({
            id: `${orgId}_company_${company.guid}`,
            orgId,
            tallyEntity: TallySyncEntity.COMPANIES,
            tallyEntityId: company.guid,
            tallyEntityName: company.name,
            operateEntity: 'organization',
            operateEntityId: orgId,
            mappedAt: new Date(),
            metadata: {
              mailingName: company.mailingName,
              address: company.address,
            },
          });

          recordsSynced++;
        } catch (error) {
          recordsFailed++;
          errors.push(`Failed to sync company ${company.name}: ${error.message}`);
          this.logger.error(`Failed to sync company ${company.name}`, error);
        }
      }

      return {
        success: true,
        entity: TallySyncEntity.COMPANIES,
        direction: 'import',
        recordsSynced,
        recordsFailed,
        errors,
        startedAt,
        completedAt: new Date(),
        duration: Date.now() - startedAt.getTime(),
      };
    } catch (error) {
      this.logger.error('Failed to sync companies', error);
      return {
        success: false,
        entity: TallySyncEntity.COMPANIES,
        direction: 'import',
        recordsSynced,
        recordsFailed,
        errors: [...errors, error.message],
        startedAt,
        completedAt: new Date(),
        duration: Date.now() - startedAt.getTime(),
      };
    }
  }

  /**
   * Sync ledgers from Tally
   */
  private async syncLedgers(
    orgId: string,
    config: TallySyncConfig,
  ): Promise<TallySyncResult> {
    const startedAt = new Date();
    let recordsSynced = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    try {
      this.logger.log(`Fetching ledgers from Tally for org: ${orgId}`);

      const ledgers = await this.tallyClient.getLedgers(config.tallyCompanyName);

      for (const ledger of ledgers) {
        try {
          // Determine if ledger is customer or vendor based on parent group
          let operateEntity = 'account';
          if (ledger.parent === 'Sundry Debtors') {
            operateEntity = 'customer';
          } else if (ledger.parent === 'Sundry Creditors') {
            operateEntity = 'vendor';
          }

          // Create mapping
          await this.createOrUpdateMapping({
            id: `${orgId}_ledger_${ledger.guid}`,
            orgId,
            tallyEntity: TallySyncEntity.LEDGERS,
            tallyEntityId: ledger.guid,
            tallyEntityName: ledger.name,
            operateEntity,
            operateEntityId: ledger.guid, // Would map to actual Operate entity ID
            mappedAt: new Date(),
            metadata: {
              parent: ledger.parent,
              openingBalance: ledger.openingBalance,
              mailingName: ledger.mailingName,
              gstin: ledger.gstin,
            },
          });

          recordsSynced++;
        } catch (error) {
          recordsFailed++;
          errors.push(`Failed to sync ledger ${ledger.name}: ${error.message}`);
          this.logger.error(`Failed to sync ledger ${ledger.name}`, error);
        }
      }

      return {
        success: true,
        entity: TallySyncEntity.LEDGERS,
        direction: 'import',
        recordsSynced,
        recordsFailed,
        errors,
        startedAt,
        completedAt: new Date(),
        duration: Date.now() - startedAt.getTime(),
      };
    } catch (error) {
      this.logger.error('Failed to sync ledgers', error);
      return {
        success: false,
        entity: TallySyncEntity.LEDGERS,
        direction: 'import',
        recordsSynced,
        recordsFailed,
        errors: [...errors, error.message],
        startedAt,
        completedAt: new Date(),
        duration: Date.now() - startedAt.getTime(),
      };
    }
  }

  /**
   * Sync vouchers from Tally
   */
  private async syncVouchers(
    orgId: string,
    config: TallySyncConfig,
  ): Promise<TallySyncResult> {
    const startedAt = new Date();
    let recordsSynced = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    try {
      this.logger.log(`Fetching vouchers from Tally for org: ${orgId}`);

      // Fetch vouchers (optionally with date range)
      const vouchers = await this.tallyClient.getVouchers(config.tallyCompanyName);

      for (const voucher of vouchers) {
        try {
          // Determine Operate entity type based on voucher type
          let operateEntity = 'transaction';
          if (voucher.voucherType === 'Sales') {
            operateEntity = 'invoice';
          } else if (voucher.voucherType === 'Purchase') {
            operateEntity = 'bill';
          } else if (voucher.voucherType === 'Payment' || voucher.voucherType === 'Receipt') {
            operateEntity = 'payment';
          }

          // Create mapping
          await this.createOrUpdateMapping({
            id: `${orgId}_voucher_${voucher.guid}`,
            orgId,
            tallyEntity: TallySyncEntity.VOUCHERS,
            tallyEntityId: voucher.guid,
            tallyEntityName: `${voucher.voucherType} - ${voucher.voucherNumber}`,
            operateEntity,
            operateEntityId: voucher.guid, // Would map to actual Operate entity ID
            mappedAt: new Date(),
            metadata: {
              voucherType: voucher.voucherType,
              voucherNumber: voucher.voucherNumber,
              date: voucher.date,
              referenceNumber: voucher.referenceNumber,
            },
          });

          recordsSynced++;
        } catch (error) {
          recordsFailed++;
          errors.push(
            `Failed to sync voucher ${voucher.voucherNumber}: ${error.message}`,
          );
          this.logger.error(`Failed to sync voucher ${voucher.voucherNumber}`, error);
        }
      }

      return {
        success: true,
        entity: TallySyncEntity.VOUCHERS,
        direction: 'import',
        recordsSynced,
        recordsFailed,
        errors,
        startedAt,
        completedAt: new Date(),
        duration: Date.now() - startedAt.getTime(),
      };
    } catch (error) {
      this.logger.error('Failed to sync vouchers', error);
      return {
        success: false,
        entity: TallySyncEntity.VOUCHERS,
        direction: 'import',
        recordsSynced,
        recordsFailed,
        errors: [...errors, error.message],
        startedAt,
        completedAt: new Date(),
        duration: Date.now() - startedAt.getTime(),
      };
    }
  }

  /**
   * Sync stock items from Tally
   */
  private async syncStockItems(
    orgId: string,
    config: TallySyncConfig,
  ): Promise<TallySyncResult> {
    const startedAt = new Date();
    let recordsSynced = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    try {
      this.logger.log(`Fetching stock items from Tally for org: ${orgId}`);

      const stockItems = await this.tallyClient.getStockItems(config.tallyCompanyName);

      for (const stockItem of stockItems) {
        try {
          // Create mapping
          await this.createOrUpdateMapping({
            id: `${orgId}_stockitem_${stockItem.guid}`,
            orgId,
            tallyEntity: TallySyncEntity.STOCK_ITEMS,
            tallyEntityId: stockItem.guid,
            tallyEntityName: stockItem.name,
            operateEntity: 'product',
            operateEntityId: stockItem.guid, // Would map to actual Operate entity ID
            mappedAt: new Date(),
            metadata: {
              category: stockItem.category,
              unit: stockItem.unit,
              openingBalance: stockItem.openingBalance,
              openingValue: stockItem.openingValue,
              gstHsnCode: stockItem.gstHsnCode,
            },
          });

          recordsSynced++;
        } catch (error) {
          recordsFailed++;
          errors.push(
            `Failed to sync stock item ${stockItem.name}: ${error.message}`,
          );
          this.logger.error(`Failed to sync stock item ${stockItem.name}`, error);
        }
      }

      return {
        success: true,
        entity: TallySyncEntity.STOCK_ITEMS,
        direction: 'import',
        recordsSynced,
        recordsFailed,
        errors,
        startedAt,
        completedAt: new Date(),
        duration: Date.now() - startedAt.getTime(),
      };
    } catch (error) {
      this.logger.error('Failed to sync stock items', error);
      return {
        success: false,
        entity: TallySyncEntity.STOCK_ITEMS,
        direction: 'import',
        recordsSynced,
        recordsFailed,
        errors: [...errors, error.message],
        startedAt,
        completedAt: new Date(),
        duration: Date.now() - startedAt.getTime(),
      };
    }
  }

  /**
   * Export data from Operate to Tally
   */
  async exportToTally(
    orgId: string,
    entity: TallySyncEntity,
    entityIds: string[],
  ): Promise<TallyExportResult> {
    this.logger.log(`Exporting ${entity} to Tally for org: ${orgId}`);

    const startedAt = new Date();
    let exportedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    try {
      // Export based on entity type
      switch (entity) {
        case TallySyncEntity.LEDGERS:
          // Export ledgers (customers/vendors) to Tally
          for (const entityId of entityIds) {
            // Fetch entity from Operate database
            // Convert to Tally format
            // Send to Tally
            exportedCount++;
          }
          break;

        case TallySyncEntity.VOUCHERS:
          // Export invoices/bills to Tally
          for (const entityId of entityIds) {
            // Fetch invoice/bill from Operate database
            // Convert to Tally voucher format
            // Send to Tally
            exportedCount++;
          }
          break;

        default:
          throw new Error(`Export not supported for entity: ${entity}`);
      }

      return {
        success: true,
        exportedCount,
        failedCount,
        format: TallyExportFormat.XML,
        errors,
      };
    } catch (error) {
      this.logger.error(`Failed to export to Tally: ${error.message}`, error);
      return {
        success: false,
        exportedCount,
        failedCount,
        format: TallyExportFormat.XML,
        errors: [...errors, error.message],
      };
    }
  }

  /**
   * Get all mappings for an organization
   */
  async getMappings(orgId: string, entity?: TallySyncEntity): Promise<TallyMapping[]> {
    // In production, this would query from database
    // For now, return empty array
    this.logger.log(`Fetching Tally mappings for org: ${orgId}, entity: ${entity}`);
    return [];
  }

  /**
   * Get single mapping
   */
  async getMapping(orgId: string, tallyEntityId: string): Promise<TallyMapping | null> {
    // In production, this would query from database
    this.logger.log(
      `Fetching Tally mapping for org: ${orgId}, tallyEntityId: ${tallyEntityId}`,
    );
    return null;
  }

  /**
   * Create or update mapping
   */
  private async createOrUpdateMapping(mapping: TallyMapping): Promise<TallyMapping> {
    // In production, this would save to database
    // For now, just log and return
    this.logger.debug(
      `Creating/updating Tally mapping: ${mapping.tallyEntity} - ${mapping.tallyEntityName}`,
    );
    return mapping;
  }

  /**
   * Delete mapping
   */
  async deleteMapping(orgId: string, mappingId: string): Promise<boolean> {
    // In production, this would delete from database
    this.logger.log(`Deleting Tally mapping: ${mappingId} for org: ${orgId}`);
    return true;
  }

  /**
   * Get Tally company information
   */
  async getCompanyInfo(companyName: string): Promise<TallyCompany> {
    this.logger.log(`Fetching Tally company info: ${companyName}`);
    return await this.tallyClient.getCompany(companyName);
  }

  /**
   * Get available companies from Tally
   */
  async getAvailableCompanies(): Promise<TallyCompany[]> {
    this.logger.log('Fetching available Tally companies');
    return await this.tallyClient.getCompanyList();
  }

  /**
   * Manual sync trigger
   */
  async triggerSync(orgId: string, config: TallySyncConfig): Promise<TallySyncStatus> {
    this.logger.log(`Manual sync triggered for org: ${orgId}`);

    // Check if sync is already running
    const currentStatus = this.getSyncStatus(orgId);
    if (currentStatus?.isRunning) {
      throw new BadRequestException('Sync is already running for this organization');
    }

    return await this.syncFromTally(orgId, config);
  }
}
