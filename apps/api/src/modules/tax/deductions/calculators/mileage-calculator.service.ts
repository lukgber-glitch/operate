import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import {
  MileageCalculatorInput,
  DeductionResultDto,
  CalculationBreakdown,
  VehicleType,
} from '../dto/calculators';

/**
 * Mileage rates by vehicle type
 */
interface MileageRates {
  car: number;
  motorcycle?: number;
  bicycle?: number;
  electricCar?: number;
  electricMotorcycle?: number;
  currency: string;
  legalReference: string;
  year: number;
  // Tiered rates (distance thresholds)
  carTiers?: Array<{ threshold: number; rate: number }>;
  notes?: string;
}

/**
 * Mileage rates by country and year
 * Updated annually with official rates from tax authorities
 */
const MILEAGE_RATES_BY_YEAR: Record<number, Record<string, MileageRates>> = {
  2025: {
    DE: {
      // Germany - unchanged for 2025
      car: 0.30,
      electricCar: 0.30,
      motorcycle: 0.20,
      bicycle: 0,
      currency: 'EUR',
      legalReference: '§ 9 Abs. 1 Satz 3 Nr. 4a EStG',
      year: 2025,
      notes: 'Increased rate of EUR 0.38/km applies for distances above 21km for commuter allowance (Pendlerpauschale)',
    },
    AT: {
      // Austria - updated for 2025
      car: 0.42,
      electricCar: 0.42,
      motorcycle: 0.24,
      bicycle: 0.38,
      currency: 'EUR',
      legalReference: '§ 26 Z 4 EStG',
      year: 2025,
    },
    UK: {
      // United Kingdom - unchanged for 2025/26
      car: 0.45,
      electricCar: 0.45,
      motorcycle: 0.24,
      bicycle: 0.20,
      currency: 'GBP',
      legalReference: 'HMRC Approved Mileage Allowance Payments 2025/26',
      year: 2025,
      carTiers: [
        { threshold: 10000, rate: 0.45 },
        { threshold: Infinity, rate: 0.25 },
      ],
      notes: 'Rates are per mile. For business journeys, 10,000 miles at 45p, then 25p per mile thereafter',
    },
    FR: {
      // France - updated barème 2025
      car: 0.37,
      electricCar: 0.40, // 20% electric vehicle bonus
      motorcycle: 0.16,
      bicycle: 0.25,
      currency: 'EUR',
      legalReference: 'Article 83 du CGI - Barème kilométrique 2025',
      year: 2025,
    },
    ES: {
      // Spain
      car: 0.19,
      electricCar: 0.22,
      motorcycle: 0.11,
      bicycle: 0,
      currency: 'EUR',
      legalReference: 'Artículo 9 LIRPF',
      year: 2025,
    },
    IT: {
      // Italy - ACI rates 2025
      car: 0.22,
      electricCar: 0.26,
      motorcycle: 0.13,
      bicycle: 0,
      currency: 'EUR',
      legalReference: 'Tabelle ACI 2025',
      year: 2025,
    },
    NL: {
      // Netherlands - updated 2025
      car: 0.23,
      electricCar: 0.23,
      motorcycle: 0.14,
      bicycle: 0.21,
      currency: 'EUR',
      legalReference: 'Artikel 31a lid 2 Wet LB 2025',
      year: 2025,
      notes: 'Tax-free kilometric allowance raised to EUR 0.23 per km',
    },
    SE: {
      // Sweden - updated 2025
      car: 2.50, // SEK per km
      electricCar: 2.50,
      motorcycle: 1.00,
      bicycle: 0,
      currency: 'SEK',
      legalReference: '12 kap. 27 § IL',
      year: 2025,
    },
    JP: {
      // Japan
      car: 21, // JPY per km
      electricCar: 24,
      motorcycle: 11,
      bicycle: 0,
      currency: 'JPY',
      legalReference: '所得税法施行令第96条',
      year: 2025,
    },
    SA: {
      // Saudi Arabia
      car: 1.2, // SAR per km
      electricCar: 1.4,
      motorcycle: 0.6,
      bicycle: 0,
      currency: 'SAR',
      legalReference: 'Income Tax Law Article 11',
      year: 2025,
    },
    IN: {
      // India - updated 2025
      car: 12, // INR per km
      electricCar: 14,
      motorcycle: 7,
      bicycle: 0,
      currency: 'INR',
      legalReference: 'Section 10(14) Income Tax Act',
      year: 2025,
    },
  },
  2024: {
    DE: {
      car: 0.30,
      electricCar: 0.30,
      motorcycle: 0.20,
      bicycle: 0,
      currency: 'EUR',
      legalReference: '§ 9 Abs. 1 Satz 3 Nr. 4a EStG',
      year: 2024,
    },
    AT: {
      car: 0.42,
      electricCar: 0.42,
      motorcycle: 0.24,
      bicycle: 0.38,
      currency: 'EUR',
      legalReference: '§ 26 Z 4 EStG',
      year: 2024,
    },
    UK: {
      car: 0.45,
      electricCar: 0.45,
      motorcycle: 0.24,
      bicycle: 0.20,
      currency: 'GBP',
      legalReference: 'HMRC Approved Mileage Allowance Payments',
      year: 2024,
      carTiers: [
        { threshold: 10000, rate: 0.45 },
        { threshold: Infinity, rate: 0.25 },
      ],
    },
    FR: {
      car: 0.35,
      electricCar: 0.35,
      motorcycle: 0.15,
      bicycle: 0.25,
      currency: 'EUR',
      legalReference: 'Article 83 du CGI - Barème kilométrique',
      year: 2024,
    },
    ES: {
      car: 0.19,
      electricCar: 0.21,
      motorcycle: 0.11,
      bicycle: 0,
      currency: 'EUR',
      legalReference: 'Artículo 9 LIRPF',
      year: 2024,
    },
    IT: {
      car: 0.2164,
      electricCar: 0.25,
      motorcycle: 0.12,
      bicycle: 0,
      currency: 'EUR',
      legalReference: 'Tabelle ACI',
      year: 2024,
    },
    NL: {
      car: 0.21,
      electricCar: 0.21,
      motorcycle: 0.12,
      bicycle: 0.15,
      currency: 'EUR',
      legalReference: 'Artikel 15a Wet LB',
      year: 2024,
    },
    SE: {
      car: 1.85,
      electricCar: 1.85,
      motorcycle: 0.95,
      bicycle: 0,
      currency: 'SEK',
      legalReference: '12 kap. 27 § IL',
      year: 2024,
    },
    JP: {
      car: 20,
      electricCar: 22,
      motorcycle: 10,
      bicycle: 0,
      currency: 'JPY',
      legalReference: '所得税法施行令第96条',
      year: 2024,
    },
    SA: {
      car: 1.2,
      electricCar: 1.4,
      motorcycle: 0.6,
      bicycle: 0,
      currency: 'SAR',
      legalReference: 'Income Tax Law',
      year: 2024,
    },
    IN: {
      car: 10,
      electricCar: 12,
      motorcycle: 6,
      bicycle: 0,
      currency: 'INR',
      legalReference: 'Section 10(14) Income Tax Act',
      year: 2024,
    },
  },
};

