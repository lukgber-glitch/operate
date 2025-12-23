import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import {
  PerDiemCalculatorInput,
  DeductionResultDto,
  CalculationBreakdown,
} from '../dto/calculators';

/**
 * Per diem rates configuration
 */
interface PerDiemRates {
  domesticFullDay: number; // Full day domestic rate
  domesticPartialDay?: number; // Partial day (< 24h) domestic rate
  internationalFullDay?: number; // Full day international rate (default)
  internationalPartialDay?: number; // Partial day international
  partialDayThreshold?: number; // Hours to qualify for full day (default: 8)
  currency: string;
  legalReference: string;
  year: number;
  // Country-specific international rates (destination -> rate)
  internationalRates?: Record<string, number>;
}

/**
 * Default per diem rates by country (2024)
 */
const DEFAULT_PER_DIEM_RATES: Record<string, PerDiemRates> = {
  DE: {
    // Germany
    domesticFullDay: 28,
    domesticPartialDay: 14,
    internationalFullDay: 28, // Default, varies by destination
    internationalPartialDay: 14,
    partialDayThreshold: 8,
    currency: 'EUR',
    legalReference: '§ 9 Abs. 4a EStG',
    year: 2024,
    internationalRates: {
      FR: 53,
      UK: 59,
      US: 67,
      JP: 70,
      SA: 46,
      IN: 35,
    },
  },
  AT: {
    // Austria
    domesticFullDay: 26.4,
    domesticPartialDay: 13.2,
    internationalFullDay: 40,
    internationalPartialDay: 20,
    partialDayThreshold: 8,
    currency: 'EUR',
    legalReference: '§ 26 Z 4 EStG',
    year: 2024,
  },
  UK: {
    // United Kingdom
    domesticFullDay: 25,
    domesticPartialDay: 10,
    internationalFullDay: 35,
    internationalPartialDay: 15,
    partialDayThreshold: 5,
    currency: 'GBP',
    legalReference: 'HMRC Scale Rate Payments',
    year: 2024,
  },
  FR: {
    // France
    domesticFullDay: 19.1,
    domesticPartialDay: 9.55,
    internationalFullDay: 25,
    internationalPartialDay: 12.5,
    partialDayThreshold: 8,
    currency: 'EUR',
    legalReference: 'Article 81 du CGI',
    year: 2024,
  },
  ES: {
    // Spain
    domesticFullDay: 26.67,
    domesticPartialDay: 13.33,
    internationalFullDay: 48.08,
    internationalPartialDay: 24.04,
    partialDayThreshold: 9,
    currency: 'EUR',
    legalReference: 'Artículo 9 LIRPF',
    year: 2024,
  },
  IT: {
    // Italy
    domesticFullDay: 25,
    domesticPartialDay: 12.5,
    internationalFullDay: 40,
    internationalPartialDay: 20,
    partialDayThreshold: 12,
    currency: 'EUR',
    legalReference: 'Articolo 51 TUIR',
    year: 2024,
  },
  NL: {
    // Netherlands
    domesticFullDay: 10.17,
    domesticPartialDay: 5.09,
    internationalFullDay: 35,
    internationalPartialDay: 17.5,
    partialDayThreshold: 6,
    currency: 'EUR',
    legalReference: 'Artikel 15a Wet LB',
    year: 2024,
  },
  SE: {
    // Sweden
    domesticFullDay: 260, // SEK
    domesticPartialDay: 130,
    internationalFullDay: 450,
    internationalPartialDay: 225,
    partialDayThreshold: 12,
    currency: 'SEK',
    legalReference: '12 kap. 12 § IL',
    year: 2024,
  },
  JP: {
    // Japan
    domesticFullDay: 2600, // JPY
    domesticPartialDay: 1300,
    internationalFullDay: 5000,
    internationalPartialDay: 2500,
    partialDayThreshold: 8,
    currency: 'JPY',
    legalReference: '所得税法施行令第96条',
    year: 2024,
  },
  SA: {
    // Saudi Arabia
    domesticFullDay: 200, // SAR
    domesticPartialDay: 100,
    internationalFullDay: 350,
    internationalPartialDay: 175,
    partialDayThreshold: 8,
    currency: 'SAR',
    legalReference: 'Income Tax Law Article 13',
    year: 2024,
  },
  IN: {
    // India
    domesticFullDay: 500, // INR
    domesticPartialDay: 250,
    internationalFullDay: 2000,
    internationalPartialDay: 1000,
    partialDayThreshold: 12,
    currency: 'INR',
    legalReference: 'Section 10(14) Income Tax Act',
    year: 2024,
  },
};

/**
 * Per Diem Calculator Service
 * Calculates meal allowance for business trips based on duration and destination
 */
