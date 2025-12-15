import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { Prisma, QuoteStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { randomBytes } from 'crypto';

/**
 * Quotes Service
 * Business logic for quote/estimate management operations
 */
@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Find all quotes with pagination and filters
   */
  async findAll(
    organisationId: string,
    filters?: {
      status?: QuoteStatus;
      search?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    const {
      status,
      search,
      page = 1,
      pageSize = 20,
    } = filters || {};

    const where: Prisma.QuoteWhereInput = {
      organisationId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { quoteNumber: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = (page - 1) * pageSize;

    const [quotes, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      this.prisma.quote.count({ where }),
    ]);

    return {
      data: quotes,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Find quote by ID
   */
  async findOne(id: string, organisationId: string) {
    const quote = await this.prisma.quote.findFirst({
      where: {
        id,
        organisationId,
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    return quote;
  }

  /**
   * Find quote by public token (for client access)
   */
  async findByPublicToken(token: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { publicToken: token },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    // Mark as viewed if not already
    if (!quote.viewedAt && quote.status === QuoteStatus.SENT) {
      await this.prisma.quote.update({
        where: { id: quote.id },
        data: {
          viewedAt: new Date(),
          status: QuoteStatus.VIEWED,
        },
      });
    }

    return quote;
  }

  /**
   * Create new quote with auto-generated number (Q-2024-0001)
   */
  async create(organisationId: string, dto: CreateQuoteDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Quote must have at least one item');
    }

    // Generate quote number
    const year = new Date().getFullYear();
    const quoteNumber = await this.getNextQuoteNumber(organisationId, year);

    // Calculate totals
    const { subtotal, taxAmount, total } = this.calculateTotals(dto.items);

    // Create quote with items
    const quote = await this.prisma.quote.create({
      data: {
        quoteNumber,
        organisationId,
        clientId: dto.clientId,
        title: dto.title,
        description: dto.description,
        currency: dto.currency || 'EUR',
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        subtotal: new Decimal(subtotal),
        taxAmount: new Decimal(taxAmount),
        discountAmount: new Decimal(0),
        total: new Decimal(total),
        notes: dto.notes,
        terms: dto.terms,
        status: QuoteStatus.DRAFT,
        items: {
          create: dto.items.map((item, index) => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const itemTax = (itemSubtotal * (item.taxRate || 0)) / 100;
            const itemTotal = itemSubtotal + itemTax;

            return {
              description: item.description,
              quantity: new Decimal(item.quantity),
              unitPrice: new Decimal(item.unitPrice),
              taxRate: new Decimal(item.taxRate || 0),
              total: new Decimal(itemTotal),
              sortOrder: item.sortOrder ?? index + 1,
            };
          }),
        },
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    this.logger.log(
      `Created quote ${quote.quoteNumber} for organisation ${organisationId}`,
    );

    return quote;
  }

  /**
   * Update quote (only DRAFT quotes)
   */
  async update(id: string, organisationId: string, dto: UpdateQuoteDto) {
    const existing = await this.findOne(id, organisationId);

    if (existing.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot update quote with status ${existing.status}. Only DRAFT quotes can be updated.`,
      );
    }

    const updateData: Prisma.QuoteUpdateInput = {};

    if (dto.title) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.clientId !== undefined) updateData.clientId = dto.clientId;
    if (dto.currency) updateData.currency = dto.currency;
    if (dto.validUntil) updateData.validUntil = new Date(dto.validUntil);
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.terms !== undefined) updateData.terms = dto.terms;

    // If items are being updated, delete old items and create new ones
    if (dto.items) {
      if (dto.items.length === 0) {
        throw new BadRequestException('Quote must have at least one item');
      }

      const { subtotal, taxAmount, total } = this.calculateTotals(dto.items);

      updateData.subtotal = new Decimal(subtotal);
      updateData.taxAmount = new Decimal(taxAmount);
      updateData.total = new Decimal(total);

      // Delete existing items and create new ones
      await this.prisma.quoteItem.deleteMany({
        where: { quoteId: id },
      });

      updateData.items = {
        create: dto.items.map((item, index) => {
          const itemSubtotal = item.quantity * item.unitPrice;
          const itemTax = (itemSubtotal * (item.taxRate || 0)) / 100;
          const itemTotal = itemSubtotal + itemTax;

          return {
            description: item.description,
            quantity: new Decimal(item.quantity),
            unitPrice: new Decimal(item.unitPrice),
            taxRate: new Decimal(item.taxRate || 0),
            total: new Decimal(itemTotal),
            sortOrder: item.sortOrder ?? index + 1,
          };
        }),
      };
    }

    const quote = await this.prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    this.logger.log(`Updated quote ${id}`);

    return quote;
  }

  /**
   * Delete quote (only DRAFT quotes)
   */
  async delete(id: string, organisationId: string): Promise<void> {
    const existing = await this.findOne(id, organisationId);

    if (existing.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot delete quote with status ${existing.status}. Only DRAFT quotes can be deleted.`,
      );
    }

    await this.prisma.quote.delete({
      where: { id },
    });

    this.logger.log(`Deleted quote ${id}`);
  }

  /**
   * Send quote to client (generates public token)
   */
  async send(id: string, organisationId: string) {
    const existing = await this.findOne(id, organisationId);

    if (existing.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot send quote with status ${existing.status}`,
      );
    }

    // Generate unique public token
    const publicToken = randomBytes(32).toString('hex');

    const quote = await this.prisma.quote.update({
      where: { id },
      data: {
        status: QuoteStatus.SENT,
        sentAt: new Date(),
        publicToken,
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    this.logger.log(`Sent quote ${id} with public token ${publicToken}`);

    return quote;
  }

  /**
   * Client accepts quote (via public token)
   */
  async acceptByToken(token: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { publicToken: token },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (![QuoteStatus.SENT, QuoteStatus.VIEWED].includes(quote.status)) {
      throw new BadRequestException(
        `Cannot accept quote with status ${quote.status}`,
      );
    }

    const updated = await this.prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: QuoteStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    this.logger.log(`Quote ${quote.id} accepted by client`);

    return updated;
  }

  /**
   * Client rejects quote (via public token)
   */
  async rejectByToken(token: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { publicToken: token },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (![QuoteStatus.SENT, QuoteStatus.VIEWED].includes(quote.status)) {
      throw new BadRequestException(
        `Cannot reject quote with status ${quote.status}`,
      );
    }

    const updated = await this.prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: QuoteStatus.REJECTED,
        rejectedAt: new Date(),
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    this.logger.log(`Quote ${quote.id} rejected by client`);

    return updated;
  }

  /**
   * Convert quote to invoice
   */
  async convertToInvoice(id: string, organisationId: string) {
    const quote = await this.findOne(id, organisationId);

    if (quote.status !== QuoteStatus.ACCEPTED) {
      throw new BadRequestException(
        'Only ACCEPTED quotes can be converted to invoices',
      );
    }

    if (quote.convertedToInvoiceId) {
      throw new BadRequestException('Quote has already been converted to an invoice');
    }

    // TODO: Create invoice from quote
    // This would integrate with the invoices module
    // For now, just mark as converted
    const updated = await this.prisma.quote.update({
      where: { id },
      data: {
        status: QuoteStatus.CONVERTED,
        // convertedToInvoiceId would be set when invoice is created
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    this.logger.log(`Quote ${id} marked for conversion to invoice`);

    return updated;
  }

  /**
   * Calculate totals from items
   */
  private calculateTotals(
    items: Array<{ quantity: number; unitPrice: number; taxRate?: number }>,
  ): { subtotal: number; taxAmount: number; total: number } {
    let subtotal = 0;
    let taxAmount = 0;

    for (const item of items) {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemTax = (itemSubtotal * (item.taxRate || 0)) / 100;

      subtotal += itemSubtotal;
      taxAmount += itemTax;
    }

    const total = subtotal + taxAmount;

    return {
      subtotal: Math.round(subtotal * 10000) / 10000,
      taxAmount: Math.round(taxAmount * 10000) / 10000,
      total: Math.round(total * 10000) / 10000,
    };
  }

  /**
   * Generate next quote number (Q-2024-0001)
   */
  private async getNextQuoteNumber(
    organisationId: string,
    year: number,
  ): Promise<string> {
    const lastQuote = await this.prisma.quote.findFirst({
      where: {
        organisationId,
        quoteNumber: {
          startsWith: `Q-${year}-`,
        },
      },
      orderBy: {
        quoteNumber: 'desc',
      },
    });

    let nextNumber = 1;

    if (lastQuote) {
      const match = lastQuote.quoteNumber.match(/Q-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `Q-${year}-${nextNumber.toString().padStart(4, '0')}`;
  }
}