// Default to 2025 rates
const DEFAULT_MILEAGE_RATES = MILEAGE_RATES_BY_YEAR[2025];

/**
 * Mileage Calculator Service
 * Calculates business mileage deduction based on distance and vehicle type
 */
@Injectable()
export class MileageCalculatorService {
  private readonly logger = new Logger(MileageCalculatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate business mileage deduction
   */
  async calculate(input: MileageCalculatorInput): Promise<DeductionResultDto> {
    const { countryCode, distanceKm, vehicleType, taxRate } = input;
    const taxYear = input.taxYear || new Date().getFullYear();

    this.logger.log(
      `Calculating mileage: ${countryCode}, ${distanceKm}km, ${vehicleType}`,
    );

    const rates = await this.getCountryRates(countryCode, taxYear);

    // Get rate for vehicle type
    let ratePerKm: number;
    let vehicleName: string;

    switch (vehicleType) {
      case VehicleType.CAR:
        ratePerKm = rates.car;
        vehicleName = 'Car';
        break;
      case VehicleType.ELECTRIC_CAR:
        ratePerKm = rates.electricCar || rates.car;
        vehicleName = 'Electric Car';
        break;
      case VehicleType.MOTORCYCLE:
        ratePerKm = rates.motorcycle || rates.car * 0.6;
        vehicleName = 'Motorcycle';
        break;
      case VehicleType.ELECTRIC_MOTORCYCLE:
        ratePerKm = rates.electricMotorcycle || rates.motorcycle || rates.car * 0.6;
        vehicleName = 'Electric Motorcycle';
        break;
      case VehicleType.BICYCLE:
        ratePerKm = rates.bicycle || 0;
        vehicleName = 'Bicycle';
        if (ratePerKm === 0) {
          throw new Error(`Bicycle mileage not deductible in ${countryCode}`);
        }
        break;
      default:
        ratePerKm = rates.car;
        vehicleName = 'Vehicle';
    }

    const breakdown: CalculationBreakdown[] = [];

    breakdown.push({
      step: 'Vehicle type',
      value: 0,
      note: vehicleName,
    });

    breakdown.push({
      step: 'Rate per kilometer',
      value: ratePerKm,
      unit: `${rates.currency}/km`,
    });

    let totalDeduction = 0;

    // Check for tiered rates (e.g., UK)
    if (rates.carTiers && vehicleType === VehicleType.CAR) {
      let remainingDistance = distanceKm;
      let previousThreshold = 0;

      for (const tier of rates.carTiers) {
        if (remainingDistance <= 0) break;

        const tierDistance = Math.min(
          remainingDistance,
          tier.threshold - previousThreshold,
        );
        const tierAmount = tierDistance * tier.rate;
        totalDeduction += tierAmount;

        breakdown.push({
          step: `Distance ${previousThreshold}-${tier.threshold === Infinity ? '+' : tier.threshold}km`,
          value: tierAmount,
          unit: rates.currency,
          note: `${tierDistance.toFixed(1)}km × ${tier.rate} ${rates.currency}/km`,
        });

        remainingDistance -= tierDistance;
        previousThreshold = tier.threshold;
      }
    } else {
      // Simple calculation
      totalDeduction = distanceKm * ratePerKm;
      breakdown.push({
        step: 'Total mileage deduction',
        value: totalDeduction,
        unit: rates.currency,
        note: `${distanceKm}km × ${ratePerKm} ${rates.currency}/km`,
      });
    }

    const effectiveTaxRate = taxRate || 40;
    const taxSavings = totalDeduction * (effectiveTaxRate / 100);

    const requirements: string[] = [
      'Maintain a mileage logbook with dates, destinations, and business purpose',
      'Record odometer readings for business trips',
      'Keep documentation of business purpose for each trip',
      'Commute between home and regular workplace is typically not deductible',
    ];

    const warnings: string[] = [];

    if (vehicleType === VehicleType.BICYCLE && ratePerKm > 0) {
      warnings.push('Bicycle mileage may have different documentation requirements');
    }

    if (vehicleType === VehicleType.ELECTRIC_CAR || vehicleType === VehicleType.ELECTRIC_MOTORCYCLE) {
      warnings.push('Electric vehicles may qualify for additional incentives');
    }

    if (distanceKm > 50000) {
      warnings.push('Very high mileage may require additional justification');
    }

    warnings.push('Mileage rate covers fuel, maintenance, insurance, and depreciation');
    warnings.push('Cannot combine mileage rate with actual expense method for the same vehicle');

    if (rates.notes) {
      warnings.push(rates.notes);
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
        distanceKm,
        vehicleType,
        ratePerKm,
        taxYear,
      },
    };
  }

