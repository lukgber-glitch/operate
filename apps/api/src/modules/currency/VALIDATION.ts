/**
 * Currency Module Validation Script
 *
 * Quick validation that all currencies are properly configured.
 * Run with: npx ts-node apps/api/src/modules/currency/VALIDATION.ts
 */

import { CURRENCIES, SUPPORTED_CURRENCY_CODES, COUNTRY_TO_CURRENCY } from './currency.config';

console.log('🔍 Currency Module Validation\n');

// 1. Count currencies
console.log(`✅ Total currencies configured: ${SUPPORTED_CURRENCY_CODES.length}`);
console.log(`   Currencies: ${SUPPORTED_CURRENCY_CODES.join(', ')}\n`);

// 2. Validate all currencies have required fields
let validationErrors = 0;

SUPPORTED_CURRENCY_CODES.forEach((code) => {
  const currency = CURRENCIES[code];

  if (!currency) {
    console.error(`❌ Currency ${code} not found in CURRENCIES object`);
    validationErrors++;
    return;
  }

  // Check required fields
  if (!currency.code) {
    console.error(`❌ ${code}: Missing 'code' field`);
    validationErrors++;
  }
  if (!currency.symbol) {
    console.error(`❌ ${code}: Missing 'symbol' field`);
    validationErrors++;
  }
  if (!currency.name) {
    console.error(`❌ ${code}: Missing 'name' field`);
    validationErrors++;
  }
  if (currency.decimals === undefined) {
    console.error(`❌ ${code}: Missing 'decimals' field`);
    validationErrors++;
  }
  if (!currency.countries || currency.countries.length === 0) {
    console.error(`❌ ${code}: Missing or empty 'countries' field`);
    validationErrors++;
  }
  if (!currency.flag) {
    console.error(`❌ ${code}: Missing 'flag' field`);
    validationErrors++;
  }
  if (!currency.format) {
    console.error(`❌ ${code}: Missing 'format' field`);
    validationErrors++;
  }

  // Validate decimal places
  if (currency.decimals < 0 || currency.decimals > 4) {
    console.error(`❌ ${code}: Invalid decimals value: ${currency.decimals}`);
    validationErrors++;
  }

  // Validate format
  if (currency.format !== 'before' && currency.format !== 'after') {
    console.error(`❌ ${code}: Invalid format value: ${currency.format}`);
    validationErrors++;
  }
});

if (validationErrors === 0) {
  console.log('✅ All currencies have required fields\n');
} else {
  console.log(`❌ Found ${validationErrors} validation errors\n`);
}

// 3. Check for duplicate country codes
const countryCodeCounts: Record<string, string[]> = {};

Object.entries(CURRENCIES).forEach(([code, config]) => {
  config.countries.forEach((country) => {
    if (!countryCodeCounts[country]) {
      countryCodeCounts[country] = [];
    }
    countryCodeCounts[country].push(code);
  });
});

const duplicates = Object.entries(countryCodeCounts).filter(
  ([_, codes]) => codes.length > 1,
);

if (duplicates.length > 0) {
  console.log('⚠️  Countries with multiple currencies:');
  duplicates.forEach(([country, codes]) => {
    console.log(`   ${country}: ${codes.join(', ')}`);
  });
  console.log();
} else {
  console.log('✅ No duplicate country codes\n');
}

// 4. Validate country to currency mapping
console.log(`✅ Total countries mapped: ${Object.keys(COUNTRY_TO_CURRENCY).length}`);

// Sample some country mappings
const sampleCountries = ['US', 'GB', 'DE', 'FR', 'JP', 'CH', 'CA', 'AU'];
console.log('   Sample mappings:');
sampleCountries.forEach((country) => {
  const currency = COUNTRY_TO_CURRENCY[country];
  if (currency) {
    const config = CURRENCIES[currency];
    console.log(`   ${country} → ${currency} (${config.name})`);
  } else {
    console.log(`   ${country} → NOT MAPPED`);
  }
});
console.log();

// 5. Check for zero-decimal currencies
const zeroDecimalCurrencies = SUPPORTED_CURRENCY_CODES.filter(
  (code) => CURRENCIES[code].decimals === 0,
);

console.log(`✅ Zero-decimal currencies (${zeroDecimalCurrencies.length}):`);
zeroDecimalCurrencies.forEach((code) => {
  console.log(`   ${code} (${CURRENCIES[code].name})`);
});
console.log();

// 6. Check for special rounding currencies
const cashRoundingCurrencies = SUPPORTED_CURRENCY_CODES.filter(
  (code) => CURRENCIES[code].rounding === 'cash',
);

console.log(`✅ Cash-rounding currencies (${cashRoundingCurrencies.length}):`);
cashRoundingCurrencies.forEach((code) => {
  console.log(`   ${code} (${CURRENCIES[code].name})`);
});
console.log();

// 7. Regional distribution
const regions = {
  'North America': ['USD', 'CAD', 'MXN'],
  'Europe': ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'RUB', 'TRY'],
  'Asia': ['JPY', 'CNY', 'INR', 'KRW', 'HKD', 'SGD', 'THB', 'MYR', 'IDR', 'PHP', 'VND'],
  'Oceania': ['AUD', 'NZD'],
  'Middle East': ['AED', 'SAR', 'ILS'],
  'South America': ['BRL'],
  'Africa': ['ZAR', 'NGN'],
};

console.log('✅ Regional distribution:');
Object.entries(regions).forEach(([region, codes]) => {
  const available = codes.filter((code) => SUPPORTED_CURRENCY_CODES.includes(code));
  console.log(`   ${region}: ${available.length}/${codes.length} currencies`);
});
console.log();

// 8. Final summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 Summary');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ Total currencies: ${SUPPORTED_CURRENCY_CODES.length}`);
console.log(`✅ Total countries mapped: ${Object.keys(COUNTRY_TO_CURRENCY).length}`);
console.log(`✅ Zero-decimal currencies: ${zeroDecimalCurrencies.length}`);
console.log(`✅ Cash-rounding currencies: ${cashRoundingCurrencies.length}`);
console.log(`${validationErrors === 0 ? '✅' : '❌'} Validation errors: ${validationErrors}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (validationErrors === 0) {
  console.log('🎉 Currency module validation passed!\n');
  process.exit(0);
} else {
  console.log('❌ Currency module validation failed!\n');
  process.exit(1);
}
