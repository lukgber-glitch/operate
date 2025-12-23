/**
 * Organization Context Provider
 * Provides context about the organization (for OrgContext)
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { OrgContext } from '../context.types';

@Injectable()
export class OrganizationContextProvider {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get organization context
   */
  async getOrgContext(orgId: string): Promise<OrgContext> {
    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        country: true,
        currency: true,
        industry: true,
        vatNumber: true,
        subscriptionTier: true,
        settings: true,
      },
    });

    if (!org) {
      throw new Error(`Organization not found: ${orgId}`);
    }

    // Determine tax regime based on country
    const taxRegime = this.getTaxRegime(org.country);

    // Extract features from subscription tier and settings
    const features = this.getFeatures(org);

    return {
      id: org.id,
      name: org.name,
      country: org.country,
      currency: org.currency,
      industry: org.industry || undefined,
      taxRegime,
      fiscalYearEnd: undefined, // fiscalYearEnd not in Organisation model
      features,
    };
  }

  /**
   * Get tax regime based on country
   */
  private getTaxRegime(country: string): string {
    const regimes: Record<string, string> = {
      DE: 'German VAT/USt',
      AT: 'Austrian VAT/USt',
      CH: 'Swiss VAT/MWST',
      FR: 'French VAT/TVA',
      GB: 'UK VAT',
      US: 'US Sales Tax',
    };

    return regimes[country] || `${country} Tax System`;
  }

  /**
   * Extract features from organization
   */
  private getFeatures(org: any): string[] {
    const features: string[] = [];

    // Add based on subscription tier
    if (org.subscriptionTier) {
      features.push(`${org.subscriptionTier} Plan`);
    }

    // Add based on settings (if settings is JSON)
    if (org.settings && typeof org.settings === 'object') {
      const settings = org.settings as Record<string, any>;

      if (settings.invoicingEnabled) features.push('Invoicing');
      if (settings.expensesEnabled) features.push('Expense Management');
      if (settings.hrEnabled) features.push('HR Management');
      if (settings.payrollEnabled) features.push('Payroll');
      if (settings.taxAutomationEnabled) features.push('Tax Automation');
      if (settings.aiClassificationEnabled) features.push('AI Classification');
    }

    return features;
  }

  /**
   * Format fiscal year end
   */
  private formatFiscalYearEnd(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    });
  }
}
