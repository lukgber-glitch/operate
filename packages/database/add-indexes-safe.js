const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const analysisPath = path.join(__dirname, 'schema-analysis.json');

// Read files
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));

// Parse the schema to find where to insert indexes
const lines = schemaContent.split('\n');

// Group missing indexes by model
const indexesByModel = {};
for (const item of analysis.missingFkIndexes) {
  if (!indexesByModel[item.model]) {
    indexesByModel[item.model] = [];
  }
  indexesByModel[item.model].push(item.field);
}

// Track all models and their closing braces
const models = [];
let currentModel = null;
let modelStartLine = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Detect model start
  if (line.match(/^model\s+(\w+)/)) {
    const modelName = line.match(/^model\s+(\w+)/)[1];
    currentModel = modelName;
    modelStartLine = i;
  }

  // Detect model end
  if (line.match(/^}$/) && currentModel) {
    models.push({
      name: currentModel,
      startLine: modelStartLine,
      endLine: i
    });
    currentModel = null;
  }
}

// Apply indexes to each model
const newLines = [...lines];
let offset = 0;

for (const model of models) {
  const indexesToAdd = indexesByModel[model.name];
  if (!indexesToAdd || indexesToAdd.length === 0) continue;

  // Find the last @@index line in this model
  let insertLine = model.endLine + offset;
  let lastIndexLine = null;

  for (let i = model.startLine + offset; i < model.endLine + offset; i++) {
    if (newLines[i].match(/^\s+@@(index|unique|map|id)/)) {
      lastIndexLine = i;
    }
  }

  // If there are existing @@index lines, insert after them
  // Otherwise, insert before the closing brace
  if (lastIndexLine) {
    insertLine = lastIndexLine + 1;
  }

  // Create index lines
  const indexLines = indexesToAdd.map(field => `  @@index([${field}])`);

  // Insert the indexes
  newLines.splice(insertLine, 0, ...indexLines);
  offset += indexLines.length;
}

// Write the updated schema
const backupPath = path.join(__dirname, 'prisma', 'schema.prisma.before-indexes');
fs.writeFileSync(backupPath, schemaContent);
console.log(`✓ Backup created: schema.prisma.before-indexes`);

const newSchema = newLines.join('\n');
fs.writeFileSync(schemaPath, newSchema);

console.log(`✓ Added ${analysis.missingFkIndexes.length} foreign key indexes`);

console.log('\nIndexes Added by Model:');
for (const [model, indexes] of Object.entries(indexesByModel)) {
  console.log(`  ${model}: ${indexes.join(', ')}`);
}

console.log('\nNext steps:');
console.log('1. Run: npx prisma format');
console.log('2. Run: npx prisma validate');
console.log('3. If valid, add compound indexes for performance');
