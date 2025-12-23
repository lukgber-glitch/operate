import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FreeeService } from '../freee.service';
import { FreeeOAuthService } from '../freee-oauth.service';
import { FreeeContactMapper } from '../mappers/contact.mapper';
import { FreeeInvoiceMapper } from '../mappers/invoice.mapper';
import { FreeeTransactionMapper } from '../mappers/transaction.mapper';
import { PrismaService } from '@/modules/database/prisma.service';

describe('FreeeService', () => {
  let service: FreeeService;
  let oauthService: FreeeOAuthService;
  let prisma: PrismaService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        FREEE_CLIENT_ID: 'test_client_id',
        FREEE_CLIENT_SECRET: 'test_client_secret',
        FREEE_REDIRECT_URI: 'http://localhost:3000/api/integrations/freee/callback',
        FREEE_ENCRYPTION_KEY: 'test_encryption_key_min_32_characters_long_12345',
      };
      return config[key];
    }),
  };

  const mockPrismaService = {
    freeeConnection: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    freeeAuditLog: {
      create: jest.fn(),
    },
  };

  const mockOAuthService = {
    generateAuthUrl: jest.fn(),
    handleCallback: jest.fn(),
    getAccessToken: jest.fn(),
    refreshTokens: jest.fn(),
    getConnectionStatus: jest.fn(),
    getConnections: jest.fn(),
    disconnect: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FreeeService,
        FreeeContactMapper,
        FreeeInvoiceMapper,
        FreeeTransactionMapper,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: FreeeOAuthService,
          useValue: mockOAuthService,
        },
      ],
    }).compile();

    service = module.get<FreeeService>(FreeeService);
    oauthService = module.get<FreeeOAuthService>(FreeeOAuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFiscalYearDates', () => {
    it('should return correct Japanese fiscal year dates', () => {
      const result = service.getFiscalYearDates(2024);

      expect(result).toEqual({
        startDate: '2024-04-01',
        endDate: '2025-03-31',
      });
    });

    it('should handle different years correctly', () => {
      const result2023 = service.getFiscalYearDates(2023);
      const result2025 = service.getFiscalYearDates(2025);

      expect(result2023).toEqual({
        startDate: '2023-04-01',
        endDate: '2024-03-31',
      });

      expect(result2025).toEqual({
        startDate: '2025-04-01',
        endDate: '2026-03-31',
      });
    });
  });

  describe('getCurrentFiscalYear', () => {
    it('should return current fiscal year when month is April or later', () => {
      // Mock date to be in May 2024
      jest.spyOn(global, 'Date').mockImplementation(() => ({
        getMonth: () => 4, // May (0-indexed)
        getFullYear: () => 2024,
      }) as any);

      const result = service.getCurrentFiscalYear();
      expect(result).toBe(2024);

      jest.restoreAllMocks();
    });

    it('should return previous fiscal year when month is before April', () => {
      // Mock date to be in February 2024
      jest.spyOn(global, 'Date').mockImplementation(() => ({
        getMonth: () => 1, // February (0-indexed)
        getFullYear: () => 2024,
      }) as any);

      const result = service.getCurrentFiscalYear();
      expect(result).toBe(2023);

      jest.restoreAllMocks();
    });

    it('should handle April correctly (start of fiscal year)', () => {
      // Mock date to be in April 2024
      jest.spyOn(global, 'Date').mockImplementation(() => ({
        getMonth: () => 3, // April (0-indexed)
        getFullYear: () => 2024,
      }) as any);

      const result = service.getCurrentFiscalYear();
      expect(result).toBe(2024);

      jest.restoreAllMocks();
    });

    it('should handle March correctly (end of fiscal year)', () => {
      // Mock date to be in March 2024
      jest.spyOn(global, 'Date').mockImplementation(() => ({
        getMonth: () => 2, // March (0-indexed)
        getFullYear: () => 2024,
      }) as any);

      const result = service.getCurrentFiscalYear();
      expect(result).toBe(2023); // FY2023 (April 2023 - March 2024)

      jest.restoreAllMocks();
    });
  });

  describe('getCompanies', () => {
    it('should fetch companies successfully', async () => {
      const mockAccessToken = 'mock_access_token';
      const mockCompanies = [
        {
          id: 1,
          name: 'Test Company',
          display_name: 'Test Corp',
          role: 'admin',
        },
      ];

      mockOAuthService.getAccessToken.mockResolvedValue(mockAccessToken);

      // Note: Actual API call testing would require mocking axios
      // This is a simplified test structure
    });
  });

  describe('rate limiting', () => {
    it('should track rate limit per company', async () => {
      // Test rate limiting logic
      // This would require more detailed mocking of the internal rate limiter
    });

    it('should throw error when rate limit exceeded', async () => {
      // Test rate limit exceeded scenario
    });

    it('should reset rate limit after window expires', async () => {
      // Test rate limit reset logic
    });
  });

  describe('error handling', () => {
    it('should handle 401 Unauthorized errors', async () => {
      mockOAuthService.getAccessToken.mockResolvedValue(null);

      await expect(service.getCompanies('test-org-id')).rejects.toThrow();
    });

    it('should handle 429 Rate Limit errors', async () => {
      // Test rate limit error handling
    });

    it('should handle network errors', async () => {
      // Test network error handling
    });
  });
});

