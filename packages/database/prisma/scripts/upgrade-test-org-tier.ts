/**
 * Upgrade Test Organization to Pro Tier
 *
 * Upgrades the test user's organization to the "pro" tier
 * which has unlimited AI messages for proper testing.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_USER_EMAIL = 'luk.gber@gmail.com';

async function main() {
  console.log('Upgrading test organization to Pro tier...\n');

  try {
    // 1. Find the user
    console.log(`Looking for user: ${TEST_USER_EMAIL}`);
    const user = await prisma.user.findUnique({
      where: { email: TEST_USER_EMAIL },
      include: {
        memberships: {
          include: {
            organisation: true,
          },
        },
      },
    });

    if (!user) {
      console.error(`User not found: ${TEST_USER_EMAIL}`);
      process.exit(1);
    }

    console.log(`Found user: ${user.id}`);
    console.log(`Name: ${user.firstName} ${user.lastName}`);

    // 2. Check memberships
    console.log('\nOrganizations:');
    if (user.memberships.length === 0) {
      console.log('  No memberships found!');
      process.exit(1);
    }

    for (const membership of user.memberships) {
      console.log(`  - ${membership.organisation.name}`);
      console.log(`    Current tier: ${membership.organisation.subscriptionTier}`);
      console.log(`    Role: ${membership.role}`);

      // Upgrade to pro tier if not already
      if (membership.organisation.subscriptionTier !== 'pro' &&
          membership.organisation.subscriptionTier !== 'business') {
        console.log(`    Upgrading to Pro tier...`);
        await prisma.organisation.update({
          where: { id: membership.organisation.id },
          data: { subscriptionTier: 'pro' },
        });
        console.log(`    Done!`);
      } else {
        console.log(`    Already on Pro/Business tier`);
      }
    }

    // 3. Verify and show AI message limits
    console.log('\n--- Verification ---');
    const updatedUser = await prisma.user.findUnique({
      where: { email: TEST_USER_EMAIL },
      include: {
        memberships: {
          include: {
            organisation: true,
          },
        },
      },
    });

    for (const membership of updatedUser!.memberships) {
      const tier = await prisma.subscriptionTier.findUnique({
        where: { name: membership.organisation.subscriptionTier },
      });

      const limits = tier?.limits as Record<string, number> || {};
      const aiLimit = limits['AI_MESSAGES'];

      console.log(`\n${membership.organisation.name}:`);
      console.log(`  Tier: ${membership.organisation.subscriptionTier}`);
      console.log(`  AI Messages Limit: ${aiLimit === -1 ? 'UNLIMITED' : aiLimit}`);
    }

    // 4. Clear any existing usage events for this month (optional - reset usage)
    console.log('\n--- Clearing AI usage events for this month ---');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const membership of updatedUser!.memberships) {
      const deleted = await prisma.usageEvent.deleteMany({
        where: {
          organisationId: membership.orgId,
          feature: 'AI_MESSAGES',
          timestamp: { gte: startOfMonth },
        },
      });
      console.log(`  Cleared ${deleted.count} AI_MESSAGES usage events for ${membership.organisation.name}`);
    }

    console.log('\nTest organization upgraded successfully!');
    console.log('The organization now has unlimited AI messages (Pro tier).');
  } catch (error) {
    console.error('Error upgrading organization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
