import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CountryContextService } from './country-context.service';
import { CountryDto, CountryListDto } from './dto/country.dto';
import { RegionDto } from './dto/region.dto';
import { VatRateDto, VatRateQueryDto } from './dto/vat-rate.dto';
import { DeductionCategoryDto } from './dto/deduction-category.dto';
import { EmploymentTypeDto } from './dto/employment-type.dto';
import {
  OrganisationCountryDto,
  AddCountryToOrganisationDto,
} from './dto/organisation-country.dto';
import {
  TaxCredentialDto,
  CreateTaxCredentialDto,
  UpdateTaxCredentialDto,
} from './dto/tax-credential.dto';
import { CountryQueryDto } from './dto/country-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Country Context Controller
 * Handles country-related operations and organisation country management
 */
@ApiTags('Countries')
@Controller()
export class CountryContextController {
  constructor(private countryContextService: CountryContextService) {}

  // ============================================================================
  // PUBLIC COUNTRY ENDPOINTS (No Auth Required)
  // ============================================================================

  /**
   * List all active countries
   */
  @Get('countries')
  @ApiOperation({
    summary: 'List all countries',
    description: 'Get paginated list of countries',
  })
  @ApiResponse({
    status: 200,
    description: 'Countries retrieved successfully',
    type: CountryListDto,
  })
  async getCountries(@Query() query: CountryQueryDto): Promise<CountryListDto> {
    return this.countryContextService.findAllCountries(query);
  }

  /**
   * Get single country by code
   */
  @Get('countries/:code')
  @ApiOperation({
    summary: 'Get country by code',
    description: 'Get detailed information about a specific country',
  })
  @ApiParam({
    name: 'code',
    description: 'ISO 3166-1 alpha-2 country code',
    example: 'DE',
  })
  @ApiResponse({
    status: 200,
    description: 'Country retrieved successfully',
    type: CountryDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Country not found',
  })
  async getCountryByCode(@Param('code') code: string): Promise<CountryDto> {
    return this.countryContextService.findCountryByCode(code);
  }

