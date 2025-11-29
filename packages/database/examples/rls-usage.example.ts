/**
 * RLS Usage Examples
 *
 * This file demonstrates how to use Row-Level Security features
 * in the Operate/CoachOS platform.
 *
 * DO NOT run this file directly - it's for reference only.
 */

import { AsyncLocalStorage } from 'async_hooks';
import {
  prisma,
  setTenantContext,
  clearTenantContext,
  withTenantContext,
  withRlsBypass,
  tenantContextMiddleware,
  createTenantContextMiddleware,
  RLS,
} from '@operate/database';

// ============================================================================
// Example 1: Basic Tenant Context Management
// ============================================================================

async function example1_basicUsage() {
  // Set tenant context
  await setTenantContext(prisma, 'org-uuid-123');

  // All queries are now scoped to org-uuid-123
  const memberships = await prisma.membership.findMany();
  console.log('Memberships:', memberships.length);

  // Clear context
  await clearTenantContext(prisma);
}

// ============================================================================
// Example 2: Using AsyncLocalStorage with Middleware
// ============================================================================

// Create storage for tenant context
const tenantStorage = new AsyncLocalStorage<{ orgId: string; userId: string }>();

// Register middleware
prisma.$use(
  tenantContextMiddleware(() => tenantStorage.getStore()?.orgId || null)
);

// Simulate Express/Fastify route handler
async function example2_expressRoute(req: any, res: any) {
  const orgId = req.user.currentOrgId;
  const userId = req.user.id;

  // Run handler within tenant context
  await tenantStorage.run({ orgId, userId }, async () => {
    // All Prisma queries here are automatically scoped
    const memberships = await prisma.membership.findMany();
    const auditLogs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ memberships, auditLogs });
  });
}

// ============================================================================
// Example 3: Scoped Operations with withTenantContext
// ============================================================================

async function example3_scopedOperations() {
  // Get member count for specific organization
  const org1MemberCount = await withTenantContext(prisma, 'org-1', async () => {
    return await prisma.membership.count();
  });

  // Get member count for different organization
  const org2MemberCount = await withTenantContext(prisma, 'org-2', async () => {
    return await prisma.membership.count();
  });

  console.log('Org 1 members:', org1MemberCount);
  console.log('Org 2 members:', org2MemberCount);
}

// ============================================================================
// Example 4: System Operations with RLS Bypass
// ============================================================================

async function example4_systemOperations() {
  // Get statistics across all organizations (admin dashboard)
  const stats = await withRlsBypass(prisma, async () => {
    const totalOrgs = await prisma.organisation.count();
    const totalMembers = await prisma.membership.count();
    const totalAuditLogs = await prisma.auditLog.count();

    return { totalOrgs, totalMembers, totalAuditLogs };
  });

  console.log('Platform Statistics:', stats);
}

// ============================================================================
// Example 5: Advanced Middleware Configuration
// ============================================================================

function example5_advancedMiddleware() {
  const middleware = createTenantContextMiddleware({
    // Get tenant ID from storage
    getTenantId: () => {
      const store = tenantStorage.getStore();
      return store?.orgId || null;
    },

    // Custom skip logic
    shouldSkip: (params) => {
      // Skip for user lookup queries (users belong to multiple orgs)
      if (params.model === 'User' && params.action === 'findUnique') {
        return true;
      }

      // Skip for session management
      if (params.model === 'Session') {
        return true;
      }

      return false;
    },

    // Enable debug in development
    debug: process.env.NODE_ENV === 'development',
  });

  prisma.$use(middleware);
}

// ============================================================================
// Example 6: Secure Organization Switching
// ============================================================================

async function example6_switchOrganization(userId: string, targetOrgId: string) {
  // First, verify user has access to the target organization
  const membership = await withRlsBypass(prisma, async () => {
    return await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId: targetOrgId,
        },
      },
    });
  });

  if (!membership) {
    throw new Error('User does not have access to this organization');
  }

  // Set tenant context for the user's session
  await setTenantContext(prisma, targetOrgId);

  console.log(`Switched to organization: ${targetOrgId}`);
}

// ============================================================================
// Example 7: Transaction with Tenant Context
// ============================================================================

