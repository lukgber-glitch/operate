import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InvoicesRepository } from './invoices.repository';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import {
  EInvoiceFormat,
  ZugferdProfile,
  XRechnungSyntax,
} from './dto/generate-einvoice.dto';
import { Prisma, InvoiceStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { ZugferdService } from '../../e-invoice/services/zugferd.service';
import { XRechnungService } from '../../e-invoice/services/xrechnung.service';
import { InvoiceData } from '../../e-invoice/types/zugferd.types';
import { XRechnungSyntax as XRechnungSyntaxType } from '../../e-invoice/types/xrechnung.types';

/**
 * Invoices Service
 * Business logic for invoice management operations with E-Invoice support
 */
@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private repository: InvoicesRepository,
    private zugferdService: ZugferdService,
    private xrechnungService: XRechnungService,
  ) {}
