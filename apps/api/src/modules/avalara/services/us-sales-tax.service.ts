import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AvalaraService } from '../avalara.service';
import {
  CalculateTaxDto,
  TaxCalculationResponseDto,
  CommitTransactionDto,
} from '../dto';
import { TransactionStatus, NexusStatus } from '@prisma/client';
import { ProductTaxability } from '../types/us-tax-jurisdiction.types';

/**
 * DTO for calculating tax on an invoice
 */
export interface CalculateInvoiceTaxDto {
  invoiceId: string;
  orgId: string;
  commit?: boolean;
}

/**
 * DTO for calculating tax on a shopping cart (real-time preview)
 */
export interface CalculateCartTaxDto {
  orgId: string;
  customerCode: string;
  destinationAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  originAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    itemCode: string;
    description: string;
    quantity: number;
    amount: number;
    taxCode?: ProductTaxability;
  }>;
}

/**
 * US Sales Tax Service
 * Handles US sales tax calculations via Avalara AvaTax
 * Manages nexus registrations, exemptions, and tax transactions
 */
@Injectable()
export class USSalesTaxService {
  private readonly logger = new Logger(USSalesTaxService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly avalaraService: AvalaraService,
  ) {}

  /**
   * Calculate tax for an invoice
   */
  async calculateInvoiceTax(dto: CalculateInvoiceTaxDto): Promise<TaxCalculationResponseDto> {
    try {
      this.logger.debug(`Calculating tax for invoice ${dto.invoiceId}`);

      // Fetch invoice with items
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: dto.invoiceId },
        include: {
          items: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice ${dto.invoiceId} not found`);
      }

      // Check for exemption certificate
      let exemptionNo: string | undefined;
      if (invoice.customerId) {
        const exemption = await this.getActiveExemption(dto.orgId, invoice.customerId);
        if (exemption) {
          exemptionNo = exemption.certificateNumber;
          this.logger.debug(`Using exemption certificate: ${exemptionNo}`);
        }
      }

      // Get organization's default shipping address (origin)
      const org = await this.prisma.organisation.findUnique({
        where: { id: dto.orgId },
      });

      // Parse customer address
      const destinationAddress = this.parseAddress(invoice.customerAddress || '');

      // Build tax calculation request
      const taxRequest: CalculateTaxDto = {
        customerCode: invoice.customerId || invoice.customerName,
        destinationAddress,
        originAddress: org?.settings?.['businessAddress']
          ? this.parseAddress(org.settings['businessAddress'] as string)
          : undefined,
        lines: invoice.items.map((item, index) => ({
          itemCode: item.productCode || `LINE-${index + 1}`,
          description: item.description,
          quantity: Number(item.quantity),
          amount: Number(item.unitPrice),
          taxCode: this.mapTaxCode(item.description),
        })),
        transactionDate: invoice.issueDate.toISOString().split('T')[0],
        currencyCode: invoice.currency,
        exemptionNo,
        commit: dto.commit || false,
        referenceCode: invoice.number,
      };

      // Call Avalara
      const taxResult = await this.avalaraService.calculateTax(taxRequest);

      // If committing, save transaction to database
      if (dto.commit) {
        await this.saveTaxTransaction({
          orgId: dto.orgId,
          invoiceId: invoice.id,
          customerId: invoice.customerId || undefined,
          customerCode: invoice.customerId || invoice.customerName,
          transactionCode: invoice.number,
          documentType: 'SalesInvoice',
          status: TransactionStatus.COMMITTED,
          totalAmount: taxResult.totalAmount,
          totalTaxable: taxResult.taxableAmount,
          totalExempt: taxResult.exemptAmount,
          totalTax: taxResult.totalTax,
          originAddress: taxRequest.originAddress || {},
          destinationAddress: taxRequest.destinationAddress,
          transactionDate: invoice.issueDate,
          taxDate: new Date(taxResult.taxDate),
          avalaraCode: taxResult.code,
          lines: taxResult.lines,
          jurisdictionSummary: taxResult.summary,
          exemptionNo,
        });

        this.logger.log(`Tax transaction committed for invoice ${invoice.number}`);
      }

      return taxResult;
    } catch (error) {
      this.logger.error(`Invoice tax calculation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calculate tax for a shopping cart (real-time preview)
   */
  async calculateCartTax(dto: CalculateCartTaxDto): Promise<TaxCalculationResponseDto> {
    try {
      this.logger.debug(`Calculating cart tax for customer ${dto.customerCode}`);

      // Check for exemption certificate
      let exemptionNo: string | undefined;
      const customer = await this.prisma.customer.findFirst({
        where: {
          orgId: dto.orgId,
          OR: [
            { email: dto.customerCode },
            { id: dto.customerCode },
          ],
        },
      });

      if (customer) {
        const exemption = await this.getActiveExemption(dto.orgId, customer.id);
        if (exemption) {
          exemptionNo = exemption.certificateNumber;
        }
      }

      // Build tax calculation request (not committed)
      const taxRequest: CalculateTaxDto = {
        customerCode: dto.customerCode,
        destinationAddress: dto.destinationAddress,
        originAddress: dto.originAddress,
        lines: dto.items.map(item => ({
          itemCode: item.itemCode,
          description: item.description,
          quantity: item.quantity,
          amount: item.amount,
          taxCode: item.taxCode || this.mapTaxCode(item.description),
        })),
        exemptionNo,
        commit: false, // Never commit cart calculations
      };

      const taxResult = await this.avalaraService.calculateTax(taxRequest);

      return taxResult;
    } catch (error) {
      this.logger.error(`Cart tax calculation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle exemptions for a transaction
   */
  async handleExemption(
    orgId: string,
    customerId: string,
    destinationState: string,
  ): Promise<string | null> {
    const exemption = await this.prisma.taxExemptionCertificate.findFirst({
      where: {
        orgId,
        customerId,
        status: 'ACTIVE',
        states: {
          has: destinationState,
        },
        OR: [
          { expirationDate: null },
          { expirationDate: { gte: new Date() } },
        ],
      },
    });

    return exemption ? exemption.certificateNumber : null;
  }

  /**
   * Manage nexus registrations
   */
  async manageNexus(
    orgId: string,
    state: string,
    action: 'create' | 'update' | 'deactivate',
    data?: {
      effectiveDate?: Date;
      nexusTypeId?: string;
      salesThreshold?: number;
      transactionThreshold?: number;
      taxRegistrationId?: string;
    },
  ) {
    if (action === 'create') {
      return await this.prisma.taxNexus.create({
        data: {
          orgId,
          state,
          effectiveDate: data?.effectiveDate || new Date(),
          nexusTypeId: data?.nexusTypeId,
          salesThreshold: data?.salesThreshold,
          transactionThreshold: data?.transactionThreshold,
          taxRegistrationId: data?.taxRegistrationId,
          status: NexusStatus.ACTIVE,
        },
      });
    } else if (action === 'update') {
      return await this.prisma.taxNexus.update({
        where: {
          orgId_state: { orgId, state },
        },
        data: {
          ...data,
        },
      });
    } else {
      return await this.prisma.taxNexus.update({
        where: {
          orgId_state: { orgId, state },
        },
        data: {
          status: NexusStatus.INACTIVE,
          endDate: new Date(),
        },
      });
    }
  }

  /**
   * Track sales for nexus threshold monitoring
   * Note: For enhanced threshold tracking with alerts, use NexusConfigurationService.trackSalesForNexus
   */
  async trackNexusSales(orgId: string, state: string, amount: number) {
    const nexus = await this.prisma.taxNexus.findUnique({
      where: {
        orgId_state: { orgId, state },
      },
    });

    if (nexus) {
      await this.prisma.taxNexus.update({
        where: {
          orgId_state: { orgId, state },
        },
        data: {
          currentSales: {
            increment: amount,
          },
          currentTransactions: {
            increment: 1,
          },
        },
      });

      // Check if threshold is approaching
      if (
        nexus.salesThreshold &&
        Number(nexus.currentSales) + amount >= Number(nexus.salesThreshold) * 0.8
      ) {
        this.logger.warn(
          `Nexus threshold approaching for ${orgId} in ${state}: ${nexus.currentSales}/${nexus.salesThreshold}`,
        );
      }
    }
  }

  /**
   * Handle marketplace facilitator scenarios
   */
  async handleMarketplaceFacilitator(
    orgId: string,
    state: string,
    isMarketplaceSale: boolean,
  ): Promise<boolean> {
    // Check if marketplace facilitator rules apply
    const nexus = await this.prisma.taxNexus.findUnique({
      where: {
        orgId_state: { orgId, state },
      },
    });

    if (!nexus) {
      return false;
    }

    // If marketplace is collecting tax, we don't need to
    if (isMarketplaceSale && nexus.metadata?.['marketplaceFacilitatorLaw']) {
      this.logger.debug(
        `Marketplace facilitator law applies in ${state}, no tax collection needed`,
      );
      return true;
    }

    return false;
  }

  /**
   * Handle drop shipping scenarios
   */
  async handleDropShipping(
    orgId: string,
    resaleCertificate: string,
    shipToState: string,
  ): Promise<{ exempt: boolean; exemptionNo: string | null }> {
    // Verify resale certificate
    const cert = await this.prisma.taxExemptionCertificate.findFirst({
      where: {
        orgId,
        certificateNumber: resaleCertificate,
        exemptionType: 'RESALE',
        status: 'ACTIVE',
        states: {
          has: shipToState,
        },
      },
    });

    if (cert) {
      this.logger.debug(`Drop shipping with valid resale certificate: ${resaleCertificate}`);
      return { exempt: true, exemptionNo: resaleCertificate };
    }

    return { exempt: false, exemptionNo: null };
  }

  /**
   * Private helper methods
   */

  private async getActiveExemption(orgId: string, customerId: string) {
    return await this.prisma.taxExemptionCertificate.findFirst({
      where: {
        orgId,
        customerId,
        status: 'ACTIVE',
        OR: [
          { expirationDate: null },
          { expirationDate: { gte: new Date() } },
        ],
      },
    });
  }

  private parseAddress(addressString: string) {
    // Basic address parsing - in production, use a proper address parser
    const parts = addressString.split(',').map(p => p.trim());
    return {
      line1: parts[0] || '',
      city: parts[1] || '',
      state: parts[2]?.split(' ')[0] || '',
      postalCode: parts[2]?.split(' ')[1] || '',
      country: 'US',
    };
  }

  private mapTaxCode(description: string): ProductTaxability | undefined {
    // Map product descriptions to ProductTaxability enum
    const desc = description.toLowerCase();
    if (desc.includes('software') || desc.includes('saas')) {
      return ProductTaxability.SAAS;
    }
    if (desc.includes('digital')) {
      return ProductTaxability.DIGITAL_GOODS;
    }
    if (desc.includes('professional') || desc.includes('consulting')) {
      return ProductTaxability.SERVICES_PROFESSIONAL;
    }
    if (desc.includes('repair')) {
      return ProductTaxability.SERVICES_REPAIR;
    }
    if (desc.includes('clothing') || desc.includes('apparel')) {
      return ProductTaxability.CLOTHING;
    }
    if (desc.includes('food') || desc.includes('grocery') || desc.includes('groceries')) {
      return ProductTaxability.GROCERIES;
    }
    if (desc.includes('prescription') || desc.includes('medication')) {
      return ProductTaxability.PRESCRIPTION_DRUGS;
    }
    // Default to physical goods for unrecognized items
    return ProductTaxability.PHYSICAL_GOODS;
  }

  private async saveTaxTransaction(data: {
    orgId: string;
    invoiceId?: string;
    customerId?: string;
    customerCode: string;
    transactionCode: string;
    documentType: string;
    status: TransactionStatus;
    totalAmount: number;
    totalTaxable: number;
    totalExempt: number;
    totalTax: number;
    originAddress: any;
    destinationAddress: any;
    transactionDate: Date;
    taxDate: Date;
    avalaraCode?: string;
    lines: any;
    jurisdictionSummary: any;
    exemptionNo?: string;
  }) {
    return await this.prisma.taxTransaction.create({
      data: {
        orgId: data.orgId,
        invoiceId: data.invoiceId,
        customerId: data.customerId,
        customerCode: data.customerCode,
        transactionCode: data.transactionCode,
        documentType: data.documentType,
        status: data.status,
        totalAmount: data.totalAmount,
        totalTaxable: data.totalTaxable,
        totalExempt: data.totalExempt,
        totalTax: data.totalTax,
        originAddress: data.originAddress,
        destinationAddress: data.destinationAddress,
        transactionDate: data.transactionDate,
        taxDate: data.taxDate,
        avalaraCode: data.avalaraCode,
        lines: data.lines,
        jurisdictionSummary: data.jurisdictionSummary,
        exemptionNo: data.exemptionNo,
        committedAt: new Date(),
      },
    });
  }
}
