/**
 * Exchange Rate Service
 *
 * Provides live and historical exchange rates for currency conversions
 *
 * Features:
 * - Live exchange rates from external API (Open Exchange Rates)
 * - Redis caching (1 hour TTL)
 * - Historical rates for specific dates
 * - Batch rate fetching for multiple currency pairs
 * - Fallback to cached rates if API fails
 * - Rate validation and sanity checks
 * - Inverse rate calculation
 * - Automatic rate refresh via BullMQ job
 *
 * Rate Sources:
 * - Primary: Open Exchange Rates API (free tier: 1000 req/month)
 * - Alternative: exchangerate-api.com (free tier available)
 * - Fallback: Cached rates from Redis or database
 *
 * Cache Strategy:
 * - Live rates: Redis cache with 1 hour TTL
 * - Historical rates: PostgreSQL database
 * - Cache key pattern: `exchange:rate:{base}:{target}:{date?}`
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../cache/redis.service';
import { PrismaService } from '../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Decimal } from '@prisma/client/runtime/library';

export interface ExchangeRateResponse {
  rate: number;
  source: 'live' | 'cache' | 'database';
  timestamp: Date;
  baseCurrency: string;
  targetCurrency: string;
}

export interface BatchRatesResponse {
  base: string;
  rates: Map<string, number>;
  source: 'live' | 'cache' | 'database';
  timestamp: Date;
}

export interface HistoricalRateResponse {
  rate: number;
  date: Date;
  baseCurrency: string;
  targetCurrency: string;
  source: 'database' | 'api';
}

/**
 * Open Exchange Rates API Response
 */
interface OpenExchangeRatesResponse {
  disclaimer: string;
  license: string;
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}

/**
 * Open Exchange Rates Historical API Response
 */
interface OpenExchangeRatesHistoricalResponse {
  disclaimer: string;
  license: string;
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly cacheTTL: number; // in seconds
  private readonly apiEnabled: boolean;

  // Rate validation limits (sanity checks)
  private readonly MIN_RATE = 0.000001;
  private readonly MAX_RATE = 1000000;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {
    // Configuration
    this.apiKey = this.configService.get<string>('OPEN_EXCHANGE_RATES_API_KEY', '');
    this.apiUrl = this.configService.get<string>(
      'OPEN_EXCHANGE_RATES_API_URL',
      'https://openexchangerates.org/api',
    );
    this.cacheTTL = this.configService.get<number>('EXCHANGE_RATE_CACHE_TTL', 3600); // 1 hour
    this.apiEnabled = !!this.apiKey;

    if (!this.apiEnabled) {
      this.logger.warn(
        'Exchange rate API key not configured. Will use cached/database rates only.',
      );
    }
  }

  /**
   * Get exchange rate for a currency pair
   * Returns live rate from API, falls back to cache/database
   */
  async getRate(from: string, to: string): Promise<ExchangeRateResponse> {
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    // Same currency = 1:1 rate
    if (fromUpper === toUpper) {
      return {
        rate: 1,
        source: 'live',
        timestamp: new Date(),
        baseCurrency: fromUpper,
        targetCurrency: toUpper,
      };
    }

    // Try cache first
    const cachedRate = await this.getCachedRate(fromUpper, toUpper);
    if (cachedRate) {
      return cachedRate;
    }

    // Try live API
    if (this.apiEnabled) {
      try {
        const liveRate = await this.fetchLiveRate(fromUpper, toUpper);
        if (liveRate) {
          // Cache the rate
          await this.cacheRate(fromUpper, toUpper, liveRate);
          return {
            rate: liveRate,
            source: 'live',
            timestamp: new Date(),
            baseCurrency: fromUpper,
            targetCurrency: toUpper,
          };
        }
      } catch (error) {
        this.logger.error(`Failed to fetch live rate ${fromUpper}/${toUpper}:`, error.message);
        // Continue to fallback
      }
    }

    // Try database historical rates (most recent)
    const dbRate = await this.getLatestDatabaseRate(fromUpper, toUpper);
    if (dbRate) {
      return {
        rate: dbRate.rate,
        source: 'database',
        timestamp: dbRate.fetchedAt,
        baseCurrency: fromUpper,
        targetCurrency: toUpper,
      };
    }

    throw new BadRequestException(
      `No exchange rate available for ${fromUpper}/${toUpper}. ` +
        `Please ensure rates are configured or API is enabled.`,
    );
  }

