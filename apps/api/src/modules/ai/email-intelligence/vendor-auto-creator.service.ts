/**
 * Vendor Auto-Creator Service
 * Automatically creates/updates vendor profiles from email intelligence
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EntityExtractorService } from './entity-extractor.service';
import { VendorMatcherService } from './matchers/vendor-matcher.service';
import {
  EmailClassification,
  EmailInput,
  ClassificationResult,
} from './types/email-classification.types';
import { ExtractedEntities } from './types/extracted-entities.types';
import { ExtractedInvoiceDataDto } from '../extractors/dto/invoice-extraction.dto';
import { Vendor, Bill, VendorStatus, TaxIdType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface EmailMessage {
  id?: string;
  subject: string;
  body: string;
  from: string;
  to: string;
  receivedAt?: Date;
}

export interface VendorCreationResult {
  vendor?: Vendor;
  bill?: Bill;
  action: 'CREATED' | 'UPDATED' | 'MATCHED' | 'SKIPPED';
  matchConfidence?: number;
  reasoning: string;
}

/**
 * Vendor information extracted from email/invoice
 */
interface VendorInfo {
  companyName?: string;
  name?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  taxIdType?: TaxIdType;
  domain?: string;
  address?: string;
  website?: string;
  addressLine1?: string;
  city?: string;
  country?: string;
  paymentTerms?: number;
  preferredPaymentMethod?: string;
  bankIban?: string;
  bankBic?: string;
  notes?: string;
}

/**
 * Vendor update data
 */
interface VendorUpdateData {
  phone?: string;
  taxId?: string;
  taxIdType?: TaxIdType;
  addressLine1?: string;
  city?: string;
  country?: string;
  bankIban?: string;
  bankBic?: string;
}

/**
 * Service that automatically creates or matches vendors from email data
 */
@Injectable()
export class VendorAutoCreatorService {
  private readonly logger = new Logger(VendorAutoCreatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly entityExtractor: EntityExtractorService,
    private readonly vendorMatcher: VendorMatcherService,
  ) {}

  /**
   * Process an email and automatically create/update vendor and bill if applicable
   */
  async processEmail(
    email: EmailMessage,
    classification: ClassificationResult,
    entities: ExtractedEntities,
    extractedInvoice: ExtractedInvoiceDataDto | undefined,
    orgId: string,
  ): Promise<VendorCreationResult> {
    this.logger.log(
      `Processing email for vendor auto-creation: ${email.subject} (classification: ${classification.classification})`,
    );

    // Only process emails that indicate vendor relationships
    if (!this.shouldProcessForVendor(classification.classification)) {
      return {
        action: 'SKIPPED',
        reasoning: `Email classification ${classification.classification} does not indicate vendor relationship`,
      };
    }

    // Extract vendor information from email or invoice
    const vendorInfo = this.extractVendorInfo(email, entities, extractedInvoice);

    if (!vendorInfo.companyName && !vendorInfo.email) {
      return {
        action: 'SKIPPED',
        reasoning: 'No vendor information found in email or invoice',
      };
    }

    this.logger.debug(
      `Extracted vendor info: ${JSON.stringify(vendorInfo)}`,
    );

    // Try to match to existing vendor
    const matchResult = await this.vendorMatcher.matchToExistingVendor(
      vendorInfo,
      orgId,
    );

    if (matchResult.vendor) {
      this.logger.log(
        `Matched to existing vendor: ${matchResult.vendor.name} (${matchResult.matchType}, confidence: ${matchResult.confidence})`,
      );

      // Update vendor if we have new information
      const updated = await this.updateVendorIfNeeded(
        matchResult.vendor,
        vendorInfo,
        extractedInvoice,
      );

      // Create bill if this is an invoice
      let bill: Bill | undefined;
      if (
        extractedInvoice &&
        classification.classification === EmailClassification.INVOICE_RECEIVED
      ) {
        bill = await this.createBillFromInvoice(
          matchResult.vendor,
          extractedInvoice,
          email,
          orgId,
        );
      }

      return {
        vendor: updated || matchResult.vendor,
        bill,
        action: updated ? 'UPDATED' : 'MATCHED',
        matchConfidence: matchResult.confidence,
        reasoning: matchResult.reasoning,
      };
    }

    // No match found - create new vendor
    this.logger.log('No existing vendor matched, creating new vendor');

    const newVendor = await this.createVendorFromEmail(
      vendorInfo,
      extractedInvoice,
      orgId,
    );

    // Create bill if this is an invoice
    let bill: Bill | undefined;
    if (
      extractedInvoice &&
      classification.classification === EmailClassification.INVOICE_RECEIVED
    ) {
      bill = await this.createBillFromInvoice(
        newVendor,
        extractedInvoice,
        email,
        orgId,
      );
    }

    return {
      vendor: newVendor,
      bill,
      action: 'CREATED',
      reasoning: 'Created new vendor from email',
    };
  }

