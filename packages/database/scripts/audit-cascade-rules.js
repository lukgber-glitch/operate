/**
 * Audit Script: Cascade Rules and String ID Relations
 *
 * This script analyzes the Prisma schema to:
 * 1. Find all relations and their cascade rules
 * 2. Identify missing onDelete clauses
 * 3. Find string ID fields without relations
 * 4. Generate recommendations for fixes
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf-8');

// Parse models and relations
const models = {};
let currentModel = null;

const lines = schema.split('\n');

lines.forEach((line, index) => {
  // Match model definition
  const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
  if (modelMatch) {
    currentModel = modelMatch[1];
    models[currentModel] = {
      name: currentModel,
      fields: [],
      relations: [],
      stringIdFields: [],
      lineNumber: index + 1
    };
    return;
  }

  // Match end of model
  if (line.match(/^\}/)) {
    currentModel = null;
    return;
  }

  if (!currentModel) return;

  // Match field definitions
  const fieldMatch = line.match(/^\s+(\w+)\s+(\w+)/);
  if (fieldMatch) {
    const [, fieldName, fieldType] = fieldMatch;

    // Track string ID fields
    if (fieldName.endsWith('Id') && fieldType === 'String') {
      models[currentModel].stringIdFields.push({
        name: fieldName,
        type: fieldType,
        line: index + 1,
        fullLine: line.trim()
      });
    }

    models[currentModel].fields.push({
      name: fieldName,
      type: fieldType,
      line: index + 1
    });
  }

  // Match relation definitions
  const relationMatch = line.match(/^\s+(\w+)\s+(\w+)(\?|(\[\]))?\s+@relation\((.*)\)/);
  if (relationMatch) {
    const [, fieldName, relationType, optional, , relationArgs] = relationMatch;

    // Parse relation arguments
    const onDeleteMatch = relationArgs.match(/onDelete:\s*(\w+)/);
    const fieldsMatch = relationArgs.match(/fields:\s*\[([^\]]+)\]/);
    const referencesMatch = relationArgs.match(/references:\s*\[([^\]]+)\]/);

    models[currentModel].relations.push({
      name: fieldName,
      type: relationType,
      optional: !!optional,
      onDelete: onDeleteMatch ? onDeleteMatch[1] : null,
      fields: fieldsMatch ? fieldsMatch[1].trim() : null,
      references: referencesMatch ? referencesMatch[1].trim() : null,
      line: index + 1,
      fullLine: line.trim()
    });
  }
});

// Analysis results
const results = {
  missingOnDelete: [],
  wrongCascade: [],
  stringIdsMissingRelation: [],
  recommendations: []
};

// Analyze each model
Object.values(models).forEach(model => {
  // Check relations for missing or wrong cascade rules
  model.relations.forEach(relation => {
    if (!relation.fields) {
      // This is the inverse side of a relation, skip
      return;
    }

    if (!relation.onDelete) {
      results.missingOnDelete.push({
        model: model.name,
        field: relation.name,
        type: relation.type,
        line: relation.line,
        details: relation.fullLine
      });
    }

    // Check for potentially wrong cascade rules
    if (relation.onDelete === 'Cascade') {
      // Organization relations should cascade (org data)
      // But User relations should generally SetNull or Restrict
      if (relation.type === 'User' && !relation.name.includes('user')) {
        results.wrongCascade.push({
          model: model.name,
          field: relation.name,
          type: relation.type,
          currentRule: relation.onDelete,
          line: relation.line,
          reason: 'User deletion cascading - should probably be SetNull',
          details: relation.fullLine
        });
      }

      // Customer/Vendor deletions cascading to invoices/bills is dangerous
      if ((relation.type === 'Customer' || relation.type === 'Vendor' || relation.type === 'Client') &&
          (model.name === 'Invoice' || model.name === 'Bill' || model.name === 'Transaction')) {
        results.wrongCascade.push({
          model: model.name,
          field: relation.name,
          type: relation.type,
          currentRule: relation.onDelete,
          line: relation.line,
          reason: 'Customer/Vendor deletion would delete financial records - should be Restrict',
          details: relation.fullLine
        });
      }
    }
  });

  // Check for string ID fields without relations
  model.stringIdFields.forEach(field => {
    // Check if there's a corresponding relation
    const relationName = field.name.replace(/Id$/, '');
    const hasRelation = model.relations.some(r => r.name === relationName);

    if (!hasRelation) {
      // Some exceptions: generic IDs, external IDs
      const exceptions = ['externalId', 'providerId', 'sessionId', 'requestId', 'parentId'];
      if (!exceptions.includes(field.name)) {
        results.stringIdsMissingRelation.push({
          model: model.name,
          field: field.name,
          suggestedRelation: relationName,
          line: field.line,
          details: field.fullLine
        });
      }
    }
  });
});

// Generate recommendations
console.log('\n===========================================');
console.log('PRISMA SCHEMA CASCADE & RELATION AUDIT');
console.log('===========================================\n');

console.log(`Total Models: ${Object.keys(models).length}`);
console.log(`Total Relations: ${Object.values(models).reduce((sum, m) => sum + m.relations.length, 0)}`);
console.log(`Total String ID Fields: ${Object.values(models).reduce((sum, m) => sum + m.stringIdFields.length, 0)}\n`);

// Missing onDelete
if (results.missingOnDelete.length > 0) {
  console.log(`\n❌ CRITICAL: ${results.missingOnDelete.length} relations missing onDelete clause`);
  console.log('Without onDelete, Prisma defaults to Restrict, which can cause errors.\n');

  results.missingOnDelete.slice(0, 20).forEach(issue => {
    console.log(`  ${issue.model}.${issue.field} → ${issue.type} (line ${issue.line})`);
    console.log(`    ${issue.details}`);
    console.log('');
  });

  if (results.missingOnDelete.length > 20) {
    console.log(`  ... and ${results.missingOnDelete.length - 20} more\n`);
  }
}

// Wrong cascade rules
if (results.wrongCascade.length > 0) {
  console.log(`\n⚠️  WARNING: ${results.wrongCascade.length} potentially incorrect cascade rules`);
  console.log('These relations may have dangerous cascade behavior.\n');

  results.wrongCascade.forEach(issue => {
    console.log(`  ${issue.model}.${issue.field} → ${issue.type} (line ${issue.line})`);
    console.log(`    Current: ${issue.currentRule}`);
    console.log(`    Reason: ${issue.reason}`);
    console.log(`    ${issue.details}`);
    console.log('');
  });
}

// Missing relations for string IDs
if (results.stringIdsMissingRelation.length > 0) {
  console.log(`\n📋 INFO: ${results.stringIdsMissingRelation.length} string ID fields without relations`);
  console.log('These fields appear to be foreign keys but lack @relation clauses.\n');

  results.stringIdsMissingRelation.slice(0, 20).forEach(issue => {
    console.log(`  ${issue.model}.${issue.field} (line ${issue.line})`);
    console.log(`    Suggested relation: ${issue.suggestedRelation}`);
    console.log(`    ${issue.details}`);
    console.log('');
  });

  if (results.stringIdsMissingRelation.length > 20) {
    console.log(`  ... and ${results.stringIdsMissingRelation.length - 20} more\n`);
  }
}

// Save detailed report
const reportPath = path.join(__dirname, '../../audits/fixes/cascade-audit-report.json');
const reportDir = path.dirname(reportPath);
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`\n✅ Detailed report saved to: ${reportPath}\n`);

// Exit with error code if critical issues found
if (results.missingOnDelete.length > 0 || results.wrongCascade.length > 0) {
  process.exit(1);
}
