/**
 * Confidence Filtering Examples
 *
 * Demonstrates how to use the new confidence threshold filtering features
 * added in Phase 3 of the Email Filtering Implementation.
 */

import { EntityExtractorService } from '../entity-extractor.service';
import { EmailClassifierService } from '../email-classifier.service';
import { EmailInput } from '../types/extracted-entities.types';

/**
 * Example 1: Extract entities with org-specific confidence filtering
 */
export async function example1_EntityExtractionWithFiltering(
  entityExtractor: EntityExtractorService,
) {
  const email: EmailInput = {
    subject: 'Invoice #12345 - Payment Due',
    body: `
      Dear Customer,

      Please find attached invoice #12345 for €1,500.00.
      Payment is due by December 31, 2025.

      Best regards,
      John Smith
      Sales Manager
      ACME Corp
      john.smith@acme.com
      +49 123 456 7890
    `,
    from: 'john.smith@acme.com',
    to: 'billing@mycompany.com',
  };

  console.log('=== Example 1: Entity Extraction with Confidence Filtering ===\n');

  // Method 1: Extract all entities (no filtering)
  const allEntities = await entityExtractor.extractEntities(email);
  console.log('Without filtering:');
  console.log(`- Companies: ${allEntities.companies.length}`);
  console.log(`- Contacts: ${allEntities.contacts.length}`);
  console.log(`- Amounts: ${allEntities.amounts.length}`);
  console.log(`- Dates: ${allEntities.dates.length}\n`);

  // Method 2: Extract with org-specific threshold (filters low-confidence entities)
  const filteredEntities = await entityExtractor.extractEntitiesWithThreshold(
    email,
    'org_abc123', // Organization ID
  );
  console.log('With confidence filtering (org_abc123):');
  console.log(`- Companies: ${filteredEntities.companies.length}`);
  console.log(`- Contacts: ${filteredEntities.contacts.length}`);
  console.log(`- Amounts: ${filteredEntities.amounts.length}`);
  console.log(`- Dates: ${filteredEntities.dates.length}\n`);

  // Show what was filtered out
  console.log('Filtered out entities:');
  const filteredCompanies = allEntities.companies.filter(
    c => !filteredEntities.companies.find(fc => fc.name === c.name)
  );
  filteredCompanies.forEach(c => {
    console.log(`- Company "${c.name}" (confidence: ${c.confidence})`);
  });

  return { allEntities, filteredEntities };
}

/**
 * Example 2: Check classification confidence against org thresholds
 */
export async function example2_ClassificationConfidenceCheck(
  emailClassifier: EmailClassifierService,
) {
  const email: EmailInput = {
    subject: 'Invoice attached',
    body: 'Please find the invoice attached.',
    from: 'vendor@example.com',
    to: 'billing@mycompany.com',
  };

  console.log('=== Example 2: Classification Confidence Check ===\n');

  // Classify the email
  const classification = await emailClassifier.classifyEmail(email);
  console.log(`Classification: ${classification.classification}`);
  console.log(`Confidence: ${classification.confidence}`);
  console.log(`Priority: ${classification.priority}\n`);

  // Check against org-specific thresholds
  const confidenceCheck = await emailClassifier.meetsConfidenceThreshold(
    classification,
    'org_abc123',
  );

  console.log('Confidence check results:');
  console.log(`- Meets threshold: ${confidenceCheck.meetsThreshold}`);
  console.log(`- Org threshold: ${confidenceCheck.threshold}`);
  console.log(`- Needs review: ${confidenceCheck.needsReview}`);
  console.log(`- Review threshold: ${confidenceCheck.reviewThreshold}\n`);

  // Determine action based on confidence
  if (confidenceCheck.meetsThreshold) {
    console.log('✓ Action: Auto-process (high confidence)');
  } else if (confidenceCheck.needsReview) {
    console.log('⚠ Action: Flag for human review (medium confidence)');
  } else {
    console.log('✗ Action: Reject or mark as spam (low confidence)');
  }

  return { classification, confidenceCheck };
}

/**
 * Example 3: Use needsReview with org-specific thresholds
 */
