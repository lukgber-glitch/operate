const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const analysisPath = path.join(__dirname, 'schema-analysis.json');

// Read files
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));

const lines = schemaContent.split('\n');
const newLines = [...lines];

// Track insertions (line number -> lines to insert)
const insertions = {};

// Group missing indexes by model
const indexesByModel = {};
for (const item of analysis.missingFkIndexes) {
  if (!indexesByModel[item.model]) {
    indexesByModel[item.model] = [];
  }
  indexesByModel[item.model].push(item);
}

// Find where to insert indexes for each model
let currentModel = null;
let lastIndexLine = null;
let modelCloseLine = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Detect model start
  if (line.match(/^model\s+(\w+)/)) {
    const modelName = line.match(/^model\s+(\w+)/)[1];

    // If we have a previous model with missing indexes, add them
    if (currentModel && indexesByModel[currentModel] && modelCloseLine) {
      const indexesToAdd = indexesByModel[currentModel];
      const indexLines = indexesToAdd.map(idx => `  @@index([${idx.field}])`);

      // Insert before the closing brace, after existing indexes or other @@
      if (!insertions[modelCloseLine]) {
        insertions[modelCloseLine] = [];
      }
      insertions[modelCloseLine].push(...indexLines);
    }

    currentModel = modelName;
    lastIndexLine = null;
    modelCloseLine = null;
  }

  // Track where indexes are (to insert near them)
  if (line.match(/^\s+@@index\(/) || line.match(/^\s+@@unique\(/) || line.match(/^\s+@@map\(/)) {
    lastIndexLine = i;
  }

  // Detect model end
  if (line.match(/^}/) && currentModel) {
    modelCloseLine = i;
  }
}

// Handle the last model
if (currentModel && indexesByModel[currentModel] && modelCloseLine) {
  const indexesToAdd = indexesByModel[currentModel];
  const indexLines = indexesToAdd.map(idx => `  @@index([${idx.field}])`);

  if (!insertions[modelCloseLine]) {
    insertions[modelCloseLine] = [];
  }
  insertions[modelCloseLine].push(...indexLines);
}

// Apply insertions (in reverse order to maintain line numbers)
const sortedInsertions = Object.keys(insertions).map(Number).sort((a, b) => b - a);

for (const lineNum of sortedInsertions) {
  const linesToInsert = insertions[lineNum];
  // Insert before the closing brace
  newLines.splice(lineNum, 0, ...linesToInsert);
}

// Write the updated schema
const newSchema = newLines.join('\n');
const backupPath = path.join(__dirname, 'prisma', 'schema.prisma.backup');

// Create backup
fs.writeFileSync(backupPath, schemaContent);
console.log(`✓ Backup created: schema.prisma.backup`);

// Write new schema
fs.writeFileSync(schemaPath, newSchema);
console.log(`✓ Updated schema with ${analysis.missingFkIndexes.length} new indexes`);

// Summary
console.log('\nIndexes Added:');
for (const [model, indexes] of Object.entries(indexesByModel)) {
  console.log(`  ${model}: ${indexes.map(i => i.field).join(', ')}`);
}

console.log('\nNext steps:');
console.log('1. Review the changes in schema.prisma');
console.log('2. Run: npx prisma format');
console.log('3. Run: npx prisma generate');
console.log('4. Create migration: npx prisma migrate dev --name add-missing-fk-indexes');
