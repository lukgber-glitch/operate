const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

// Parse schema to find issues
const models = [];
let currentModel = null;

const lines = schemaContent.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Detect model start
  if (line.match(/^model\s+(\w+)/)) {
    if (currentModel) {
      models.push(currentModel);
    }
    currentModel = {
      name: line.match(/^model\s+(\w+)/)[1],
      lineNumber: i + 1,
      fields: [],
      foreignKeys: [],
      indexes: [],
      orgFieldName: null,
      orgFieldLine: null
    };
  }

  // Detect model end
  if (line.match(/^}/) && currentModel) {
    models.push(currentModel);
    currentModel = null;
  }

  if (!currentModel) continue;

  // Detect org field naming
  if (line.match(/\s+(orgId|organisationId|organizationId)\s+String/)) {
    const match = line.match(/\s+(orgId|organisationId|organizationId)\s+String/);
    currentModel.orgFieldName = match[1];
    currentModel.orgFieldLine = i + 1;
  }

  // Detect foreign key fields (ends with Id)
  const fkMatch = line.match(/^\s+(\w+Id)\s+String/);
  if (fkMatch) {
    currentModel.foreignKeys.push({
      field: fkMatch[1],
      lineNumber: i + 1,
      line: line.trim()
    });
  }

  // Detect indexes
  if (line.match(/@@index\(/)) {
    currentModel.indexes.push({
      lineNumber: i + 1,
      line: line.trim()
    });
  }
}

// Analysis results
const results = {
  orgFieldInconsistencies: [],
  missingFkIndexes: [],
  neededCompoundIndexes: [],
  stats: {
    totalModels: models.length,
    modelsWithOrgField: 0,
    modelsWithOrgId: 0,
    modelsWithOrganisationId: 0,
    modelsWithOrganizationId: 0,
    totalForeignKeys: 0,
    indexedForeignKeys: 0,
    missingIndexes: 0
  }
};

// Analyze each model
for (const model of models) {
  // Check org field naming
  if (model.orgFieldName) {
    results.stats.modelsWithOrgField++;
    if (model.orgFieldName === 'orgId') results.stats.modelsWithOrgId++;
    if (model.orgFieldName === 'organisationId') results.stats.modelsWithOrganisationId++;
    if (model.orgFieldName === 'organizationId') results.stats.modelsWithOrganizationId++;

    results.orgFieldInconsistencies.push({
      model: model.name,
      field: model.orgFieldName,
      lineNumber: model.orgFieldLine
    });
  }

  // Check foreign key indexes
  for (const fk of model.foreignKeys) {
    results.stats.totalForeignKeys++;

    // Check if this FK has a single index
    const hasSingleIndex = model.indexes.some(idx =>
      idx.line.includes(`[${fk.field}]`) && !idx.line.includes(',')
    );

    // Check if this FK is part of a compound index
    const hasCompoundIndex = model.indexes.some(idx =>
      idx.line.includes(`[${fk.field}`) || idx.line.includes(`, ${fk.field}`)
    );

    if (hasSingleIndex || hasCompoundIndex) {
      results.stats.indexedForeignKeys++;
    } else {
      results.stats.missingIndexes++;
      results.missingFkIndexes.push({
        model: model.name,
        field: fk.field,
        lineNumber: fk.lineNumber
      });
    }
  }

  // Suggest compound indexes for multi-tenant models
  if (model.orgFieldName && model.foreignKeys.length > 1) {
    const statusFields = model.fields.filter(f =>
      f.name === 'status' || f.name === 'isActive'
    );

    const dateFields = model.fields.filter(f =>
      f.name === 'createdAt' || f.name === 'date' || f.name === 'issueDate' || f.name === 'dueDate'
    );

    // Suggest orgId + status compound indexes
    if (statusFields.length > 0) {
      results.neededCompoundIndexes.push({
        model: model.name,
        fields: [model.orgFieldName, statusFields[0].name],
        reason: 'Multi-tenant status filtering'
      });
    }

    // Suggest orgId + date compound indexes
    if (dateFields.length > 0) {
      results.neededCompoundIndexes.push({
        model: model.name,
        fields: [model.orgFieldName, dateFields[0].name],
        reason: 'Multi-tenant date-based queries'
      });
    }
  }
}

// Output results
console.log('='.repeat(80));
console.log('DATABASE SCHEMA ANALYSIS');
console.log('='.repeat(80));
console.log();

console.log('STATISTICS:');
console.log('-'.repeat(80));
console.log(`Total Models: ${results.stats.totalModels}`);
console.log(`Models with Org Field: ${results.stats.modelsWithOrgField}`);
console.log(`  - orgId: ${results.stats.modelsWithOrgId}`);
console.log(`  - organisationId: ${results.stats.modelsWithOrganisationId}`);
console.log(`  - organizationId: ${results.stats.modelsWithOrganizationId}`);
console.log(`Total Foreign Keys: ${results.stats.totalForeignKeys}`);
console.log(`Indexed Foreign Keys: ${results.stats.indexedForeignKeys}`);
console.log(`Missing FK Indexes: ${results.stats.missingIndexes}`);
console.log();

console.log('DB-001: ORG FIELD NAMING INCONSISTENCIES:');
console.log('-'.repeat(80));
const byFieldName = {
  orgId: [],
  organisationId: [],
  organizationId: []
};

for (const item of results.orgFieldInconsistencies) {
  byFieldName[item.field].push(item);
}

console.log(`orgId (${byFieldName.orgId.length} models):`);
byFieldName.orgId.forEach(m => console.log(`  - ${m.model} (line ${m.lineNumber})`));
console.log();

console.log(`organisationId (${byFieldName.organisationId.length} models):`);
byFieldName.organisationId.forEach(m => console.log(`  - ${m.model} (line ${m.lineNumber})`));
console.log();

console.log(`organizationId (${byFieldName.organizationId.length} models):`);
byFieldName.organizationId.forEach(m => console.log(`  - ${m.model} (line ${m.lineNumber})`));
console.log();

console.log('DB-002: MISSING FOREIGN KEY INDEXES:');
console.log('-'.repeat(80));
console.log(`Total Missing: ${results.missingFkIndexes.length}`);
console.log();

const grouped = {};
for (const item of results.missingFkIndexes) {
  if (!grouped[item.model]) grouped[item.model] = [];
  grouped[item.model].push(item);
}

for (const [modelName, items] of Object.entries(grouped)) {
  console.log(`${modelName}:`);
  items.forEach(item => console.log(`  - ${item.field} (line ${item.lineNumber})`));
}
console.log();

console.log('DB-006: RECOMMENDED COMPOUND INDEXES:');
console.log('-'.repeat(80));
console.log(`Total Recommendations: ${results.neededCompoundIndexes.length}`);
console.log();

// Write to JSON for processing
fs.writeFileSync(
  path.join(__dirname, 'schema-analysis.json'),
  JSON.stringify(results, null, 2)
);

console.log('Full analysis saved to: schema-analysis.json');
