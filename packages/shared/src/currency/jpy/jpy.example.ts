/**
 * JPY Formatter Examples
 * Demonstrates usage of JPY formatting and Japanese fiscal year utilities
 */

import { formatJPY, parseJPY, formatJPYCompact, validateJPYAmount } from './jpy.formatter';
import { JPY_CONSTANTS } from './jpy.constants';
import { createStandardJapaneseFiscalYear } from '../../fiscal-year/jp-fiscal-year.service';
import { toJapaneseYear, formatJapaneseDate } from '../../fiscal-year/japanese-era';

// Example 1: Basic JPY formatting
console.log('=== Basic JPY Formatting ===');
console.log(formatJPY(1234567)); // ¥1,234,567
console.log(formatJPY(1000)); // ¥1,000
console.log(formatJPY(999.99)); // ¥1,000 (rounded)

// Example 2: Traditional Japanese format
console.log('\n=== Traditional Japanese Format ===');
console.log(formatJPY(12345, { useTraditionalFormat: true, useKanjiYenSymbol: true })); // 1万2,345円
console.log(formatJPY(123456789, { useTraditionalFormat: true, useKanjiYenSymbol: true })); // 1億2,345万6,789円
console.log(formatJPY(1234567890000, { useTraditionalFormat: true, useKanjiYenSymbol: true })); // 1兆2,345億6,789万円

// Example 3: Parse JPY strings
console.log('\n=== Parsing JPY Strings ===');
console.log(parseJPY('¥1,234,567')); // 1234567
console.log(parseJPY('1万2,345円')); // 12345
console.log(parseJPY('1億2,345万6,789円')); // 123456789

// Example 4: Compact formatting
console.log('\n=== Compact Formatting ===');
console.log(formatJPYCompact(1234567, 'ja-JP')); // 123万4,567円
console.log(formatJPYCompact(1234567, 'en-US')); // ¥1.2M

// Example 5: Validation
console.log('\n=== Amount Validation ===');
console.log(validateJPYAmount(1234567)); // { valid: true }
console.log(validateJPYAmount(1234.56)); // { valid: false, error: '...' }

// Example 6: Japanese Fiscal Year
console.log('\n=== Japanese Fiscal Year ===');
const fiscalYearService = createStandardJapaneseFiscalYear();
const currentFY = fiscalYearService.getCurrentFiscalYear();
console.log(`Current Fiscal Year: ${currentFY.formatted}`); // e.g., "令和6年度"
console.log(`Start: ${currentFY.startDate.toLocaleDateString('ja-JP')}`);
console.log(`End: ${currentFY.endDate.toLocaleDateString('ja-JP')}`);

// Example 7: Japanese Era Conversion
console.log('\n=== Japanese Era Conversion ===');
const japaneseYear = toJapaneseYear(2024);
console.log(`Western Year 2024 = ${japaneseYear?.formatted}`); // 令和6年
console.log(`Era: ${japaneseYear?.eraName} (${japaneseYear?.eraNameJa})`); // Reiwa (令和)

// Example 8: Japanese Date Formatting
console.log('\n=== Japanese Date Formatting ===');
const today = new Date('2024-12-03');
console.log(formatJapaneseDate(today, 'full')); // 令和6年12月3日
console.log(formatJapaneseDate(today, 'short')); // R6.12.3
console.log(formatJapaneseDate(today, 'year-only')); // 令和6年

// Example 9: Fiscal Quarters
console.log('\n=== Fiscal Quarters ===');
const quarters = fiscalYearService.getFiscalQuarters(2024);
quarters.forEach((q, i) => {
  console.log(`Q${i + 1}: ${q.startDate.toLocaleDateString('ja-JP')} - ${q.endDate.toLocaleDateString('ja-JP')}`);
});

// Example 10: Constants Reference
console.log('\n=== JPY Constants ===');
console.log(`Currency Code: ${JPY_CONSTANTS.code}`);
console.log(`Symbol: ${JPY_CONSTANTS.symbol}`);
console.log(`Decimal Digits: ${JPY_CONSTANTS.decimalDigits}`);
console.log(`万 (man): ${JPY_CONSTANTS.largeNumbers.man.toLocaleString()}`);
console.log(`億 (oku): ${JPY_CONSTANTS.largeNumbers.oku.toLocaleString()}`);
