/**
 * Example usage of RecurringDetectorService
 * Demonstrates how to detect and analyze recurring transactions
 */

import { RecurringDetectorService } from './recurring-detector.service';
import { PrismaService } from '@/modules/database/prisma.service';

async function exampleUsage() {
  // Initialize service (in real app, get from NestJS DI)
  // This is conceptual - in practice use dependency injection
  const prisma = {} as PrismaService;
  const recurringDetector = new RecurringDetectorService(prisma);

  const organizationId = 'org_123';

  console.log('=== Recurring Transaction Detector Examples ===\n');

  // Example 1: Detect all recurring transactions
  console.log('Example 1: Detect all recurring transactions');
  const patterns = await recurringDetector.detectRecurringTransactions(organizationId, {
    minOccurrences: 2,
    lookbackDays: 365,
    minConfidence: 70,
    activeOnly: true,
  });

  console.log(`Found ${patterns.length} recurring patterns:\n`);
  patterns.slice(0, 5).forEach((pattern) => {
    console.log(`Vendor: ${pattern.vendorName}`);
    console.log(`Frequency: ${pattern.frequency}`);
    console.log(`Average Amount: €${(pattern.averageAmount / 100).toFixed(2)}`);
    console.log(`Occurrences: ${pattern.occurrences}`);
    console.log(`Confidence: ${pattern.confidence}%`);
    console.log(`Next Expected: ${pattern.nextExpected.toISOString().split('T')[0]}`);
    console.log(`Status: ${pattern.status}`);
    console.log('---');
  });

  // Example 2: Analyze specific vendor
  console.log('\nExample 2: Analyze specific vendor (AWS)');
  const awsPattern = await recurringDetector.analyzeVendorPattern(
    organizationId,
    'Amazon Web Services',
  );

  if (awsPattern) {
    console.log('AWS Subscription Pattern:');
    console.log(`- Frequency: ${awsPattern.frequency}`);
    console.log(`- Average: €${(awsPattern.averageAmount / 100).toFixed(2)}`);
    console.log(`- Range: €${(awsPattern.minAmount / 100).toFixed(2)} - €${(awsPattern.maxAmount / 100).toFixed(2)}`);
    console.log(`- Next Payment: ${awsPattern.nextExpected.toISOString().split('T')[0]}`);
    console.log(`- Annual Cost: €${((awsPattern.averageAmount * 12) / 100).toFixed(2)}`);
    console.log(`- Transaction History (${awsPattern.occurrences} payments):`);
    awsPattern.transactions.forEach((tx) => {
      console.log(`  ${tx.date.toISOString().split('T')[0]}: €${(tx.amount / 100).toFixed(2)}`);
    });
  } else {
    console.log('No AWS subscription found');
  }

  // Example 3: Predict upcoming payments (next 30 days)
  console.log('\nExample 3: Upcoming payments in next 30 days');
  const upcomingPayments = await recurringDetector.predictNextPayments(
    organizationId,
    30,
  );

  console.log(`${upcomingPayments.length} payments expected:\n`);
  upcomingPayments.forEach((payment) => {
    console.log(`${payment.vendorName}`);
    console.log(`  Due: ${payment.expectedDate.toISOString().split('T')[0]} (${payment.daysTillDue} days)`);
    console.log(`  Amount: €${(payment.expectedAmount / 100).toFixed(2)}`);
    console.log(`  Frequency: ${payment.frequency}`);
    console.log(`  Confidence: ${payment.confidence}%`);
    console.log('---');
  });

  // Example 4: Get comprehensive summary
  console.log('\nExample 4: Recurring expense summary');
  const summary = await recurringDetector.getRecurringSummary(organizationId);

  console.log('Monthly Recurring Expenses Summary:');
  console.log(`Total Monthly: €${(summary.totalMonthlyRecurring / 100).toFixed(2)}`);
  console.log(`Total Yearly: €${(summary.totalYearlyRecurring / 100).toFixed(2)}`);
  console.log(`Active Subscriptions: ${summary.subscriptionCount}`);
  console.log('\nBreakdown by Category:');
  summary.categories.forEach((cat) => {
    console.log(`\n${cat.category}:`);
    console.log(`  Monthly: €${(cat.monthlyTotal / 100).toFixed(2)}`);
    console.log(`  Yearly: €${(cat.yearlyTotal / 100).toFixed(2)}`);
    console.log(`  Count: ${cat.count}`);
    console.log('  Services:');
    cat.patterns.forEach((p) => {
      console.log(`    - ${p.vendorName} (${p.frequency}): €${(p.averageAmount / 100).toFixed(2)}`);
    });
  });

  console.log('\nTop 5 Recurring Expenses:');
  summary.topRecurringExpenses.slice(0, 5).forEach((pattern, idx) => {
    const annualCost =
      pattern.frequency === 'monthly'
        ? pattern.averageAmount * 12
        : pattern.frequency === 'quarterly'
          ? pattern.averageAmount * 4
          : pattern.frequency === 'yearly'
            ? pattern.averageAmount
            : pattern.averageAmount * 52; // weekly

    console.log(`${idx + 1}. ${pattern.vendorName}`);
    console.log(`   €${(annualCost / 100).toFixed(2)}/year (${pattern.frequency})`);
  });

  if (summary.potentialSavings && summary.potentialSavings.length > 0) {
    console.log('\nPotential Savings Opportunities:');
    summary.potentialSavings.forEach((saving) => {
      console.log(`- ${saving.vendor}`);
      console.log(`  Current: €${(saving.currentMonthlyAmount / 100).toFixed(2)}/month`);
      console.log(`  ${saving.suggestion}`);
      console.log(`  Potential savings: €${(saving.potentialSavingsPerYear / 100).toFixed(2)}/year`);
    });
  }

  if (summary.insights && summary.insights.length > 0) {
    console.log('\nInsights:');
    summary.insights.forEach((insight) => {
      console.log(`\n[${insight.type}]`);
      console.log(`${insight.message}`);
      console.log(`Affected: ${insight.affectedVendors.join(', ')}`);
      if (insight.potentialSavings) {
        console.log(`Potential savings: €${(insight.potentialSavings / 100).toFixed(2)}/year`);
      }
    });
  }

  // Example 5: Detect subscriptions in specific categories
  console.log('\n\nExample 5: Filter by specific criteria');

  const cloudServices = patterns.filter(
    (p) => p.category === 'Cloud Services',
  );
  console.log(`Cloud Services (${cloudServices.length}):`);
  cloudServices.forEach((p) => {
    const monthlyCost =
      p.frequency === 'monthly' ? p.averageAmount : p.averageAmount / 12;
    console.log(`- ${p.vendorName}: €${(monthlyCost / 100).toFixed(2)}/month`);
  });

  const highConfidence = patterns.filter((p) => p.confidence >= 90);
  console.log(`\nHigh Confidence Patterns (${highConfidence.length}):`);
  highConfidence.forEach((p) => {
    console.log(`- ${p.vendorName} (${p.confidence}% confidence)`);
  });

  // Example 6: Identify irregular patterns that might need review
  const irregularPatterns = patterns.filter((p) => p.confidence < 70);
  if (irregularPatterns.length > 0) {
    console.log(`\n\nIrregular Patterns Requiring Review (${irregularPatterns.length}):`);
    irregularPatterns.forEach((p) => {
      console.log(`- ${p.vendorName}`);
      console.log(`  Confidence: ${p.confidence}%`);
      console.log(`  Interval StdDev: ${p.intervalStdDev?.toFixed(1)} days`);
      console.log(`  Amount StdDev: €${((p.amountStdDev || 0) / 100).toFixed(2)}`);
    });
  }

  // Example output format
  console.log('\n\n=== Example Pattern Object ===');
  if (patterns.length > 0) {
    console.log(JSON.stringify(patterns[0], null, 2));
  }
}