  /**
   * Get regions for country
   */
  @Get('countries/:code/regions')
  @ApiOperation({
    summary: 'Get country regions',
    description: 'Get list of regions/states for a country',
  })
  @ApiParam({
    name: 'code',
    description: 'ISO 3166-1 alpha-2 country code',
    example: 'DE',
  })
  @ApiResponse({
    status: 200,
    description: 'Regions retrieved successfully',
    type: [RegionDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Country not found',
  })
  async getRegions(@Param('code') code: string): Promise<RegionDto[]> {
    return this.countryContextService.getRegions(code);
  }

  /**
   * Get VAT rates for country
   */
  @Get('countries/:code/vat-rates')
  @ApiOperation({
    summary: 'Get country VAT rates',
    description: 'Get current or historical VAT rates for a country',
  })
  @ApiParam({
    name: 'code',
    description: 'ISO 3166-1 alpha-2 country code',
    example: 'DE',
  })
  @ApiResponse({
    status: 200,
    description: 'VAT rates retrieved successfully',
    type: [VatRateDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Country not found',
  })
  async getVatRates(
    @Param('code') code: string,
    @Query() query: VatRateQueryDto,
  ): Promise<VatRateDto[]> {
    return this.countryContextService.getVatRates(code, query.date);
  }

  /**
   * Get deduction categories for country
   */
  @Get('countries/:code/deductions')
  @ApiOperation({
    summary: 'Get country deduction categories',
    description: 'Get list of tax deduction categories for a country',
  })
  @ApiParam({
    name: 'code',
    description: 'ISO 3166-1 alpha-2 country code',
    example: 'DE',
  })
  @ApiResponse({
    status: 200,
    description: 'Deduction categories retrieved successfully',
    type: [DeductionCategoryDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Country not found',
  })
  async getDeductionCategories(
    @Param('code') code: string,
  ): Promise<DeductionCategoryDto[]> {
    return this.countryContextService.getDeductionCategories(code);
  }

  /**
   * Get employment types for country
   */
  @Get('countries/:code/employment-types')
  @ApiOperation({
    summary: 'Get country employment types',
    description: 'Get list of employment types for a country',
  })
  @ApiParam({
    name: 'code',
    description: 'ISO 3166-1 alpha-2 country code',
    example: 'DE',
  })
  @ApiResponse({
    status: 200,
    description: 'Employment types retrieved successfully',
    type: [EmploymentTypeDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Country not found',
  })
  async getEmploymentTypes(
    @Param('code') code: string,
  ): Promise<EmploymentTypeDto[]> {
    return this.countryContextService.getEmploymentTypes(code);
  }

  // ============================================================================
  // ORGANISATION COUNTRY ENDPOINTS (Auth Required)
  // ============================================================================

  /**
   * Get organisation's operating countries
   */
  @Get('organisations/:id/countries')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get organisation countries',
    description: 'Get list of countries where organisation operates',
  })
  @ApiParam({
    name: 'id',
    description: 'Organisation ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Organisation countries retrieved successfully',
    type: [OrganisationCountryDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getOrganisationCountries(
    @Param('id') orgId: string,
  ): Promise<OrganisationCountryDto[]> {
    // TODO: Add permission check to ensure user has access to this organisation
    return this.countryContextService.getOrganisationCountries(orgId);
  }

  /**
   * Add country to organisation
   */
  @Post('organisations/:id/countries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OWNER')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add country to organisation',
    description: 'Add a new operating country to organisation',
  })
  @ApiParam({
    name: 'id',
    description: 'Organisation ID',
  })
  @ApiResponse({
    status: 201,
    description: 'Country added successfully',
    type: OrganisationCountryDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Owner role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Country not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Country already added',
  })
  async addCountryToOrganisation(
    @Param('id') orgId: string,
    @Body() dto: AddCountryToOrganisationDto,
  ): Promise<OrganisationCountryDto> {
    return this.countryContextService.addCountryToOrganisation(
      orgId,
      dto.countryCode,
    );
  }

  /**
   * Remove country from organisation
   */
  @Delete('organisations/:id/countries/:code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OWNER')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove country from organisation',
    description: 'Remove an operating country from organisation',
  })
  @ApiParam({
    name: 'id',
    description: 'Organisation ID',
  })
  @ApiParam({
    name: 'code',
    description: 'Country code',
    example: 'DE',
  })
  @ApiResponse({
    status: 204,
    description: 'Country removed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Owner role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Country not found',
  })
  async removeCountryFromOrganisation(
    @Param('id') orgId: string,
    @Param('code') countryCode: string,
  ): Promise<void> {
    await this.countryContextService.removeCountryFromOrganisation(
      orgId,
      countryCode,
    );
  }

  // ============================================================================
  // TAX CREDENTIAL ENDPOINTS (Auth Required)
  // ============================================================================

  /**
   * Get organisation's tax credentials
   */
  @Get('organisations/:id/tax-credentials')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get tax credentials',
    description: 'Get list of tax credentials for organisation',
  })
  @ApiParam({
    name: 'id',
    description: 'Organisation ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax credentials retrieved successfully',
    type: [TaxCredentialDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getTaxCredentials(
    @Param('id') orgId: string,
  ): Promise<TaxCredentialDto[]> {
    // TODO: Add permission check to ensure user has access to this organisation
    return this.countryContextService.getTaxCredentials(orgId);
  }

  /**
   * Create tax credential
   */
  @Post('organisations/:id/tax-credentials')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OWNER')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create tax credential',
    description: 'Add a new tax credential to organisation',
  })
  @ApiParam({
    name: 'id',
    description: 'Organisation ID',
  })
  @ApiResponse({
    status: 201,
    description: 'Tax credential created successfully',
    type: TaxCredentialDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Owner role required',
  })
  async createTaxCredential(
    @Param('id') orgId: string,
    @Body() dto: CreateTaxCredentialDto,
  ): Promise<TaxCredentialDto> {
    return this.countryContextService.createTaxCredential(orgId, dto);
  }

  /**
   * Update tax credential
   */
  @Patch('organisations/:id/tax-credentials/:credentialId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OWNER')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update tax credential',
    description: 'Update an existing tax credential',
  })
  @ApiParam({
    name: 'id',
    description: 'Organisation ID',
  })
  @ApiParam({
    name: 'credentialId',
    description: 'Tax credential ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Tax credential updated successfully',
    type: TaxCredentialDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Owner role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Tax credential not found',
  })
  async updateTaxCredential(
    @Param('id') orgId: string,
    @Param('credentialId') credentialId: string,
    @Body() dto: UpdateTaxCredentialDto,
  ): Promise<TaxCredentialDto> {
    return this.countryContextService.updateTaxCredential(
      orgId,
      credentialId,
      dto,
    );
  }

  /**
   * Delete tax credential
   */
  @Delete('organisations/:id/tax-credentials/:credentialId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OWNER')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete tax credential',
    description: 'Delete a tax credential',
  })
  @ApiParam({
    name: 'id',
    description: 'Organisation ID',
  })
  @ApiParam({
    name: 'credentialId',
    description: 'Tax credential ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Tax credential deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Owner role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Tax credential not found',
  })
  async deleteTaxCredential(
    @Param('id') orgId: string,
    @Param('credentialId') credentialId: string,
  ): Promise<void> {
    await this.countryContextService.deleteTaxCredential(orgId, credentialId);
  }
}
