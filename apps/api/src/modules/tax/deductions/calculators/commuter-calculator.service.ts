import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import {
  CommuterCalculatorInput,
  DeductionResultDto,
  CalculationBreakdown,
} from '../dto/calculators';

/**
 * Commuter rates configuration
 */
interface CommuterRates {
  baseRatePerKm: number; // Rate per km for distance up to threshold
  increasedRatePerKm?: number; // Rate per km for distance above threshold
  distanceThreshold?: number; // Distance where rate increases (km)
  publicTransportBonus?: number; // Additional amount if using public transport
  annualMaximum?: number; // Maximum deduction per year
  currency: string;
  legalReference: string;
  year: number;
}

/**
 * Commuter rates by country and year
 * Updated annually with official rates from tax authorities
 */
const COMMUTER_RATES_BY_YEAR: Record<number, Record<string, CommuterRates>> = {
  2025: {
    DE: {
      // Germany - Pendlerpauschale 2025
      baseRatePerKm: 0.30,
      increasedRatePerKm: 0.38, // For distances > 21km
      distanceThreshold: 21, // Updated from 20km to 21km for 2025
      publicTransportBonus: 0,
      annualMaximum: 4500,
      currency: 'EUR',
      legalReference: '§ 9 Abs. 1 Satz 3 Nr. 4 EStG',
      year: 2025,
    },
    AT: {
      // Austria - Verkehrsabsetzbetrag + Pendlerpauschale
      baseRatePerKm: 0.42,
      publicTransportBonus: 0,
      annualMaximum: undefined,
      currency: 'EUR',
      legalReference: '§ 16 Abs. 1 Z 6 EStG',
      year: 2025,
    },
    UK: {
      // United Kingdom 2025/26
      baseRatePerKm: 0.45,
      currency: 'GBP',
      legalReference: 'HMRC Approved Mileage Allowance Payments 2025/26',
      year: 2025,
    },
    FR: {
      // France 2025
      baseRatePerKm: 0.27,
      currency: 'EUR',
      legalReference: 'Article 81 du CGI - Barème 2025',
      year: 2025,
    },
    ES: {
      // Spain
      baseRatePerKm: 0.19,
      currency: 'EUR',
      legalReference: 'Artículo 19 LIRPF',
      year: 2025,
    },
    IT: {
      // Italy 2025
      baseRatePerKm: 0.22,
      currency: 'EUR',
      legalReference: 'Articolo 51 TUIR',
      year: 2025,
    },
    NL: {
      // Netherlands 2025 - Tax-free commuter allowance raised
      baseRatePerKm: 0.23,
      currency: 'EUR',
      legalReference: 'Artikel 31a lid 2 Wet LB 2025',
      year: 2025,
    },
    SE: {
      // Sweden 2025
      baseRatePerKm: 2.50, // SEK
      currency: 'SEK',
      legalReference: '12 kap. 27 § IL',
      year: 2025,
    },
    JP: {
      // Japan 2025
      baseRatePerKm: 17, // JPY
      currency: 'JPY',
      legalReference: '所得税法施行令第96条',
      year: 2025,
    },
    SA: {
      // Saudi Arabia
      baseRatePerKm: 0.5, // SAR
      currency: 'SAR',
      legalReference: 'Income Tax Law Article 13',
      year: 2025,
    },
    IN: {
      // India 2025
      baseRatePerKm: 12, // INR
      currency: 'INR',
      legalReference: 'Section 10(14) Income Tax Act',
      year: 2025,
    },
  },
  2024: {
    DE: {
      baseRatePerKm: 0.30,
      increasedRatePerKm: 0.38,
      distanceThreshold: 20,
      publicTransportBonus: 0,
      annualMaximum: 4500,
      currency: 'EUR',
      legalReference: '§ 9 Abs. 1 Satz 3 Nr. 4 EStG',
      year: 2024,
    },
    AT: {
      baseRatePerKm: 0.38,
      publicTransportBonus: 0,
      annualMaximum: undefined,
      currency: 'EUR',
      legalReference: '§ 16 Abs. 1 Z 6 EStG',
      year: 2024,
    },
    UK: {
      baseRatePerKm: 0.45,
      currency: 'GBP',
      legalReference: 'HMRC Approved Mileage Allowance Payments',
      year: 2024,
    },
    FR: {
      baseRatePerKm: 0.25,
      currency: 'EUR',
      legalReference: 'Article 81 du CGI',
      year: 2024,
    },
    ES: {
      baseRatePerKm: 0.19,
      currency: 'EUR',
      legalReference: 'Artículo 19 LIRPF',
      year: 2024,
    },
    IT: {
      baseRatePerKm: 0.2,
      currency: 'EUR',
      legalReference: 'Articolo 51 TUIR',
      year: 2024,
    },
    NL: {
      baseRatePerKm: 0.21,
      currency: 'EUR',
      legalReference: 'Artikel 15a Wet LB',
      year: 2024,
    },
    SE: {
      baseRatePerKm: 1.9,
      currency: 'SEK',
      legalReference: '12 kap. 27 § IL',
      year: 2024,
    },
    JP: {
      baseRatePerKm: 15,
      currency: 'JPY',
      legalReference: '所得税法施行令第96条',
      year: 2024,
    },
    SA: {
      baseRatePerKm: 0.5,
      currency: 'SAR',
      legalReference: 'Income Tax Law Article 13',
      year: 2024,
    },
    IN: {
      baseRatePerKm: 10,
      currency: 'INR',
      legalReference: 'Section 10(14) Income Tax Act',
      year: 2024,
    },
  },
};