@Injectable()
export class PerDiemCalculatorService {
  private readonly logger = new Logger(PerDiemCalculatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate per diem meal allowance
   */
  async calculate(input: PerDiemCalculatorInput): Promise<DeductionResultDto> {
    const { countryCode, startDate, endDate, destination, isInternational, taxRate } =
      input;
    const taxYear = input.taxYear || new Date().getFullYear();

    this.logger.log(
      `Calculating per diem: ${countryCode}, ${startDate} to ${endDate}`,
    );

    const rates = await this.getCountryRates(countryCode, taxYear);

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      throw new Error('End date must be after start date');
    }

    // Calculate duration in hours
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    const durationDays = Math.floor(durationHours / 24);

    const breakdown: CalculationBreakdown[] = [];

    breakdown.push({
      step: 'Trip duration',
      value: durationHours,
      unit: 'hours',
      note: `${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
    });

    // Determine if international and get rates
    const isIntl = isInternational ?? (destination && destination !== countryCode);
    let dailyRate: number;
    let partialRate: number;

    if (isIntl) {
      // International trip
      if (destination && rates.internationalRates?.[destination]) {
        dailyRate = rates.internationalRates[destination];
        partialRate = dailyRate / 2; // Typically half
      } else {
        dailyRate = rates.internationalFullDay || rates.domesticFullDay;
        partialRate = rates.internationalPartialDay || rates.domesticPartialDay || dailyRate / 2;
      }
      breakdown.push({
        step: 'Trip type',
        value: 0,
        note: `International trip${destination ? ` to ${destination}` : ''}`,
      });
    } else {
      // Domestic trip
      dailyRate = rates.domesticFullDay;
      partialRate = rates.domesticPartialDay || dailyRate / 2;
      breakdown.push({
        step: 'Trip type',
        value: 0,
        note: 'Domestic trip',
      });
    }

    breakdown.push({
      step: 'Daily rate',
      value: dailyRate,
      unit: rates.currency,
      note: `Full day rate${isIntl ? ' (international)' : ' (domestic)'}`,
    });

    // Calculate days
    let totalDeduction = 0;
    const threshold = rates.partialDayThreshold || 8;

    if (durationDays === 0) {
      // Single partial day
      if (durationHours >= threshold) {
        totalDeduction = dailyRate;
        breakdown.push({
          step: `Single day (${durationHours.toFixed(1)}h ≥ ${threshold}h threshold)`,
          value: dailyRate,
          unit: rates.currency,
          note: 'Qualifies for full day rate',
        });
      } else {
        totalDeduction = partialRate;
        breakdown.push({
          step: `Partial day (${durationHours.toFixed(1)}h < ${threshold}h threshold)`,
          value: partialRate,
          unit: rates.currency,
          note: 'Partial day rate applied',
        });
      }
    } else {
      // Multiple days
      const fullDaysAmount = durationDays * dailyRate;
      breakdown.push({
        step: `Full days (${durationDays} days)`,
        value: fullDaysAmount,
        unit: rates.currency,
        note: `${durationDays} × ${dailyRate} ${rates.currency}`,
      });

      totalDeduction = fullDaysAmount;

      // Check remaining hours
      const remainingHours = durationHours - durationDays * 24;
      if (remainingHours >= threshold) {
        totalDeduction += dailyRate;
        breakdown.push({
          step: `Final day (${remainingHours.toFixed(1)}h ≥ ${threshold}h)`,
          value: dailyRate,
          unit: rates.currency,
          note: 'Qualifies for full day rate',
        });
      } else if (remainingHours > 0) {
        totalDeduction += partialRate;
        breakdown.push({
          step: `Final partial day (${remainingHours.toFixed(1)}h)`,
          value: partialRate,
          unit: rates.currency,
          note: 'Partial day rate applied',
        });
      }
    }

    breakdown.push({
      step: 'Total per diem allowance',
      value: totalDeduction,
      unit: rates.currency,
    });

    const effectiveTaxRate = taxRate || 40;
    const taxSavings = totalDeduction * (effectiveTaxRate / 100);

    const requirements: string[] = [
      'Trip must be for business purposes',
      'Keep documentation of travel dates and purpose',
      'Maintain receipts for accommodation if applicable',
      'Per diem is for meals and incidental expenses only',
    ];

    const warnings: string[] = [];
    if (isIntl) {
      warnings.push('International rates may vary by destination country');
      warnings.push('Some countries require proof of foreign currency exchange');
    }
    warnings.push(`Partial day threshold: ${threshold} hours for full day rate`);
    warnings.push('Employer reimbursements may reduce deductible amount');
    if (durationDays > 30) {
      warnings.push('Long-term assignments may have different rules');
    }

    return {
      originalAmount: totalDeduction,
      deductibleAmount: totalDeduction,
      deductiblePercentage: 100,
      currency: rates.currency,
      taxSavingsEstimate: taxSavings,
      taxRate: effectiveTaxRate,
      breakdown,
      legalReference: rates.legalReference,
      requirements,
      warnings,
      metadata: {
        startDate,
        endDate,
        durationHours,
        durationDays,
        isInternational: isIntl,
        destination,
        taxYear,
        dailyRate,
        partialRate,
      },
    };
  }

  /**
   * Get daily rates for a destination
   */
  async getDailyRates(
    countryCode: string,
    destination?: string,
  ): Promise<{ domestic: number; international?: number; currency: string }> {
    const rates = await this.getCountryRates(countryCode, new Date().getFullYear());

    return {
      domestic: rates.domesticFullDay,
      international: destination && rates.internationalRates?.[destination]
        ? rates.internationalRates[destination]
        : rates.internationalFullDay,
      currency: rates.currency,
    };
  }

  /**
   * Get country-specific per diem rates
   */
  async getCountryRates(
    countryCode: string,
    taxYear: number,
  ): Promise<PerDiemRates> {
    try {
      const config = await this.prisma.countryTaxConfig.findUnique({
        where: { countryId: countryCode },
      });

      if (config) {
        this.logger.debug(
          `Country config found for ${countryCode}, using defaults`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Could not load country config for ${countryCode}: ${error.message}`,
      );
    }

    const rates = DEFAULT_PER_DIEM_RATES[countryCode];
    if (!rates) {
      this.logger.warn(
        `No per diem rates for ${countryCode}, using Germany as fallback`,
      );
      return DEFAULT_PER_DIEM_RATES.DE;
    }

    return rates;
  }
}
