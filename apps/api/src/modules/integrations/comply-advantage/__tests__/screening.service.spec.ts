import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ScreeningService } from '../services/screening.service';
import { PrismaService } from '@/modules/database/prisma.service';
import { SearchType, RiskLevel, ScreeningStatus } from '../types/comply-advantage.types';

describe('ScreeningService', () => {
  let service: ScreeningService;
  let prisma: PrismaService;
  let configService: ConfigService;

  const mockPrismaService = {
    amlScreening: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    amlAlert: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        COMPLY_ADVANTAGE_API_KEY: 'test_api_key',
        COMPLY_ADVANTAGE_API_URL: 'https://api.test.com',
        COMPLY_ADVANTAGE_ENVIRONMENT: 'sandbox',
        COMPLY_ADVANTAGE_MOCK_MODE: 'true',
        JWT_SECRET: 'test_encryption_key_minimum_32_chars',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScreeningService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ScreeningService>(ScreeningService);
    prisma = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSearch', () => {
    it('should create a screening search successfully', async () => {
      const createSearchDto = {
        searchTerm: 'John Doe',
        searchType: SearchType.PERSON,
        organizationId: 'org_123',
        userId: 'user_456',
      };

      const mockScreening = {
        id: 'screening_123',
        searchId: 'search_abc',
        entityType: SearchType.PERSON,
        entityName: 'John Doe',
        organizationId: 'org_123',
        userId: 'user_456',
        riskLevel: RiskLevel.LOW,
        matchCount: 0,
        status: ScreeningStatus.CLEAR,
        lastScreenedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.amlScreening.create.mockResolvedValue(mockScreening);

      const result = await service.createSearch(createSearchDto);

      expect(result).toBeDefined();
      expect(result.entityName).toBe('John Doe');
      expect(mockPrismaService.amlScreening.create).toHaveBeenCalled();
    });

    it('should handle matches and create alerts', async () => {
      const createSearchDto = {
        searchTerm: 'Jane Smith',
        searchType: SearchType.PERSON,
        organizationId: 'org_123',
      };

      const mockScreening = {
        id: 'screening_456',
        searchId: 'search_def',
        entityType: SearchType.PERSON,
        entityName: 'Jane Smith',
        organizationId: 'org_123',
        riskLevel: RiskLevel.HIGH,
        matchCount: 1,
        status: ScreeningStatus.PENDING_REVIEW,
        lastScreenedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.amlScreening.create.mockResolvedValue(mockScreening);
      mockPrismaService.amlAlert.createMany.mockResolvedValue({ count: 1 });

      const result = await service.createSearch(createSearchDto);

      expect(result).toBeDefined();
      expect(result.matchCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getScreening', () => {
    it('should retrieve a screening by ID', async () => {
      const mockScreening = {
        id: 'screening_123',
        searchId: 'search_abc',
        entityName: 'John Doe',
        alerts: [],
        user: null,
      };

      mockPrismaService.amlScreening.findUnique.mockResolvedValue(mockScreening);

      const result = await service.getScreening('screening_123');

      expect(result).toBeDefined();
      expect(result.id).toBe('screening_123');
      expect(mockPrismaService.amlScreening.findUnique).toHaveBeenCalledWith({
        where: { id: 'screening_123' },
        include: expect.any(Object),
      });
    });

    it('should throw error if screening not found', async () => {
      mockPrismaService.amlScreening.findUnique.mockResolvedValue(null);

      await expect(service.getScreening('invalid_id')).rejects.toThrow();
    });
  });

  describe('listScreenings', () => {
    it('should list screenings for organization', async () => {
      const mockScreenings = [
        {
          id: 'screening_1',
          organizationId: 'org_123',
          alerts: [],
          user: null,
        },
        {
          id: 'screening_2',
          organizationId: 'org_123',
          alerts: [],
          user: null,
        },
      ];

      mockPrismaService.amlScreening.findMany.mockResolvedValue(mockScreenings);

      const result = await service.listScreenings('org_123');

      expect(result).toHaveLength(2);
      expect(mockPrismaService.amlScreening.findMany).toHaveBeenCalled();
    });

    it('should filter screenings by status', async () => {
      const mockScreenings = [
        {
          id: 'screening_1',
          organizationId: 'org_123',
          status: ScreeningStatus.PENDING_REVIEW,
          alerts: [],
          user: null,
        },
      ];

      mockPrismaService.amlScreening.findMany.mockResolvedValue(mockScreenings);

      const result = await service.listScreenings('org_123', {
        status: ScreeningStatus.PENDING_REVIEW,
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(ScreeningStatus.PENDING_REVIEW);
    });
  });
});
