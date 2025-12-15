require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function completeOnboarding() {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: 'luk.gber@gmail.com' }
    });

    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    console.log('Found user:', user.email);

    // Check if onboarding progress exists
    let progress = await prisma.userOnboardingProgress.findUnique({
      where: { userId: user.id }
    });

    if (!progress) {
      console.log('Creating onboarding progress record...');
      progress = await prisma.userOnboardingProgress.create({
        data: {
          userId: user.id,
          currentStep: 'complete',
          completedSteps: ['welcome', 'company', 'preferences', 'tax', 'accounting', 'banking'],
          completedAt: new Date(),
          lastActivityAt: new Date()
        }
      });
    } else if (!progress.completedAt) {
      console.log('Marking onboarding as complete...');
      progress = await prisma.userOnboardingProgress.update({
        where: { userId: user.id },
        data: {
          currentStep: 'complete',
          completedSteps: ['welcome', 'company', 'preferences', 'tax', 'accounting', 'banking'],
          completedAt: new Date(),
          lastActivityAt: new Date()
        }
      });
    } else {
      console.log('Onboarding already completed at:', progress.completedAt);
    }

    console.log('Onboarding status:', progress);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

completeOnboarding();
