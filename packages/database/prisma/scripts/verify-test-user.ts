import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_USER_EMAIL = 'luk.gber@gmail.com';

async function main() {
  console.log('🔍 Verifying test user account...\n');

  try {
    const user = await prisma.user.findUnique({
      where: { email: TEST_USER_EMAIL },
      include: {
        onboardingProgress: true,
        sessions: true,
        memberships: {
          include: {
            organisation: true,
          },
        },
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${TEST_USER_EMAIL}`);
      process.exit(1);
    }

    console.log('👤 User Information:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Locale: ${user.locale}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Last Login: ${user.lastLoginAt || 'Never'}`);
    console.log(`   MFA Enabled: ${user.mfaEnabled}`);

    console.log('\n🔐 Account Status:');
    console.log(`   Active Sessions: ${user.sessions.length}`);
    console.log(`   Account Locked: ${user.sessions.length > 5 ? 'Yes (too many sessions)' : 'No'}`);

    console.log('\n📋 Onboarding Status:');
    if (user.onboardingProgress) {
      console.log(`   Current Step: ${user.onboardingProgress.currentStep}`);
      console.log(`   Completed Steps: ${user.onboardingProgress.completedSteps.length} steps`);
      console.log(`   Steps: ${user.onboardingProgress.completedSteps.join(', ')}`);
      console.log(`   Started At: ${user.onboardingProgress.startedAt}`);
      console.log(`   Completed At: ${user.onboardingProgress.completedAt || 'Not completed'}`);
      console.log(`   Status: ${user.onboardingProgress.completedAt ? '✅ COMPLETE' : '⚠️  INCOMPLETE'}`);
    } else {
      console.log('   ❌ No onboarding progress found');
    }

    console.log('\n🏢 Organization Memberships:');
    if (user.memberships.length > 0) {
      user.memberships.forEach((membership, i) => {
        console.log(`   ${i + 1}. ${membership.organisation.name} (${membership.role})`);
        console.log(`      Org ID: ${membership.orgId}`);
        console.log(`      Joined: ${membership.acceptedAt || 'Pending'}`);
      });
    } else {
      console.log('   ⚠️  No organization memberships');
    }

    console.log('\n✅ User account is ready for login!');
  } catch (error) {
    console.error('\n❌ Error verifying user:', error);
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
