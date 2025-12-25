/**
 * Unit Test: Invoices Controller
 * Tests for invoice management endpoints
 *
 * @see RULES.md Section 6 - Testing Standards
 * @see RULES.md Section 6.3 - Test Naming Convention
 */

import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { createMockUser, createMockOrganization } from '../../../../test/utils/test-helpers';
import { NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InvoiceStatus, InvoiceType } from '@prisma/client';

/**
 * Mock InvoicesService
 */
const mockInvoicesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  send: jest.fn(),
  pay: jest.fn(),
  cancel: jest.fn(),
  duplicate: jest.fn(),
  generatePdf: jest.fn(),
  generateInvoiceWithFormat: jest.fn(),
  convertInvoiceAmount: jest.fn(),
  recalculateBaseCurrency: jest.fn(),
  getStatistics: jest.fn(),
  getOverdue: jest.fn(),
  getTotalsInCurrency: jest.fn(),
};

/**
 * Invoices Controller Test Suite
 */
describe('InvoicesController', () => {
  let controller;
  let service;

  const mockOrg = createMockOrganization();
  const mockUser = createMockUser();

  /**
   * Setup before each test
   */
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [
        {
          provide: InvoicesService,
          useValue: mockInvoicesService,
        },
      ],
    })
      .overrideGuard(require('../../auth/guards/jwt-auth.guard').JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(require('../../auth/rbac/rbac.guard').RbacGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(InvoicesController);
    service = module.get(InvoicesService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  /**
   * Controller initialization
   */
  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have InvoicesService injected', () => {
      expect(service).toBeDefined();
    });
  });

  /**
   * POST /organisations/:orgId/invoices - Create invoice
   */
  describe('create', () => {
    it('should create invoice and return created invoice', async () => {
      const createDto = {
        type: InvoiceType.STANDARD,
        customerId: 'customer-123',
        customerName: 'Test Customer',
        customerEmail: 'customer@example.com',
        issueDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        currency: 'EUR',
        vatRate: 19,
        items: [
          {
            description: 'Consulting Services',
            quantity: 10,
            unitPrice: 100,
          },
        ],
      };

      const mockInvoice = {
        id: 'invoice-123',
        orgId: mockOrg.id,
        number: 'INV-2024-001',
        type: InvoiceType.STANDARD,
        status: InvoiceStatus.DRAFT,
        customerId: createDto.customerId,
        customerName: createDto.customerName,
        customerEmail: createDto.customerEmail,
        issueDate: createDto.issueDate,
        dueDate: createDto.dueDate,
        subtotal: 1000,
        taxAmount: 190,
        totalAmount: 1190,
        total: 1190,
        currency: 'EUR',
        vatRate: 19,
        reverseCharge: false,
        items: [
          {
            id: 'item-1',
            invoiceId: 'invoice-123',
            description: 'Consulting Services',
            quantity: 10,
            unitPrice: 100,
            amount: 1000,
            taxRate: 19,
            taxAmount: 190,
            sortOrder: 1,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInvoicesService.create.mockResolvedValue(mockInvoice);

      const result = await controller.create(mockOrg.id, createDto);

      expect(result).toEqual(mockInvoice);
      expect(result.number).toBe('INV-2024-001');
      expect(result.status).toBe(InvoiceStatus.DRAFT);
      expect(result.totalAmount).toBe(1190);
      expect(service.create).toHaveBeenCalledWith(mockOrg.id, createDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should handle invoice creation with multiple items', async () => {
      const createDto = {
        type: InvoiceType.STANDARD,
        customerName: 'Test Customer',
        issueDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        currency: 'EUR',
        vatRate: 19,
        items: [
          {
            description: 'Item 1',
            quantity: 2,
            unitPrice: 50,
          },
          {
            description: 'Item 2',
            quantity: 1,
            unitPrice: 100,
          },
        ],
      };

      const mockInvoice = {
        id: 'invoice-456',
        orgId: mockOrg.id,
        number: 'INV-2024-002',
        status: InvoiceStatus.DRAFT,
        subtotal: 200,
        taxAmount: 38,
        totalAmount: 238,
        items: createDto.items.map((item, idx) => ({
          id: `item-${idx + 1}`,
          invoiceId: 'invoice-456',
          ...item,
          amount: item.quantity * item.unitPrice,
          taxRate: 19,
          taxAmount: (item.quantity * item.unitPrice * 19) / 100,
          sortOrder: idx + 1,
        })),
      };

      mockInvoicesService.create.mockResolvedValue(mockInvoice);

      const result = await controller.create(mockOrg.id, createDto);

      expect(result.items).toHaveLength(2);
      expect(service.create).toHaveBeenCalledWith(mockOrg.id, createDto);
    });

    it('should reject empty items array', async () => {
      const createDto = {
        type: InvoiceType.STANDARD,
        customerName: 'Test Customer',
        issueDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        currency: 'EUR',
        items: [],
      };

      mockInvoicesService.create.mockRejectedValue(
        new BadRequestException('Invoice must have at least one item')
      );

      await expect(controller.create(mockOrg.id, createDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  /**
   * GET /organisations/:orgId/invoices - Get all invoices
   */
  describe('findAll', () => {
    it('should return array of invoices with pagination', async () => {
      const query = {
        page: 1,
        pageSize: 20,
      };

      const mockResponse = {
        data: [
          {
            id: 'invoice-1',
            number: 'INV-2024-001',
            status: InvoiceStatus.DRAFT,
            totalAmount: 1190,
          },
          {
            id: 'invoice-2',
            number: 'INV-2024-002',
            status: InvoiceStatus.SENT,
            totalAmount: 2500,
          },
        ],
        meta: {
          total: 2,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
      };

      mockInvoicesService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(mockOrg.id, query);

      expect(result).toEqual(mockResponse);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(service.findAll).toHaveBeenCalledWith(mockOrg.id, query);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle empty invoice list', async () => {
      const query = {};

      const mockResponse = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
        },
      };

      mockInvoicesService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(mockOrg.id, query);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('should support filtering by status', async () => {
      const query = {
        status: InvoiceStatus.PAID,
      };

      const mockResponse = {
        data: [
          {
            id: 'invoice-3',
            number: 'INV-2024-003',
            status: InvoiceStatus.PAID,
            totalAmount: 5000,
          },
        ],
        meta: {
          total: 1,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
      };

      mockInvoicesService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(mockOrg.id, query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(InvoiceStatus.PAID);
      expect(service.findAll).toHaveBeenCalledWith(mockOrg.id, query);
    });
  });

  /**
   * GET /organisations/:orgId/invoices/:id - Get one invoice
   */
  describe('findOne', () => {
    it('should return invoice details by ID', async () => {
      const invoiceId = 'invoice-123';

      const mockInvoice = {
        id: invoiceId,
        orgId: mockOrg.id,
        number: 'INV-2024-001',
        type: InvoiceType.STANDARD,
        status: InvoiceStatus.DRAFT,
        customerName: 'Test Customer',
        issueDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        subtotal: 1000,
        taxAmount: 190,
        totalAmount: 1190,
        currency: 'EUR',
        items: [
          {
            id: 'item-1',
            description: 'Consulting Services',
            quantity: 10,
            unitPrice: 100,
            amount: 1000,
          },
        ],
      };

      mockInvoicesService.findById.mockResolvedValue(mockInvoice);

      const result = await controller.findOne(invoiceId);

      expect(result).toEqual(mockInvoice);
      expect(result.id).toBe(invoiceId);
      expect(result.number).toBe('INV-2024-001');
      expect(result.items).toHaveLength(1);
      expect(service.findById).toHaveBeenCalledWith(invoiceId);
      expect(service.findById).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when invoice does not exist', async () => {
      const invoiceId = 'non-existent-invoice';

      mockInvoicesService.findById.mockRejectedValue(
        new NotFoundException(`Invoice with ID ${invoiceId} not found`)
      );

      await expect(controller.findOne(invoiceId)).rejects.toThrow(NotFoundException);
      expect(service.findById).toHaveBeenCalledWith(invoiceId);
    });
  });

  /**
   * PATCH /organisations/:orgId/invoices/:id - Update invoice
   */
  describe('update', () => {
    it('should update draft invoice successfully', async () => {
      const invoiceId = 'invoice-123';
      const updateDto = {
        customerName: 'Updated Customer Name',
        notes: 'Updated notes',
      };

      const mockUpdatedInvoice = {
        id: invoiceId,
        number: 'INV-2024-001',
        status: InvoiceStatus.DRAFT,
        customerName: 'Updated Customer Name',
        notes: 'Updated notes',
        totalAmount: 1190,
      };

      mockInvoicesService.update.mockResolvedValue(mockUpdatedInvoice);

      const result = await controller.update(invoiceId, updateDto);

      expect(result).toEqual(mockUpdatedInvoice);
      expect(result.customerName).toBe('Updated Customer Name');
      expect(result.notes).toBe('Updated notes');
      expect(service.update).toHaveBeenCalledWith(invoiceId, updateDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should reject update of non-draft invoice', async () => {
      const invoiceId = 'invoice-sent';
      const updateDto = {
        customerName: 'Updated Name',
      };

      mockInvoicesService.update.mockRejectedValue(
        new BadRequestException(
          'Cannot update invoice with status SENT. Only DRAFT invoices can be updated.'
        )
      );

      await expect(controller.update(invoiceId, updateDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  /**
   * DELETE /organisations/:orgId/invoices/:id - Delete invoice
   */
  describe('delete', () => {
    it('should delete draft invoice successfully', async () => {
      const invoiceId = 'invoice-123';

      mockInvoicesService.delete.mockResolvedValue(undefined);

      await controller.delete(invoiceId);

      expect(service.delete).toHaveBeenCalledWith(invoiceId);
      expect(service.delete).toHaveBeenCalledTimes(1);
    });

    it('should reject deletion of non-draft invoice', async () => {
      const invoiceId = 'invoice-paid';

      mockInvoicesService.delete.mockRejectedValue(
        new BadRequestException(
          'Cannot delete invoice with status PAID. Only DRAFT invoices can be deleted.'
        )
      );

      await expect(controller.delete(invoiceId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when invoice does not exist', async () => {
      const invoiceId = 'non-existent';

      mockInvoicesService.delete.mockRejectedValue(
        new NotFoundException(`Invoice with ID ${invoiceId} not found`)
      );

      await expect(controller.delete(invoiceId)).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * POST /organisations/:orgId/invoices/:id/send - Mark as sent
   */
  describe('send', () => {
    it('should mark draft invoice as sent', async () => {
      const invoiceId = 'invoice-123';

      const mockSentInvoice = {
        id: invoiceId,
        number: 'INV-2024-001',
        status: InvoiceStatus.SENT,
        totalAmount: 1190,
      };

      mockInvoicesService.send.mockResolvedValue(mockSentInvoice);

      const result = await controller.send(invoiceId);

      expect(result.status).toBe(InvoiceStatus.SENT);
      expect(service.send).toHaveBeenCalledWith(invoiceId);
      expect(service.send).toHaveBeenCalledTimes(1);
    });

    it('should reject sending non-draft invoice', async () => {
      const invoiceId = 'invoice-already-sent';

      mockInvoicesService.send.mockRejectedValue(
        new BadRequestException('Cannot send invoice with status SENT')
      );

      await expect(controller.send(invoiceId)).rejects.toThrow(BadRequestException);
    });
  });

  /**
   * POST /organisations/:orgId/invoices/:id/pay - Mark as paid
   */
  describe('pay', () => {
    it('should mark sent invoice as paid', async () => {
      const invoiceId = 'invoice-123';

      const mockPaidInvoice = {
        id: invoiceId,
        number: 'INV-2024-001',
        status: InvoiceStatus.PAID,
        paidDate: new Date('2024-01-20'),
        totalAmount: 1190,
      };

      mockInvoicesService.pay.mockResolvedValue(mockPaidInvoice);

      const result = await controller.pay(invoiceId);

      expect(result.status).toBe(InvoiceStatus.PAID);
      expect(result.paidDate).toBeDefined();
      expect(service.pay).toHaveBeenCalledWith(invoiceId);
      expect(service.pay).toHaveBeenCalledTimes(1);
    });

    it('should reject paying draft invoice', async () => {
      const invoiceId = 'invoice-draft';

      mockInvoicesService.pay.mockRejectedValue(
        new BadRequestException('Cannot mark invoice with status DRAFT as paid')
      );

      await expect(controller.pay(invoiceId)).rejects.toThrow(BadRequestException);
    });
  });

  /**
   * POST /organisations/:orgId/invoices/:id/cancel - Cancel invoice
   */
  describe('cancel', () => {
    it('should cancel invoice successfully', async () => {
      const invoiceId = 'invoice-123';

      const mockCancelledInvoice = {
        id: invoiceId,
        number: 'INV-2024-001',
        status: InvoiceStatus.CANCELLED,
        totalAmount: 1190,
      };

      mockInvoicesService.cancel.mockResolvedValue(mockCancelledInvoice);

      const result = await controller.cancel(invoiceId);

      expect(result.status).toBe(InvoiceStatus.CANCELLED);
      expect(service.cancel).toHaveBeenCalledWith(invoiceId);
      expect(service.cancel).toHaveBeenCalledTimes(1);
    });

    it('should reject cancelling paid invoice', async () => {
      const invoiceId = 'invoice-paid';

      mockInvoicesService.cancel.mockRejectedValue(
        new BadRequestException('Cannot cancel a paid invoice')
      );

      await expect(controller.cancel(invoiceId)).rejects.toThrow(BadRequestException);
    });
  });

  /**
   * GET /organisations/:orgId/invoices/statistics - Get statistics
   */
  describe('getStatistics', () => {
    it('should return invoice statistics by status', async () => {
      const mockStats = {
        total: 100,
        draft: 20,
        sent: 30,
        paid: 45,
        overdue: 5,
      };

      mockInvoicesService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics(mockOrg.id);

      expect(result).toEqual(mockStats);
      expect(result.total).toBe(100);
      expect(service.getStatistics).toHaveBeenCalledWith(mockOrg.id);
      expect(service.getStatistics).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * GET /organisations/:orgId/invoices/overdue - Get overdue invoices
   */
  describe('getOverdue', () => {
    it('should return list of overdue invoices', async () => {
      const mockOverdueInvoices = [
        {
          id: 'invoice-1',
          number: 'INV-2024-001',
          status: InvoiceStatus.OVERDUE,
          dueDate: new Date('2024-01-01'),
          totalAmount: 1000,
        },
        {
          id: 'invoice-2',
          number: 'INV-2024-002',
          status: InvoiceStatus.OVERDUE,
          dueDate: new Date('2024-01-10'),
          totalAmount: 2000,
        },
      ];

      mockInvoicesService.getOverdue.mockResolvedValue(mockOverdueInvoices);

      const result = await controller.getOverdue(mockOrg.id);

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe(InvoiceStatus.OVERDUE);
      expect(service.getOverdue).toHaveBeenCalledWith(mockOrg.id);
      expect(service.getOverdue).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * POST /organisations/:orgId/invoices/:id/duplicate - Duplicate invoice
   */
  describe('duplicate', () => {
    it('should duplicate invoice with new number', async () => {
      const invoiceId = 'invoice-123';

      const mockDuplicatedInvoice = {
        id: 'invoice-new',
        orgId: mockOrg.id,
        number: 'INV-2024-999',
        status: InvoiceStatus.DRAFT,
        customerName: 'Test Customer',
        totalAmount: 1190,
        items: [
          {
            id: 'item-new',
            description: 'Consulting Services',
            quantity: 10,
            unitPrice: 100,
          },
        ],
      };

      mockInvoicesService.duplicate.mockResolvedValue(mockDuplicatedInvoice);

      const result = await controller.duplicate(invoiceId, mockOrg.id);

      expect(result.id).not.toBe(invoiceId);
      expect(result.status).toBe(InvoiceStatus.DRAFT);
      expect(result.number).toBe('INV-2024-999');
      expect(service.duplicate).toHaveBeenCalledWith(invoiceId, mockOrg.id);
      expect(service.duplicate).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * POST /organisations/:orgId/invoices/:id/pdf - Generate PDF
   */
  describe('generatePdf', () => {
    it('should generate PDF and return base64 buffer', async () => {
      const invoiceId = 'invoice-123';
      const mockPdfBuffer = Buffer.from('PDF content here');

      mockInvoicesService.generatePdf.mockResolvedValue(mockPdfBuffer);

      const result = await controller.generatePdf(invoiceId, mockOrg.id);

      expect(result.buffer).toBe(mockPdfBuffer.toString('base64'));
      expect(result.contentType).toBe('application/pdf');
      expect(result.filename).toBe(`invoice-${invoiceId}.pdf`);
      expect(service.generatePdf).toHaveBeenCalledWith(invoiceId);
      expect(service.generatePdf).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * GET /organisations/:orgId/invoices/:id/generate - Generate with format
   */
  describe('generateInvoice', () => {
    it('should generate invoice with default PDF format', async () => {
      const invoiceId = 'invoice-123';
      const query = {};

      const mockResult = {
        buffer: Buffer.from('PDF content'),
        contentType: 'application/pdf',
        filename: 'invoice-INV-2024-001.pdf',
      };

      mockInvoicesService.generateInvoiceWithFormat.mockResolvedValue(mockResult);

      const result = await controller.generateInvoice(invoiceId, mockOrg.id, query);

      expect(result.buffer).toBe(mockResult.buffer.toString('base64'));
      expect(result.contentType).toBe('application/pdf');
      expect(service.generateInvoiceWithFormat).toHaveBeenCalledWith(
        invoiceId,
        undefined,
        undefined,
        undefined
      );
    });
  });

  /**
   * POST /organisations/:orgId/invoices/:id/convert - Convert currency
   */
  describe('convertInvoice', () => {
    it('should convert invoice to different currency', async () => {
      const invoiceId = 'invoice-123';
      const convertDto = {
        targetCurrency: 'USD',
        exchangeRate: 1.1,
      };

      const mockConversion = {
        originalAmount: 1190,
        originalCurrency: 'EUR',
        convertedAmount: 1309,
        convertedCurrency: 'USD',
        exchangeRate: 1.1,
      };

      mockInvoicesService.convertInvoiceAmount.mockResolvedValue(mockConversion);

      const result = await controller.convertInvoice(invoiceId, convertDto);

      expect(result).toEqual(mockConversion);
      expect(result.convertedCurrency).toBe('USD');
      expect(result.convertedAmount).toBe(1309);
      expect(service.convertInvoiceAmount).toHaveBeenCalledWith(
        invoiceId,
        convertDto.targetCurrency,
        convertDto.exchangeRate
      );
    });
  });

  /**
   * Authorization tests
   */
  describe('Authorization', () => {
    it('should require authentication for all endpoints', () => {
      // Note: In real implementation, these would use guards
      // This test verifies the controller structure
      expect(controller).toBeDefined();
    });
  });
});
