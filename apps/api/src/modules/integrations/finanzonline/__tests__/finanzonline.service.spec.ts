import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FinanzOnlineService } from '../finanzonline.service';
import { RedisService } from '../../../cache/redis.service';
import {
  FonEnvironment,
  FonSession,
} from '../interfaces/fon-config.interface';
import {
  FonErrorCode,
  FonSubmissionStatus,
} from '../interfaces/fon-response.interface';
import { FonCredentialsDto } from '../dto/fon-credentials.dto';
import {
  FonVatReturnDto,
  VatPeriodDto,
} from '../dto/fon-vat-return.dto';
import { VatPeriodType } from '../interfaces/fon-submission.interface';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('FinanzOnlineService', () => {
  let service: FinanzOnlineService;
  let redisService: jest.Mocked<RedisService>;
  let configService: jest.Mocked<ConfigService>;

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delByPattern: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        FON_ENVIRONMENT: FonEnvironment.SANDBOX,
        FON_TIMEOUT: 30000,
        FON_DEBUG: true,
        FON_MAX_RETRIES: 3,
        FON_SESSION_TIMEOUT: 120,
        FON_ENCRYPTION_KEY: 'test-encryption-key-for-testing',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanzOnlineService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<FinanzOnlineService>(FinanzOnlineService);
    redisService = module.get(RedisService);
    configService = module.get(ConfigService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('authenticate', () => {
    it('should authenticate successfully with valid credentials', async () => {
      const credentials: FonCredentialsDto = {
        taxId: '12-345/6789',
        certificate: '-----BEGIN CERTIFICATE-----\nMIICertificate\n-----END CERTIFICATE-----',
        certificateType: 'PEM',
        environment: FonEnvironment.SANDBOX,
      };

      // Mock SOAP request (would need to mock actual HTTP call in real tests)
      jest.spyOn(service as any, 'sendSoapRequest').mockResolvedValue(`
        <?xml version="1.0"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <AuthResponse>
              <Success>true</Success>
            </AuthResponse>
          </soap:Body>
        </soap:Envelope>
      `);

      const result = await service.authenticate(credentials);

      expect(result).toBeDefined();
      expect(result.taxId).toBe('12-345/6789');
      expect(result.sessionId).toMatch(/^sess_[a-f0-9]+$/);
      expect(result.token).toMatch(/^tok_[a-f0-9]+$/);
      expect(result.environment).toBe(FonEnvironment.SANDBOX);
      expect(redisService.set).toHaveBeenCalledTimes(2); // session + credentials
    });

    it('should throw BadRequestException for invalid tax ID format', async () => {
      const credentials: FonCredentialsDto = {
        taxId: 'INVALID',
        certificate: '-----BEGIN CERTIFICATE-----\nMIICertificate\n-----END CERTIFICATE-----',
        certificateType: 'PEM',
      };

      await expect(service.authenticate(credentials)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid certificate', async () => {
      const credentials: FonCredentialsDto = {
        taxId: '12-345/6789',
        certificate: 'INVALID_CERTIFICATE',
        certificateType: 'PEM',
      };

      await expect(service.authenticate(credentials)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should normalize tax ID with spaces', async () => {
      const credentials: FonCredentialsDto = {
        taxId: '12 - 345 / 6789',
        certificate: '-----BEGIN CERTIFICATE-----\nMIICertificate\n-----END CERTIFICATE-----',
        certificateType: 'PEM',
      };

      jest.spyOn(service as any, 'sendSoapRequest').mockResolvedValue(`
        <?xml version="1.0"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <AuthResponse>
              <Success>true</Success>
            </AuthResponse>
          </soap:Body>
        </soap:Envelope>
      `);

      const result = await service.authenticate(credentials);

      expect(result.taxId).toBe('12-345/6789');
    });
  });

  describe('logout', () => {
    it('should logout successfully with valid session', async () => {
      const sessionId = 'sess_1234567890abcdef';
      const mockSession: FonSession = {
        sessionId,
        token: 'tok_abcdef1234567890',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        taxId: '12-345/6789',
        environment: FonEnvironment.SANDBOX,
      };

      redisService.get.mockResolvedValue(mockSession);
      jest.spyOn(service as any, 'sendSoapRequest').mockResolvedValue('<?xml version="1.0"?><soap:Envelope></soap:Envelope>');

      await service.logout(sessionId);

      expect(redisService.del).toHaveBeenCalledWith(
        `fon:session:${sessionId}`,
      );
    });

    it('should throw UnauthorizedException for invalid session', async () => {
      const sessionId = 'invalid_session';
      redisService.get.mockResolvedValue(null);

      await expect(service.logout(sessionId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('submitVATReturn', () => {
    it('should submit VAT return successfully', async () => {
      const sessionId = 'sess_1234567890abcdef';
      const mockSession: FonSession = {
        sessionId,
        token: 'tok_abcdef1234567890',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        taxId: '12-345/6789',
        environment: FonEnvironment.SANDBOX,
      };

      const period: VatPeriodDto = {
        year: 2025,
        type: VatPeriodType.MONTHLY,
        period: 11,
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-30'),
      };

      const vatReturn: FonVatReturnDto = {
        taxId: '12-345/6789',
        vatId: 'ATU12345678',
        period,
        lines: [
          { code: '000', amount: 50000, description: 'Taxable turnover' },
          { code: '056', amount: 10000, description: 'VAT at 20%' },
        ],
        totalOutputVat: 10000,
        totalInputVat: 5000,
        netVat: 5000,
        declarationDate: new Date('2025-11-29'),
        sessionId,
      };

      redisService.get.mockResolvedValue(mockSession);
      jest.spyOn(service as any, 'sendSoapRequest').mockResolvedValue(`
        <?xml version="1.0"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <VATReturnResponse>
              <Success>true</Success>
            </VATReturnResponse>
          </soap:Body>
        </soap:Envelope>
      `);

      const result = await service.submitVATReturn(vatReturn);

      expect(result.success).toBe(true);
      expect(result.referenceId).toMatch(/^VAT-\d{4}-\d{2}-\d{2}-[A-F0-9]+$/);
      expect(result.status).toBe(FonSubmissionStatus.ACCEPTED);
    });

    it('should throw UnauthorizedException for expired session', async () => {
      const sessionId = 'sess_1234567890abcdef';
      const mockSession: FonSession = {
        sessionId,
        token: 'tok_abcdef1234567890',
        createdAt: new Date(Date.now() - 7200000),
        expiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago
        taxId: '12-345/6789',
        environment: FonEnvironment.SANDBOX,
      };

      const period: VatPeriodDto = {
        year: 2025,
        type: VatPeriodType.MONTHLY,
        period: 11,
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-30'),
      };

      const vatReturn: FonVatReturnDto = {
        taxId: '12-345/6789',
        period,
        lines: [],
        totalOutputVat: 0,
        totalInputVat: 0,
        netVat: 0,
        declarationDate: new Date(),
        sessionId,
      };

      redisService.get.mockResolvedValue(mockSession);

      await expect(service.submitVATReturn(vatReturn)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getSubmissionStatus', () => {
    it('should get submission status successfully', async () => {
      const referenceId = 'VAT-2025-11-29-ABCD1234';
      const sessionId = 'sess_1234567890abcdef';
      const mockSession: FonSession = {
        sessionId,
        token: 'tok_abcdef1234567890',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        taxId: '12-345/6789',
        environment: FonEnvironment.SANDBOX,
      };

      redisService.get.mockResolvedValue(mockSession);
      jest.spyOn(service as any, 'sendSoapRequest').mockResolvedValue(`
        <?xml version="1.0"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <StatusResponse>
              <Status>PROCESSING</Status>
            </StatusResponse>
          </soap:Body>
        </soap:Envelope>
      `);

      const result = await service.getSubmissionStatus(
        referenceId,
        sessionId,
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(FonSubmissionStatus.PROCESSING);
    });
  });

  describe('Session management', () => {
    it('should store and retrieve session correctly', async () => {
      const session: FonSession = {
        sessionId: 'sess_test123',
        token: 'tok_test456',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        taxId: '12-345/6789',
        environment: FonEnvironment.SANDBOX,
      };

      await (service as any).storeSession(session);

      expect(redisService.set).toHaveBeenCalledWith(
        `fon:session:${session.sessionId}`,
        session,
        7200,
      );
    });

    it('should detect expired sessions', async () => {
      const expiredSession: FonSession = {
        sessionId: 'sess_expired',
        token: 'tok_expired',
        createdAt: new Date(Date.now() - 7200000),
        expiresAt: new Date(Date.now() - 3600000),
        taxId: '12-345/6789',
        environment: FonEnvironment.SANDBOX,
      };

      redisService.get.mockResolvedValue(expiredSession);

      await expect(
        (service as any).validateSession('sess_expired'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