  /**
   * Create a vendor from extracted invoice data
   */
  async createVendorFromInvoice(
    extractedInvoice: ExtractedInvoiceDataDto,
    email: EmailMessage,
    orgId: string,
  ): Promise<Vendor> {
    this.logger.log(
      `Creating vendor from invoice: ${extractedInvoice.vendorName}`,
    );

    const vendorData = {
      name: extractedInvoice.vendorName || 'Unknown Vendor',
      email: extractedInvoice.vendorEmail || this.extractEmailFromSender(email.from),
      phone: extractedInvoice.vendorPhone,
      taxId: extractedInvoice.vendorVatId,
      taxIdType: this.determineTaxIdType(extractedInvoice.vendorVatId),
      addressLine1: this.parseAddressLine1(extractedInvoice.vendorAddress),
      city: this.parseCityFromAddress(extractedInvoice.vendorAddress),
      country: this.parseCountryFromAddress(extractedInvoice.vendorAddress),
      paymentTerms: this.parsePaymentTerms(extractedInvoice.paymentTerms),
      preferredPaymentMethod: extractedInvoice.paymentMethod,
      bankIban: extractedInvoice.iban,
      bankBic: extractedInvoice.bic,
      status: VendorStatus.ACTIVE,
      notes: `Auto-created from email invoice: ${email.subject}`,
    };

    return this.createVendorFromEmail(vendorData, extractedInvoice, orgId);
  }

  /**
   * Create a bill from extracted invoice data
   */
  async createBillFromInvoice(
    vendor: Vendor,
    extractedInvoice: ExtractedInvoiceDataDto,
    email: EmailMessage,
    orgId: string,
  ): Promise<Bill> {
    this.logger.log(
      `Creating bill from invoice: ${extractedInvoice.invoiceNumber} for vendor ${vendor.name}`,
    );

    // Check if bill already exists
    if (extractedInvoice.invoiceNumber) {
      const existing = await this.prisma.bill.findFirst({
        where: {
          organisationId: orgId,
          vendorId: vendor.id,
          billNumber: extractedInvoice.invoiceNumber,
        },
      });

      if (existing) {
        this.logger.warn(
          `Bill already exists for invoice ${extractedInvoice.invoiceNumber}`,
        );
        return existing;
      }
    }

    const issueDate = extractedInvoice.invoiceDate
      ? new Date(extractedInvoice.invoiceDate)
      : new Date();

    const dueDate = extractedInvoice.dueDate
      ? new Date(extractedInvoice.dueDate)
      : this.calculateDueDate(issueDate, vendor.paymentTerms);

    const bill = await this.prisma.bill.create({
      data: {
        organisation: { connect: { id: orgId } },
        vendor: { connect: { id: vendor.id } },
        vendorName: vendor.name,
        billNumber: extractedInvoice.invoiceNumber,
        description: `Invoice from ${vendor.name}`,
        amount: new Decimal(extractedInvoice.subtotal),
        currency: extractedInvoice.currency || 'EUR',
        taxAmount: new Decimal(extractedInvoice.taxAmount || 0),
        totalAmount: new Decimal(extractedInvoice.total),
        total: new Decimal(extractedInvoice.total),
        paidAmount: new Decimal(0),
        status: 'DRAFT', // Start as DRAFT for review
        paymentStatus: 'PENDING',
        issueDate,
        dueDate,
        sourceType: 'EMAIL_EXTRACTION',
        sourceEmailId: email.id,
        vatRate: extractedInvoice.taxRate
          ? new Decimal(extractedInvoice.taxRate)
          : undefined,
        taxDeductible: vendor.defaultTaxDeductible,
        categoryId: vendor.defaultCategoryId,
        notes: `Auto-created from email: ${email.subject}`,
        lineItems: {
          create: extractedInvoice.lineItems.map((item, index) => ({
            description: item.description,
            quantity: new Decimal(item.quantity || 1),
            unitPrice: new Decimal(item.unitPrice || item.totalAmount),
            amount: new Decimal(item.totalAmount),
            taxRate: item.taxRate ? new Decimal(item.taxRate) : undefined,
            taxAmount: item.taxAmount ? new Decimal(item.taxAmount) : undefined,
            sortOrder: index + 1,
          })),
        },
      },
      include: {
        lineItems: true,
        vendor: true,
      },
    });

    this.logger.log(`Created bill ${bill.id} from invoice`);

    return bill;
  }

