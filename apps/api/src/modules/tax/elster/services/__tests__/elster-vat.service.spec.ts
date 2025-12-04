import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ElsterVatService } from '../elster-vat.service';
import { ElsterCertificateService } from '../elster-certificate.service';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  UStVAData,
  ElsterFilingStatus,
  VATFilingPeriod,
  ElsterVATError,
  ElsterVATErrorCode,
} from '../../types/elster-vat.types';

describe('ElsterVatService', () => {
  let service: ElsterVatService;
  let prisma: jest.Mocked<PrismaService>;
  let http: jest.Mocked<HttpService>;
  let certificateService: jest.Mocked<ElsterCertificateService>;
  let config: jest.Mocked<ConfigService>;

  const mockOrgId = 'org-123';
  const mockCertId = 'cert-456';

  const mockUStVAData: UStVAData = {
    period: {
      year: 2024,
      month: 1,
    },
    taxNumber: '123/456/78901',
    vatId: 'DE123456789',
    domesticRevenue19: 100000, // €1,000.00 in cents
    domesticRevenue7: 50000, // €500.00 in cents
    taxFreeRevenue: 0,
    euDeliveries: 0,
    euAcquisitions19: 0,
    euAcquisitions7: 0,
    reverseChargeRevenue: 0,
    inputTax: 10000, // €100.00 in cents
    importVat: 0,
    euAcquisitionsInputTax: 0,
  };

  const mockCertificate = {
    id: mockCertId,
    organisationId: mockOrgId,
    name: 'Test Certificate',
    validFrom: new Date('2024-01-01'),
    validTo: new Date('2025-12-31'),
    isActive: true,
    daysUntilExpiry: 365,
    isExpired: false,
    isExpiringSoon: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElsterVatService,
        {
          provide: PrismaService,
          useValue: {
            elsterFiling: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
            invoice: {
              findMany: jest.fn(),
            },
            expense: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                TIGERVAT_BASE_URL: 'https://api.test.tigervat.de',
                TIGERVAT_API_KEY: 'test-key',
                TIGERVAT_TEST_MODE: true,
              };
              return config[key] || defaultValue;
            }),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
        {
          provide: ElsterCertificateService,
          useValue: {
            listCertificates: jest.fn(),
            getCertificate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ElsterVatService>(ElsterVatService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    http = module.get(HttpService) as jest.Mocked<HttpService>;
    certificateService = module.get(
      ElsterCertificateService,
    ) as jest.Mocked<ElsterCertificateService>;
    config = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUStVA', () => {
    it('should validate correct UStVA data', async () => {
      const result = await service.validateUStVA(mockUStVAData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid tax number format', async () => {
      const invalidData = {
        ...mockUStVAData,
        taxNumber: 'invalid',
      };

      const result = await service.validateUStVA(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'taxNumber',
          code: 'INVALID_FORMAT',
        }),
      );
    });

    it('should reject invalid VAT ID format', async () => {
      const invalidData = {
        ...mockUStVAData,
        vatId: 'DE123', // Too short
      };

      const result = await service.validateUStVA(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'vatId',
          code: 'INVALID_FORMAT',
        }),
      );
    });

    it('should reject negative amounts', async () => {
      const invalidData = {
        ...mockUStVAData,
        domesticRevenue19: -1000,
      };

      const result = await service.validateUStVA(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'domesticRevenue19',
          code: 'INVALID_AMOUNT',
        }),
      );
    });

    it('should warn about unusually large amounts', async () => {
      const largeData = {
        ...mockUStVAData,
        vatPayable: 150000000, // €1.5M
      };

      const result = await service.validateUStVA(largeData);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'vatPayable',
          code: 'LARGE_AMOUNT',
        }),
      );
    });

    it('should warn about zero revenue', async () => {
      const zeroData = {
        ...mockUStVAData,
        domesticRevenue19: 0,
        domesticRevenue7: 0,
        taxFreeRevenue: 0,
        euDeliveries: 0,
      };

      const result = await service.validateUStVA(zeroData);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'revenue',
          code: 'NO_REVENUE',
        }),
      );
    });
  });

  describe('submitUStVA', () => {
    beforeEach(() => {
      certificateService.listCertificates.mockResolvedValue([mockCertificate]);
      prisma.elsterFiling.findFirst.mockResolvedValue(null); // No duplicate
    });

    it('should submit UStVA successfully', async () => {
      const mockResponse = {
        data: {
          transferTicket: 'TT-123456',
          status: 'SUBMITTED',
        },
        status: 200,
      };

      http.post.mockReturnValue(of(mockResponse) as any);

      const mockFiling = {
        id: 'filing-123',
        organisationId: mockOrgId,
        type: 'USTVA',
        year: 2024,
        period: 1,
        periodType: 'MONTHLY',
        status: 'SUBMITTED',
        submissionId: 'TT-123456',
        transferTicket: 'TT-123456',
        submittedAt: new Date(),
        data: mockUStVAData,
        response: mockResponse.data,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
      };

      prisma.elsterFiling.create.mockResolvedValue(mockFiling as any);

      const result = await service.submitUStVA(mockOrgId, mockUStVAData, {
        autoCalculate: false,
      });

      expect(result.success).toBe(true);
      expect(result.transferTicket).toBe('TT-123456');
      expect(result.status).toBe(ElsterFilingStatus.SUBMITTED);
      expect(prisma.elsterFiling.create).toHaveBeenCalled();
    });

    it('should handle dry run mode', async () => {
      const result = await service.submitUStVA(mockOrgId, mockUStVAData, {
        dryRun: true,
        autoCalculate: false,
      });

      expect(result.success).toBe(true);
      expect(result.submissionId).toBe('dry-run');
      expect(result.status).toBe(ElsterFilingStatus.DRAFT);
      expect(http.post).not.toHaveBeenCalled();
    });

    it('should throw error if no certificate found', async () => {
      certificateService.listCertificates.mockResolvedValue([]);

      await expect(
        service.submitUStVA(mockOrgId, mockUStVAData, {
          autoCalculate: false,
        }),
      ).rejects.toThrow(ElsterVATError);

      await expect(
        service.submitUStVA(mockOrgId, mockUStVAData, {
          autoCalculate: false,
        }),
      ).rejects.toMatchObject({
        code: ElsterVATErrorCode.CERTIFICATE_NOT_FOUND,
      });
    });

    it('should throw error on duplicate submission', async () => {
      const existingFiling = {
        id: 'existing-123',
        status: 'SUBMITTED',
      };

      prisma.elsterFiling.findFirst.mockResolvedValue(existingFiling as any);

      await expect(
        service.submitUStVA(mockOrgId, mockUStVAData, {
          autoCalculate: false,
        }),
      ).rejects.toThrow(ElsterVATError);

      await expect(
        service.submitUStVA(mockOrgId, mockUStVAData, {
          autoCalculate: false,
        }),
      ).rejects.toMatchObject({
        code: ElsterVATErrorCode.DUPLICATE_SUBMISSION,
      });
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        ...mockUStVAData,
        taxNumber: 'invalid',
      };

      await expect(
        service.submitUStVA(mockOrgId, invalidData, {
          autoCalculate: false,
        }),
      ).rejects.toThrow(ElsterVATError);

      await expect(
        service.submitUStVA(mockOrgId, invalidData, {
          autoCalculate: false,
        }),
      ).rejects.toMatchObject({
        code: ElsterVATErrorCode.VALIDATION_FAILED,
      });
    });
  });

  describe('calculateVATFromInvoices', () => {
    it('should calculate VAT from invoices and expenses', async () => {
      const mockInvoices = [
        {
          id: 'inv-1',
          orgId: mockOrgId,
          subtotal: 1000, // €1,000
          vatRate: 19,
          reverseCharge: false,
          customerVatId: null,
          items: [],
        },
        {
          id: 'inv-2',
          orgId: mockOrgId,
          subtotal: 500, // €500
          vatRate: 7,
          reverseCharge: false,
          customerVatId: null,
          items: [],
        },
      ];

      const mockExpenses = [
        {
          id: 'exp-1',
          orgId: mockOrgId,
          vatAmount: 100, // €100
          isDeductible: true,
        },
      ];

      prisma.invoice.findMany.mockResolvedValue(mockInvoices as any);
      prisma.expense.findMany.mockResolvedValue(mockExpenses as any);

      const result = await service.calculateVATFromInvoices(mockOrgId, {
        year: 2024,
        month: 1,
      });

      expect(result.domesticRevenue19).toBe(100000); // €1,000 in cents
      expect(result.domesticRevenue7).toBe(50000); // €500 in cents
      expect(result.inputTax).toBe(10000); // €100 in cents
      expect(result.outputVat).toBe(22500); // (€1,000 * 0.19) + (€500 * 0.07) = €225
      expect(result.vatPayable).toBe(12500); // €225 - €100 = €125
      expect(result.invoiceCount).toBe(2);
      expect(result.expenseCount).toBe(1);
    });

    it('should handle EU deliveries', async () => {
      const mockInvoices = [
        {
          id: 'inv-1',
          orgId: mockOrgId,
          subtotal: 1000,
          vatRate: 19,
          reverseCharge: false,
          customerVatId: 'FR12345678901', // French VAT ID
          items: [],
        },
      ];

      prisma.invoice.findMany.mockResolvedValue(mockInvoices as any);
      prisma.expense.findMany.mockResolvedValue([]);

      const result = await service.calculateVATFromInvoices(mockOrgId, {
        year: 2024,
        month: 1,
      });

      expect(result.euDeliveries).toBe(100000);
      expect(result.domesticRevenue19).toBe(0);
    });
  });

  describe('createDraft', () => {
    it('should create draft filing', async () => {
      const mockFiling = {
        id: 'draft-123',
        organisationId: mockOrgId,
        type: 'USTVA',
        year: 2024,
        period: 1,
        periodType: 'MONTHLY',
        status: 'DRAFT',
        data: mockUStVAData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
      };

      prisma.elsterFiling.create.mockResolvedValue(mockFiling as any);

      const result = await service.createDraft(mockOrgId, mockUStVAData);

      expect(result.id).toBe('draft-123');
      expect(result.status).toBe(ElsterFilingStatus.DRAFT);
      expect(prisma.elsterFiling.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ElsterFilingStatus.DRAFT,
          }),
        }),
      );
    });
  });

  describe('getFilingHistory', () => {
    it('should retrieve filing history', async () => {
      const mockFilings = [
        {
          id: 'filing-1',
          organisationId: mockOrgId,
          type: 'USTVA',
          year: 2024,
          period: 1,
          periodType: 'MONTHLY',
          status: 'SUBMITTED',
          data: mockUStVAData,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
        },
      ];

      prisma.elsterFiling.findMany.mockResolvedValue(mockFilings as any);

      const result = await service.getFilingHistory(mockOrgId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('filing-1');
    });

    it('should filter by year and status', async () => {
      prisma.elsterFiling.findMany.mockResolvedValue([]);

      await service.getFilingHistory(mockOrgId, {
        year: 2024,
        status: ElsterFilingStatus.SUBMITTED,
      });

      expect(prisma.elsterFiling.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            year: 2024,
            status: ElsterFilingStatus.SUBMITTED,
          }),
        }),
      );
    });
  });

  describe('testConnection', () => {
    it('should return true on successful connection', async () => {
      http.get.mockReturnValue(
        of({
          status: 200,
          data: { status: 'ok' },
        } as any) as any,
      );

      const result = await service.testConnection();

      expect(result).toBe(true);
    });

    it('should return false on connection failure', async () => {
      http.get.mockReturnValue(
        throwError(() => new Error('Connection failed')) as any,
      );

      const result = await service.testConnection();

      expect(result).toBe(false);
    });
  });
});
