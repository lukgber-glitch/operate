/**
 * Relationship Tracker Service - Usage Examples
 *
 * This file demonstrates how to use the RelationshipTrackerService
 * to track customer and vendor relationship health.
 */

import { RelationshipTrackerService } from './relationship-tracker.service';
import { PrismaService } from '../../database/prisma.service';

async function runExamples() {
  // Note: In a real NestJS app, these services would be injected via DI
  // This is just for demonstration purposes
  const prisma = new PrismaService({} as any);
  const relationshipTracker = new RelationshipTrackerService(prisma);

  const orgId = 'org-123'; // Example org ID
  const customerId = 'customer-456'; // Example customer ID

  // ========================================================================
  // EXAMPLE 1: Update Metrics After Processing an Email
  // ========================================================================
  console.log('\n=== Example 1: Update Relationship Metrics ===\n');

  const email = {
    subject: 'Re: Invoice #12345',
    body: 'Thanks for the invoice. Payment sent today.',
    from: 'customer@example.com',
    to: 'billing@operate.guru',
    date: new Date(),
  };

  const metrics = await relationshipTracker.updateRelationshipMetrics(
    customerId,
    'CUSTOMER',
    email,
    orgId,
  );

  console.log('Updated Metrics:');
  console.log(`  Health Score: ${metrics.healthScore}/100`);
  console.log(`  Status: ${metrics.healthStatus}`);
  console.log(`  Total Emails: ${metrics.totalEmails}`);
  console.log(`  Days Since Last Contact: ${metrics.daysSinceLastContact}`);
  console.log(`  Communication Frequency: ${metrics.communicationFrequency}`);
  console.log(`  Trend: ${metrics.trend}`);
  console.log(`  Alerts: ${metrics.alerts.length}`);

  if (metrics.alerts.length > 0) {
    console.log('\nAlerts:');
    metrics.alerts.forEach((alert) => {
      console.log(`  - [${alert.priority}] ${alert.type}: ${alert.message}`);
    });
  }

  // ========================================================================
  // EXAMPLE 2: Get At-Risk Relationships
  // ========================================================================
  console.log('\n=== Example 2: At-Risk Relationships ===\n');

  const atRiskRelationships = await relationshipTracker.getAtRiskRelationships(orgId);

  console.log(`Found ${atRiskRelationships.length} at-risk relationships:\n`);

  atRiskRelationships.slice(0, 5).forEach((rel) => {
    console.log(`${rel.entityType}: ${rel.entityName}`);
    console.log(`  Health Score: ${rel.metrics.healthScore}/100 (${rel.metrics.healthStatus})`);
    console.log(`  Last Contact: ${rel.metrics.daysSinceLastContact} days ago`);
    console.log(`  Suggested Action: ${rel.suggestedAction}`);
    console.log('');
  });

  // ========================================================================
  // EXAMPLE 3: Get Dormant Relationships (90+ days no contact)
  // ========================================================================
  console.log('\n=== Example 3: Dormant Relationships ===\n');

  const dormantRelationships = await relationshipTracker.getDormantRelationships(
    orgId,
    90,
  );

  console.log(`Found ${dormantRelationships.length} dormant relationships:\n`);

  dormantRelationships.slice(0, 5).forEach((rel) => {
    console.log(`${rel.entityType}: ${rel.entityName}`);
    console.log(`  Last Contact: ${rel.metrics.daysSinceLastContact} days ago`);
    console.log(`  Total Emails: ${rel.metrics.totalEmails}`);
    console.log(`  Suggested Action: ${rel.suggestedAction}`);
    console.log('');
  });

  // ========================================================================
  // EXAMPLE 4: Get Organization-Wide Relationship Summary
  // ========================================================================
  console.log('\n=== Example 4: Relationship Summary ===\n');

  const summary = await relationshipTracker.getRelationshipSummary(orgId);

  console.log('Relationship Health Distribution:');
  console.log(`  Total Relationships: ${summary.totalRelationships}`);
  console.log(`  Excellent: ${summary.excellent} (${percentage(summary.excellent, summary.totalRelationships)}%)`);
  console.log(`  Good: ${summary.good} (${percentage(summary.good, summary.totalRelationships)}%)`);
  console.log(`  Needs Attention: ${summary.needsAttention} (${percentage(summary.needsAttention, summary.totalRelationships)}%)`);
  console.log(`  At Risk: ${summary.atRisk} (${percentage(summary.atRisk, summary.totalRelationships)}%)`);
  console.log(`  Dormant: ${summary.dormant} (${percentage(summary.dormant, summary.totalRelationships)}%)`);

  // Calculate health percentage
  const healthy = summary.excellent + summary.good;
  const unhealthy = summary.needsAttention + summary.atRisk + summary.dormant;
  console.log(`\nOverall Health: ${percentage(healthy, summary.totalRelationships)}% healthy, ${percentage(unhealthy, summary.totalRelationships)}% need attention`);

  // ========================================================================
  // EXAMPLE 5: Calculate Health Score for Specific Entity
  // ========================================================================
  console.log('\n=== Example 5: Calculate Health Score ===\n');

  const healthScore = await relationshipTracker.calculateHealthScore(
    customerId,
    'CUSTOMER',
    orgId,
  );

  console.log(`Customer Health Score: ${healthScore}/100`);

  if (healthScore >= 80) {
    console.log('Status: Excellent relationship - keep it up!');
  } else if (healthScore >= 60) {
    console.log('Status: Good relationship - maintain regular contact');
  } else if (healthScore >= 40) {
    console.log('Status: Needs attention - schedule a check-in');
  } else if (healthScore >= 20) {
    console.log('Status: At risk - urgent outreach needed');
  } else {
    console.log('Status: Dormant - re-engagement campaign recommended');
  }

  // ========================================================================
  // EXAMPLE 6: Integration with Email Processing Pipeline
  // ========================================================================
  console.log('\n=== Example 6: Email Processing Pipeline Integration ===\n');

  /**
   * In a real email processing pipeline, you would:
   *
   * 1. Classify the email (EmailClassifierService)
   * 2. Extract entities (EntityExtractorService)
   * 3. Auto-create/match customer/vendor (CustomerAutoCreatorService/VendorAutoCreatorService)
   * 4. Update relationship metrics (RelationshipTrackerService) <-- THIS SERVICE
   *
   * Example:
   */

  /*
  async function processIncomingEmail(email: EmailMessage, orgId: string) {
    // Step 1: Classify
    const classification = await emailClassifier.classifyEmail(email);

    // Step 2: Extract entities
    const entities = await entityExtractor.extractEntities(email);

    // Step 3: Auto-create/match
    const customerResult = await customerAutoCreator.processEmail(
      email,
      classification,
      entities,
      orgId
    );

    // Step 4: Update relationship metrics (if customer was created/matched)
    if (customerResult.customer) {
      const metrics = await relationshipTracker.updateRelationshipMetrics(
        customerResult.customer.id,
        'CUSTOMER',
        email,
        orgId
      );

      // Check if any alerts were generated
      if (metrics.alerts.length > 0) {
        // Send notifications to team
        await notifyTeam(metrics.alerts);
      }
    }
  }
  */

  console.log('Integration example shown in comments above.');

  // ========================================================================
  // EXAMPLE 7: Dashboard Queries
  // ========================================================================
  console.log('\n=== Example 7: Dashboard Queries ===\n');

  // Get customers that need attention this week
  const needsAttention = await relationshipTracker.getAtRiskRelationships(orgId);
  console.log(`Customers/Vendors needing attention: ${needsAttention.length}`);

  // Get customers to re-engage
  const toReEngage = await relationshipTracker.getDormantRelationships(orgId, 60);
  console.log(`Relationships to re-engage (60+ days): ${toReEngage.length}`);

  // Get overall health
  const overallHealth = await relationshipTracker.getRelationshipSummary(orgId);
  const healthPercentage = percentage(
    overallHealth.excellent + overallHealth.good,
    overallHealth.totalRelationships,
  );
  console.log(`Overall relationship health: ${healthPercentage}%`);

  await prisma.$disconnect();
}

// Helper function
function percentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples()
    .then(() => {
      console.log('\n=== Examples completed ===\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error running examples:', error);
      process.exit(1);
    });
}
