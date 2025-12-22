import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../cache/redis.service';
import { ViesClient } from './vies.client';
import {
  VatValidationResultDto,
  BulkVatValidationResultDto,
  CrossBorderRulesDto,
} from './dto/vat-validation-result.dto';
import {
  EU_COUNTRIES,
  ViesErrorCode,
  CachedVatValidation,
} from './interfaces/vies-response.interface';

/**
 * VIES Service
 * Handles VAT validation with caching and retry logic
 */
@Injectable()
export class ViesService {
  private readonly logger = new Logger(ViesService.name);
  private readonly cachePrefix = 'vies';
  private readonly cacheTtl = 24 * 60 * 60; // 24 hours in seconds
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second base delay

  constructor(
    private readonly viesClient: ViesClient,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Validate a single VAT number
   */
  async validateVat(
    vatNumberInput: string,
    countryCodeInput?: string,
    skipCache = false,
  ): Promise<VatValidationResultDto> {
    try {
      // Parse and normalize VAT number
      const { countryCode, vatNumber } = this.parseVatNumber(
        vatNumberInput,
        countryCodeInput,
      );

      // Validate country is in EU
      if (!this.isEuCountry(countryCode)) {
        throw new BadRequestException(
          `${countryCode} is not an EU member state`,
        );
      }

      // Check cache first
      if (!skipCache) {
        const cached = await this.getCachedValidation(
          countryCode,
          vatNumber,
        );
        if (cached) {
          this.logger.debug(
            `Cache hit for ${countryCode}${vatNumber}`,
          );
          return cached;
        }
      }

      // Perform validation with retry logic
      const result = await this.validateWithRetry(
        countryCode,
        vatNumber,
      );

      // Cache successful result
      if (result.valid) {
        await this.cacheValidation(countryCode, vatNumber, result);
      }

      return result;
    } catch (error) {
      this.logger.error('VAT validation failed', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      // Return error response
      return {
        valid: false,
        countryCode: countryCodeInput || '',
        vatNumber: vatNumberInput,
        requestDate: new Date().toISOString(),
        cached: false,
        errorCode: this.extractErrorCode(error.message),
        errorMessage: error.message,
      };
    }
  }

  /**
   * Validate multiple VAT numbers
   */
  async validateBulk(
    vatNumbers: string[],
  ): Promise<BulkVatValidationResultDto> {
    const results = await Promise.all(
      vatNumbers.map((vat) =>
        this.validateVat(vat).catch((error) => ({
          valid: false,
          countryCode: '',
          vatNumber: vat,
          requestDate: new Date().toISOString(),
          cached: false,
          errorCode: ViesErrorCode.INVALID_INPUT,
          errorMessage: error.message,
        })),
      ),
    );

    const valid = results.filter((r) => r.valid).length;
    const invalid = results.filter((r) => !r.valid && !r.errorCode)
      .length;
    const errors = results.filter((r) => r.errorCode).length;

    return {
      results,
      total: results.length,
      valid,
      invalid,
      errors,
    };
  }

  /**
   * Get cross-border transaction rules
   */
  getCrossBorderRules(
    supplierCountry: string,
    customerCountry: string,
    customerVatValid: boolean,
  ): CrossBorderRulesDto {
    const isCrossBorder =
      supplierCountry.toUpperCase() !==
      customerCountry.toUpperCase();

    if (!isCrossBorder) {
      return {
        isCrossBorder: false,
        supplierCountry,
        customerCountry,
        reverseChargeApplicable: false,
        vatTreatment: 'Domestic transaction - standard VAT applies',
      };
    }

    // Cross-border B2B with valid VAT
    if (customerVatValid) {
      return {
        isCrossBorder: true,
        supplierCountry,
        customerCountry,
        reverseChargeApplicable: true,
        vatTreatment:
          'B2B intra-community supply - reverse charge applies',
        notes:
          'Supplier: 0% VAT, include "Reverse charge - Article 196 of Directive 2006/112/EC" on invoice. Customer: Self-assess VAT in their country.',
      };
    }

    // Cross-border B2C or B2B with invalid VAT
    return {
      isCrossBorder: true,
      supplierCountry,
      customerCountry,
      reverseChargeApplicable: false,
      vatTreatment:
        'Cross-border B2C or invalid VAT - supplier country VAT applies',
      notes:
        'Charge VAT according to supplier country rules. Distance selling thresholds may apply.',
    };
  }

  /**
   * Parse VAT number into country code and number
   */
  private parseVatNumber(
    vatNumber: string,
    countryCode?: string,
  ): { countryCode: string; vatNumber: string } {
    // Remove spaces, dashes, dots
    const cleaned = vatNumber.replace(/[\s\-\.]/g, '').toUpperCase();

    // If country code is provided separately
    if (countryCode) {
      return {
        countryCode: countryCode.toUpperCase(),
        vatNumber: cleaned,
      };
    }

    // Extract country code from VAT number (first 2 letters)
    if (cleaned.length >= 3 && /^[A-Z]{2}/.test(cleaned)) {
      return {
        countryCode: cleaned.substring(0, 2),
        vatNumber: cleaned.substring(2),
      };
    }

    throw new BadRequestException(
      'Invalid VAT number format. Please provide country code.',
    );
  }

  /**
   * Check if country is an EU member state
   */
  private isEuCountry(countryCode: string): boolean {
    return (EU_COUNTRIES as readonly string[]).includes(countryCode.toUpperCase());
  }

  /**
   * Validate with exponential backoff retry logic
   */
  private async validateWithRetry(
    countryCode: string,
    vatNumber: string,
    attempt = 1,
  ): Promise<VatValidationResultDto> {
    try {
      const response = await this.viesClient.checkVat(
        countryCode,
        vatNumber,
      );

      return {
        valid: response.valid,
        countryCode: response.countryCode,
        vatNumber: response.vatNumber,
        requestDate: new Date(response.requestDate).toISOString(),
        name: response.name || undefined,
        address: response.address || undefined,
        cached: false,
      };
    } catch (error) {
      const errorCode = this.extractErrorCode(error.message);

      // Don't retry on invalid input or non-EU country
      if (
        errorCode === ViesErrorCode.INVALID_INPUT ||
        errorCode === ViesErrorCode.NON_EU_COUNTRY
      ) {
        throw error;
      }

      // Retry on service errors
      if (
        attempt < this.maxRetries &&
        (errorCode === ViesErrorCode.SERVICE_UNAVAILABLE ||
          errorCode === ViesErrorCode.MS_UNAVAILABLE ||
          errorCode === ViesErrorCode.TIMEOUT ||
          errorCode === ViesErrorCode.SERVER_BUSY ||
          errorCode === ViesErrorCode.GLOBAL_MAX_CONCURRENT_REQ)
      ) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        this.logger.warn(
          `VIES validation failed (attempt ${attempt}/${this.maxRetries}), retrying in ${delay}ms...`,
        );
        await this.sleep(delay);
        return this.validateWithRetry(
          countryCode,
          vatNumber,
          attempt + 1,
        );
      }

      throw new ServiceUnavailableException(
        'VIES service is currently unavailable. Please try again later.',
      );
    }
  }

  /**
   * Get cached validation result
   */
  private async getCachedValidation(
    countryCode: string,
    vatNumber: string,
  ): Promise<VatValidationResultDto | null> {
    const cacheKey = this.getCacheKey(countryCode, vatNumber);
    const cached = await this.redisService.get<CachedVatValidation>(
      cacheKey,
    );

    if (!cached) {
      return null;
    }

    return {
      valid: cached.valid,
      countryCode: cached.countryCode,
      vatNumber: cached.vatNumber,
      requestDate: cached.requestDate,
      name: cached.name,
      address: cached.address,
      cached: true,
      cacheExpiry: cached.expiresAt,
    };
  }

  /**
   * Cache validation result
   */
  private async cacheValidation(
    countryCode: string,
    vatNumber: string,
    result: VatValidationResultDto,
  ): Promise<void> {
    const cacheKey = this.getCacheKey(countryCode, vatNumber);
    const cachedData: CachedVatValidation = {
      valid: result.valid,
      countryCode: result.countryCode,
      vatNumber: result.vatNumber,
      requestDate: result.requestDate,
      name: result.name,
      address: result.address,
      cachedAt: new Date().toISOString(),
      expiresAt: new Date(
        Date.now() + this.cacheTtl * 1000,
      ).toISOString(),
    };

    await this.redisService.set(cacheKey, cachedData, this.cacheTtl);
    this.logger.debug(`Cached validation for ${countryCode}${vatNumber}`);
  }

  /**
   * Generate cache key
   */
  private getCacheKey(countryCode: string, vatNumber: string): string {
    return `${this.cachePrefix}:${countryCode.toUpperCase()}:${vatNumber}`;
  }

  /**
   * Extract error code from error message
   */
  private extractErrorCode(message: string): string {
    const match = message.match(/^([A-Z_]+):/);
    return match && match[1] ? match[1] : ViesErrorCode.SERVICE_UNAVAILABLE;
  }

  /**
   * Sleep helper for retry logic
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clear cached validation (admin function)
   */
  async clearCache(countryCode?: string, vatNumber?: string): Promise<void> {
    if (countryCode && vatNumber) {
      const cacheKey = this.getCacheKey(countryCode, vatNumber);
      await this.redisService.del(cacheKey);
      this.logger.log(`Cleared cache for ${countryCode}${vatNumber}`);
    } else if (countryCode) {
      await this.redisService.delByPattern(
        `${this.cachePrefix}:${countryCode.toUpperCase()}:*`,
      );
      this.logger.log(`Cleared all cache for country ${countryCode}`);
    } else {
      await this.redisService.delByPattern(`${this.cachePrefix}:*`);
      this.logger.log('Cleared all VIES cache');
    }
  }
}
