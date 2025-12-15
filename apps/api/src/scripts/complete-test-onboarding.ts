import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function completeOnboarding() {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: 'luk.gber@gmail.com' },
      include: { organization: true },
    });

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.email} (${user.id})`);
    console.log(`✓ Organization: ${user.organization?.name} (${user.organizationId})`);

    // Find or create onboarding progress
    let onboarding = await prisma.onboardingProgress.findUnique({
      where: { organizationId: user.organizationId },
    });

    if (!onboarding) {
      console.log('Creating onboarding progress...');
      onboarding = await prisma.onboardingProgress.create({
        data: {
          organizationId: user.organizationId,
          currentStep: 0,
          completedSteps: [],
          skippedSteps: [],
          progress: {},
          isComplete: false,
        },
      });
    }

    console.log(`Current onboarding status: isComplete=${onboarding.isComplete}, step=${onboarding.currentStep}`);

    // Mark onboarding as complete
    const updated = await prisma.onboardingProgress.update({
      where: { id: onboarding.id },
      data: {
        isComplete: true,
        completedAt: new Date(),
        currentStep: 8, // All steps complete
        completedSteps: [
          'welcome',
          'company',
          'banking',
          'email',
          'tax',
          'accounting',
          'preferences',
          'completion',
        ],
      },
    });

    console.log('✓ Onboarding marked as complete!');
    console.log(`  - Completed at: ${updated.completedAt}`);
    console.log(`  - Current step: ${updated.currentStep}`);
    console.log(`  - Is complete: ${updated.isComplete}`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

completeOnboarding();
