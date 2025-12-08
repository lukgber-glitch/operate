import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConnectionHubRepository } from './connection-hub.repository';
import {
  CreateIntegrationDto,
  UpdateIntegrationDto,
  UpdateOnboardingStepDto,
  SkipOnboardingStepDto,
  OnboardingStepStatus,
} from './dto';
import {
  IntegrationStatus,
  SyncStatus,
  OnboardingStepStatus as PrismaOnboardingStepStatus,
  Prisma,
} from '@prisma/client';

/**
 * Connection Hub Service
 * Business logic for managing integrations, OAuth flows, and onboarding
 */
@Injectable()
export class ConnectionHubService {
  private readonly logger = new Logger(ConnectionHubService.name);

  constructor(
    private repository: ConnectionHubRepository,
    private configService: ConfigService,
  ) {}

  // ============================================================================
  // INTEGRATION METHODS
  // ============================================================================

  /**
   * Get all integrations for an organisation
   */
  async getIntegrations(
    orgId: string,
    filters?: { type?: string; status?: IntegrationStatus },
  ) {
    return this.repository.findAllIntegrations(orgId, filters);
  }

  /**
   * Get integration by ID
   */
  async getIntegrationById(id: string) {
    const integration = await this.repository.findIntegrationById(id);

    if (!integration) {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }

    return integration;
  }

  /**
   * Create a new integration
   */
  async createIntegration(orgId: string, dto: CreateIntegrationDto) {
    // Check if integration already exists for this provider
    const existing = await this.repository.findIntegrationByProvider(
      orgId,
      dto.provider,
    );

    if (existing && dto.name === existing.name) {
      throw new ConflictException(
        `Integration with provider ${dto.provider} and name "${dto.name}" already exists`,
      );
    }

    const integration = await this.repository.createIntegration({
      orgId,
      type: dto.type as Prisma.InputJsonValue,
      provider: dto.provider as Prisma.InputJsonValue,
      name: dto.name,
      config: dto.config,
      metadata: dto.metadata,
      status: IntegrationStatus.PENDING,
    });

    this.logger.log(
      `Created integration ${integration.id} (${dto.provider}) for org ${orgId}`,
    );

    return integration;
  }

  /**
   * Update an integration
   */
  async updateIntegration(id: string, dto: UpdateIntegrationDto) {
    const existing = await this.repository.findIntegrationById(id);

    if (!existing) {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }

    const integration = await this.repository.updateIntegration(id, {
      ...(dto.name && { name: dto.name }),
      ...(dto.config && { config: dto.config }),
      ...(dto.metadata && { metadata: dto.metadata }),
    });

    this.logger.log(`Updated integration ${id}`);

    return integration;
  }

  /**
   * Delete an integration
   */
  async deleteIntegration(id: string) {
    const existing = await this.repository.findIntegrationById(id);

    if (!existing) {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }

    await this.repository.deleteIntegration(id);

    this.logger.log(`Deleted integration ${id}`);
  }

  /**
   * Disconnect an integration
   */
  async disconnectIntegration(id: string) {
    const integration = await this.getIntegrationById(id);

    if (integration.status === IntegrationStatus.DISCONNECTED) {
      throw new BadRequestException('Integration is already disconnected');
    }

    // Clear tokens from all accounts
    // Type assertion: repository includes accounts via Prisma include
    const integrationWithAccounts = integration as typeof integration & {
      accounts?: Array<{ id: string }>;
    };
    for (const account of integrationWithAccounts.accounts || []) {
      await this.repository.updateAccount(account.id, {
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        isActive: false,
      });
    }

    const updated = await this.repository.updateIntegrationStatus(
      id,
      IntegrationStatus.DISCONNECTED,
    );

    this.logger.log(`Disconnected integration ${id}`);

    return updated;
  }

