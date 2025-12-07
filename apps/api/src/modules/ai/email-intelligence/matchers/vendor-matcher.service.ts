/**
 * Vendor Matcher Service
 * Intelligent matching of email senders to existing vendors
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Vendor } from '@prisma/client';

export interface VendorMatchCriteria {
  companyName?: string;
  email?: string;
  taxId?: string;
  domain?: string;
}

export interface VendorMatchResult {
  vendor: Vendor | null;
  confidence: number;
  matchType: 'TAX_ID' | 'EMAIL_EXACT' | 'DOMAIN' | 'NAME_FUZZY' | 'NONE';
  reasoning: string;
}

/**
 * Service for matching companies/contacts to existing vendors
 */
@Injectable()
export class VendorMatcherService {
  private readonly logger = new Logger(VendorMatcherService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Attempt to match to an existing vendor using multiple strategies
   * Returns the best match with confidence score
   */
  async matchToExistingVendor(
    criteria: VendorMatchCriteria,
    orgId: string,
  ): Promise<VendorMatchResult> {
    this.logger.debug(
      `Attempting vendor match for org ${orgId}: ${JSON.stringify(criteria)}`,
    );

    // Strategy 1: Tax ID match (strongest match - 95% confidence)
    if (criteria.taxId) {
      const taxIdMatch = await this.matchByTaxId(criteria.taxId, orgId);
      if (taxIdMatch) {
        return {
          vendor: taxIdMatch,
          confidence: 0.95,
          matchType: 'TAX_ID',
          reasoning: `Matched by Tax ID: ${criteria.taxId}`,
        };
      }
    }

    // Strategy 2: Exact email match (strong match - 85% confidence)
    if (criteria.email) {
      const emailMatch = await this.matchByEmail(criteria.email, orgId);
      if (emailMatch) {
        return {
          vendor: emailMatch,
          confidence: 0.85,
          matchType: 'EMAIL_EXACT',
          reasoning: `Matched by email: ${criteria.email}`,
        };
      }
    }

    // Strategy 3: Email domain match (medium match - 70% confidence)
    if (criteria.domain || criteria.email) {
      const domain = criteria.domain || this.extractDomain(criteria.email!);
      if (domain) {
        const domainMatch = await this.matchByDomain(domain, orgId);
        if (domainMatch) {
          return {
            vendor: domainMatch,
            confidence: 0.7,
            matchType: 'DOMAIN',
            reasoning: `Matched by email domain: ${domain}`,
          };
        }
      }
    }

    // Strategy 4: Fuzzy company name match (weak match - 60% confidence)
    if (criteria.companyName) {
      const nameMatch = await this.matchByCompanyName(criteria.companyName, orgId);
      if (nameMatch) {
        return {
          vendor: nameMatch,
          confidence: 0.6,
          matchType: 'NAME_FUZZY',
          reasoning: `Matched by company name similarity: "${criteria.companyName}" -> "${nameMatch.name}"`,
        };
      }
    }

    // No match found
    return {
      vendor: null,
      confidence: 0,
      matchType: 'NONE',
      reasoning: 'No existing vendor matched',
    };
  }

  /**
   * Match by Tax ID / VAT number
   * Most reliable match
   */
  private async matchByTaxId(
    taxId: string,
    orgId: string,
  ): Promise<Vendor | null> {
    const normalized = this.normalizeTaxId(taxId);

    return this.prisma.vendor.findFirst({
      where: {
        organisationId: orgId,
        taxId: normalized,
        status: { not: 'BLOCKED' },
      },
    });
  }

  /**
   * Match by exact email address
   */
  private async matchByEmail(
    email: string,
    orgId: string,
  ): Promise<Vendor | null> {
    const normalized = email.toLowerCase().trim();

    return this.prisma.vendor.findFirst({
      where: {
        organisationId: orgId,
        email: {
          equals: normalized,
          mode: 'insensitive',
        },
        status: { not: 'BLOCKED' },
      },
    });
  }

  /**
   * Match by email domain
   * Finds vendor where email ends with @domain
   */
  private async matchByDomain(
    domain: string,
    orgId: string,
  ): Promise<Vendor | null> {
    const normalized = domain.toLowerCase().trim();

    return this.prisma.vendor.findFirst({
      where: {
        organisationId: orgId,
        email: {
          endsWith: `@${normalized}`,
          mode: 'insensitive',
        },
        status: { not: 'BLOCKED' },
      },
    });
  }

  /**
   * Match by company name (fuzzy matching)
   * Uses normalized name comparison
   */
  private async matchByCompanyName(
    companyName: string,
    orgId: string,
  ): Promise<Vendor | null> {
    const normalized = this.normalizeCompanyName(companyName);

    // First, try exact normalized match
    const exactMatch = await this.prisma.vendor.findFirst({
      where: {
        organisationId: orgId,
        OR: [
          {
            name: {
              equals: normalized,
              mode: 'insensitive',
            },
          },
          {
            displayName: {
              equals: normalized,
              mode: 'insensitive',
            },
          },
        ],
        status: { not: 'BLOCKED' },
      },
    });

    if (exactMatch) {
      return exactMatch;
    }

    // If no exact match, try contains match for shorter normalized names
    if (normalized.length >= 5) {
      const containsMatch = await this.prisma.vendor.findFirst({
        where: {
          organisationId: orgId,
          OR: [
            {
              name: {
                contains: normalized,
                mode: 'insensitive',
              },
            },
            {
              displayName: {
                contains: normalized,
                mode: 'insensitive',
              },
            },
          ],
          status: { not: 'BLOCKED' },
        },
      });

      return containsMatch;
    }

    return null;
  }

  /**
   * Normalize tax ID for comparison
   * Removes spaces, dashes, and converts to uppercase
   */
  private normalizeTaxId(taxId: string): string {
    return taxId
      .replace(/[\s\-\.]/g, '') // Remove spaces, dashes, dots
      .toUpperCase()
      .trim();
  }

  /**
   * Normalize company name for fuzzy matching
   * Removes common legal suffixes and special characters
   */
  private normalizeCompanyName(name: string): string {
    let normalized = name.toLowerCase().trim();

    // Remove common legal suffixes
    const legalSuffixes = [
      'gmbh',
      'ag',
      'kg',
      'ohg',
      'gbr',
      'inc',
      'incorporated',
      'corp',
      'corporation',
      'llc',
      'ltd',
      'limited',
      'co',
      'company',
      'sarl',
      'sa',
      'sas',
      'ug',
      'haftungsbeschränkt',
      'plc',
    ];

    legalSuffixes.forEach((suffix) => {
      // Remove suffix with optional dot, comma, or space before it
      const regex = new RegExp(`[\\s,\\.]+${suffix}$`, 'i');
      normalized = normalized.replace(regex, '');
    });

    // Remove special characters (keep alphanumeric and spaces)
    normalized = normalized.replace(/[^a-z0-9\s]/g, '');

    // Collapse multiple spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();

    return normalized;
  }

  /**
   * Extract domain from email address
   */
  private extractDomain(email: string): string | null {
    const match = email.match(/@(.+)$/);
    return match ? match[1].toLowerCase().trim() : null;
  }

  /**
   * Calculate similarity score between two company names
   * Uses Levenshtein distance for fuzzy matching
   * Returns score from 0 (no match) to 1 (perfect match)
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const normalized1 = this.normalizeCompanyName(name1);
    const normalized2 = this.normalizeCompanyName(name2);

    if (normalized1 === normalized2) {
      return 1.0;
    }

    // Simple substring check
    if (
      normalized1.includes(normalized2) ||
      normalized2.includes(normalized1)
    ) {
      return 0.8;
    }

    // Levenshtein distance
    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);

    if (maxLength === 0) {
      return 0;
    }

    return 1 - distance / maxLength;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
