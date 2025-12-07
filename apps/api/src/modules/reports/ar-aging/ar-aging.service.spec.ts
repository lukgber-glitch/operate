/**
 * AR Aging Service Tests
 * Unit tests for AR aging report generation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ArAgingService } from './ar-aging.service';
import { PrismaService } from '../../database/prisma.service';

describe('ArAgingService', () => {
  let service: ArAgingService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    invoice: {
      findMany: jest.fn(),
    },
    organisation: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArAgingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ArAgingService>(ArAgingService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateReport', () => {
    it('should generate AR aging report with correct buckets', async () => {
      const mockInvoices = [
        {
          id: 'inv1',
          number: 'INV-001',
          customerId: 'cust1',
          customerName: 'Customer A',
          status: 'SENT',
          issueDate: new Date('2024-11-01'),
          dueDate: new Date('2024-11-15'), // 22 days overdue
          totalAmount: { toNumber: () => 1000 },
          customer: { name: 'Customer A' },
        },
        {
          id: 'inv2',
          number: 'INV-002',
          customerId: 'cust2',
          customerName: 'Customer B',
          status: 'OVERDUE',
          issueDate: new Date('2024-10-01'),
          dueDate: new Date('2024-10-15'), // 53 days overdue
          totalAmount: { toNumber: () => 2000 },
          customer: { name: 'Customer B' },
        },
      ];

      mockPrismaService.invoice.findMany.mockResolvedValue(mockInvoices);

      const report = await service.generateReport('org123', {
        asOfDate: new Date('2024-12-07'),
      });

      expect(report.organizationId).toBe('org123');
      expect(report.buckets).toHaveLength(5);
      expect(report.summary.invoiceCount).toBe(2);
      expect(report.summary.totalReceivables).toBe(3000);
    });

    it('should categorize invoices into correct aging buckets', async () => {
      const mockInvoices = [
        {
          id: 'inv1',
          number: 'INV-001',
          customerId: 'cust1',
          customerName: 'Customer A',
          status: 'SENT',
          issueDate: new Date('2024-12-01'),
          dueDate: new Date('2024-12-10'), // Current (not due yet)
          totalAmount: { toNumber: () => 1000 },
          customer: { name: 'Customer A' },
        },
        {
          id: 'inv2',
          number: 'INV-002',
          customerId: 'cust2',
          customerName: 'Customer B',
          status: 'OVERDUE',
          issueDate: new Date('2024-10-01'),
          dueDate: new Date('2024-11-22'), // 15 days overdue (1-30 bucket)
          totalAmount: { toNumber: () => 2000 },
          customer: { name: 'Customer B' },
        },
      ];

      mockPrismaService.invoice.findMany.mockResolvedValue(mockInvoices);

      const report = await service.generateReport('org123', {
        asOfDate: new Date('2024-12-07'),
      });

      // Check Current bucket
      const currentBucket = report.buckets.find(b => b.label === 'Current');
      expect(currentBucket?.count).toBe(1);
      expect(currentBucket?.total).toBe(1000);

      // Check 1-30 Days bucket
      const overdue30Bucket = report.buckets.find(b => b.label === '1-30 Days');
      expect(overdue30Bucket?.count).toBe(1);
      expect(overdue30Bucket?.total).toBe(2000);
    });

    it('should aggregate by customer correctly', async () => {
      const mockInvoices = [
        {
          id: 'inv1',
          number: 'INV-001',
          customerId: 'cust1',
          customerName: 'Customer A',
          status: 'SENT',
          issueDate: new Date('2024-12-01'),
          dueDate: new Date('2024-12-10'),
          totalAmount: { toNumber: () => 1000 },
          customer: { name: 'Customer A' },
        },
        {
          id: 'inv2',
          number: 'INV-002',
          customerId: 'cust1',
          customerName: 'Customer A',
          status: 'OVERDUE',
          issueDate: new Date('2024-10-01'),
          dueDate: new Date('2024-11-22'),
          totalAmount: { toNumber: () => 2000 },
          customer: { name: 'Customer A' },
        },
      ];

      mockPrismaService.invoice.findMany.mockResolvedValue(mockInvoices);

      const report = await service.generateReport('org123', {
        asOfDate: new Date('2024-12-07'),
      });

      expect(report.byCustomer).toHaveLength(1);
      expect(report.byCustomer[0].customerId).toBe('cust1');
      expect(report.byCustomer[0].total).toBe(3000);
    });
  });

  describe('exportToCsv', () => {
    it('should generate CSV with correct headers', async () => {
      const mockInvoices = [
        {
          id: 'inv1',
          number: 'INV-001',
          customerId: 'cust1',
          customerName: 'Customer A',
          status: 'SENT',
          issueDate: new Date('2024-11-01'),
          dueDate: new Date('2024-11-15'),
          totalAmount: { toNumber: () => 1000 },
          customer: { name: 'Customer A' },
        },
      ];

      mockPrismaService.invoice.findMany.mockResolvedValue(mockInvoices);

      const csv = await service.exportToCsv('org123');

      expect(csv).toContain('Customer,Invoice Number,Issue Date,Due Date');
      expect(csv).toContain('Customer A');
      expect(csv).toContain('INV-001');
    });
  });
});
