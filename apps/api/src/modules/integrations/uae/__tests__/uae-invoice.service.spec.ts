import { Test, TestingModule } from '@nestjs/testing';
import { UAEInvoiceService } from '../uae-invoice.service';
import { UAETaxService } from '../uae-tax.service';
import { UAEValidationService } from '../uae-validation.service';
import { UAEInvoiceType, UAEVATRateCode } from '../constants/uae.constants';
import { UAEInvoiceData } from '../interfaces/uae.types';

describe('UAEInvoiceService', () => {
  let service: UAEInvoiceService;
  let taxService: UAETaxService;
  let validationService: UAEValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UAEInvoiceService, UAETaxService, UAEValidationService],
    }).compile();

    service = module.get<UAEInvoiceService>(UAEInvoiceService);
    taxService = module.get<UAETaxService>(UAETaxService);
    validationService = module.get<UAEValidationService>(UAEValidationService);
  });

  const createTestInvoice = (): UAEInvoiceData => ({
    invoiceNumber: 'INV-2024-001',
    invoiceType: UAEInvoiceType.INVOICE,
    issueDate: new Date('2024-01-15'),
    dueDate: new Date('2024-02-15'),
    supplier: {
      trn: '100123456789012',
      legalName: 'Test Supplier LLC',
      tradeName: 'Test Supplier',
      address: {
        streetName: 'Sheikh Zayed Road',
        buildingNumber: '123',
        cityName: 'Dubai',
        postalZone: '12345',
        emirate: 'Dubai',
        country: 'AE',
      },
      phone: '+971-4-1234567',
      email: 'supplier@example.ae',
      vatRegistered: true,
      commercialRegistration: 'CR123456',
    },
    customer: {
      legalName: 'Test Customer LLC',
      address: {
        streetName: 'Al Maktoum Road',
        buildingNumber: '456',
        cityName: 'Dubai',
        postalZone: '54321',
        emirate: 'Dubai',
        country: 'AE',
      },
      phone: '+971-4-7654321',
      email: 'customer@example.ae',
      vatRegistered: false,
    },
    lineItems: [
      {
        id: '1',
        description: 'Professional Services',
        quantity: 10,
        unitCode: 'C62',
        unitPrice: 100,
        lineExtensionAmount: 1000,
        taxCategory: UAEVATRateCode.STANDARD,
        taxRate: 0.05,
        taxAmount: 50,
        sellersItemId: 'SRV-001',
      },
      {
        id: '2',
        description: 'Consulting Services',
        quantity: 5,
        unitCode: 'C62',
        unitPrice: 200,
        lineExtensionAmount: 1000,
        taxCategory: UAEVATRateCode.STANDARD,
        taxRate: 0.05,
        taxAmount: 50,
        sellersItemId: 'SRV-002',
      },
    ],
    totals: {
      currency: 'AED',
      lineExtensionAmount: 2000,
      taxExclusiveAmount: 2000,
      taxBreakdown: [
        {
          taxCategory: UAEVATRateCode.STANDARD,
          taxRate: 0.05,
          taxableAmount: 2000,
          taxAmount: 100,
        },
      ],
      taxTotalAmount: 100,
      taxInclusiveAmount: 2100,
      payableAmount: 2100,
    },
    notes: ['Payment due within 30 days', 'Thank you for your business'],
  });

  describe('generateInvoiceXML', () => {
    it('should generate valid UBL 2.1 XML', async () => {
      const invoice = createTestInvoice();
      const result = await service.generateInvoiceXML(invoice);

      expect(result.xml).toBeDefined();
      expect(result.hash).toBeDefined();
      expect(result.xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result.xml).toContain('<Invoice');
      expect(result.xml).toContain('xmlns:cac');
      expect(result.xml).toContain('xmlns:cbc');
    });

    it('should include invoice identification', async () => {
      const invoice = createTestInvoice();
      const result = await service.generateInvoiceXML(invoice);

      expect(result.xml).toContain('<cbc:ID>INV-2024-001</cbc:ID>');
      expect(result.xml).toContain('<cbc:IssueDate>2024-01-15</cbc:IssueDate>');
      expect(result.xml).toContain('<cbc:DueDate>2024-02-15</cbc:DueDate>');
      expect(result.xml).toContain('<cbc:InvoiceTypeCode>380</cbc:InvoiceCode>');
    });

    it('should include supplier information', async () => {
      const invoice = createTestInvoice();
      const result = await service.generateInvoiceXML(invoice);

      expect(result.xml).toContain('<cac:AccountingSupplierParty>');
      expect(result.xml).toContain('100123456789012');
      expect(result.xml).toContain('Test Supplier LLC');
      expect(result.xml).toContain('Dubai');
    });

    it('should include customer information', async () => {
      const invoice = createTestInvoice();
      const result = await service.generateInvoiceXML(invoice);

      expect(result.xml).toContain('<cac:AccountingCustomerParty>');
      expect(result.xml).toContain('Test Customer LLC');
    });

    it('should include line items', async () => {
      const invoice = createTestInvoice();
      const result = await service.generateInvoiceXML(invoice);

      expect(result.xml).toContain('<cac:InvoiceLine>');
      expect(result.xml).toContain('Professional Services');
      expect(result.xml).toContain('Consulting Services');
      expect(result.xml).toContain('<cbc:InvoicedQuantity');
    });

    it('should include tax totals', async () => {
      const invoice = createTestInvoice();
      const result = await service.generateInvoiceXML(invoice);

      expect(result.xml).toContain('<cac:TaxTotal>');
      expect(result.xml).toContain('<cbc:TaxAmount');
      expect(result.xml).toContain('100.00');
    });

    it('should include legal monetary total', async () => {
      const invoice = createTestInvoice();
      const result = await service.generateInvoiceXML(invoice);

      expect(result.xml).toContain('<cac:LegalMonetaryTotal>');
      expect(result.xml).toContain('<cbc:LineExtensionAmount');
      expect(result.xml).toContain('<cbc:TaxExclusiveAmount');
      expect(result.xml).toContain('<cbc:TaxInclusiveAmount');
      expect(result.xml).toContain('<cbc:PayableAmount');
    });

    it('should include notes', async () => {
      const invoice = createTestInvoice();
      const result = await service.generateInvoiceXML(invoice);

      expect(result.xml).toContain('<cbc:Note>Payment due within 30 days</cbc:Note>');
      expect(result.xml).toContain('<cbc:Note>Thank you for your business</cbc:Note>');
    });

    it('should generate credit note XML', async () => {
      const invoice = {
        ...createTestInvoice(),
        invoiceType: UAEInvoiceType.CREDIT_NOTE,
        originalInvoiceReference: 'INV-2024-001',
      };

      const result = await service.generateInvoiceXML(invoice);

      expect(result.xml).toContain('<CreditNote');
      expect(result.xml).toContain('INV-2024-001');
    });

    it('should generate debit note XML', async () => {
      const invoice = {
        ...createTestInvoice(),
        invoiceType: UAEInvoiceType.DEBIT_NOTE,
      };

      const result = await service.generateInvoiceXML(invoice);

      expect(result.xml).toContain('<DebitNote');
    });

    it('should throw error for invalid invoice', async () => {
      const invoice = {
        ...createTestInvoice(),
        invoiceNumber: '', // Invalid
      };

      await expect(service.generateInvoiceXML(invoice)).rejects.toThrow();
    });

    it('should include currency code', async () => {
      const invoice = createTestInvoice();
      const result = await service.generateInvoiceXML(invoice);

      expect(result.xml).toContain('currencyID="AED"');
    });

    it('should handle allowances and charges', async () => {
      const invoice = {
        ...createTestInvoice(),
        totals: {
          ...createTestInvoice().totals,
          allowances: [
            {
              type: 'ALLOWANCE' as const,
              reason: 'Discount',
              amount: 100,
              taxCategory: UAEVATRateCode.STANDARD,
              taxRate: 0.05,
              taxAmount: 5,
            },
          ],
          charges: [
            {
              type: 'CHARGE' as const,
              reason: 'Shipping',
              amount: 50,
              taxCategory: UAEVATRateCode.STANDARD,
              taxRate: 0.05,
              taxAmount: 2.5,
            },
          ],
        },
      };

      const result = await service.generateInvoiceXML(invoice);

      expect(result.xml).toContain('<cac:AllowanceCharge>');
      expect(result.xml).toContain('Discount');
      expect(result.xml).toContain('Shipping');
    });

    it('should include payment information', async () => {
      const invoice = {
        ...createTestInvoice(),
        payment: {
          paymentMeansCode: '30',
          paymentId: 'PAY-001',
          payeeFinancialAccount: {
            accountId: 'AE070331234567890123456',
            accountName: 'Test Supplier LLC',
            financialInstitution: {
              bic: 'ABCDAEAD',
              name: 'Test Bank',
            },
          },
        },
      };

      const result = await service.generateInvoiceXML(invoice);

      expect(result.xml).toContain('<cac:PaymentMeans>');
      expect(result.xml).toContain('AE070331234567890123456');
    });

    it('should calculate correct hash', async () => {
      const invoice = createTestInvoice();
      const result = await service.generateInvoiceXML(invoice);

      expect(result.hash).toHaveLength(64); // SHA-256 hex digest
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
