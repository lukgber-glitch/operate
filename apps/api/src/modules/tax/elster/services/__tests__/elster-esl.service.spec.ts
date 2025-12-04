import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ElsterEslService } from '../elster-esl.service';
import { ElsterCertificateService } from '../elster-certificate.service';
import { PrismaService } from '../../../../../database/prisma.service';
import {
  ZMData,
  ZMTransactionType,
  ZMFilingStatus,
  ElsterESLErrorCode,
} from '../../types/elster-esl.types';

describe('ElsterEslService', () => {
  let service: ElsterEslService;
  let prisma: jest.Mocked<PrismaService>;
  let http: jest.Mocked<HttpService>;
  let certificateService: jest.Mocked<ElsterCertificateService>;

  const mockOrganisationId = 'org-123';
  const mockCertificateId = 'cert-456';

  const mockZMData: ZMData = {
    period: {
      year: 2024,
      month: 1,
    },
    taxNumber: '123/456/78901',
    vatId: 'DE123456789',
    transactions: [
      {
        customerVatId: 'FR12345678901',
        countryCode: 'FR',
        transactionType: ZMTransactionType.GOODS,
        amount: 100000, // €1,000
      },
      {
        customerVatId: 'NL123456789B01',
        countryCode: 'NL',
        transactionType: ZMTransactionType.SERVICES,
        amount: 50000, // €500
      },
    ],
  };

  beforeEach(async () => {
    const mockPrisma = {
      elsterFiling: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      invoice: {
        findMany: jest.fn(),
      },
    };

    const mockHttp = {
      get: jest.fn(),
      post: jest.fn(),
    };

    const mockCertService = {
      listCertificates: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElsterEslService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: HttpService,
          useValue: mockHttp,
        },
        {
          provide: ElsterCertificateService,
          useValue: mockCertService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                TIGERVAT_BASE_URL: 'https://api.tigervat.de/v1',
                TIGERVAT_API_KEY: 'test-api-key',
                TIGERVAT_TEST_MODE: true,
                VIES_BASE_URL: 'https://ec.europa.eu/taxation_customs/vies/rest-api',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ElsterEslService>(ElsterEslService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    http = module.get(HttpService) as jest.Mocked<HttpService>;
    certificateService = module.get(
      ElsterCertificateService,
    ) as jest.Mocked<ElsterCertificateService>;
  });

  describe('validateZM', () => {
    it('should validate correct ZM data', async () => {
      const result = await service.validateZM(mockZMData, true);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid German VAT ID', async () => {
      const invalidData = {
        ...mockZMData,
        vatId: 'FR123456789', // French VAT ID
      };

      const result = await service.validateZM(invalidData, true);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'vatId',
          code: 'INVALID_FORMAT',
        }),
      );
    });

    it('should reject missing tax number', async () => {
      const invalidData = {
        ...mockZMData,
        taxNumber: '',
      };

      const result = await service.validateZM(invalidData, true);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'taxNumber',
          code: 'REQUIRED',
        }),
      );
    });

    it('should reject invalid period', async () => {
      const invalidData = {
        ...mockZMData,
        period: {
          year: 2024,
          month: 13, // Invalid month
        },
      };

      const result = await service.validateZM(invalidData, true);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'period.month',
          code: 'INVALID_MONTH',
        }),
      );
    });

    it('should reject German customer VAT ID', async () => {
      const invalidData = {
        ...mockZMData,
        transactions: [
          {
            customerVatId: 'DE987654321',
            countryCode: 'DE',
            transactionType: ZMTransactionType.GOODS,
            amount: 100000,
          },
        ],
      };

      const result = await service.validateZM(invalidData, true);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'transactions[0].customerVatId',
          code: 'INVALID_VAT_ID',
        }),
      );
    });

    it('should reject non-EU country code', async () => {
      const invalidData = {
        ...mockZMData,
        transactions: [
          {
            customerVatId: 'US123456789',
            countryCode: 'US', // Not in EU
            transactionType: ZMTransactionType.GOODS,
            amount: 100000,
          },
        ],
      };

      const result = await service.validateZM(invalidData, true);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'transactions[0].countryCode',
          code: 'INVALID_COUNTRY',
        }),
      );
    });

    it('should warn on zero amount', async () => {
      const dataWithZero = {
        ...mockZMData,
        transactions: [
          {
            customerVatId: 'FR12345678901',
            countryCode: 'FR',
            transactionType: ZMTransactionType.GOODS,
            amount: 0,
          },
        ],
      };

      const result = await service.validateZM(dataWithZero, true);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'transactions[0].amount',
          code: 'ZERO_AMOUNT',
        }),
      );
    });

    it('should accept nil return', async () => {
      const nilReturn = {
        ...mockZMData,
        transactions: [],
        isNilReturn: true,
      };

      const result = await service.validateZM(nilReturn, true);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'NIL_RETURN',
        }),
      );
    });
  });

  describe('validateEuVatId', () => {
    it('should validate VAT ID via VIES', async () => {
      http.get.mockReturnValue(
        of({
          data: {
            valid: true,
            countryCode: 'FR',
            vatNumber: '12345678901',
            requestDate: new Date(),
            name: 'Test Company SAS',
            address: '123 Rue de Paris, 75001 Paris',
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const result = await service.validateEuVatId('FR12345678901');

      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('FR');
      expect(result.name).toBe('Test Company SAS');
      expect(http.get).toHaveBeenCalledWith(
        'https://ec.europa.eu/taxation_customs/vies/rest-api/ms/FR/vat/12345678901',
        expect.any(Object),
      );
    });

    it('should handle VIES validation failure', async () => {
      http.get.mockReturnValue(
        of({
          data: {
            valid: false,
            countryCode: 'FR',
            vatNumber: '99999999999',
            requestDate: new Date(),
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const result = await service.validateEuVatId('FR99999999999');

      expect(result.isValid).toBe(false);
      expect(result.viesAvailable).toBe(true);
    });

    it('should handle VIES service unavailable', async () => {
      http.get.mockReturnValue(
        throwError(() => new Error('Service unavailable')),
      );

      const result = await service.validateEuVatId('FR12345678901');

      expect(result.isValid).toBe(false);
      expect(result.viesAvailable).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('submitZM', () => {
    beforeEach(() => {
      certificateService.listCertificates.mockResolvedValue([
        {
          id: mockCertificateId,
          organisationId: mockOrganisationId,
          status: 'ACTIVE',
        } as any,
      ]);

      prisma.elsterFiling.findFirst.mockResolvedValue(null);
    });

    it('should submit ZM successfully', async () => {
      http.post.mockReturnValue(
        of({
          data: {
            transferTicket: 'TT-123456',
            status: 'SUBMITTED',
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      prisma.elsterFiling.create.mockResolvedValue({
        id: 'filing-123',
        organisationId: mockOrganisationId,
        type: 'ZM',
        year: 2024,
        period: 1,
        periodType: 'MONTHLY',
        status: 'SUBMITTED',
        transferTicket: 'TT-123456',
        submittedAt: new Date(),
        data: mockZMData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
      } as any);

      const result = await service.submitZM(
        mockOrganisationId,
        mockZMData,
        { autoCalculate: false },
      );

      expect(result.success).toBe(true);
      expect(result.transferTicket).toBe('TT-123456');
      expect(result.status).toBe(ZMFilingStatus.SUBMITTED);
      expect(http.post).toHaveBeenCalledWith(
        'https://api.tigervat.de/v1/zm/submit',
        expect.objectContaining({
          organisationId: mockOrganisationId,
          certificateId: mockCertificateId,
          data: mockZMData,
          testMode: true,
        }),
        expect.any(Object),
      );
    });

    it('should handle dry run', async () => {
      const result = await service.submitZM(
        mockOrganisationId,
        mockZMData,
        { dryRun: true, autoCalculate: false },
      );

      expect(result.success).toBe(true);
      expect(result.submissionId).toBe('dry-run');
      expect(result.status).toBe(ZMFilingStatus.DRAFT);
      expect(http.post).not.toHaveBeenCalled();
    });

    it('should reject duplicate submission', async () => {
      prisma.elsterFiling.findFirst.mockResolvedValue({
        id: 'existing-filing',
        status: 'SUBMITTED',
      } as any);

      await expect(
        service.submitZM(mockOrganisationId, mockZMData, { autoCalculate: false }),
      ).rejects.toThrow(ElsterESLErrorCode.DUPLICATE_SUBMISSION);
    });

    it('should reject when no certificate found', async () => {
      certificateService.listCertificates.mockResolvedValue([]);

      await expect(
        service.submitZM(mockOrganisationId, mockZMData, { autoCalculate: false }),
      ).rejects.toThrow(ElsterESLErrorCode.CERTIFICATE_NOT_FOUND);
    });
  });

  describe('calculateFromInvoices', () => {
    it('should calculate ZM from invoices', async () => {
      prisma.invoice.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          orgId: mockOrganisationId,
          customerVatId: 'FR12345678901',
          subtotal: 1000.0,
          issueDate: new Date('2024-01-15'),
          status: 'PAID',
          items: [
            {
              description: 'Product A',
              type: 'PRODUCT',
            },
          ],
        },
        {
          id: 'inv-2',
          orgId: mockOrganisationId,
          customerVatId: 'NL123456789B01',
          subtotal: 500.0,
          issueDate: new Date('2024-01-20'),
          status: 'SENT',
          items: [
            {
              description: 'Consulting services',
              type: 'SERVICE',
            },
          ],
        },
      ] as any);

      const result = await service.calculateFromInvoices(mockOrganisationId, {
        year: 2024,
        month: 1,
      });

      expect(result.transactions).toHaveLength(2);
      expect(result.totalAmount).toBe(150000); // €1,500 in cents
      expect(result.customerCount).toBe(2);
      expect(result.invoiceCount).toBe(2);
      expect(result.byCountry['FR']).toBe(100000);
      expect(result.byCountry['NL']).toBe(50000);
      expect(result.byType[ZMTransactionType.GOODS]).toBe(100000);
      expect(result.byType[ZMTransactionType.SERVICES]).toBe(50000);
    });

    it('should skip German VAT IDs', async () => {
      prisma.invoice.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          orgId: mockOrganisationId,
          customerVatId: 'DE987654321', // German VAT ID
          subtotal: 1000.0,
          issueDate: new Date('2024-01-15'),
          status: 'PAID',
          items: [],
        },
      ] as any);

      const result = await service.calculateFromInvoices(mockOrganisationId, {
        year: 2024,
        month: 1,
      });

      expect(result.transactions).toHaveLength(0);
      expect(result.totalAmount).toBe(0);
    });

    it('should aggregate transactions by customer and type', async () => {
      prisma.invoice.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          customerVatId: 'FR12345678901',
          subtotal: 1000.0,
          items: [{ type: 'PRODUCT' }],
          issueDate: new Date('2024-01-10'),
          status: 'PAID',
        },
        {
          id: 'inv-2',
          customerVatId: 'FR12345678901',
          subtotal: 500.0,
          items: [{ type: 'PRODUCT' }],
          issueDate: new Date('2024-01-20'),
          status: 'PAID',
        },
      ] as any);

      const result = await service.calculateFromInvoices(mockOrganisationId, {
        year: 2024,
        month: 1,
      });

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].amount).toBe(150000); // €1,500 aggregated
      expect(result.customerCount).toBe(1);
      expect(result.invoiceCount).toBe(2);
    });
  });

  describe('getFilingHistory', () => {
    it('should retrieve filing history', async () => {
      const mockFilings = [
        {
          id: 'filing-1',
          organisationId: mockOrganisationId,
          type: 'ZM',
          year: 2024,
          period: 1,
          periodType: 'MONTHLY',
          status: 'SUBMITTED',
          submittedAt: new Date('2024-02-10'),
          data: mockZMData,
          createdAt: new Date('2024-02-10'),
          updatedAt: new Date('2024-02-10'),
          createdBy: 'system',
        },
      ];

      prisma.elsterFiling.findMany.mockResolvedValue(mockFilings as any);

      const result = await service.getFilingHistory(mockOrganisationId);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('ZM');
      expect(result[0].year).toBe(2024);
      expect(prisma.elsterFiling.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organisationId: mockOrganisationId,
            type: 'ZM',
          }),
        }),
      );
    });

    it('should filter by year and status', async () => {
      prisma.elsterFiling.findMany.mockResolvedValue([]);

      await service.getFilingHistory(mockOrganisationId, {
        year: 2024,
        status: ZMFilingStatus.ACCEPTED,
      });

      expect(prisma.elsterFiling.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organisationId: mockOrganisationId,
            type: 'ZM',
            year: 2024,
            status: ZMFilingStatus.ACCEPTED,
          }),
        }),
      );
    });
  });

  describe('createDraft', () => {
    it('should create draft filing', async () => {
      prisma.elsterFiling.create.mockResolvedValue({
        id: 'draft-123',
        organisationId: mockOrganisationId,
        type: 'ZM',
        year: 2024,
        period: 1,
        periodType: 'MONTHLY',
        status: 'DRAFT',
        data: mockZMData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
      } as any);

      const result = await service.createDraft(mockOrganisationId, mockZMData);

      expect(result.status).toBe(ZMFilingStatus.DRAFT);
      expect(result.data).toEqual(mockZMData);
      expect(prisma.elsterFiling.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organisationId: mockOrganisationId,
            type: 'ZM',
            status: ZMFilingStatus.DRAFT,
          }),
        }),
      );
    });
  });

  describe('testViesConnection', () => {
    it('should test VIES connection successfully', async () => {
      http.get.mockReturnValue(
        of({
          status: 200,
          data: {},
        } as any),
      );

      const result = await service.testViesConnection();

      expect(result).toBe(true);
    });

    it('should handle VIES connection failure', async () => {
      http.get.mockReturnValue(
        throwError(() => new Error('Connection failed')),
      );

      const result = await service.testViesConnection();

      expect(result).toBe(false);
    });

    it('should consider 404 as VIES being available', async () => {
      http.get.mockReturnValue(
        throwError(() => ({ response: { status: 404 } })),
      );

      const result = await service.testViesConnection();

      expect(result).toBe(true);
    });
  });
});