async function example7_transactionWithContext(orgId: string) {
  // Set context before transaction
  await setTenantContext(prisma, orgId);

  // Context is preserved within transaction
  await prisma.$transaction(async (tx) => {
    // Create membership
    const membership = await tx.membership.create({
      data: {
        userId: 'user-123',
        orgId: orgId,
        role: 'MEMBER',
      },
    });

    // Create audit log (automatically scoped to same org)
    await tx.auditLog.create({
      data: {
        orgId: orgId,
        userId: 'user-123',
        action: 'membership.created',
        entityType: 'Membership',
        entityId: membership.id,
        newValue: membership,
      },
    });
  });
}

// ============================================================================
// Example 8: Using RLS Namespace
// ============================================================================

async function example8_rlsNamespace() {
  // Alternative way to use RLS functions via namespace
  await RLS.setTenantContext(prisma, 'org-uuid-123');

  const currentTenant = await RLS.getTenantContext(prisma);
  console.log('Current tenant:', currentTenant);

  const isBypassed = await RLS.isRlsBypassed(prisma);
  console.log('RLS bypassed?', isBypassed);

  await RLS.clearTenantContext(prisma);
}

// ============================================================================
// Example 9: Background Job Processing
// ============================================================================

async function example9_backgroundJob(orgId: string) {
  // Background jobs need explicit tenant context
  await withTenantContext(prisma, orgId, async () => {
    // Process organization-specific data
    const recentLogs = await prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Generate report, send notifications, etc.
    console.log(`Processing ${recentLogs.length} logs for org ${orgId}`);
  });
}

// ============================================================================
// Example 10: Multi-Org Query (Using Bypass)
// ============================================================================

async function example10_multiOrgQuery(orgIds: string[]) {
  // For queries spanning multiple organizations, use bypass
  const memberships = await withRlsBypass(prisma, async () => {
    return await prisma.membership.findMany({
      where: {
        orgId: {
          in: orgIds,
        },
      },
      include: {
        organisation: true,
        user: true,
      },
    });
  });

  // Group by organization
  const byOrg = memberships.reduce((acc, m) => {
    if (!acc[m.orgId]) acc[m.orgId] = [];
    acc[m.orgId].push(m);
    return acc;
  }, {} as Record<string, typeof memberships>);

  return byOrg;
}

// ============================================================================
// Example 11: Error Handling
// ============================================================================

async function example11_errorHandling(orgId: string) {
  try {
    await withTenantContext(prisma, orgId, async () => {
      // If error occurs, context is still restored
      const memberships = await prisma.membership.findMany();

      if (memberships.length === 0) {
        throw new Error('No memberships found');
      }

      return memberships;
    });
  } catch (error) {
    console.error('Error occurred, but tenant context was restored');
    // Handle error
  }
}

// ============================================================================
// Example 12: Testing RLS
// ============================================================================

async function example12_testingRls() {
  // Test 1: Verify isolation
  await setTenantContext(prisma, 'org-1');
  const org1Members = await prisma.membership.findMany();
  console.assert(
    org1Members.every(m => m.orgId === 'org-1'),
    'All members should belong to org-1'
  );

  // Test 2: Verify context switching
  await setTenantContext(prisma, 'org-2');
  const org2Members = await prisma.membership.findMany();
  console.assert(
    org2Members.every(m => m.orgId === 'org-2'),
    'All members should belong to org-2'
  );

  // Test 3: Verify no access without context
  await clearTenantContext(prisma);
  const noContextMembers = await prisma.membership.findMany();
  console.assert(
    noContextMembers.length === 0,
    'Should have no access without context'
  );

  console.log('All RLS tests passed!');
}

// ============================================================================
// Export examples for reference
// ============================================================================

export {
  example1_basicUsage,
  example2_expressRoute,
  example3_scopedOperations,
  example4_systemOperations,
  example5_advancedMiddleware,
  example6_switchOrganization,
  example7_transactionWithContext,
  example8_rlsNamespace,
  example9_backgroundJob,
  example10_multiOrgQuery,
  example11_errorHandling,
  example12_testingRls,
};