export async function example3_ReviewDecision(
  emailClassifier: EmailClassifierService,
) {
  const email: EmailInput = {
    subject: 'Urgent: Contract dispute',
    body: 'We need to discuss the terms of our contract...',
    from: 'legal@client.com',
    to: 'legal@mycompany.com',
  };

  console.log('=== Example 3: Review Decision ===\n');

  const classification = await emailClassifier.classifyEmail(email);
  console.log(`Classification: ${classification.classification}`);
  console.log(`Confidence: ${classification.confidence}`);
  console.log(`Priority: ${classification.priority}\n`);

  // Check if needs review (without org context)
  const needsReviewDefault = await emailClassifier.needsReview(classification);
  console.log(`Needs review (default thresholds): ${needsReviewDefault}`);

  // Check if needs review (with org context)
  const needsReviewOrg = await emailClassifier.needsReview(
    classification,
    'org_abc123',
  );
  console.log(`Needs review (org_abc123 thresholds): ${needsReviewOrg}\n`);

  // Get review priority
  const priority = emailClassifier.getReviewPriority(classification);
  console.log(`Review priority score: ${priority}/100`);

  return { classification, needsReviewDefault, needsReviewOrg, priority };
}

/**
 * Example 4: Batch processing with confidence filtering
 */
export async function example4_BatchProcessing(
  entityExtractor: EntityExtractorService,
  emailClassifier: EmailClassifierService,
) {
  const emails: EmailInput[] = [
    {
      subject: 'Invoice #001',
      body: 'Invoice for €100',
      from: 'vendor1@example.com',
      to: 'billing@mycompany.com',
    },
    {
      subject: 'Meeting tomorrow',
      body: 'Can we meet at 2pm?',
      from: 'client@example.com',
      to: 'sales@mycompany.com',
    },
    {
      subject: 'Payment received',
      body: 'We received your payment of $500',
      from: 'accounts@partner.com',
      to: 'finance@mycompany.com',
    },
  ];

  console.log('=== Example 4: Batch Processing ===\n');

  // Process all emails
  const results = await Promise.all(
    emails.map(async (email, idx) => {
      // Classify
      const classification = await emailClassifier.classifyEmail(email);

      // Extract entities with filtering
      const entities = await entityExtractor.extractEntitiesWithThreshold(
        email,
        'org_abc123',
      );

      // Check confidence
      const confidenceCheck = await emailClassifier.meetsConfidenceThreshold(
        classification,
        'org_abc123',
      );

      return {
        emailIndex: idx,
        subject: email.subject,
        classification: classification.classification,
        confidence: classification.confidence,
        meetsThreshold: confidenceCheck.meetsThreshold,
        needsReview: confidenceCheck.needsReview,
        entityCount: {
          companies: entities.companies.length,
          contacts: entities.contacts.length,
          amounts: entities.amounts.length,
        },
      };
    }),
  );

  // Print results
  console.log('Batch processing results:');
  results.forEach((result, idx) => {
    console.log(`\nEmail ${idx + 1}: "${result.subject}"`);
    console.log(`  Classification: ${result.classification} (${result.confidence.toFixed(2)})`);
    console.log(`  Meets threshold: ${result.meetsThreshold}`);
    console.log(`  Needs review: ${result.needsReview}`);
    console.log(`  Entities: ${JSON.stringify(result.entityCount)}`);
  });

  // Summary
  const highConfidence = results.filter(r => r.meetsThreshold).length;
  const needsReview = results.filter(r => r.needsReview).length;
  const lowConfidence = results.length - highConfidence - needsReview;

  console.log('\nSummary:');
  console.log(`- Auto-processable: ${highConfidence}/${results.length}`);
  console.log(`- Needs review: ${needsReview}/${results.length}`);
  console.log(`- Low confidence: ${lowConfidence}/${results.length}`);

  return results;
}

/**
 * Example 5: Custom confidence thresholds per organization
 */
