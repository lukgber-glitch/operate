/**
 * Email Aggregator Service
 * Aggregates discovered email entities by company/domain
 * Groups contacts from the same domain together and identifies potential new customers
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CustomerAutoCreatorService } from './customer-auto-creator.service';
import { extractDomain, normalizeCompanyName } from './parsers/signature-parser';
import {
  CompanyAggregation,
  EmailContact,
  ImportResult,
  AggregationSummary,
  AggregationOptions,
  ImportError,
} from './types/aggregation.types';
import { v4 as uuidv4 } from 'uuid';

interface DomainGroup {
  domain: string;
  entities: any[]; // EmailExtractedEntities[]
  companyNames: Set<string>;
  contacts: Map<string, EmailContact>; // email -> contact
}

@Injectable()
export class EmailAggregatorService {
  private readonly logger = new Logger(EmailAggregatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly customerAutoCreator: CustomerAutoCreatorService,
  ) {}

  /**
   * Aggregate email entities into company groups
   * Returns potential new customers discovered from emails
   */
  async aggregateByCompany(
    orgId: string,
    options: AggregationOptions = {},
  ): Promise<CompanyAggregation[]> {
    this.logger.log(`Aggregating email entities by company for org ${orgId}`);

    // 1. Get all email entities for this org
    const entities = await this.getEmailEntities(orgId, options.sinceDate);

    if (entities.length === 0) {
      this.logger.debug('No email entities found for aggregation');
      return [];
    }

    this.logger.debug(`Processing ${entities.length} email entities`);

    // 2. Group by domain
    const domainGroups = this.groupByDomain(entities);

    this.logger.debug(`Grouped into ${domainGroups.length} domain groups`);

    // 3. Convert to aggregations and enrich with company info
    const aggregations = this.convertToAggregations(domainGroups);

    // 4. Filter by email/contact count
    let filtered = aggregations;
    if (options.minEmailCount) {
      filtered = filtered.filter((a) => a.emailCount >= options.minEmailCount);
    }
    if (options.minContactCount) {
      filtered = filtered.filter((a) => a.contactCount >= options.minContactCount);
    }

    // 5. Check which are existing customers/vendors
    const enriched = await this.checkExistingEntities(orgId, filtered);

    // 6. Filter out existing if requested
    if (options.excludeExisting) {
      const newOnly = enriched.filter(
        (a) => !a.isExistingCustomer && !a.isExistingVendor,
      );
      this.logger.log(
        `Found ${newOnly.length} new potential customers (excluding existing)`,
      );
      return newOnly;
    }

    this.logger.log(`Aggregated into ${enriched.length} company groups`);
    return enriched;
  }

  /**
   * Get aggregation summary statistics
   */
  async getAggregationSummary(
    orgId: string,
    options: AggregationOptions = {},
  ): Promise<AggregationSummary> {
    const aggregations = await this.aggregateByCompany(orgId, options);

    return {
      totalCompanies: aggregations.length,
      newCompanies: aggregations.filter(
        (a) => !a.isExistingCustomer && !a.isExistingVendor,
      ).length,
      existingCustomers: aggregations.filter((a) => a.isExistingCustomer).length,
      existingVendors: aggregations.filter((a) => a.isExistingVendor).length,
      totalContacts: aggregations.reduce((sum, a) => sum + a.contactCount, 0),
      totalEmails: aggregations.reduce((sum, a) => sum + a.emailCount, 0),
    };
  }

  /**
   * Import selected aggregations as customers
   */
  async importAsCustomers(
    orgId: string,
    aggregationIds: string[],
    userId: string,
  ): Promise<ImportResult> {
    this.logger.log(
      `Importing ${aggregationIds.length} aggregations as customers`,
    );

    // Get fresh aggregations
    const allAggregations = await this.aggregateByCompany(orgId);
    const toImport = allAggregations.filter((a) =>
      aggregationIds.includes(a.id),
    );

    const customers: any[] = [];
    const errors: ImportError[] = [];
    let imported = 0;
    let failed = 0;

    for (const aggregation of toImport) {
      try {
        // Skip if already a customer
        if (aggregation.isExistingCustomer) {
          this.logger.debug(
            `Skipping ${aggregation.companyName || aggregation.domain} - already a customer`,
          );
          errors.push({
            companyId: aggregation.id,
            companyName: aggregation.companyName || aggregation.domain,
            error: 'Already exists as a customer',
          });
          failed++;
          continue;
        }

        // Create customer from aggregation
        const customer = await this.createCustomerFromAggregation(
          orgId,
          aggregation,
          userId,
        );

        customers.push(customer);
        imported++;

        this.logger.log(
          `Successfully imported ${aggregation.companyName || aggregation.domain} as customer`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to import ${aggregation.companyName || aggregation.domain}: ${error.message}`,
        );
        errors.push({
          companyId: aggregation.id,
          companyName: aggregation.companyName || aggregation.domain,
          error: error.message,
        });
        failed++;
      }
    }

    this.logger.log(
      `Import complete: ${imported} successful, ${failed} failed`,
    );

    return {
      imported,
      failed,
      customers,
      errors,
    };
  }

  /**
   * Get email entities from database
   */
  private async getEmailEntities(
    orgId: string,
    sinceDate?: Date,
  ): Promise<any[]> {
    const where: any = {
      orgId,
    };

    if (sinceDate) {
      where.extractedAt = { gte: sinceDate };
    }

    return this.prisma.emailExtractedEntities.findMany({
      where,
      orderBy: { extractedAt: 'desc' },
      include: {
        email: {
          select: {
            id: true,
            subject: true,
            from: true,
            receivedAt: true,
          },
        },
      },
    });
  }

  /**
   * Group entities by email domain
   */
  private groupByDomain(entities: any[]): DomainGroup[] {
    const domainMap = new Map<string, DomainGroup>();

    for (const entity of entities) {
      const data = entity.entities as Prisma.InputJsonValue; // Full ExtractedEntities object

      // Extract all email addresses from contacts
      const contactEmails = entity.contactEmails || [];

      for (const email of contactEmails) {
        const domain = extractDomain(email);
        if (!domain) continue;

        // Get or create domain group
        if (!domainMap.has(domain)) {
          domainMap.set(domain, {
            domain,
            entities: [],
            companyNames: new Set(),
            contacts: new Map(),
          });
        }

        const group = domainMap.get(domain)!;
        group.entities.push(entity);

        // Extract company names
        if (entity.companyNames && Array.isArray(entity.companyNames)) {
          entity.companyNames.forEach((name: string) => {
            if (name) group.companyNames.add(name);
          });
        }

        // Extract contacts from full entities data
        if (data.contacts && Array.isArray(data.contacts)) {
          data.contacts.forEach((contact: any) => {
            if (!contact.email) return;

            const contactDomain = extractDomain(contact.email);
            if (contactDomain !== domain) return; // Only contacts from this domain

            const existing = group.contacts.get(contact.email);
            if (existing) {
              existing.emailCount++;
              if (
                entity.email?.receivedAt &&
                new Date(entity.email.receivedAt) > existing.lastSeen
              ) {
                existing.lastSeen = new Date(entity.email.receivedAt);
              }
            } else {
              group.contacts.set(contact.email, {
                email: contact.email,
                name: contact.name || null,
                role: contact.role || null,
                emailCount: 1,
                lastSeen: entity.email?.receivedAt
                  ? new Date(entity.email.receivedAt)
                  : new Date(entity.extractedAt),
              });
            }
          });
        }
      }
    }

    return Array.from(domainMap.values());
  }

  /**
   * Convert domain groups to aggregations
   */
  private convertToAggregations(
    domainGroups: DomainGroup[],
  ): CompanyAggregation[] {
    return domainGroups.map((group) => {
      // Pick most common company name
      let companyName: string | null = null;
      if (group.companyNames.size > 0) {
        const names = Array.from(group.companyNames);
        // Sort by frequency (for now just take first)
        companyName = names[0];
      }

      // Extract VAT ID and address from entities
      let vatId: string | null = null;
      let address: string | null = null;

      for (const entity of group.entities) {
        const data = entity.entities as Prisma.InputJsonValue;
        if (data.companies && Array.isArray(data.companies)) {
          for (const company of data.companies) {
            if (company.vatId && !vatId) {
              vatId = company.vatId;
            }
          }
        }
        if (data.addresses && Array.isArray(data.addresses) && !address) {
          address = data.addresses[0]?.full || null;
        }
      }

      // Calculate dates
      const dates = group.entities
        .map((e) =>
          e.email?.receivedAt
            ? new Date(e.email.receivedAt).getTime()
            : new Date(e.extractedAt).getTime(),
        )
        .filter(Boolean);

      const firstSeen = new Date(Math.min(...dates));
      const lastSeen = new Date(Math.max(...dates));

      // Calculate confidence based on data quality
      let confidence = 0.5;
      if (companyName) confidence += 0.2;
      if (group.contacts.size > 1) confidence += 0.1;
      if (group.entities.length > 2) confidence += 0.1;
      if (vatId) confidence += 0.1;
      confidence = Math.min(confidence, 1.0);

      return {
        id: uuidv4(), // Generate unique ID for this aggregation
        domain: group.domain,
        companyName,
        contactCount: group.contacts.size,
        contacts: Array.from(group.contacts.values()).sort(
          (a, b) => b.emailCount - a.emailCount,
        ), // Most active first
        emailCount: group.entities.length,
        firstSeen,
        lastSeen,
        isExistingCustomer: false, // Will be set by checkExistingEntities
        isExistingVendor: false,
        confidence,
        vatId,
        address,
      };
    });
  }

  /**
   * Check which aggregations already exist as customers/vendors
   */
  private async checkExistingEntities(
    orgId: string,
    aggregations: CompanyAggregation[],
  ): Promise<CompanyAggregation[]> {
    // Get all customers and vendors for this org
    const [customers, vendors] = await Promise.all([
      this.prisma.customer.findMany({
        where: { orgId, isActive: true },
        select: { email: true, name: true, vatId: true },
      }),
      this.prisma.vendor.findMany({
        where: { organisationId: orgId },
        select: { email: true, name: true, taxId: true },
      }),
    ]);

    // Create lookup maps
    const customerEmails = new Set(
      customers.map((c) => c.email?.toLowerCase()).filter(Boolean),
    );
    const customerNames = new Set(
      customers.map((c) => normalizeCompanyName(c.name)),
    );
    const customerVatIds = new Set(customers.map((c) => c.vatId).filter(Boolean));

    const vendorEmails = new Set(
      vendors.map((v) => v.email?.toLowerCase()).filter(Boolean),
    );
    const vendorNames = new Set(
      vendors.map((v) => normalizeCompanyName(v.name)),
    );
    const vendorVatIds = new Set(vendors.map((v) => v.taxId).filter(Boolean));

    // Check each aggregation
    for (const agg of aggregations) {
      // Check customer match
      const matchesCustomer =
        (agg.vatId && customerVatIds.has(agg.vatId)) ||
        agg.contacts.some((c) => customerEmails.has(c.email.toLowerCase())) ||
        (agg.companyName && customerNames.has(normalizeCompanyName(agg.companyName)));

      agg.isExistingCustomer = matchesCustomer;

      // Check vendor match
      const matchesVendor =
        (agg.vatId && vendorVatIds.has(agg.vatId)) ||
        agg.contacts.some((c) => vendorEmails.has(c.email.toLowerCase())) ||
        (agg.companyName && vendorNames.has(normalizeCompanyName(agg.companyName)));

      agg.isExistingVendor = matchesVendor;
    }

    return aggregations;
  }

  /**
   * Create a customer from an aggregation
   */
  private async createCustomerFromAggregation(
    orgId: string,
    aggregation: CompanyAggregation,
    userId: string,
  ): Promise<any> {
    const primaryContact = aggregation.contacts[0] || null;

    const customerData = {
      orgId,
      name: aggregation.companyName || aggregation.domain,
      email: primaryContact?.email || null,
      phone: null,
      address: aggregation.address || null,
      vatId: aggregation.vatId || null,
      isActive: true,
      metadata: {
        source: 'EMAIL_AGGREGATION',
        aggregationId: aggregation.id,
        domain: aggregation.domain,
        createdAt: new Date().toISOString(),
        createdBy: userId,
        emailCount: aggregation.emailCount,
        status: 'LEAD',
        contacts: aggregation.contacts.map((c) => ({
          name: c.name,
          email: c.email,
          role: c.role,
          emailCount: c.emailCount,
          lastSeen: c.lastSeen.toISOString(),
        })),
        firstSeen: aggregation.firstSeen.toISOString(),
        lastSeen: aggregation.lastSeen.toISOString(),
      },
    };

    return this.prisma.customer.create({
      data: customerData,
    });
  }
}
