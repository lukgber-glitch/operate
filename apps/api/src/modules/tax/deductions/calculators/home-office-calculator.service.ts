import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import {
  HomeOfficeFlatCalculatorInput,
  HomeOfficeRoomCalculatorInput,
  DeductionResultDto,
  CalculationBreakdown,
} from '../dto/calculators';

/**
 * Home office rates configuration
 */
interface HomeOfficeRates {
  flatDailyRate?: number; // Flat rate per day
  flatAnnualMaxDays?: number; // Maximum days for flat rate
  flatAnnualMaxAmount?: number; // Maximum amount for flat rate
  roomDeductionPercentage?: number; // Percentage of room costs deductible
  roomAnnualMaximum?: number; // Maximum room-based deduction
  currency: string;
  legalReference: string;
  year: number;
}

/**
 * Home office rates by country and year
 * Updated annually with official rates from tax authorities
 */
const HOME_OFFICE_RATES_BY_YEAR: Record<number, Record<string, HomeOfficeRates>> = {
  2025: {
    DE: {
      // Germany - Home office deduction (Homeoffice-Pauschale) unchanged for 2025
      flatDailyRate: 6,
      flatAnnualMaxDays: 210,
      flatAnnualMaxAmount: 1260, // 6 EUR × 210 days
      roomDeductionPercentage: 100,
      roomAnnualMaximum: undefined, // No cap for dedicated room
      currency: 'EUR',
      legalReference: '§ 4 Abs. 5 Satz 1 Nr. 6b EStG',
      year: 2025,
    },
    AT: {
      // Austria - updated 2025
      flatDailyRate: 3,
      flatAnnualMaxDays: 100,
      flatAnnualMaxAmount: 1200,
      roomDeductionPercentage: 100,
      currency: 'EUR',
      legalReference: '§ 16 Abs. 1 Z 7a EStG',
      year: 2025,
    },
    UK: {
      // United Kingdom - updated 2025/26
      flatDailyRate: 6, // £6/week simplified expense
      flatAnnualMaxAmount: 312, // £6 × 52 weeks
      roomDeductionPercentage: 100,
      currency: 'GBP',
      legalReference: 'ITEPA 2003 Section 336',
      year: 2025,
    },
    FR: {
      // France - updated 2025
      flatDailyRate: 2.7,
      flatAnnualMaxDays: 230,
      flatAnnualMaxAmount: 620,
      roomDeductionPercentage: 100,
      currency: 'EUR',
      legalReference: 'Article 83 du CGI - Barème forfaitaire 2025',
      year: 2025,
    },
    ES: {
      // Spain - unchanged
      flatDailyRate: 2,
      roomDeductionPercentage: 30,
      currency: 'EUR',
      legalReference: 'Artículo 7 LIRPF',
      year: 2025,
    },
    IT: {
      // Italy
      flatDailyRate: 0,
      roomDeductionPercentage: 50,
      currency: 'EUR',
      legalReference: 'Articolo 10 TUIR',
      year: 2025,
    },
    NL: {
      // Netherlands - updated 2025
      flatDailyRate: 2.35,
      flatAnnualMaxDays: 214,
      roomDeductionPercentage: 100,
      currency: 'EUR',
      legalReference: 'Artikel 31a lid 2 Wet LB 2025',
      year: 2025,
    },
    SE: {
      // Sweden
      flatDailyRate: 0,
      roomDeductionPercentage: 50,
      currency: 'SEK',
      legalReference: '9 kap. 2 § IL',
      year: 2025,
    },
    JP: {
      // Japan
      flatDailyRate: 0,
      roomDeductionPercentage: 50,
      currency: 'JPY',
      legalReference: '所得税法第37条',
      year: 2025,
    },
    SA: {
      // Saudi Arabia
      flatDailyRate: 0,
      roomDeductionPercentage: 0,
      currency: 'SAR',
      legalReference: 'Income Tax Law',
      year: 2025,
    },
    IN: {
      // India
      flatDailyRate: 55, // INR - adjusted for inflation
      roomDeductionPercentage: 0,
      currency: 'INR',
      legalReference: 'Section 37 Income Tax Act',
      year: 2025,
    },
  },
  2024: {
    DE: {
      flatDailyRate: 6,
      flatAnnualMaxDays: 210,
      flatAnnualMaxAmount: 1260,
      roomDeductionPercentage: 100,
      roomAnnualMaximum: undefined,
      currency: 'EUR',
      legalReference: '§ 4 Abs. 5 Satz 1 Nr. 6b EStG',
      year: 2024,
    },
    AT: {
      flatDailyRate: 3,
      flatAnnualMaxAmount: 1200,
      roomDeductionPercentage: 100,
      currency: 'EUR',
      legalReference: '§ 20 Abs. 1 Z 2 lit. a EStG',
      year: 2024,
    },
    UK: {
      flatDailyRate: 6,
      flatAnnualMaxAmount: undefined,
      roomDeductionPercentage: 100,
      currency: 'GBP',
      legalReference: 'ITEPA 2003 Section 336',
      year: 2024,
    },
    FR: {
      flatDailyRate: 2.5,
      flatAnnualMaxAmount: 580,
      roomDeductionPercentage: 100,
      currency: 'EUR',
      legalReference: 'Article 83 du CGI',
      year: 2024,
    },
    ES: {
      flatDailyRate: 2,
      roomDeductionPercentage: 30,
      currency: 'EUR',
      legalReference: 'Artículo 7 LIRPF',
      year: 2024,
    },
    IT: {
      flatDailyRate: 0,
      roomDeductionPercentage: 50,
      currency: 'EUR',
      legalReference: 'Articolo 10 TUIR',
      year: 2024,
    },
    NL: {
      flatDailyRate: 2,
      roomDeductionPercentage: 100,
      currency: 'EUR',
      legalReference: 'Artikel 3.16 Wet IB',
      year: 2024,
    },
    SE: {
      flatDailyRate: 0,
      roomDeductionPercentage: 50,
      currency: 'SEK',
      legalReference: '9 kap. 2 § IL',
      year: 2024,
    },
    JP: {
      flatDailyRate: 0,
      roomDeductionPercentage: 50,
      currency: 'JPY',
      legalReference: '所得税法第37条',
      year: 2024,
    },
    SA: {
      flatDailyRate: 0,
      roomDeductionPercentage: 0,
      currency: 'SAR',
      legalReference: 'Income Tax Law',
      year: 2024,
    },
    IN: {
      flatDailyRate: 50,
      roomDeductionPercentage: 0,
      currency: 'INR',
      legalReference: 'Section 37 Income Tax Act',
      year: 2024,
    },
  },
};

