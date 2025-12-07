/**
 * Vendor Deduplication Service
 * Matches extracted vendors from emails to existing vendor records
 * Prevents duplicate vendor creation and supports vendor merging
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Vendor, VendorStatus } from '@prisma/client';

export interface ExtractedVendorData {
  name: string;
  email?: string;
  taxId?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  city?: string;
  country?: string;
  bankIban?: string;
}

export interface VendorMatchResult {
  vendor?: Vendor;
  confidence: number;
  matchReasons: MatchReason[];
  action: 'EXACT_MATCH' | 'LIKELY_MATCH' | 'POSSIBLE_MATCH' | 'NO_MATCH';
}

export enum MatchReason {
  NAME_EXACT = 'NAME_EXACT',
  NAME_SIMILAR = 'NAME_SIMILAR',
  EMAIL_MATCH = 'EMAIL_MATCH',
  TAX_ID_MATCH = 'TAX_ID_MATCH',
  PHONE_MATCH = 'PHONE_MATCH',
  IBAN_MATCH = 'IBAN_MATCH',
  WEBSITE_MATCH = 'WEBSITE_MATCH',
  ADDRESS_MATCH = 'ADDRESS_MATCH',
}

export interface DeduplicationResult {
  action: 'MATCHED' | 'CREATED' | 'MERGED';
  vendor: Vendor;
  matchConfidence?: number;
  matchReasons?: MatchReason[];
  mergedFromIds?: string[];
}

export interface MergeVendorsResult {
  primaryVendor: Vendor;
  mergedCount: number;
  updatedBillsCount: number;
}

@Injectable()
export class VendorDeduplicationService {
  private readonly logger = new Logger(VendorDeduplicationService.name);

  // Confidence thresholds
  private readonly EXACT_MATCH_THRESHOLD = 95;
  private readonly LIKELY_MATCH_THRESHOLD = 80;
  private readonly POSSIBLE_MATCH_THRESHOLD = 60;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find matching vendor for extracted data
   * Returns the best match with confidence score and reasons
   */
  async findMatchingVendor(
    orgId: string,
    extractedData: ExtractedVendorData,
  ): Promise<VendorMatchResult> {
    this.logger.debug(`Finding matching vendor for: ${extractedData.name}`);

    // Get all active vendors for the organization
    const vendors = await this.prisma.vendor.findMany({
      where: {
        organisationId: orgId,
        status: { in: [VendorStatus.ACTIVE, VendorStatus.INACTIVE] },
      },
    });

    if (vendors.length === 0) {
      return {
        confidence: 0,
        matchReasons: [],
        action: 'NO_MATCH',
      };
    }

    // Find the best match
    let bestMatch: VendorMatchResult = {
      confidence: 0,
      matchReasons: [],
      action: 'NO_MATCH',
    };

    for (const vendor of vendors) {
      const matchResult = this.calculateMatchScore(vendor, extractedData);

      if (matchResult.confidence > bestMatch.confidence) {
        bestMatch = {
          vendor,
          ...matchResult,
        };
      }
    }

    // Determine action based on confidence
    if (bestMatch.confidence >= this.EXACT_MATCH_THRESHOLD) {
      bestMatch.action = 'EXACT_MATCH';
    } else if (bestMatch.confidence >= this.LIKELY_MATCH_THRESHOLD) {
      bestMatch.action = 'LIKELY_MATCH';
    } else if (bestMatch.confidence >= this.POSSIBLE_MATCH_THRESHOLD) {
      bestMatch.action = 'POSSIBLE_MATCH';
    }

    this.logger.debug(
      `Best match for "${extractedData.name}": ${bestMatch.vendor?.name || 'NONE'} (${bestMatch.confidence}% - ${bestMatch.action})`,
    );

    return bestMatch;
  }

  /**
   * Calculate match score between a vendor and extracted data
   */
  private calculateMatchScore(
    vendor: Vendor,
    extractedData: ExtractedVendorData,
  ): { confidence: number; matchReasons: MatchReason[] } {
    let score = 0;
    const reasons: MatchReason[] = [];

    // Tax ID match (highest priority - 40 points)
    if (extractedData.taxId && vendor.taxId) {
      const normalizedExtracted = this.normalizeTaxId(extractedData.taxId);
      const normalizedVendor = this.normalizeTaxId(vendor.taxId);

      if (normalizedExtracted === normalizedVendor) {
        score += 40;
        reasons.push(MatchReason.TAX_ID_MATCH);
      }
    }

    // IBAN match (35 points)
    if (extractedData.bankIban && vendor.bankIban) {
      const normalizedExtracted = this.normalizeIban(extractedData.bankIban);
      const normalizedVendor = this.normalizeIban(vendor.bankIban);

      if (normalizedExtracted === normalizedVendor) {
        score += 35;
        reasons.push(MatchReason.IBAN_MATCH);
      }
    }

    // Email match (30 points)
    if (extractedData.email && vendor.email) {
      if (
        extractedData.email.toLowerCase() === vendor.email.toLowerCase()
      ) {
        score += 30;
        reasons.push(MatchReason.EMAIL_MATCH);
      } else if (this.extractDomain(extractedData.email) === this.extractDomain(vendor.email)) {
        // Same email domain
        score += 15;
      }
    }

    // Name matching (up to 25 points)
    const nameScore = this.calculateNameScore(
      extractedData.name,
      vendor.name,
      vendor.displayName,
    );
    score += nameScore.score;
    if (nameScore.reason) {
      reasons.push(nameScore.reason);
    }

    // Phone match (15 points)
    if (extractedData.phone && vendor.phone) {
      const normalizedExtracted = this.normalizePhone(extractedData.phone);
      const normalizedVendor = this.normalizePhone(vendor.phone);

      if (normalizedExtracted === normalizedVendor) {
        score += 15;
        reasons.push(MatchReason.PHONE_MATCH);
      }
    }

    // Website match (10 points)
    if (extractedData.website && vendor.website) {
      const domainExtracted = this.extractWebsiteDomain(extractedData.website);
      const domainVendor = this.extractWebsiteDomain(vendor.website);

      if (domainExtracted === domainVendor) {
        score += 10;
        reasons.push(MatchReason.WEBSITE_MATCH);
      }
    }

    // Address match (10 points)
    if (extractedData.addressLine1 && vendor.addressLine1) {
      const similarity = this.calculateStringSimilarity(
        extractedData.addressLine1.toLowerCase(),
        vendor.addressLine1.toLowerCase(),
      );
      if (similarity > 0.8) {
        score += 10;
        reasons.push(MatchReason.ADDRESS_MATCH);
      }
    }

    // Cap at 100
    return {
      confidence: Math.min(score, 100),
      matchReasons: reasons,
    };
  }

  /**
   * Calculate name matching score
   */
  private calculateNameScore(
    extractedName: string,
    vendorName: string,
    vendorDisplayName?: string | null,
  ): { score: number; reason?: MatchReason } {
    const normalizedExtracted = this.normalizeName(extractedName);
    const normalizedVendorName = this.normalizeName(vendorName);
    const normalizedDisplayName = vendorDisplayName
      ? this.normalizeName(vendorDisplayName)
      : null;

    // Exact match
    if (
      normalizedExtracted === normalizedVendorName ||
      (normalizedDisplayName && normalizedExtracted === normalizedDisplayName)
    ) {
      return { score: 25, reason: MatchReason.NAME_EXACT };
    }

    // Check if one contains the other
    if (
      normalizedExtracted.includes(normalizedVendorName) ||
      normalizedVendorName.includes(normalizedExtracted) ||
      (normalizedDisplayName &&
        (normalizedExtracted.includes(normalizedDisplayName) ||
          normalizedDisplayName.includes(normalizedExtracted)))
    ) {
      return { score: 20, reason: MatchReason.NAME_SIMILAR };
    }

    // Fuzzy similarity
    const similarity = Math.max(
      this.calculateStringSimilarity(normalizedExtracted, normalizedVendorName),
      normalizedDisplayName
        ? this.calculateStringSimilarity(normalizedExtracted, normalizedDisplayName)
        : 0,
    );

    if (similarity > 0.8) {
      return { score: 18, reason: MatchReason.NAME_SIMILAR };
    } else if (similarity > 0.6) {
      return { score: 12, reason: MatchReason.NAME_SIMILAR };
    } else if (similarity > 0.4) {
      return { score: 5 };
    }

    return { score: 0 };
  }

  /**
   * Find or create vendor from extracted data
   * Automatically matches to existing vendor or creates new one
   */
  async findOrCreateVendor(
    orgId: string,
    extractedData: ExtractedVendorData,
    autoCreateThreshold: number = 60,
  ): Promise<DeduplicationResult> {
    // Try to find a matching vendor
    const matchResult = await this.findMatchingVendor(orgId, extractedData);

    // If we have a confident match, return it
    if (
      matchResult.action === 'EXACT_MATCH' ||
      matchResult.action === 'LIKELY_MATCH'
    ) {
      this.logger.log(
        `Found matching vendor: ${matchResult.vendor!.name} (${matchResult.confidence}%)`,
      );
      return {
        action: 'MATCHED',
        vendor: matchResult.vendor!,
        matchConfidence: matchResult.confidence,
        matchReasons: matchResult.matchReasons,
      };
    }

    // If confidence is below threshold, create a new vendor
    if (matchResult.confidence < autoCreateThreshold) {
      const newVendor = await this.prisma.vendor.create({
        data: {
          organisationId: orgId,
          name: extractedData.name,
          displayName: extractedData.name,
          email: extractedData.email,
          taxId: extractedData.taxId,
          phone: extractedData.phone,
          website: extractedData.website,
          addressLine1: extractedData.addressLine1,
          city: extractedData.city,
          country: extractedData.country,
          bankIban: extractedData.bankIban,
          status: VendorStatus.ACTIVE,
          taxIdType: 'OTHER',
        },
      });

      this.logger.log(`Created new vendor: ${newVendor.name} (${newVendor.id})`);
      return {
        action: 'CREATED',
        vendor: newVendor,
      };
    }

    // Possible match but not confident enough - still return it but mark as needing review
    this.logger.log(
      `Possible match found: ${matchResult.vendor!.name} (${matchResult.confidence}%) - needs review`,
    );
    return {
      action: 'MATCHED',
      vendor: matchResult.vendor!,
      matchConfidence: matchResult.confidence,
      matchReasons: matchResult.matchReasons,
    };
  }

  /**
   * Find potential duplicate vendors in the organization
   */
  async findDuplicates(
    orgId: string,
    minConfidence: number = 70,
  ): Promise<Array<{ vendor1: Vendor; vendor2: Vendor; confidence: number; reasons: MatchReason[] }>> {
    const vendors = await this.prisma.vendor.findMany({
      where: {
        organisationId: orgId,
        status: { not: VendorStatus.BLOCKED },
      },
    });

    const duplicates: Array<{
      vendor1: Vendor;
      vendor2: Vendor;
      confidence: number;
      reasons: MatchReason[];
    }> = [];

    // Compare each pair of vendors
    for (let i = 0; i < vendors.length; i++) {
      for (let j = i + 1; j < vendors.length; j++) {
        const vendor1 = vendors[i];
        const vendor2 = vendors[j];

        const matchResult = this.calculateMatchScore(vendor1, {
          name: vendor2.name,
          email: vendor2.email || undefined,
          taxId: vendor2.taxId || undefined,
          phone: vendor2.phone || undefined,
          website: vendor2.website || undefined,
          addressLine1: vendor2.addressLine1 || undefined,
          city: vendor2.city || undefined,
          country: vendor2.country || undefined,
          bankIban: vendor2.bankIban || undefined,
        });

        if (matchResult.confidence >= minConfidence) {
          duplicates.push({
            vendor1,
            vendor2,
            confidence: matchResult.confidence,
            reasons: matchResult.matchReasons,
          });
        }
      }
    }

    // Sort by confidence (highest first)
    return duplicates.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Merge duplicate vendors into a primary vendor
   * Moves all bills to the primary vendor and deletes the duplicates
   */
  async mergeVendors(
    primaryVendorId: string,
    duplicateVendorIds: string[],
  ): Promise<MergeVendorsResult> {
    this.logger.log(
      `Merging vendors ${duplicateVendorIds.join(', ')} into ${primaryVendorId}`,
    );

    const primaryVendor = await this.prisma.vendor.findUnique({
      where: { id: primaryVendorId },
    });

    if (!primaryVendor) {
      throw new Error(`Primary vendor ${primaryVendorId} not found`);
    }

    let updatedBillsCount = 0;

    // Move all bills from duplicate vendors to primary
    for (const duplicateId of duplicateVendorIds) {
      if (duplicateId === primaryVendorId) continue;

      const result = await this.prisma.bill.updateMany({
        where: { vendorId: duplicateId },
        data: { vendorId: primaryVendorId },
      });

      updatedBillsCount += result.count;
    }

    // Delete the duplicate vendors
    await this.prisma.vendor.deleteMany({
      where: {
        id: { in: duplicateVendorIds.filter((id) => id !== primaryVendorId) },
      },
    });

    this.logger.log(
      `Merged ${duplicateVendorIds.length - 1} vendors, updated ${updatedBillsCount} bills`,
    );

    const updatedVendor = await this.prisma.vendor.findUnique({
      where: { id: primaryVendorId },
    });

    return {
      primaryVendor: updatedVendor!,
      mergedCount: duplicateVendorIds.length - 1,
      updatedBillsCount,
    };
  }

  /**
   * Update vendor with extracted data (fill in missing fields)
   */
  async enrichVendor(
    vendorId: string,
    extractedData: ExtractedVendorData,
  ): Promise<Vendor> {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new Error(`Vendor ${vendorId} not found`);
    }

    // Only update fields that are currently empty
    const updateData: any = {};

    if (!vendor.email && extractedData.email) {
      updateData.email = extractedData.email;
    }
    if (!vendor.taxId && extractedData.taxId) {
      updateData.taxId = extractedData.taxId;
    }
    if (!vendor.phone && extractedData.phone) {
      updateData.phone = extractedData.phone;
    }
    if (!vendor.website && extractedData.website) {
      updateData.website = extractedData.website;
    }
    if (!vendor.addressLine1 && extractedData.addressLine1) {
      updateData.addressLine1 = extractedData.addressLine1;
    }
    if (!vendor.city && extractedData.city) {
      updateData.city = extractedData.city;
    }
    if (!vendor.country && extractedData.country) {
      updateData.country = extractedData.country;
    }
    if (!vendor.bankIban && extractedData.bankIban) {
      updateData.bankIban = extractedData.bankIban;
    }

    if (Object.keys(updateData).length > 0) {
      const updated = await this.prisma.vendor.update({
        where: { id: vendorId },
        data: updateData,
      });

      this.logger.log(
        `Enriched vendor ${vendorId} with ${Object.keys(updateData).length} fields`,
      );
      return updated;
    }

    return vendor;
  }

  // ========== Helper Methods ==========

  /**
   * Normalize a name for comparison
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/gmbh|ug|ag|kg|ohg|gbr|e\.k\.|inc\.?|ltd\.?|llc|corp\.?/gi, '')
      .replace(/[^a-z0-9äöüß]/g, '')
      .trim();
  }

  /**
   * Normalize a tax ID for comparison
   */
  private normalizeTaxId(taxId: string): string {
    return taxId.replace(/[^a-z0-9]/gi, '').toUpperCase();
  }

  /**
   * Normalize an IBAN for comparison
   */
  private normalizeIban(iban: string): string {
    return iban.replace(/\s/g, '').toUpperCase();
  }

  /**
   * Normalize a phone number for comparison
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
  }

  /**
   * Extract domain from email
   */
  private extractDomain(email: string): string {
    const parts = email.split('@');
    return parts.length > 1 ? parts[1].toLowerCase() : '';
  }

  /**
   * Extract domain from website URL
   */
  private extractWebsiteDomain(website: string): string {
    try {
      const url = new URL(
        website.startsWith('http') ? website : `https://${website}`,
      );
      return url.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      return website.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
    }
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    if (longer.includes(shorter)) {
      return 0.85;
    }

    const editDistance = this.levenshteinDistance(str1, str2);
    return (longer.length - editDistance) / longer.length;
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
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
