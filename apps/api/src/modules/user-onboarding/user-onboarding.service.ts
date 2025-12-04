import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OnboardingProgressDto } from './dto';
import {
  ONBOARDING_STEPS,
  STEP_ID_TO_METADATA,
  getStepOrder,
  getNextStepId,
  isValidStepId,
  getRequiredStepIds,
  getTotalEstimatedTime,
  ONBOARDING_STEP_METADATA,
} from './user-onboarding.constants';

/**
 * User Onboarding Service
 * Handles business logic for user onboarding progress tracking
 */
@Injectable()
export class UserOnboardingService {
  private readonly logger = new Logger(UserOnboardingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user's onboarding progress
   */
  async getProgress(userId: string): Promise<OnboardingProgressDto> {
    const progress = await this.prisma.userOnboardingProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      throw new NotFoundException('Onboarding progress not found');
    }

    return this.mapToDto(progress);
  }

  /**
   * Start onboarding for a new user
   */
  async startOnboarding(userId: string): Promise<OnboardingProgressDto> {
    // Check if onboarding already exists
    const existing = await this.prisma.userOnboardingProgress.findUnique({
      where: { userId },
    });

    if (existing) {
      this.logger.warn(`Onboarding already started for user ${userId}`);
      return this.mapToDto(existing);
    }

    // Create new onboarding progress
    const progress = await this.prisma.userOnboardingProgress.create({
      data: {
        userId,
        currentStep: ONBOARDING_STEPS.WELCOME,
        completedSteps: [],
        skippedSteps: [],
        stepData: {},
        lastActivityAt: new Date(),
      },
    });

    this.logger.log(`Started onboarding for user ${userId}`);
    return this.mapToDto(progress);
  }

  /**
   * Complete a specific step
   */
  async completeStep(
    userId: string,
    stepId: string,
    stepData?: Record<string, any>,
  ): Promise<OnboardingProgressDto> {
    // Validate step ID
    if (!isValidStepId(stepId)) {
      throw new BadRequestException(`Invalid step ID: ${stepId}`);
    }

    const progress = await this.prisma.userOnboardingProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      throw new NotFoundException('Onboarding progress not found');
    }

    // Check if already completed
    if (progress.completedAt) {
      throw new BadRequestException('Onboarding already completed');
    }

    // Check if step is already completed
    if (progress.completedSteps.includes(stepId)) {
      this.logger.warn(`Step ${stepId} already completed for user ${userId}`);
      return this.mapToDto(progress);
    }

    // Remove from skipped steps if present
    const skippedSteps = progress.skippedSteps.filter((s) => s !== stepId);

    // Add to completed steps
    const completedSteps = [...progress.completedSteps, stepId];

    // Update step data if provided
    const currentStepData = (progress.stepData as Record<string, any>) || {};
    const updatedStepData = stepData
      ? { ...currentStepData, [stepId]: stepData }
      : currentStepData;

    // Determine next step
    const nextStep = getNextStepId(stepId) || progress.currentStep;

    // Update progress
    const updated = await this.prisma.userOnboardingProgress.update({
      where: { userId },
      data: {
        completedSteps,
        skippedSteps,
        stepData: updatedStepData,
        currentStep: nextStep,
        lastActivityAt: new Date(),
      },
    });