  /**
   * Reconnect an integration (initiate OAuth again)
   */
  async reconnectIntegration(id: string) {
    const integration = await this.getIntegrationById(id);

    if (
      integration.status !== IntegrationStatus.DISCONNECTED &&
      integration.status !== IntegrationStatus.ERROR &&
      integration.status !== IntegrationStatus.EXPIRED
    ) {
      throw new BadRequestException(
        'Integration must be disconnected, expired, or in error state to reconnect',
      );
    }

    const updated = await this.repository.updateIntegrationStatus(
      id,
      IntegrationStatus.PENDING,
    );

    this.logger.log(`Reset integration ${id} for reconnection`);

    return updated;
  }

  /**
   * Get available integration providers
   */
  getAvailableProviders() {
    return {
      banking: [
        {
          provider: 'GOCARDLESS',
          name: 'GoCardless Bank Account Data',
          description: 'Connect your EU bank accounts via open banking',
          countries: ['DE', 'AT', 'CH', 'FR', 'IT', 'ES', 'NL', 'BE'],
          requiresKey: true,
        },
        {
          provider: 'TINK',
          name: 'Tink',
          description: 'Premium banking integration',
          countries: ['DE', 'AT', 'CH'],
          requiresKey: true,
        },
      ],
      email: [
        {
          provider: 'GMAIL',
          name: 'Gmail',
          description: 'Connect your Google Workspace or Gmail account',
          requiresKey: true,
        },
        {
          provider: 'OUTLOOK',
          name: 'Microsoft Outlook',
          description: 'Connect your Microsoft 365 or Outlook account',
          requiresKey: true,
        },
      ],
      accounting: [
        {
          provider: 'LEXOFFICE',
          name: 'lexoffice',
          description: 'German cloud accounting software',
          countries: ['DE'],
          requiresKey: true,
        },
        {
          provider: 'SEVDESK',
          name: 'sevDesk',
          description: 'German cloud accounting & invoicing',
          countries: ['DE', 'AT', 'CH'],
          requiresKey: true,
        },
      ],
      tax: [
        {
          provider: 'ELSTER',
          name: 'ELSTER',
          description: 'German tax authority filing',
          countries: ['DE'],
          requiresKey: true,
          requiresCertificate: true,
        },
        {
          provider: 'FINANZONLINE',
          name: 'FinanzOnline',
          description: 'Austrian tax authority filing',
          countries: ['AT'],
          requiresKey: true,
        },
      ],
      storage: [
        {
          provider: 'GOOGLE_DRIVE',
          name: 'Google Drive',
          description: 'Store documents in Google Drive',
          requiresKey: true,
        },
        {
          provider: 'DROPBOX',
          name: 'Dropbox',
          description: 'Store documents in Dropbox',
          requiresKey: true,
        },
      ],
    };
  }

  // ============================================================================
  // SYNC METHODS
  // ============================================================================

  /**
   * Trigger sync for an integration
   */
  async triggerSync(id: string) {
    const integration = await this.getIntegrationById(id);

    if (integration.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException(
        'Integration must be connected to sync data',
      );
    }

    if (integration.syncStatus === SyncStatus.SYNCING) {
      throw new BadRequestException('Sync is already in progress');
    }

    await this.repository.updateSyncStatus(id, SyncStatus.SYNCING);

    this.logger.log(`Started sync for integration ${id}`);

    // TODO: Emit event to trigger actual sync in background
    // this.eventEmitter.emit('integration.sync', { integrationId: id });

    return { message: 'Sync started', integrationId: id };
  }

  // ============================================================================
  // ONBOARDING METHODS
  // ============================================================================

  /**
   * Get onboarding progress
   */
  async getOnboardingProgress(orgId: string, userId: string) {
    return this.repository.getOrCreateOnboardingProgress(orgId, userId);
  }