/**
 * Example: Integration with chat/dashboard
 */
async function chatIntegrationExample() {
  const prisma = {} as PrismaService;
  const recurringDetector = new RecurringDetectorService(prisma);
  const organizationId = 'org_123';

  // Use case 1: Dashboard widget showing upcoming bills
  const upcomingWeek = await recurringDetector.predictNextPayments(
    organizationId,
    7,
  );

  const dashboardWidget = {
    title: 'Upcoming Bills This Week',
    total: upcomingWeek.reduce((sum, p) => sum + p.expectedAmount, 0),
    count: upcomingWeek.length,
    items: upcomingWeek.map((p) => ({
      vendor: p.vendorName,
      date: p.expectedDate,
      amount: p.expectedAmount,
      daysUntil: p.daysTillDue,
    })),
  };

  console.log('Dashboard Widget Data:', dashboardWidget);

  // Use case 2: Chat suggestion
  const summary = await recurringDetector.getRecurringSummary(organizationId);

  const chatSuggestion = {
    message: `You're spending €${(summary.totalMonthlyRecurring / 100).toFixed(2)}/month on ${summary.subscriptionCount} subscriptions.`,
    insights: summary.insights?.map((i) => i.message),
    action: 'Review subscriptions',
  };

  console.log('\nChat Suggestion:', chatSuggestion);

  // Use case 3: Budget planning
  const budgetByCategory = summary.categories.map((cat) => ({
    category: cat.category,
    monthlyBudget: cat.monthlyTotal,
    yearlyBudget: cat.yearlyTotal,
    subscriptions: cat.count,
  }));

  console.log('\nBudget Planning Data:', budgetByCategory);
}

