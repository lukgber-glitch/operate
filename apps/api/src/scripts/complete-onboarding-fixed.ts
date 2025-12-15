import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function completeOnboarding() {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: 'luk.gber@gmail.com' },
      include: { memberships: true },
    });

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.email} (${user.id})`);

    const membership = user.memberships[0];
    if (!membership) {
      console.error('❌ No organization membership found');
      process.exit(1);
    }

    const orgId = membership.orgId;
    console.log(`✓ Organization ID: ${orgId}`);

    // Find or create onboarding progress
    let onboarding = await prisma.onboardingProgress.findUnique({
      where: { orgId },
    });

    if (!onboarding) {
      console.log('Creating onboarding progress...');
      onboarding = await prisma.onboardingProgress.create({
        data: {
          orgId,
          userId: user.id,
          currentStep: 1,
          isCompleted: false,
        },
      });
    }

    console.log(`Current onboarding status: isCompleted=${onboarding.isCompleted}, step=${onboarding.currentStep}`);

    // Mark onboarding as complete
    const updated = await prisma.onboardingProgress.update({
      where: { id: onboarding.id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        currentStep: 6,
        companyInfoStatus: 'COMPLETED',
        bankingStatus: 'SKIPPED',
        emailStatus: 'SKIPPED',
        taxStatus: 'SKIPPED',
        accountingStatus: 'SKIPPED',
        preferencesStatus: 'COMPLETED',
      },
    });

    console.log('✓ Onboarding marked as complete!');
    console.log(`  - Completed at: ${updated.completedAt}`);
    console.log(`  - Current step: ${updated.currentStep}`);
    console.log(`  - Is completed: ${updated.isCompleted}`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

completeOnboarding();
