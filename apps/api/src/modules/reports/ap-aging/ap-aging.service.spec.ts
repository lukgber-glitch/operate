/**
 * AP Aging Service Tests
 * Unit tests for AP aging report generation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ApAgingService } from './ap-aging.service';
import { PrismaService } from '../../database/prisma.service';

describe('ApAgingService', () => {
  let service: ApAgingService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    bill: {
      findMany: jest.fn(),
    },
    organisation: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApAgingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ApAgingService>(ApAgingService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateReport', () => {
    it('should generate AP aging report with correct buckets', async () => {
      const mockBills = [
        {
          id: 'bill1',
          billNumber: 'BILL-001',
          vendorId: 'vendor1',
          vendorName: 'Vendor A',
          status: 'PENDING',
          issueDate: new Date('2024-11-01'),
          dueDate: new Date('2024-11-15'), // 22 days overdue
          totalAmount: { toNumber: () => 1500 },
          paidAmount: { toNumber: () => 0 },
          vendor: { name: 'Vendor A' },
        },
        {
          id: 'bill2',
          billNumber: 'BILL-002',
          vendorId: 'vendor2',
          vendorName: 'Vendor B',
          status: 'OVERDUE',
          issueDate: new Date('2024-10-01'),
          dueDate: new Date('2024-10-15'), // 53 days overdue
          totalAmount: { toNumber: () => 2500 },
          paidAmount: { toNumber: () => 0 },
          vendor: { name: 'Vendor B' },
        },
      ];

      mockPrismaService.bill.findMany.mockResolvedValue(mockBills);

      const report = await service.generateReport('org123', {
        asOfDate: new Date('2024-12-07'),
      });

      expect(report.organizationId).toBe('org123');
      expect(report.buckets).toHaveLength(5);
      expect(report.summary.billCount).toBe(2);
      expect(report.summary.totalPayables).toBe(4000);
    });

    it('should categorize bills into correct aging buckets', async () => {
      const mockBills = [
        {
          id: 'bill1',
          billNumber: 'BILL-001',
          vendorId: 'vendor1',
          vendorName: 'Vendor A',
          status: 'PENDING',
          issueDate: new Date('2024-12-01'),
          dueDate: new Date('2024-12-10'), // Current (not due yet)
          totalAmount: { toNumber: () => 1500 },
          paidAmount: { toNumber: () => 0 },
          vendor: { name: 'Vendor A' },
        },
        {
          id: 'bill2',
          billNumber: 'BILL-002',
          vendorId: 'vendor2',
          vendorName: 'Vendor B',
          status: 'OVERDUE',
          issueDate: new Date('2024-10-01'),
          dueDate: new Date('2024-11-22'), // 15 days overdue (1-30 bucket)
          totalAmount: { toNumber: () => 2500 },
          paidAmount: { toNumber: () => 0 },
          vendor: { name: 'Vendor B' },
        },
      ];

      mockPrismaService.bill.findMany.mockResolvedValue(mockBills);

      const report = await service.generateReport('org123', {
        asOfDate: new Date('2024-12-07'),
      });

      // Check Current bucket
      const currentBucket = report.buckets.find(b => b.label === 'Current');
      expect(currentBucket?.count).toBe(1);
      expect(currentBucket?.total).toBe(1500);

      // Check 1-30 Days bucket
      const overdue30Bucket = report.buckets.find(b => b.label === '1-30 Days');
      expect(overdue30Bucket?.count).toBe(1);
      expect(overdue30Bucket?.total).toBe(2500);
    });

    it('should aggregate by vendor correctly', async () => {
      const mockBills = [
        {
          id: 'bill1',
          billNumber: 'BILL-001',
          vendorId: 'vendor1',
          vendorName: 'Vendor A',
          status: 'PENDING',
          issueDate: new Date('2024-12-01'),
          dueDate: new Date('2024-12-10'),
          totalAmount: { toNumber: () => 1500 },
          paidAmount: { toNumber: () => 0 },
          vendor: { name: 'Vendor A' },
        },
        {
          id: 'bill2',
          billNumber: 'BILL-002',
          vendorId: 'vendor1',
          vendorName: 'Vendor A',
          status: 'APPROVED',
          issueDate: new Date('2024-10-01'),
          dueDate: new Date('2024-11-22'),
          totalAmount: { toNumber: () => 2500 },
          paidAmount: { toNumber: () => 0 },
          vendor: { name: 'Vendor A' },
        },
      ];

      mockPrismaService.bill.findMany.mockResolvedValue(mockBills);

      const report = await service.generateReport('org123', {
        asOfDate: new Date('2024-12-07'),
      });

      expect(report.byVendor).toHaveLength(1);
      expect(report.byVendor[0].vendorId).toBe('vendor1');
      expect(report.byVendor[0].total).toBe(4000);
    });

    it('should handle partially paid bills correctly', async () => {
      const mockBills = [
        {
          id: 'bill1',
          billNumber: 'BILL-001',
          vendorId: 'vendor1',
          vendorName: 'Vendor A',
          status: 'PENDING',
          issueDate: new Date('2024-11-01'),
          dueDate: new Date('2024-11-15'),
          totalAmount: { toNumber: () => 1000 },
          paidAmount: { toNumber: () => 300 }, // Partially paid
          vendor: { name: 'Vendor A' },
        },
      ];

      mockPrismaService.bill.findMany.mockResolvedValue(mockBills);

      const report = await service.generateReport('org123', {
        asOfDate: new Date('2024-12-07'),
      });

      expect(report.summary.totalPayables).toBe(700); // 1000 - 300
    });
  });

  describe('exportToCsv', () => {
    it('should generate CSV with correct headers', async () => {
      const mockBills = [
        {
          id: 'bill1',
          billNumber: 'BILL-001',
          vendorId: 'vendor1',
          vendorName: 'Vendor A',
          status: 'PENDING',
          issueDate: new Date('2024-11-01'),
          dueDate: new Date('2024-11-15'),
          totalAmount: { toNumber: () => 1500 },
          paidAmount: { toNumber: () => 0 },
          vendor: { name: 'Vendor A' },
        },
      ];

      mockPrismaService.bill.findMany.mockResolvedValue(mockBills);

      const csv = await service.exportToCsv('org123');

      expect(csv).toContain('Vendor,Bill Number,Issue Date,Due Date');
      expect(csv).toContain('Vendor A');
      expect(csv).toContain('BILL-001');
    });
  });
});
