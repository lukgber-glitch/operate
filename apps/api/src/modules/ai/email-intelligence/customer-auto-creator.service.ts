/**
 * Customer Auto-Creator Service
 * Automatically creates/updates customer profiles from email interactions
 *
 * Rules:
 * - QUOTE_REQUEST from unknown → Create Customer (status: LEAD)
 * - INVOICE_SENT to recipient → Create/Update Customer (status: ACTIVE)
 * - PAYMENT_RECEIVED from sender → Update Customer (paying customer)
 * - Multiple emails from same domain → Group as single Customer
 */

import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { EntityExtractorService } from './entity-extractor.service';
import { CustomerMatcherService } from './matchers/customer-matcher.service';
import { EmailFilterService } from './email-filter.service';
import { ReviewQueueService } from './review-queue.service';
import {
  ExtractedEntities,
  CompanyRole,
  ExtractedCompany,
} from './types/extracted-entities.types';
import {
  EmailClassification,
  ClassificationResult,
} from './types/email-classification.types';
import { extractDomain, normalizeCompanyName } from './parsers/signature-parser';

export interface CustomerAutoCreateResult {
  customer?: any; // Prisma Customer type
  action: 'CREATED' | 'UPDATED' | 'MATCHED' | 'SKIPPED' | 'QUEUED_FOR_REVIEW';
  changes?: string[];
  reason?: string;
  skipCode?: string;
  reviewType?: string;
}

export interface EmailMessage {
  id?: string;
  externalId?: string;
  subject: string;
  body: string;
  from: string;
  to: string;
  cc?: string[];
  date?: Date;
}

/**
 * Map email classification to customer status
 */
const CLASSIFICATION_TO_STATUS: Record<
  EmailClassification,
  'LEAD' | 'ACTIVE' | null
> = {
  [EmailClassification.QUOTE_REQUEST]: 'LEAD',
  [EmailClassification.CUSTOMER_INQUIRY]: 'LEAD',
  [EmailClassification.INVOICE_SENT]: 'ACTIVE',
  [EmailClassification.PAYMENT_RECEIVED]: 'ACTIVE',
  [EmailClassification.ORDER_CONFIRMATION]: 'ACTIVE',
  [EmailClassification.INVOICE_RECEIVED]: null, // Vendor, not customer
  [EmailClassification.PAYMENT_SENT]: null, // Vendor, not customer
  [EmailClassification.PAYMENT_REMINDER]: null,
  [EmailClassification.QUOTE_SENT]: null,
  [EmailClassification.SUPPORT_REQUEST]: 'ACTIVE',
  [EmailClassification.COMPLAINT]: 'ACTIVE',
  [EmailClassification.FEEDBACK]: 'ACTIVE',
  [EmailClassification.CONTRACT]: null,
  [EmailClassification.LEGAL]: null,
  [EmailClassification.TAX_DOCUMENT]: null,
  [EmailClassification.NEWSLETTER]: null,
  [EmailClassification.NOTIFICATION]: null,
  [EmailClassification.SPAM]: null,
  [EmailClassification.BUSINESS_GENERAL]: null,
  [EmailClassification.PERSONAL]: null,
  [EmailClassification.UNKNOWN]: null,
};

@Injectable()
export class CustomerAutoCreatorService {
  private readonly logger = new Logger(CustomerAutoCreatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly entityExtractor: EntityExtractorService,
    private readonly customerMatcher: CustomerMatcherService,
    private readonly emailFilterService: EmailFilterService,
    private readonly reviewQueueService: ReviewQueueService,
  ) {}

