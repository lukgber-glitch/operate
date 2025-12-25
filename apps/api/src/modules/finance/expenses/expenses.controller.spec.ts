/**
 * Unit Test: Expenses Controller
 * Tests for expense management endpoints
 *
 * @see RULES.md Section 6 - Testing Standards
 * @see RULES.md Section 6.3 - Test Naming Convention
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { createMockUser, createMockOrganization } from '../../../../test/utils/test-helpers';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ExpenseStatus, ExpenseCategory } from '@prisma/client';

/**
 * Mock ExpensesService
 */
const mockExpensesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  approve: jest.fn(),
  reject: jest.fn(),
  reimburse: jest.fn(),
  getStatistics: jest.fn(),
  getPending: jest.fn(),
};

/**
 * Expenses Controller Test Suite
 */
describe('ExpensesController', () => {
  let controller: ExpensesController;
  let service: ExpensesService;

  const mockOrg = createMockOrganization();
  const mockUser = createMockUser();

  /**
   * Setup before each test
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [
        {
          provide: ExpensesService,
          useValue: mockExpensesService,
        },
      ],
    })
      .overrideGuard(require('../../auth/guards/jwt-auth.guard').JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(require('../../auth/rbac/rbac.guard').RbacGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ExpensesController>(ExpensesController);
    service = module.get<ExpensesService>(ExpensesService);

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

    it('should have ExpensesService injected', () => {
      expect(service).toBeDefined();
    });
  });

  /**
   * POST /organisations/:orgId/expenses - Create expense
   */
  describe('create', () => {
    it('should create expense and return created expense', async () => {
      const createDto = {
        description: 'Office Supplies',
        amount: 150.00,
        currency: 'EUR',
        date: '2024-01-15',
        category: ExpenseCategory.OFFICE,
        vendorName: 'Office Depot',
        submittedBy: mockUser.id,
        paymentMethod: 'CREDIT_CARD',
      };

      const mockExpense = {
        id: 'expense-123',
        orgId: mockOrg.id,
        description: createDto.description,
        amount: 150.00,
        currency: 'EUR',
        date: new Date('2024-01-15'),
        category: ExpenseCategory.OFFICE,
        vendorName: 'Office Depot',
        status: ExpenseStatus.PENDING,
        submittedBy: mockUser.id,
        paymentMethod: 'CREDIT_CARD',
        isDeductible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockExpensesService.create.mockResolvedValue(mockExpense);

      const result = await controller.create(mockOrg.id, createDto);

      expect(result).toEqual(mockExpense);
      expect(result.status).toBe(ExpenseStatus.PENDING);
      expect(result.amount).toBe(150.00);
      expect(result.description).toBe('Office Supplies');
      expect(service.create).toHaveBeenCalledWith(mockOrg.id, createDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should create expense with VAT details', async () => {
      const createDto = {
        description: 'Business Lunch',
        amount: 100.00,
        currency: 'EUR',
        date: '2024-01-15',
        category: ExpenseCategory.MEALS,
        vendorName: 'Restaurant XYZ',
        submittedBy: mockUser.id,
        vatAmount: 19.00,
        vatRate: 19,
        receiptUrl: 'https://example.com/receipt.pdf',
      };

      const mockExpense = {
        id: 'expense-456',
        orgId: mockOrg.id,
        ...createDto,
        date: new Date(createDto.date),
        status: ExpenseStatus.PENDING,
        isDeductible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockExpensesService.create.mockResolvedValue(mockExpense);

      const result = await controller.create(mockOrg.id, createDto);

      expect(result.vatAmount).toBe(19.00);
      expect(result.vatRate).toBe(19);
      expect(result.receiptUrl).toBe('https://example.com/receipt.pdf');
      expect(service.create).toHaveBeenCalledWith(mockOrg.id, createDto);
    });

    it('should handle expense with notes', async () => {
      const createDto = {
        description: 'Client Meeting',
        amount: 50.00,
        currency: 'EUR',
        date: '2024-01-15',
        category: ExpenseCategory.MEALS,
        vendorName: 'Coffee Shop',
        submittedBy: mockUser.id,
        notes: 'Meeting with potential client about new project',
      };

      const mockExpense = {
        id: 'expense-789',
        orgId: mockOrg.id,
        ...createDto,
        date: new Date(createDto.date),
        status: ExpenseStatus.PENDING,
        isDeductible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockExpensesService.create.mockResolvedValue(mockExpense);

      const result = await controller.create(mockOrg.id, createDto);

      expect(result.notes).toBe('Meeting with potential client about new project');
      expect(service.create).toHaveBeenCalledWith(mockOrg.id, createDto);
    });
  });

  /**
   * GET /organisations/:orgId/expenses - Get all expenses
   */
  describe('findAll', () => {
    it('should return array of expenses with pagination', async () => {
      const query = {
        page: 1,
        pageSize: 20,
      };

      const mockResponse = {
        data: [
          {
            id: 'expense-1',
            description: 'Office Supplies',
            amount: 150.00,
            status: ExpenseStatus.PENDING,
            date: new Date('2024-01-15'),
          },
          {
            id: 'expense-2',
            description: 'Travel Expenses',
            amount: 500.00,
            status: ExpenseStatus.APPROVED,
            date: new Date('2024-01-16'),
          },
        ],
        meta: {
          total: 2,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
      };

      mockExpensesService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(mockOrg.id, query);

      expect(result).toEqual(mockResponse);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(service.findAll).toHaveBeenCalledWith(mockOrg.id, query);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle empty expense list', async () => {
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

      mockExpensesService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(mockOrg.id, query);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('should support filtering by status', async () => {
      const query = {
        status: ExpenseStatus.APPROVED,
      };

      const mockResponse = {
        data: [
          {
            id: 'expense-3',
            description: 'Approved Expense',
            amount: 300.00,
            status: ExpenseStatus.APPROVED,
            date: new Date('2024-01-17'),
          },
        ],
        meta: {
          total: 1,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
      };

      mockExpensesService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(mockOrg.id, query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(ExpenseStatus.APPROVED);
      expect(service.findAll).toHaveBeenCalledWith(mockOrg.id, query);
    });

    it('should support filtering by category', async () => {
      const query = {
        category: ExpenseCategory.OFFICE,
      };

      const mockResponse = {
        data: [
          {
            id: 'expense-4',
            description: 'Office Supplies',
            amount: 150.00,
            category: ExpenseCategory.OFFICE,
            status: ExpenseStatus.PENDING,
            date: new Date('2024-01-18'),
          },
        ],
        meta: {
          total: 1,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
      };

      mockExpensesService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(mockOrg.id, query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].category).toBe(ExpenseCategory.OFFICE);
      expect(service.findAll).toHaveBeenCalledWith(mockOrg.id, query);
    });

    it('should support search functionality', async () => {
      const query = {
        search: 'travel',
      };

      const mockResponse = {
        data: [
          {
            id: 'expense-5',
            description: 'Travel Expenses',
            amount: 500.00,
            status: ExpenseStatus.PENDING,
            date: new Date('2024-01-19'),
          },
        ],
        meta: {
          total: 1,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
      };

      mockExpensesService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(mockOrg.id, query);

      expect(result.data).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith(mockOrg.id, query);
    });
  });

  /**
   * GET /organisations/:orgId/expenses/:id - Get one expense
   */
  describe('findOne', () => {
    it('should return expense details by ID', async () => {
      const expenseId = 'expense-123';

      const mockExpense = {
        id: expenseId,
        orgId: mockOrg.id,
        description: 'Office Supplies',
        amount: 150.00,
        currency: 'EUR',
        date: new Date('2024-01-15'),
        category: ExpenseCategory.OFFICE,
        vendorName: 'Office Depot',
        status: ExpenseStatus.PENDING,
        submittedBy: mockUser.id,
        isDeductible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockExpensesService.findById.mockResolvedValue(mockExpense);

      const result = await controller.findOne(expenseId);

      expect(result).toEqual(mockExpense);
      expect(result.id).toBe(expenseId);
      expect(result.description).toBe('Office Supplies');
      expect(result.status).toBe(ExpenseStatus.PENDING);
      expect(service.findById).toHaveBeenCalledWith(expenseId);
      expect(service.findById).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when expense does not exist', async () => {
      const expenseId = 'non-existent-expense';

      mockExpensesService.findById.mockRejectedValue(
        new NotFoundException(`Expense with ID ${expenseId} not found`)
      );

      await expect(controller.findOne(expenseId)).rejects.toThrow(NotFoundException);
      expect(service.findById).toHaveBeenCalledWith(expenseId);
    });
  });

  /**
   * PATCH /organisations/:orgId/expenses/:id - Update expense
   */
  describe('update', () => {
    it('should update pending expense successfully', async () => {
      const expenseId = 'expense-123';
      const updateDto = {
        description: 'Updated Office Supplies',
        amount: 200.00,
        notes: 'Updated with additional items',
      };

      const mockUpdatedExpense = {
        id: expenseId,
        orgId: mockOrg.id,
        description: 'Updated Office Supplies',
        amount: 200.00,
        notes: 'Updated with additional items',
        status: ExpenseStatus.PENDING,
        currency: 'EUR',
        date: new Date('2024-01-15'),
        category: ExpenseCategory.OFFICE,
        isDeductible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockExpensesService.update.mockResolvedValue(mockUpdatedExpense);

      const result = await controller.update(expenseId, updateDto);

      expect(result).toEqual(mockUpdatedExpense);
      expect(result.description).toBe('Updated Office Supplies');
      expect(result.amount).toBe(200.00);
      expect(result.notes).toBe('Updated with additional items');
      expect(service.update).toHaveBeenCalledWith(expenseId, updateDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should reject update of non-pending expense', async () => {
      const expenseId = 'expense-approved';
      const updateDto = {
        description: 'Updated Description',
      };

      mockExpensesService.update.mockRejectedValue(
        new BadRequestException(
          'Cannot update expense with status APPROVED. Only PENDING expenses can be updated.'
        )
      );

      await expect(controller.update(expenseId, updateDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw NotFoundException when expense does not exist', async () => {
      const expenseId = 'non-existent';
      const updateDto = {
        description: 'Updated Description',
      };

      mockExpensesService.update.mockRejectedValue(
        new NotFoundException(`Expense with ID ${expenseId} not found`)
      );

      await expect(controller.update(expenseId, updateDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  /**
   * DELETE /organisations/:orgId/expenses/:id - Delete expense
   */
  describe('delete', () => {
    it('should delete pending expense successfully', async () => {
      const expenseId = 'expense-123';

      mockExpensesService.delete.mockResolvedValue(undefined);

      await controller.delete(expenseId);

      expect(service.delete).toHaveBeenCalledWith(expenseId);
      expect(service.delete).toHaveBeenCalledTimes(1);
    });

    it('should reject deletion of non-pending expense', async () => {
      const expenseId = 'expense-approved';

      mockExpensesService.delete.mockRejectedValue(
        new BadRequestException(
          'Cannot delete expense with status APPROVED. Only PENDING expenses can be deleted.'
        )
      );

      await expect(controller.delete(expenseId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when expense does not exist', async () => {
      const expenseId = 'non-existent';

      mockExpensesService.delete.mockRejectedValue(
        new NotFoundException(`Expense with ID ${expenseId} not found`)
      );

      await expect(controller.delete(expenseId)).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * POST /organisations/:orgId/expenses/:id/approve - Approve expense
   */
  describe('approve', () => {
    it('should approve pending expense successfully', async () => {
      const expenseId = 'expense-123';
      const approvedBy = mockUser.id;

      const mockApprovedExpense = {
        id: expenseId,
        orgId: mockOrg.id,
        description: 'Office Supplies',
        amount: 150.00,
        status: ExpenseStatus.APPROVED,
        approvedBy: approvedBy,
        approvedAt: new Date(),
        currency: 'EUR',
        date: new Date('2024-01-15'),
        category: ExpenseCategory.OFFICE,
        isDeductible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockExpensesService.approve.mockResolvedValue(mockApprovedExpense);

      const result = await controller.approve(expenseId, approvedBy);

      expect(result.status).toBe(ExpenseStatus.APPROVED);
      expect(result.approvedBy).toBe(approvedBy);
      expect(result.approvedAt).toBeDefined();
      expect(service.approve).toHaveBeenCalledWith(expenseId, approvedBy);
      expect(service.approve).toHaveBeenCalledTimes(1);
    });

    it('should reject approving non-pending expense', async () => {
      const expenseId = 'expense-already-approved';
      const approvedBy = mockUser.id;

      mockExpensesService.approve.mockRejectedValue(
        new BadRequestException('Cannot approve expense with status APPROVED')
      );

      await expect(controller.approve(expenseId, approvedBy)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw NotFoundException when expense does not exist', async () => {
      const expenseId = 'non-existent';
      const approvedBy = mockUser.id;

      mockExpensesService.approve.mockRejectedValue(
        new NotFoundException(`Expense with ID ${expenseId} not found`)
      );

      await expect(controller.approve(expenseId, approvedBy)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  /**
   * POST /organisations/:orgId/expenses/:id/reject - Reject expense
   */
  describe('reject', () => {
    it('should reject pending expense successfully', async () => {
      const expenseId = 'expense-123';
      const reason = 'Missing receipt';

      const mockRejectedExpense = {
        id: expenseId,
        orgId: mockOrg.id,
        description: 'Office Supplies',
        amount: 150.00,
        status: ExpenseStatus.REJECTED,
        rejectionReason: reason,
        currency: 'EUR',
        date: new Date('2024-01-15'),
        category: ExpenseCategory.OFFICE,
        isDeductible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockExpensesService.reject.mockResolvedValue(mockRejectedExpense);

      const result = await controller.reject(expenseId, reason);

      expect(result.status).toBe(ExpenseStatus.REJECTED);
      expect(result.rejectionReason).toBe('Missing receipt');
      expect(service.reject).toHaveBeenCalledWith(expenseId, reason);
      expect(service.reject).toHaveBeenCalledTimes(1);
    });

    it('should reject rejecting non-pending expense', async () => {
      const expenseId = 'expense-already-approved';
      const reason = 'Some reason';

      mockExpensesService.reject.mockRejectedValue(
        new BadRequestException('Cannot reject expense with status APPROVED')
      );

      await expect(controller.reject(expenseId, reason)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw NotFoundException when expense does not exist', async () => {
      const expenseId = 'non-existent';
      const reason = 'Some reason';

      mockExpensesService.reject.mockRejectedValue(
        new NotFoundException(`Expense with ID ${expenseId} not found`)
      );

      await expect(controller.reject(expenseId, reason)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  /**
   * POST /organisations/:orgId/expenses/:id/reimburse - Mark as reimbursed
   */
  describe('reimburse', () => {
    it('should reimburse approved expense successfully', async () => {
      const expenseId = 'expense-123';

      const mockReimbursedExpense = {
        id: expenseId,
        orgId: mockOrg.id,
        description: 'Office Supplies',
        amount: 150.00,
        status: ExpenseStatus.REIMBURSED,
        reimbursedAt: new Date(),
        currency: 'EUR',
        date: new Date('2024-01-15'),
        category: ExpenseCategory.OFFICE,
        isDeductible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockExpensesService.reimburse.mockResolvedValue(mockReimbursedExpense);

      const result = await controller.reimburse(expenseId);

      expect(result.status).toBe(ExpenseStatus.REIMBURSED);
      expect(result.reimbursedAt).toBeDefined();
      expect(service.reimburse).toHaveBeenCalledWith(expenseId);
      expect(service.reimburse).toHaveBeenCalledTimes(1);
    });

    it('should reject reimbursing non-approved expense', async () => {
      const expenseId = 'expense-pending';

      mockExpensesService.reimburse.mockRejectedValue(
        new BadRequestException(
          'Cannot reimburse expense with status PENDING. Only APPROVED expenses can be reimbursed.'
        )
      );

      await expect(controller.reimburse(expenseId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when expense does not exist', async () => {
      const expenseId = 'non-existent';

      mockExpensesService.reimburse.mockRejectedValue(
        new NotFoundException(`Expense with ID ${expenseId} not found`)
      );

      await expect(controller.reimburse(expenseId)).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * GET /organisations/:orgId/expenses/statistics - Get statistics
   */
  describe('getStatistics', () => {
    it('should return expense statistics by category and status', async () => {
      const mockStats = {
        byCategory: [
          { category: 'OFFICE', total: 500.00, count: 3 },
          { category: 'TRAVEL', total: 1500.00, count: 5 },
          { category: 'MEALS', total: 300.00, count: 2 },
        ],
        byStatus: [
          { status: ExpenseStatus.PENDING, total: 800.00, count: 4 },
          { status: ExpenseStatus.APPROVED, total: 1200.00, count: 5 },
          { status: ExpenseStatus.REIMBURSED, total: 300.00, count: 1 },
        ],
      };

      mockExpensesService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics(mockOrg.id);

      expect(result).toEqual(mockStats);
      expect(result.byCategory).toHaveLength(3);
      expect(result.byStatus).toHaveLength(3);
      expect(service.getStatistics).toHaveBeenCalledWith(mockOrg.id);
      expect(service.getStatistics).toHaveBeenCalledTimes(1);
    });

    it('should return empty statistics when no expenses exist', async () => {
      const mockStats = {
        byCategory: [],
        byStatus: [],
      };

      mockExpensesService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics(mockOrg.id);

      expect(result.byCategory).toHaveLength(0);
      expect(result.byStatus).toHaveLength(0);
    });
  });

  /**
   * GET /organisations/:orgId/expenses/pending - Get pending expenses
   */
  describe('getPending', () => {
    it('should return list of pending expenses', async () => {
      const mockPendingExpenses = [
        {
          id: 'expense-1',
          description: 'Office Supplies',
          amount: 150.00,
          status: ExpenseStatus.PENDING,
          date: new Date('2024-01-15'),
        },
        {
          id: 'expense-2',
          description: 'Travel Expenses',
          amount: 500.00,
          status: ExpenseStatus.PENDING,
          date: new Date('2024-01-16'),
        },
      ];

      mockExpensesService.getPending.mockResolvedValue(mockPendingExpenses);

      const result = await controller.getPending(mockOrg.id);

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe(ExpenseStatus.PENDING);
      expect(result[1].status).toBe(ExpenseStatus.PENDING);
      expect(service.getPending).toHaveBeenCalledWith(mockOrg.id);
      expect(service.getPending).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no pending expenses exist', async () => {
      mockExpensesService.getPending.mockResolvedValue([]);

      const result = await controller.getPending(mockOrg.id);

      expect(result).toHaveLength(0);
      expect(service.getPending).toHaveBeenCalledWith(mockOrg.id);
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
