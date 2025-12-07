import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorFilterDto } from './dto/vendor-filter.dto';
import { Prisma, VendorStatus } from '@prisma/client';

/**
 * Vendors Service
 * Business logic for vendor management
 */
@Injectable()
export class VendorsService {
  private readonly logger = new Logger(VendorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all vendors with pagination and filters
   */
  async findAll(organisationId: string, query: VendorFilterDto) {
    const {
      search,
      status,
      country,
      page = 1,
      pageSize = 20,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    // Build where clause
    const where: Prisma.VendorWhereInput = {
      organisationId,
      ...(status && { status }),
      ...(country && { country }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { displayName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { taxId: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = (page - 1) * pageSize;

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { bills: true },
          },
        },
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return {
      data: vendors,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Find vendor by ID
   */
  async findById(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        bills: {
          orderBy: { issueDate: 'desc' },
          take: 10,
        },
        _count: {
          select: { bills: true },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    return vendor;
  }

  /**
   * Create new vendor
   */
  async create(organisationId: string, dto: CreateVendorDto) {
    // Check for duplicate tax ID if provided
    if (dto.taxId) {
      const existing = await this.prisma.vendor.findFirst({
        where: {
          organisationId,
          taxId: dto.taxId,
        },
      });

      if (existing) {
        throw new ConflictException(
          `Vendor with tax ID ${dto.taxId} already exists`,
        );
      }
    }

    const vendorData: Prisma.VendorCreateInput = {
      organisation: { connect: { id: organisationId } },
      name: dto.name,
      displayName: dto.displayName,
      email: dto.email,
      phone: dto.phone,
      website: dto.website,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postalCode,
      country: dto.country,
      taxId: dto.taxId,
      taxIdType: dto.taxIdType || 'OTHER',
      paymentTerms: dto.paymentTerms !== undefined ? dto.paymentTerms : 30,
      preferredPaymentMethod: dto.preferredPaymentMethod,
      bankAccountName: dto.bankAccountName,
      bankIban: dto.bankIban,
      bankBic: dto.bankBic,
      defaultCategoryId: dto.defaultCategoryId,
      defaultTaxDeductible:
        dto.defaultTaxDeductible !== undefined
          ? dto.defaultTaxDeductible
          : true,
      status: dto.status || VendorStatus.ACTIVE,
      notes: dto.notes,
    };

    const vendor = await this.prisma.vendor.create({
      data: vendorData,
      include: {
        _count: {
          select: { bills: true },
        },
      },
    });

    this.logger.log(
      `Created vendor ${vendor.id} (${vendor.name}) for organisation ${organisationId}`,
    );

    return vendor;
  }

  /**
   * Update vendor
   */
  async update(id: string, dto: UpdateVendorDto) {
    const existing = await this.prisma.vendor.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    // Check for duplicate tax ID if changing it
    if (dto.taxId && dto.taxId !== existing.taxId) {
      const duplicate = await this.prisma.vendor.findFirst({
        where: {
          organisationId: existing.organisationId,
          taxId: dto.taxId,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          `Another vendor with tax ID ${dto.taxId} already exists`,
        );
      }
    }

    const updateData: Prisma.VendorUpdateInput = {};

    // Update all provided fields
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.displayName !== undefined) updateData.displayName = dto.displayName;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.website !== undefined) updateData.website = dto.website;
    if (dto.addressLine1 !== undefined) updateData.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== undefined) updateData.addressLine2 = dto.addressLine2;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.state !== undefined) updateData.state = dto.state;
    if (dto.postalCode !== undefined) updateData.postalCode = dto.postalCode;
    if (dto.country !== undefined) updateData.country = dto.country;
    if (dto.taxId !== undefined) updateData.taxId = dto.taxId;
    if (dto.taxIdType !== undefined) updateData.taxIdType = dto.taxIdType;
    if (dto.paymentTerms !== undefined)
      updateData.paymentTerms = dto.paymentTerms;
    if (dto.preferredPaymentMethod !== undefined)
      updateData.preferredPaymentMethod = dto.preferredPaymentMethod;
    if (dto.bankAccountName !== undefined)
      updateData.bankAccountName = dto.bankAccountName;
    if (dto.bankIban !== undefined) updateData.bankIban = dto.bankIban;
    if (dto.bankBic !== undefined) updateData.bankBic = dto.bankBic;
    if (dto.defaultCategoryId !== undefined)
      updateData.defaultCategoryId = dto.defaultCategoryId;
    if (dto.defaultTaxDeductible !== undefined)
      updateData.defaultTaxDeductible = dto.defaultTaxDeductible;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const vendor = await this.prisma.vendor.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { bills: true },
        },
      },
    });

    this.logger.log(`Updated vendor ${id} (${vendor.name})`);

    return vendor;
  }

  /**
   * Delete vendor
   */
  async delete(id: string): Promise<void> {
    const existing = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bills: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    // Check if vendor has associated bills
    if (existing._count.bills > 0) {
      throw new BadRequestException(
        `Cannot delete vendor with ${existing._count.bills} associated bills. Please archive the vendor instead.`,
      );
    }

    await this.prisma.vendor.delete({
      where: { id },
    });

    this.logger.log(`Deleted vendor ${id} (${existing.name})`);
  }

  /**
   * Archive vendor (soft delete)
   */
  async archive(id: string) {
    const existing = await this.prisma.vendor.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    if (existing.status === VendorStatus.INACTIVE) {
      throw new BadRequestException('Vendor is already archived');
    }

    const vendor = await this.prisma.vendor.update({
      where: { id },
      data: {
        status: VendorStatus.INACTIVE,
      },
      include: {
        _count: {
          select: { bills: true },
        },
      },
    });

    this.logger.log(`Archived vendor ${id} (${vendor.name})`);

    return vendor;
  }

  /**
   * Reactivate archived vendor
   */
  async reactivate(id: string) {
    const existing = await this.prisma.vendor.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    if (existing.status === VendorStatus.ACTIVE) {
      throw new BadRequestException('Vendor is already active');
    }

    const vendor = await this.prisma.vendor.update({
      where: { id },
      data: {
        status: VendorStatus.ACTIVE,
      },
      include: {
        _count: {
          select: { bills: true },
        },
      },
    });

    this.logger.log(`Reactivated vendor ${id} (${vendor.name})`);

    return vendor;
  }

  /**
   * Get vendor statistics
   */
  async getStatistics(organisationId: string) {
    const [
      total,
      active,
      inactive,
      blocked,
      recentBills,
    ] = await Promise.all([
      this.prisma.vendor.count({ where: { organisationId } }),
      this.prisma.vendor.count({
        where: { organisationId, status: VendorStatus.ACTIVE },
      }),
      this.prisma.vendor.count({
        where: { organisationId, status: VendorStatus.INACTIVE },
      }),
      this.prisma.vendor.count({
        where: { organisationId, status: VendorStatus.BLOCKED },
      }),
      this.prisma.bill.groupBy({
        by: ['vendorId'],
        where: {
          organisationId,
          vendorId: { not: null },
        },
        _count: {
          _all: true,
        },
        _sum: {
          totalAmount: true,
        },
        orderBy: {
          _count: {
            _all: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      total,
      byStatus: {
        active,
        inactive,
        blocked,
      },
      topVendorsByBillCount: recentBills.map((stat) => ({
        vendorId: stat.vendorId,
        billCount: stat._count._all,
        totalAmount: Number(stat._sum?.totalAmount || 0),
      })),
    };
  }
}
