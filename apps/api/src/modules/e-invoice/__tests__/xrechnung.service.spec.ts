import { Test, TestingModule } from '@nestjs/testing';
import { XRechnungService } from '../services/xrechnung.service';
import {
  XRechnungSyntax,
  InvoiceData,
} from '../types/xrechnung.types';

describe('XRechnungService', () => {
  let service: XRechnungService;

  const mockInvoiceData: InvoiceData = {
    number: 'INV-2024-001',
    issueDate: new Date('2024-12-01'),
    dueDate: new Date('2024-12-31'),
    currency: 'EUR',
    subtotal: 1000,
    taxAmount: 190,
    totalAmount: 1190,
    vatRate: 19,
    seller: {
      name: 'Test Company GmbH',
      vatId: 'DE123456789',
      address: {
        street: 'Musterstraße 1',
        city: 'Berlin',
        postalCode: '10115',
        country: 'DE',
      },
      email: 'seller@example.com',
      phone: '+49 30 12345678',
    },
    buyer: {
      name: 'Bundesamt für Test',
      vatId: 'DE987654321',
      address: {
        street: 'Behördenstraße 10',
        city: 'Berlin',
        postalCode: '10117',
        country: 'DE',
      },
      email: 'buyer@bundesamt.de',
      buyerReference: 'REF-2024-12345',
    },
    items: [
      {
        description: 'Consulting Services',
        quantity: 10,
        unitPrice: 100,
        amount: 1000,
        taxRate: 19,
        taxAmount: 190,
        unit: 'HUR', // Hour
      },
    ],
    leitwegId: '99-12345-123456',
    purchaseOrderReference: 'PO-2024-001',
    contractReference: 'CONTRACT-2024-001',
    paymentTerms: '30 days net',
    bankDetails: {
      accountHolder: 'Test Company GmbH',
      iban: 'DE89370400440532013000',
      bic: 'COBADEFFXXX',
      bankName: 'Commerzbank',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XRechnungService],
    }).compile();

    service = module.get<XRechnungService>(XRechnungService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateXRechnung', () => {
    it('should generate UBL XML successfully', async () => {
      const xml = await service.generateXRechnung(
        mockInvoiceData,
        XRechnungSyntax.UBL,
      );

      expect(xml).toBeDefined();
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<Invoice');
      expect(xml).toContain('urn:oasis:names:specification:ubl:schema:xsd:Invoice-2');
      expect(xml).toContain('<cbc:ID>INV-2024-001</cbc:ID>');
      expect(xml).toContain('<cbc:BuyerReference>REF-2024-12345</cbc:BuyerReference>');
      expect(xml).toContain('Test Company GmbH');
      expect(xml).toContain('Bundesamt für Test');
      expect(xml).toContain('DE123456789');
    });

    it('should generate CII XML successfully', async () => {
      const xml = await service.generateXRechnung(
        mockInvoiceData,
        XRechnungSyntax.CII,
      );

      expect(xml).toBeDefined();
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('CrossIndustryInvoice');
      expect(xml).toContain('<ram:ID>INV-2024-001</ram:ID>');
      expect(xml).toContain('<ram:BuyerReference>REF-2024-12345</ram:BuyerReference>');
      expect(xml).toContain('Test Company GmbH');
      expect(xml).toContain('Bundesamt für Test');
    });

    it('should throw error if invoice is not compliant', async () => {
      const incompleteInvoice: InvoiceData = {
        ...mockInvoiceData,
        buyer: {
          ...mockInvoiceData.buyer,
          buyerReference: undefined,
        },
        leitwegId: undefined,
      };

      await expect(
        service.generateXRechnung(incompleteInvoice, XRechnungSyntax.UBL),
      ).rejects.toThrow('Invoice does not meet XRechnung requirements');
    });
  });

  describe('validateXRechnung', () => {
    it('should validate valid UBL XML', async () => {
      const xml = await service.generateXRechnung(
        mockInvoiceData,
        XRechnungSyntax.UBL,
      );
      const result = await service.validateXRechnung(xml);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate valid CII XML', async () => {
      const xml = await service.generateXRechnung(
        mockInvoiceData,
        XRechnungSyntax.CII,
      );
      const result = await service.validateXRechnung(xml);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid XML', async () => {
      const invalidXml = '<Invalid>XML</Invalid>';
      const result = await service.validateXRechnung(invalidXml);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe('INVALID_ROOT');
    });

    it('should detect malformed XML', async () => {
      const malformedXml = '<?xml version="1.0"?><Invoice><unclosed>';
      const result = await service.validateXRechnung(malformedXml);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe('XML_PARSE_ERROR');
    });
  });

  describe('parseXRechnung', () => {
    it('should parse UBL XML to internal format', async () => {
      const xml = await service.generateXRechnung(
        mockInvoiceData,
        XRechnungSyntax.UBL,
      );
      const parsed = await service.parseXRechnung(xml);

      expect(parsed.number).toBe(mockInvoiceData.number);
      expect(parsed.currency).toBe(mockInvoiceData.currency);
      expect(parsed.seller.name).toBe(mockInvoiceData.seller.name);
      expect(parsed.seller.vatId).toBe(mockInvoiceData.seller.vatId);
      expect(parsed.buyer.name).toBe(mockInvoiceData.buyer.name);
      expect(parsed.items).toHaveLength(mockInvoiceData.items.length);
    });

    it('should parse CII XML to internal format', async () => {
      const xml = await service.generateXRechnung(
        mockInvoiceData,
        XRechnungSyntax.CII,
      );
      const parsed = await service.parseXRechnung(xml);

      expect(parsed.number).toBe(mockInvoiceData.number);
      expect(parsed.currency).toBe(mockInvoiceData.currency);
      expect(parsed.seller.name).toBe(mockInvoiceData.seller.name);
      expect(parsed.buyer.name).toBe(mockInvoiceData.buyer.name);
    });

    it('should throw error for invalid XML root', async () => {
      const invalidXml = '<?xml version="1.0"?><InvalidRoot></InvalidRoot>';
      await expect(service.parseXRechnung(invalidXml)).rejects.toThrow(
        'Invalid XRechnung XML',
      );
    });
  });

  describe('checkCompliance', () => {
    it('should pass compliance check for valid invoice', () => {
      const result = service.checkCompliance(mockInvoiceData);

      expect(result.compliant).toBe(true);
      expect(result.missingFields).toHaveLength(0);
      expect(result.issues.filter((i) => i.severity === 'error')).toHaveLength(0);
    });

    it('should detect missing Leitweg-ID', () => {
      const invalidInvoice: InvoiceData = {
        ...mockInvoiceData,
        leitwegId: undefined,
      };
      const result = service.checkCompliance(invalidInvoice);

      expect(result.compliant).toBe(false);
      const leitwegIssue = result.issues.find(
        (i) => i.code === 'MISSING_LEITWEG_ID',
      );
      expect(leitwegIssue).toBeDefined();
      expect(leitwegIssue?.severity).toBe('error');
    });

    it('should detect invalid Leitweg-ID format', () => {
      const invalidInvoice: InvoiceData = {
        ...mockInvoiceData,
        leitwegId: 'INVALID',
      };
      const result = service.checkCompliance(invalidInvoice);

      expect(result.compliant).toBe(false);
      const formatIssue = result.issues.find(
        (i) => i.code === 'INVALID_LEITWEG_ID',
      );
      expect(formatIssue).toBeDefined();
    });

    it('should detect missing buyer reference', () => {
      const invalidInvoice: InvoiceData = {
        ...mockInvoiceData,
        buyer: {
          ...mockInvoiceData.buyer,
          buyerReference: undefined,
        },
        leitwegId: undefined,
      };
      const result = service.checkCompliance(invalidInvoice);

      expect(result.compliant).toBe(false);
      expect(result.missingFields).toContain('buyer.buyerReference');
    });

    it('should warn about non-EUR currency', () => {
      const usdInvoice: InvoiceData = {
        ...mockInvoiceData,
        currency: 'USD',
      };
      const result = service.checkCompliance(usdInvoice);

      const currencyIssue = result.issues.find(
        (i) => i.code === 'NON_EUR_CURRENCY',
      );
      expect(currencyIssue).toBeDefined();
      expect(currencyIssue?.severity).toBe('warning');
      // Should still be compliant (warning only)
      expect(result.compliant).toBe(true);
    });

    it('should detect missing line items', () => {
      const invalidInvoice: InvoiceData = {
        ...mockInvoiceData,
        items: [],
      };
      const result = service.checkCompliance(invalidInvoice);

      expect(result.compliant).toBe(false);
      const itemsIssue = result.issues.find((i) => i.code === 'NO_LINE_ITEMS');
      expect(itemsIssue).toBeDefined();
      expect(itemsIssue?.severity).toBe('error');
    });
  });

  describe('getRequiredFields', () => {
    it('should return list of required fields', () => {
      const fields = service.getRequiredFields();

      expect(fields).toContain('number');
      expect(fields).toContain('issueDate');
      expect(fields).toContain('seller.vatId');
      expect(fields).toContain('buyer.buyerReference');
      expect(fields).toContain('leitwegId');
      expect(fields).toContain('totalAmount');
      expect(fields.length).toBeGreaterThan(10);
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain data integrity through UBL round-trip', async () => {
      const xml = await service.generateXRechnung(
        mockInvoiceData,
        XRechnungSyntax.UBL,
      );
      const parsed = await service.parseXRechnung(xml);

      expect(parsed.number).toBe(mockInvoiceData.number);
      expect(parsed.seller.name).toBe(mockInvoiceData.seller.name);
      expect(parsed.seller.vatId).toBe(mockInvoiceData.seller.vatId);
      expect(parsed.buyer.name).toBe(mockInvoiceData.buyer.name);
      expect(parsed.totalAmount).toBe(mockInvoiceData.totalAmount);
    });

    it('should maintain data integrity through CII round-trip', async () => {
      const xml = await service.generateXRechnung(
        mockInvoiceData,
        XRechnungSyntax.CII,
      );
      const parsed = await service.parseXRechnung(xml);

      expect(parsed.number).toBe(mockInvoiceData.number);
      expect(parsed.seller.name).toBe(mockInvoiceData.seller.name);
      expect(parsed.buyer.name).toBe(mockInvoiceData.buyer.name);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple line items', async () => {
      const multiItemInvoice: InvoiceData = {
        ...mockInvoiceData,
        items: [
          {
            description: 'Service 1',
            quantity: 5,
            unitPrice: 100,
            amount: 500,
            taxRate: 19,
            taxAmount: 95,
          },
          {
            description: 'Service 2',
            quantity: 3,
            unitPrice: 200,
            amount: 600,
            taxRate: 19,
            taxAmount: 114,
          },
        ],
        subtotal: 1100,
        taxAmount: 209,
        totalAmount: 1309,
      };

      const xml = await service.generateXRechnung(
        multiItemInvoice,
        XRechnungSyntax.UBL,
      );
      const parsed = await service.parseXRechnung(xml);

      expect(parsed.items).toHaveLength(2);
      expect(parsed.items[0].description).toBe('Service 1');
      expect(parsed.items[1].description).toBe('Service 2');
    });

    it('should handle invoice without bank details', async () => {
      const noBankInvoice: InvoiceData = {
        ...mockInvoiceData,
        bankDetails: undefined,
      };

      const xml = await service.generateXRechnung(
        noBankInvoice,
        XRechnungSyntax.UBL,
      );

      expect(xml).toBeDefined();
      expect(xml).not.toContain('PayeeFinancialAccount');
    });

    it('should handle buyer without VAT ID', async () => {
      const noVatBuyerInvoice: InvoiceData = {
        ...mockInvoiceData,
        buyer: {
          ...mockInvoiceData.buyer,
          vatId: undefined,
        },
      };

      const xml = await service.generateXRechnung(
        noVatBuyerInvoice,
        XRechnungSyntax.UBL,
      );

      expect(xml).toBeDefined();
      // Should still generate valid XML
      const validation = await service.validateXRechnung(xml);
      expect(validation.valid).toBe(true);
    });
  });
});
