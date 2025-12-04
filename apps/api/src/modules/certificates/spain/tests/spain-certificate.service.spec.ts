import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SpainCertificateService } from '../spain-certificate.service';
import { CertificateStorageService } from '../certificate-storage.service';
import { CertificateValidatorService } from '../certificate-validator.service';
import { CertificateRotationService } from '../certificate-rotation.service';
import { PrismaService } from '../../../../database/prisma.service';
import {
  SpainCertificateError,
  SpainCertificateErrorCode,
} from '../interfaces/spain-certificate.interface';

describe('SpainCertificateService', () => {
  let service: SpainCertificateService;
  let prismaService: PrismaService;
  let storageService: CertificateStorageService;
  let validatorService: CertificateValidatorService;
  let rotationService: CertificateRotationService;

  const mockPrismaService = {
    spainCertificate: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    spainCertificateAuditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'SPAIN_SII_CERT_ENCRYPTION_KEY') {
        return 'test-encryption-key-32-characters-long-for-testing';
      }
      return undefined;
    }),
  };

  const mockStorageService = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    generateThumbprint: jest.fn(),
  };

  const mockValidatorService = {
    validateCertificate: jest.fn(),
  };

  const mockRotationService = {
    rotateCertificate: jest.fn(),
  };

  const mockContext = {
    userId: 'user-123',
    ipAddress: '192.168.1.1',
    userAgent: 'Test Agent',
  };

  const mockCertificateData = Buffer.from('mock-certificate-data');
  const mockPassword = 'test-password';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpainCertificateService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CertificateStorageService,
          useValue: mockStorageService,
        },
        {
          provide: CertificateValidatorService,
          useValue: mockValidatorService,
        },
        {
          provide: CertificateRotationService,
          useValue: mockRotationService,
        },
      ],
    }).compile();

    service = module.get<SpainCertificateService>(SpainCertificateService);
    prismaService = module.get<PrismaService>(PrismaService);
    storageService = module.get<CertificateStorageService>(
      CertificateStorageService,
    );
    validatorService = module.get<CertificateValidatorService>(
      CertificateValidatorService,
    );
    rotationService = module.get<CertificateRotationService>(
      CertificateRotationService,
    );
  });

  describe('storeCertificate', () => {
    it('should store a valid certificate', async () => {
      const validationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        metadata: {
          serialNumber: '1234567890',
          issuer: 'FNMT Clase 2 CA',
          subject: 'CN=Test Company',
          validFrom: new Date('2024-01-01'),
          validTo: new Date('2026-01-01'),
          cifNif: 'B12345678',
          thumbprint: 'ABC123',
          isFNMT: true,
        },
      };

      const encryptedResult = {
        encrypted: Buffer.from('encrypted'),
        iv: Buffer.from('iv'),
        authTag: Buffer.from('authTag'),
      };

      const storedCertificate = {
        id: 'cert-123',
        organisationId: 'org-456',
        name: 'Test Certificate',
        description: null,
        cifNif: 'B12345678',
        encryptedData: encryptedResult.encrypted,
        encryptedPassword: encryptedResult.encrypted,
        iv: encryptedResult.iv,
        authTag: encryptedResult.authTag,
        thumbprint: 'ABC123',
        serialNumber: '1234567890',
        issuer: 'FNMT Clase 2 CA',
        subject: 'CN=Test Company',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2026-01-01'),
        environment: 'production',
        isActive: true,
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-123',
      };

      mockValidatorService.validateCertificate.mockResolvedValue(
        validationResult,
      );
      mockStorageService.encrypt.mockResolvedValue(encryptedResult);
      mockStorageService.generateThumbprint.mockReturnValue('ABC123');
      mockPrismaService.spainCertificate.create.mockResolvedValue(
        storedCertificate,
      );

      const result = await service.storeCertificate({
        organisationId: 'org-456',
        certificate: mockCertificateData,
        password: mockPassword,
        metadata: {
          name: 'Test Certificate',
          environment: 'production',
        },
        context: mockContext,
      });

      expect(result.certificate.id).toBe('cert-123');
      expect(result.certificate.name).toBe('Test Certificate');
      expect(result.certificate.cifNif).toBe('B12345678');
      expect(result.warnings).toEqual([]);
      expect(mockValidatorService.validateCertificate).toHaveBeenCalledWith(
        mockCertificateData,
        mockPassword,
      );
      expect(mockStorageService.encrypt).toHaveBeenCalledTimes(2); // cert + password
      expect(mockPrismaService.spainCertificate.create).toHaveBeenCalled();
    });

    it('should reject invalid certificate', async () => {
      const validationResult = {
        isValid: false,
        errors: ['Certificate has expired'],
        warnings: [],
      };

      mockValidatorService.validateCertificate.mockResolvedValue(
        validationResult,
      );

      await expect(
        service.storeCertificate({
          organisationId: 'org-456',
          certificate: mockCertificateData,
          password: mockPassword,
          metadata: {
            name: 'Test Certificate',
          },
          context: mockContext,
        }),
      ).rejects.toThrow(SpainCertificateError);

      expect(mockPrismaService.spainCertificate.create).not.toHaveBeenCalled();
    });
  });

  describe('getCertificate', () => {
    it('should retrieve and decrypt a certificate', async () => {
      const storedCertificate = {
        id: 'cert-123',
        organisationId: 'org-456',
        name: 'Test Certificate',
        description: null,
        cifNif: 'B12345678',
        encryptedData: Buffer.from('encrypted-cert'),
        encryptedPassword: Buffer.from('encrypted-pass'),
        iv: Buffer.from('iv'),
        authTag: Buffer.from('authTag'),
        thumbprint: 'ABC123',
        serialNumber: '1234567890',
        issuer: 'FNMT Clase 2 CA',
        subject: 'CN=Test Company',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2026-01-01'),
        environment: 'production',
        isActive: true,
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-123',
      };

      mockPrismaService.spainCertificate.findFirst.mockResolvedValue(
        storedCertificate,
      );
      mockStorageService.decrypt
        .mockResolvedValueOnce(mockCertificateData)
        .mockResolvedValueOnce(Buffer.from(mockPassword));
      mockPrismaService.spainCertificate.update.mockResolvedValue(
        storedCertificate,
      );

      const result = await service.getCertificate({
        organisationId: 'org-456',
        certificateId: 'cert-123',
        context: mockContext,
      });

      expect(result.id).toBe('cert-123');
      expect(result.certificate).toEqual(mockCertificateData);
      expect(result.password).toBe(mockPassword);
      expect(mockStorageService.decrypt).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.spainCertificate.update).toHaveBeenCalledWith({
        where: { id: 'cert-123' },
        data: { lastUsedAt: expect.any(Date) },
      });
    });

    it('should throw error if certificate not found', async () => {
      mockPrismaService.spainCertificate.findFirst.mockResolvedValue(null);

      await expect(
        service.getCertificate({
          organisationId: 'org-456',
          certificateId: 'cert-123',
          context: mockContext,
        }),
      ).rejects.toThrow(SpainCertificateError);
    });

    it('should throw error if certificate expired', async () => {
      const expiredCertificate = {
        id: 'cert-123',
        organisationId: 'org-456',
        validTo: new Date('2020-01-01'), // Expired
        isActive: true,
      };

      mockPrismaService.spainCertificate.findFirst.mockResolvedValue(
        expiredCertificate,
      );

      await expect(
        service.getCertificate({
          organisationId: 'org-456',
          certificateId: 'cert-123',
          context: mockContext,
        }),
      ).rejects.toThrow(SpainCertificateError);
    });
  });

  describe('listCertificates', () => {
    it('should list all certificates for organisation', async () => {
      const certificates = [
        {
          id: 'cert-1',
          organisationId: 'org-456',
          name: 'Certificate 1',
          cifNif: 'B12345678',
          validFrom: new Date('2024-01-01'),
          validTo: new Date('2026-01-01'),
          environment: 'production',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user-123',
        },
        {
          id: 'cert-2',
          organisationId: 'org-456',
          name: 'Certificate 2',
          cifNif: 'B87654321',
          validFrom: new Date('2024-01-01'),
          validTo: new Date('2026-01-01'),
          environment: 'test',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user-123',
        },
      ];

      mockPrismaService.spainCertificate.findMany.mockResolvedValue(
        certificates,
      );

      const result = await service.listCertificates('org-456');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('cert-1');
      expect(result[1].id).toBe('cert-2');
    });

    it('should filter by environment', async () => {
      const certificates = [
        {
          id: 'cert-1',
          organisationId: 'org-456',
          name: 'Certificate 1',
          validFrom: new Date('2024-01-01'),
          validTo: new Date('2026-01-01'),
          environment: 'production',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user-123',
        },
      ];

      mockPrismaService.spainCertificate.findMany.mockResolvedValue(
        certificates,
      );

      await service.listCertificates('org-456', 'production');

      expect(mockPrismaService.spainCertificate.findMany).toHaveBeenCalledWith({
        where: {
          organisationId: 'org-456',
          isActive: true,
          environment: 'production',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('deleteCertificate', () => {
    it('should soft delete a certificate', async () => {
      const certificate = {
        id: 'cert-123',
        organisationId: 'org-456',
        isActive: true,
      };

      mockPrismaService.spainCertificate.findFirst.mockResolvedValue(
        certificate,
      );
      mockPrismaService.spainCertificate.update.mockResolvedValue({
        ...certificate,
        isActive: false,
      });

      await service.deleteCertificate({
        organisationId: 'org-456',
        certificateId: 'cert-123',
        context: mockContext,
      });

      expect(mockPrismaService.spainCertificate.update).toHaveBeenCalledWith({
        where: { id: 'cert-123' },
        data: { isActive: false },
      });
    });

    it('should throw error if certificate not found', async () => {
      mockPrismaService.spainCertificate.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteCertificate({
          organisationId: 'org-456',
          certificateId: 'cert-123',
          context: mockContext,
        }),
      ).rejects.toThrow(SpainCertificateError);
    });
  });

  describe('getExpiringCertificates', () => {
    it('should return certificates expiring within specified days', async () => {
      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + 15); // Expires in 15 days

      const certificates = [
        {
          id: 'cert-1',
          organisationId: 'org-456',
          name: 'Expiring Certificate',
          cifNif: 'B12345678',
          validTo: expiringDate,
          environment: 'production',
          isActive: true,
        },
      ];

      mockPrismaService.spainCertificate.findMany.mockResolvedValue(
        certificates,
      );

      const result = await service.getExpiringCertificates(30);

      expect(result).toHaveLength(1);
      expect(result[0].daysUntilExpiry).toBeGreaterThan(0);
      expect(result[0].daysUntilExpiry).toBeLessThanOrEqual(30);
    });
  });
});
