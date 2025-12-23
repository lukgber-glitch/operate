import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TinkService } from '../tink.service';
import { PrismaService } from '@/modules/database/prisma.service';
import { TinkMockDataUtil } from '../utils/tink-mock-data.util';

describe('TinkService', () => {
  let service: TinkService;
  let configService: ConfigService;
  let prismaService: PrismaService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        TINK_CLIENT_ID: 'test_client_id',
        TINK_CLIENT_SECRET: 'test_client_secret',
        TINK_API_URL: 'https://api.tink.com',
        TINK_LINK_URL: 'https://link.tink.com/1.0',
        TINK_REDIRECT_URI: 'http://localhost:3000/callback',
        TINK_ENVIRONMENT: 'sandbox',
        TINK_MOCK_MODE: 'true',
        TINK_ENCRYPTION_KEY: 'test_encryption_key_32_characters_long_minimum',
      };
      return config[key];
    }),
  };

  const mockPrismaService = {
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TinkService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TinkService>(TinkService);
    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Mock Mode', () => {
    it('should initialize in mock mode', () => {
      expect(service).toBeDefined();
    });

    it('should start authorization flow in mock mode', async () => {
      const result = await service.startAuthorization('org-123', 'user-456', 'DE');

      expect(result).toHaveProperty('authorizationUrl');
      expect(result).toHaveProperty('state');
      expect(result.authorizationUrl).toContain('link.tink.com');
    });

    it('should complete authorization in mock mode', async () => {
      const token = await service.completeAuthorization('mock_code', 'mock_state');

      expect(token).toHaveProperty('accessToken');
      expect(token).toHaveProperty('refreshToken');
      expect(token).toHaveProperty('expiresIn');
      expect(token.tokenType).toBe('Bearer');
    });

    it('should fetch accounts in mock mode', async () => {
      const accounts = await service.getAccounts('org-123', 'user-456');

      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts.length).toBeGreaterThan(0);
      expect(accounts[0]).toHaveProperty('id');
      expect(accounts[0]).toHaveProperty('name');
      expect(accounts[0]).toHaveProperty('balances');
    });

    it('should fetch transactions in mock mode', async () => {
      const transactions = await service.getTransactions(
        'org-123',
        'user-456',
        'mock_account_1'
      );

      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions[0]).toHaveProperty('id');
      expect(transactions[0]).toHaveProperty('amount');
      expect(transactions[0]).toHaveProperty('descriptions');
    });

    it('should fetch providers in mock mode', async () => {
      const providers = await service.getProviders('DE');

      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
      expect(providers[0]).toHaveProperty('name');
      expect(providers[0]).toHaveProperty('displayName');
    });
  });

  describe('Mock Data Utilities', () => {
    it('should generate mock token', () => {
      const token = TinkMockDataUtil.generateMockToken();

      expect(token.accessToken).toContain('mock_access_token');
      expect(token.refreshToken).toContain('mock_refresh_token');
      expect(token.expiresIn).toBe(3600);
    });

    it('should generate mock accounts', () => {
      const accounts = TinkMockDataUtil.generateMockAccounts();

      expect(accounts.length).toBe(3); // checking, savings, credit
      expect(accounts[0].type).toBeDefined();
      expect(accounts[0].balances.booked.amount.value).toBeGreaterThan(0);
    });

    it('should generate mock transactions', () => {
      const transactions = TinkMockDataUtil.generateMockTransactions('test-account', 10);

      expect(transactions.length).toBe(10);
      expect(transactions[0].accountId).toBe('test-account');
      expect(transactions[0].amount.currencyCode).toBe('EUR');
    });
  });
});