  /**
   * Process an email and auto-create/update customer if appropriate
   */
  async processEmail(
    email: EmailMessage,
    classification: ClassificationResult,
    entities: ExtractedEntities,
    orgId: string,
    headers?: Record<string, string>,
  ): Promise<CustomerAutoCreateResult> {
    this.logger.log(
      `Processing email for customer auto-creation: "${email.subject.substring(0, 50)}..." (${classification.classification})`,
    );

    // === NEW: Apply email filter ===
    const filterResult = await this.emailFilterService.filterEmail(orgId, {
      from: email.from,
      to: Array.isArray(email.to) ? email.to : [email.to],
      subject: email.subject,
      headers,
      classificationConfidence: classification.confidence,
      entityConfidence: this.getAverageEntityConfidence(entities),
    });

    // Handle filter result
    if (filterResult.action === 'SKIP') {
      this.logger.log(`Email skipped: ${filterResult.reason}`);
      return {
        action: 'SKIPPED',
        reason: filterResult.reason,
        skipCode: filterResult.skipCode,
      };
    }

    if (filterResult.action === 'REVIEW') {
      // Queue for manual review
      const senderEmail = this.extractEmail(email.from);
      const senderDomain = this.extractDomain(senderEmail);

      await this.reviewQueueService.queueForReview(orgId, {
        emailId: email.id || email.externalId || '',
        reviewType: filterResult.reviewType || 'MANUAL_CHECK',
        reviewReason: filterResult.reason,
        senderEmail: senderEmail || email.from,
        senderDomain: senderDomain || '',
        extractedCompany: entities.companies?.[0]?.name,
        extractedContacts: entities.contacts,
        classification: classification.classification,
        confidence: filterResult.confidence,
        suggestedAction: this.getSuggestedAction(classification),
      });

      this.logger.log(`Email queued for review: ${filterResult.reason}`);
      return {
        action: 'QUEUED_FOR_REVIEW',
        reason: filterResult.reason,
        reviewType: filterResult.reviewType,
      };
    }

    // === Continue with existing logic ===

    // Check if this classification warrants customer creation
    const customerStatus = CLASSIFICATION_TO_STATUS[classification.classification];

    if (!customerStatus) {
      this.logger.debug(
        `Classification ${classification.classification} does not trigger customer creation`,
      );
      return {
        action: 'SKIPPED',
        reason: 'Classification does not require customer record',
      };
    }

    // Extract customer company (prioritize CUSTOMER role)
    const customerCompany = this.findCustomerCompany(entities, classification);

    if (!customerCompany) {
      this.logger.debug('No customer company found in extracted entities');
      return {
        action: 'SKIPPED',
        reason: 'No customer company identified in email',
      };
    }

    // Extract contact info
    const contact = this.findPrimaryContact(entities, customerCompany.name);

    // Try to match to existing customer
    const matchResult = await this.customerMatcher.matchCustomer(orgId, {
      companyName: customerCompany.name,
      email: contact?.email,
      vatId: customerCompany.vatId,
    });

    if (matchResult && matchResult.confidence > 0.75) {
      // Update existing customer
      this.logger.log(
        `Matched existing customer: ${matchResult.customer.name} (confidence: ${matchResult.confidence.toFixed(2)})`,
      );

      const updated = await this.updateCustomerFromEmail(
        matchResult.customer,
        entities,
        classification,
        customerStatus,
      );

      return updated;
    }

    // Create new customer
    this.logger.log(`Creating new customer: ${customerCompany.name}`);

    const created = await this.createFromEmail(
      entities,
      classification,
      orgId,
      customerStatus,
      customerCompany,
      contact,
    );

    return created;
  }

  /**
   * Match email to existing customer without creating
   */
  async matchToExistingCustomer(
    companyName: string,
    email: string,
    orgId: string,
  ): Promise<any | null> {
    const matchResult = await this.customerMatcher.matchCustomer(orgId, {
      companyName,
      email,
    });

    if (matchResult && matchResult.confidence > 0.75) {
      return matchResult.customer;
    }

    return null;
  }