  /**
   * Update onboarding step
   */
  async updateOnboardingStep(
    orgId: string,
    userId: string,
    dto: UpdateOnboardingStepDto,
  ) {
    const progress = await this.repository.getOrCreateOnboardingProgress(
      orgId,
      userId,
    );

    const statusKey = `${dto.step}Status` as keyof typeof progress;
    const providerKey = `${dto.step}Provider` as keyof typeof progress;
    const dataKey = `${dto.step}Data` as keyof typeof progress;

    const updateData: Record<string, any> = {
      [statusKey]: dto.status as PrismaOnboardingStepStatus,
    };

    if (dto.provider && providerKey in progress) {
      updateData[providerKey] = dto.provider;
    }

    if (dto.data && dataKey in progress) {
      updateData[dataKey] = dto.data;
    }

    // If step is completed, increment current step
    if (dto.status === OnboardingStepStatus.COMPLETED) {
      const stepOrder = [
        'companyInfo',
        'banking',
        'email',
        'tax',
        'accounting',
        'preferences',
      ];
      const currentIndex = stepOrder.indexOf(dto.step);
      if (currentIndex >= 0 && progress.currentStep === currentIndex + 1) {
        updateData.currentStep = currentIndex + 2;
      }
    }

    const updated = await this.repository.updateOnboardingProgress(
      orgId,
      updateData,
    );

    this.logger.log(
      `Updated onboarding step ${dto.step} to ${dto.status} for org ${orgId}`,
    );

    return updated;
  }