  /**
   * Determine if email classification should trigger vendor processing
   */
  private shouldProcessForVendor(classification: EmailClassification): boolean {
    const vendorClassifications = [
      EmailClassification.INVOICE_RECEIVED,
      EmailClassification.PAYMENT_SENT,
      EmailClassification.PAYMENT_REMINDER,
      EmailClassification.QUOTE_REQUEST, // Sometimes we become the vendor
    ];

    return vendorClassifications.includes(classification);
  }

  /**
   * Extract vendor information from email and entities
   */
  private extractVendorInfo(
    email: EmailMessage,
    entities: ExtractedEntities,
    extractedInvoice?: ExtractedInvoiceDataDto,
  ): VendorInfo {
    // Prioritize invoice data if available
    if (extractedInvoice) {
      return {
        companyName: extractedInvoice.vendorName,
        email: extractedInvoice.vendorEmail || this.extractEmailFromSender(email.from),
        taxId: extractedInvoice.vendorVatId,
        domain: this.extractDomain(
          extractedInvoice.vendorEmail || email.from,
        ),
        phone: extractedInvoice.vendorPhone,
        address: extractedInvoice.vendorAddress,
      };
    }

    // Otherwise use entities
    const vendorCompanies = entities.companies.filter((c) => c.role === 'VENDOR');
    const primaryCompany = vendorCompanies[0] || entities.companies[0];

    const vendorContact = entities.contacts.find((c) =>
      c.email.toLowerCase().includes(email.from.toLowerCase()),
    );

    return {
      companyName: primaryCompany?.name,
      email: vendorContact?.email || this.extractEmailFromSender(email.from),
      taxId: primaryCompany?.vatId,
      domain: this.extractDomain(email.from),
      phone: vendorContact?.phone,
      address: entities.addresses[0]?.full,
    };
  }

  /**
   * Create vendor from collected information
   */
  private async createVendorFromEmail(
    vendorInfo: VendorInfo,
    extractedInvoice: ExtractedInvoiceDataDto | undefined,
    orgId: string,
  ): Promise<Vendor> {
    const vendor = await this.prisma.vendor.create({
      data: {
        organisation: { connect: { id: orgId } },
        name: vendorInfo.companyName || vendorInfo.name || 'Unknown Vendor',
        email: vendorInfo.email,
        phone: vendorInfo.phone,
        website: vendorInfo.website,
        addressLine1: vendorInfo.addressLine1,
        city: vendorInfo.city,
        country: vendorInfo.country,
        taxId: vendorInfo.taxId,
        taxIdType: vendorInfo.taxIdType || TaxIdType.OTHER,
        paymentTerms: vendorInfo.paymentTerms || 30,
        preferredPaymentMethod: vendorInfo.preferredPaymentMethod,
        bankIban: vendorInfo.bankIban,
        bankBic: vendorInfo.bankBic,
        status: VendorStatus.ACTIVE,
        defaultTaxDeductible: true,
        notes: vendorInfo.notes,
      },
    });

    this.logger.log(
      `Created vendor ${vendor.id}: ${vendor.name} (org: ${orgId})`,
    );

    return vendor;
  }

