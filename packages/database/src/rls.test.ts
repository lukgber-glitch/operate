/**
 * Row-Level Security (RLS) Tests
 *
 * Verifies that RLS policies correctly enforce tenant isolation
 * and that helper functions work as expected.
 */

import { PrismaClient } from '@prisma/client';
import {
  setTenantContext,
  clearTenantContext,
  getTenantContext,
  enableRlsBypass,
  disableRlsBypass,
  isRlsBypassed,
  withTenantContext,
  withRlsBypass,
} from './rls';

describe('RLS Helper Functions', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear context before each test
    await clearTenantContext(prisma);
    await disableRlsBypass(prisma);
  });

  describe('Tenant Context Management', () => {
    it('should set tenant context', async () => {
      const orgId = 'org-test-123';
      await setTenantContext(prisma, orgId);

      const currentContext = await getTenantContext(prisma);
      expect(currentContext).toBe(orgId);
    });

    it('should clear tenant context', async () => {
      await setTenantContext(prisma, 'org-test-123');
      await clearTenantContext(prisma);

      const currentContext = await getTenantContext(prisma);
      expect(currentContext).toBeNull();
    });

    it('should get null when no context is set', async () => {
      const currentContext = await getTenantContext(prisma);
      expect(currentContext).toBeNull();
    });

    it('should update tenant context', async () => {
      await setTenantContext(prisma, 'org-1');
      expect(await getTenantContext(prisma)).toBe('org-1');

      await setTenantContext(prisma, 'org-2');
      expect(await getTenantContext(prisma)).toBe('org-2');
    });
  });

  describe('RLS Bypass Management', () => {
    it('should enable RLS bypass', async () => {
      await enableRlsBypass(prisma);

      const bypassed = await isRlsBypassed(prisma);
      expect(bypassed).toBe(true);
    });

    it('should disable RLS bypass', async () => {
      await enableRlsBypass(prisma);
      await disableRlsBypass(prisma);

      const bypassed = await isRlsBypassed(prisma);
      expect(bypassed).toBe(false);
    });

    it('should return false when bypass not set', async () => {
      const bypassed = await isRlsBypassed(prisma);
      expect(bypassed).toBe(false);
    });
  });

  describe('withTenantContext', () => {
    it('should execute callback with tenant context', async () => {
      const orgId = 'org-callback-test';

      const result = await withTenantContext(prisma, orgId, async () => {
        const context = await getTenantContext(prisma);
        return context;
      });

      expect(result).toBe(orgId);
    });

    it('should restore previous context after callback', async () => {
      await setTenantContext(prisma, 'org-initial');

      await withTenantContext(prisma, 'org-temporary', async () => {
        expect(await getTenantContext(prisma)).toBe('org-temporary');
      });

      expect(await getTenantContext(prisma)).toBe('org-initial');
    });

    it('should restore null context if none was set', async () => {
      await withTenantContext(prisma, 'org-temporary', async () => {
        expect(await getTenantContext(prisma)).toBe('org-temporary');
      });

      expect(await getTenantContext(prisma)).toBeNull();
    });

    it('should restore context even if callback throws', async () => {
      await setTenantContext(prisma, 'org-initial');

      try {
        await withTenantContext(prisma, 'org-temporary', async () => {
          throw new Error('Test error');
        });
      } catch (error) {
        // Expected
      }

      expect(await getTenantContext(prisma)).toBe('org-initial');
    });

    it('should return callback result', async () => {
      const result = await withTenantContext(prisma, 'org-test', async () => {
        return { data: 'test-data', count: 42 };
      });

      expect(result).toEqual({ data: 'test-data', count: 42 });
    });
  });

  describe('withRlsBypass', () => {
    it('should execute callback with bypass enabled', async () => {
      const result = await withRlsBypass(prisma, async () => {
        return await isRlsBypassed(prisma);
      });

      expect(result).toBe(true);
    });

    it('should restore bypass state after callback', async () => {
      await disableRlsBypass(prisma);

      await withRlsBypass(prisma, async () => {
        expect(await isRlsBypassed(prisma)).toBe(true);
      });

      expect(await isRlsBypassed(prisma)).toBe(false);
    });

    it('should preserve bypass if already enabled', async () => {
      await enableRlsBypass(prisma);

      await withRlsBypass(prisma, async () => {
        expect(await isRlsBypassed(prisma)).toBe(true);
      });

      expect(await isRlsBypassed(prisma)).toBe(true);
    });

    it('should restore bypass state even if callback throws', async () => {
      await disableRlsBypass(prisma);

      try {
        await withRlsBypass(prisma, async () => {
          throw new Error('Test error');
        });
      } catch (error) {
        // Expected
      }

      expect(await isRlsBypassed(prisma)).toBe(false);
    });

    it('should return callback result', async () => {
      const result = await withRlsBypass(prisma, async () => {
        return { bypassed: true, data: [1, 2, 3] };
      });

      expect(result).toEqual({ bypassed: true, data: [1, 2, 3] });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid context switching', async () => {
      await setTenantContext(prisma, 'org-1');
      await setTenantContext(prisma, 'org-2');
      await setTenantContext(prisma, 'org-3');

      expect(await getTenantContext(prisma)).toBe('org-3');
    });

    it('should handle nested withTenantContext calls', async () => {
      const results: string[] = [];

      await withTenantContext(prisma, 'org-outer', async () => {
        results.push(await getTenantContext(prisma) || '');

        await withTenantContext(prisma, 'org-inner', async () => {
          results.push(await getTenantContext(prisma) || '');
        });

        results.push(await getTenantContext(prisma) || '');
      });

      expect(results).toEqual(['org-outer', 'org-inner', 'org-outer']);
    });

    it('should handle context with bypass enabled', async () => {
      await setTenantContext(prisma, 'org-test');
      await enableRlsBypass(prisma);

      expect(await getTenantContext(prisma)).toBe('org-test');
      expect(await isRlsBypassed(prisma)).toBe(true);
    });
  });
});

