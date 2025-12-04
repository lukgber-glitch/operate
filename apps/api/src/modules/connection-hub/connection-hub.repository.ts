import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  Integration,
  IntegrationAccount,
  OnboardingProgress,
  Prisma,
  IntegrationStatus,
  SyncStatus,
} from '@prisma/client';

/**
 * Connection Hub Repository
 * Handles all database operations for Integration, IntegrationAccount, and OnboardingProgress entities
 */
@Injectable()
export class ConnectionHubRepository {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // INTEGRATION METHODS
  // ============================================================================

  /**
   * Find all integrations for an organisation
   */
  async findAllIntegrations(
    orgId: string,
    filters?: {
      type?: string;
      status?: IntegrationStatus;
    },
  ): Promise<Integration[]> {
    return this.prisma.integration.findMany({
      where: {
        orgId,
        ...(filters?.type && { type: filters.type as any }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        accounts: {
          where: { isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find integration by ID
   */
  async findIntegrationById(id: string): Promise<Integration | null> {
    return this.prisma.integration.findUnique({
      where: { id },
      include: {
        accounts: true,
      },
    });
  }

  /**
   * Find integration by provider and org
   */
  async findIntegrationByProvider(
    orgId: string,
    provider: string,
  ): Promise<Integration | null> {
    return this.prisma.integration.findFirst({
      where: {
        orgId,
        provider: provider as any,
      },
      include: {
        accounts: true,
      },
    });
  }

  /**
   * Create new integration
   */
  async createIntegration(
    data: Prisma.IntegrationCreateInput,
  ): Promise<Integration> {
    return this.prisma.integration.create({
      data,
      include: {
        accounts: true,
      },
    });
  }

  /**
   * Update integration by ID
   */
  async updateIntegration(
    id: string,
    data: Prisma.IntegrationUpdateInput,
  ): Promise<Integration> {
    return this.prisma.integration.update({
      where: { id },
      data,
      include: {
        accounts: true,
      },
    });
  }

  /**
   * Delete integration by ID (cascade deletes accounts)
   */
  async deleteIntegration(id: string): Promise<Integration> {
    return this.prisma.integration.delete({
      where: { id },
    });
  }

  /**
   * Update integration status
   */
  async updateIntegrationStatus(
    id: string,
    status: IntegrationStatus,
    errorMessage?: string,
  ): Promise<Integration> {
    const data: Prisma.IntegrationUpdateInput = {
      status,
      ...(status === IntegrationStatus.CONNECTED && {
        connectedAt: new Date(),
        errorMessage: null,
        lastError: null,
      }),
      ...(status === IntegrationStatus.DISCONNECTED && {
        disconnectedAt: new Date(),
      }),
      ...(status === IntegrationStatus.ERROR && {
        errorMessage,
        lastError: new Date(),
      }),
    };

    return this.prisma.integration.update({
      where: { id },
      data,
    });
  }

  /**
   * Update sync status
   */
  async updateSyncStatus(
    id: string,
    syncStatus: SyncStatus,
    syncError?: string,
  ): Promise<Integration> {
    const data: Prisma.IntegrationUpdateInput = {
      syncStatus,
      ...(syncStatus === SyncStatus.SYNCING && {
        lastSyncAt: new Date(),
      }),
      ...(syncStatus === SyncStatus.COMPLETED && {
        lastSyncSuccess: new Date(),
        syncError: null,
      }),
      ...(syncStatus === SyncStatus.FAILED && {
        syncError,
      }),
    };

    return this.prisma.integration.update({
      where: { id },
      data,
    });
  }

  // ============================================================================
  // INTEGRATION ACCOUNT METHODS
  // ============================================================================

  /**
   * Find all accounts for an integration
   */
  async findAllAccounts(integrationId: string): Promise<IntegrationAccount[]> {
    return this.prisma.integrationAccount.findMany({
      where: { integrationId },
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Find account by ID
   */
  async findAccountById(id: string): Promise<IntegrationAccount | null> {
    return this.prisma.integrationAccount.findUnique({
      where: { id },
      include: {
        integration: true,
      },
    });
  }

  /**
   * Find account by external ID
   */
  async findAccountByExternalId(
    integrationId: string,
    externalId: string,
  ): Promise<IntegrationAccount | null> {
    return this.prisma.integrationAccount.findUnique({
      where: {
        integrationId_externalId: {
          integrationId,
          externalId,
        },
      },
    });
  }

  /**
   * Create integration account
   */
  async createAccount(
    data: Prisma.IntegrationAccountCreateInput,
  ): Promise<IntegrationAccount> {
    return this.prisma.integrationAccount.create({
      data,
    });
  }

  /**
   * Create multiple accounts (bulk)
   */
  async createManyAccounts(
    integrationId: string,
    accounts: Omit<Prisma.IntegrationAccountCreateManyInput, 'integrationId'>[],
  ): Promise<number> {
    const result = await this.prisma.integrationAccount.createMany({
      data: accounts.map((account) => ({
        ...account,
        integrationId,
      })),
      skipDuplicates: true,
    });
    return result.count;
  }

  /**
   * Update account by ID
   */
  async updateAccount(
    id: string,
    data: Prisma.IntegrationAccountUpdateInput,
  ): Promise<IntegrationAccount> {
    return this.prisma.integrationAccount.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete account by ID
   */
  async deleteAccount(id: string): Promise<IntegrationAccount> {
    return this.prisma.integrationAccount.delete({
      where: { id },
    });
  }

  /**
   * Update account tokens
   */
  async updateAccountTokens(
    id: string,
    tokens: {
      accessToken: string;
      refreshToken?: string;
      expiresAt?: Date;
      scope?: string;
    },
  ): Promise<IntegrationAccount> {
    return this.prisma.integrationAccount.update({
      where: { id },
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        scope: tokens.scope,
      },
    });
  }

  // ============================================================================
  // ONBOARDING PROGRESS METHODS
  // ============================================================================

  /**
   * Find onboarding progress for organisation
   */
  async findOnboardingProgress(orgId: string): Promise<OnboardingProgress | null> {
    return this.prisma.onboardingProgress.findUnique({
      where: { orgId },
    });
  }

  /**
   * Create onboarding progress
   */
  async createOnboardingProgress(
    data: Prisma.OnboardingProgressCreateInput,
  ): Promise<OnboardingProgress> {
    return this.prisma.onboardingProgress.create({
      data,
    });
  }

  /**
   * Update onboarding progress
   */
  async updateOnboardingProgress(
    orgId: string,
    data: Prisma.OnboardingProgressUpdateInput,
  ): Promise<OnboardingProgress> {
    return this.prisma.onboardingProgress.update({
      where: { orgId },
      data,
    });
  }

  /**
   * Get or create onboarding progress
   */
  async getOrCreateOnboardingProgress(
    orgId: string,
    userId: string,
  ): Promise<OnboardingProgress> {
    const existing = await this.findOnboardingProgress(orgId);

    if (existing) {
      return existing;
    }

    return this.createOnboardingProgress({
      orgId,
      userId,
    });
  }

  /**
   * Mark onboarding as completed
   */
  async completeOnboarding(orgId: string): Promise<OnboardingProgress> {
    return this.prisma.onboardingProgress.update({
      where: { orgId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });
  }
}
