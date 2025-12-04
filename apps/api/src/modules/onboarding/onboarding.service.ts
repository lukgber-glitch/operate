import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { OnboardingStepStatus } from '@prisma/client';
import { OnboardingRepository } from './onboarding.repository';
import { OnboardingProgressDto, CompleteStepDto, UpdateProgressDto } from './dto';

/**
 * Onboarding service - handles business logic for user/organization onboarding
 */
@Injectable()
export class OnboardingService {
  // Map of step names to their status fields and data fields
  private readonly stepMapping = {
    company_info: {
      statusField: 'companyInfoStatus',
      dataField: 'companyInfoData',
      order: 1,
    },
    banking: {
      statusField: 'bankingStatus',
      dataField: 'bankingData',
      providerField: 'bankingProvider',
      order: 2,
    },
    email: {
      statusField: 'emailStatus',
      dataField: 'emailData',
      providerField: 'emailProvider',
      order: 3,
    },
    tax: {
      statusField: 'taxStatus',
      dataField: 'taxData',
      order: 4,
    },
    accounting: {
      statusField: 'accountingStatus',
      dataField: 'accountingData',
      providerField: 'accountingProvider',
      order: 5,
    },
    preferences: {
      statusField: 'preferencesStatus',
      dataField: 'preferencesData',
      order: 6,
    },
  };

  constructor(private readonly repository: OnboardingRepository) {}

  /**
   * Get onboarding progress for an organization
   */
  async getProgress(orgId: string, userId: string): Promise<OnboardingProgressDto> {
    let progress = await this.repository.findByOrgId(orgId);

    // Create progress if it doesn't exist
    if (!progress) {
      progress = await this.repository.create({
        orgId,
        userId,
        currentStep: 1,
        totalSteps: 6,
      });
    }

    return this.mapToDto(progress);
  }

  /**
   * Complete a specific onboarding step
   */
  async completeStep(
    orgId: string,
    stepName: string,
    data?: Record<string, any>,
  ): Promise<OnboardingProgressDto> {
    // Validate step name
    if (!this.stepMapping[stepName as keyof typeof this.stepMapping]) {
      throw new BadRequestException(`Invalid step name: ${stepName}`);
    }

    const progress = await this.repository.findByOrgId(orgId);
    if (!progress) {
      throw new NotFoundException('Onboarding progress not found');
    }

    if (progress.isCompleted) {
      throw new ConflictException('Onboarding already completed');
    }

    // Update the specific step
    let updatedProgress;
    switch (stepName) {
      case 'company_info':
        updatedProgress = await this.repository.updateCompanyInfoStep(
          orgId,
          OnboardingStepStatus.COMPLETED,
          data,
        );
        break;
      case 'banking':
        updatedProgress = await this.repository.updateBankingStep(
          orgId,
          OnboardingStepStatus.COMPLETED,
          data,
          data?.provider,
        );
        break;
      case 'email':
        updatedProgress = await this.repository.updateEmailStep(
          orgId,
          OnboardingStepStatus.COMPLETED,
          data,
          data?.provider,
        );
        break;
      case 'tax':
        updatedProgress = await this.repository.updateTaxStep(
          orgId,
          OnboardingStepStatus.COMPLETED,
          data,
        );
        break;
      case 'accounting':
        updatedProgress = await this.repository.updateAccountingStep(
          orgId,
          OnboardingStepStatus.COMPLETED,
          data,
          data?.provider,
        );
        break;
      case 'preferences':
        updatedProgress = await this.repository.updatePreferencesStep(
          orgId,
          OnboardingStepStatus.COMPLETED,
          data,
        );
        break;
    }

    // Advance to next step if current
    const stepOrder = this.stepMapping[stepName as keyof typeof this.stepMapping].order;
    if (updatedProgress && stepOrder === updatedProgress.currentStep) {
      const nextStep = Math.min(stepOrder + 1, updatedProgress.totalSteps);
      updatedProgress = await this.repository.updateCurrentStep(orgId, nextStep);
    }

    if (!updatedProgress) {
      throw new Error('Failed to update onboarding progress');
    }

    return this.mapToDto(updatedProgress);
  }

