const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

// Define compound indexes based on common query patterns
const compoundIndexes = {
  // Multi-tenant + status filtering
  'Invoice': [
    '@@index([orgId, status])',
    '@@index([orgId, issueDate])',
  ],
  'Bill': [
    '@@index([organisationId, status])',
    '@@index([organisationId, issueDate])',
  ],
  'Expense': [
    '@@index([orgId, status])',
    '@@index([orgId, date])',
  ],
  'Transaction': [
    '@@index([orgId, date])',
    '@@index([orgId, category])',
  ],
  'BankTransaction': [
    '@@index([bankAccountId, date])',
    '@@index([bankAccountId, isReconciled])',
  ],
  'Employee': [
    '@@index([orgId, status])',
    '@@index([orgId, email])',
  ],
  'LeaveRequest': [
    '@@index([employeeId, status])',
    '@@index([employeeId, startDate])',
  ],
  'PayrollPeriod': [
    '@@index([orgId, startDate])',
  ],
  'DeductionSuggestion': [
    '@@index([orgId, status])',
    '@@index([orgId, createdAt])',
  ],
  'FraudAlert': [
    '@@index([orgId, severity])',
  ],
  'Client': [
    '@@index([orgId, status])',
    '@@index([orgId, createdAt])',
  ],
  'Vendor': [
    '@@index([organisationId, isActive])',
  ],
  'Document': [
    '@@index([orgId, createdAt])',
  ],
  'Conversation': [
    '@@index([orgId, userId])',
  ],
  'Notification': [
    '@@index([orgId, userId])',
  ],
  'BankConnection': [
    '@@index([orgId, provider])',
  ],
  'Integration': [
    '@@index([orgId, status])',
  ],
  'PlaidTransaction': [
    '@@index([orgId, bookingDate])',
  ],
  'TrueLayerTransaction': [
    '@@index([orgId, bookingDate])',
  ],
  'UsageEvent': [
    '@@index([organisationId, eventType])',
  ],
  'DataSubjectRequest': [
    '@@index([organisationId, status])',
  ],
  'SyncedEmail': [
    '@@index([orgId, receivedAt])',
  ],
  'EmailAttachment': [
    '@@index([emailId, processingStatus])',
  ],
  'ReceiptScan': [
    '@@index([orgId, processingStatus])',
  ],
  'TaxDeadlineReminder': [
    '@@index([organizationId, dueDate])',
  ],
  'BankAccountNew': [
    '@@index([bankConnectionId, isActive])',
  ],
  'BankTransactionNew': [
    '@@index([bankAccountId, reconciliationStatus])',
  ],
  'ElsterFiling': [
    '@@index([organisationId, taxYear])',
  ],
  'HmrcVatReturn': [
    '@@index([orgId, periodKey])',
  ],
};

const lines = schemaContent.split('\n');
const newLines = [];

let currentModel = null;
let skipNextCloseBrace = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Detect model start
  if (line.match(/^model\s+(\w+)/)) {
    currentModel = line.match(/^model\s+(\w+)/)[1];
    skipNextCloseBrace = false;
  }

  newLines.push(line);

  // Detect model end - add compound indexes before closing brace
  if (line.match(/^}/) && currentModel && compoundIndexes[currentModel]) {
    // Remove the closing brace we just added
    newLines.pop();

    // Check if any of these indexes already exist in the model
    const modelContent = lines.slice(
      lines.findIndex(l => l.match(new RegExp(`^model\\s+${currentModel}`))),
      i
    ).join('\n');

    const indexesToAdd = compoundIndexes[currentModel].filter(idx => {
      // Extract the fields from the index
      const match = idx.match(/@@index\(\[(.*?)\]/);
      if (!match) return true;

      // Check if this exact index already exists
      return !modelContent.includes(idx);
    });

    // Add the compound indexes
    if (indexesToAdd.length > 0) {
      newLines.push('');
      newLines.push('  // Compound indexes for performance');
      indexesToAdd.forEach(idx => {
        newLines.push(`  ${idx}`);
      });
    }

    // Add back the closing brace
    newLines.push(line);
    currentModel = null;
  }
}

// Write the updated schema
const backupPath = path.join(__dirname, 'prisma', 'schema.prisma.compound-backup');
fs.writeFileSync(backupPath, schemaContent);
console.log(`✓ Backup created: schema.prisma.compound-backup`);

const newSchema = newLines.join('\n');
fs.writeFileSync(schemaPath, newSchema);

// Count added indexes
let totalAdded = 0;
for (const [model, indexes] of Object.entries(compoundIndexes)) {
  totalAdded += indexes.length;
}

console.log(`✓ Added ${totalAdded} compound indexes across ${Object.keys(compoundIndexes).length} models`);

console.log('\nCompound Indexes Added:');
for (const [model, indexes] of Object.entries(compoundIndexes)) {
  console.log(`  ${model}:`);
  indexes.forEach(idx => console.log(`    ${idx}`));
}

console.log('\nNext steps:');
console.log('1. Review the changes in schema.prisma');
console.log('2. Run: npx prisma format');
console.log('3. Run: npx prisma validate');
console.log('4. If valid, run: npx prisma generate');
