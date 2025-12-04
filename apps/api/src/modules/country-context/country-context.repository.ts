import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  Country,
  Region,
  VatRate,
  DeductionCategory,
  EmploymentType,
  OrganisationCountry,
  TaxCredential,
  Prisma,
  CountryFeature,
} from '@prisma/client';

/**
 * Type definition for OrganisationCountry with country relation
 */
export type OrganisationCountryWithCountry = OrganisationCountry & {
  country: Country & {
    vatRates: VatRate[];
    features: CountryFeature[];
  };
};

/**
 * Country Context Repository
 * Handles all database operations for country-related entities
 */
@Injectable()
export class CountryContextRepository {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // COUNTRY METHODS
  // ============================================================================

  /**
   * Find all countries with pagination
   */
  async findAllCountries(params: {
    skip?: number;
    take?: number;
    where?: Prisma.CountryWhereInput;
    include?: Prisma.CountryInclude;
  }): Promise<Country[]> {
    return this.prisma.country.findMany(params);
  }

  /**
   * Count countries
   */
  async countCountries(where?: Prisma.CountryWhereInput): Promise<number> {
    return this.prisma.country.count({ where });
  }

  /**
   * Find country by code
   */
  async findCountryByCode(
    code: string,
    include?: Prisma.CountryInclude,
  ): Promise<Country | null> {
    return this.prisma.country.findUnique({
      where: { code: code.toUpperCase() },
      include,
    });
  }

  /**
   * Find country by ID
   */
  async findCountryById(
    id: string,
    include?: Prisma.CountryInclude,
  ): Promise<Country | null> {
    return this.prisma.country.findUnique({
      where: { id },
      include,
    });
  }

  // ============================================================================
  // REGION METHODS
  // ============================================================================

  /**
   * Find regions by country code
   */
  async findRegionsByCountryCode(countryCode: string): Promise<Region[]> {
    return this.prisma.region.findMany({
      where: {
        country: {
          code: countryCode.toUpperCase(),
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // ============================================================================
  // VAT RATE METHODS
  // ============================================================================

  /**
   * Find VAT rates by country code
   * Optionally filter by date
   */
  async findVatRatesByCountryCode(
    countryCode: string,
    date?: Date,
  ): Promise<VatRate[]> {
    const where: Prisma.VatRateWhereInput = {
      country: {
        code: countryCode.toUpperCase(),
      },
    };

    if (date) {
      where.validFrom = { lte: date };
      where.OR = [{ validTo: null }, { validTo: { gte: date } }];
    } else {
      // Get current rates (no validTo or validTo in future)
      where.validFrom = { lte: new Date() };
      where.OR = [{ validTo: null }, { validTo: { gte: new Date() } }];
    }

    return this.prisma.vatRate.findMany({
      where,
      orderBy: {
        rate: 'desc',
      },
    });
  }

  // ============================================================================
  // DEDUCTION CATEGORY METHODS
  // ============================================================================

  /**
   * Find deduction categories by country code
   */
  async findDeductionCategoriesByCountryCode(
    countryCode: string,
  ): Promise<DeductionCategory[]> {
    return this.prisma.deductionCategory.findMany({
      where: {
        country: {
          code: countryCode.toUpperCase(),
        },
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // ============================================================================
  // EMPLOYMENT TYPE METHODS
  // ============================================================================

  /**
   * Find employment types by country code
   */
  async findEmploymentTypesByCountryCode(
    countryCode: string,
  ): Promise<EmploymentType[]> {
    return this.prisma.employmentType.findMany({
      where: {
        country: {
          code: countryCode.toUpperCase(),
        },
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // ============================================================================
  // ORGANISATION COUNTRY METHODS
  // ============================================================================

  /**
   * Find organisation countries
   */
  async findOrganisationCountries(
    orgId: string,
  ): Promise<OrganisationCountryWithCountry[]> {
    return this.prisma.organisationCountry.findMany({
      where: { orgId },
      include: {
        country: {
          include: {
            vatRates: {
              where: {
                validFrom: { lte: new Date() },
                OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
              },
            },
            features: true,
          },
        },
      },
    });
  }

  /**
   * Add country to organisation
   */
  async addCountryToOrganisation(
    orgId: string,
    countryId: string,
  ): Promise<OrganisationCountryWithCountry> {
    return this.prisma.organisationCountry.create({
      data: {
        orgId,
        countryId,
      },
      include: {
        country: {
          include: {
            vatRates: {
              where: {
                validFrom: { lte: new Date() },
                OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
              },
            },
            features: true,
          },
        },
      },
    });
  }

  /**
   * Remove country from organisation
   */
  async removeCountryFromOrganisation(
    orgId: string,
    countryCode: string,
  ): Promise<OrganisationCountry> {
    return this.prisma.organisationCountry.delete({
      where: {
        orgId_countryId: {
          orgId,
          countryId: (
            await this.findCountryByCode(countryCode)
          )?.id as string,
        },
      },
    });
  }

  /**
   * Check if organisation has country
   */
  async organisationHasCountry(
    orgId: string,
    countryCode: string,
  ): Promise<boolean> {
    const country = await this.findCountryByCode(countryCode);
    if (!country) return false;

    const count = await this.prisma.organisationCountry.count({
      where: {
        orgId,
        countryId: country.id,
      },
    });

    return count > 0;
  }

  // ============================================================================
  // TAX CREDENTIAL METHODS
  // ============================================================================

  /**
   * Find tax credentials by organisation
   */
  async findTaxCredentialsByOrganisation(
    orgId: string,
  ): Promise<TaxCredential[]> {
    return this.prisma.taxCredential.findMany({
      where: { orgId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find tax credential by ID
   */
  async findTaxCredentialById(id: string): Promise<TaxCredential | null> {
    return this.prisma.taxCredential.findUnique({
      where: { id },
    });
  }

  /**
   * Create tax credential
   */
  async createTaxCredential(
    data: Prisma.TaxCredentialCreateInput,
  ): Promise<TaxCredential> {
    return this.prisma.taxCredential.create({
      data,
    });
  }

  /**
   * Update tax credential
   */
  async updateTaxCredential(
    id: string,
    data: Prisma.TaxCredentialUpdateInput,
  ): Promise<TaxCredential> {
    return this.prisma.taxCredential.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete tax credential
   */
  async deleteTaxCredential(id: string): Promise<TaxCredential> {
    return this.prisma.taxCredential.delete({
      where: { id },
    });
  }
}