  /**
   * Skip a specific onboarding step
   */
  async skipStep(
    orgId: string,
    stepName: string,
  ): Promise<OnboardingProgressDto> {
    // Validate step name
    if (!this.stepMapping[stepName as keyof typeof this.stepMapping]) {
      throw new BadRequestException(`Invalid step name: ${stepName}`);
    }

    const progress = await this.repository.findByOrgId(orgId);
    if (!progress) {
      throw new NotFoundException('Onboarding progress not found');
    }

    if (progress.isCompleted) {
      throw new ConflictException('Onboarding already completed');
    }

    // Add to skipped steps
    let updatedProgress = await this.repository.addSkippedStep(orgId, stepName);

    // Update step status to SKIPPED
    switch (stepName) {
      case 'company_info':
        updatedProgress = await this.repository.updateCompanyInfoStep(
          orgId,
          OnboardingStepStatus.SKIPPED,
        );
        break;
      case 'banking':
        updatedProgress = await this.repository.updateBankingStep(
          orgId,
          OnboardingStepStatus.SKIPPED,
        );
        break;
      case 'email':
        updatedProgress = await this.repository.updateEmailStep(
          orgId,
          OnboardingStepStatus.SKIPPED,
        );
        break;
      case 'tax':
        updatedProgress = await this.repository.updateTaxStep(
          orgId,
          OnboardingStepStatus.SKIPPED,
        );
        break;
      case 'accounting':
        updatedProgress = await this.repository.updateAccountingStep(
          orgId,
          OnboardingStepStatus.SKIPPED,
        );
        break;
      case 'preferences':
        updatedProgress = await this.repository.updatePreferencesStep(
          orgId,
          OnboardingStepStatus.SKIPPED,
        );
        break;
    }

    // Advance to next step
    const stepOrder = this.stepMapping[stepName as keyof typeof this.stepMapping].order;
    if (updatedProgress && stepOrder === updatedProgress.currentStep) {
      const nextStep = Math.min(stepOrder + 1, updatedProgress.totalSteps);
      updatedProgress = await this.repository.updateCurrentStep(orgId, nextStep);
    }

    if (!updatedProgress) {
      throw new Error('Failed to update onboarding progress');
    }

    return this.mapToDto(updatedProgress);
  }

  /**
   * Mark onboarding as complete
   */
  async completeOnboarding(orgId: string): Promise<OnboardingProgressDto> {
    const progress = await this.repository.findByOrgId(orgId);
    if (!progress) {
      throw new NotFoundException('Onboarding progress not found');
    }

    if (progress.isCompleted) {
      throw new ConflictException('Onboarding already completed');
    }

    const updatedProgress = await this.repository.markComplete(orgId);
    return this.mapToDto(updatedProgress);
  }

  /**
   * Get completion status
   */
  async getStatus(orgId: string): Promise<{
    isCompleted: boolean;
    completionPercentage: number;
    completedSteps: number;
    totalSteps: number;
    currentStep: number;
  }> {
    const progress = await this.repository.findByOrgId(orgId);
    if (!progress) {
      return {
        isCompleted: false,
        completionPercentage: 0,
        completedSteps: 0,
        totalSteps: 6,
        currentStep: 1,
      };
    }

    const completedSteps = this.countCompletedSteps(progress);
    const completionPercentage = Math.round(
      (completedSteps / progress.totalSteps) * 100,
    );

    return {
      isCompleted: progress.isCompleted,
      completionPercentage,
      completedSteps,
      totalSteps: progress.totalSteps,
      currentStep: progress.currentStep,
    };
  }

  /**
   * Map database model to DTO
   */
  private mapToDto(progress: any): OnboardingProgressDto {
    const completedSteps = this.countCompletedSteps(progress);
    const completionPercentage = Math.round(
      (completedSteps / progress.totalSteps) * 100,
    );

    return {
      id: progress.id,
      orgId: progress.orgId,
      userId: progress.userId,
      currentStep: progress.currentStep,
      totalSteps: progress.totalSteps,
      completionPercentage,
      isCompleted: progress.isCompleted,
      completedStepsCount: completedSteps,
      skippedSteps: progress.skippedSteps,
      steps: [
        {
          name: 'company_info',
          status: progress.companyInfoStatus,
          data: progress.companyInfoData as Record<string, any>,
        },
        {
          name: 'banking',
          status: progress.bankingStatus,
          data: progress.bankingData as Record<string, any>,
        },
        {
          name: 'email',
          status: progress.emailStatus,
          data: progress.emailData as Record<string, any>,
        },
        {
          name: 'tax',
          status: progress.taxStatus,
          data: progress.taxData as Record<string, any>,
        },
        {
          name: 'accounting',
          status: progress.accountingStatus,
          data: progress.accountingData as Record<string, any>,
        },
        {
          name: 'preferences',
          status: progress.preferencesStatus,
          data: progress.preferencesData as Record<string, any>,
        },
      ],
      startedAt: progress.startedAt,
      updatedAt: progress.updatedAt,
      completedAt: progress.completedAt,
    };
  }

  /**
   * Count completed steps
   */
  private countCompletedSteps(progress: any): number {
    let count = 0;
    if (progress.companyInfoStatus === OnboardingStepStatus.COMPLETED) count++;
    if (progress.bankingStatus === OnboardingStepStatus.COMPLETED) count++;
    if (progress.emailStatus === OnboardingStepStatus.COMPLETED) count++;
    if (progress.taxStatus === OnboardingStepStatus.COMPLETED) count++;
    if (progress.accountingStatus === OnboardingStepStatus.COMPLETED) count++;
    if (progress.preferencesStatus === OnboardingStepStatus.COMPLETED) count++;
    return count;
  }
}
