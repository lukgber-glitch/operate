import { Test, TestingModule } from '@nestjs/testing';
import { EInvoiceValidationService } from './e-invoice-validation.service';
import { ZugferdService } from './zugferd.service';
import { XRechnungService } from './xrechnung.service';
import {
  EInvoiceFormat,
  RecipientType,
  BusinessRule,
} from '../types/validation.types';
import { InvoiceData } from '../types/zugferd.types';

describe('EInvoiceValidationService', () => {
  let service: EInvoiceValidationService;
  let zugferdService: jest.Mocked<ZugferdService>;
  let xrechnungService: jest.Mocked<XRechnungService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EInvoiceValidationService,
        {
          provide: ZugferdService,
          useValue: {
            validateZugferdPdf: jest.fn(),
          },
        },
        {
          provide: XRechnungService,
          useValue: {
            validateXRechnung: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EInvoiceValidationService>(
      EInvoiceValidationService,
    );
    zugferdService = module.get(ZugferdService);
    xrechnungService = module.get(XRechnungService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectFormat', () => {
    it('should detect ZUGFeRD PDF format', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.5\nZUGFeRD content...');

      const result = await service.detectFormat(pdfBuffer);

      expect(result.format).toBe(EInvoiceFormat.ZUGFERD);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.method).toBe('pdf-attachment');
    });

    it('should detect XRechnung UBL format', async () => {
      const ublXml = `<?xml version="1.0"?>
        <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
          <cbc:ID>INV-001</cbc:ID>
        </Invoice>`;

      const result = await service.detectFormat(ublXml);

      expect(result.format).toBe(EInvoiceFormat.XRECHNUNG_UBL);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.hints?.rootElement).toBe('Invoice');
    });

    it('should detect XRechnung CII format', async () => {
      const ciiXml = `<?xml version="1.0"?>
        <rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100">
          <rsm:ExchangedDocument>
            <ram:ID>INV-001</ram:ID>
          </rsm:ExchangedDocument>
        </rsm:CrossIndustryInvoice>`;

      const result = await service.detectFormat(ciiXml);

      expect(result.format).toBe(EInvoiceFormat.XRECHNUNG_CII);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.hints?.rootElement).toBe('CrossIndustryInvoice');
    });

    it('should return UNKNOWN for invalid format', async () => {
      const invalidData = Buffer.from('Invalid content');

      const result = await service.detectFormat(invalidData);

      expect(result.format).toBe(EInvoiceFormat.UNKNOWN);
      expect(result.confidence).toBe(0);
    });
  });

  describe('validateZugferd', () => {
    it('should validate ZUGFeRD PDF successfully', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.5');
      const mockResult = {
        valid: true,
        errors: [],
        warnings: [],
      };

      zugferdService.validateZugferdPdf.mockResolvedValue(mockResult);

      const result = await service.validateZugferd(pdfBuffer);

      expect(result.valid).toBe(true);
      expect(result.format).toBe(EInvoiceFormat.ZUGFERD);
      expect(zugferdService.validateZugferdPdf).toHaveBeenCalledWith(pdfBuffer);
    });
  });

  describe('validateXRechnung', () => {
    it('should validate XRechnung UBL successfully', async () => {
      const ublXml = `<?xml version="1.0"?>
        <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
          <cbc:ID>INV-001</cbc:ID>
        </Invoice>`;

      const mockResult = {
        valid: true,
        errors: [],
        warnings: [],
      };

      xrechnungService.validateXRechnung.mockResolvedValue(mockResult);

      const result = await service.validateXRechnung(ublXml);

      expect(result.valid).toBe(true);
      expect(result.format).toBe(EInvoiceFormat.XRECHNUNG_UBL);
      expect(result.metadata?.xmlValidated).toBe(true);
    });

    it('should validate XRechnung CII successfully', async () => {
      const ciiXml = `<?xml version="1.0"?>
        <rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100">
        </rsm:CrossIndustryInvoice>`;

      const mockResult = {
        valid: true,
        errors: [],
        warnings: [],
      };

      xrechnungService.validateXRechnung.mockResolvedValue(mockResult);

      const result = await service.validateXRechnung(ciiXml);

      expect(result.valid).toBe(true);
      expect(result.format).toBe(EInvoiceFormat.XRECHNUNG_CII);
    });
  });

  describe('checkBusinessRules', () => {
    const validInvoice: InvoiceData = {
      number: 'INV-2025-001',
      issueDate: new Date('2025-01-15'),
      dueDate: new Date('2025-02-15'),
      currency: 'EUR',
      seller: {
        name: 'Test Seller GmbH',
        vatId: 'DE123456789',
        address: {
          line1: 'Teststraße 1',
          city: 'Berlin',
          postalCode: '10115',
          country: 'DE',
        },
      },
      buyer: {
        name: 'Test Buyer AG',
        address: {
          line1: 'Kaufstraße 2',
          city: 'München',
          postalCode: '80331',
          country: 'DE',
        },
      },
      items: [
        {
          description: 'Service A',
          quantity: 2,
          unitPrice: 100,
          amount: 200,
        },
      ],
      subtotal: 200,
      taxAmount: 38,
      totalAmount: 238,
      vatRate: 19,
    };

    it('should pass all core business rules for valid invoice', async () => {
      const result = await service.checkBusinessRules(validInvoice);

      expect(result.passed).toBe(true);
      expect(result.violations.filter((v) => v.severity === 'error')).toHaveLength(
        0,
      );
    });

    it('should fail BR-01 when invoice number is missing', async () => {
      const invalidInvoice = { ...validInvoice, number: '' };

      const result = await service.checkBusinessRules(invalidInvoice);

      expect(result.passed).toBe(false);
      const violation = result.violations.find((v) => v.rule === BusinessRule.BR_01);
      expect(violation).toBeDefined();
      expect(violation?.severity).toBe('error');
    });

    it('should fail BR-15 when due date is before issue date', async () => {
      const invalidInvoice = {
        ...validInvoice,
        issueDate: new Date('2025-02-15'),
        dueDate: new Date('2025-01-15'),
      };

      const result = await service.checkBusinessRules(invalidInvoice);

      expect(result.passed).toBe(false);
      const violation = result.violations.find((v) => v.rule === BusinessRule.BR_15);
      expect(violation).toBeDefined();
      expect(violation?.field).toBe('dueDate');
    });

    it('should fail BR-11 when no line items present', async () => {
      const invalidInvoice = { ...validInvoice, items: [] };

      const result = await service.checkBusinessRules(invalidInvoice);

      expect(result.passed).toBe(false);
      const violation = result.violations.find((v) => v.rule === BusinessRule.BR_11);
      expect(violation).toBeDefined();
    });

    it('should check German rules when country is DE', async () => {
      const germanInvoice = { ...validInvoice };

      const result = await service.checkBusinessRules(germanInvoice, {
        country: 'DE',
        recipientType: RecipientType.B2G,
      });

      // Should fail BR-DE-01 (missing Leitweg-ID for B2G)
      const violation = result.violations.find(
        (v) => v.rule === BusinessRule.BR_DE_01,
      );
      expect(violation).toBeDefined();
    });

    it('should validate line item calculations (BR-DE-14)', async () => {
      const invalidInvoice = {
        ...validInvoice,
        items: [
          {
            description: 'Product',
            quantity: 3,
            unitPrice: 10,
            amount: 25, // Should be 30
          },
        ],
      };

      const result = await service.checkBusinessRules(invalidInvoice, {
        country: 'DE',
        recipientType: RecipientType.B2B,
      });

      const violation = result.violations.find(
        (v) => v.rule === BusinessRule.BR_DE_14,
      );
      expect(violation).toBeDefined();
      expect(violation?.expected).toBe('30.00');
      expect(violation?.actual).toBe('25.00');
    });

    it('should validate total calculations (BR-DE-19)', async () => {
      const invalidInvoice = {
        ...validInvoice,
        subtotal: 200,
        taxAmount: 38,
        totalAmount: 240, // Should be 238
      };

      const result = await service.checkBusinessRules(invalidInvoice, {
        country: 'DE',
        recipientType: RecipientType.B2B,
      });

      const violation = result.violations.find(
        (v) => v.rule === BusinessRule.BR_DE_19,
      );
      expect(violation).toBeDefined();
    });
  });

  describe('validateForRecipient', () => {
    const baseInvoice: InvoiceData = {
      number: 'INV-001',
      issueDate: new Date(),
      dueDate: new Date(),
      currency: 'EUR',
      seller: {
        name: 'Seller',
        vatId: 'DE123456789',
        address: {
          line1: 'Street 1',
          city: 'City',
          postalCode: '12345',
          country: 'DE',
        },
      },
      buyer: {
        name: 'Buyer',
        address: {
          line1: 'Street 2',
          city: 'City',
          postalCode: '12345',
          country: 'DE',
        },
      },
      items: [{ description: 'Item', quantity: 1, unitPrice: 100, amount: 100 }],
      subtotal: 100,
      taxAmount: 19,
      totalAmount: 119,
    };

    it('should validate B2B invoice successfully', async () => {
      const result = await service.validateForRecipient(
        baseInvoice,
        RecipientType.B2B,
      );

      expect(result.valid).toBe(true);
      expect(result.recipientType).toBe(RecipientType.B2B);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should require Leitweg-ID for B2G', async () => {
      const result = await service.validateForRecipient(
        baseInvoice,
        RecipientType.B2G,
      );

      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('leitwegId');
    });

    it('should pass B2G validation with valid Leitweg-ID', async () => {
      const b2gInvoice = {
        ...baseInvoice,
        leitwegId: '99-11111-222222',
        paymentTerms: 'Net 30',
        bankDetails: {
          accountHolder: 'Test',
          iban: 'DE89370400440532013000',
        },
      };

      const result = await service.validateForRecipient(
        b2gInvoice,
        RecipientType.B2G,
      );

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about non-EUR currency for B2G', async () => {
      const usdInvoice = {
        ...baseInvoice,
        currency: 'USD',
        leitwegId: '99-11111-222222',
      };

      const result = await service.validateForRecipient(
        usdInvoice,
        RecipientType.B2G,
      );

      expect(result.warnings).toContain(
        'German B2G invoices should use EUR currency',
      );
    });

    it('should provide recommendations for B2B', async () => {
      const result = await service.validateForRecipient(
        baseInvoice,
        RecipientType.B2B,
      );

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations?.length).toBeGreaterThan(0);
    });
  });
});
