/**
 * Currency Seed Data
 *
 * Seeds exchange rates and currency configurations for:
 * - Canadian Dollar (CAD)
 * - Australian Dollar (AUD)
 * - Singapore Dollar (SGD)
 *
 * This seed file provides initial exchange rates for these currencies
 * to ensure the system can perform conversions immediately after deployment.
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

/**
 * Sample exchange rates (as of typical market rates)
 * These should be updated regularly via the exchange rate API
 *
 * Base currency: USD
 */
const INITIAL_EXCHANGE_RATES = [
  // CAD to major currencies
  {
    baseCurrency: 'USD',
    targetCurrency: 'CAD',
    rate: 1.36, // 1 USD = 1.36 CAD
    source: 'seed',
  },
  {
    baseCurrency: 'CAD',
    targetCurrency: 'USD',
    rate: 0.735, // 1 CAD = 0.735 USD
    source: 'seed',
  },
  {
    baseCurrency: 'EUR',
    targetCurrency: 'CAD',
    rate: 1.47, // 1 EUR = 1.47 CAD
    source: 'seed',
  },
  {
    baseCurrency: 'CAD',
    targetCurrency: 'EUR',
    rate: 0.68, // 1 CAD = 0.68 EUR
    source: 'seed',
  },
  {
    baseCurrency: 'GBP',
    targetCurrency: 'CAD',
    rate: 1.71, // 1 GBP = 1.71 CAD
    source: 'seed',
  },
  {
    baseCurrency: 'CAD',
    targetCurrency: 'GBP',
    rate: 0.585, // 1 CAD = 0.585 GBP
    source: 'seed',
  },

  // AUD to major currencies
  {
    baseCurrency: 'USD',
    targetCurrency: 'AUD',
    rate: 1.52, // 1 USD = 1.52 AUD
    source: 'seed',
  },
  {
    baseCurrency: 'AUD',
    targetCurrency: 'USD',
    rate: 0.658, // 1 AUD = 0.658 USD
    source: 'seed',
  },
  {
    baseCurrency: 'EUR',
    targetCurrency: 'AUD',
    rate: 1.64, // 1 EUR = 1.64 AUD
    source: 'seed',
  },
  {
    baseCurrency: 'AUD',
    targetCurrency: 'EUR',
    rate: 0.61, // 1 AUD = 0.61 EUR
    source: 'seed',
  },
  {
    baseCurrency: 'GBP',
    targetCurrency: 'AUD',
    rate: 1.91, // 1 GBP = 1.91 AUD
    source: 'seed',
  },
  {
    baseCurrency: 'AUD',
    targetCurrency: 'GBP',
    rate: 0.524, // 1 AUD = 0.524 GBP
    source: 'seed',
  },

  // SGD to major currencies
  {
    baseCurrency: 'USD',
    targetCurrency: 'SGD',
    rate: 1.34, // 1 USD = 1.34 SGD
    source: 'seed',
  },
  {
    baseCurrency: 'SGD',
    targetCurrency: 'USD',
    rate: 0.746, // 1 SGD = 0.746 USD
    source: 'seed',
  },
  {
    baseCurrency: 'EUR',
    targetCurrency: 'SGD',
    rate: 1.45, // 1 EUR = 1.45 SGD
    source: 'seed',
  },
  {
    baseCurrency: 'SGD',
    targetCurrency: 'EUR',
    rate: 0.69, // 1 SGD = 0.69 EUR
    source: 'seed',
  },
  {
    baseCurrency: 'GBP',
    targetCurrency: 'SGD',
    rate: 1.69, // 1 GBP = 1.69 SGD
    source: 'seed',
  },
  {
    baseCurrency: 'SGD',
    targetCurrency: 'GBP',
    rate: 0.592, // 1 SGD = 0.592 GBP
    source: 'seed',
  },

  // Cross rates between CAD, AUD, SGD
  {
    baseCurrency: 'CAD',
    targetCurrency: 'AUD',
    rate: 1.12, // 1 CAD = 1.12 AUD
    source: 'seed',
  },
  {
    baseCurrency: 'AUD',
    targetCurrency: 'CAD',
    rate: 0.893, // 1 AUD = 0.893 CAD
    source: 'seed',
  },
  {
    baseCurrency: 'CAD',
    targetCurrency: 'SGD',
    rate: 0.986, // 1 CAD = 0.986 SGD
    source: 'seed',
  },
  {
    baseCurrency: 'SGD',
    targetCurrency: 'CAD',
    rate: 1.014, // 1 SGD = 1.014 CAD
    source: 'seed',
  },
  {
    baseCurrency: 'AUD',
    targetCurrency: 'SGD',
    rate: 0.881, // 1 AUD = 0.881 SGD
    source: 'seed',
  },
  {
    baseCurrency: 'SGD',
    targetCurrency: 'AUD',
    rate: 1.135, // 1 SGD = 1.135 AUD
    source: 'seed',
  },

  // Additional cross rates with CHF, JPY
  {
    baseCurrency: 'CHF',
    targetCurrency: 'CAD',
    rate: 1.54, // 1 CHF = 1.54 CAD
    source: 'seed',
  },
  {
    baseCurrency: 'CAD',
    targetCurrency: 'CHF',
    rate: 0.649, // 1 CAD = 0.649 CHF
    source: 'seed',
  },
  {
    baseCurrency: 'CHF',
    targetCurrency: 'AUD',
    rate: 1.72, // 1 CHF = 1.72 AUD
    source: 'seed',
  },
  {
    baseCurrency: 'AUD',
    targetCurrency: 'CHF',
    rate: 0.581, // 1 AUD = 0.581 CHF
    source: 'seed',
  },
  {
    baseCurrency: 'CHF',
    targetCurrency: 'SGD',
    rate: 1.51, // 1 CHF = 1.51 SGD
    source: 'seed',
  },
  {
    baseCurrency: 'SGD',
    targetCurrency: 'CHF',
    rate: 0.662, // 1 SGD = 0.662 CHF
    source: 'seed',
  },
];

/**
 * Seed currency exchange rates
 */
export async function seedCurrencies() {
  console.log('🌍 Seeding currency exchange rates...');

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  try {
    // Upsert all exchange rates
    for (const rateData of INITIAL_EXCHANGE_RATES) {
      await prisma.exchangeRate.upsert({
        where: {
          baseCurrency_targetCurrency_date: {
            baseCurrency: rateData.baseCurrency,
            targetCurrency: rateData.targetCurrency,
            date: today,
          },
        },
        create: {
          baseCurrency: rateData.baseCurrency,
          targetCurrency: rateData.targetCurrency,
          rate: new Decimal(rateData.rate),
          source: rateData.source,
          date: today,
          fetchedAt: new Date(),
        },
        update: {
          rate: new Decimal(rateData.rate),
          source: rateData.source,
          fetchedAt: new Date(),
        },
      });

      console.log(
        `  ✓ ${rateData.baseCurrency}/${rateData.targetCurrency}: ${rateData.rate}`,
      );
    }

    console.log(
      `✅ Successfully seeded ${INITIAL_EXCHANGE_RATES.length} exchange rates`,
    );
  } catch (error) {
    console.error('❌ Error seeding currencies:', error);
    throw error;
  }
}

/**
 * Main seed function
 */
async function main() {
  try {
    await seedCurrencies();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default seedCurrencies;