describe('RLS Tenant Isolation', () => {
  let prisma: PrismaClient;
  let org1Id: string;
  let org2Id: string;
  let user1Id: string;
  let user2Id: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

    // Create test data with bypass enabled
    await withRlsBypass(prisma, async () => {
      // Create organizations
      const org1 = await prisma.organisation.create({
        data: {
          name: 'Test Org 1',
          slug: 'test-org-1-rls',
          country: 'DE',
        },
      });
      org1Id = org1.id;

      const org2 = await prisma.organisation.create({
        data: {
          name: 'Test Org 2',
          slug: 'test-org-2-rls',
          country: 'DE',
        },
      });
      org2Id = org2.id;

      // Create users
      const user1 = await prisma.user.create({
        data: {
          email: 'user1-rls@test.com',
          firstName: 'User',
          lastName: 'One',
        },
      });
      user1Id = user1.id;

      const user2 = await prisma.user.create({
        data: {
          email: 'user2-rls@test.com',
          firstName: 'User',
          lastName: 'Two',
        },
      });
      user2Id = user2.id;

      // Create memberships
      await prisma.membership.create({
        data: {
          userId: user1Id,
          orgId: org1Id,
          role: 'ADMIN',
        },
      });

      await prisma.membership.create({
        data: {
          userId: user2Id,
          orgId: org2Id,
          role: 'MEMBER',
        },
      });

      // Create audit logs
      await prisma.auditLog.create({
        data: {
          orgId: org1Id,
          userId: user1Id,
          action: 'user.login',
          entityType: 'User',
          entityId: user1Id,
        },
      });

      await prisma.auditLog.create({
        data: {
          orgId: org2Id,
          userId: user2Id,
          action: 'user.login',
          entityType: 'User',
          entityId: user2Id,
        },
      });
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await withRlsBypass(prisma, async () => {
      await prisma.auditLog.deleteMany({
        where: { orgId: { in: [org1Id, org2Id] } },
      });
      await prisma.membership.deleteMany({
        where: { orgId: { in: [org1Id, org2Id] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [user1Id, user2Id] } },
      });
      await prisma.organisation.deleteMany({
        where: { id: { in: [org1Id, org2Id] } },
      });
    });

    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearTenantContext(prisma);
    await disableRlsBypass(prisma);
  });

  describe('Membership Isolation', () => {
    it('should only return memberships for current org', async () => {
      await setTenantContext(prisma, org1Id);

      const memberships = await prisma.membership.findMany();

      expect(memberships).toHaveLength(1);
      expect(memberships[0].orgId).toBe(org1Id);
      expect(memberships[0].userId).toBe(user1Id);
    });

    it('should switch context between orgs', async () => {
      await setTenantContext(prisma, org1Id);
      const org1Memberships = await prisma.membership.findMany();
      expect(org1Memberships).toHaveLength(1);
      expect(org1Memberships[0].orgId).toBe(org1Id);

      await setTenantContext(prisma, org2Id);
      const org2Memberships = await prisma.membership.findMany();
      expect(org2Memberships).toHaveLength(1);
      expect(org2Memberships[0].orgId).toBe(org2Id);
    });

    it('should block access without tenant context', async () => {
      const memberships = await prisma.membership.findMany();
      expect(memberships).toHaveLength(0);
    });

    it('should allow access with bypass enabled', async () => {
      await enableRlsBypass(prisma);

      const memberships = await prisma.membership.findMany({
        where: { orgId: { in: [org1Id, org2Id] } },
      });

      expect(memberships.length).toBeGreaterThanOrEqual(2);
    });

    it('should prevent cross-tenant access via findUnique', async () => {
      await setTenantContext(prisma, org1Id);

      // Get org2's membership ID
      let org2MembershipId: string;
      await withRlsBypass(prisma, async () => {
        const membership = await prisma.membership.findFirst({
          where: { orgId: org2Id },
        });
        org2MembershipId = membership!.id;
      });

      // Try to access org2's membership from org1 context
      const membership = await prisma.membership.findUnique({
        where: { id: org2MembershipId! },
      });

      expect(membership).toBeNull();
    });
  });

  describe('AuditLog Isolation', () => {
    it('should only return audit logs for current org', async () => {
      await setTenantContext(prisma, org1Id);

      const auditLogs = await prisma.auditLog.findMany();

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].orgId).toBe(org1Id);
      expect(auditLogs[0].userId).toBe(user1Id);
    });

    it('should switch context between orgs for audit logs', async () => {
      await setTenantContext(prisma, org1Id);
      const org1Logs = await prisma.auditLog.findMany();
      expect(org1Logs).toHaveLength(1);
      expect(org1Logs[0].orgId).toBe(org1Id);

      await setTenantContext(prisma, org2Id);
      const org2Logs = await prisma.auditLog.findMany();
      expect(org2Logs).toHaveLength(1);
      expect(org2Logs[0].orgId).toBe(org2Id);
    });

    it('should block audit log access without context', async () => {
      const auditLogs = await prisma.auditLog.findMany();
      expect(auditLogs).toHaveLength(0);
    });

    it('should allow audit log access with bypass', async () => {
      await enableRlsBypass(prisma);

      const auditLogs = await prisma.auditLog.findMany({
        where: { orgId: { in: [org1Id, org2Id] } },
      });

      expect(auditLogs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Write Operations', () => {
    it('should only allow creating memberships for current org', async () => {
      await setTenantContext(prisma, org1Id);

      const newUser = await withRlsBypass(prisma, async () => {
        return await prisma.user.create({
          data: {
            email: 'new-user-rls@test.com',
            firstName: 'New',
            lastName: 'User',
          },
        });
      });

      const membership = await prisma.membership.create({
        data: {
          userId: newUser.id,
          orgId: org1Id,
          role: 'MEMBER',
        },
      });

      expect(membership.orgId).toBe(org1Id);

      // Verify it's visible
      const found = await prisma.membership.findUnique({
        where: { id: membership.id },
      });
      expect(found).not.toBeNull();

      // Cleanup
      await prisma.membership.delete({ where: { id: membership.id } });
      await withRlsBypass(prisma, async () => {
        await prisma.user.delete({ where: { id: newUser.id } });
      });
    });

    it('should block updates to other orgs data', async () => {
      await setTenantContext(prisma, org1Id);

      // Get org2's membership ID
      let org2MembershipId: string;
      await withRlsBypass(prisma, async () => {
        const membership = await prisma.membership.findFirst({
          where: { orgId: org2Id },
        });
        org2MembershipId = membership!.id;
      });

      // Try to update org2's membership from org1 context
      const result = await prisma.membership.updateMany({
        where: { id: org2MembershipId! },
        data: { role: 'OWNER' },
      });

      // Should affect 0 rows (blocked by RLS)
      expect(result.count).toBe(0);
    });

    it('should block deletes to other orgs data', async () => {
      // Create a temporary membership for org2
      let tempMembershipId: string;
      await withRlsBypass(prisma, async () => {
        const tempUser = await prisma.user.create({
          data: {
            email: 'temp-delete-rls@test.com',
            firstName: 'Temp',
            lastName: 'User',
          },
        });

        const membership = await prisma.membership.create({
          data: {
            userId: tempUser.id,
            orgId: org2Id,
            role: 'MEMBER',
          },
        });
        tempMembershipId = membership.id;
      });

      // Set context to org1
      await setTenantContext(prisma, org1Id);

      // Try to delete org2's membership
      const result = await prisma.membership.deleteMany({
        where: { id: tempMembershipId! },
      });

      // Should affect 0 rows (blocked by RLS)
      expect(result.count).toBe(0);

      // Verify it still exists
      await withRlsBypass(prisma, async () => {
        const membership = await prisma.membership.findUnique({
          where: { id: tempMembershipId! },
        });
        expect(membership).not.toBeNull();

        // Cleanup
        const user = membership!.user;
        await prisma.membership.delete({ where: { id: tempMembershipId! } });
        await prisma.user.delete({ where: { id: membership!.userId } });
      });
    });
  });

  describe('Transaction Support', () => {
    it('should preserve tenant context in transactions', async () => {
      await setTenantContext(prisma, org1Id);

      const newUser = await withRlsBypass(prisma, async () => {
        return await prisma.user.create({
          data: {
            email: 'txn-user-rls@test.com',
            firstName: 'Transaction',
            lastName: 'User',
          },
        });
      });

      let membershipId: string;
      let auditLogId: string;

      await prisma.$transaction(async (tx) => {
        const membership = await tx.membership.create({
          data: {
            userId: newUser.id,
            orgId: org1Id,
            role: 'MEMBER',
          },
        });
        membershipId = membership.id;

        const auditLog = await tx.auditLog.create({
          data: {
            orgId: org1Id,
            userId: newUser.id,
            action: 'membership.created',
            entityType: 'Membership',
            entityId: membership.id,
          },
        });
        auditLogId = auditLog.id;
      });

      // Verify both records are visible
      const membership = await prisma.membership.findUnique({
        where: { id: membershipId! },
      });
      const auditLog = await prisma.auditLog.findUnique({
        where: { id: auditLogId! },
      });

      expect(membership).not.toBeNull();
      expect(auditLog).not.toBeNull();

      // Cleanup
      await prisma.auditLog.delete({ where: { id: auditLogId! } });
      await prisma.membership.delete({ where: { id: membershipId! } });
      await withRlsBypass(prisma, async () => {
        await prisma.user.delete({ where: { id: newUser.id } });
      });
    });
  });

  describe('Non-Tenant Tables', () => {
    it('should allow access to User table without tenant context', async () => {
      // Users are not tenant-scoped, should be accessible
      const users = await prisma.user.findMany({
        where: { id: { in: [user1Id, user2Id] } },
      });

      expect(users.length).toBe(2);
    });

    it('should allow access to Organisation table without tenant context', async () => {
      // Organisations themselves are not tenant-scoped
      const orgs = await prisma.organisation.findMany({
        where: { id: { in: [org1Id, org2Id] } },
      });

      expect(orgs.length).toBe(2);
    });
  });
});
