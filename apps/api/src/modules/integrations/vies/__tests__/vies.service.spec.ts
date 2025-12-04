import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { ViesService } from '../vies.service';
import { ViesClient } from '../vies.client';
import { RedisService } from '../../../cache/redis.service';
import { ViesErrorCode } from '../interfaces/vies-response.interface';

describe('ViesService', () => {
  let service: ViesService;
  let viesClient: jest.Mocked<ViesClient>;
  let redisService: jest.Mocked<RedisService>;

  const mockViesClient = {
    checkVat: jest.fn(),
    resetClient: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    ttl: jest.fn(),
    delByPattern: jest.fn(),
    getClient: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: any = {
        'redis.host': 'localhost',
        'redis.port': 6379,
        'redis.db': 0,
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ViesService,
        {
          provide: ViesClient,
          useValue: mockViesClient,
        },
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

    service = module.get<ViesService>(ViesService);
    viesClient = module.get(ViesClient);
    redisService = module.get(RedisService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('validateVat', () => {
    it('should validate a valid VAT number', async () => {
      const mockResponse = {
        countryCode: 'DE',
        vatNumber: '123456789',
        requestDate: new Date('2025-11-29'),
        valid: true,
        name: 'Example GmbH',
        address: 'Berlin, Germany',
      };

      mockRedisService.get.mockResolvedValue(null);
      mockViesClient.checkVat.mockResolvedValue(mockResponse);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.validateVat('DE123456789');

      expect(result).toEqual({
        valid: true,
        countryCode: 'DE',
        vatNumber: '123456789',
        requestDate: expect.any(String),
        name: 'Example GmbH',
        address: 'Berlin, Germany',
        cached: false,
      });

      expect(viesClient.checkVat).toHaveBeenCalledWith('DE', '123456789');
    });

    it('should return cached result when available', async () => {
      const cachedData = {
        valid: true,
        countryCode: 'FR',
        vatNumber: '12345678901',
        requestDate: '2025-11-29T12:00:00Z',
        name: 'Example SARL',
        address: 'Paris, France',
        cachedAt: '2025-11-29T12:00:00Z',
        expiresAt: '2025-11-30T12:00:00Z',
      };

      mockRedisService.get.mockResolvedValue(cachedData);

      const result = await service.validateVat('FR12345678901');

      expect(result).toEqual({
        valid: true,
        countryCode: 'FR',
        vatNumber: '12345678901',
        requestDate: '2025-11-29T12:00:00Z',
        name: 'Example SARL',
        address: 'Paris, France',
        cached: true,
        cacheExpiry: '2025-11-30T12:00:00Z',
      });

      expect(viesClient.checkVat).not.toHaveBeenCalled();
    });

    it('should skip cache when skipCache is true', async () => {
      const mockResponse = {
        countryCode: 'NL',
        vatNumber: '123456789B01',
        requestDate: new Date('2025-11-29'),
        valid: true,
        name: 'Example BV',
        address: 'Amsterdam, Netherlands',
      };

      mockViesClient.checkVat.mockResolvedValue(mockResponse);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.validateVat('NL123456789B01', undefined, true);

      expect(result.cached).toBe(false);
      expect(redisService.get).not.toHaveBeenCalled();
      expect(viesClient.checkVat).toHaveBeenCalled();
    });

    it('should throw error for non-EU country', async () => {
      const result = await service.validateVat('US123456789');

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain('not an EU member state');
    });

    it('should parse VAT number with country code prefix', async () => {
      const mockResponse = {
        countryCode: 'BE',
        vatNumber: '0123456789',
        requestDate: new Date('2025-11-29'),
        valid: true,
        name: 'Example SA',
        address: 'Brussels, Belgium',
      };

      mockRedisService.get.mockResolvedValue(null);
      mockViesClient.checkVat.mockResolvedValue(mockResponse);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.validateVat('BE0123456789');

      expect(result.countryCode).toBe('BE');
      expect(result.vatNumber).toBe('0123456789');
    });

    it('should handle VAT numbers with spaces and dashes', async () => {
      const mockResponse = {
        countryCode: 'AT',
        vatNumber: 'U12345678',
        requestDate: new Date('2025-11-29'),
        valid: true,
        name: 'Example GmbH',
        address: 'Vienna, Austria',
      };

      mockRedisService.get.mockResolvedValue(null);
      mockViesClient.checkVat.mockResolvedValue(mockResponse);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.validateVat('AT U-123.456.78');

      expect(result.countryCode).toBe('AT');
      expect(result.vatNumber).toBe('U12345678');
    });

    it('should retry on service unavailable error', async () => {
      const mockError = new Error(
        `${ViesErrorCode.SERVICE_UNAVAILABLE}: VIES service unavailable`,
      );
      const mockResponse = {
        countryCode: 'IT',
        vatNumber: '12345678901',
        requestDate: new Date('2025-11-29'),
        valid: true,
        name: 'Example SRL',
        address: 'Rome, Italy',
      };

      mockRedisService.get.mockResolvedValue(null);
      mockViesClient.checkVat
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockResponse);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.validateVat('IT12345678901');

      expect(result.valid).toBe(true);
      expect(viesClient.checkVat).toHaveBeenCalledTimes(2);
    });

    it('should not cache invalid VAT numbers', async () => {
      const mockResponse = {
        countryCode: 'ES',
        vatNumber: '12345678',
        requestDate: new Date('2025-11-29'),
        valid: false,
        name: '',
        address: '',
      };

      mockRedisService.get.mockResolvedValue(null);
      mockViesClient.checkVat.mockResolvedValue(mockResponse);

      await service.validateVat('ES12345678');

      expect(redisService.set).not.toHaveBeenCalled();
    });
  });

  describe('validateBulk', () => {
    it('should validate multiple VAT numbers', async () => {
      const mockResponses = [
        {
          countryCode: 'DE',
          vatNumber: '123456789',
          requestDate: new Date('2025-11-29'),
          valid: true,
          name: 'Company DE',
          address: 'Berlin',
        },
        {
          countryCode: 'FR',
          vatNumber: '12345678901',
          requestDate: new Date('2025-11-29'),
          valid: true,
          name: 'Company FR',
          address: 'Paris',
        },
        {
          countryCode: 'NL',
          vatNumber: '123456789B01',
          requestDate: new Date('2025-11-29'),
          valid: false,
          name: '',
          address: '',
        },
      ];

      mockRedisService.get.mockResolvedValue(null);
      mockViesClient.checkVat
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1])
        .mockResolvedValueOnce(mockResponses[2]);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.validateBulk([
        'DE123456789',
        'FR12345678901',
        'NL123456789B01',
      ]);

      expect(result.total).toBe(3);
      expect(result.valid).toBe(2);
      expect(result.invalid).toBe(1);
      expect(result.errors).toBe(0);
      expect(result.results).toHaveLength(3);
    });
  });

  describe('getCrossBorderRules', () => {
    it('should identify domestic transaction', () => {
      const rules = service.getCrossBorderRules('DE', 'DE', true);

      expect(rules.isCrossBorder).toBe(false);
      expect(rules.reverseChargeApplicable).toBe(false);
      expect(rules.vatTreatment).toContain('Domestic');
    });

    it('should apply reverse charge for valid cross-border B2B', () => {
      const rules = service.getCrossBorderRules('DE', 'FR', true);

      expect(rules.isCrossBorder).toBe(true);
      expect(rules.reverseChargeApplicable).toBe(true);
      expect(rules.vatTreatment).toContain('reverse charge');
      expect(rules.notes).toBeDefined();
    });

    it('should not apply reverse charge for invalid VAT', () => {
      const rules = service.getCrossBorderRules('DE', 'FR', false);

      expect(rules.isCrossBorder).toBe(true);
      expect(rules.reverseChargeApplicable).toBe(false);
      expect(rules.vatTreatment).toContain('supplier country VAT');
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific VAT number', async () => {
      await service.clearCache('DE', '123456789');

      expect(redisService.del).toHaveBeenCalledWith('vies:DE:123456789');
    });

    it('should clear all cache for a country', async () => {
      await service.clearCache('FR');

      expect(redisService.delByPattern).toHaveBeenCalledWith('vies:FR:*');
    });

    it('should clear all VIES cache', async () => {
      await service.clearCache();

      expect(redisService.delByPattern).toHaveBeenCalledWith('vies:*');
    });
  });
});