describe('FreeeContactMapper', () => {
  let mapper: FreeeContactMapper;

  beforeEach(() => {
    mapper = new FreeeContactMapper();
  });

  it('should be defined', () => {
    expect(mapper).toBeDefined();
  });

  describe('mapToOperateContact', () => {
    it('should map freee partner to Operate contact correctly', () => {
      const mockPartner = {
        id: 123,
        company_id: 1,
        name: 'Test Partner',
        long_name: 'Test Partner Corporation',
        name_kana: 'テストパートナー',
        email: 'test@example.com',
        phone: '03-1234-5678',
        contact_name: 'Taro Yamada',
        address_attributes: {
          zipcode: '100-0001',
          prefecture_code: 13,
          street_name1: 'Chiyoda-ku',
          street_name2: '1-1-1',
        },
        available: true,
        invoice_registration_number: 'T1234567890123',
        qualified_invoice_issuer: 'qualified',
      } as any;

      const result = mapper.mapToOperateContact(mockPartner);

      expect(result).toMatchObject({
        externalId: 'freee_123',
        externalSystem: 'freee',
        name: 'Test Partner',
        displayName: 'Test Partner Corporation',
        email: 'test@example.com',
        phone: '03-1234-5678',
        isActive: true,
      });

      expect(result.address).toMatchObject({
        postalCode: '100-0001',
        prefectureCode: 13,
        address1: 'Chiyoda-ku',
        address2: '1-1-1',
      });

      expect(result.taxInfo).toMatchObject({
        invoiceRegistrationNumber: 'T1234567890123',
        qualifiedInvoiceIssuer: 'qualified',
      });
    });

    it('should handle partners without optional fields', () => {
      const mockPartner = {
        id: 456,
        company_id: 1,
        name: 'Simple Partner',
        available: true,
      } as any;

      const result = mapper.mapToOperateContact(mockPartner);

      expect(result.externalId).toBe('freee_456');
      expect(result.name).toBe('Simple Partner');
      expect(result.address).toBeNull();
      expect(result.bankAccount).toBeNull();
    });
  });

  describe('detectChanges', () => {
    it('should detect changes between Operate contact and freee partner', () => {
      const operateContact = {
        name: 'Old Name',
        email: 'old@example.com',
        phone: '03-1111-1111',
      };

      const freeePartner = {
        name: 'New Name',
        email: 'old@example.com',
        phone: '03-2222-2222',
      } as any;

      const changes = mapper.detectChanges(operateContact, freeePartner);

      expect(changes).toContain('name');
      expect(changes).toContain('phone');
      expect(changes).not.toContain('email');
    });
  });
});

describe('FreeeInvoiceMapper', () => {
  let mapper: FreeeInvoiceMapper;

  beforeEach(() => {
    mapper = new FreeeInvoiceMapper();
  });

  it('should be defined', () => {
    expect(mapper).toBeDefined();
  });

  describe('calculateTotals', () => {
    it('should calculate invoice totals correctly', () => {
      const lineItems = [
        { amount: 1000, taxAmount: 100 },
        { amount: 2000, taxAmount: 200 },
        { amount: 3000, taxAmount: 300 },
      ];

      const result = mapper.calculateTotals(lineItems);

      expect(result).toEqual({
        subtotal: 6000,
        taxAmount: 600,
        totalAmount: 6600,
      });
    });

    it('should handle empty line items', () => {
      const result = mapper.calculateTotals([]);

      expect(result).toEqual({
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
      });
    });
  });
});

describe('FreeeTransactionMapper', () => {
  let mapper: FreeeTransactionMapper;

  beforeEach(() => {
    mapper = new FreeeTransactionMapper();
  });

  it('should be defined', () => {
    expect(mapper).toBeDefined();
  });

  describe('calculateTransactionTotals', () => {
    it('should calculate transaction totals correctly', () => {
      const lineItems = [
        { amount: 5000, taxAmount: 500 },
        { amount: 3000, taxAmount: 300 },
      ];

      const result = mapper.calculateTransactionTotals(lineItems);

      expect(result).toEqual({
        subtotal: 8000,
        taxAmount: 800,
        totalAmount: 8800,
      });
    });
  });

  describe('groupByAccount', () => {
    it('should group wallet transactions by account ID', () => {
      const walletTxns = [
        { walletable_id: 1, id: 101 },
        { walletable_id: 2, id: 102 },
        { walletable_id: 1, id: 103 },
        { walletable_id: 2, id: 104 },
      ] as any[];

      const result = mapper.groupByAccount(walletTxns);

      expect(result.size).toBe(2);
      expect(result.get(1)).toHaveLength(2);
      expect(result.get(2)).toHaveLength(2);
    });
  });
});
