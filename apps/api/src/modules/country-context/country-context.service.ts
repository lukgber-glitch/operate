import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  CountryContextRepository,
  OrganisationCountryWithCountry,
} from './country-context.repository';
import { plainToInstance } from 'class-transformer';
import { CountryDto, CountryListDto } from './dto/country.dto';
import { RegionDto } from './dto/region.dto';
import { VatRateDto } from './dto/vat-rate.dto';
import { DeductionCategoryDto } from './dto/deduction-category.dto';
import { EmploymentTypeDto } from './dto/employment-type.dto';
import { OrganisationCountryDto } from './dto/organisation-country.dto';
import {
  TaxCredentialDto,
  CreateTaxCredentialDto,
  UpdateTaxCredentialDto,
} from './dto/tax-credential.dto';
import { CountryQueryDto } from './dto/country-query.dto';

/**
 * Country Context Service
 * Business logic for country-related operations
 */
@Injectable()
export class CountryContextService {
  constructor(private repository: CountryContextRepository) {}

  // ============================================================================
  // PUBLIC COUNTRY METHODS
  // ============================================================================

  /**
   * Get all countries with pagination
   */
  async findAllCountries(query: CountryQueryDto): Promise<CountryListDto> {
    const { isActive, page = 1, pageSize = 20 } = query;

    const where = isActive !== undefined ? { isActive } : {};
    const skip = (page - 1) * pageSize;

    const [countries, total] = await Promise.all([
      this.repository.findAllCountries({
        where,
        skip,
        take: pageSize,
        include: {
          vatRates: {
            where: {
              validFrom: { lte: new Date() },
              OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
            },
          },
          features: true,
        },
      }),
      this.repository.countCountries(where),
    ]);

    return {
      data: countries.map((country) => this.mapCountryToDto(country)),
      meta: {
        total,
        page,
        pageSize,
      },
    };
  }

  /**
   * Get country by code
   */
  async findCountryByCode(code: string): Promise<CountryDto> {
    const country = await this.repository.findCountryByCode(code, {
      vatRates: {
        where: {
          validFrom: { lte: new Date() },
          OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
        },
      },
      features: true,
    });

    if (!country) {
      throw new NotFoundException(`Country with code ${code} not found`);
    }

    return this.mapCountryToDto(country);
  }

  /**
   * Get regions for country
   */
  async getRegions(countryCode: string): Promise<RegionDto[]> {
    // Verify country exists
    await this.findCountryByCode(countryCode);

    const regions = await this.repository.findRegionsByCountryCode(countryCode);

    return regions.map((region) =>
      plainToInstance(RegionDto, region, {
        excludeExtraneousValues: false,
      }),
    );
  }

  /**
   * Get VAT rates for country
   */
  async getVatRates(
    countryCode: string,
    date?: string,
  ): Promise<VatRateDto[]> {
    // Verify country exists
    await this.findCountryByCode(countryCode);

    const queryDate = date ? new Date(date) : undefined;
    const vatRates =
      await this.repository.findVatRatesByCountryCode(countryCode, queryDate);

    return vatRates.map((rate) => ({
      ...rate,
      rate: parseFloat(rate.rate.toString()),
    }));
  }

  /**
   * Get deduction categories for country
   */
  async getDeductionCategories(
    countryCode: string,
  ): Promise<DeductionCategoryDto[]> {
    // Verify country exists
    await this.findCountryByCode(countryCode);

    const categories =
      await this.repository.findDeductionCategoriesByCountryCode(countryCode);

    return categories.map((category) => ({
      ...category,
      maxAmount: category.maxAmount
        ? parseFloat(category.maxAmount.toString())
        : null,
    }));
  }

  /**
   * Get employment types for country
   */
  async getEmploymentTypes(countryCode: string): Promise<EmploymentTypeDto[]> {
    // Verify country exists
    await this.findCountryByCode(countryCode);

    const employmentTypes =
      await this.repository.findEmploymentTypesByCountryCode(countryCode);

    return employmentTypes.map((type) =>
      plainToInstance(EmploymentTypeDto, type, {
        excludeExtraneousValues: false,
      }),
    );
  }

  // ============================================================================
  // ORGANISATION COUNTRY METHODS
  // ============================================================================

  /**
   * Get organisation countries
   */
  async getOrganisationCountries(
    orgId: string,
  ): Promise<OrganisationCountryDto[]> {
    const orgCountries =
      await this.repository.findOrganisationCountries(orgId);

    return orgCountries.map((oc) => ({
      ...oc,
      country: this.mapCountryToDto(oc.country),
    }));
  }

