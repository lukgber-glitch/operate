import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@operate/database';
import { VatReturnPreviewService } from './vat-return-preview.service';
import {
  CreateVatReturnDto,
  ApproveVatReturnDto,
  SubmitVatReturnDto,
} from './types/vat-return.types';

@Injectable()
export class VatReturnService {
  private readonly logger = new Logger(VatReturnService.name);

  constructor(
    private prisma: PrismaService,
    private previewService: VatReturnPreviewService,
  ) {}

  async createDraft(dto: CreateVatReturnDto) {
    this.logger.log(`Creating VAT return draft for org ${dto.organizationId}, period ${dto.period}`);

    // Check if already exists
    const existing = await this.prisma.vatReturn.findUnique({
      where: {
        organisationId_period: {
          organisationId: dto.organizationId,
          period: dto.period,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `VAT return for period ${dto.period} already exists with ID ${existing.id}`,
      );
    }

    // Generate preview
    const preview = await this.previewService.generatePreview(
      dto.organizationId,
      dto.period,
    );

    // Create VAT return record
    return this.prisma.vatReturn.create({
      data: {
        organisationId: dto.organizationId,
        period: dto.period,
        periodType: preview.periodType,
        periodStart: preview.periodStart,
        periodEnd: preview.periodEnd,
        outputVat: preview.outputVat.totalVat,
        inputVat: preview.inputVat.totalVat,
        netVat: preview.netVat,
        status: 'DRAFT',
        previewData: preview as Prisma.InputJsonValue,
      },
    });
  }

  async getById(id: string) {
    const vatReturn = await this.prisma.vatReturn.findUnique({
      where: { id },
    });

    if (!vatReturn) {
      throw new NotFoundException(`VAT return with ID ${id} not found`);
    }

    return vatReturn;
  }

  async getByPeriod(organizationId: string, period: string) {
    return this.prisma.vatReturn.findUnique({
      where: {
        organisationId_period: {
          organisationId: organizationId,
          period,
        },
      },
    });
  }

  async submitForApproval(id: string) {
    this.logger.log(`Submitting VAT return ${id} for approval`);

    const vatReturn = await this.getById(id);

    if (vatReturn.status !== 'DRAFT') {
      throw new BadRequestException(
        `VAT return must be in DRAFT status to submit for approval. Current status: ${vatReturn.status}`,
      );
    }

    return this.prisma.vatReturn.update({
      where: { id },
      data: {
        status: 'PENDING_APPROVAL',
        updatedAt: new Date(),
      },
    });
  }

  async approve(id: string, dto: ApproveVatReturnDto) {
    this.logger.log(`Approving VAT return ${id} by user ${dto.userId}`);

    const vatReturn = await this.getById(id);

    if (vatReturn.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(
        `VAT return must be in PENDING_APPROVAL status to approve. Current status: ${vatReturn.status}`,
      );
    }

    return this.prisma.vatReturn.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: dto.userId,
        approvedAt: new Date(),
        ...(dto.notes && { notes: dto.notes }),
        updatedAt: new Date(),
      },
    });
  }

  async markSubmitted(id: string, dto: SubmitVatReturnDto) {
    this.logger.log(`Marking VAT return ${id} as submitted with ticket ${dto.transferTicket}`);

    const vatReturn = await this.getById(id);

    if (vatReturn.status !== 'APPROVED') {
      throw new BadRequestException(
        `VAT return must be in APPROVED status to submit. Current status: ${vatReturn.status}`,
      );
    }

    return this.prisma.vatReturn.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        transferTicket: dto.transferTicket,
        receiptId: dto.receiptId,
        submittedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async markAccepted(id: string) {
    this.logger.log(`Marking VAT return ${id} as accepted by ELSTER`);

    const vatReturn = await this.getById(id);

    if (vatReturn.status !== 'SUBMITTED') {
      throw new BadRequestException(
        `VAT return must be in SUBMITTED status to mark as accepted. Current status: ${vatReturn.status}`,
      );
    }

    return this.prisma.vatReturn.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async markRejected(id: string, reason: string, errorCode?: string) {
    this.logger.log(`Marking VAT return ${id} as rejected by ELSTER: ${reason}`);

    const vatReturn = await this.getById(id);

    if (vatReturn.status !== 'SUBMITTED') {
      throw new BadRequestException(
        `VAT return must be in SUBMITTED status to mark as rejected. Current status: ${vatReturn.status}`,
      );
    }

    return this.prisma.vatReturn.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason,
        errorCode,
        updatedAt: new Date(),
      },
    });
  }

  async getHistory(organizationId: string, year?: number) {
    this.logger.log(`Getting VAT return history for org ${organizationId}${year ? `, year ${year}` : ''}`);

    const where: any = {
      organisationId: organizationId,
    };

    if (year) {
      where.periodStart = {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      };
    }

    return this.prisma.vatReturn.findMany({
      where,
      orderBy: {
        periodStart: 'desc',
      },
    });
  }

  async updatePreview(id: string) {
    this.logger.log(`Updating preview data for VAT return ${id}`);

    const vatReturn = await this.getById(id);

    if (!['DRAFT', 'PENDING_APPROVAL'].includes(vatReturn.status)) {
      throw new BadRequestException(
        `Cannot update preview for VAT return in status ${vatReturn.status}`,
      );
    }

    // Regenerate preview
    const preview = await this.previewService.generatePreview(
      vatReturn.organisationId,
      vatReturn.period,
    );

    // Update VAT return with new data
    return this.prisma.vatReturn.update({
      where: { id },
      data: {
        outputVat: preview.outputVat.totalVat,
        inputVat: preview.inputVat.totalVat,
        netVat: preview.netVat,
        previewData: preview as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string) {
    this.logger.log(`Deleting VAT return ${id}`);

    const vatReturn = await this.getById(id);

    if (!['DRAFT', 'REJECTED'].includes(vatReturn.status)) {
      throw new BadRequestException(
        `Cannot delete VAT return in status ${vatReturn.status}. Only DRAFT or REJECTED returns can be deleted.`,
      );
    }

    return this.prisma.vatReturn.delete({
      where: { id },
    });
  }
}