// Default to 2025 rates
const DEFAULT_HOME_OFFICE_RATES = HOME_OFFICE_RATES_BY_YEAR[2025];

/**
 * Home Office Calculator Service
 * Calculates tax-deductible home office expenses using flat rate or room-based method
 */
@Injectable()
export class HomeOfficeCalculatorService {
  private readonly logger = new Logger(HomeOfficeCalculatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate flat rate home office deduction
   */
  async calculateFlat(
    input: HomeOfficeFlatCalculatorInput,
  ): Promise<DeductionResultDto> {
    const { countryCode, daysWorked, taxRate } = input;
    const taxYear = input.taxYear || new Date().getFullYear();

    this.logger.log(
      `Calculating flat home office: ${countryCode}, ${daysWorked} days`,
    );

    const rates = await this.getCountryRates(countryCode, taxYear);

    if (!rates.flatDailyRate || rates.flatDailyRate === 0) {
      throw new Error(
        `Flat rate home office deduction not available for ${countryCode}`,
      );
    }

    const breakdown: CalculationBreakdown[] = [];

    // Step 1: Calculate based on days
    const totalBeforeCap = daysWorked * rates.flatDailyRate;
    breakdown.push({
      step: 'Daily rate calculation',
      value: totalBeforeCap,
      unit: rates.currency,
      note: `${daysWorked} days × ${rates.flatDailyRate} ${rates.currency}/day`,
    });

    // Step 2: Apply maximum days limit
    let deductibleAmount = totalBeforeCap;
    if (rates.flatAnnualMaxDays && daysWorked > rates.flatAnnualMaxDays) {
      const cappedByDays = rates.flatAnnualMaxDays * rates.flatDailyRate;
      breakdown.push({
        step: `Maximum ${rates.flatAnnualMaxDays} days applied`,
        value: cappedByDays,
        unit: rates.currency,
        note: `Reduced from ${daysWorked} days`,
      });
      deductibleAmount = cappedByDays;
    }

    // Step 3: Apply maximum amount limit
    if (rates.flatAnnualMaxAmount && deductibleAmount > rates.flatAnnualMaxAmount) {
      breakdown.push({
        step: 'Annual maximum cap',
        value: rates.flatAnnualMaxAmount,
        unit: rates.currency,
        note: `Reduced from ${deductibleAmount.toFixed(2)} ${rates.currency}`,
      });
      deductibleAmount = rates.flatAnnualMaxAmount;
    }

    const effectiveTaxRate = taxRate || 40;
    const taxSavings = deductibleAmount * (effectiveTaxRate / 100);

    const requirements: string[] = [
      'Home office must be used primarily for work',
      'Keep calendar or log of home office days',
      'Employer should not reimburse home office costs',
    ];

    const warnings: string[] = [];
    if (rates.flatAnnualMaxDays) {
      warnings.push(
        `Maximum ${rates.flatAnnualMaxDays} days per year can be claimed`,
      );
    }
    if (rates.flatAnnualMaxAmount) {
      warnings.push(
        `Annual maximum: ${rates.flatAnnualMaxAmount} ${rates.currency}`,
      );
    }
    warnings.push(
      'Flat rate method cannot be combined with actual expense method',
    );

    return {
      originalAmount: totalBeforeCap,
      deductibleAmount,
      deductiblePercentage:
        totalBeforeCap > 0 ? (deductibleAmount / totalBeforeCap) * 100 : 100,
      currency: rates.currency,
      taxSavingsEstimate: taxSavings,
      taxRate: effectiveTaxRate,
      breakdown,
      legalReference: rates.legalReference,
      requirements,
      warnings,
      metadata: {
        daysWorked,
        taxYear,
        method: 'flat',
      },
    };
  }

  /**
   * Calculate room-based home office deduction
   */
  async calculateRoom(
    input: HomeOfficeRoomCalculatorInput,
  ): Promise<DeductionResultDto> {
    const { countryCode, roomSqm, totalSqm, monthlyRent, months, taxRate } = input;
    const taxYear = input.taxYear || new Date().getFullYear();

    this.logger.log(
      `Calculating room-based home office: ${countryCode}, ${roomSqm}/${totalSqm}sqm`,
    );

    const rates = await this.getCountryRates(countryCode, taxYear);

    if (!rates.roomDeductionPercentage || rates.roomDeductionPercentage === 0) {
      throw new Error(
        `Room-based home office deduction not available for ${countryCode}`,
      );
    }

    const breakdown: CalculationBreakdown[] = [];

    // Step 1: Calculate room proportion
    const roomProportion = roomSqm / totalSqm;
    breakdown.push({
      step: 'Room proportion',
      value: roomProportion * 100,
      unit: '%',
      note: `${roomSqm}sqm ÷ ${totalSqm}sqm`,
    });

    // Step 2: Calculate annual costs
    const annualRent = monthlyRent * months;
    breakdown.push({
      step: 'Annual housing costs',
      value: annualRent,
      unit: rates.currency,
      note: `${monthlyRent} ${rates.currency}/month × ${months} months`,
    });

    // Step 3: Calculate proportional costs
    const proportionalCosts = annualRent * roomProportion;
    breakdown.push({
      step: 'Proportional room costs',
      value: proportionalCosts,
      unit: rates.currency,
      note: `${annualRent.toFixed(2)} ${rates.currency} × ${(roomProportion * 100).toFixed(1)}%`,
    });

    // Step 4: Apply deduction percentage
    let deductibleAmount =
      proportionalCosts * (rates.roomDeductionPercentage / 100);
    breakdown.push({
      step: `${rates.roomDeductionPercentage}% deductible`,
      value: deductibleAmount,
      unit: rates.currency,
      note:
        rates.roomDeductionPercentage === 100
          ? 'Full amount deductible'
          : `${rates.roomDeductionPercentage}% of proportional costs`,
    });

    // Step 5: Apply annual maximum if exists
    if (rates.roomAnnualMaximum && deductibleAmount > rates.roomAnnualMaximum) {
      breakdown.push({
        step: 'Annual maximum cap',
        value: rates.roomAnnualMaximum,
        unit: rates.currency,
        note: `Reduced from ${deductibleAmount.toFixed(2)} ${rates.currency}`,
      });
      deductibleAmount = rates.roomAnnualMaximum;
    }

    const effectiveTaxRate = taxRate || 40;
    const taxSavings = deductibleAmount * (effectiveTaxRate / 100);

    const requirements: string[] = [
      'Home office must be a separate, dedicated room',
      'Room must be used exclusively or primarily for work',
      'Keep rental agreement or ownership documents',
      'Document room size and total living space',
      'Keep utility bills and maintenance receipts',
    ];

    const warnings: string[] = [];
    if (rates.roomAnnualMaximum) {
      warnings.push(
        `Annual maximum: ${rates.roomAnnualMaximum} ${rates.currency}`,
      );
    }
    if (rates.roomDeductionPercentage < 100) {
      warnings.push(
        `Only ${rates.roomDeductionPercentage}% of costs are deductible in ${countryCode}`,
      );
    }
    if (roomProportion > 0.5) {
      warnings.push(
        'Home office exceeds 50% of total space - may require additional documentation',
      );
    }
    warnings.push('Room method cannot be combined with flat rate method');

    return {
      originalAmount: proportionalCosts,
      deductibleAmount,
      deductiblePercentage: rates.roomDeductionPercentage,
      currency: rates.currency,
      taxSavingsEstimate: taxSavings,
      taxRate: effectiveTaxRate,
      breakdown,
      legalReference: rates.legalReference,
      requirements,
      warnings,
      metadata: {
        roomSqm,
        totalSqm,
        roomProportion,
        monthlyRent,
        months,
        taxYear,
        method: 'room',
      },
    };
  }

  // Cache for country rates (refreshed every hour)
  private ratesCache: Map<string, { rates: HomeOfficeRates; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Get country-specific home office rates for a given tax year
   * Uses cached rates when available
   */
  async getCountryRates(
    countryCode: string,
    taxYear: number,
  ): Promise<HomeOfficeRates> {
    const cacheKey = `${countryCode}-${taxYear}`;
    const now = Date.now();

    // Check cache first
    const cached = this.ratesCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < this.CACHE_TTL_MS) {
      return cached.rates;
    }

    // Try to load from database
    try {
      const config = await this.prisma.countryTaxConfig.findUnique({
        where: { countryId: countryCode },
      });

      if (config && config.homeOfficeRates) {
        const dbRates = config.homeOfficeRates as unknown as HomeOfficeRates;
        this.ratesCache.set(cacheKey, { rates: dbRates, timestamp: now });
        return dbRates;
      }
    } catch (error) {
      this.logger.warn(
        `Could not load country config for ${countryCode}: ${error.message}`,
      );
    }

    // Use year-specific rates or fall back to 2025
    const yearRates = HOME_OFFICE_RATES_BY_YEAR[taxYear] || HOME_OFFICE_RATES_BY_YEAR[2025];
    const rates = yearRates[countryCode];

    if (!rates) {
      this.logger.warn(
        `No home office rates for ${countryCode} in ${taxYear}, using Germany as fallback`,
      );
      const fallbackRates = yearRates.DE;
      this.ratesCache.set(cacheKey, { rates: fallbackRates, timestamp: now });
      return fallbackRates;
    }

    this.ratesCache.set(cacheKey, { rates, timestamp: now });
    return rates;
  }

  /**
   * Clear the rates cache (useful for testing or when rates are updated)
   */
  clearCache(): void {
    this.ratesCache.clear();
    this.logger.log('Home office rates cache cleared');
  }

  /**
   * Get available years with configured rates
   */
  getAvailableYears(): number[] {
    return Object.keys(HOME_OFFICE_RATES_BY_YEAR).map(Number).sort((a, b) => b - a);
  }

  /**
   * Get all countries with configured rates for a given year
   */
  getAvailableCountries(taxYear: number = 2025): string[] {
    const yearRates = HOME_OFFICE_RATES_BY_YEAR[taxYear] || HOME_OFFICE_RATES_BY_YEAR[2025];
    return Object.keys(yearRates);
  }
}
