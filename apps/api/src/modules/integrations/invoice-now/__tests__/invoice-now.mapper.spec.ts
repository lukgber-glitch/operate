/**
 * InvoiceNow Mapper Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceNowMapper } from '../invoice-now.mapper';
import {
  InvoiceNowDocument,
  InvoiceNowDocumentType,
  SingaporeGstCategory,
} from '@operate/shared/types/integrations/invoice-now.types';

describe('InvoiceNowMapper', () => {
  let mapper: InvoiceNowMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceNowMapper],
    }).compile();

    mapper = module.get<InvoiceNowMapper>(InvoiceNowMapper);
  });

  it('should be defined', () => {
    expect(mapper).toBeDefined();
  });

  describe('toUblXml', () => {
    it('should convert invoice document to UBL XML', () => {
      const document: InvoiceNowDocument = {
        documentType: InvoiceNowDocumentType.INVOICE,
        invoiceNumber: 'INV-2024-001',
        issueDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        currency: 'SGD',
        supplier: {
          uen: '201234567A',
          scheme: '0195',
          participantId: '0195:201234567A',
          name: 'Supplier Company Pte Ltd',
          address: {
            streetName: '123 Business Street',
            cityName: 'Singapore',
            postalCode: '018956',
            countryCode: 'SG',
          },
          gstRegistrationNumber: 'M12345678X',
          contact: {
            name: 'John Doe',
            telephone: '+65 6123 4567',
            email: 'john@supplier.com',
          },
        },
        customer: {
          uen: '202345678B',
          scheme: '0195',
          participantId: '0195:202345678B',
          name: 'Customer Company Pte Ltd',
          address: {
            streetName: '456 Customer Road',
            cityName: 'Singapore',
            postalCode: '098765',
            countryCode: 'SG',
          },
          gstRegistrationNumber: 'M87654321Y',
        },
        lines: [
          {
            id: '1',
            description: 'Consulting Services',
            quantity: 10,
            unitCode: 'HUR',
            unitPrice: 100,
            lineExtensionAmount: 1000,
            taxCategory: SingaporeGstCategory.STANDARD_RATED,
            taxPercent: 8,
            taxAmount: 80,
          },
        ],
        taxTotal: 80,
        totalAmount: 1080,
        paymentTerms: 'Net 30',
        paymentMeans: {
          paymentMeansCode: '30',
          paymentId: 'REF-001',
          payeeAccountId: '123-456-789',
          payeeAccountName: 'Supplier Company Pte Ltd',
          payeeBankBic: 'OCBCSGSG',
        },
        notes: 'Thank you for your business',
      };

      const xml = mapper.toUblXml(document);

      expect(xml).toContain('Invoice');
      expect(xml).toContain('INV-2024-001');
      expect(xml).toContain('201234567A');
      expect(xml).toContain('202345678B');
      expect(xml).toContain('Consulting Services');
      expect(xml).toContain('SGD');
      expect(xml).toContain('1080.00');
    });

    it('should convert credit note document to UBL XML', () => {
      const document: InvoiceNowDocument = {
        documentType: InvoiceNowDocumentType.CREDIT_NOTE,
        invoiceNumber: 'CN-2024-001',
        issueDate: new Date('2024-01-15'),
        currency: 'SGD',
        supplier: {
          uen: '201234567A',
          scheme: '0195',
          participantId: '0195:201234567A',
          name: 'Supplier Company Pte Ltd',
          address: {
            cityName: 'Singapore',
            postalCode: '018956',
            countryCode: 'SG',
          },
        },
        customer: {
          uen: '202345678B',
          scheme: '0195',
          participantId: '0195:202345678B',
          name: 'Customer Company Pte Ltd',
          address: {
            cityName: 'Singapore',
            postalCode: '098765',
            countryCode: 'SG',
          },
        },
        lines: [
          {
            id: '1',
            description: 'Refund for defective product',
            quantity: 1,
            unitCode: 'EA',
            unitPrice: 100,
            lineExtensionAmount: 100,
            taxCategory: SingaporeGstCategory.STANDARD_RATED,
            taxPercent: 8,
            taxAmount: 8,
          },
        ],
        taxTotal: 8,
        totalAmount: 108,
        billingReference: 'INV-2024-001',
      };

      const xml = mapper.toUblXml(document);

      expect(xml).toContain('CreditNote');
      expect(xml).toContain('CN-2024-001');
      expect(xml).toContain('INV-2024-001'); // Billing reference
    });

    it('should handle zero-rated GST', () => {
      const document: InvoiceNowDocument = {
        documentType: InvoiceNowDocumentType.INVOICE,
        invoiceNumber: 'INV-2024-002',
        issueDate: new Date('2024-01-15'),
        currency: 'SGD',
        supplier: {
          uen: '201234567A',
          scheme: '0195',
          participantId: '0195:201234567A',
          name: 'Supplier Company Pte Ltd',
          address: {
            cityName: 'Singapore',
            postalCode: '018956',
            countryCode: 'SG',
          },
        },
        customer: {
          uen: '202345678B',
          scheme: '0195',
          participantId: '0195:202345678B',
          name: 'Customer Company Pte Ltd',
          address: {
            cityName: 'Singapore',
            postalCode: '098765',
            countryCode: 'SG',
          },
        },
        lines: [
          {
            id: '1',
            description: 'Export goods',
            quantity: 1,
            unitCode: 'EA',
            unitPrice: 1000,
            lineExtensionAmount: 1000,
            taxCategory: SingaporeGstCategory.ZERO_RATED,
            taxPercent: 0,
            taxAmount: 0,
          },
        ],
        taxTotal: 0,
        totalAmount: 1000,
      };

      const xml = mapper.toUblXml(document);

      expect(xml).toContain('0.00'); // Zero tax
      expect(xml).toContain('<cbc:Percent>0.00</cbc:Percent>');
    });

    it('should include PayNow payment means', () => {
      const document: InvoiceNowDocument = {
        documentType: InvoiceNowDocumentType.INVOICE,
        invoiceNumber: 'INV-2024-003',
        issueDate: new Date('2024-01-15'),
        currency: 'SGD',
        supplier: {
          uen: '201234567A',
          scheme: '0195',
          participantId: '0195:201234567A',
          name: 'Supplier Company Pte Ltd',
          address: {
            cityName: 'Singapore',
            postalCode: '018956',
            countryCode: 'SG',
          },
        },
        customer: {
          uen: '202345678B',
          scheme: '0195',
          participantId: '0195:202345678B',
          name: 'Customer Company Pte Ltd',
          address: {
            cityName: 'Singapore',
            postalCode: '098765',
            countryCode: 'SG',
          },
        },
        lines: [
          {
            id: '1',
            description: 'Services',
            quantity: 1,
            unitCode: 'EA',
            unitPrice: 100,
            lineExtensionAmount: 100,
            taxCategory: SingaporeGstCategory.STANDARD_RATED,
            taxPercent: 8,
            taxAmount: 8,
          },
        ],
        taxTotal: 8,
        totalAmount: 108,
        paymentMeans: {
          paymentMeansCode: '42', // PayNow
          payNowUen: '201234567A',
        },
      };

      const xml = mapper.toUblXml(document);

      expect(xml).toContain('42'); // PayNow code
      expect(xml).toContain('PayNow UEN: 201234567A');
    });
  });
});
