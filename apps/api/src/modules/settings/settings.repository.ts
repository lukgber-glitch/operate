import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Organisation, Prisma } from '@prisma/client';

/**
 * Settings Repository
 * Handles all database operations for Organisation settings
 */
@Injectable()
export class SettingsRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find organisation by ID
   */
  async findById(orgId: string): Promise<Organisation | null> {
    return this.prisma.organisation.findUnique({
      where: { id: orgId },
    });
  }

  /**
   * Update organisation settings
   */
  async update(
    orgId: string,
    data: Prisma.OrganisationUpdateInput,
  ): Promise<Organisation> {
    return this.prisma.organisation.update({
      where: { id: orgId },
      data,
    });
  }

  /**
   * Get organisation settings
   */
  async getSettings(orgId: string): Promise<{
    name: string;
    country: string;
    timezone: string;
    currency: string;
    settings: any;
  } | null> {
    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
      select: {
        name: true,
        country: true,
        timezone: true,
        currency: true,
        settings: true,
      },
    });

    return org;
  }
}