  /**
   * Update vendor if we have new information
   * Returns updated vendor if changes were made, null otherwise
   */
  private async updateVendorIfNeeded(
    vendor: Vendor,
    vendorInfo: VendorInfo,
    extractedInvoice?: ExtractedInvoiceDataDto,
  ): Promise<Vendor | null> {
    const updates: VendorUpdateData = {};

    // Update missing fields only
    if (!vendor.phone && vendorInfo.phone) {
      updates.phone = vendorInfo.phone;
    }

    if (!vendor.taxId && vendorInfo.taxId) {
      updates.taxId = vendorInfo.taxId;
      updates.taxIdType = this.determineTaxIdType(vendorInfo.taxId);
    }

    if (!vendor.addressLine1 && vendorInfo.address) {
      updates.addressLine1 = this.parseAddressLine1(vendorInfo.address);
    }

    if (!vendor.city && vendorInfo.address) {
      updates.city = this.parseCityFromAddress(vendorInfo.address);
    }

    if (!vendor.country && vendorInfo.address) {
      updates.country = this.parseCountryFromAddress(vendorInfo.address);
    }

    if (extractedInvoice) {
      if (!vendor.bankIban && extractedInvoice.iban) {
        updates.bankIban = extractedInvoice.iban;
      }
      if (!vendor.bankBic && extractedInvoice.bic) {
        updates.bankBic = extractedInvoice.bic;
      }
    }

    // If no updates needed, return null
    if (Object.keys(updates).length === 0) {
      return null;
    }

    this.logger.log(
      `Updating vendor ${vendor.id} with new information: ${JSON.stringify(updates)}`,
    );

    return this.prisma.vendor.update({
      where: { id: vendor.id },
      data: updates,
    });
  }

  /**
   * Determine tax ID type from format
   */
  private determineTaxIdType(taxId?: string): TaxIdType {
    if (!taxId) {
      return TaxIdType.OTHER;
    }

    const normalized = taxId.toUpperCase().replace(/[\s\-\.]/g, '');

    if (normalized.startsWith('DE') && normalized.length === 11) {
      return TaxIdType.VAT_DE;
    }

    if (normalized.startsWith('AT') && normalized.length === 11) {
      return TaxIdType.VAT_AT;
    }

    if (normalized.match(/^[A-Z]{2}\d{8,12}$/)) {
      return TaxIdType.VAT_EU;
    }

    if (normalized.match(/^\d{2}-\d{7}$/)) {
      return TaxIdType.EIN_US;
    }

    return TaxIdType.OTHER;
  }

  /**
   * Parse payment terms from string (e.g., "NET 30" -> 30)
   */
  private parsePaymentTerms(paymentTerms?: string): number {
    if (!paymentTerms) {
      return 30; // Default
    }

    const match = paymentTerms.match(/\d+/);
    return match ? parseInt(match[0], 10) : 30;
  }

  /**
   * Calculate due date from issue date and payment terms
   */
  private calculateDueDate(issueDate: Date, paymentTerms: number): Date {
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + paymentTerms);
    return dueDate;
  }

  /**
   * Extract email address from sender string
   * e.g., "John Doe <john@example.com>" -> "john@example.com"
   */
  private extractEmailFromSender(sender: string): string {
    const match = sender.match(/<(.+)>/);
    return match ? match[1] : sender;
  }

  /**
   * Extract domain from email
   */
  private extractDomain(email: string): string | undefined {
    const cleanEmail = this.extractEmailFromSender(email);
    const match = cleanEmail.match(/@(.+)$/);
    return match ? match[1].toLowerCase() : undefined;
  }

  /**
   * Parse first line of address
   */
  private parseAddressLine1(address?: string): string | undefined {
    if (!address) return undefined;
    const lines = address.split(/[\n,]/);
    return lines[0]?.trim();
  }

  /**
   * Parse city from address (simple heuristic)
   */
  private parseCityFromAddress(address?: string): string | undefined {
    if (!address) return undefined;

    // Try to find postal code + city pattern (e.g., "10115 Berlin")
    const match = address.match(/\d{4,5}\s+([A-Za-z\s]+)/);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Parse country from address (simple heuristic)
   */
  private parseCountryFromAddress(address?: string): string | undefined {
    if (!address) return undefined;

    const lowerAddress = address.toLowerCase();

    // Common country mappings
    const countryMap: Record<string, string> = {
      germany: 'DE',
      deutschland: 'DE',
      austria: 'AT',
      österreich: 'AT',
      switzerland: 'CH',
      schweiz: 'CH',
      france: 'FR',
      frankreich: 'FR',
      'united kingdom': 'GB',
      uk: 'GB',
      'united states': 'US',
      usa: 'US',
    };

    for (const [name, code] of Object.entries(countryMap)) {
      if (lowerAddress.includes(name)) {
        return code;
      }
    }

    return undefined;
  }
}