  /**
   * Get multiple exchange rates for a base currency
   * Optimized batch fetching
   */
  async getRates(base: string, targets: string[]): Promise<BatchRatesResponse> {
    const baseUpper = base.toUpperCase();
    const targetsUpper = targets.map((t) => t.toUpperCase());

    // Try cache first
    const cacheKey = this.getBatchCacheKey(baseUpper);
    const cachedRates = await this.redisService.get<Record<string, number>>(cacheKey);

    if (cachedRates) {
      const filteredRates = new Map<string, number>();
      targetsUpper.forEach((target) => {
        if (cachedRates[target] !== undefined) {
          filteredRates.set(target, cachedRates[target]);
        }
      });

      if (filteredRates.size === targetsUpper.length) {
        return {
          base: baseUpper,
          rates: filteredRates,
          source: 'cache',
          timestamp: new Date(),
        };
      }
    }

    // Fetch live rates
    if (this.apiEnabled) {
      try {
        const liveRates = await this.fetchAllRatesForBase(baseUpper);
        if (liveRates) {
          // Cache all rates
          await this.redisService.set(cacheKey, liveRates, this.cacheTTL);

          // Save to database for historical records
          await this.saveRatesToDatabase(baseUpper, liveRates);

          // Filter to requested targets
          const filteredRates = new Map<string, number>();
          targetsUpper.forEach((target) => {
            if (liveRates[target] !== undefined) {
              filteredRates.set(target, liveRates[target]);
            }
          });

          return {
            base: baseUpper,
            rates: filteredRates,
            source: 'live',
            timestamp: new Date(),
          };
        }
      } catch (error) {
        this.logger.error(`Failed to fetch batch rates for base ${baseUpper}:`, error.message);
      }
    }

    // Fallback to database
    const dbRates = await this.getLatestDatabaseRatesForBase(baseUpper, targetsUpper);
    return {
      base: baseUpper,
      rates: dbRates,
      source: 'database',
      timestamp: new Date(),
    };
  }

  /**
   * Get historical exchange rate for a specific date
   */
  async getHistoricalRate(
    from: string,
    to: string,
    date: Date,
  ): Promise<HistoricalRateResponse> {
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();
    const dateString = this.formatDateForApi(date);

    // Same currency = 1:1 rate
    if (fromUpper === toUpper) {
      return {
        rate: 1,
        date,
        baseCurrency: fromUpper,
        targetCurrency: toUpper,
        source: 'database',
      };
    }

    // Try database first
    const dbRate = await this.getDatabaseRate(fromUpper, toUpper, date);
    if (dbRate) {
      return {
        rate: Number(dbRate.rate),
        date: dbRate.date,
        baseCurrency: dbRate.baseCurrency,
        targetCurrency: dbRate.targetCurrency,
        source: 'database',
      };
    }

    // Try API for historical rate
    if (this.apiEnabled) {
      try {
        const historicalRate = await this.fetchHistoricalRate(fromUpper, toUpper, dateString);
        if (historicalRate) {
          // Save to database
          await this.saveRateToDatabase(fromUpper, toUpper, historicalRate, date);

          return {
            rate: historicalRate,
            date,
            baseCurrency: fromUpper,
            targetCurrency: toUpper,
            source: 'api',
          };
        }
      } catch (error) {
        this.logger.error(
          `Failed to fetch historical rate ${fromUpper}/${toUpper} for ${dateString}:`,
          error.message,
        );
      }
    }

    throw new BadRequestException(
      `No historical exchange rate available for ${fromUpper}/${toUpper} on ${dateString}`,
    );
  }

  /**
   * Get all cached rates from Redis
   */
  async getCachedRates(): Promise<Map<string, number>> {
    try {
      const pattern = 'exchange:rate:*';
      const keys = await this.redisService.keys(pattern);

      const rates = new Map<string, number>();
      for (const key of keys) {
        const rate = await this.redisService.get<number>(key);
        if (rate) {
          rates.set(key, rate);
        }
      }

      return rates;
    } catch (error) {
      this.logger.error('Failed to get cached rates:', error.message);
      return new Map();
    }
  }

  /**
   * Force refresh all rates from API
   */
  async refreshRates(baseCurrency: string = 'USD'): Promise<void> {
    if (!this.apiEnabled) {
      throw new BadRequestException('Exchange rate API is not configured');
    }

    this.logger.log(`Refreshing exchange rates for base currency: ${baseCurrency}`);

    try {
      const rates = await this.fetchAllRatesForBase(baseCurrency);
      if (!rates) {
        throw new Error('Failed to fetch rates from API');
      }

      // Cache rates
      const cacheKey = this.getBatchCacheKey(baseCurrency);
      await this.redisService.set(cacheKey, rates, this.cacheTTL);

      // Save to database
      await this.saveRatesToDatabase(baseCurrency, rates);

      this.logger.log(`Successfully refreshed ${Object.keys(rates).length} exchange rates`);
    } catch (error) {
      this.logger.error('Failed to refresh exchange rates:', error.message);
      throw error;
    }
  }

