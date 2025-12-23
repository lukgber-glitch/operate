import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { XeroMappingService, XeroSyncEntityType } from './xero-mapping.service';
import { XeroClient } from 'xero-node';
import { Contact } from 'xero-node/dist/gen/model/accounting/contact';
import { Address } from 'xero-node/dist/gen/model/accounting/address';
import { Phone } from 'xero-node/dist/gen/model/accounting/phone';

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
    const streetAddress = xeroContact.addresses?.find((a) => a.addressType === Address.AddressTypeEnum.STREET);
    const postalAddress = xeroContact.addresses?.find((a) => a.addressType === Address.AddressTypeEnum.POBOX);

    // Build address string from Xero address parts
    const addressParts: string[] = [];
    if (streetAddress?.addressLine1) addressParts.push(streetAddress.addressLine1);
    if (streetAddress?.addressLine2) addressParts.push(streetAddress.addressLine2);
    if (streetAddress?.city) addressParts.push(streetAddress.city);
    if (streetAddress?.postalCode) addressParts.push(streetAddress.postalCode);
    if (streetAddress?.country) addressParts.push(streetAddress.country);

    return {
      name: xeroContact.name || '',
      email: xeroContact.emailAddress || null,
      phone: xeroContact.phones?.find((p) => p.phoneType === Phone.PhoneTypeEnum.DEFAULT)?.phoneNumber || null,
      vatId: xeroContact.taxNumber || null,
      taxId: xeroContact.taxNumber || null,
      firstName: xeroContact.firstName || null,
      lastName: xeroContact.lastName || null,
      address: addressParts.length > 0 ? addressParts.join(', ') : null,
      // Store full address details in billingAddress
      billingAddress: streetAddress ? {
        addressLine1: streetAddress.addressLine1 || '',
        addressLine2: streetAddress.addressLine2 || '',
        city: streetAddress.city || '',
        region: streetAddress.region || '',
        postalCode: streetAddress.postalCode || '',
        country: streetAddress.country || '',
        addressType: streetAddress.addressType,
      } : null,
      // Store postal address in shippingAddress if different
      shippingAddress: postalAddress ? {
        addressLine1: postalAddress.addressLine1 || '',
        addressLine2: postalAddress.addressLine2 || '',
        city: postalAddress.city || '',
        region: postalAddress.region || '',
        postalCode: postalAddress.postalCode || '',
        country: postalAddress.country || '',
        addressType: postalAddress.addressType,
      } : null,
      // Metadata
      metadata: {
        xeroContactId: xeroContact.contactID,
        xeroContactNumber: xeroContact.contactNumber,
        xeroContactStatus: xeroContact.contactStatus,
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
      taxNumber: customer.vatId || customer.taxId || undefined,
      firstName: customer.firstName || undefined,
      lastName: customer.lastName || undefined,
    };

    // Add phone if available
    if (customer.phone) {
      contact.phones = [
        {
          phoneType: Phone.PhoneTypeEnum.DEFAULT,
          phoneNumber: customer.phone,
        },
      ];
    }

    // Add address from billingAddress JSON if available
    if (customer.billingAddress) {
      const billing = customer.billingAddress;
      contact.addresses = [
        {
          addressType: Address.AddressTypeEnum.STREET,
          addressLine1: billing.addressLine1 || undefined,
          addressLine2: billing.addressLine2 || undefined,
          city: billing.city || undefined,
          region: billing.region || undefined,
          postalCode: billing.postalCode || undefined,
          country: billing.country || undefined,
        },
      ];
    }

    // Add shipping/postal address if available
    if (customer.shippingAddress) {
      const shipping = customer.shippingAddress;
      if (!contact.addresses) contact.addresses = [];
      contact.addresses.push({
        addressType: Address.AddressTypeEnum.POBOX,
        addressLine1: shipping.addressLine1 || undefined,
        addressLine2: shipping.addressLine2 || undefined,
        city: shipping.city || undefined,
        region: shipping.region || undefined,
        postalCode: shipping.postalCode || undefined,
        country: shipping.country || undefined,
      });
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
