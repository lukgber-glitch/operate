/**
 * Customer Matcher Service
 * Intelligently matches extracted entities to existing customers
 * Uses fuzzy matching, email domain matching, and confidence scoring
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { extractDomain, normalizeCompanyName } from '../parsers/signature-parser';

export interface CustomerMatchResult {
  customer: any; // Prisma Customer type
  confidence: number; // 0-1
  matchedBy: 'email' | 'domain' | 'name' | 'vat';
  matchDetails?: string;
}

@Injectable()
export class CustomerMatcherService {
  private readonly logger = new Logger(CustomerMatcherService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find the best matching customer for given company/contact info
   * Returns null if no good match found
   */
  async matchCustomer(
    orgId: string,
    options: {
      companyName?: string;
      email?: string;
      vatId?: string;
    },
  ): Promise<CustomerMatchResult | null> {
    const { companyName, email, vatId } = options;

    // Priority 1: Match by VAT ID (most reliable)
    if (vatId) {
      const vatMatch = await this.matchByVatId(orgId, vatId);
      if (vatMatch) {
        this.logger.debug(`Matched customer by VAT ID: ${vatId}`);
        return vatMatch;
      }
    }

    // Priority 2: Match by exact email
    if (email) {
      const emailMatch = await this.matchByEmail(orgId, email);
      if (emailMatch) {
        this.logger.debug(`Matched customer by email: ${email}`);
        return emailMatch;
      }
    }

    // Priority 3: Match by email domain
    if (email) {
      const domainMatch = await this.matchByDomain(orgId, email);
      if (domainMatch) {
        this.logger.debug(`Matched customer by domain: ${extractDomain(email)}`);
        return domainMatch;
      }
    }

    // Priority 4: Fuzzy match by company name
    if (companyName) {
      const nameMatch = await this.matchByCompanyName(orgId, companyName);
      if (nameMatch) {
        this.logger.debug(`Matched customer by name: ${companyName}`);
        return nameMatch;
      }
    }

    this.logger.debug('No customer match found');
    return null;
  }

  /**
   * Match by exact VAT ID
   */
  private async matchByVatId(
    orgId: string,
    vatId: string,
  ): Promise<CustomerMatchResult | null> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        orgId,
        vatId,
        isActive: true,
      },
    });

    if (!customer) return null;

    return {
      customer,
      confidence: 1.0, // VAT ID is unique and reliable
      matchedBy: 'vat',
      matchDetails: `Matched by VAT ID: ${vatId}`,
    };
  }

  /**
   * Match by exact email address
   */
  private async matchByEmail(
    orgId: string,
    email: string,
  ): Promise<CustomerMatchResult | null> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        orgId,
        email: email.toLowerCase(),
        isActive: true,
      },
    });

    if (!customer) return null;

    return {
      customer,
      confidence: 0.95, // Email is highly reliable
      matchedBy: 'email',
      matchDetails: `Matched by email: ${email}`,
    };
  }

  /**
   * Match by email domain (e.g., john@acme.com -> match "Acme Corp")
   */
  private async matchByDomain(
    orgId: string,
    email: string,
  ): Promise<CustomerMatchResult | null> {
    const domain = extractDomain(email);
    if (!domain) return null;

    // Find customers where email domain matches
    const customers = await this.prisma.customer.findMany({
      where: {
        orgId,
        isActive: true,
        email: {
          not: null,
        },
      },
    });

    // Filter by matching domain
    const domainMatches = customers.filter((c) => {
      if (!c.email) return false;
      const customerDomain = extractDomain(c.email);
      return customerDomain === domain;
    });

    if (domainMatches.length === 0) return null;

    // If multiple matches, pick the most recently updated
    const bestMatch = domainMatches.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    )[0];

    return {
      customer: bestMatch,
      confidence: 0.8, // Domain match is fairly reliable
      matchedBy: 'domain',
      matchDetails: `Matched by email domain: ${domain}`,
    };
  }

  /**
   * Fuzzy match by company name using Levenshtein distance
   */
  private async matchByCompanyName(
    orgId: string,
    companyName: string,
  ): Promise<CustomerMatchResult | null> {
    // Normalize input name
    const normalizedInput = normalizeCompanyName(companyName);

    // Get all active customers for this org
    const customers = await this.prisma.customer.findMany({
      where: {
        orgId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        vatId: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        orgId: true,
        isActive: true,
      },
    });

    if (customers.length === 0) return null;

    // Calculate similarity for each customer
    const scoredMatches = customers
      .map((customer) => {
        const normalizedCustomer = normalizeCompanyName(customer.name);
        const similarity = this.calculateSimilarity(normalizedInput, normalizedCustomer);

        return {
          customer,
          similarity,
        };
      })
      .filter((match) => match.similarity > 0.7) // Only keep good matches
      .sort((a, b) => b.similarity - a.similarity); // Best match first

    if (scoredMatches.length === 0) return null;

    const bestMatch = scoredMatches[0];

    return {
      customer: bestMatch.customer,
      confidence: bestMatch.similarity,
      matchedBy: 'name',
      matchDetails: `Matched by company name similarity: ${(bestMatch.similarity * 100).toFixed(0)}%`,
    };
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   * Returns a value between 0 (no match) and 1 (exact match)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    // Exact match
    if (s1 === s2) return 1.0;

    // One contains the other
    if (s1.includes(s2) || s2.includes(s1)) {
      const longer = Math.max(s1.length, s2.length);
      const shorter = Math.min(s1.length, s2.length);
      return shorter / longer;
    }

    // Levenshtein distance
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    if (maxLength === 0) return 1.0;

    return 1 - distance / maxLength;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * (minimum number of single-character edits required to change one word into the other)
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create 2D array
    const matrix: number[][] = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost, // substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Get all customers matching an email domain (for display/selection)
   */
  async findByDomain(orgId: string, email: string): Promise<any[]> {
    const domain = extractDomain(email);
    if (!domain) return [];

    const customers = await this.prisma.customer.findMany({
      where: {
        orgId,
        isActive: true,
        email: {
          not: null,
        },
      },
    });

    return customers.filter((c) => {
      if (!c.email) return false;
      return extractDomain(c.email) === domain;
    });
  }
}