  /**
   * Create new customer from email data
   */
  private async createFromEmail(
    entities: ExtractedEntities,
    classification: ClassificationResult,
    orgId: string,
    status: 'LEAD' | 'ACTIVE',
    customerCompany: ExtractedCompany,
    contact: any,
  ): Promise<CustomerAutoCreateResult> {
    const changes: string[] = [];

    const customerData = {
      orgId,
      name: customerCompany.name,
      email: contact?.email || null,
      phone: contact?.phone || null,
      address: entities.addresses[0]?.full || null,
      vatId: customerCompany.vatId || null,
      isActive: true,
      metadata: {
        source: 'EMAIL_AUTO_CREATED',
        sourceClassification: classification.classification,
        extractedAt: new Date().toISOString(),
        confidence: classification.confidence,
        status,
        contacts: contact
          ? [
              {
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                role: contact.role,
              },
            ]
          : [],
      },
    };

    try {
      const customer = await this.prisma.customer.create({
        data: customerData,
      });

      changes.push(`Created customer: ${customer.name}`);
      changes.push(`Status: ${status}`);
      if (contact) {
        changes.push(`Added contact: ${contact.name} (${contact.email})`);
      }

      this.logger.log(`Successfully created customer: ${customer.id}`);

      return {
        customer,
        action: 'CREATED',
        changes,
      };
    } catch (error) {
      this.logger.error(`Failed to create customer: ${error.message}`, error.stack);

      return {
        action: 'SKIPPED',
        reason: `Database error: ${error.message}`,
      };
    }
  }

  /**
   * Update existing customer from email data
   */
  private async updateCustomerFromEmail(
    customer: any,
    entities: ExtractedEntities,
    classification: ClassificationResult,
    status: 'LEAD' | 'ACTIVE',
  ): Promise<CustomerAutoCreateResult> {
    const changes: string[] = [];
    const updates: any = {};

    // Get existing metadata
    const metadata = (customer.metadata as unknown as {
      contacts?: any[];
      status?: string;
      lastEmailInteraction?: any;
      [key: string]: any;
    }) || {};
    const existingContacts = metadata.contacts || [];

    // Update status if promoting from LEAD to ACTIVE
    if (status === 'ACTIVE' && metadata.status === 'LEAD') {
      metadata.status = 'ACTIVE';
      changes.push('Promoted from LEAD to ACTIVE customer');
    }

    // Add new contacts
    const newContacts = entities.contacts.filter(
      (c) => !existingContacts.find((ec: any) => ec.email === c.email),
    );

    if (newContacts.length > 0) {
      metadata.contacts = [
        ...existingContacts,
        ...newContacts.map((c) => ({
          name: c.name,
          email: c.email,
          phone: c.phone,
          role: c.role,
          addedAt: new Date().toISOString(),
        })),
      ];
      changes.push(`Added ${newContacts.length} new contact(s)`);
    }

    // Update email if not set
    if (!customer.email && entities.contacts.length > 0) {
      updates.email = entities.contacts[0].email;
      changes.push(`Set email: ${updates.email}`);
    }

    // Update phone if not set
    if (!customer.phone && entities.contacts.length > 0 && entities.contacts[0].phone) {
      updates.phone = entities.contacts[0].phone;
      changes.push(`Set phone: ${updates.phone}`);
    }

    // Update address if not set
    if (!customer.address && entities.addresses.length > 0) {
      updates.address = entities.addresses[0].full;
      changes.push(`Set address: ${updates.address}`);
    }

    // Update VAT ID if not set
    if (!customer.vatId && entities.companies.length > 0 && entities.companies[0].vatId) {
      updates.vatId = entities.companies[0].vatId;
      changes.push(`Set VAT ID: ${updates.vatId}`);
    }

    // Track last interaction
    metadata.lastEmailInteraction = {
      date: new Date().toISOString(),
      classification: classification.classification,
      subject: entities.emailSubject,
    };

    updates.metadata = metadata as unknown as Prisma.InputJsonValue;

    // Only update if there are changes
    if (changes.length === 0) {
      this.logger.debug(`No updates needed for customer: ${customer.name}`);
      return {
        customer,
        action: 'MATCHED',
        reason: 'Customer already up to date',
      };
    }

    try {
      const updatedCustomer = await this.prisma.customer.update({
        where: { id: customer.id },
        data: updates,
      });

      this.logger.log(`Updated customer: ${customer.name} (${changes.length} changes)`);

      return {
        customer: updatedCustomer,
        action: 'UPDATED',
        changes,
      };
    } catch (error) {
      this.logger.error(`Failed to update customer: ${error.message}`, error.stack);

      return {
        customer,
        action: 'MATCHED',
        reason: `Update failed: ${error.message}`,
      };
    }
  }

