import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { OnboardingStepStatus } from '@prisma/client';
import { OnboardingRepository } from './onboarding.repository';
import { OnboardingProgressDto, CompleteStepDto, UpdateProgressDto } from './dto';
import { PrismaService } from '../database/prisma.service';
import { EmailFilterService } from '../ai/email-intelligence/email-filter.service';

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

  constructor(
    private readonly repository: OnboardingRepository,
    private readonly prisma: PrismaService,
    private readonly emailFilterService: EmailFilterService,
  ) {}

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
        // Update organisation business context and create email filter config
        if (data) {
          await this.updateOrganisationBusinessContext(orgId, data);
        }
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
  async completeOnboarding(orgId: string, userId?: string): Promise<OnboardingProgressDto> {
    let progress = await this.repository.findByOrgId(orgId);

    // Auto-create progress record if it doesn't exist
    if (!progress) {
      progress = await this.repository.create({
        orgId,
        userId: userId || orgId,
        currentStep: 6,
        totalSteps: 6,
      });
    }

    // If already completed, return current progress (don't error)
    if (progress.isCompleted) {
      return this.mapToDto(progress);
    }

    const updatedProgress = await this.repository.markComplete(orgId);

    // Sync all onboarding data to Organisation record
    await this.syncOnboardingDataToOrganisation(orgId);

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

  /**
   * Update organisation with business context from onboarding
   */
  private async updateOrganisationBusinessContext(
    orgId: string,
    data: Record<string, any>,
  ): Promise<void> {
    // Update organisation with business context
    await this.prisma.organisation.update({
      where: { id: orgId },
      data: {
        industry: data.industry || null,
        businessModel: data.businessModel || 'B2B',
        targetCustomerType: data.targetCustomerType || 'BUSINESS',
      },
    });

    // Create default email filter config based on business model
    try {
      await this.emailFilterService.createDefaultConfig(
        orgId,
        data.businessModel || 'B2B',
      );
    } catch (error) {
      // Config might already exist, that's fine
      console.log(`Email filter config may already exist for org ${orgId}`);
    }
  }

  /**
   * Sync all onboarding data to Organisation record
   * Called when onboarding is completed to ensure Organisation has all collected data
   */
  private async syncOnboardingDataToOrganisation(orgId: string): Promise<void> {
    try {
      const progress = await this.repository.findByOrgId(orgId);
      if (!progress) {
        console.log(`No onboarding progress found for org ${orgId}, skipping sync`);
        return;
      }

      const companyInfo = progress.companyInfoData as Record<string, any> | null;
      const preferences = progress.preferencesData as Record<string, any> | null;
      const taxData = progress.taxData as Record<string, any> | null;

      // If no data in any step, skip sync
      if (!companyInfo && !preferences && !taxData) {
        console.log(`No onboarding data to sync for org ${orgId}`);
        return;
      }

      // Build update object with only defined values
      const updateData: Record<string, any> = {};

      // Sync company info fields
      if (companyInfo) {
        // Basic fields
        if (companyInfo.name) updateData.name = companyInfo.name;
        if (companyInfo.country) updateData.country = companyInfo.country;
        if (companyInfo.currency) updateData.currency = companyInfo.currency;

        // Business context (already synced in updateOrganisationBusinessContext, but include for completeness)
        if (companyInfo.industry) updateData.industry = companyInfo.industry;
        if (companyInfo.businessModel) updateData.businessModel = companyInfo.businessModel;
        if (companyInfo.targetCustomerType) updateData.targetCustomerType = companyInfo.targetCustomerType;

        // Company type and VAT scheme (enums - stored as strings in DB)
        if (companyInfo.companyType) updateData.companyType = companyInfo.companyType;
        if (companyInfo.vatScheme) updateData.vatScheme = companyInfo.vatScheme;

        // Registration and tax numbers
        if (companyInfo.companyRegistrationNumber) {
          updateData.companyRegistrationNumber = companyInfo.companyRegistrationNumber;
        }
        if (companyInfo.vatNumber) updateData.vatNumber = companyInfo.vatNumber;
        if (companyInfo.utrNumber) updateData.utrNumber = companyInfo.utrNumber;
        if (companyInfo.payeReference) updateData.payeReference = companyInfo.payeReference;
        if (companyInfo.taxRegistrationNumber) {
          updateData.taxRegistrationNumber = companyInfo.taxRegistrationNumber;
        }
        if (companyInfo.commercialRegistration) {
          updateData.commercialRegistration = companyInfo.commercialRegistration;
        }
        if (companyInfo.tradeLicenseNumber) {
          updateData.tradeLicenseNumber = companyInfo.tradeLicenseNumber;
        }
      }

      // Sync preferences
      if (preferences) {
        if (preferences.timezone) updateData.timezone = preferences.timezone;

        // Use preferences currency as fallback if not set from company info
        if (preferences.currency && !updateData.currency) {
          updateData.currency = preferences.currency;
        }

        // Store additional preferences in settings JSON field
        if (preferences.language || preferences.dateFormat || preferences.numberFormat) {
          const existingSettings = updateData.settings || {};
          updateData.settings = {
            ...existingSettings,
            ...(preferences.language && { language: preferences.language }),
            ...(preferences.dateFormat && { dateFormat: preferences.dateFormat }),
            ...(preferences.numberFormat && { numberFormat: preferences.numberFormat }),
          };
        }
      }

      // Sync tax data (fallback for tax IDs if not in company info)
      if (taxData) {
        if (taxData.vatNumber && !updateData.vatNumber) {
          updateData.vatNumber = taxData.vatNumber;
        }
        if (taxData.taxRegistrationNumber && !updateData.taxRegistrationNumber) {
          updateData.taxRegistrationNumber = taxData.taxRegistrationNumber;
        }
        if (taxData.utrNumber && !updateData.utrNumber) {
          updateData.utrNumber = taxData.utrNumber;
        }
      }

      // Only update if we have data to sync
      if (Object.keys(updateData).length > 0) {
        await this.prisma.organisation.update({
          where: { id: orgId },
          data: updateData,
        });
        console.log(`Successfully synced onboarding data to organisation ${orgId}`);
      } else {
        console.log(`No fields to sync for organisation ${orgId}`);
      }
    } catch (error) {
      // Log but don't throw - onboarding should complete even if sync fails
      console.error(`Failed to sync onboarding data to organisation ${orgId}:`, error);
    }
  }
}