  /**
   * Calculate inverse rate
   * If USD/EUR = 0.85, then EUR/USD = 1/0.85 = 1.176
   */
  async getInverseRate(from: string, to: string): Promise<number> {
    const rate = await this.getRate(from, to);
    return this.calculateInverseRate(rate.rate);
  }

  /**
   * Validate rate value (sanity check)
   */
  private validateRate(rate: number): boolean {
    return rate > this.MIN_RATE && rate < this.MAX_RATE && !isNaN(rate);
  }

  /**
   * Calculate inverse rate
   */
  private calculateInverseRate(rate: number): number {
    if (rate === 0) {
      throw new BadRequestException('Cannot calculate inverse of zero rate');
    }
    return 1 / rate;
  }

  /**
   * Fetch live rate from Open Exchange Rates API
   */
  private async fetchLiveRate(from: string, to: string): Promise<number | null> {
    try {
      // Open Exchange Rates uses USD as base, so we need to convert
      const url = `${this.apiUrl}/latest.json?app_id=${this.apiKey}`;

      const response = await firstValueFrom(
        this.httpService.get<OpenExchangeRatesResponse>(url),
      );

      if (!response.data || !response.data.rates) {
        this.logger.warn('Invalid API response format');
        return null;
      }

      const rates = response.data.rates;
      const base = response.data.base; // Always USD for free tier

      // Calculate rate between any two currencies
      let rate: number;

      if (from === base) {
        // Direct rate from base
        rate = rates[to];
      } else if (to === base) {
        // Inverse rate to base
        rate = 1 / rates[from];
      } else {
        // Cross rate via base currency
        rate = rates[to] / rates[from];
      }

      if (!this.validateRate(rate)) {
        this.logger.warn(`Invalid rate value: ${rate} for ${from}/${to}`);
        return null;
      }

      return rate;
    } catch (error) {
      this.logger.error(`API request failed for ${from}/${to}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch all rates for a base currency
   */
  private async fetchAllRatesForBase(base: string): Promise<Record<string, number> | null> {
    try {
      const url = `${this.apiUrl}/latest.json?app_id=${this.apiKey}&base=${base}`;

      const response = await firstValueFrom(
        this.httpService.get<OpenExchangeRatesResponse>(url),
      );

      if (!response.data || !response.data.rates) {
        this.logger.warn('Invalid API response format');
        return null;
      }

      return response.data.rates;
    } catch (error) {
      // Free tier doesn't support custom base, fallback to USD base
      if (base !== 'USD') {
        this.logger.debug(`Custom base not supported, using USD base`);
        return await this.fetchAllRatesViaUSD(base);
      }

      this.logger.error(`Failed to fetch rates for base ${base}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch rates via USD base (for free tier)
   */
  private async fetchAllRatesViaUSD(targetBase: string): Promise<Record<string, number> | null> {
    try {
      const url = `${this.apiUrl}/latest.json?app_id=${this.apiKey}`;

      const response = await firstValueFrom(
        this.httpService.get<OpenExchangeRatesResponse>(url),
      );

      if (!response.data || !response.data.rates) {
        return null;
      }

      const usdRates = response.data.rates;
      const baseRate = usdRates[targetBase];

      if (!baseRate) {
        this.logger.warn(`Base currency ${targetBase} not found in USD rates`);
        return null;
      }

      // Convert all rates to target base
      const convertedRates: Record<string, number> = {};
      Object.entries(usdRates).forEach(([currency, rate]) => {
        convertedRates[currency] = rate / baseRate;
      });

      return convertedRates;
    } catch (error) {
      this.logger.error('Failed to fetch rates via USD:', error.message);
      return null;
    }
  }

  /**
   * Fetch historical rate from API
   */
  private async fetchHistoricalRate(
    from: string,
    to: string,
    date: string,
  ): Promise<number | null> {
    try {
      const url = `${this.apiUrl}/historical/${date}.json?app_id=${this.apiKey}`;

      const response = await firstValueFrom(
        this.httpService.get<OpenExchangeRatesHistoricalResponse>(url),
      );

      if (!response.data || !response.data.rates) {
        return null;
      }

      const rates = response.data.rates;
      const base = response.data.base; // USD

      // Calculate rate between any two currencies
      let rate: number;

      if (from === base) {
        rate = rates[to];
      } else if (to === base) {
        rate = 1 / rates[from];
      } else {
        rate = rates[to] / rates[from];
      }

      if (!this.validateRate(rate)) {
        return null;
      }

      return rate;
    } catch (error) {
      this.logger.error(`Failed to fetch historical rate for ${date}:`, error.message);
      return null;
    }
  }

  /**
   * Get rate from Redis cache
   */
  private async getCachedRate(from: string, to: string): Promise<ExchangeRateResponse | null> {
    try {
      const cacheKey = this.getCacheKey(from, to);
      const rate = await this.redisService.get<number>(cacheKey);

      if (rate && this.validateRate(rate)) {
        return {
          rate,
          source: 'cache',
          timestamp: new Date(),
          baseCurrency: from,
          targetCurrency: to,
        };
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to get cached rate:', error.message);
      return null;
    }
  }

  /**
   * Cache rate in Redis
   */
  private async cacheRate(from: string, to: string, rate: number): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(from, to);
      await this.redisService.set(cacheKey, rate, this.cacheTTL);
    } catch (error) {
      this.logger.error('Failed to cache rate:', error.message);
    }
  }

  /**
   * Get latest rate from database
   */
  private async getLatestDatabaseRate(
    from: string,
    to: string,
  ): Promise<{ rate: number; fetchedAt: Date } | null> {
    try {
      const rate = await this.prisma.exchangeRate.findFirst({
        where: {
          baseCurrency: from,
          targetCurrency: to,
        },
        orderBy: {
          fetchedAt: 'desc',
        },
      });

      if (rate) {
        return {
          rate: Number(rate.rate),
          fetchedAt: rate.fetchedAt,
        };
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to get database rate:', error.message);
      return null;
    }
  }

  /**
   * Get latest rates for base currency from database
   */
  private async getLatestDatabaseRatesForBase(
    base: string,
    targets: string[],
  ): Promise<Map<string, number>> {
    try {
      const rates = await this.prisma.exchangeRate.findMany({
        where: {
          baseCurrency: base,
          targetCurrency: {
            in: targets,
          },
        },
        orderBy: {
          fetchedAt: 'desc',
        },
        distinct: ['targetCurrency'],
      });

      const ratesMap = new Map<string, number>();
      rates.forEach((rate) => {
        ratesMap.set(rate.targetCurrency, Number(rate.rate));
      });

      return ratesMap;
    } catch (error) {
      this.logger.error('Failed to get database rates:', error.message);
      return new Map();
    }
  }

  /**
   * Get historical rate from database
   */
  private async getDatabaseRate(from: string, to: string, date: Date) {
    try {
      return await this.prisma.exchangeRate.findUnique({
        where: {
          baseCurrency_targetCurrency_date: {
            baseCurrency: from,
            targetCurrency: to,
            date: this.normalizeDateToMidnight(date),
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to get historical database rate:', error.message);
      return null;
    }
  }

  /**
   * Save rate to database
   */
  private async saveRateToDatabase(
    from: string,
    to: string,
    rate: number,
    date: Date,
  ): Promise<void> {
    try {
      await this.prisma.exchangeRate.upsert({
        where: {
          baseCurrency_targetCurrency_date: {
            baseCurrency: from,
            targetCurrency: to,
            date: this.normalizeDateToMidnight(date),
          },
        },
        create: {
          baseCurrency: from,
          targetCurrency: to,
          rate: new Decimal(rate),
          source: 'openexchangerates',
          date: this.normalizeDateToMidnight(date),
        },
        update: {
          rate: new Decimal(rate),
          fetchedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Failed to save rate to database:', error.message);
    }
  }

  /**
   * Save multiple rates to database
   */
  private async saveRatesToDatabase(base: string, rates: Record<string, number>): Promise<void> {
    try {
      const today = this.normalizeDateToMidnight(new Date());

      const operations = Object.entries(rates).map(([currency, rate]) =>
        this.prisma.exchangeRate.upsert({
          where: {
            baseCurrency_targetCurrency_date: {
              baseCurrency: base,
              targetCurrency: currency,
              date: today,
            },
          },
          create: {
            baseCurrency: base,
            targetCurrency: currency,
            rate: new Decimal(rate),
            source: 'openexchangerates',
            date: today,
          },
          update: {
            rate: new Decimal(rate),
            fetchedAt: new Date(),
          },
        }),
      );

      await this.prisma.$transaction(operations);
      this.logger.log(`Saved ${operations.length} rates to database`);
    } catch (error) {
      this.logger.error('Failed to save rates to database:', error.message);
    }
  }

  /**
   * Cache key for single rate
   */
  private getCacheKey(from: string, to: string): string {
    return `exchange:rate:${from}:${to}`;
  }

  /**
   * Cache key for batch rates
   */
  private getBatchCacheKey(base: string): string {
    return `exchange:rates:${base}`;
  }

  /**
   * Format date for API (YYYY-MM-DD)
   */
  private formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Normalize date to midnight UTC
   */
  private normalizeDateToMidnight(date: Date): Date {
    const normalized = new Date(date);
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
  }
}
