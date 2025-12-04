// Test imports to verify exports are working
import {
  formatJPY,
  parseJPY,
  formatJPYCompact,
  validateJPYAmount,
  JPY_CONSTANTS,
  JPY_RATE_PAIRS,
  convertCurrency,
  createStandardJapaneseFiscalYear,
  toJapaneseYear,
  formatJapaneseDate,
  getCurrentJapaneseYear,
} from './src';

console.log('✓ All imports successful!');

// Quick functionality test
const formatted = formatJPY(1234567);
console.log('JPY Format Test:', formatted);

const fiscalYear = createStandardJapaneseFiscalYear();
const currentFY = fiscalYear.getCurrentFiscalYear();
console.log('Fiscal Year Test:', currentFY.formatted);

const japYear = toJapaneseYear(2024);
console.log('Era Conversion Test:', japYear?.formatted);
