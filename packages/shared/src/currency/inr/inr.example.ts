/**
 * INR Currency Formatter Examples
 * Demonstrates usage of Indian Rupee formatting utilities
 */

import {
  formatINR,
  parseINR,
  formatINRCompact,
  formatINRInWords,
  formatINRWithUnit,
  getAmountInLakhs,
  getAmountInCrores,
} from './inr.formatter';

/**
 * Example 1: Basic formatting with Indian numbering system
 */
export function basicFormatting() {
  console.log('=== Basic INR Formatting ===');

  // Small amounts
  console.log(formatINR(1000)); // ₹1,000.00
  console.log(formatINR(50000)); // ₹50,000.00

  // Lakhs (1,00,000 = 1 lakh)
  console.log(formatINR(100000)); // ₹1,00,000.00
  console.log(formatINR(500000)); // ₹5,00,000.00

  // Crores (1,00,00,000 = 1 crore)
  console.log(formatINR(10000000)); // ₹1,00,00,000.00
  console.log(formatINR(50000000)); // ₹5,00,00,000.00

  // Mixed amounts
  console.log(formatINR(1234567.89)); // ₹12,34,567.89
}

/**
 * Example 2: Formatting options
 */
export function formattingOptions() {
  console.log('=== Formatting Options ===');

  const amount = 100000;

  // Without symbol
  console.log(formatINR(amount, { includeSymbol: false })); // 1,00,000.00

  // Alternative symbol (Rs.)
  console.log(formatINR(amount, { useAlternativeSymbol: true })); // Rs.1,00,000.00

  // Different decimal places
  console.log(formatINR(amount, { decimals: 0 })); // ₹1,00,000
  console.log(formatINR(amount, { decimals: 1 })); // ₹1,00,000.0

  // Devanagari numerals (Hindi)
  console.log(formatINR(amount, { useDevanagariNumerals: true })); // ₹१,००,०००.००
}

/**
 * Example 3: Compact formatting (for UI)
 */
export function compactFormatting() {
  console.log('=== Compact Formatting ===');

  console.log(formatINRCompact(1500)); // ₹1.5K
  console.log(formatINRCompact(50000)); // ₹50.0K
  console.log(formatINRCompact(150000)); // ₹1.5L (1.5 lakhs)
  console.log(formatINRCompact(2500000)); // ₹25.0L (25 lakhs)
  console.log(formatINRCompact(15000000)); // ₹1.5Cr (1.5 crores)
  console.log(formatINRCompact(250000000)); // ₹25Cr (25 crores)
}

/**
 * Example 4: Formatting with units (for reports)
 */
export function unitFormatting() {
  console.log('=== Unit Formatting ===');

  console.log(formatINRWithUnit(50000)); // ₹50,000.00
  console.log(formatINRWithUnit(100000)); // ₹1.00 Lakh
  console.log(formatINRWithUnit(500000)); // ₹5.00 Lakhs
  console.log(formatINRWithUnit(10000000)); // ₹1.00 Crore
  console.log(formatINRWithUnit(50000000)); // ₹5.00 Crores
}

/**
 * Example 5: Number to words (for invoices)
 */
export function numberToWords() {
  console.log('=== Number to Words ===');

  // English
  console.log(formatINRInWords(1234.56, 'en'));
  // One thousand two hundred thirty-four Indian Rupees and Fifty-six Paise Only

  console.log(formatINRInWords(100000, 'en'));
  // One lakh Indian Rupees Only

  console.log(formatINRInWords(10000000, 'en'));
  // One crore Indian Rupees Only

  // Hindi
  console.log(formatINRInWords(1234.56, 'hi'));
  // एक हज़ार दो सौ चौंतीस रुपये और छप्पन पैसे मात्र

  console.log(formatINRInWords(100000, 'hi'));
  // एक लाख रुपये मात्र
}

/**
 * Example 6: Parsing INR strings
 */
export function parsing() {
  console.log('=== Parsing INR Strings ===');

  console.log(parseINR('₹1,000.00')); // 1000
  console.log(parseINR('₹1,00,000.00')); // 100000
  console.log(parseINR('Rs. 5,00,000')); // 500000
  console.log(parseINR('INR 10,00,000')); // 1000000
  console.log(parseINR('₹१,००,०००')); // 100000 (Devanagari)
}

