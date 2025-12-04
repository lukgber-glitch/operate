import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { SettingsRepository } from './settings.repository';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { Prisma } from '@prisma/client';

/**
 * Settings Service
 * Business logic for organisation settings management
 */
@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private repository: SettingsRepository) {}

  /**
   * Get all settings for an organisation
   */
  async getSettings(orgId: string) {
    const org = await this.repository.getSettings(orgId);

    if (!org) {
      throw new NotFoundException(
        `Organisation with ID ${orgId} not found`,
      );
    }

    // Parse settings JSON
    const settings = typeof org.settings === 'string'
      ? JSON.parse(org.settings)
      : org.settings || {};

    return {
      profile: {
        name: org.name,
        country: org.country,
        timezone: org.timezone,
        currency: org.currency,
      },
      tax: settings.tax ?? {},
      invoice: settings.invoice ?? {},
      notifications: settings.notifications ?? {},
      integrations: settings.integrations ?? {},
    };
  }

  /**
   * Get specific category settings
   */
  async getCategorySettings(orgId: string, category: string) {
    const allSettings = await this.getSettings(orgId);

    if (category === 'profile') {
      return allSettings.profile;
    }

    const validCategories = ['tax', 'invoice', 'notifications', 'integrations'];
    if (!validCategories.includes(category)) {
      throw new NotFoundException(
        `Settings category '${category}' not found`,
      );
    }

    return allSettings[category as keyof typeof allSettings];
  }

  /**
   * Update all settings
   */
  async updateSettings(orgId: string, dto: UpdateSettingsDto) {
    const existing = await this.repository.findById(orgId);

    if (!existing) {
      throw new NotFoundException(
        `Organisation with ID ${orgId} not found`,
      );
    }

    // Parse existing settings
    const currentSettings = typeof existing.settings === 'string'
      ? JSON.parse(existing.settings)
      : existing.settings || {};

    // Build update data
    const updateData: Prisma.OrganisationUpdateInput = {};

    // Update profile fields directly on Organisation model
    if (dto.profile) {
      if (dto.profile.name !== undefined) updateData.name = dto.profile.name;
      if (dto.profile.country !== undefined) updateData.country = dto.profile.country;
      if (dto.profile.timezone !== undefined) updateData.timezone = dto.profile.timezone;
      if (dto.profile.currency !== undefined) updateData.currency = dto.profile.currency;
    }

    // Update nested settings JSON
    const newSettings = {
      ...currentSettings,
      ...(dto.tax && { tax: { ...currentSettings.tax, ...dto.tax } }),
      ...(dto.invoice && { invoice: { ...currentSettings.invoice, ...dto.invoice } }),
      ...(dto.notifications && { notifications: { ...currentSettings.notifications, ...dto.notifications } }),
      ...(dto.integrations && { integrations: { ...currentSettings.integrations, ...dto.integrations } }),
    };

    updateData.settings = newSettings;

    const updated = await this.repository.update(orgId, updateData);

    this.logger.log(`Updated settings for organisation ${orgId}`);

    // Return formatted settings
    return this.getSettings(orgId);
  }

  /**
   * Update specific category settings
   */
  async updateCategorySettings(
    orgId: string,
    category: string,
    data: Record<string, any>,
  ) {
    const existing = await this.repository.findById(orgId);

    if (!existing) {
      throw new NotFoundException(
        `Organisation with ID ${orgId} not found`,
      );
    }

    // Handle profile category (updates Organisation fields directly)
    if (category === 'profile') {
      const updateData: Prisma.OrganisationUpdateInput = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.country !== undefined) updateData.country = data.country;
      if (data.timezone !== undefined) updateData.timezone = data.timezone;
      if (data.currency !== undefined) updateData.currency = data.currency;

      await this.repository.update(orgId, updateData);
      this.logger.log(`Updated profile settings for organisation ${orgId}`);
      return this.getCategorySettings(orgId, 'profile');
    }

    // Handle other categories (stored in settings JSON)
    const validCategories = ['tax', 'invoice', 'notifications', 'integrations'];
    if (!validCategories.includes(category)) {
      throw new NotFoundException(
        `Settings category '${category}' not found`,
      );
    }

    // Parse existing settings
    const currentSettings = typeof existing.settings === 'string'
      ? JSON.parse(existing.settings)
      : existing.settings || {};

    // Update specific category
    const newSettings = {
      ...currentSettings,
      [category]: {
        ...currentSettings[category],
        ...data,
      },
    };

    await this.repository.update(orgId, { settings: newSettings });

    this.logger.log(`Updated ${category} settings for organisation ${orgId}`);

    return this.getCategorySettings(orgId, category);
  }
}
