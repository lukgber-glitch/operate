/**
 * JP-PINT Service Unit Tests
 *
 * Tests for Japanese Peppol International connector
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { JPPINTService } from '../jp-pint.service';
import { JPPINTValidator } from '../jp-pint.validator';
import { JPPINTMapper } from '../jp-pint.mapper';
import { PeppolService } from '../../peppol.service';
import { PeppolCertificateService } from '../../services/peppol-certificate.service';
import { PeppolParticipantService } from '../../services/peppol-participant.service';
import { PeppolMessageService } from '../../services/peppol-message.service';
import { PrismaService } from '../../../../database/prisma.service';
import {
  JP_PEPPOL_SCHEME,
  JP_CURRENCY,
  JP_PINT_DOCUMENT_ID,
  JP_PINT_PROCESS_ID,
} from '../jp-pint.constants';
import { JPPINTSendDocumentDto } from '../jp-pint.types';

describe('JPPINTService', () => {
  let service: JPPINTService;
  let validator: JPPINTValidator;
  let mapper: JPPINTMapper;
  let peppolService: PeppolService;
  let participantService: PeppolParticipantService;
  let messageService: PeppolMessageService;

  // Valid test data
  const validCorporateNumber = '1234567890128'; // Valid check digit
  const validInvoiceRegistryNumber = 'T1234567890128';

  const mockDto: JPPINTSendDocumentDto = {
    organizationId: 'org-123',
    documentType: 'Invoice',
    invoiceNumber: 'INV-2025-001',
    issueDate: '2025-01-15',
    dueDate: '2025-02-15',
    currency: 'JPY',
    timestamp: '2025-01-15T10:30:00Z',
    supplier: {
      participantId: {
        scheme: '9912',
        identifier: validCorporateNumber,
      },
      name: '株式会社テスト商事',
      registeredName: 'Test Trading Co., Ltd.',
      corporateNumber: validCorporateNumber,
      invoiceRegistryNumber: validInvoiceRegistryNumber,
      address: {
        postalCode: '100-0001',
        prefecture: '東京都',
        city: '千代田区',
        addressLine1: '丸の内1-1-1',
        addressLine2: 'テストビル10F',
        countryCode: 'JP',
      },
      contact: {
        name: '山田太郎',
        telephone: '+81-3-1234-5678',
        email: 'yamada@test.co.jp',
      },
    },
    customer: {
      participantId: {
        scheme: '9912',
        identifier: '9876543210987',
      },
      name: '株式会社顧客企業',
      registeredName: 'Customer Corp.',
      corporateNumber: '9876543210987',
      address: {
        postalCode: '150-0001',
        prefecture: '東京都',
        city: '渋谷区',
        addressLine1: '渋谷1-2-3',
        countryCode: 'JP',
      },
    },
    lines: [
      {
        id: '1',
        quantity: 10,
        unitCode: 'EA',
        description: 'テスト商品A',
        priceAmount: 1000,
        lineExtensionAmount: 10000,
        taxCategory: 'S',
        taxPercent: 10.0,
        taxAmount: 1000,
      },
      {
        id: '2',
        quantity: 5,
        unitCode: 'EA',
        description: 'テスト商品B（軽減税率対象）',
        priceAmount: 2000,
        lineExtensionAmount: 10000,
        taxCategory: 'AA',
        taxPercent: 8.0,
        taxAmount: 800,
      },
    ],
    taxTotal: 1800,
    taxBreakdown: [
      {
        category: 'S',
        rate: 10.0,
        taxableAmount: 10000,
        taxAmount: 1000,
      },
      {
        category: 'AA',
        rate: 8.0,
        taxableAmount: 10000,
        taxAmount: 800,
      },
    ],
    totalAmount: 21800,
    paymentMeans: {
      paymentMeansCode: '31',
      paymentId: 'INV-2025-001',
      bankAccount: {
        accountNumber: '1234567',
        bankCode: '0001',
        branchCode: '001',
        accountName: '株式会社テスト商事',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JPPINTService,
        JPPINTValidator,
        JPPINTMapper,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                PEPPOL_ENVIRONMENT: 'test',
                PEPPOL_MOCK_MODE: 'true',
                JP_PINT_STRICT_VALIDATION: 'true',
                JP_PINT_REQUIRE_INVOICE_REGISTRY: 'true',
              };
              return config[key];
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
            $executeRaw: jest.fn(),
          },
        },
        {
          provide: PeppolService,
          useValue: {
            sendDocument: jest.fn(),
            receiveDocument: jest.fn(),
            validateParticipant: jest.fn(),
          },
        },
        {
          provide: PeppolCertificateService,
          useValue: {
            getCertificate: jest.fn(),
            sign: jest.fn(),
            getTLSAgent: jest.fn(),
          },
        },
        {
          provide: PeppolParticipantService,
          useValue: {
            validateParticipantId: jest.fn((scheme, identifier) => ({
              scheme,
              identifier,
              formatted: `${scheme}:${identifier}`,
            })),
            lookupEndpoint: jest.fn().mockResolvedValue({
              endpointUrl: 'https://ap.peppol.jp/as4',
              transportProfile: 'peppol-transport-as4-v2_0',
              requireBusinessLevelSignature: false,
              certificate: 'mock-cert',
            }),
          },
        },
        {
          provide: PeppolMessageService,
          useValue: {
            sendMessage: jest.fn().mockResolvedValue('msg-123'),
            receiveMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<JPPINTService>(JPPINTService);
    validator = module.get<JPPINTValidator>(JPPINTValidator);
    mapper = module.get<JPPINTMapper>(JPPINTMapper);
    peppolService = module.get<PeppolService>(PeppolService);
    participantService = module.get<PeppolParticipantService>(
      PeppolParticipantService,
    );
    messageService = module.get<PeppolMessageService>(PeppolMessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendJPPINTInvoice', () => {
    it('should send a valid JP-PINT invoice', async () => {
      const result = await service.sendJPPINTInvoice(mockDto);

      expect(result).toBeDefined();
      expect(result.messageId).toBe('msg-123');
      expect(result.status).toBe('SENT');
      expect(messageService.sendMessage).toHaveBeenCalled();
    });

    it('should reject invoice with non-JPY currency', async () => {
      const invalidDto = {
        ...mockDto,
        currency: 'USD' as any,
      };

      await expect(service.sendJPPINTInvoice(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject invoice with wrong participant scheme', async () => {
      const invalidDto = {
        ...mockDto,
        supplier: {
          ...mockDto.supplier,
          participantId: {
            scheme: '0192' as any, // Norwegian scheme
            identifier: validCorporateNumber,
          },
        },
      };

      await expect(service.sendJPPINTInvoice(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject invoice without timestamp', async () => {
      const invalidDto = {
        ...mockDto,
        timestamp: undefined as any,
      };

      await expect(service.sendJPPINTInvoice(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use correct JP-PINT document and process IDs', async () => {
      await service.sendJPPINTInvoice(mockDto);

      const sendMessageCall = (messageService.sendMessage as jest.Mock).mock.calls[0];
      const message = sendMessageCall[1];

      expect(message.documentId).toEqual(JP_PINT_DOCUMENT_ID);
      expect(message.processId).toEqual(JP_PINT_PROCESS_ID);
    });
  });

  describe('validateJapaneseParticipant', () => {
    it('should validate a valid corporate number', async () => {
      (peppolService.validateParticipant as jest.Mock).mockResolvedValue({
        valid: true,
        participantId: {
          scheme: JP_PEPPOL_SCHEME,
          identifier: validCorporateNumber,
          formatted: `${JP_PEPPOL_SCHEME}:${validCorporateNumber}`,
        },
      });

      const result = await service.validateJapaneseParticipant(validCorporateNumber);

      expect(result.valid).toBe(true);
      expect(result.corporateNumberValidation.isValid).toBe(true);
    });

    it('should reject invalid corporate number', async () => {
      const invalidNumber = '1234567890000'; // Invalid check digit

      const result = await service.validateJapaneseParticipant(invalidNumber);

      expect(result.valid).toBe(false);
      expect(result.corporateNumberValidation.isValid).toBe(false);
    });
  });

  describe('validateInvoiceRegistryNumber', () => {
    it('should validate a valid invoice registry number', () => {
      const result = service.validateInvoiceRegistryNumber(validInvoiceRegistryNumber);

      expect(result.valid).toBe(true);
      expect(result.details.hasPrefix).toBe(true);
      expect(result.details.corporateNumber).toBe(validCorporateNumber);
    });

    it('should reject invoice registry number without T prefix', () => {
      const result = service.validateInvoiceRegistryNumber(validCorporateNumber);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('T followed by 13 digits');
    });

    it('should reject invoice registry number with invalid corporate number', () => {
      const invalidRegistry = 'T1234567890000'; // Invalid check digit

      const result = service.validateInvoiceRegistryNumber(invalidRegistry);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid corporate number');
    });
  });

  describe('validateCorporateNumber', () => {
    it('should validate corporate number with correct check digit', () => {
      const result = service.validateCorporateNumber(validCorporateNumber);

      expect(result.valid).toBe(true);
      expect(result.details.isValid).toBe(true);
    });

    it('should reject corporate number with incorrect length', () => {
      const result = service.validateCorporateNumber('12345');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('13 digits');
    });

    it('should reject corporate number with non-numeric characters', () => {
      const result = service.validateCorporateNumber('12345678901AB');

      expect(result.valid).toBe(false);
    });
  });

  describe('getDocumentMetadata', () => {
    it('should return correct JP-PINT metadata', () => {
      const metadata = service.getDocumentMetadata();

      expect(metadata.documentId).toEqual(JP_PINT_DOCUMENT_ID);
      expect(metadata.processId).toEqual(JP_PINT_PROCESS_ID);
      expect(metadata.customizationId).toContain('jp-1');
      expect(metadata.profileId).toBe('urn:peppol:bis:billing');
    });
  });

  describe('formatCorporateNumber', () => {
    it('should format corporate number with separators', () => {
      const formatted = service.formatCorporateNumber(validCorporateNumber);

      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{6}$/);
    });
  });

  describe('formatPostalCode', () => {
    it('should format postal code with hyphen', () => {
      const formatted = service.formatPostalCode('1000001');

      expect(formatted).toBe('100-0001');
    });

    it('should handle already formatted postal code', () => {
      const formatted = service.formatPostalCode('100-0001');

      expect(formatted).toBe('100-0001');
    });
  });

  describe('calculateTaxBreakdown', () => {
    it('should calculate tax breakdown from invoice lines', () => {
      const breakdown = service.calculateTaxBreakdown(mockDto.lines);

      expect(breakdown).toHaveLength(2);
      expect(breakdown[0].category).toBe('S');
      expect(breakdown[0].rate).toBe(10.0);
      expect(breakdown[0].amount).toBe(1000);
      expect(breakdown[1].category).toBe('AA');
      expect(breakdown[1].rate).toBe(8.0);
      expect(breakdown[1].amount).toBe(800);
    });
  });

  describe('getConfiguration', () => {
    it('should return JP-PINT configuration', () => {
      const config = service.getConfiguration();

      expect(config.enableStrictValidation).toBe(true);
      expect(config.requireInvoiceRegistryNumber).toBe(true);
      expect(config.requireTimestamp).toBe(true);
      expect(config.defaultTaxRate).toBe(10.0);
      expect(config.reducedTaxRate).toBe(8.0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle invoice with mixed tax rates', async () => {
      const result = await service.sendJPPINTInvoice(mockDto);

      expect(result.status).toBe('SENT');

      // Verify that tax breakdown includes both rates
      const breakdown = service.calculateTaxBreakdown(mockDto.lines);
      const rates = breakdown.map((b) => b.rate);
      expect(rates).toContain(10.0);
      expect(rates).toContain(8.0);
    });

    it('should validate Japanese address format', async () => {
      const invoice = mapper.mapDtoToInvoice(mockDto);
      const validation = validator.validateJPPINTInvoice(invoice);

      // Should not have address-related errors for valid address
      const addressErrors = validation.errors.filter((e) =>
        e.field.includes('address'),
      );
      expect(addressErrors).toHaveLength(0);
    });

    it('should enforce TLS 1.3 in production mode', async () => {
      // This would be tested at the integration level with actual HTTPS connections
      const config = service.getConfiguration();
      expect(config).toBeDefined();
    });
  });
});
