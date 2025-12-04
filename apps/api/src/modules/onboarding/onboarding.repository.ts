import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OnboardingProgress, OnboardingStepStatus, Prisma } from '@prisma/client';

/**
 * Repository for OnboardingProgress database operations
 */
@Injectable()
export class OnboardingRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find onboarding progress by organization ID
   */
  async findByOrgId(orgId: string): Promise<OnboardingProgress | null> {
    return this.prisma.onboardingProgress.findUnique({
      where: { orgId },
    });
  }

  /**
   * Find onboarding progress by user ID
   */
  async findByUserId(userId: string): Promise<OnboardingProgress | null> {
    return this.prisma.onboardingProgress.findFirst({
      where: { userId },
    });
  }

  /**
   * Create new onboarding progress
   */
  async create(
    data: Prisma.OnboardingProgressCreateInput,
  ): Promise<OnboardingProgress> {
    return this.prisma.onboardingProgress.create({
      data,
    });
  }

  /**
   * Update onboarding progress
   */
  async update(
    orgId: string,
    data: Prisma.OnboardingProgressUpdateInput,
  ): Promise<OnboardingProgress> {
    return this.prisma.onboardingProgress.update({
      where: { orgId },
      data,
    });
  }

  /**
   * Update company info step
   */
  async updateCompanyInfoStep(
    orgId: string,
    status: OnboardingStepStatus,
    data?: Record<string, any>,
  ): Promise<OnboardingProgress> {
    return this.prisma.onboardingProgress.update({
      where: { orgId },
      data: {
        companyInfoStatus: status,
        ...(data && { companyInfoData: data }),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Update banking step
   */
  async updateBankingStep(
    orgId: string,
    status: OnboardingStepStatus,
    data?: Record<string, any>,
    provider?: string,
  ): Promise<OnboardingProgress> {
    return this.prisma.onboardingProgress.update({
      where: { orgId },
      data: {
        bankingStatus: status,
        ...(data && { bankingData: data }),
        ...(provider && { bankingProvider: provider }),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Update email step
   */
  async updateEmailStep(
    orgId: string,
    status: OnboardingStepStatus,
    data?: Record<string, any>,
    provider?: string,
  ): Promise<OnboardingProgress> {
    return this.prisma.onboardingProgress.update({
      where: { orgId },
      data: {
        emailStatus: status,
        ...(data && { emailData: data }),
        ...(provider && { emailProvider: provider }),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Update tax step
   */
  async updateTaxStep(
    orgId: string,
    status: OnboardingStepStatus,
    data?: Record<string, any>,
  ): Promise<OnboardingProgress> {
    return this.prisma.onboardingProgress.update({
      where: { orgId },
      data: {
        taxStatus: status,
        ...(data && { taxData: data }),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Update accounting step
   */
  async updateAccountingStep(
    orgId: string,
    status: OnboardingStepStatus,
    data?: Record<string, any>,
    provider?: string,
  ): Promise<OnboardingProgress> {
    return this.prisma.onboardingProgress.update({
      where: { orgId },
      data: {
        accountingStatus: status,
        ...(data && { accountingData: data }),
        ...(provider && { accountingProvider: provider }),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Update preferences step
   */
  async updatePreferencesStep(
    orgId: string,
    status: OnboardingStepStatus,
    data?: Record<string, any>,
  ): Promise<OnboardingProgress> {
    return this.prisma.onboardingProgress.update({
      where: { orgId },
      data: {
        preferencesStatus: status,
        ...(data && { preferencesData: data }),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Add a step to skipped list
   */
  async addSkippedStep(orgId: string, step: string): Promise<OnboardingProgress> {
    const current = await this.findByOrgId(orgId);
    const skippedSteps = current?.skippedSteps || [];

    if (!skippedSteps.includes(step)) {
      skippedSteps.push(step);
    }

    return this.prisma.onboardingProgress.update({
      where: { orgId },
      data: {
        skippedSteps,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Mark onboarding as complete
   */
  async markComplete(orgId: string): Promise<OnboardingProgress> {
    return this.prisma.onboardingProgress.update({
      where: { orgId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Update current step
   */
  async updateCurrentStep(
    orgId: string,
    currentStep: number,
  ): Promise<OnboardingProgress> {
    return this.prisma.onboardingProgress.update({
      where: { orgId },
      data: {
        currentStep,
        updatedAt: new Date(),
      },
    });
  }
}
