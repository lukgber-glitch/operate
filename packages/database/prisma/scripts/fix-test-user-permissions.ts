/**
 * Fix Test User Permissions
 *
 * Ensures the test user has OWNER role in their organization
 * so they can access all chat features.
 */

import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_USER_EMAIL = 'luk.gber@gmail.com';

async function main() {
  console.log('Fixing test user permissions...\n');

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
    console.log('\nCurrent memberships:');
    if (user.memberships.length === 0) {
      console.log('  No memberships found!');
      process.exit(1);
    }

    for (const membership of user.memberships) {
      console.log(`  - ${membership.organisation.name} (${membership.role})`);

      // Update to OWNER if not already
      if (membership.role !== Role.OWNER) {
        console.log(`    Upgrading to OWNER...`);
        await prisma.membership.update({
          where: {
            userId_orgId: {
              userId: user.id,
              orgId: membership.orgId,
            },
          },
          data: {
            role: Role.OWNER,
          },
        });
        console.log(`    Done!`);
      } else {
        console.log(`    Already OWNER`);
      }
    }

    // 3. Verify
    console.log('\nVerification:');
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
      console.log(`  - ${membership.organisation.name}: ${membership.role}`);
    }

    console.log('\nTest user permissions fixed!');
    console.log('The user now has OWNER role in all organizations.');
  } catch (error) {
    console.error('Error fixing permissions:', error);
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
