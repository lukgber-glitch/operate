/**
 * Verification Script: Cascade Rules
 *
 * Verifies that all 26 cascade rule fixes have been applied correctly
 * Run after schema changes to ensure no regressions
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf-8');

const EXPECTED_FIXES = [
  // User relations (SetNull)
  { model: 'Membership', field: 'user', relation: 'User', expected: 'Cascade' },
  { model: 'Session', field: 'user', relation: 'User', expected: 'Cascade' },
  { model: 'Employee', field: 'user', relation: 'User', expected: 'SetNull' },
  { model: 'LeaveRequest', field: 'reviewer', relation: 'User', expected: 'SetNull' },
  { model: 'TimeEntry', field: 'approver', relation: 'User', expected: 'SetNull' },
  { model: 'PayrollPeriod', field: 'processor', relation: 'User', expected: 'SetNull' },
  { model: 'TransactionClassificationReview', field: 'reviewer', relation: 'User', expected: 'SetNull' },
  { model: 'DeductionSuggestion', field: 'confirmer', relation: 'User', expected: 'SetNull' },
  { model: 'DeductionSuggestion', field: 'rejecter', relation: 'User', expected: 'SetNull' },
  { model: 'DeductionSuggestion', field: 'modifier', relation: 'User', expected: 'SetNull' },
  { model: 'FraudAlert', field: 'resolver', relation: 'User', expected: 'SetNull' },
  { model: 'FraudAuditLog', field: 'performer', relation: 'User', expected: 'SetNull' },
  { model: 'AutomationAuditLog', field: 'user', relation: 'User', expected: 'SetNull' },
  { model: 'UsageEvent', field: 'user', relation: 'User', expected: 'SetNull' },
  { model: 'AmlScreening', field: 'user', relation: 'User', expected: 'SetNull' },

  // Financial relations (Restrict)
  { model: 'Invoice', field: 'client', relation: 'Client', expected: 'Restrict' },
  { model: 'Bill', field: 'vendor', relation: 'Vendor', expected: 'Restrict' },
  { model: 'RecurringInvoice', field: 'customer', relation: 'Customer', expected: 'Restrict' },
  { model: 'RecurringInvoice', field: 'createdBy', relation: 'User', expected: 'Restrict' },
  { model: 'CorrectionRecord', field: 'user', relation: 'User', expected: 'Restrict' },
  { model: 'ScheduledPayment', field: 'bankAccount', relation: 'BankAccount', expected: 'Restrict' },

  // Document relations (SetNull)
  { model: 'Document', field: 'folder', relation: 'DocumentFolder', expected: 'SetNull' },
  { model: 'DocumentFolder', field: 'parent', relation: 'DocumentFolder', expected: 'SetNull' },

  // Template relations (SetNull)
  { model: 'Invoice', field: 'recurringInvoice', relation: 'RecurringInvoice', expected: 'SetNull' },
  { model: 'ReceiptScan', field: 'expense', relation: 'Expense', expected: 'SetNull' },

  // Organisation relations (Cascade)
  { model: 'AmlScreening', field: 'organisation', relation: 'Organisation', expected: 'Cascade' },
];

console.log('\n===========================================');
console.log('CASCADE RULES VERIFICATION');
console.log('===========================================\n');

let passed = 0;
let failed = 0;
const failures = [];

EXPECTED_FIXES.forEach((fix) => {
  const { model, field, relation, expected } = fix;

  // Build regex to find the relation definition
  // Example: reviewer User? @relation("LeaveRequestReviewer", fields: [reviewedBy], references: [id], onDelete: SetNull)
  const pattern = new RegExp(
    `\\s+${field}\\s+${relation}[\\?\\[\\]]*\\s+@relation\\([^)]+onDelete:\\s*(\\w+)`,
    'gm'
  );

  const match = pattern.exec(schema);

  if (!match) {
    failed++;
    failures.push({
      ...fix,
      found: null,
      error: 'Relation not found or missing onDelete',
    });
    console.log(`❌ ${model}.${field} → ${relation}`);
    console.log(`   Expected: onDelete: ${expected}`);
    console.log(`   Found: MISSING\n`);
  } else {
    const foundRule = match[1];
    if (foundRule === expected) {
      passed++;
      console.log(`✅ ${model}.${field} → ${relation} (onDelete: ${expected})`);
    } else {
      failed++;
      failures.push({
        ...fix,
        found: foundRule,
        error: `Expected ${expected}, found ${foundRule}`,
      });
      console.log(`❌ ${model}.${field} → ${relation}`);
      console.log(`   Expected: onDelete: ${expected}`);
      console.log(`   Found: onDelete: ${foundRule}\n`);
    }
  }
});

console.log('\n===========================================');
console.log('RESULTS');
console.log('===========================================\n');

console.log(`Total Checks: ${EXPECTED_FIXES.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}\n`);

if (failed > 0) {
  console.log('FAILURES:\n');
  failures.forEach((failure) => {
    console.log(`  ${failure.model}.${failure.field} → ${failure.relation}`);
    console.log(`    ${failure.error}\n`);
  });

  console.log('❌ Verification FAILED\n');
  process.exit(1);
} else {
  console.log('✅ All cascade rules verified successfully!\n');
  console.log('Schema is ready for migration.\n');
  process.exit(0);
}
