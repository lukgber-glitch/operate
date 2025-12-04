/**
 * SAR Currency Examples
 * Demonstrates usage of SAR formatting and conversion
 */

import {
  formatSAR,
  parseSAR,
  formatSARCompact,
  formatSARInWords,
  validateSARAmount,
} from './sar.formatter';
import { SAR_CONSTANTS } from './sar.constants';

// Example 1: Basic formatting
console.log('=== Basic SAR Formatting ===');
console.log(formatSAR(1234.56)); // "1,234.56 ر.س"
console.log(formatSAR(1234.56, { useAlternativeSymbol: true })); // "1,234.56 SAR"
console.log(formatSAR(1234.56, { includeSymbol: false })); // "1,234.56"

// Example 2: Arabic numerals
console.log('\n=== Arabic Numerals ===');
console.log(formatSAR(1234.56, { useArabicNumerals: true })); // "١٬٢٣٤٫٥٦ ر.س"
console.log(formatSAR(9876.54, { useArabicNumerals: true })); // "٩٬٨٧٦٫٥٤ ر.س"

// Example 3: Compact formatting
console.log('\n=== Compact Formatting ===');
console.log(formatSARCompact(1234567)); // "1.2M ر.س"
console.log(formatSARCompact(987654321)); // "987.7M ر.س"
console.log(formatSARCompact(1234567, 'ar-SA', true)); // "١٫٢M ر.س"

// Example 4: Parsing
console.log('\n=== Parsing ===');
console.log(parseSAR('1,234.56 ر.س')); // 1234.56
console.log(parseSAR('١٬٢٣٤٫٥٦ ر.س')); // 1234.56
console.log(parseSAR('1234.56 SAR')); // 1234.56

// Example 5: Invoice formatting (amount in words)
console.log('\n=== Amount in Words ===');
console.log(formatSARInWords(1234.56, 'ar'));
// "ألف ومائتان وأربعة وثلاثون ريالاً سعودياً وستة وخمسون هللة"
console.log(formatSARInWords(1234.56, 'en'));
// "one thousand two hundred thirty-four Saudi riyals and fifty-six halalas"

// Example 6: Validation
console.log('\n=== Validation ===');
console.log(validateSARAmount(1234.56)); // { valid: true }
console.log(validateSARAmount(1234.567)); // { valid: false, error: '...' }
console.log(validateSARAmount(NaN)); // { valid: false, error: '...' }

// Example 7: Common business amounts
console.log('\n=== Common Business Amounts ===');
const invoiceAmount = 15750.80;
const vatRate = 0.15; // 15% VAT in Saudi Arabia
const vat = invoiceAmount * vatRate;
const total = invoiceAmount + vat;

console.log('Invoice Amount:', formatSAR(invoiceAmount));
console.log('VAT (15%):', formatSAR(vat));
console.log('Total:', formatSAR(total));
console.log('Total (Arabic):', formatSAR(total, { useArabicNumerals: true }));
console.log('In Words (Arabic):', formatSARInWords(total, 'ar'));
console.log('In Words (English):', formatSARInWords(total, 'en'));

// Example 8: Exchange rate conversion (pegged to USD)
console.log('\n=== Exchange Rate (Pegged) ===');
const usdAmount = 1000;
const sarAmount = usdAmount * SAR_CONSTANTS.peggedRate;
console.log(`$${usdAmount} USD =`, formatSAR(sarAmount));

const sarToConvert = 3750.00;
const convertedUsd = sarToConvert / SAR_CONSTANTS.peggedRate;
console.log(formatSAR(sarToConvert), `= $${convertedUsd.toFixed(2)} USD`);

// Example 9: Different locales
console.log('\n=== Different Locales ===');
console.log('en-SA:', formatSAR(1234567.89, { locale: 'en-SA' }));
console.log('ar-SA:', formatSAR(1234567.89, { locale: 'ar-SA' }));

// Example 10: Large amounts
console.log('\n=== Large Amounts ===');
console.log('1 Million SAR:', formatSAR(1000000));
console.log('1 Million (compact):', formatSARCompact(1000000));
console.log('100 Million SAR:', formatSAR(100000000));
console.log('100 Million (compact):', formatSARCompact(100000000));

// Example 11: Zakat calculation (Saudi-specific)
console.log('\n=== Zakat Calculation ===');
const wealth = 100000;
const zakatRate = 0.025; // 2.5%
const zakatAmount = wealth * zakatRate;
console.log('Wealth:', formatSAR(wealth));
console.log('Zakat (2.5%):', formatSAR(zakatAmount));
console.log('Zakat (Arabic):', formatSAR(zakatAmount, { useArabicNumerals: true }));
