/**
 * Tax Liability Tracker Service - Usage Examples
 *
 * This file demonstrates how to use the TaxLiabilityTrackerService
 * to calculate real-time tax estimates for German freelancers/small businesses.
 */

import { TaxLiabilityTrackerService } from './tax-liability-tracker.service';
import { TaxDeductionAnalyzerService } from './tax-deduction-analyzer.service';
import { PrismaService } from '../../database/prisma.service';

/**
 * Example: Calculate full tax liability for current year
 */
async function example1_CalculateTaxLiability() {
  const prisma = new PrismaService();
  const taxDeductionAnalyzer = new TaxDeductionAnalyzerService(prisma);
  const tracker = new TaxLiabilityTrackerService(prisma, taxDeductionAnalyzer);

  const orgId = 'org_123';
  const year = 2025;

  const liability = await tracker.calculateTaxLiability(orgId, year);

  console.log('Tax Liability for', year);
  console.log('=====================================');
  console.log('Income:');
  console.log(`  Total Revenue: €${liability.income.totalRevenue / 100}`);
  console.log(`  Total Deductions: €${liability.income.totalDeductions / 100}`);
  console.log(`  Net Profit: €${liability.income.netProfit / 100}`);
  console.log('');
  console.log('Income Tax:');
  console.log(`  Taxable Income: €${liability.incomeTax.taxableIncome / 100}`);
  console.log(`  Estimated Tax: €${liability.incomeTax.estimatedTax / 100}`);
  console.log(`  Effective Rate: ${(liability.incomeTax.effectiveRate * 100).toFixed(1)}%`);
  console.log(`  Bracket: ${liability.incomeTax.bracket}`);
  console.log(`  Already Paid: €${liability.incomeTax.alreadyPaid / 100}`);
  console.log(`  Still Owed: €${liability.incomeTax.stillOwed / 100}`);
  console.log('');
  console.log('VAT:');
  console.log(`  Collected: €${liability.vat.collectedVat / 100}`);
  console.log(`  Paid: €${liability.vat.paidVat / 100}`);
  console.log(`  Net Due: €${liability.vat.netVatDue / 100}`);
  console.log(`  Already Submitted: €${liability.vat.alreadySubmitted / 100}`);
  console.log(`  Still Owed: €${liability.vat.stillOwed / 100}`);
  console.log('');
  console.log('Total:');
  console.log(`  Total Tax: €${liability.total.estimatedTotalTax / 100}`);
  console.log(`  Already Paid: €${liability.total.alreadyPaid / 100}`);
  console.log(`  Still Owed: €${liability.total.stillOwed / 100}`);
  console.log(
    `  Next Payment: €${liability.total.nextPaymentAmount / 100} due ${liability.total.nextPaymentDue?.toLocaleDateString('de-DE')}`,
  );
  console.log('');
  console.log(`Confidence: ${(liability.confidence * 100).toFixed(0)}%`);
  console.log('Notes:', liability.notes);

  /*
   * Example Output:
   * Tax Liability for 2025
   * =====================================
   * Income:
   *   Total Revenue: €85000
   *   Total Deductions: €25000
   *   Net Profit: €60000
   *
   * Income Tax:
   *   Taxable Income: €60000
   *   Estimated Tax: €14532
   *   Effective Rate: 24.2%
   *   Bracket: Progressionszone 2 (24%-42%)
   *   Already Paid: €8000
   *   Still Owed: €6532
   *
   * VAT:
   *   Collected: €16150
   *   Paid: €4750
   *   Net Due: €11400
   *   Already Submitted: €8550
   *   Still Owed: €2850
   *
   * Total:
   *   Total Tax: €26732
   *   Already Paid: €16550
   *   Still Owed: €10182
   *   Next Payment: €2850 due 10.04.2025
   *
   * Confidence: 85%
   * Notes: ['Schätzung basierend auf 9 Monaten von 2025']
   */
}

/**
 * Example: Get quarterly tax estimates
 */
