import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SiiService } from '../sii.service';
import { SiiInvoiceSubmissionService } from '../sii-invoice-submission.service';
import { SiiXmlBuilderService } from '../sii-xml-builder.service';
import { SiiSoapClient } from '../sii-soap.client';
import { SiiErrorHandlerService } from '../sii-error-handler.service';
import { RedisService } from '../../../cache/redis.service';
import {
  SiiInvoiceType,
  SiiVatKey,
  SiiOperationType,
  SiiEnvironment,
} from '../constants/sii.constants';
import { SubmitIssuedInvoiceDto } from '../dto/submit-invoice.dto';

describe('SiiService', () => {
  let service: SiiService;
  let submissionService: SiiInvoiceSubmissionService;
  let soapClient: SiiSoapClient;
  let xmlBuilder: SiiXmlBuilderService;
  let errorHandler: SiiErrorHandlerService;
  let redisService: RedisService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        SII_ENVIRONMENT: SiiEnvironment.TEST,
        SII_TIMEOUT: 60000,
      };
      return config[key];
    }),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockSoapClient = {
    submitIssuedInvoices: jest.fn(),
    submitReceivedInvoices: jest.fn(),
    submitPayments: jest.fn(),
    queryInvoices: jest.fn(),
    deleteInvoice: jest.fn(),
    validateCertificate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SiiService,
        SiiInvoiceSubmissionService,
        SiiXmlBuilderService,
        SiiSoapClient,
        SiiErrorHandlerService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    })
      .overrideProvider(SiiSoapClient)
      .useValue(mockSoapClient)
      .compile();

    service = module.get<SiiService>(SiiService);
    submissionService = module.get<SiiInvoiceSubmissionService>(
      SiiInvoiceSubmissionService,
    );
    soapClient = module.get<SiiSoapClient>(SiiSoapClient);
    xmlBuilder = module.get<SiiXmlBuilderService>(SiiXmlBuilderService);
    errorHandler = module.get<SiiErrorHandlerService>(SiiErrorHandlerService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Environment Configuration', () => {
    it('should initialize in TEST environment', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('SII_ENVIRONMENT');
    });
  });

  describe('Invoice Validation', () => {
    it('should validate NIF format correctly', () => {
      const validNifs = [
        '12345678A', // DNI
        'X1234567A', // NIE
        'A12345678', // CIF
        'B12345678', // CIF
      ];

      validNifs.forEach((nif) => {
        const invoice = createTestInvoice(nif);
        expect(() => errorHandler.validateInvoice(invoice)).not.toThrow();
      });
    });

    it('should reject invalid NIF format', () => {
      const invalidNifs = ['123', 'INVALID', '12345678'];

      invalidNifs.forEach((nif) => {
        const invoice = createTestInvoice(nif);
        expect(() => errorHandler.validateInvoice(invoice)).toThrow();
      });
    });

    it('should validate submission window (4 days)', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 5); // 5 days ago

      const invoice = createTestInvoice('12345678A', oldDate);
      expect(() => errorHandler.validateInvoice(invoice)).toThrow(
        /4 days/,
      );
    });

    it('should accept invoice within submission window', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 2); // 2 days ago

      const invoice = createTestInvoice('12345678A', recentDate);
      expect(() => errorHandler.validateInvoice(invoice)).not.toThrow();
    });

    it('should validate VAT line totals match invoice total', () => {
      const invoice = {
        issuer: { nif: '12345678A', name: 'Test Company' },
        recipient: { nif: 'B87654321', name: 'Customer' },
        invoiceId: {
          invoiceNumber: 'INV-001',
          issueDate: new Date(),
          invoiceType: SiiInvoiceType.F1_STANDARD,
        },
        totalInvoiceAmount: 121.0,
        vatLines: [
          {
            vatKey: SiiVatKey.GENERAL,
            taxableBase: 100.0,
            vatRate: 21.0,
            vatAmount: 21.0,
          },
        ],
        invoiceDescription: 'Test',
        operationType: SiiOperationType.A0,
      };

      expect(() => errorHandler.validateInvoice(invoice)).not.toThrow();
    });

    it('should reject invoice with mismatched totals', () => {
      const invoice = {
        issuer: { nif: '12345678A', name: 'Test Company' },
        recipient: { nif: 'B87654321', name: 'Customer' },
        invoiceId: {
          invoiceNumber: 'INV-001',
          issueDate: new Date(),
          invoiceType: SiiInvoiceType.F1_STANDARD,
        },
        totalInvoiceAmount: 150.0, // Wrong total
        vatLines: [
          {
            vatKey: SiiVatKey.GENERAL,
            taxableBase: 100.0,
            vatRate: 21.0,
            vatAmount: 21.0,
          },
        ],
        invoiceDescription: 'Test',
        operationType: SiiOperationType.A0,
      };

      expect(() => errorHandler.validateInvoice(invoice)).toThrow(
        /does not match/,
      );
    });
  });

  describe('XML Building', () => {
    it('should build valid issued invoices XML', () => {
      const holder = { nif: '12345678A', name: 'Test Company' };
      const invoice = createTestIssuedInvoice();

      const xml = xmlBuilder.buildIssuedInvoicesRequest(
        holder,
        2024,
        '01',
        [invoice],
      );

      expect(xml).toContain('SuministroLRFacturasEmitidas');
      expect(xml).toContain(holder.nif);
      expect(xml).toContain(invoice.invoiceId.invoiceNumber);
    });

    it('should escape XML special characters', () => {
      const holder = { nif: '12345678A', name: 'Test & Company' };
      const invoice = createTestIssuedInvoice();
      invoice.invoiceDescription = 'Test <description> with "quotes"';

      const xml = xmlBuilder.buildIssuedInvoicesRequest(
        holder,
        2024,
        '01',
        [invoice],
      );

      expect(xml).toContain('&amp;');
      expect(xml).toContain('&lt;');
      expect(xml).toContain('&gt;');
      expect(xml).toContain('&quot;');
    });

    it('should format dates as DD-MM-YYYY', () => {
      const invoice = createTestIssuedInvoice();
      const holder = { nif: '12345678A', name: 'Test Company' };

      const xml = xmlBuilder.buildIssuedInvoicesRequest(
        holder,
        2024,
        '01',
        [invoice],
      );

      // Should contain date in DD-MM-YYYY format
      expect(xml).toMatch(/\d{2}-\d{2}-\d{4}/);
    });

    it('should include all VAT lines', () => {
      const invoice = createTestIssuedInvoice();
      invoice.vatLines.push({
        vatKey: SiiVatKey.REDUCED,
        taxableBase: 50.0,
        vatRate: 10.0,
        vatAmount: 5.0,
      });

      const holder = { nif: '12345678A', name: 'Test Company' };
      const xml = xmlBuilder.buildIssuedInvoicesRequest(
        holder,
        2024,
        '01',
        [invoice],
      );

      expect(xml).toContain('DetalleIVA');
      expect(xml).toContain('21.00'); // General rate
      expect(xml).toContain('10.00'); // Reduced rate
    });
  });

  describe('Error Handling', () => {
    it('should map authentication errors correctly', () => {
      expect(() =>
        errorHandler.handleError('1001', 'Invalid certificate'),
      ).toThrow('UnauthorizedException');
    });

    it('should map validation errors correctly', () => {
      expect(() =>
        errorHandler.handleError('2001', 'Invalid NIF'),
      ).toThrow('BadRequestException');
    });

    it('should map duplicate invoice to ConflictException', () => {
      expect(() => errorHandler.handleError('2005', 'Duplicate')).toThrow(
        'ConflictException',
      );
    });

    it('should map system errors correctly', () => {
      expect(() =>
        errorHandler.handleError('5001', 'Service unavailable'),
      ).toThrow('ServiceUnavailableException');
    });
  });

  describe('Caching', () => {
    it('should cache submission results', async () => {
      const submissionId = 'SII-123456';
      const cached = {
        submissionId,
        status: 'ACCEPTED',
        submittedAt: new Date().toISOString(),
        invoiceCount: 1,
        acceptedCount: 1,
        rejectedCount: 0,
      };

      mockRedisService.get.mockResolvedValue(cached);

      const result = await submissionService.getSubmissionStatus(
        submissionId,
      );

      expect(result).toBeDefined();
      expect(result.submissionId).toBe(submissionId);
      expect(mockRedisService.get).toHaveBeenCalled();
    });
  });

  // Helper functions
  function createTestInvoice(nif: string, issueDate: Date = new Date()) {
    return {
      issuer: { nif, name: 'Test Company' },
      recipient: { nif: 'B87654321', name: 'Customer' },
      invoiceId: {
        invoiceNumber: 'INV-001',
        issueDate,
        invoiceType: SiiInvoiceType.F1_STANDARD,
      },
      totalInvoiceAmount: 121.0,
      vatLines: [
        {
          vatKey: SiiVatKey.GENERAL,
          taxableBase: 100.0,
          vatRate: 21.0,
          vatAmount: 21.0,
        },
      ],
      invoiceDescription: 'Test invoice',
      operationType: SiiOperationType.A0,
    };
  }

  function createTestIssuedInvoice() {
    return {
      invoiceId: {
        invoiceNumber: 'INV-001',
        issueDate: new Date(),
        invoiceType: SiiInvoiceType.F1_STANDARD,
      },
      issuer: { nif: '12345678A', name: 'Test Company' },
      recipient: { nif: 'B87654321', name: 'Customer' },
      operationType: SiiOperationType.A0,
      invoiceDescription: 'Test invoice',
      totalInvoiceAmount: 121.0,
      vatLines: [
        {
          vatKey: SiiVatKey.GENERAL,
          taxableBase: 100.0,
          vatRate: 21.0,
          vatAmount: 21.0,
        },
      ],
    };
  }
});