  /**
   * Skip onboarding step
   */
  async skipOnboardingStep(
    orgId: string,
    userId: string,
    dto: SkipOnboardingStepDto,
  ) {
    const progress = await this.repository.getOrCreateOnboardingProgress(
      orgId,
      userId,
    );

    const statusKey = `${dto.step}Status` as keyof typeof progress;

    const skippedSteps = [...(progress.skippedSteps || []), dto.step];
    const stepOrder = [
      'companyInfo',
      'banking',
      'email',
      'tax',
      'accounting',
      'preferences',
    ];
    const currentIndex = stepOrder.indexOf(dto.step);

    const updateData: Record<string, any> = {
      [statusKey]: PrismaOnboardingStepStatus.SKIPPED,
      skippedSteps: [...new Set(skippedSteps)], // Remove duplicates
    };

    // Move to next step
    if (currentIndex >= 0 && progress.currentStep === currentIndex + 1) {
      updateData.currentStep = currentIndex + 2;
    }

    const updated = await this.repository.updateOnboardingProgress(
      orgId,
      updateData,
    );

    this.logger.log(`Skipped onboarding step ${dto.step} for org ${orgId}`);

    return updated;
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding(orgId: string) {
    const progress = await this.repository.findOnboardingProgress(orgId);

    if (!progress) {
      throw new NotFoundException('Onboarding progress not found');
    }

    if (progress.isCompleted) {
      throw new BadRequestException('Onboarding is already completed');
    }

    // Check if required steps are completed
    const requiredSteps = ['companyInfo'];
    for (const step of requiredSteps) {
      const statusKey = `${step}Status` as keyof typeof progress;
      const status = progress[statusKey];
      if (
        status !== PrismaOnboardingStepStatus.COMPLETED &&
        status !== PrismaOnboardingStepStatus.SKIPPED
      ) {
        throw new BadRequestException(
          `Step "${step}" must be completed or skipped before completing onboarding`,
        );
      }
    }

    const updated = await this.repository.completeOnboarding(orgId);

    this.logger.log(`Completed onboarding for org ${orgId}`);

    return updated;
  }

  /**
   * Reset onboarding (for testing or restart)
   */
  async resetOnboarding(orgId: string, userId: string) {
    const existing = await this.repository.findOnboardingProgress(orgId);

    if (existing) {
      await this.repository.updateOnboardingProgress(orgId, {
        companyInfoStatus: PrismaOnboardingStepStatus.NOT_STARTED,
        companyInfoData: Prisma.DbNull,
        bankingStatus: PrismaOnboardingStepStatus.NOT_STARTED,
        bankingProvider: null,
        bankingData: Prisma.DbNull,
        emailStatus: PrismaOnboardingStepStatus.NOT_STARTED,
        emailProvider: null,
        emailData: Prisma.DbNull,
        taxStatus: PrismaOnboardingStepStatus.NOT_STARTED,
        taxData: Prisma.DbNull,
        accountingStatus: PrismaOnboardingStepStatus.NOT_STARTED,
        accountingProvider: null,
        accountingData: Prisma.DbNull,
        preferencesStatus: PrismaOnboardingStepStatus.NOT_STARTED,
        preferencesData: Prisma.DbNull,
        currentStep: 1,
        isCompleted: false,
        completedAt: null,
        skippedSteps: [],
      });
    }

    return this.repository.getOrCreateOnboardingProgress(orgId, userId);
  }

  // ============================================================================
  // OAUTH FLOW METHODS
  // ============================================================================

  /**
   * Complete OAuth flow by saving integration and account
   * This is called by the OAuth callback controller after token exchange
   */
  async completeOAuthFlow(data: {
    orgId: string;
    userId: string;
    provider: string;
    accountIdentifier: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }) {
    // Find or create the integration
    let integration = await this.repository.findIntegrationByProvider(
      data.orgId,
      data.provider,
    );

    if (!integration) {
      integration = await this.repository.createIntegration({
        orgId: data.orgId,
        type: this.getTypeForProvider(data.provider as Prisma.InputJsonValue),
        provider: data.provider as Prisma.InputJsonValue,
        name: `${data.provider} Connection`,
        status: IntegrationStatus.CONNECTED,
        connectedAt: new Date(),
      });
    } else {
      // Update existing integration to connected
      integration = await this.repository.updateIntegrationStatus(
        integration.id,
        IntegrationStatus.CONNECTED,
      );
    }

    // Find or create the account by externalId
    const existingAccount = await this.repository.findAccountByExternalId(
      integration.id,
      data.accountIdentifier,
    );

    if (existingAccount) {
      // Update existing account with new tokens
      return this.repository.updateAccount(existingAccount.id, {
        accessToken: this.encryptToken(data.accessToken),
        refreshToken: data.refreshToken
          ? this.encryptToken(data.refreshToken)
          : undefined,
        expiresAt: data.expiresAt,
        isActive: true,
      });
    }

    // Create new account
    return this.repository.createAccount({
      integration: {
        connect: { id: integration.id },
      },
      externalId: data.accountIdentifier,
      accountType: this.getAccountTypeForProvider(data.provider),
      name: data.accountIdentifier,
      displayName: data.accountIdentifier,
      accessToken: this.encryptToken(data.accessToken),
      refreshToken: data.refreshToken
        ? this.encryptToken(data.refreshToken)
        : undefined,
      expiresAt: data.expiresAt,
      isActive: true,
    });
  }

  /**
   * Get integration type for provider
   */
  private getTypeForProvider(provider: string): any {
    const typeMap: Record<string, string> = {
      GOCARDLESS: 'BANKING',
      TINK: 'BANKING',
      PLAID: 'BANKING',
      FINAPI: 'BANKING',
      GMAIL: 'EMAIL',
      OUTLOOK: 'EMAIL',
      IMAP: 'EMAIL',
      LEXOFFICE: 'ACCOUNTING',
      SEVDESK: 'ACCOUNTING',
      DATEV: 'ACCOUNTING',
      ELSTER: 'TAX',
      FINANZONLINE: 'TAX',
      GOOGLE_DRIVE: 'STORAGE',
      DROPBOX: 'STORAGE',
      ONEDRIVE: 'STORAGE',
    };
    return typeMap[provider] || 'OTHER';
  }

  /**
   * Get account type for provider
   */
  private getAccountTypeForProvider(provider: string): string {
    const accountTypeMap: Record<string, string> = {
      GOCARDLESS: 'bank_account',
      TINK: 'bank_account',
      PLAID: 'bank_account',
      FINAPI: 'bank_account',
      GMAIL: 'email_inbox',
      OUTLOOK: 'email_inbox',
      IMAP: 'email_inbox',
      LEXOFFICE: 'accounting',
      SEVDESK: 'accounting',
      DATEV: 'accounting',
      ELSTER: 'tax',
      FINANZONLINE: 'tax',
      GOOGLE_DRIVE: 'storage',
      DROPBOX: 'storage',
      ONEDRIVE: 'storage',
    };
    return accountTypeMap[provider] || 'other';
  }

  /**
   * Encrypt token for storage
   * TODO: Implement proper encryption using ConfigService secret
   */
  private encryptToken(token: string): string {
    // For now, return as-is (add proper encryption before production)
    // In production, use crypto.createCipher with a secret key from ConfigService
    return token;
  }
}
