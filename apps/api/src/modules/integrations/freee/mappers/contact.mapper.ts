import { Injectable, Logger } from '@nestjs/common';
import { FreeePartner } from '../freee.types';

/**
 * freee Contact/Partner Mapper
 * Maps between Operate contacts and freee partners (取引先)
 */
@Injectable()
export class FreeeContactMapper {
  private readonly logger = new Logger(FreeeContactMapper.name);

  /**
   * Map freee partner to Operate contact
   */
  mapToOperateContact(partner: FreeePartner): any {
    try {
      return {
        externalId: `freee_${partner.id}`,
        externalSystem: 'freee',
        name: partner.name,
        displayName: partner.long_name || partner.name,
        nameKana: partner.name_kana,
        email: partner.email,
        phone: partner.phone,
        contactPerson: partner.contact_name,

        // Address
        address: partner.address_attributes ? {
          postalCode: partner.address_attributes.zipcode,
          prefectureCode: partner.address_attributes.prefecture_code,
          address1: partner.address_attributes.street_name1,
          address2: partner.address_attributes.street_name2,
        } : null,

        // Bank details
        bankAccount: partner.partner_bank_account_attributes ? {
          bankName: partner.partner_bank_account_attributes.bank_name,
          bankCode: partner.partner_bank_account_attributes.bank_code,
          branchName: partner.partner_bank_account_attributes.branch_name,
          branchCode: partner.partner_bank_account_attributes.branch_code,
          accountType: partner.partner_bank_account_attributes.account_type,
          accountNumber: partner.partner_bank_account_attributes.account_number,
          accountName: partner.partner_bank_account_attributes.account_name,
        } : null,

        // Invoice settings
        invoiceSettings: partner.partner_doc_setting_attributes ? {
          sendingMethod: partner.partner_doc_setting_attributes.sending_method,
        } : null,

        // Tax details
        taxInfo: {
          invoiceRegistrationNumber: partner.invoice_registration_number,
          qualifiedInvoiceIssuer: partner.qualified_invoice_issuer,
          countryCode: partner.country_code,
        },

        // Shortcuts for quick reference
        shortcut1: partner.shortcut1,
        shortcut2: partner.shortcut2,

        // Status
        isActive: partner.available,

        // Organization code
        orgCode: partner.org_code,

        // Metadata
        metadata: {
          freeeCompanyId: partner.company_id,
          payerWalletableId: partner.payer_walletable_id,
          transferFeeHandlingSide: partner.transfer_fee_handling_side,
          defaultTitle: partner.default_title,
        },

        syncedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to map freee partner ${partner.id}`, error);
      throw error;
    }
  }

  /**
   * Map Operate contact to freee partner
   */
  mapToFreeePartner(contact: any, freeeCompanyId: number): Partial<FreeePartner> {
    try {
      const partner: any = {
        company_id: freeeCompanyId,
        name: contact.name,
        long_name: contact.displayName || contact.name,
        name_kana: contact.nameKana,
        email: contact.email,
        phone: contact.phone,
        contact_name: contact.contactPerson,
      };

      // Add address if available
      if (contact.address) {
        partner.address_attributes = {
          zipcode: contact.address.postalCode,
          prefecture_code: contact.address.prefectureCode,
          street_name1: contact.address.address1,
          street_name2: contact.address.address2,
        };
      }

      // Add bank account if available
      if (contact.bankAccount) {
        partner.partner_bank_account_attributes = {
          bank_name: contact.bankAccount.bankName,
          bank_code: contact.bankAccount.bankCode,
          branch_name: contact.bankAccount.branchName,
          branch_code: contact.bankAccount.branchCode,
          account_type: contact.bankAccount.accountType,
          account_number: contact.bankAccount.accountNumber,
          account_name: contact.bankAccount.accountName,
        };
      }

      // Add invoice settings if available
      if (contact.invoiceSettings) {
        partner.partner_doc_setting_attributes = {
          sending_method: contact.invoiceSettings.sendingMethod,
        };
      }

      // Add tax info if available
      if (contact.taxInfo) {
        partner.invoice_registration_number = contact.taxInfo.invoiceRegistrationNumber;
        partner.qualified_invoice_issuer = contact.taxInfo.qualifiedInvoiceIssuer;
        partner.country_code = contact.taxInfo.countryCode || 'JP';
      }

      // Add shortcuts if available
      if (contact.shortcut1) {
        partner.shortcut1 = contact.shortcut1;
      }
      if (contact.shortcut2) {
        partner.shortcut2 = contact.shortcut2;
      }

      return partner;
    } catch (error) {
      this.logger.error(`Failed to map Operate contact ${contact.id}`, error);
      throw error;
    }
  }

  /**
   * Map array of freee partners to Operate contacts
   */
  mapToOperateContacts(partners: FreeePartner[]): any[] {
    return partners.map((partner) => this.mapToOperateContact(partner));
  }

  /**
   * Detect changes between Operate contact and freee partner
   */
  detectChanges(operateContact: any, freeePartner: FreeePartner): string[] {
    const changes: string[] = [];

    if (operateContact.name !== freeePartner.name) {
      changes.push('name');
    }
    if (operateContact.email !== freeePartner.email) {
      changes.push('email');
    }
    if (operateContact.phone !== freeePartner.phone) {
      changes.push('phone');
    }

    // Check address changes
    if (operateContact.address && freeePartner.address_attributes) {
      if (operateContact.address.postalCode !== freeePartner.address_attributes.zipcode) {
        changes.push('address.postalCode');
      }
      if (operateContact.address.address1 !== freeePartner.address_attributes.street_name1) {
        changes.push('address.address1');
      }
    }

    return changes;
  }

  /**
   * Merge changes from freee to Operate contact
   */
  mergeChanges(operateContact: any, freeePartner: FreeePartner): any {
    return {
      ...operateContact,
      name: freeePartner.name,
      displayName: freeePartner.long_name || freeePartner.name,
      email: freeePartner.email,
      phone: freeePartner.phone,
      contactPerson: freeePartner.contact_name,
      isActive: freeePartner.available,
      syncedAt: new Date(),
    };
  }
}
