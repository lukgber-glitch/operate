import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { ZatcaCertificateService } from '../zatca-certificate.service';
import { ZatcaCsrService } from '../zatca-csr.service';
import { ZatcaAuditService } from '../zatca-audit.service';
import { KeyManagementService } from '@/modules/security/key-management.service';
import { PrismaService } from '@/modules/database/prisma.service';
import { of } from 'rxjs';

describe('ZatcaCertificateService', () => {
  let service: ZatcaCertificateService;
  let prismaService: PrismaService;
  let csrService: ZatcaCsrService;
  let keyManagement: KeyManagementService;
  let httpService: HttpService;

  const mockPrismaService = {
    zatcaCertificate: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    zatcaCertificateAuditLog: {
      create: jest.fn(),
    },
  };

  const mockCsrService = {
    generateKeyPair: jest.fn(),
    generateCSR: jest.fn(),
    getCsrFingerprint: jest.fn(),
  };

  const mockKeyManagement = {
    generateKeyId: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockAuditService = {
    logAction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZatcaCertificateService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ZatcaCsrService,
          useValue: mockCsrService,
        },
        {
          provide: KeyManagementService,
          useValue: mockKeyManagement,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ZatcaAuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<ZatcaCertificateService>(ZatcaCertificateService);
    prismaService = module.get<PrismaService>(PrismaService);
    csrService = module.get<ZatcaCsrService>(ZatcaCsrService);
    keyManagement = module.get<KeyManagementService>(KeyManagementService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCertificate', () => {
    const organisationId = 'org-123';
    const userId = 'user-123';
    const createDto = {
      name: 'Test Certificate',
      certificateType: 'COMPLIANCE' as const,
      invoiceType: 'TAX_INVOICE' as const,
      commonName: 'Test Company',
      organizationName: 'Test Company LLC',
      organizationUnit: '300000000000003',
      environment: 'sandbox' as const,
    };

    it('should create a certificate successfully', async () => {
      // Mock key pair generation
      mockCsrService.generateKeyPair.mockReturnValue({
        privateKey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
        publicKey: '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----',
      });

      // Mock encryption
      mockKeyManagement.generateKeyId.mockReturnValue('key_123');
      mockKeyManagement.encrypt.mockReturnValue({
        encryptedData: Buffer.from('encrypted'),
        iv: Buffer.from('iv'),
        authTag: Buffer.from('authTag'),
      });

      // Mock CSR generation
      mockCsrService.generateCSR.mockResolvedValue({
        csr: 'base64CSR',
        subject: 'C=SA,O=Test Company LLC,OU=300000000000003,CN=Test Company',
      });

      mockCsrService.getCsrFingerprint.mockReturnValue('fingerprint123');

      // Mock certificate creation
      const mockCertificate = {
        id: 'cert-123',
        organisationId,
        name: createDto.name,
        certificateType: createDto.certificateType,
        invoiceType: createDto.invoiceType,
        csidStatus: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
        validFrom: new Date(),
        validTo: new Date(),
      };

      mockPrismaService.zatcaCertificate.create.mockResolvedValue(mockCertificate);
      mockPrismaService.zatcaCertificate.findUnique.mockResolvedValue(mockCertificate);

      // Mock CSID request
      mockHttpService.post.mockReturnValue(
        of({
          data: {
            binarySecurityToken: 'token123',
            secret: 'secret123',
            requestID: 'req-123',
          },
        }),
      );

      // Execute
      const result = await service.createCertificate(organisationId, userId, createDto);

      // Verify
      expect(result).toBeDefined();
      expect(mockCsrService.generateKeyPair).toHaveBeenCalled();
      expect(mockKeyManagement.encrypt).toHaveBeenCalled();
      expect(mockCsrService.generateCSR).toHaveBeenCalled();
      expect(mockPrismaService.zatcaCertificate.create).toHaveBeenCalled();
      expect(mockAuditService.logAction).toHaveBeenCalled();
    });
  });

  describe('getCertificate', () => {
    it('should return certificate without sensitive data', async () => {
      const mockCertificate = {
        id: 'cert-123',
        organisationId: 'org-123',
        name: 'Test Certificate',
        encryptedPrivateKey: Buffer.from('encrypted'),
        encryptionKeyId: 'key-123',
        iv: Buffer.from('iv'),
        authTag: Buffer.from('authTag'),
        csidSecret: 'secret',
        otp: '123456',
        auditLogs: [],
      };

      mockPrismaService.zatcaCertificate.findUnique.mockResolvedValue(mockCertificate);

      const result = await service.getCertificate('cert-123');

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('encryptedPrivateKey');
      expect(result).not.toHaveProperty('encryptionKeyId');
      expect(result).not.toHaveProperty('csidSecret');
      expect(result).not.toHaveProperty('otp');
    });
  });

  describe('checkExpiry', () => {
    it('should correctly identify expired certificate', async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 10);

      mockPrismaService.zatcaCertificate.findUnique.mockResolvedValue({
        id: 'cert-123',
        validTo: expiredDate,
      });

      const result = await service.checkExpiry('cert-123');

      expect(result.isExpired).toBe(true);
      expect(result.daysUntilExpiry).toBeLessThan(0);
    });

    it('should identify certificate needing renewal', async () => {
      const soonToExpire = new Date();
      soonToExpire.setDate(soonToExpire.getDate() + 25);

      mockPrismaService.zatcaCertificate.findUnique.mockResolvedValue({
        id: 'cert-123',
        validTo: soonToExpire,
      });

      const result = await service.checkExpiry('cert-123');

      expect(result.isExpired).toBe(false);
      expect(result.needsRenewal).toBe(true);
      expect(result.daysUntilExpiry).toBeLessThanOrEqual(30);
    });
  });

  describe('activateCertificate', () => {
    it('should activate an approved certificate', async () => {
      const mockCertificate = {
        id: 'cert-123',
        organisationId: 'org-123',
        csidStatus: 'ACTIVE',
      };

      mockPrismaService.zatcaCertificate.findUnique.mockResolvedValue(mockCertificate);
      mockPrismaService.zatcaCertificate.update.mockResolvedValue({
        ...mockCertificate,
        isActive: true,
      });

      await service.activateCertificate('cert-123', 'user-123');

      expect(mockPrismaService.zatcaCertificate.update).toHaveBeenCalledWith({
        where: { id: 'cert-123' },
        data: { isActive: true },
      });
      expect(mockAuditService.logAction).toHaveBeenCalled();
    });

    it('should throw error if certificate CSID is not active', async () => {
      mockPrismaService.zatcaCertificate.findUnique.mockResolvedValue({
        id: 'cert-123',
        csidStatus: 'PENDING',
      });

      await expect(
        service.activateCertificate('cert-123', 'user-123'),
      ).rejects.toThrow('Certificate CSID is not active');
    });
  });

  describe('getPrivateKey', () => {
    it('should decrypt and return private key with audit log', async () => {
      const mockCertificate = {
        id: 'cert-123',
        organisationId: 'org-123',
        encryptedPrivateKey: Buffer.from('encrypted'),
        iv: Buffer.from('iv'),
        authTag: Buffer.from('authTag'),
        encryptionKeyId: 'key-123',
      };

      mockPrismaService.zatcaCertificate.findUnique.mockResolvedValue(mockCertificate);
      mockKeyManagement.decrypt.mockReturnValue(
        Buffer.from('-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----'),
      );

      const result = await service.getPrivateKey('cert-123', 'user-123');

      expect(result).toContain('BEGIN PRIVATE KEY');
      expect(mockKeyManagement.decrypt).toHaveBeenCalled();
      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: expect.stringContaining('private_key_accessed'),
        }),
      );
    });
  });

  describe('listCertificates', () => {
    it('should list certificates with filters', async () => {
      const mockCertificates = [
        {
          id: 'cert-1',
          name: 'Certificate 1',
          isActive: true,
          certificateType: 'COMPLIANCE',
        },
        {
          id: 'cert-2',
          name: 'Certificate 2',
          isActive: true,
          certificateType: 'PRODUCTION',
        },
      ];

      mockPrismaService.zatcaCertificate.findMany.mockResolvedValue(mockCertificates);

      const result = await service.listCertificates('org-123', {
        isActive: true,
      });

      expect(result).toHaveLength(2);
      expect(mockPrismaService.zatcaCertificate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organisationId: 'org-123',
            isActive: true,
          }),
        }),
      );
    });
  });
});