export async function example5_CustomOrgThresholds() {
  console.log('=== Example 5: Custom Org Thresholds ===\n');

  // Example org configurations
  const orgConfigs = [
    {
      orgId: 'org_conservative',
      name: 'Conservative Corp',
      minEntityConfidence: 0.8,        // Very high threshold
      minClassificationConfidence: 0.85,
      lowConfidenceThreshold: 0.6,
    },
    {
      orgId: 'org_balanced',
      name: 'Balanced Inc',
      minEntityConfidence: 0.6,         // Default threshold
      minClassificationConfidence: 0.7,
      lowConfidenceThreshold: 0.5,
    },
    {
      orgId: 'org_aggressive',
      name: 'Aggressive LLC',
      minEntityConfidence: 0.4,         // Low threshold, more automation
      minClassificationConfidence: 0.5,
      lowConfidenceThreshold: 0.3,
    },
  ];

  console.log('Organization threshold configurations:\n');
  orgConfigs.forEach(org => {
    console.log(`${org.name} (${org.orgId}):`);
    console.log(`  Entity threshold: ${org.minEntityConfidence}`);
    console.log(`  Classification threshold: ${org.minClassificationConfidence}`);
    console.log(`  Review threshold: ${org.lowConfidenceThreshold}`);
    console.log('');
  });

  console.log('Impact of different thresholds:');
  console.log('');
  console.log('Conservative Corp:');
  console.log('  - Only very confident extractions/classifications');
  console.log('  - Most emails flagged for review');
  console.log('  - Minimal false positives, more manual work');
  console.log('');
  console.log('Balanced Inc:');
  console.log('  - Default behavior');
  console.log('  - Good balance of automation and safety');
  console.log('');
  console.log('Aggressive LLC:');
  console.log('  - Maximum automation');
  console.log('  - Fewer reviews, more auto-processing');
  console.log('  - Higher risk of false positives');
}

/**
 * Example 6: Understanding confidence scores
 */
export async function example6_ConfidenceScoreGuide() {
  console.log('=== Example 6: Confidence Score Guide ===\n');

  const confidenceGuide = [
    {
      range: '0.9 - 1.0',
      level: 'Very High',
      recommendation: 'Safe to auto-process',
      example: 'Email with explicit invoice number, amount, and all expected fields',
    },
    {
      range: '0.7 - 0.9',
      level: 'High',
      recommendation: 'Auto-process with logging',
      example: 'Well-structured business email with clear intent',
    },
    {
      range: '0.5 - 0.7',
      level: 'Medium',
      recommendation: 'Flag for human review',
      example: 'Ambiguous email or unusual format',
    },
    {
      range: '0.3 - 0.5',
      level: 'Low',
      recommendation: 'Likely needs review or rejection',
      example: 'Unclear context, missing information',
    },
    {
      range: '0.0 - 0.3',
      level: 'Very Low',
      recommendation: 'Likely spam or irrelevant',
      example: 'Unrelated content, marketing emails',
    },
  ];

  console.log('Confidence Score Interpretation:\n');
  confidenceGuide.forEach(guide => {
    console.log(`${guide.range} (${guide.level})`);
    console.log(`  Recommendation: ${guide.recommendation}`);
    console.log(`  Example: ${guide.example}`);
    console.log('');
  });

  console.log('Setting Thresholds:');
  console.log('');
  console.log('minClassificationConfidence (default 0.7):');
  console.log('  - Emails above this: auto-processed');
  console.log('  - Emails below this: flagged for review');
  console.log('');
  console.log('lowConfidenceThreshold (default 0.5):');
  console.log('  - Emails below this: likely spam/irrelevant');
  console.log('  - Used to separate "needs review" from "reject"');
  console.log('');
  console.log('minEntityConfidence (default 0.6):');
  console.log('  - Entities below this: filtered out');
  console.log('  - Prevents low-quality data in database');
}

/**
 * Run all examples
 */
export async function runAllExamples(
  entityExtractor: EntityExtractorService,
  emailClassifier: EmailClassifierService,
) {
  console.log('\n========================================');
  console.log('CONFIDENCE FILTERING EXAMPLES');
  console.log('========================================\n');

  await example1_EntityExtractionWithFiltering(entityExtractor);
  console.log('\n');

  await example2_ClassificationConfidenceCheck(emailClassifier);
  console.log('\n');

  await example3_ReviewDecision(emailClassifier);
  console.log('\n');

  await example4_BatchProcessing(entityExtractor, emailClassifier);
  console.log('\n');

  await example5_CustomOrgThresholds();
  console.log('\n');

  await example6_ConfidenceScoreGuide();
  console.log('\n');

  console.log('========================================');
  console.log('EXAMPLES COMPLETE');
  console.log('========================================\n');
}
