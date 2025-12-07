import { Test, TestingModule } from '@nestjs/testing';
import { TaxArchiveService } from './tax-archive.service';
import { PrismaService } from '../../database/prisma.service';

describe('TaxArchiveService', () => {
  let service: TaxArchiveService;
  let prisma: PrismaService;

  const mockPrismaService = {
    taxDocument: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxArchiveService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TaxArchiveService>(TaxArchiveService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('archiveVatReturn', () => {
    it('should archive a VAT return with correct retention period', async () => {
      const vatReturn = {
        organisationId: 'org-123',
        type: 'USTVA',
        year: 2025,
        period: 1,
        periodType: 'MONTHLY',
        data: { box1: 1000, box2: 500 },
        transferTicket: 'ABC123',
        submittedAt: new Date('2025-01-31'),
        submissionId: 'SUB-001',
      };

      const mockDocument = {
        id: 'doc-123',
        organisationId: 'org-123',
        type: 'vat_return',
        year: 2025,
        period: '2025-01',
        title: 'USt-Voranmeldung 2025-01',
        description: 'Monthly VAT return for 2025-1. Type: USTVA',
        fileUrl: '',
        fileSize: expect.any(Number),
        mimeType: 'application/json',
        hash: expect.any(String),
        retentionUntil: new Date('2035-12-31'), // 10 years from end of 2025
        metadata: expect.objectContaining({
          transferTicket: 'ABC123',
          submissionId: 'SUB-001',
        }),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      mockPrismaService.taxDocument.create.mockResolvedValue(mockDocument);

      const result = await service.archiveVatReturn(vatReturn);

      expect(result).toEqual(mockDocument);
      expect(mockPrismaService.taxDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organisationId: 'org-123',
            type: 'vat_return',
            year: 2025,
            period: '2025-01',
          }),
        })
      );
    });
  });

  describe('archiveElsterReceipt', () => {
    it('should archive an ELSTER receipt PDF', async () => {
      const receiptBuffer = Buffer.from('PDF content');
      const mockDocument = {
        id: 'doc-456',
        organisationId: 'org-123',
        type: 'elster_receipt',
        year: 2025,
        period: '2025-01',
        title: 'ELSTER Beleg 2025-01',
        description: 'Official ELSTER receipt for VAT return 2025-01',
        fileUrl: '',
        fileSize: receiptBuffer.length,
        mimeType: 'application/pdf',
        hash: expect.any(String),
        retentionUntil: expect.any(Date),
        metadata: { receiptId: 'REC-123' },
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      mockPrismaService.taxDocument.create.mockResolvedValue(mockDocument);

      const result = await service.archiveElsterReceipt(
        'org-123',
        'REC-123',
        receiptBuffer,
        '2025-01'
      );

      expect(result).toEqual(mockDocument);
      expect(mockPrismaService.taxDocument.create).toHaveBeenCalled();
    });
  });

  describe('searchDocuments', () => {
    it('should search documents with filters', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          organisationId: 'org-123',
          type: 'vat_return',
          year: 2025,
          title: 'VAT Return 2025-01',
        },
        {
          id: 'doc-2',
          organisationId: 'org-123',
          type: 'vat_return',
          year: 2025,
          title: 'VAT Return 2025-02',
        },
      ];

      mockPrismaService.taxDocument.findMany.mockResolvedValue(mockDocuments);

      const result = await service.searchDocuments('org-123', {
        year: 2025,
        type: 'vat_return',
      });

      expect(result).toEqual(mockDocuments);
      expect(mockPrismaService.taxDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organisationId: 'org-123',
            year: 2025,
            type: 'vat_return',
          }),
        })
      );
    });

    it('should support full-text search', async () => {
      mockPrismaService.taxDocument.findMany.mockResolvedValue([]);

      await service.searchDocuments('org-123', {
        search: 'Januar',
      });

      expect(mockPrismaService.taxDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                title: expect.objectContaining({ contains: 'Januar' }),
              }),
              expect.objectContaining({
                description: expect.objectContaining({ contains: 'Januar' }),
              }),
            ]),
          }),
        })
      );
    });
  });

  describe('getYearDocuments', () => {
    it('should get all documents for a specific year', async () => {
      const mockDocuments = [
        { id: 'doc-1', year: 2025 },
        { id: 'doc-2', year: 2025 },
      ];

      mockPrismaService.taxDocument.findMany.mockResolvedValue(mockDocuments);

      const result = await service.getYearDocuments('org-123', 2025);

      expect(result).toEqual(mockDocuments);
      expect(mockPrismaService.taxDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organisationId: 'org-123',
            year: 2025,
          },
        })
      );
    });
  });

  describe('verifyIntegrity', () => {
    it('should verify document integrity when data is in metadata', async () => {
      const data = { box1: 1000 };
      const dataString = JSON.stringify(data);
      const hash = require('crypto')
        .createHash('sha256')
        .update(Buffer.from(dataString, 'utf-8'))
        .digest('hex');

      const mockDocument = {
        id: 'doc-123',
        hash,
        metadata: {
          archivedData: data,
        },
      };

      mockPrismaService.taxDocument.findUnique.mockResolvedValue(mockDocument);

      const result = await service.verifyIntegrity('doc-123');

      expect(result).toBe(true);
    });

    it('should return false if hash does not match', async () => {
      const mockDocument = {
        id: 'doc-123',
        hash: 'wrong-hash',
        metadata: {
          archivedData: { box1: 1000 },
        },
      };

      mockPrismaService.taxDocument.findUnique.mockResolvedValue(mockDocument);

      const result = await service.verifyIntegrity('doc-123');

      expect(result).toBe(false);
    });

    it('should return false if document not found', async () => {
      mockPrismaService.taxDocument.findUnique.mockResolvedValue(null);

      const result = await service.verifyIntegrity('doc-123');

      expect(result).toBe(false);
    });
  });

  describe('getExpiringDocuments', () => {
    it('should get documents expiring within specified days', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          retentionUntil: new Date('2025-03-01'),
        },
      ];

      mockPrismaService.taxDocument.findMany.mockResolvedValue(mockDocuments);

      const result = await service.getExpiringDocuments('org-123', 90);

      expect(result).toEqual(mockDocuments);
      expect(mockPrismaService.taxDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organisationId: 'org-123',
            retentionUntil: { lte: expect.any(Date) },
          }),
        })
      );
    });
  });

  describe('deleteExpiredDocuments', () => {
    it('should delete documents with expired retention', async () => {
      mockPrismaService.taxDocument.deleteMany.mockResolvedValue({ count: 5 });

      const result = await service.deleteExpiredDocuments('org-123');

      expect(result).toBe(5);
      expect(mockPrismaService.taxDocument.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organisationId: 'org-123',
            retentionUntil: { lt: expect.any(Date) },
          }),
        })
      );
    });

    it('should delete expired documents for all orgs if no orgId provided', async () => {
      mockPrismaService.taxDocument.deleteMany.mockResolvedValue({ count: 10 });

      const result = await service.deleteExpiredDocuments();

      expect(result).toBe(10);
      expect(mockPrismaService.taxDocument.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            retentionUntil: { lt: expect.any(Date) },
          }),
        })
      );
    });
  });

  describe('getArchiveStats', () => {
    it('should calculate archive statistics', async () => {
      const mockDocuments = [
        {
          type: 'vat_return',
          year: 2024,
          fileSize: 1024,
          createdAt: new Date('2024-01-01'),
        },
        {
          type: 'vat_return',
          year: 2024,
          fileSize: 2048,
          createdAt: new Date('2024-02-01'),
        },
        {
          type: 'elster_receipt',
          year: 2025,
          fileSize: 4096,
          createdAt: new Date('2025-01-01'),
        },
      ];

      mockPrismaService.taxDocument.findMany.mockResolvedValue(mockDocuments);

      const result = await service.getArchiveStats('org-123');

      expect(result).toEqual({
        totalDocuments: 3,
        totalSize: 7168,
        documentsByType: {
          vat_return: 2,
          elster_receipt: 1,
        },
        documentsByYear: {
          2024: 2,
          2025: 1,
        },
        oldestDocument: new Date('2024-01-01'),
        newestDocument: new Date('2025-01-01'),
      });
    });
  });
});
