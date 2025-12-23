import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CraAuthService } from '../cra-auth.service';
import { PrismaService } from '@/modules/database/prisma.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('CraAuthService', () => {
  let service: CraAuthService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        CRA_EFILE_NUMBER: 'TEST12345678',
        CRA_WEB_ACCESS_CODE: 'TESTACCESSCODE',
        CRA_SANDBOX: 'true',
        CRA_ENCRYPTION_KEY: 'test-encryption-key-32-characters-long-12345678',
      };
      return config[key];
    }),
  };

  const mockPrismaService = {
    integrationCredentials: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
    integrationAuditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CraAuthService,
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

    service = module.get<CraAuthService>(CraAuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should successfully authenticate with valid credentials', async () => {
      const organizationId = 'org-123';
      const businessNumber = '123456789RT0001';
      const webAccessCode = 'VALIDCODE';

      mockPrismaService.integrationCredentials.upsert.mockResolvedValue({
        id: 'cred-123',
        organizationId,
        provider: 'CRA',
      });

      mockPrismaService.integrationAuditLog.create.mockResolvedValue({});

      const result = await service.authenticate(
        organizationId,
        businessNumber,
        webAccessCode,
      );

      expect(result).toBeDefined();
      expect(result.organizationId).toBe(organizationId);
      expect(result.businessNumber).toBe(businessNumber);
      expect(result.sessionId).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should throw UnauthorizedException when Web Access Code is missing', async () => {
      const organizationId = 'org-123';
      const businessNumber = '123456789RT0001';

      // Override config to return undefined for WAC
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'CRA_WEB_ACCESS_CODE') return undefined;
        return mockConfigService.get(key);
      });

      await expect(
        service.authenticate(organizationId, businessNumber),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException for invalid business number', async () => {
      const organizationId = 'org-123';
      const invalidBN = 'INVALID-BN';
      const webAccessCode = 'VALIDCODE';

      await expect(
        service.authenticate(organizationId, invalidBN, webAccessCode),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateSession', () => {
    it('should return true for valid active session', async () => {
      const organizationId = 'org-123';
      const businessNumber = '123456789RT0001';

      mockPrismaService.integrationCredentials.upsert.mockResolvedValue({});
      mockPrismaService.integrationAuditLog.create.mockResolvedValue({});

      const sessionInfo = await service.authenticate(
        organizationId,
        businessNumber,
        'VALIDCODE',
      );

      const isValid = await service.validateSession(sessionInfo.sessionId);
      expect(isValid).toBe(true);
    });

    it('should return false for non-existent session', async () => {
      const isValid = await service.validateSession('invalid-session-id');
      expect(isValid).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should successfully disconnect and clear credentials', async () => {
      const organizationId = 'org-123';

      mockPrismaService.integrationCredentials.deleteMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.integrationAuditLog.create.mockResolvedValue({});

      await expect(service.disconnect(organizationId)).resolves.not.toThrow();

      expect(mockPrismaService.integrationCredentials.deleteMany).toHaveBeenCalledWith(
        {
          where: {
            organizationId,
            provider: 'CRA',
          },
        },
      );
    });
  });

  describe('getConnectionInfo', () => {
    it('should return connection info for connected organization', async () => {
      const organizationId = 'org-123';
      const businessNumber = '123456789RT0001';

      const mockCredentials = {
        organizationId,
        provider: 'CRA',
        encryptedData: 'encrypted',
        iv: 'iv',
        authTag: 'authTag',
        expiresAt: new Date(Date.now() + 60000),
      };

      mockPrismaService.integrationCredentials.findUnique.mockResolvedValue(
        mockCredentials,
      );

      // Create active session first
      mockPrismaService.integrationCredentials.upsert.mockResolvedValue({});
      mockPrismaService.integrationAuditLog.create.mockResolvedValue({});

      await service.authenticate(organizationId, businessNumber, 'VALIDCODE');

      const connectionInfo = await service.getConnectionInfo(organizationId);

      expect(connectionInfo).toBeDefined();
      expect(connectionInfo?.organizationId).toBe(organizationId);
    });

    it('should return null for non-existent connection', async () => {
      mockPrismaService.integrationCredentials.findUnique.mockResolvedValue(null);

      const connectionInfo = await service.getConnectionInfo('non-existent-org');
      expect(connectionInfo).toBeNull();
    });
  });
});
