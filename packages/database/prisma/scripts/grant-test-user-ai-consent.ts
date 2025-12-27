/**
 * Grant AI Consent to Test User
 *
 * Sets the aiConsentAt field for the test user so they can use AI chat features.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_USER_EMAIL = 'luk.gber@gmail.com';

async function main() {
  console.log('Granting AI consent to test user...\n');

  try {
    // 1. Find the user
    console.log(`Looking for user: ${TEST_USER_EMAIL}`);
    const user = await prisma.user.findUnique({
      where: { email: TEST_USER_EMAIL },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        aiConsentAt: true,
      },
    });

    if (!user) {
      console.error(`User not found: ${TEST_USER_EMAIL}`);
      process.exit(1);
    }

    console.log(`Found user: ${user.id}`);
    console.log(`Name: ${user.firstName} ${user.lastName}`);
    console.log(`Current AI consent: ${user.aiConsentAt ? `Granted at ${user.aiConsentAt.toISOString()}` : 'NOT GRANTED'}`);

    // 2. Grant AI consent if not already granted
    if (!user.aiConsentAt) {
      console.log('\nGranting AI consent...');
      const now = new Date();
      await prisma.user.update({
        where: { id: user.id },
        data: { aiConsentAt: now },
      });
      console.log(`AI consent granted at: ${now.toISOString()}`);
    } else {
      console.log('\nAI consent already granted.');
    }

    // 3. Verify
    const updatedUser = await prisma.user.findUnique({
      where: { email: TEST_USER_EMAIL },
      select: {
        id: true,
        aiConsentAt: true,
      },
    });

    console.log('\n--- Verification ---');
    console.log(`AI consent status: ${updatedUser?.aiConsentAt ? 'GRANTED' : 'NOT GRANTED'}`);
    if (updatedUser?.aiConsentAt) {
      console.log(`Consented at: ${updatedUser.aiConsentAt.toISOString()}`);
    }

    console.log('\nTest user AI consent granted successfully!');
  } catch (error) {
    console.error('Error granting AI consent:', error);
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