// Default to 2025 rates
const DEFAULT_COMMUTER_RATES = COMMUTER_RATES_BY_YEAR[2025];

/**
 * Commuter Calculator Service
 * Calculates tax-deductible commuter allowance based on distance and working days
 */
@Injectable()
export class CommuterCalculatorService {
  private readonly logger = new Logger(CommuterCalculatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate commuter allowance deduction
   */
  async calculate(input: CommuterCalculatorInput): Promise<DeductionResultDto> {
    const { countryCode, distanceKm, workingDays, usePublicTransport, taxRate } =
      input;
    const taxYear = input.taxYear || new Date().getFullYear();

    this.logger.log(
      `Calculating commuter allowance: ${countryCode}, ${distanceKm}km, ${workingDays} days`,
    );

    // Get country-specific rates
    const rates = await this.getCountryRates(countryCode, taxYear);

    // Calculate breakdown
    const breakdown: CalculationBreakdown[] = [];
    let totalDeduction = 0;

    // Step 1: Calculate daily deduction
    let dailyDeduction = 0;

    if (rates.distanceThreshold && rates.increasedRatePerKm) {
      // Two-tier rate system (e.g., Germany)
      const baseDistance = Math.min(distanceKm, rates.distanceThreshold);
      const extraDistance = Math.max(0, distanceKm - rates.distanceThreshold);

      const baseAmount = baseDistance * rates.baseRatePerKm;
      const extraAmount = extraDistance * rates.increasedRatePerKm;

      dailyDeduction = baseAmount + extraAmount;

      breakdown.push({
        step: `Base rate (first ${rates.distanceThreshold}km)`,
        value: baseAmount,
        unit: rates.currency,
        note: `${baseDistance.toFixed(1)}km × ${rates.baseRatePerKm} ${rates.currency}/km`,
      });

      if (extraDistance > 0) {
        breakdown.push({
          step: `Increased rate (above ${rates.distanceThreshold}km)`,
          value: extraAmount,
          unit: rates.currency,
          note: `${extraDistance.toFixed(1)}km × ${rates.increasedRatePerKm} ${rates.currency}/km`,
        });
      }
    } else {
      // Single rate system
      dailyDeduction = distanceKm * rates.baseRatePerKm;

      breakdown.push({
        step: 'Daily deduction',
        value: dailyDeduction,
        unit: rates.currency,
        note: `${distanceKm}km × ${rates.baseRatePerKm} ${rates.currency}/km`,
      });
    }

    // Step 2: Public transport bonus
    if (usePublicTransport && rates.publicTransportBonus) {
      dailyDeduction += rates.publicTransportBonus;
      breakdown.push({
        step: 'Public transport bonus',
        value: rates.publicTransportBonus,
        unit: rates.currency,
      });
    }

    // Step 3: Annual calculation
    const annualDeduction = dailyDeduction * workingDays;
    breakdown.push({
      step: 'Annual deduction',
      value: annualDeduction,
      unit: rates.currency,
      note: `${dailyDeduction.toFixed(2)} ${rates.currency} × ${workingDays} days`,
    });

    // Step 4: Apply annual maximum if exists
    if (rates.annualMaximum && annualDeduction > rates.annualMaximum) {
      totalDeduction = rates.annualMaximum;
      breakdown.push({
        step: 'Annual maximum cap applied',
        value: rates.annualMaximum,
        unit: rates.currency,
        note: `Reduced from ${annualDeduction.toFixed(2)} ${rates.currency}`,
      });
    } else {
      totalDeduction = annualDeduction;
    }

    // Calculate tax savings
    const effectiveTaxRate = taxRate || 40; // Default 40% if not provided
    const taxSavings = totalDeduction * (effectiveTaxRate / 100);

    // Build requirements and warnings
    const requirements: string[] = [
      'Keep records of your home and workplace addresses',
      'Document the number of days worked (not including holidays/sick leave)',
      'One-way distance must be measured via the shortest route',
    ];

    const warnings: string[] = [];
    if (rates.annualMaximum) {
      warnings.push(
        `Annual maximum deduction: ${rates.annualMaximum} ${rates.currency}`,
      );
    }
    if (usePublicTransport) {
      warnings.push('Public transport tickets may be deductible separately');
    }
    if (distanceKm < 1) {
      warnings.push('Commuter allowance typically requires minimum distance (e.g., 1km)');
    }

    return {
      originalAmount: annualDeduction,
      deductibleAmount: totalDeduction,
      deductiblePercentage:
        annualDeduction > 0 ? (totalDeduction / annualDeduction) * 100 : 100,
      currency: rates.currency,
      taxSavingsEstimate: taxSavings,
      taxRate: effectiveTaxRate,
      breakdown,
      legalReference: rates.legalReference,
      requirements,
      warnings,
      metadata: {
        distanceKm,
        workingDays,
        usePublicTransport,
        taxYear,
        dailyDeduction,
      },
    };
  }

  // Cache for country rates (refreshed every hour)
  private ratesCache: Map<string, { rates: CommuterRates; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Get country-specific commuter rates for a given tax year
   * Uses cached rates when available
   */
  async getCountryRates(
    countryCode: string,
    taxYear: number,
  ): Promise<CommuterRates> {
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

      if (config && config.commuterRates) {
        const dbRates = config.commuterRates as unknown as CommuterRates;
        this.ratesCache.set(cacheKey, { rates: dbRates, timestamp: now });
        return dbRates;
      }
    } catch (error) {
      this.logger.warn(
        `Could not load country config for ${countryCode}: ${error.message}`,
      );
    }

    // Use year-specific rates or fall back to 2025
    const yearRates = COMMUTER_RATES_BY_YEAR[taxYear] || COMMUTER_RATES_BY_YEAR[2025];
    const rates = yearRates[countryCode];

    if (!rates) {
      this.logger.warn(
        `No commuter rates for ${countryCode} in ${taxYear}, using Germany as fallback`,
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
    this.logger.log('Commuter rates cache cleared');
  }

  /**
   * Get available years with configured rates
   */
  getAvailableYears(): number[] {
    return Object.keys(COMMUTER_RATES_BY_YEAR).map(Number).sort((a, b) => b - a);
  }

  /**
   * Get all countries with configured rates for a given year
   */
  getAvailableCountries(taxYear: number = 2025): string[] {
    const yearRates = COMMUTER_RATES_BY_YEAR[taxYear] || COMMUTER_RATES_BY_YEAR[2025];
    return Object.keys(yearRates);
  }
}