    this.logger.log(`Completed step ${stepId} for user ${userId}`);
    return this.mapToDto(updated);
  }

  /**
   * Skip a specific step
   */
  async skipStep(userId: string, stepId: string): Promise<OnboardingProgressDto> {
    // Validate step ID
    if (!isValidStepId(stepId)) {
      throw new BadRequestException(`Invalid step ID: ${stepId}`);
    }

    // Check if step is required
    const stepMetadata = STEP_ID_TO_METADATA[stepId];
    if (stepMetadata?.required) {
      throw new BadRequestException(
        `Cannot skip required step: ${stepMetadata.name}`,
      );
    }

    const progress = await this.prisma.userOnboardingProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      throw new NotFoundException('Onboarding progress not found');
    }

    // Check if already completed
    if (progress.completedAt) {
      throw new BadRequestException('Onboarding already completed');
    }

    // Check if already skipped
    if (progress.skippedSteps.includes(stepId)) {
      this.logger.warn(`Step ${stepId} already skipped for user ${userId}`);
      return this.mapToDto(progress);
    }

    // Remove from completed steps if present
    const completedSteps = progress.completedSteps.filter((s) => s !== stepId);

    // Add to skipped steps
    const skippedSteps = [...progress.skippedSteps, stepId];

    // Determine next step
    const nextStep = getNextStepId(stepId) || progress.currentStep;

    // Update progress
    const updated = await this.prisma.userOnboardingProgress.update({
      where: { userId },
      data: {
        completedSteps,
        skippedSteps,
        currentStep: nextStep,
        lastActivityAt: new Date(),
      },
    });

    this.logger.log(`Skipped step ${stepId} for user ${userId}`);
    return this.mapToDto(updated);
  }

  /**
   * Navigate to a specific step
   */
  async goToStep(userId: string, stepId: string): Promise<OnboardingProgressDto> {
    // Validate step ID
    if (!isValidStepId(stepId)) {
      throw new BadRequestException(`Invalid step ID: ${stepId}`);
    }

    const progress = await this.prisma.userOnboardingProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      throw new NotFoundException('Onboarding progress not found');
    }

    // Check if already completed
    if (progress.completedAt) {
      throw new BadRequestException('Onboarding already completed');
    }

    // Update current step
    const updated = await this.prisma.userOnboardingProgress.update({
      where: { userId },
      data: {
        currentStep: stepId,
        lastActivityAt: new Date(),
      },
    });

    this.logger.log(`Navigated to step ${stepId} for user ${userId}`);
    return this.mapToDto(updated);
  }

  /**
   * Complete entire onboarding
   */
  async completeOnboarding(userId: string): Promise<OnboardingProgressDto> {
    const progress = await this.prisma.userOnboardingProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      throw new NotFoundException('Onboarding progress not found');
    }

    // Check if already completed
    if (progress.completedAt) {
      this.logger.warn(`Onboarding already completed for user ${userId}`);
      return this.mapToDto(progress);
    }

    // Validate that all required steps are completed
    const requiredSteps = getRequiredStepIds();
    const missingRequiredSteps = requiredSteps.filter(
      (step) => !progress.completedSteps.includes(step),
    );

    if (missingRequiredSteps.length > 0) {
      throw new BadRequestException(
        `Cannot complete onboarding. Missing required steps: ${missingRequiredSteps.join(', ')}`,
      );
    }

    // Mark as complete
    const updated = await this.prisma.userOnboardingProgress.update({
      where: { userId },
      data: {
        completedAt: new Date(),
        currentStep: ONBOARDING_STEPS.COMPLETE,
        lastActivityAt: new Date(),
      },
    });

    this.logger.log(`Completed onboarding for user ${userId}`);
    return this.mapToDto(updated);
  }

  /**
   * Reset onboarding (admin only)
   */
  async resetOnboarding(userId: string): Promise<OnboardingProgressDto> {
    const progress = await this.prisma.userOnboardingProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      throw new NotFoundException('Onboarding progress not found');
    }

    // Reset progress
    const updated = await this.prisma.userOnboardingProgress.update({
      where: { userId },
      data: {
        currentStep: ONBOARDING_STEPS.WELCOME,
        completedSteps: [],
        skippedSteps: [],
        stepData: {},
        completedAt: null,
        lastActivityAt: new Date(),
      },
    });

    this.logger.log(`Reset onboarding for user ${userId}`);
    return this.mapToDto(updated);
  }

  /**
   * Check if onboarding is complete
   */
  async isOnboardingComplete(userId: string): Promise<boolean> {
    const progress = await this.prisma.userOnboardingProgress.findUnique({
      where: { userId },
      select: { completedAt: true },
    });

    return !!progress?.completedAt;
  }

  /**
   * Map database model to DTO
   */
  private mapToDto(progress: any): OnboardingProgressDto {
    const totalSteps = ONBOARDING_STEP_METADATA.length;
    const completedCount = progress.completedSteps.length;
    const completionPercentage = Math.round((completedCount / totalSteps) * 100);

    return {
      id: progress.id,
      userId: progress.userId,
      currentStep: progress.currentStep,
      completedSteps: progress.completedSteps,
      skippedSteps: progress.skippedSteps,
      stepData: progress.stepData as Record<string, any>,
      startedAt: progress.startedAt,
      completedAt: progress.completedAt,
      lastActivityAt: progress.lastActivityAt,
      createdAt: progress.createdAt,
      updatedAt: progress.updatedAt,
      isComplete: !!progress.completedAt,
      completionPercentage,
      totalEstimatedTime: getTotalEstimatedTime(),
    };
  }
}