  /**
   * Add country to organisation
   */
  async addCountryToOrganisation(
    orgId: string,
    countryCode: string,
  ): Promise<OrganisationCountryDto> {
    // Check if country exists
    const country = await this.repository.findCountryByCode(countryCode);
    if (!country) {
      throw new NotFoundException(`Country with code ${countryCode} not found`);
    }

    // Check if already added
    const alreadyExists = await this.repository.organisationHasCountry(
      orgId,
      countryCode,
    );
    if (alreadyExists) {
      throw new ConflictException(
        `Country ${countryCode} already added to organisation`,
      );
    }

    const orgCountry = await this.repository.addCountryToOrganisation(
      orgId,
      country.id,
    );

    return {
      ...orgCountry,
      country: this.mapCountryToDto(orgCountry.country),
    };
  }

  /**
   * Remove country from organisation
   */
  async removeCountryFromOrganisation(
    orgId: string,
    countryCode: string,
  ): Promise<void> {
    // Check if country exists
    const country = await this.repository.findCountryByCode(countryCode);
    if (!country) {
      throw new NotFoundException(`Country with code ${countryCode} not found`);
    }

    // Check if it's added to organisation
    const exists = await this.repository.organisationHasCountry(
      orgId,
      countryCode,
    );
    if (!exists) {
      throw new NotFoundException(
        `Country ${countryCode} not found in organisation`,
      );
    }

    await this.repository.removeCountryFromOrganisation(orgId, countryCode);
  }

  // ============================================================================
  // TAX CREDENTIAL METHODS
  // ============================================================================

  /**
   * Get organisation tax credentials
   */
  async getTaxCredentials(orgId: string): Promise<TaxCredentialDto[]> {
    const credentials =
      await this.repository.findTaxCredentialsByOrganisation(orgId);

    return credentials.map((credential) =>
      plainToInstance(TaxCredentialDto, credential, {
        excludeExtraneousValues: false,
      }),
    );
  }

  /**
   * Create tax credential
   */
  async createTaxCredential(
    orgId: string,
    dto: CreateTaxCredentialDto,
  ): Promise<TaxCredentialDto> {
    // Verify country exists
    const country = await this.repository.findCountryByCode(dto.countryCode);
    if (!country) {
      throw new NotFoundException(
        `Country with code ${dto.countryCode} not found`,
      );
    }

    // TODO: Encrypt the value before storing
    // For now, storing as plain text (should be encrypted in production)
    const credential = await this.repository.createTaxCredential({
      organisation: { connect: { id: orgId } },
      countryCode: dto.countryCode.toUpperCase(),
      type: dto.type,
      name: dto.name,
      value: dto.value, // TODO: Encrypt this
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });

    return plainToInstance(TaxCredentialDto, credential, {
      excludeExtraneousValues: false,
    });
  }

  /**
   * Update tax credential
   */
  async updateTaxCredential(
    orgId: string,
    credentialId: string,
    dto: UpdateTaxCredentialDto,
  ): Promise<TaxCredentialDto> {
    // Verify credential exists and belongs to organisation
    const existing = await this.repository.findTaxCredentialById(credentialId);
    if (!existing || existing.orgId !== orgId) {
      throw new NotFoundException('Tax credential not found');
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.value) updateData.value = dto.value; // TODO: Encrypt this
    if (dto.expiresAt !== undefined)
      updateData.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    const credential = await this.repository.updateTaxCredential(
      credentialId,
      updateData,
    );

    return plainToInstance(TaxCredentialDto, credential, {
      excludeExtraneousValues: false,
    });
  }

  /**
   * Delete tax credential
   */
  async deleteTaxCredential(orgId: string, credentialId: string): Promise<void> {
    // Verify credential exists and belongs to organisation
    const existing = await this.repository.findTaxCredentialById(credentialId);
    if (!existing || existing.orgId !== orgId) {
      throw new NotFoundException('Tax credential not found');
    }

    await this.repository.deleteTaxCredential(credentialId);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Map Country entity to DTO
   */
  private mapCountryToDto(country: any): CountryDto {
    return {
      id: country.id,
      code: country.code,
      code3: country.code3,
      name: country.name,
      nameNative: country.nameNative,
      currency: country.currency,
      currencySymbol: country.currencySymbol,
      locale: country.locale,
      timezone: country.timezone,
      fiscalYearStart: country.fiscalYearStart,
      isActive: country.isActive,
      createdAt: country.createdAt,
      updatedAt: country.updatedAt,
      currentVatRates: country.vatRates?.map((rate: any) => ({
        ...rate,
        rate: parseFloat(rate.rate.toString()),
      })),
      features: country.features?.map((f: any) => ({
        feature: f.feature,
        enabled: f.enabled,
        config: f.config,
      })),
    };
  }
}
