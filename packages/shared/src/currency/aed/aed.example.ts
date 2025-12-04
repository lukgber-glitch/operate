/**
 * AED Currency Examples
 * Demonstrates usage of AED formatting and conversion
 */

import {
  formatAED,
  parseAED,
  formatAEDCompact,
  formatAEDInWords,
  validateAEDAmount,
} from './aed.formatter';
import { AED_CONSTANTS } from './aed.constants';

// Example 1: Basic formatting
console.log('=== Basic AED Formatting ===');
console.log(formatAED(1234.56)); // "1,234.56 د.إ"
console.log(formatAED(1234.56, { useAlternativeSymbol: true })); // "1,234.56 AED"
console.log(formatAED(1234.56, { includeSymbol: false })); // "1,234.56"

// Example 2: Arabic numerals
console.log('\n=== Arabic Numerals ===');
console.log(formatAED(1234.56, { useArabicNumerals: true })); // "١٬٢٣٤٫٥٦ د.إ"
console.log(formatAED(9876.54, { useArabicNumerals: true })); // "٩٬٨٧٦٫٥٤ د.إ"

// Example 3: Compact formatting
console.log('\n=== Compact Formatting ===');
console.log(formatAEDCompact(1234567)); // "1.2M د.إ"
console.log(formatAEDCompact(987654321)); // "987.7M د.إ"
console.log(formatAEDCompact(1234567, 'en-AE', true)); // "١٫٢M د.إ"

// Example 4: Parsing
console.log('\n=== Parsing ===');
console.log(parseAED('1,234.56 د.إ')); // 1234.56
console.log(parseAED('١٬٢٣٤٫٥٦ د.إ')); // 1234.56
console.log(parseAED('1234.56 AED')); // 1234.56

// Example 5: Invoice formatting (amount in words)
console.log('\n=== Amount in Words ===');
console.log(formatAEDInWords(1234.56, 'ar'));
// "ألف ومائتان وأربعة وثلاثون درهماً إماراتياً وستة وخمسون فلساً"
console.log(formatAEDInWords(1234.56, 'en'));
// "one thousand two hundred thirty-four UAE dirhams and fifty-six fils"

// Example 6: Validation
console.log('\n=== Validation ===');
console.log(validateAEDAmount(1234.56)); // { valid: true }
console.log(validateAEDAmount(1234.567)); // { valid: false, error: '...' }
console.log(validateAEDAmount(NaN)); // { valid: false, error: '...' }

// Example 7: Common business amounts
console.log('\n=== Common Business Amounts ===');
const invoiceAmount = 15750.80;
const vatRate = 0.05; // 5% VAT in UAE
const vat = invoiceAmount * vatRate;
const total = invoiceAmount + vat;

console.log('Invoice Amount:', formatAED(invoiceAmount));
console.log('VAT (5%):', formatAED(vat));
console.log('Total:', formatAED(total));
console.log('Total (Arabic):', formatAED(total, { useArabicNumerals: true }));
console.log('In Words (Arabic):', formatAEDInWords(total, 'ar'));
console.log('In Words (English):', formatAEDInWords(total, 'en'));

// Example 8: Exchange rate conversion (pegged to USD)
console.log('\n=== Exchange Rate (Pegged) ===');
const usdAmount = 1000;
const aedAmount = usdAmount * AED_CONSTANTS.peggedRate;
console.log(`$${usdAmount} USD =`, formatAED(aedAmount));

const aedToConvert = 3672.50;
const convertedUsd = aedToConvert / AED_CONSTANTS.peggedRate;
console.log(formatAED(aedToConvert), `= $${convertedUsd.toFixed(2)} USD`);

// Example 9: Different locales
console.log('\n=== Different Locales ===');
console.log('en-AE:', formatAED(1234567.89, { locale: 'en-AE' }));
console.log('ar-AE:', formatAED(1234567.89, { locale: 'ar-AE' }));

// Example 10: Large amounts
console.log('\n=== Large Amounts ===');
console.log('1 Million AED:', formatAED(1000000));
console.log('1 Million (compact):', formatAEDCompact(1000000));
console.log('100 Million AED:', formatAED(100000000));
console.log('100 Million (compact):', formatAEDCompact(100000000));