  /**
   * Get vehicle-specific rates for a country
   */
  async getVehicleRates(countryCode: string): Promise<{
    car: number;
    motorcycle?: number;
    bicycle?: number;
    electricCar?: number;
    currency: string;
  }> {
    const rates = await this.getCountryRates(countryCode, new Date().getFullYear());

    return {
      car: rates.car,
      motorcycle: rates.motorcycle,
      bicycle: rates.bicycle,
      electricCar: rates.electricCar,
      currency: rates.currency,
    };
  }

  // Cache for country rates (refreshed every hour)
  private ratesCache: Map<string, { rates: MileageRates; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Get country-specific mileage rates for a given tax year
   * Uses cached rates when available
   */
  async getCountryRates(
    countryCode: string,
    taxYear: number,
  ): Promise<MileageRates> {
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

      if (config && config.mileageRates) {
        const dbRates = config.mileageRates as unknown as MileageRates;
        this.ratesCache.set(cacheKey, { rates: dbRates, timestamp: now });
        return dbRates;
      }
    } catch (error) {
      this.logger.warn(
        `Could not load country config for ${countryCode}: ${error.message}`,
      );
    }

    // Use year-specific rates or fall back to 2025
    const yearRates = MILEAGE_RATES_BY_YEAR[taxYear] || MILEAGE_RATES_BY_YEAR[2025];
    const rates = yearRates[countryCode];

    if (!rates) {
      this.logger.warn(
        `No mileage rates for ${countryCode} in ${taxYear}, using Germany as fallback`,
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
    this.logger.log('Mileage rates cache cleared');
  }

  /**
   * Get available years with configured rates
   */
  getAvailableYears(): number[] {
    return Object.keys(MILEAGE_RATES_BY_YEAR).map(Number).sort((a, b) => b - a);
  }

  /**
   * Get all countries with configured rates for a given year
   */
  getAvailableCountries(taxYear: number = 2025): string[] {
    const yearRates = MILEAGE_RATES_BY_YEAR[taxYear] || MILEAGE_RATES_BY_YEAR[2025];
    return Object.keys(yearRates);
  }
}
