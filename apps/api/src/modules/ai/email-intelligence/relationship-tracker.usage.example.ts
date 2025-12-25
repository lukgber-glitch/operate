/**
 * Relationship Tracker Service - Usage Examples
 *
 * This file demonstrates how to use the RelationshipTrackerService
 * to track client interactions and monitor relationship health.
 */

import { RelationshipTrackerService } from './relationship-tracker.service';
import { PrismaService } from '../../database/prisma.service';

/**
 * Example 1: Track a client interaction (email, invoice, payment, etc.)
 */
async function exampleTrackInteraction(
  relationshipService: RelationshipTrackerService,
  clientId: string,
  orgId: string,
) {
  // Track an email interaction
  await relationshipService.trackInteraction(
    clientId,
    'email',
    {
      subject: 'Re: Project update',
      from: 'client@example.com',
      to: 'support@operate.guru',
      date: new Date(),
    },
    orgId,
  );

  // Track an invoice interaction
  await relationshipService.trackInteraction(
    clientId,
    'invoice',
    {
      subject: 'Invoice #12345',
      amount: 1500,
      date: new Date(),
    },
    orgId,
  );

  // Track a payment interaction
  await relationshipService.trackInteraction(
    clientId,
    'payment',
    {
      subject: 'Payment received',
      amount: 1500,
      date: new Date(),
    },
    orgId,
  );

  // Track a call/meeting
  await relationshipService.trackInteraction(
    clientId,
    'meeting',
    {
      subject: 'Quarterly review meeting',
      date: new Date(),
    },
    orgId,
  );

  console.log('✅ Interaction tracked successfully');
}

/**
 * Example 2: Get client health score (0-100)
 */
async function exampleGetClientHealthScore(
  relationshipService: RelationshipTrackerService,
  clientId: string,
  orgId: string,
) {
  const healthScore = await relationshipService.getClientHealthScore(
    clientId,
    orgId,
  );

  console.log(`Client health score: ${healthScore}/100`);

  // Interpret the score
  if (healthScore >= 80) {
    console.log('✅ Excellent relationship');
  } else if (healthScore >= 60) {
    console.log('👍 Good relationship');
  } else if (healthScore >= 40) {
    console.log('⚠️ Needs attention');
  } else if (healthScore >= 20) {
    console.log('🚨 At risk');
  } else {
    console.log('💤 Dormant relationship');
  }

  return healthScore;
}

/**
 * Example 3: Get all at-risk clients that need attention
 */
async function exampleGetAtRiskClients(
  relationshipService: RelationshipTrackerService,
  orgId: string,
) {
  const atRiskClients = await relationshipService.getAtRiskClients(orgId);

  console.log(`Found ${atRiskClients.length} at-risk clients:`);

  atRiskClients.forEach((client) => {
    console.log(`
      - ${client.entityName} (${client.entityType})
        Health Score: ${client.metrics.healthScore}/100
        Status: ${client.metrics.healthStatus}
        Days since contact: ${client.metrics.daysSinceLastContact}
        Action: ${client.suggestedAction}
    `);
  });

  return atRiskClients;
}

/**
 * Example 4: Monitor relationship health for all clients
 */
async function exampleMonitorAllClients(
  relationshipService: RelationshipTrackerService,
  prisma: PrismaService,
  orgId: string,
) {
  // Get all customers
  const customers = await prisma.customer.findMany({
    where: { orgId },
    select: { id: true, name: true },
  });

  console.log(`Checking health for ${customers.length} customers...`);

  for (const customer of customers) {
    const healthScore = await relationshipService.getClientHealthScore(
      customer.id,
      orgId,
    );

    if (healthScore < 40) {
      console.log(`⚠️ ${customer.name}: Health score ${healthScore}/100 - Needs attention!`);
    }
  }
}

/**
 * Example 5: Get detailed relationship metrics
 */
async function exampleGetDetailedMetrics(
  relationshipService: RelationshipTrackerService,
  clientId: string,
  orgId: string,
) {
  // Get comprehensive relationship summary
  const summary = await relationshipService.getRelationshipSummary(orgId);

  console.log('Relationship Health Summary:');
  console.log(`  Total: ${summary.totalRelationships}`);
  console.log(`  ✅ Excellent: ${summary.excellent}`);
  console.log(`  👍 Good: ${summary.good}`);
  console.log(`  ⚠️ Needs Attention: ${summary.needsAttention}`);
  console.log(`  🚨 At Risk: ${summary.atRisk}`);
  console.log(`  💤 Dormant: ${summary.dormant}`);

  // Get dormant relationships
  const dormantClients = await relationshipService.getDormantRelationships(orgId);
  console.log(`\nDormant relationships (90+ days no contact): ${dormantClients.length}`);

  dormantClients.forEach((client) => {
    console.log(`  - ${client.entityName}: ${client.metrics.daysSinceLastContact} days since contact`);
  });
}

/**
 * Complete workflow example
 */
async function completeWorkflowExample(
  relationshipService: RelationshipTrackerService,
  prisma: PrismaService,
  orgId: string,
) {
  console.log('=== Relationship Tracking Workflow ===\n');

  // Step 1: Track interactions as they happen
  console.log('Step 1: Tracking client interactions...');
  const customer = await prisma.customer.findFirst({ where: { orgId } });

  if (customer) {
    await relationshipService.trackInteraction(
      customer.id,
      'email',
      {
        subject: 'Follow-up on proposal',
        from: customer.email || 'client@example.com',
        to: 'sales@operate.guru',
      },
      orgId,
    );
    console.log('✅ Interaction tracked\n');
  }

  // Step 2: Check individual client health
  console.log('Step 2: Checking individual client health...');
  if (customer) {
    const score = await exampleGetClientHealthScore(
      relationshipService,
      customer.id,
      orgId,
    );
    console.log('');
  }

  // Step 3: Identify at-risk clients
  console.log('Step 3: Identifying at-risk clients...');
  const atRisk = await exampleGetAtRiskClients(relationshipService, orgId);
  console.log('');

  // Step 4: Get organization-wide summary
  console.log('Step 4: Getting organization-wide summary...');
  if (customer) {
    await exampleGetDetailedMetrics(relationshipService, customer.id, orgId);
  }

  console.log('\n=== Workflow Complete ===');
}

/**
 * Integration with email processing pipeline
 */
async function exampleEmailPipelineIntegration(
  relationshipService: RelationshipTrackerService,
  email: {
    from: string;
    to: string;
    subject: string;
    customerId?: string;
    vendorId?: string;
  },
  orgId: string,
) {
  // When processing an email, automatically track the interaction
  const clientId = email.customerId || email.vendorId;

  if (clientId) {
    await relationshipService.trackInteraction(
      clientId,
      'email',
      {
        subject: email.subject,
        from: email.from,
        to: email.to,
        date: new Date(),
      },
      orgId,
    );

    // Check if relationship needs attention
    const healthScore = await relationshipService.getClientHealthScore(
      clientId,
      orgId,
    );

    if (healthScore < 40) {
      console.log(`⚠️ Warning: This client's relationship health is declining (${healthScore}/100)`);
      console.log('Consider prioritizing your response or scheduling a follow-up call.');
    }
  }
}

// Export examples for testing
export {
  exampleTrackInteraction,
  exampleGetClientHealthScore,
  exampleGetAtRiskClients,
  exampleMonitorAllClients,
  exampleGetDetailedMetrics,
  completeWorkflowExample,
  exampleEmailPipelineIntegration,
};
