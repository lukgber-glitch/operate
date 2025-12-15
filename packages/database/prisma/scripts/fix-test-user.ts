import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_USER_EMAIL = 'luk.gber@gmail.com';

async function main() {
  console.log('🔧 Fixing test user account...\n');

  try {
    // 1. Find the user
    console.log(`📧 Looking for user: ${TEST_USER_EMAIL}`);
    const user = await prisma.user.findUnique({
      where: { email: TEST_USER_EMAIL },
      include: {
        onboardingProgress: true,
        sessions: true,
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${TEST_USER_EMAIL}`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.id}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Sessions: ${user.sessions.length}`);

    // 2. Clear all sessions (this should unlock the account)
    if (user.sessions.length > 0) {
      console.log('\n🗑️  Clearing all sessions...');
      const deletedSessions = await prisma.session.deleteMany({
        where: { userId: user.id },
      });
      console.log(`✅ Deleted ${deletedSessions.count} sessions`);
    } else {
      console.log('\n✅ No sessions to clear');
    }

    // 3. Check onboarding status
    console.log('\n📋 Checking onboarding progress...');
    if (user.onboardingProgress) {
      console.log(`   Current step: ${user.onboardingProgress.currentStep}`);
      console.log(`   Completed steps: ${user.onboardingProgress.completedSteps.join(', ') || 'none'}`);
      console.log(`   Completed at: ${user.onboardingProgress.completedAt || 'not completed'}`);

      if (!user.onboardingProgress.completedAt) {
        console.log('\n✏️  Marking onboarding as complete...');
        const allSteps = ['welcome', 'company', 'integrations', 'banking', 'completion'];
        await prisma.userOnboardingProgress.update({
          where: { userId: user.id },
          data: {
            completedAt: new Date(),
            currentStep: 'completion',
            completedSteps: allSteps,
            lastActivityAt: new Date(),
          },
        });
        console.log(`✅ Onboarding marked as complete`);
      } else {
        console.log('✅ Onboarding already complete');
      }
    } else {
      console.log('⚠️  No onboarding progress found - creating completed record...');
      const allSteps = ['welcome', 'company', 'integrations', 'banking', 'completion'];
      await prisma.userOnboardingProgress.create({
        data: {
          userId: user.id,
          currentStep: 'completion',
          completedSteps: allSteps,
          completedAt: new Date(),
          lastActivityAt: new Date(),
        },
      });
      console.log(`✅ Onboarding record created and marked as complete`);
    }

    // 4. Update last login time
    console.log('\n🕐 Updating last login time...');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });
    console.log('✅ Last login time updated');

    // 5. Final verification
    console.log('\n🔍 Final verification...');
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        onboardingProgress: true,
        sessions: true,
      },
    });

    console.log('\n📊 Updated user state:');
    console.log(`   User ID: ${updatedUser!.id}`);
    console.log(`   Email: ${updatedUser!.email}`);
    console.log(`   Last login: ${updatedUser!.lastLoginAt}`);
    console.log(`   Active sessions: ${updatedUser!.sessions.length}`);
    console.log(`   Onboarding complete: ${updatedUser!.onboardingProgress?.completedAt ? 'Yes' : 'No'}`);

    console.log('\n✅ Test user account fixed successfully!');
    console.log('\n📝 Summary of changes:');
    console.log('   - Cleared all sessions (account unlocked)');
    console.log('   - Marked onboarding as complete');
    console.log('   - Updated last login time');
    console.log('\n🎉 User can now log in successfully!');
  } catch (error) {
    console.error('\n❌ Error fixing user:', error);
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