async function example2_QuarterlyEstimates() {
  const prisma = new PrismaService();
  const taxDeductionAnalyzer = new TaxDeductionAnalyzerService(prisma);
  const tracker = new TaxLiabilityTrackerService(prisma, taxDeductionAnalyzer);

  const orgId = 'org_123';
  const year = 2025;

  const quarters = await tracker.getQuarterlyEstimates(orgId, year);

  console.log('Quarterly Tax Estimates for', year);
  console.log('=====================================');

  for (const q of quarters) {
    console.log(`Q${q.quarter} ${q.year} (${q.status})`);
    console.log(`  Revenue: €${q.revenue / 100}`);
    console.log(`  Expenses: €${q.expenses / 100}`);
    console.log(`  Net Profit: €${q.netProfit / 100}`);
    console.log(`  Estimated Income Tax: €${q.estimatedIncomeTax / 100}`);
    console.log(`  VAT Collected: €${q.vatCollected / 100}`);
    console.log(`  VAT Paid: €${q.vatPaid / 100}`);
    console.log(`  Net VAT: €${q.netVat / 100}`);
    console.log('');
  }

  /*
   * Example Output:
   * Quarterly Tax Estimates for 2025
   * =====================================
   * Q1 2025 (completed)
   *   Revenue: €22000
   *   Expenses: €6500
   *   Net Profit: €15500
   *   Estimated Income Tax: €3650
   *   VAT Collected: €4180
   *   VAT Paid: €1235
   *   Net VAT: €2945
   *
   * Q2 2025 (completed)
   *   Revenue: €21500
   *   Expenses: €6200
   *   Net Profit: €15300
   *   Estimated Income Tax: €3600
   *   VAT Collected: €4085
   *   VAT Paid: €1178
   *   Net VAT: €2907
   *
   * Q3 2025 (in_progress)
   *   Revenue: €18500
   *   Expenses: €5800
   *   Net Profit: €12700
   *   Estimated Income Tax: €2982
   *   VAT Collected: €3515
   *   VAT Paid: €1102
   *   Net VAT: €2413
   *
   * Q4 2025 (projected)
   *   Revenue: €23000
   *   Expenses: €6500
   *   Net Profit: €16500
   *   Estimated Income Tax: €3900
   *   VAT Collected: €4370
   *   VAT Paid: €1235
   *   Net VAT: €3135
   */
}

/**
 * Example: Get VAT summary (quarterly)
 */
async function example3_VatSummaryQuarterly() {
  const prisma = new PrismaService();
  const taxDeductionAnalyzer = new TaxDeductionAnalyzerService(prisma);
  const tracker = new TaxLiabilityTrackerService(prisma, taxDeductionAnalyzer);

  const orgId = 'org_123';
  const year = 2025;

  const vatSummary = await tracker.getVatSummary(orgId, 'quarterly', year);

  console.log('VAT Summary (Quarterly) for', year);
  console.log('=====================================');
  console.log(`Total Collected: €${vatSummary.totalCollected / 100}`);
  console.log(`Total Paid: €${vatSummary.totalPaid / 100}`);
  console.log(`Net Due: €${vatSummary.netDue / 100}`);
  console.log(
    `Next Deadline: ${vatSummary.nextDeadline?.toLocaleDateString('de-DE')}`,
  );
  console.log(`Next Amount: €${vatSummary.nextAmount / 100}`);
  console.log('');

  console.log('Period Breakdown:');
  for (const period of vatSummary.periods) {
    console.log(`${period.label} (${period.status})`);
    console.log(`  Invoices Issued: ${period.invoicesIssued}`);
    console.log(`  VAT Collected: €${period.vatCollected / 100}`);
    console.log(`  Expenses Claimed: ${period.expensesClaimed}`);
    console.log(`  VAT Paid: €${period.vatPaid / 100}`);
    console.log(`  Net VAT: €${period.netVat / 100}`);
    console.log(
      `  Deadline: ${period.submissionDeadline.toLocaleDateString('de-DE')}`,
    );
    console.log('');
  }

  /*
   * Example Output:
   * VAT Summary (Quarterly) for 2025
   * =====================================
   * Total Collected: €16150
   * Total Paid: €4750
   * Net Due: €11400
   * Next Deadline: 10.10.2025
   * Next Amount: €2413
   *
   * Period Breakdown:
   * Q1 2025 (submitted)
   *   Invoices Issued: 28
   *   VAT Collected: €4180
   *   Expenses Claimed: 45
   *   VAT Paid: €1235
   *   Net VAT: €2945
   *   Deadline: 10.04.2025
   *
   * Q2 2025 (submitted)
   *   Invoices Issued: 26
   *   VAT Collected: €4085
   *   Expenses Claimed: 42
   *   VAT Paid: €1178
   *   Net VAT: €2907
   *   Deadline: 10.07.2025
   *
   * Q3 2025 (due)
   *   Invoices Issued: 24
   *   VAT Collected: €3515
   *   Expenses Claimed: 38
   *   VAT Paid: €1102
   *   Net VAT: €2413
   *   Deadline: 10.10.2025
   *
   * Q4 2025 (upcoming)
   *   Invoices Issued: 0
   *   VAT Collected: €0
   *   Expenses Claimed: 0
   *   VAT Paid: €0
   *   Net VAT: €0
   *   Deadline: 10.01.2026
   */
}

