import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateMileageEntryDto } from './dto/create-mileage-entry.dto';
import { UpdateMileageEntryDto } from './dto/update-mileage-entry.dto';
import { MileageQueryDto } from './dto/mileage-query.dto';
import { CreateMileageRateDto } from './dto/create-mileage-rate.dto';
import { VehicleType, Prisma } from '@prisma/client';

const KM_TO_MILES = 0.621371;
const MILES_TO_KM = 1.60934;

interface MileageSummary {
  totalEntries: number;
  totalDistanceKm: number;
  totalDistanceMiles: number;
  totalAmount: number;
  totalReimbursed: number;
  totalPending: number;
  byVehicleType: Record<string, {
    count: number;
    distanceKm: number;
    amount: number;
  }>;
}

interface TaxReport {
  year: number;
  organisationId: string;
  entries: Array<{
    date: Date;
    description: string;
    startLocation: string;
    endLocation: string;
    distanceKm: number;
    distanceMiles: number;
    vehicleType: VehicleType;
    purpose: string;
    totalAmount: number;
    currency: string;
  }>;
  summary: {
    totalDistanceKm: number;
    totalDistanceMiles: number;
    totalAmount: number;
    currency: string;
  };
}

@Injectable()
export class MileageService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Seed default rates on startup if they don't exist
    await this.seedDefaultRates();
  }

  /**
   * Convert kilometers to miles
   */
  convertUnits(value: number, from: 'km' | 'miles', to: 'km' | 'miles'): number {
    if (from === to) return value;

    if (from === 'km' && to === 'miles') {
      return value * KM_TO_MILES;
    }

    if (from === 'miles' && to === 'km') {
      return value * MILES_TO_KM;
    }

    return value;
  }

  /**
   * Get applicable mileage rate for a country, year, and vehicle type
   */
  async getApplicableRate(
    country: string,
    year: number,
    vehicleType: VehicleType,
    organisationId?: string,
  ) {
    const now = new Date();

    // First try to find org-specific rate
    if (organisationId) {
      const orgRate = await this.prisma.mileageRate.findFirst({
        where: {
          organisationId,
          country,
          year,
          vehicleType,
          effectiveFrom: { lte: now },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: now } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      if (orgRate) return orgRate;
    }

    // Fall back to official rates
    const officialRate = await this.prisma.mileageRate.findFirst({
      where: {
        organisationId: null,
        country,
        year,
        vehicleType,
        isOfficial: true,
        effectiveFrom: { lte: now },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: now } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return officialRate;
  }

  /**
   * Calculate total amount based on distance and rate
   */
  async calculateAmount(
    distanceKm: number,
    country: string,
    vehicleType: VehicleType,
    year: number,
    organisationId?: string,
  ): Promise<{ amount: number; ratePerKm: number; ratePerMile: number }> {
    const rate = await this.getApplicableRate(country, year, vehicleType, organisationId);

    if (!rate) {
      throw new BadRequestException(
        `No mileage rate found for ${country}, ${year}, ${vehicleType}`,
      );
    }

    const amount = distanceKm * Number(rate.ratePerKm);

    return {
      amount,
      ratePerKm: Number(rate.ratePerKm),
      ratePerMile: Number(rate.ratePerMile),
    };
  }

  /**
   * Find all mileage entries for an organization with optional filters
   */
  async findAll(organisationId: string, query: MileageQueryDto) {
    const where: Prisma.MileageEntryWhereInput = {
      organisationId,
    };

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.vehicleType) {
      where.vehicleType = query.vehicleType;
    }

    if (query.reimbursed !== undefined) {
      where.reimbursed = query.reimbursed;
    }

    return this.prisma.mileageEntry.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Find one mileage entry by ID
   */
  async findOne(id: string, organisationId: string) {
    const entry = await this.prisma.mileageEntry.findFirst({
      where: { id, organisationId },
    });

    if (!entry) {
      throw new NotFoundException(`Mileage entry ${id} not found`);
    }

    return entry;
  }

  /**
   * Create a new mileage entry with auto-calculation
   */
  async create(
    organisationId: string,
    userId: string,
    dto: CreateMileageEntryDto,
  ) {
    // Auto-calculate miles if not provided
    const distanceMiles = dto.distanceMiles ?? this.convertUnits(dto.distanceKm, 'km', 'miles');

    // Get organization's country for rate lookup
    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { country: true },
    });

    if (!org) {
      throw new BadRequestException('Organisation not found');
    }

    const year = new Date(dto.date).getFullYear();

    // Calculate amount if rates not provided
    let ratePerKm = dto.ratePerKm;
    let ratePerMile = dto.ratePerMile;
    let totalAmount: number;

    if (!ratePerKm || !ratePerMile) {
      const calculation = await this.calculateAmount(
        dto.distanceKm,
        org.country,
        dto.vehicleType,
        year,
        organisationId,
      );

      totalAmount = calculation.amount;
      ratePerKm = ratePerKm ?? calculation.ratePerKm;
      ratePerMile = ratePerMile ?? calculation.ratePerMile;
    } else {
      totalAmount = dto.distanceKm * ratePerKm;
    }

    return this.prisma.mileageEntry.create({
      data: {
        organisationId,
        userId,
        clientId: dto.clientId,
        projectId: dto.projectId,
        date: new Date(dto.date),
        description: dto.description,
        purpose: dto.purpose,
        startLocation: dto.startLocation,
        endLocation: dto.endLocation,
        distanceKm: new Prisma.Decimal(dto.distanceKm),
        distanceMiles: new Prisma.Decimal(distanceMiles),
        ratePerKm: new Prisma.Decimal(ratePerKm),
        ratePerMile: new Prisma.Decimal(ratePerMile),
        totalAmount: new Prisma.Decimal(totalAmount),
        currency: dto.currency ?? 'EUR',
        vehicleType: dto.vehicleType,
        isRoundTrip: dto.isRoundTrip ?? false,
      },
    });
  }

  /**
   * Update a mileage entry
   */
  async update(
    id: string,
    organisationId: string,
    dto: UpdateMileageEntryDto,
  ) {
    await this.findOne(id, organisationId); // Verify exists

    const updateData: any = {};

    if (dto.date) updateData.date = new Date(dto.date);
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.purpose !== undefined) updateData.purpose = dto.purpose;
    if (dto.startLocation !== undefined) updateData.startLocation = dto.startLocation;
    if (dto.endLocation !== undefined) updateData.endLocation = dto.endLocation;
    if (dto.clientId !== undefined) updateData.clientId = dto.clientId;
    if (dto.projectId !== undefined) updateData.projectId = dto.projectId;
    if (dto.vehicleType) updateData.vehicleType = dto.vehicleType;
    if (dto.isRoundTrip !== undefined) updateData.isRoundTrip = dto.isRoundTrip;
    if (dto.currency) updateData.currency = dto.currency;

    // Recalculate if distance changed
    if (dto.distanceKm !== undefined) {
      updateData.distanceKm = new Prisma.Decimal(dto.distanceKm);
      updateData.distanceMiles = new Prisma.Decimal(
        dto.distanceMiles ?? this.convertUnits(dto.distanceKm, 'km', 'miles'),
      );

      // Recalculate total if rate exists
      if (dto.ratePerKm) {
        updateData.ratePerKm = new Prisma.Decimal(dto.ratePerKm);
        updateData.totalAmount = new Prisma.Decimal(dto.distanceKm * dto.ratePerKm);
      }
    }

    if (dto.ratePerKm !== undefined) {
      updateData.ratePerKm = new Prisma.Decimal(dto.ratePerKm);
    }

    if (dto.ratePerMile !== undefined) {
      updateData.ratePerMile = new Prisma.Decimal(dto.ratePerMile);
    }

    return this.prisma.mileageEntry.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete a mileage entry
   */
  async delete(id: string, organisationId: string) {
    await this.findOne(id, organisationId); // Verify exists

    return this.prisma.mileageEntry.delete({
      where: { id },
    });
  }

  /**
   * Get summary statistics for a date range
   */
  async getSummary(
    organisationId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<MileageSummary> {
    const where: Prisma.MileageEntryWhereInput = {
      organisationId,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const entries = await this.prisma.mileageEntry.findMany({ where });

    const summary: MileageSummary = {
      totalEntries: entries.length,
      totalDistanceKm: 0,
      totalDistanceMiles: 0,
      totalAmount: 0,
      totalReimbursed: 0,
      totalPending: 0,
      byVehicleType: {},
    };

    for (const entry of entries) {
      const distanceKm = Number(entry.distanceKm);
      const distanceMiles = Number(entry.distanceMiles);
      const amount = Number(entry.totalAmount);

      summary.totalDistanceKm += distanceKm;
      summary.totalDistanceMiles += distanceMiles;
      summary.totalAmount += amount;

      if (entry.reimbursed) {
        summary.totalReimbursed += amount;
      } else {
        summary.totalPending += amount;
      }

      const vehicleKey = entry.vehicleType;
      if (!summary.byVehicleType[vehicleKey]) {
        summary.byVehicleType[vehicleKey] = {
          count: 0,
          distanceKm: 0,
          amount: 0,
        };
      }

      summary.byVehicleType[vehicleKey].count++;
      summary.byVehicleType[vehicleKey].distanceKm += distanceKm;
      summary.byVehicleType[vehicleKey].amount += amount;
    }

    return summary;
  }

  /**
   * Generate tax-compliant mileage report for a year
   */
  async getTaxReport(organisationId: string, year: number): Promise<TaxReport> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const entries = await this.prisma.mileageEntry.findMany({
      where: {
        organisationId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    const formattedEntries = entries.map((entry) => ({
      date: entry.date,
      description: entry.description || '',
      startLocation: entry.startLocation || '',
      endLocation: entry.endLocation || '',
      distanceKm: Number(entry.distanceKm),
      distanceMiles: Number(entry.distanceMiles),
      vehicleType: entry.vehicleType,
      purpose: entry.purpose || '',
      totalAmount: Number(entry.totalAmount),
      currency: entry.currency,
    }));

    const totalDistanceKm = formattedEntries.reduce((sum, e) => sum + e.distanceKm, 0);
    const totalDistanceMiles = formattedEntries.reduce((sum, e) => sum + e.distanceMiles, 0);
    const totalAmount = formattedEntries.reduce((sum, e) => sum + e.totalAmount, 0);
    const currency = entries[0]?.currency || 'EUR';

    return {
      year,
      organisationId,
      entries: formattedEntries,
      summary: {
        totalDistanceKm,
        totalDistanceMiles,
        totalAmount,
        currency,
      },
    };
  }

  /**
   * Create a custom mileage rate
   */
  async createRate(organisationId: string, dto: CreateMileageRateDto) {
    return this.prisma.mileageRate.create({
      data: {
        organisationId,
        country: dto.country,
        year: dto.year,
        vehicleType: dto.vehicleType,
        ratePerKm: new Prisma.Decimal(dto.ratePerKm),
        ratePerMile: new Prisma.Decimal(dto.ratePerMile),
        isOfficial: dto.isOfficial ?? false,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      },
    });
  }

  /**
   * Get available rates for an organization
   */
  async getRates(organisationId: string, country?: string, year?: number) {
    const where: Prisma.MileageRateWhereInput = {
      OR: [
        { organisationId },
        { organisationId: null, isOfficial: true },
      ],
    };

    if (country) where.country = country;
    if (year) where.year = year;

    return this.prisma.mileageRate.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { country: 'asc' },
        { vehicleType: 'asc' },
      ],
    });
  }

  /**
   * Seed default official rates
   */
  async seedDefaultRates() {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    const defaultRates = [
      // US rates
      {
        country: 'US',
        year: 2024,
        vehicleType: VehicleType.CAR,
        ratePerKm: 0.4163, // $0.67/mile converted
        ratePerMile: 0.67,
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        country: 'US',
        year: 2025,
        vehicleType: VehicleType.CAR,
        ratePerKm: 0.4349, // $0.70/mile converted
        ratePerMile: 0.70,
        effectiveFrom: new Date('2025-01-01'),
      },
      // Germany
      {
        country: 'DE',
        year: currentYear,
        vehicleType: VehicleType.CAR,
        ratePerKm: 0.30,
        ratePerMile: 0.4828, // converted
        effectiveFrom: new Date(`${currentYear}-01-01`),
      },
      {
        country: 'DE',
        year: nextYear,
        vehicleType: VehicleType.CAR,
        ratePerKm: 0.30,
        ratePerMile: 0.4828,
        effectiveFrom: new Date(`${nextYear}-01-01`),
      },
      // UK (simplified - first 10k miles)
      {
        country: 'GB',
        year: currentYear,
        vehicleType: VehicleType.CAR,
        ratePerKm: 0.2797, // £0.45/mile converted
        ratePerMile: 0.45,
        effectiveFrom: new Date(`${currentYear}-01-01`),
      },
      {
        country: 'GB',
        year: nextYear,
        vehicleType: VehicleType.CAR,
        ratePerKm: 0.2797,
        ratePerMile: 0.45,
        effectiveFrom: new Date(`${nextYear}-01-01`),
      },
      // Austria
      {
        country: 'AT',
        year: currentYear,
        vehicleType: VehicleType.CAR,
        ratePerKm: 0.42,
        ratePerMile: 0.6759, // converted
        effectiveFrom: new Date(`${currentYear}-01-01`),
      },
      {
        country: 'AT',
        year: nextYear,
        vehicleType: VehicleType.CAR,
        ratePerKm: 0.42,
        ratePerMile: 0.6759,
        effectiveFrom: new Date(`${nextYear}-01-01`),
      },
      // France (average)
      {
        country: 'FR',
        year: currentYear,
        vehicleType: VehicleType.CAR,
        ratePerKm: 0.603,
        ratePerMile: 0.9706, // converted
        effectiveFrom: new Date(`${currentYear}-01-01`),
      },
      {
        country: 'FR',
        year: nextYear,
        vehicleType: VehicleType.CAR,
        ratePerKm: 0.603,
        ratePerMile: 0.9706,
        effectiveFrom: new Date(`${nextYear}-01-01`),
      },
    ];

    for (const rate of defaultRates) {
      const existing = await this.prisma.mileageRate.findFirst({
        where: {
          organisationId: null,
          country: rate.country,
          year: rate.year,
          vehicleType: rate.vehicleType,
          isOfficial: true,
        },
      });

      if (!existing) {
        await this.prisma.mileageRate.create({
          data: {
            ...rate,
            ratePerKm: new Prisma.Decimal(rate.ratePerKm),
            ratePerMile: new Prisma.Decimal(rate.ratePerMile),
            isOfficial: true,
            organisationId: null,
          },
        });
      }
    }
  }
}