/**
 * Example 7: Converting to lakhs and crores
 */
export function convertingUnits() {
  console.log('=== Converting to Lakhs/Crores ===');

  const amount = 5000000; // 50 lakhs = 5 crores

  console.log(`Amount: ${formatINR(amount)}`); // ₹50,00,000.00
  console.log(`In Lakhs: ${getAmountInLakhs(amount)} lakhs`); // 50 lakhs
  console.log(`In Crores: ${getAmountInCrores(amount)} crores`); // 0.5 crores
}

/**
 * Example 8: Invoice formatting
 */
export function invoiceExample() {
  console.log('=== Invoice Example ===');

  const amount = 123456.78;

  console.log('Amount:', formatINR(amount));
  console.log('In Words (English):', formatINRInWords(amount, 'en'));
  console.log('In Words (Hindi):', formatINRInWords(amount, 'hi'));

  // Invoice display:
  // Amount: ₹1,23,456.78
  // In Words: One lakh twenty-three thousand four hundred fifty-six Indian Rupees
  //           and Seventy-eight Paise Only
}

/**
 * Example 9: Financial reports
 */
export function financialReport() {
  console.log('=== Financial Report Example ===');

  const revenue = 125000000; // 12.5 crores
  const expenses = 87500000; // 8.75 crores
  const profit = revenue - expenses; // 3.75 crores

  console.log('Revenue:', formatINRWithUnit(revenue, 2)); // ₹12.50 Crores
  console.log('Expenses:', formatINRWithUnit(expenses, 2)); // ₹8.75 Crores
  console.log('Profit:', formatINRWithUnit(profit, 2)); // ₹3.75 Crores

  // Compact for dashboards
  console.log('\nDashboard View:');
  console.log('Revenue:', formatINRCompact(revenue)); // ₹12.5Cr
  console.log('Expenses:', formatINRCompact(expenses)); // ₹8.8Cr
  console.log('Profit:', formatINRCompact(profit)); // ₹3.8Cr
}

/**
 * Example 10: GST invoice
 */
export function gstInvoice() {
  console.log('=== GST Invoice Example ===');

  const subtotal = 100000; // ₹1,00,000
  const cgst = subtotal * 0.09; // 9% CGST
  const sgst = subtotal * 0.09; // 9% SGST
  const total = subtotal + cgst + sgst;

  console.log('Subtotal:', formatINR(subtotal)); // ₹1,00,000.00
  console.log('CGST @ 9%:', formatINR(cgst)); // ₹9,000.00
  console.log('SGST @ 9%:', formatINR(sgst)); // ₹9,000.00
  console.log('Total:', formatINR(total)); // ₹1,18,000.00
  console.log('\nTotal in Words:', formatINRInWords(total, 'en'));
  // One lakh eighteen thousand Indian Rupees Only
}

/**
 * Example 11: Salary slip
 */
export function salarySlip() {
  console.log('=== Salary Slip Example ===');

  const basicSalary = 50000; // ₹50,000
  const hra = 20000; // ₹20,000
  const specialAllowance = 10000; // ₹10,000
  const grossSalary = basicSalary + hra + specialAllowance;

  const pf = basicSalary * 0.12; // 12% PF
  const tax = 5000; // TDS
  const netSalary = grossSalary - pf - tax;

  console.log('Basic Salary:', formatINR(basicSalary));
  console.log('HRA:', formatINR(hra));
  console.log('Special Allowance:', formatINR(specialAllowance));
  console.log('Gross Salary:', formatINR(grossSalary));
  console.log('\nDeductions:');
  console.log('PF:', formatINR(pf));
  console.log('TDS:', formatINR(tax));
  console.log('\nNet Salary:', formatINR(netSalary));
  console.log('In Words:', formatINRInWords(netSalary, 'en'));
}

/**
 * Run all examples
 */
export function runAllExamples() {
  basicFormatting();
  console.log('\n');
  formattingOptions();
  console.log('\n');
  compactFormatting();
  console.log('\n');
  unitFormatting();
  console.log('\n');
  numberToWords();
  console.log('\n');
  parsing();
  console.log('\n');
  convertingUnits();
  console.log('\n');
  invoiceExample();
  console.log('\n');
  financialReport();
  console.log('\n');
  gstInvoice();
  console.log('\n');
  salarySlip();
}

// Uncomment to run examples
// runAllExamples();