/**
 * Example: Get deductions summary
 */
async function example4_DeductionsSummary() {
  const prisma = new PrismaService();
  const taxDeductionAnalyzer = new TaxDeductionAnalyzerService(prisma);
  const tracker = new TaxLiabilityTrackerService(prisma, taxDeductionAnalyzer);

  const orgId = 'org_123';
  const year = 2025;

  const deductions = await tracker.getDeductionsSummary(orgId, year);

  console.log('Deductions Summary for', year);
  console.log('=====================================');
  console.log(`Total Deductions: €${deductions.totalDeductions / 100}`);
  console.log('');

  console.log('By Category:');
  for (const cat of deductions.categories) {
    console.log(`${cat.category} (EÜR Line ${cat.eurLine})`);
    console.log(`  Amount: €${cat.amount / 100}`);
    console.log(`  Transactions: ${cat.transactionCount}`);
    console.log(`  Deduction Rate: ${(cat.deductionRate * 100).toFixed(0)}%`);
    console.log(`  Effective Deduction: €${cat.effectiveDeduction / 100}`);
    console.log('');
  }

  console.log('Special Items:');
  for (const item of deductions.specialItems) {
    console.log(`${item.name}`);
    console.log(`  Amount: €${item.amount / 100}`);
    if (item.limit) {
      console.log(`  Limit: €${item.limit / 100}`);
    }
    console.log(`  Claimed: €${item.claimed / 100}`);
    if (item.remaining !== null) {
      console.log(`  Remaining: €${item.remaining / 100}`);
    }
    console.log(`  Note: ${item.note}`);
    console.log('');
  }

  /*
   * Example Output:
   * Deductions Summary for 2025
   * =====================================
   * Total Deductions: €25000
   *
   * By Category:
   * Telefon, Internet, Porto (EÜR Line 27)
   *   Amount: €1200
   *   Transactions: 12
   *   Deduction Rate: 50%
   *   Effective Deduction: €600
   *
   * Kfz-Kosten (EÜR Line 24)
   *   Amount: €4500
   *   Transactions: 24
   *   Deduction Rate: 70%
   *   Effective Deduction: €3150
   *
   * Sonstige unbeschränkt abziehbare Betriebsausgaben (EÜR Line 20)
   *   Amount: €18500
   *   Transactions: 142
   *   Deduction Rate: 100%
   *   Effective Deduction: €18500
   *
   * Bewirtungskosten (EÜR Line 26)
   *   Amount: €1500
   *   Transactions: 8
   *   Deduction Rate: 70%
   *   Effective Deduction: €1050
   *
   * Special Items:
   * Häusliches Arbeitszimmer
   *   Amount: €2400
   *   Limit: €1260
   *   Claimed: €1260
   *   Remaining: €0
   *   Note: Pauschale 1.260€/Jahr oder anteilige Miete
   *
   * Bewirtungskosten
   *   Amount: €1500
   *   Claimed: €1050
   *   Note: Nur 70% abzugsfähig
   */
}