  /**
   * Find the customer company from extracted entities
   * Prioritizes companies with CUSTOMER role
   */
  private findCustomerCompany(
    entities: ExtractedEntities,
    classification: ClassificationResult,
  ): ExtractedCompany | null {
    if (entities.companies.length === 0) return null;

    // First, try to find company marked as CUSTOMER
    const customerCompany = entities.companies.find(
      (c) => c.role === CompanyRole.CUSTOMER,
    );

    if (customerCompany) return customerCompany;

    // For QUOTE_REQUEST and CUSTOMER_INQUIRY, first company is usually customer
    if (
      classification.classification === EmailClassification.QUOTE_REQUEST ||
      classification.classification === EmailClassification.CUSTOMER_INQUIRY
    ) {
      return entities.companies[0];
    }

    // For INVOICE_SENT, look for customer in entities or use first company
    return entities.companies[0];
  }

  /**
   * Find primary contact for a company
   */
  private findPrimaryContact(
    entities: ExtractedEntities,
    companyName?: string,
  ): any | null {
    if (entities.contacts.length === 0) return null;

    // If company name provided, try to match contact to company
    if (companyName) {
      const companyContact = entities.contacts.find(
        (c) => c.company && normalizeCompanyName(c.company) === normalizeCompanyName(companyName),
      );

      if (companyContact) return companyContact;
    }

    // Return first contact
    return entities.contacts[0];
  }

  // ==================== Helper Methods for Email Filtering ====================

  /**
   * Calculate average confidence from extracted entities
   */
  private getAverageEntityConfidence(entities: ExtractedEntities): number {
    const confidences: number[] = [];

    entities.companies?.forEach((c) => {
      if (c.confidence !== undefined) confidences.push(c.confidence);
    });
    entities.contacts?.forEach((c) => {
      if (c.confidence !== undefined) confidences.push(c.confidence);
    });

    if (confidences.length === 0) return 1.0;
    return confidences.reduce((a, b) => a + b, 0) / confidences.length;
  }

  /**
   * Get suggested action based on classification
   */
  private getSuggestedAction(
    classification: ClassificationResult,
  ): 'CREATE_CUSTOMER' | 'CREATE_VENDOR' | 'SKIP' {
    const customerTypes = [
      'QUOTE_REQUEST',
      'CUSTOMER_INQUIRY',
      'ORDER_CONFIRMATION',
      'SUPPORT_REQUEST',
    ];
    const vendorTypes = ['INVOICE_RECEIVED', 'BILL_RECEIVED', 'VENDOR_COMMUNICATION'];

    if (customerTypes.includes(classification.classification)) {
      return 'CREATE_CUSTOMER';
    }
    if (vendorTypes.includes(classification.classification)) {
      return 'CREATE_VENDOR';
    }
    return 'SKIP';
  }

  /**
   * Extract email from "Name <email@example.com>" format
   */
  private extractEmail(from: string): string | null {
    const match = from.match(/<([^>]+)>/) || from.match(/([^\s<>]+@[^\s<>]+)/);
    return match ? match[1].toLowerCase() : null;
  }

  /**
   * Extract domain from email address
   */
  private extractDomain(email: string | null): string | null {
    if (!email) return null;
    const match = email.match(/@(.+)$/);
    return match ? match[1].toLowerCase() : null;
  }
}
