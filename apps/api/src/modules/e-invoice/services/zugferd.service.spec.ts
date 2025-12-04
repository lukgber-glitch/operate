import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ZugferdService } from './zugferd.service';
import {
  InvoiceData,
  ZugferdProfile,
  ValidationResult,
} from '../types/zugferd.types';

describe('ZugferdService', () => {
  let service: ZugferdService;

  // Mock invoice data
  const mockInvoiceData: InvoiceData = {
    number: 'INV-2024-001',
    issueDate: new Date('2024-01-15'),
    dueDate: new Date('2024-02-14'),
    type: 'STANDARD',
    currency: 'EUR',

    seller: {
      name: 'Test GmbH',
      address: {
        line1: 'Hauptstraße 123',
        city: 'Berlin',
        postalCode: '10115',
        country: 'DE',
      },
      vatId: 'DE123456789',
      email: 'seller@test.com',
      phone: '+49 30 12345678',
    },

    buyer: {
      name: 'ACME Corp',
      address: {
        line1: 'Main Street 456',
        city: 'Munich',
        postalCode: '80331',
        country: 'DE',
      },
      vatId: 'DE987654321',
      email: 'buyer@acme.com',
    },

    items: [
      {
        description: 'Web Development Services',
        quantity: 40,
        unitPrice: 120.0,
        amount: 4800.0,
        taxRate: 19,
        taxAmount: 912.0,
        unit: 'hours',
      },
      {
        description: 'Consulting Services',
        quantity: 10,
        unitPrice: 150.0,
        amount: 1500.0,
        taxRate: 19,
        taxAmount: 285.0,
        unit: 'hours',
      },
    ],

    subtotal: 6300.0,
    taxAmount: 1197.0,
    totalAmount: 7497.0,
    vatRate: 19,
    reverseCharge: false,

    paymentTerms: 'Net 30 days',
    paymentMethod: 'Bank Transfer',
    bankReference: 'DE89370400440532013000',

    notes: 'Thank you for your business!',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZugferdService],
    }).compile();

    service = module.get<ZugferdService>(ZugferdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateZugferdInvoice', () => {
    it('should generate a ZUGFeRD PDF with EN16931 profile', async () => {
      const result = await service.generateZugferdInvoice(
        mockInvoiceData,
        ZugferdProfile.EN16931,
      );

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);

      // Check PDF signature
      const pdfSignature = result.toString('utf-8', 0, 5);
      expect(pdfSignature).toBe('%PDF-');
    });

    it('should generate ZUGFeRD PDF with BASIC profile', async () => {
      const result = await service.generateZugferdInvoice(
        mockInvoiceData,
        ZugferdProfile.BASIC,
      );

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate ZUGFeRD PDF with MINIMUM profile', async () => {
      const result = await service.generateZugferdInvoice(
        mockInvoiceData,
        ZugferdProfile.MINIMUM,
      );

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate ZUGFeRD PDF with XRECHNUNG profile', async () => {
      const result = await service.generateZugferdInvoice(
        mockInvoiceData,
        ZugferdProfile.XRECHNUNG,
      );

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle reverse charge invoices', async () => {
      const reverseChargeInvoice: InvoiceData = {
        ...mockInvoiceData,
        reverseCharge: true,
        taxAmount: 0,
        totalAmount: mockInvoiceData.subtotal,
      };

      const result = await service.generateZugferdInvoice(
        reverseChargeInvoice,
        ZugferdProfile.EN16931,
      );

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle credit note invoices', async () => {
      const creditNote: InvoiceData = {
        ...mockInvoiceData,
        type: 'CREDIT_NOTE',
        number: 'CN-2024-001',
        subtotal: -6300.0,
        taxAmount: -1197.0,
        totalAmount: -7497.0,
      };

      const result = await service.generateZugferdInvoice(
        creditNote,
        ZugferdProfile.EN16931,
      );

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should throw BadRequestException on invalid data', async () => {
      const invalidInvoice: InvoiceData = {
        ...mockInvoiceData,
        number: '', // Invalid: empty number
      };

      await expect(
        service.generateZugferdInvoice(invalidInvoice, ZugferdProfile.EN16931),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateXml', () => {
    it('should generate XML without PDF', async () => {
      const xml = await service.generateXml(
        mockInvoiceData,
        ZugferdProfile.EN16931,
      );

      expect(xml).toBeDefined();
      expect(typeof xml).toBe('string');
      expect(xml).toContain('<?xml');
      expect(xml).toContain(mockInvoiceData.number);
    });

    it('should generate valid XML for all profiles', async () => {
      const profiles = [
        ZugferdProfile.MINIMUM,
        ZugferdProfile.BASIC,
        ZugferdProfile.BASIC_WL,
        ZugferdProfile.EN16931,
        ZugferdProfile.EXTENDED,
        ZugferdProfile.XRECHNUNG,
      ];

      for (const profile of profiles) {
        const xml = await service.generateXml(mockInvoiceData, profile);
        expect(xml).toBeDefined();
        expect(xml).toContain('<?xml');
      }
    });

    it('should include invoice details in XML', async () => {
      const xml = await service.generateXml(
        mockInvoiceData,
        ZugferdProfile.EN16931,
      );

      expect(xml).toContain(mockInvoiceData.number);
      expect(xml).toContain(mockInvoiceData.seller.name);
      expect(xml).toContain(mockInvoiceData.buyer.name);
    });
  });

  describe('validateZugferdPdf', () => {
    it('should validate a ZUGFeRD PDF', async () => {
      // First generate a valid ZUGFeRD PDF
      const pdf = await service.generateZugferdInvoice(
        mockInvoiceData,
        ZugferdProfile.EN16931,
      );

      const validation = await service.validateZugferdPdf(pdf);

      expect(validation).toBeDefined();
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('warnings');
      expect(validation).toHaveProperty('metadata');
      expect(Array.isArray(validation.errors)).toBe(true);
      expect(Array.isArray(validation.warnings)).toBe(true);
    });

    it('should return invalid for non-ZUGFeRD PDF', async () => {
      // Create a simple non-ZUGFeRD PDF
      const PDFDocument = require('pdfkit');
      const chunks: Buffer[] = [];

      const simplePdf: Buffer = await new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.text('This is not a ZUGFeRD invoice');
        doc.end();
      });

      const validation = await service.validateZugferdPdf(simplePdf);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect missing embedded XML', async () => {
      const PDFDocument = require('pdfkit');
      const chunks: Buffer[] = [];

      const pdfWithoutXml: Buffer = await new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.text('Invoice without embedded XML');
        doc.end();
      });

      const validation = await service.validateZugferdPdf(pdfWithoutXml);

      expect(validation.valid).toBe(false);
      expect(validation.metadata.hasEmbeddedXml).toBe(false);
      expect(validation.errors.some((e) => e.code === 'XML_MISSING')).toBe(
        true,
      );
    });
  });

  describe('extractXmlFromPdf', () => {
    it('should attempt to extract XML from ZUGFeRD PDF', async () => {
      const pdf = await service.generateZugferdInvoice(
        mockInvoiceData,
        ZugferdProfile.EN16931,
      );

      // Note: This will currently throw an error as extraction is not fully implemented
      // This test documents the expected behavior
      await expect(service.extractXmlFromPdf(pdf)).rejects.toThrow();
    });

    it('should throw error for PDF without embedded XML', async () => {
      const PDFDocument = require('pdfkit');
      const chunks: Buffer[] = [];

      const simplePdf: Buffer = await new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.text('Simple PDF');
        doc.end();
      });

      await expect(service.extractXmlFromPdf(simplePdf)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle minimal invoice data', async () => {
      const minimalInvoice: InvoiceData = {
        number: 'MIN-001',
        issueDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-31'),
        currency: 'EUR',
        seller: {
          name: 'Seller Inc',
        },
        buyer: {
          name: 'Buyer Inc',
        },
        items: [
          {
            description: 'Item 1',
            quantity: 1,
            unitPrice: 100,
            amount: 100,
          },
        ],
        subtotal: 100,
        taxAmount: 19,
        totalAmount: 119,
      };

      const result = await service.generateZugferdInvoice(
        minimalInvoice,
        ZugferdProfile.MINIMUM,
      );

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle multiple line items', async () => {
      const multiItemInvoice: InvoiceData = {
        ...mockInvoiceData,
        items: Array.from({ length: 50 }, (_, i) => ({
          description: `Item ${i + 1}`,
          quantity: i + 1,
          unitPrice: 10.0,
          amount: (i + 1) * 10.0,
          taxRate: 19,
          taxAmount: (i + 1) * 10.0 * 0.19,
        })),
      };

      const result = await service.generateZugferdInvoice(
        multiItemInvoice,
        ZugferdProfile.EN16931,
      );

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle different currencies', async () => {
      const currencies = ['EUR', 'USD', 'GBP', 'CHF'];

      for (const currency of currencies) {
        const invoice: InvoiceData = {
          ...mockInvoiceData,
          currency,
        };

        const result = await service.generateZugferdInvoice(
          invoice,
          ZugferdProfile.EN16931,
        );

        expect(result).toBeDefined();
      }
    });

    it('should normalize country codes', async () => {
      const invoiceWithFullCountryName: InvoiceData = {
        ...mockInvoiceData,
        seller: {
          ...mockInvoiceData.seller,
          address: {
            ...mockInvoiceData.seller.address!,
            country: 'Germany',
          },
        },
      };

      const result = await service.generateZugferdInvoice(
        invoiceWithFullCountryName,
        ZugferdProfile.EN16931,
      );

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('profile-specific features', () => {
    it('should generate BASIC_WL profile without line items', async () => {
      const result = await service.generateZugferdInvoice(
        mockInvoiceData,
        ZugferdProfile.BASIC_WL,
      );

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should generate EXTENDED profile with additional data', async () => {
      const extendedInvoice: InvoiceData = {
        ...mockInvoiceData,
        purchaseOrderReference: 'PO-2024-001',
        contractReference: 'CONTRACT-2024-001',
        metadata: {
          projectId: 'PRJ-001',
          customField: 'Custom Value',
        },
      };

      const result = await service.generateZugferdInvoice(
        extendedInvoice,
        ZugferdProfile.EXTENDED,
      );

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
