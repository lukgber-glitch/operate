const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

// Parse schema to understand models and their fields
const lines = schemaContent.split('\n');
const models = {};
let currentModel = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Detect model start
  if (line.match(/^model\s+(\w+)/)) {
    currentModel = line.match(/^model\s+(\w+)/)[1];
    models[currentModel] = {
      startLine: i,
      endLine: null,
      fields: new Set(),
      orgField: null,
      existingIndexes: []
    };
  }

  // Track fields
  if (currentModel && line.match(/^\s+(\w+)\s+/)) {
    const match = line.match(/^\s+(\w+)\s+/);
    const fieldName = match[1];
    models[currentModel].fields.add(fieldName);

    // Track org field
    if (fieldName === 'orgId' || fieldName === 'organisationId' || fieldName === 'organizationId') {
      models[currentModel].orgField = fieldName;
    }
  }

  // Track existing indexes
  if (currentModel && line.match(/@@index\(\[(.*?)\]/)) {
    const match = line.match(/@@index\(\[(.*?)\]/);
    models[currentModel].existingIndexes.push(match[1]);
  }

  // Detect model end
  if (line.match(/^}$/) && currentModel) {
    models[currentModel].endLine = i;
    currentModel = null;
  }
}

// Define compound index patterns
const compoundIndexPatterns = [
  // Multi-tenant + status
  { fields: ['orgId', 'status'], reason: 'Multi-tenant status filtering' },
  { fields: ['organisationId', 'status'], reason: 'Multi-tenant status filtering' },
  { fields: ['organizationId', 'status'], reason: 'Multi-tenant status filtering' },

  // Multi-tenant + date fields
  { fields: ['orgId', 'issueDate'], reason: 'Invoice date queries' },
  { fields: ['orgId', 'dueDate'], reason: 'Due date queries' },
  { fields: ['orgId', 'date'], reason: 'Date-based queries' },
  { fields: ['orgId', 'createdAt'], reason: 'Creation date queries' },
  { fields: ['orgId', 'bookingDate'], reason: 'Transaction booking date' },
  { fields: ['organisationId', 'issueDate'], reason: 'Invoice date queries' },
  { fields: ['organisationId', 'dueDate'], reason: 'Due date queries' },
  { fields: ['organizationId', 'dueDate'], reason: 'Due date queries' },

  // Multi-tenant + category/type
  { fields: ['orgId', 'category'], reason: 'Category filtering' },
  { fields: ['orgId', 'provider'], reason: 'Provider filtering' },
  { fields: ['orgId', 'userId'], reason: 'User scoping' },

  // Common FK + field patterns
  { fields: ['bankAccountId', 'date'], reason: 'Bank transaction date queries' },
  { fields: ['bankAccountId', 'isReconciled'], reason: 'Reconciliation status' },
  { fields: ['bankAccountId', 'reconciliationStatus'], reason: 'Reconciliation status' },
  { fields: ['bankConnectionId', 'isActive'], reason: 'Active accounts' },
  { fields: ['employeeId', 'status'], reason: 'Employee record status' },
  { fields: ['employeeId', 'startDate'], reason: 'Date range queries' },
  { fields: ['emailId', 'status'], reason: 'Email status filtering' },
];

// Apply compound indexes
const newLines = [...lines];
let offset = 0;

for (const [modelName, modelInfo] of Object.entries(models)) {
  const indexesToAdd = [];

  // Check each pattern
  for (const pattern of compoundIndexPatterns) {
    // Check if all fields in the pattern exist in this model
    const allFieldsExist = pattern.fields.every(f => modelInfo.fields.has(f));
    if (!allFieldsExist) continue;

    // Check if this index already exists
    const indexStr = pattern.fields.join(', ');
    const alreadyExists = modelInfo.existingIndexes.some(idx =>
      idx === indexStr || idx.split(', ').sort().join(',') === pattern.fields.sort().join(',')
    );

    if (alreadyExists) continue;

    indexesToAdd.push({
      fields: pattern.fields,
      reason: pattern.reason
    });
  }

  if (indexesToAdd.length === 0) continue;

  // Find where to insert (before closing brace, after existing indexes)
  let insertLine = modelInfo.endLine + offset;
  let lastIndexLine = null;

  for (let i = modelInfo.startLine + offset; i < modelInfo.endLine + offset; i++) {
    if (newLines[i].match(/^\s+@@(index|unique|map|id)/)) {
      lastIndexLine = i;
    }
  }

  if (lastIndexLine) {
    insertLine = lastIndexLine + 1;
  }

  // Create index lines
  const indexLines = [];
  if (indexesToAdd.length > 0) {
    indexLines.push('');
    indexLines.push('  // Compound indexes for performance');
    indexesToAdd.forEach(idx => {
      const fieldsStr = idx.fields.join(', ');
      indexLines.push(`  @@index([${fieldsStr}])`);
    });
  }

  // Insert the indexes
  newLines.splice(insertLine, 0, ...indexLines);
  offset += indexLines.length;

  console.log(`${modelName}: Added ${indexesToAdd.length} compound indexes`);
}

// Write the updated schema
const backupPath = path.join(__dirname, 'prisma', 'schema.prisma.before-compound');
fs.writeFileSync(backupPath, schemaContent);
console.log(`\n✓ Backup created: schema.prisma.before-compound`);

const newSchema = newLines.join('\n');
fs.writeFileSync(schemaPath, newSchema);

console.log(`✓ Schema updated with compound indexes`);

console.log('\nNext steps:');
console.log('1. Run: npx prisma format');
console.log('2. Run: npx prisma generate');
console.log('3. Review the changes');
