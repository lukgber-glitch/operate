import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { XeroMappingService, XeroSyncEntityType } from './xero-mapping.service';
import { XeroClient } from 'xero-node';
import { Contact } from 'xero-node/dist/gen/model/accounting/contact';

/**
 * Xero Customer/Contact Sync Service
 * Handles bidirectional sync of customers/suppliers between Operate and Xero
 */
@Injectable()
export class XeroCustomerSyncService {
  private readonly logger = new Logger(XeroCustomerSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mappingService: XeroMappingService,
  ) {}

  /**
   * Sync all contacts from Xero to Operate
   */
  async syncAllFromXero(
    connectionId: string,
    orgId: string,
    xeroContacts: Contact[],
  ): Promise<{
    created: number;
    updated: number;
    failed: number;
    errors: Array<{ contactId: string; error: string }>;
  }> {
    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors: Array<{ contactId: string; error: string }> = [];

    for (const xeroContact of xeroContacts) {
      try {
        // Check if contact already exists in mapping
        const operateId = await this.mappingService.getOperateId(
          connectionId,
          XeroSyncEntityType.CONTACT,
          xeroContact.contactID!,
        );

        if (operateId) {
          // Update existing customer
          await this.updateOperateCustomerFromXero(orgId, operateId, xeroContact);
          updated++;
        } else {
          // Create new customer
          const newCustomerId = await this.createOperateCustomerFromXero(
            orgId,
            xeroContact,
          );

          // Create mapping
          await this.mappingService.createMapping({
            connectionId,
            orgId,
            entityType: XeroSyncEntityType.CONTACT,
            operateId: newCustomerId,
            xeroId: xeroContact.contactID!,
            metadata: {
              xeroContactNumber: xeroContact.contactNumber,
              xeroStatus: xeroContact.contactStatus,
            },
          });
          created++;
        }
      } catch (error) {
        this.logger.error(
          `Failed to sync contact ${xeroContact.contactID}: ${error.message}`,
        );
        failed++;
        errors.push({
          contactId: xeroContact.contactID || 'unknown',
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Contact sync completed: ${created} created, ${updated} updated, ${failed} failed`,
    );

    return { created, updated, failed, errors };
  }

  /**
   * Create Operate customer from Xero contact
   */
  private async createOperateCustomerFromXero(
    orgId: string,
    xeroContact: Contact,
  ): Promise<string> {
    // Map Xero contact to Operate customer
    const customerData = this.mapXeroContactToOperate(xeroContact);

    // Create customer in Operate
    const customer = await this.prisma.customer.create({
      data: {
        orgId,
        ...customerData,
      },
    });

    this.logger.debug(`Created customer ${customer.id} from Xero contact ${xeroContact.contactID}`);

    return customer.id;
  }

  /**
   * Update Operate customer from Xero contact
   */
  private async updateOperateCustomerFromXero(
    orgId: string,
    customerId: string,
    xeroContact: Contact,
  ): Promise<void> {
    // Map Xero contact to Operate customer
    const customerData = this.mapXeroContactToOperate(xeroContact);

    // Update customer in Operate
    await this.prisma.customer.update({
      where: { id: customerId },
      data: customerData,
    });

    this.logger.debug(`Updated customer ${customerId} from Xero contact ${xeroContact.contactID}`);
  }

  /**
   * Map Xero contact to Operate customer format
   */
  private mapXeroContactToOperate(xeroContact: Contact): any {
    return {
      name: xeroContact.name || '',
      email: xeroContact.emailAddress || null,
      phone: xeroContact.phones?.find((p) => p.phoneType === 'DEFAULT')?.phoneNumber || null,
      taxNumber: xeroContact.taxNumber || null,
      // Address mapping
      street: xeroContact.addresses?.find((a) => a.addressType === 'STREET')?.addressLine1 || null,
      city: xeroContact.addresses?.find((a) => a.addressType === 'STREET')?.city || null,
      postalCode:
        xeroContact.addresses?.find((a) => a.addressType === 'STREET')?.postalCode || null,
      country: xeroContact.addresses?.find((a) => a.addressType === 'STREET')?.country || null,
      // Metadata
      metadata: {
        xeroContactId: xeroContact.contactID,
        xeroContactNumber: xeroContact.contactNumber,
        xeroContactStatus: xeroContact.contactStatus,
        firstName: xeroContact.firstName,
        lastName: xeroContact.lastName,
      },
    };
  }

  /**
   * Sync a single customer from Operate to Xero
   */
  async syncCustomerToXero(
    customerId: string,
    xeroClient: XeroClient,
    tenantId: string,
    connectionId: string,
    orgId: string,
  ): Promise<string> {
    // Get customer from Operate
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    // Check if customer already synced
    const xeroId = await this.mappingService.getXeroId(
      connectionId,
      XeroSyncEntityType.CONTACT,
      customerId,
    );

    // Map Operate customer to Xero contact
    const xeroContact = this.mapOperateCustomerToXero(customer);

    if (xeroId) {
      // Update existing contact in Xero
      xeroContact.contactID = xeroId;
      const response = await xeroClient.accountingApi.updateContact(
        tenantId,
        xeroId,
        { contacts: [xeroContact] },
      );

      this.logger.debug(`Updated Xero contact ${xeroId} from customer ${customerId}`);
      return xeroId;
    } else {
      // Create new contact in Xero
      const response = await xeroClient.accountingApi.createContacts(tenantId, {
        contacts: [xeroContact],
      });

      const newXeroId = response.body.contacts![0].contactID!;

      // Create mapping
      await this.mappingService.createMapping({
        connectionId,
        orgId,
        entityType: XeroSyncEntityType.CONTACT,
        operateId: customerId,
        xeroId: newXeroId,
        metadata: {
          xeroContactNumber: response.body.contacts![0].contactNumber,
        },
      });

      this.logger.debug(`Created Xero contact ${newXeroId} from customer ${customerId}`);
      return newXeroId;
    }
  }

  /**
   * Map Operate customer to Xero contact format
   */
  private mapOperateCustomerToXero(customer: any): Contact {
    const contact: Contact = {
      name: customer.name,
      emailAddress: customer.email || undefined,
      taxNumber: customer.taxNumber || undefined,
    };

    // Add phone if available
    if (customer.phone) {
      contact.phones = [
        {
          phoneType: 'DEFAULT' as any,
          phoneNumber: customer.phone,
        },
      ];
    }

    // Add address if available
    if (customer.street || customer.city || customer.postalCode) {
      contact.addresses = [
        {
          addressType: 'STREET' as any,
          addressLine1: customer.street || undefined,
          city: customer.city || undefined,
          postalCode: customer.postalCode || undefined,
          country: customer.country || undefined,
        },
      ];
    }

    return contact;
  }

  /**
   * Delete customer mapping when customer is deleted in Operate
   */
  async handleCustomerDeleted(customerId: string, connectionId: string): Promise<void> {
    await this.mappingService.deleteMapping(
      connectionId,
      XeroSyncEntityType.CONTACT,
      customerId,
    );
  }
}
