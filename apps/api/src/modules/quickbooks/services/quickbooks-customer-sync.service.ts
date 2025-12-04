import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QuickBooksMappingService } from './quickbooks-mapping.service';
import { QuickBooksCustomer } from '../quickbooks.types';

/**
 * QuickBooks Customer Sync Service
 * Handles bidirectional sync of customers between QuickBooks and Operate
 */
@Injectable()
export class QuickBooksCustomerSyncService {
  private readonly logger = new Logger(QuickBooksCustomerSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mappingService: QuickBooksMappingService,
  ) {}

  /**
   * Sync customer from QuickBooks to Operate
   */
  async syncFromQuickBooks(
    connectionId: string,
    orgId: string,
    qbCustomer: QuickBooksCustomer,
  ): Promise<{ clientId: string; isNew: boolean }> {
    try {
      // Check if customer already exists in mapping
      const existingOperateId = await this.mappingService.getOperateId(
        connectionId,
        'CUSTOMER',
        qbCustomer.Id,
      );

      const email = qbCustomer.PrimaryEmailAddr?.Address || null;
      const phone = qbCustomer.PrimaryPhone?.FreeFormNumber || null;
      const address = qbCustomer.BillAddr;

      const clientData = {
        name: qbCustomer.DisplayName,
        type: 'COMPANY' as const,
        status: qbCustomer.Active ? ('ACTIVE' as const) : ('INACTIVE' as const),
        companyName: qbCustomer.CompanyName || qbCustomer.DisplayName,
        email,
        phone,
        street: address?.Line1 || null,
        city: address?.City || null,
        postalCode: address?.PostalCode || null,
        state: address?.CountrySubDivisionCode || null,
        metadata: {
          quickbooksId: qbCustomer.Id,
          quickbooksBalance: qbCustomer.Balance,
          syncedAt: new Date().toISOString(),
        },
      };

      let clientId: string;
      let isNew: boolean;

      if (existingOperateId) {
        // Update existing client
        const client = await this.prisma.client.update({
          where: { id: existingOperateId },
          data: clientData,
        });
        clientId = client.id;
        isNew = false;
        this.logger.debug(`Updated existing customer ${clientId} from QB ${qbCustomer.Id}`);
      } else {
        // Create new client
        const client = await this.prisma.client.create({
          data: {
            ...clientData,
            orgId,
          },
        });
        clientId = client.id;
        isNew = true;
        this.logger.debug(`Created new customer ${clientId} from QB ${qbCustomer.Id}`);
      }

      // Create/update mapping
      await this.mappingService.createMapping({
        connectionId,
        orgId,
        entityType: 'CUSTOMER',
        operateId: clientId,
        quickbooksId: qbCustomer.Id,
        metadata: {
          displayName: qbCustomer.DisplayName,
          balance: qbCustomer.Balance,
        },
      });

      return { clientId, isNew };
    } catch (error) {
      this.logger.error(`Failed to sync customer from QuickBooks: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Sync customer from Operate to QuickBooks
   */
  async syncToQuickBooks(
    connectionId: string,
    clientId: string,
    accessToken: string,
    companyId: string,
  ): Promise<{ quickbooksId: string; isNew: boolean }> {
    try {
      // Get client from Operate
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new Error(`Client ${clientId} not found`);
      }

      // Check if customer already exists in QuickBooks
      const existingQbId = await this.mappingService.getQuickBooksId(
        connectionId,
        'CUSTOMER',
        clientId,
      );

      // Map Operate client to QuickBooks customer format
      const qbCustomerData: Partial<QuickBooksCustomer> = {
        DisplayName: client.name,
        CompanyName: client.companyName || undefined,
        GivenName: undefined,
        FamilyName: undefined,
        PrimaryEmailAddr: client.email
          ? { Address: client.email }
          : undefined,
        PrimaryPhone: client.phone
          ? { FreeFormNumber: client.phone }
          : undefined,
        BillAddr: {
          Line1: client.street || undefined,
          City: client.city || undefined,
          CountrySubDivisionCode: client.state || undefined,
          PostalCode: client.postalCode || undefined,
        },
        Active: client.status === 'ACTIVE',
      };

      // TODO: Call QuickBooks API to create/update customer
      // This would use the intuit-oauth library or direct HTTP calls
      // For now, returning placeholder

      const quickbooksId = existingQbId || `QB-${Date.now()}`;
      const isNew = !existingQbId;

      // Create/update mapping
      await this.mappingService.createMapping({
        connectionId,
        orgId: client.orgId,
        entityType: 'CUSTOMER',
        operateId: clientId,
        quickbooksId,
        metadata: {
          displayName: client.name,
        },
      });

      return { quickbooksId, isNew };
    } catch (error) {
      this.logger.error(`Failed to sync customer to QuickBooks: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Sync all customers from QuickBooks to Operate (initial import)
   */
  async syncAllFromQuickBooks(
    connectionId: string,
    orgId: string,
    qbCustomers: QuickBooksCustomer[],
  ): Promise<{
    created: number;
    updated: number;
    failed: number;
    errors: Array<{ customerId: string; error: string }>;
  }> {
    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors: Array<{ customerId: string; error: string }> = [];

    for (const qbCustomer of qbCustomers) {
      try {
        const result = await this.syncFromQuickBooks(connectionId, orgId, qbCustomer);
        if (result.isNew) {
          created++;
        } else {
          updated++;
        }
      } catch (error) {
        failed++;
        errors.push({
          customerId: qbCustomer.Id,
          error: error.message,
        });
        this.logger.error(`Failed to sync customer ${qbCustomer.Id}: ${error.message}`);
      }
    }

    this.logger.log(
      `Customer sync completed: ${created} created, ${updated} updated, ${failed} failed`,
    );

    return { created, updated, failed, errors };
  }

  /**
   * Sync all customers from Operate to QuickBooks
   */
  async syncAllToQuickBooks(
    connectionId: string,
    orgId: string,
    accessToken: string,
    companyId: string,
  ): Promise<{
    created: number;
    updated: number;
    failed: number;
    errors: Array<{ clientId: string; error: string }>;
  }> {
    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors: Array<{ clientId: string; error: string }> = [];

    // Get all active clients for the organization
    const clients = await this.prisma.client.findMany({
      where: {
        orgId,
        status: 'ACTIVE',
      },
    });

    for (const client of clients) {
      try {
        const result = await this.syncToQuickBooks(
          connectionId,
          client.id,
          accessToken,
          companyId,
        );
        if (result.isNew) {
          created++;
        } else {
          updated++;
        }
      } catch (error) {
        failed++;
        errors.push({
          clientId: client.id,
          error: error.message,
        });
        this.logger.error(`Failed to sync client ${client.id}: ${error.message}`);
      }
    }

    this.logger.log(
      `Customer sync to QB completed: ${created} created, ${updated} updated, ${failed} failed`,
    );

    return { created, updated, failed, errors };
  }

  /**
   * Detect conflicts between Operate and QuickBooks customer data
   */
  async detectConflict(
    operateClient: any,
    qbCustomer: QuickBooksCustomer,
  ): Promise<{
    hasConflict: boolean;
    conflictFields: string[];
  }> {
    const conflicts: string[] = [];

    // Compare key fields
    if (operateClient.name !== qbCustomer.DisplayName) {
      conflicts.push('name');
    }

    if (operateClient.email !== qbCustomer.PrimaryEmailAddr?.Address) {
      conflicts.push('email');
    }

    if (operateClient.phone !== qbCustomer.PrimaryPhone?.FreeFormNumber) {
      conflicts.push('phone');
    }

    return {
      hasConflict: conflicts.length > 0,
      conflictFields: conflicts,
    };
  }
}