/**
 * Example: Subscription audit report
 */
async function subscriptionAuditReport() {
  const prisma = {} as PrismaService;
  const recurringDetector = new RecurringDetectorService(prisma);
  const organizationId = 'org_123';

  const summary = await recurringDetector.getRecurringSummary(organizationId);

  console.log('\n=== SUBSCRIPTION AUDIT REPORT ===');
  console.log(`Generated: ${new Date().toISOString()}`);
  console.log(`Organization: ${organizationId}`);
  console.log('\n1. OVERVIEW');
  console.log(`   Active Subscriptions: ${summary.subscriptionCount}`);
  console.log(`   Monthly Total: €${(summary.totalMonthlyRecurring / 100).toFixed(2)}`);
  console.log(`   Annual Total: €${(summary.totalYearlyRecurring / 100).toFixed(2)}`);

  console.log('\n2. CATEGORY BREAKDOWN');
  summary.categories.forEach((cat, idx) => {
    console.log(`   ${idx + 1}. ${cat.category}`);
    console.log(`      Monthly: €${(cat.monthlyTotal / 100).toFixed(2)}`);
    console.log(`      Count: ${cat.count}`);
    console.log(
      `      Average: €${((cat.monthlyTotal / cat.count) / 100).toFixed(2)} per service`,
    );
  });

  console.log('\n3. LARGEST EXPENSES');
  summary.topRecurringExpenses.slice(0, 10).forEach((pattern, idx) => {
    console.log(`   ${idx + 1}. ${pattern.vendorName}`);
    console.log(`      ${pattern.frequency} - €${(pattern.averageAmount / 100).toFixed(2)}`);
    console.log(`      Tax Category: ${pattern.taxCategory || 'N/A'}`);
  });

  console.log('\n4. UPCOMING OBLIGATIONS (30 days)');
  summary.upcomingMonth.forEach((payment) => {
    console.log(`   ${payment.expectedDate.toISOString().split('T')[0]}: ${payment.vendorName}`);
    console.log(`      €${(payment.expectedAmount / 100).toFixed(2)}`);
  });

  if (summary.insights && summary.insights.length > 0) {
    console.log('\n5. RECOMMENDATIONS');
    summary.insights.forEach((insight, idx) => {
      console.log(`   ${idx + 1}. ${insight.message}`);
      if (insight.potentialSavings) {
        console.log(
          `      Potential Savings: €${(insight.potentialSavings / 100).toFixed(2)}/year`,
        );
      }
    });
  }

  console.log('\n=== END REPORT ===\n');
}

// Run examples if this file is executed directly
if (require.main === module) {
  exampleUsage()
    .then(() => chatIntegrationExample())
    .then(() => subscriptionAuditReport())
    .catch(console.error)
    .finally(() => process.exit(0));
}

export { exampleUsage, chatIntegrationExample, subscriptionAuditReport };