/**
 * Example: Get tax alerts
 */
async function example5_TaxAlerts() {
  const prisma = new PrismaService();
  const taxDeductionAnalyzer = new TaxDeductionAnalyzerService(prisma);
  const tracker = new TaxLiabilityTrackerService(prisma, taxDeductionAnalyzer);

  const orgId = 'org_123';

  const alerts = await tracker.getTaxAlerts(orgId);

  console.log('Tax Alerts');
  console.log('=====================================');

  for (const alert of alerts) {
    const icon =
      alert.severity === 'urgent' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${icon} ${alert.title} (${alert.type})`);
    console.log(`   ${alert.message}`);
    if (alert.dueDate) {
      console.log(`   Due: ${alert.dueDate.toLocaleDateString('de-DE')}`);
    }
    if (alert.amount) {
      console.log(`   Amount: €${alert.amount / 100}`);
    }
    console.log(`   Action: ${alert.actionRequired}`);
    console.log('');
  }

  /*
   * Example Output:
   * Tax Alerts
   * =====================================
   * 🚨 Umsatzsteuervoranmeldung fällig (deadline)
   *    Die Umsatzsteuervoranmeldung für Q3 ist am 10.10.2025 fällig
   *    Due: 10.10.2025
   *    Amount: €2413
   *    Action: ELSTER-Formular einreichen
   *
   * ⚠️ Einkommensteuer-Vorauszahlung fällig (payment_due)
   *    Vorauszahlung für Q4 fällig am 10.12.2025
   *    Due: 10.12.2025
   *    Action: Vorauszahlung überweisen
   *
   * ℹ️ Quartalszahlen aktualisieren (quarterly_estimate)
   *    Überprüfen Sie Ihre Steuerschätzung für Q4
   *    Action: Einnahmen und Ausgaben überprüfen
   */
}

/**
 * Example: Calculate with options (Kleinunternehmer)
 */
async function example6_KleinunternehmerCalculation() {
  const prisma = new PrismaService();
  const taxDeductionAnalyzer = new TaxDeductionAnalyzerService(prisma);
  const tracker = new TaxLiabilityTrackerService(prisma, taxDeductionAnalyzer);

  const orgId = 'org_123';
  const year = 2025;

  const liability = await tracker.calculateTaxLiability(orgId, year, {
    isKleinunternehmer: true, // Small business VAT exempt
    vatFrequency: 'yearly',
  });

  console.log('Tax Liability for Kleinunternehmer');
  console.log('=====================================');
  console.log(`Net Profit: €${liability.income.netProfit / 100}`);
  console.log(`Income Tax: €${liability.incomeTax.estimatedTax / 100}`);
  console.log(`VAT: €${liability.vat.netVatDue / 100} (exempt)`);
  console.log('Notes:', liability.notes);

  /*
   * Example Output:
   * Tax Liability for Kleinunternehmer
   * =====================================
   * Net Profit: €18500
   * Income Tax: €2850
   * VAT: €0 (exempt)
   * Notes: ['Kleinunternehmerregelung (§19 UStG) - keine MwSt']
   */
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('===== Example 1: Calculate Tax Liability =====\n');
  await example1_CalculateTaxLiability();

  console.log('\n\n===== Example 2: Quarterly Estimates =====\n');
  await example2_QuarterlyEstimates();

  console.log('\n\n===== Example 3: VAT Summary (Quarterly) =====\n');
  await example3_VatSummaryQuarterly();

  console.log('\n\n===== Example 4: Deductions Summary =====\n');
  await example4_DeductionsSummary();

  console.log('\n\n===== Example 5: Tax Alerts =====\n');
  await example5_TaxAlerts();

  console.log('\n\n===== Example 6: Kleinunternehmer Calculation =====\n');
  await example6_KleinunternehmerCalculation();
}

// Uncomment to run examples
// runAllExamples().catch(console.error);
