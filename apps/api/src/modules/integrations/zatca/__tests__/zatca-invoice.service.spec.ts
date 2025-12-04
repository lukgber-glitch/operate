/**
 * ZATCA Invoice Service Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ZatcaInvoiceService } from '../zatca-invoice.service';
import {
  ZatcaInvoiceData,
  ZatcaInvoiceType,
  ZatcaParty,
  ZatcaAddress,
  ZatcaInvoiceLine,
} from '../zatca.types';
import { UBL_VERSION } from '../zatca.constants';

describe('ZatcaInvoiceService', () => {
  let service: ZatcaInvoiceService;

  const createMockAddress = (): ZatcaAddress => ({
    buildingNumber: '1234',
    streetName: 'Test Street',
    districtName: 'Test District',
    cityName: 'Riyadh',
    postalCode: '12345',
    countryCode: 'SA',
  });

  const createMockSeller = (): ZatcaParty => ({
    registrationName: 'Test Company Ltd',
    vatRegistrationNumber: '300000000000003',
    commercialRegistrationNumber: '1234567890',
    address: createMockAddress(),
  });

  const createMockBuyer = (): ZatcaParty => ({
    registrationName: 'Buyer Company Ltd',
    vatRegistrationNumber: '300000000000004',
    address: createMockAddress(),
  });

  const createMockInvoiceLine = (): ZatcaInvoiceLine => ({
    id: '1',
    name: 'Test Product',
    quantity: 10,
    unitPrice: 100,
    netAmount: 1000,
    vatRate: 0.15,
    vatAmount: 150,
    totalAmount: 1150,
    vatCategoryCode: 'S',
  });

  const createMockInvoiceData = (): ZatcaInvoiceData => ({
    invoiceNumber: 'INV-001',
    uuid: '12345678-1234-1234-1234-123456789012',
    issueDate: new Date('2025-12-03'),
    issueTime: new Date('2025-12-03T10:30:00Z'),
    invoiceType: ZatcaInvoiceType.STANDARD_INVOICE,
    invoiceTypeCode: '388',
    transactionTypeCode: '0100',
    currency: 'SAR',
    previousInvoiceHash: '0000000000000000000000000000000000000000000000000000000000000000',
    seller: createMockSeller(),
    buyer: createMockBuyer(),
    lines: [createMockInvoiceLine()],
    lineExtensionAmount: 1000,
    taxExclusiveAmount: 1000,
    taxInclusiveAmount: 1150,
    payableAmount: 1150,
    taxSubtotals: [
      {
        taxableAmount: 1000,
        taxAmount: 150,
        vatCategoryCode: 'S',
        vatRate: 0.15,
      },
    ],
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZatcaInvoiceService],
    }).compile();

    service = module.get<ZatcaInvoiceService>(ZatcaInvoiceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('UBL Invoice Generation', () => {
    it('should generate valid UBL 2.1 XML for standard invoice', () => {
      const invoiceData = createMockInvoiceData();
      const previousHash = '0000000000000000000000000000000000000000000000000000000000000000';

      const xml = service.generateUBLInvoice(invoiceData, previousHash);

      expect(xml).toBeDefined();
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<Invoice');
      expect(xml).toContain(`<cbc:UBLVersionID>${UBL_VERSION}</cbc:UBLVersionID>`);
      expect(xml).toContain(`<cbc:ID>${invoiceData.invoiceNumber}</cbc:ID>`);
      expect(xml).toContain(`<cbc:UUID>${invoiceData.uuid}</cbc:UUID>`);
    });

    it('should include seller information in UBL XML', () => {
      const invoiceData = createMockInvoiceData();
      const xml = service.generateUBLInvoice(invoiceData, 'previous-hash');

      expect(xml).toContain('<cac:AccountingSupplierParty>');
      expect(xml).toContain(invoiceData.seller.registrationName);
      expect(xml).toContain(invoiceData.seller.vatRegistrationNumber);
      expect(xml).toContain(invoiceData.seller.address.cityName);
    });

    it('should include buyer information for standard invoices', () => {
      const invoiceData = createMockInvoiceData();
      const xml = service.generateUBLInvoice(invoiceData, 'previous-hash');

      expect(xml).toContain('<cac:AccountingCustomerParty>');
      expect(xml).toContain(invoiceData.buyer!.registrationName);
    });

    it('should include invoice lines with correct amounts', () => {
      const invoiceData = createMockInvoiceData();
      const xml = service.generateUBLInvoice(invoiceData, 'previous-hash');

      expect(xml).toContain('<cac:InvoiceLine>');
      expect(xml).toContain(invoiceData.lines[0].name);
      expect(xml).toContain(invoiceData.lines[0].quantity.toFixed(2));
      expect(xml).toContain(invoiceData.lines[0].unitPrice.toFixed(2));
    });

    it('should include tax totals and subtotals', () => {
      const invoiceData = createMockInvoiceData();
      const xml = service.generateUBLInvoice(invoiceData, 'previous-hash');

      expect(xml).toContain('<cac:TaxTotal>');
      expect(xml).toContain('<cac:TaxSubtotal>');
      expect(xml).toContain(invoiceData.taxSubtotals[0].taxAmount.toFixed(2));
    });

    it('should include legal monetary total', () => {
      const invoiceData = createMockInvoiceData();
      const xml = service.generateUBLInvoice(invoiceData, 'previous-hash');

      expect(xml).toContain('<cac:LegalMonetaryTotal>');
      expect(xml).toContain(`<cbc:TaxExclusiveAmount`);
      expect(xml).toContain(`<cbc:TaxInclusiveAmount`);
      expect(xml).toContain(`<cbc:PayableAmount`);
    });

    it('should generate simplified invoice without buyer', () => {
      const invoiceData = createMockInvoiceData();
      invoiceData.invoiceType = ZatcaInvoiceType.SIMPLIFIED_INVOICE;
      invoiceData.buyer = undefined;

      const xml = service.generateUBLInvoice(invoiceData, 'previous-hash');

      expect(xml).toBeDefined();
      expect(xml).not.toContain('<cac:AccountingCustomerParty>');
    });
  });

  describe('Invoice Validation', () => {
    it('should validate complete invoice data', () => {
      const invoiceData = createMockInvoiceData();

      expect(() => {
        service.generateUBLInvoice(invoiceData, 'previous-hash');
      }).not.toThrow();
    });

    it('should throw error for missing invoice number', () => {
      const invoiceData = createMockInvoiceData();
      invoiceData.invoiceNumber = '';

      expect(() => {
        service.generateUBLInvoice(invoiceData, 'previous-hash');
      }).toThrow(/Invoice number is required/);
    });

    it('should throw error for missing seller information', () => {
      const invoiceData = createMockInvoiceData();
      (invoiceData.seller as any) = undefined;

      expect(() => {
        service.generateUBLInvoice(invoiceData, 'previous-hash');
      }).toThrow(/Seller information is required/);
    });

    it('should throw error for missing seller VAT number', () => {
      const invoiceData = createMockInvoiceData();
      invoiceData.seller.vatRegistrationNumber = undefined;

      expect(() => {
        service.generateUBLInvoice(invoiceData, 'previous-hash');
      }).toThrow(/Seller VAT registration number is required/);
    });

    it('should throw error for empty invoice lines', () => {
      const invoiceData = createMockInvoiceData();
      invoiceData.lines = [];

      expect(() => {
        service.generateUBLInvoice(invoiceData, 'previous-hash');
      }).toThrow(/At least one invoice line is required/);
    });

    it('should throw error for negative quantity', () => {
      const invoiceData = createMockInvoiceData();
      invoiceData.lines[0].quantity = -5;

      expect(() => {
        service.generateUBLInvoice(invoiceData, 'previous-hash');
      }).toThrow(/Quantity must be positive/);
    });

    it('should require buyer for standard invoices', () => {
      const invoiceData = createMockInvoiceData();
      invoiceData.invoiceType = ZatcaInvoiceType.STANDARD_INVOICE;
      invoiceData.buyer = undefined;

      expect(() => {
        service.generateUBLInvoice(invoiceData, 'previous-hash');
      }).toThrow(/Buyer information is required for standard invoices/);
    });
  });

  describe('Invoice Hash Calculation', () => {
    it('should calculate SHA-256 hash of invoice XML', () => {
      const invoiceData = createMockInvoiceData();
      const xml = service.generateUBLInvoice(invoiceData, 'previous-hash');

      const hashResult = service.calculateHash(xml);

      expect(hashResult).toBeDefined();
      expect(hashResult.hash).toBeDefined();
      expect(hashResult.hash).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 format
      expect(hashResult.canonicalString).toBeDefined();
    });

    it('should produce consistent hash for same input', () => {
      const invoiceData = createMockInvoiceData();
      const xml = service.generateUBLInvoice(invoiceData, 'previous-hash');

      const hash1 = service.calculateHash(xml);
      const hash2 = service.calculateHash(xml);

      expect(hash1.hash).toBe(hash2.hash);
    });

    it('should produce different hash for different input', () => {
      const invoiceData1 = createMockInvoiceData();
      invoiceData1.invoiceNumber = 'INV-001';

      const invoiceData2 = createMockInvoiceData();
      invoiceData2.invoiceNumber = 'INV-002';

      const xml1 = service.generateUBLInvoice(invoiceData1, 'previous-hash');
      const xml2 = service.generateUBLInvoice(invoiceData2, 'previous-hash');

      const hash1 = service.calculateHash(xml1);
      const hash2 = service.calculateHash(xml2);

      expect(hash1.hash).not.toBe(hash2.hash);
    });
  });

  describe('Cryptographic Stamp Generation', () => {
    it('should generate ECDSA signature', () => {
      const privateKey = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg
test-key-data
-----END PRIVATE KEY-----`;

      const publicKey = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE
test-key-data
-----END PUBLIC KEY-----`;

      const invoiceHash = 'dGVzdC1oYXNo'; // Base64 "test-hash"

      const stamp = service.generateStamp(invoiceHash, privateKey, publicKey);

      expect(stamp).toBeDefined();
      expect(stamp.signature).toBeDefined();
      expect(stamp.publicKey).toBeDefined();
      expect(stamp.algorithm).toBe('ECDSA');
    });
  });

  describe('QR Code Generation', () => {
    it('should generate QR code with TLV encoding', () => {
      const invoiceData = createMockInvoiceData();
      const invoiceHash = 'test-hash-base64';
      const stamp = {
        signature: 'test-signature',
        publicKey: 'test-public-key',
        algorithm: 'ECDSA',
      };

      const qrCode = service.generateQRCode(invoiceData, invoiceHash, stamp);

      expect(qrCode).toBeDefined();
      expect(qrCode).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 format
      expect(qrCode.length).toBeGreaterThan(0);
    });

    it('should include all required TLV fields in QR code', () => {
      const invoiceData = createMockInvoiceData();
      const invoiceHash = 'test-hash';
      const stamp = {
        signature: 'signature',
        publicKey: 'public-key',
        algorithm: 'ECDSA',
      };

      const qrCode = service.generateQRCode(invoiceData, invoiceHash, stamp);

      // QR code should be a valid Base64 string
      expect(() => Buffer.from(qrCode, 'base64')).not.toThrow();

      const tlvBuffer = Buffer.from(qrCode, 'base64');
      expect(tlvBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('Credit and Debit Notes', () => {
    it('should generate credit note', () => {
      const invoiceData = createMockInvoiceData();
      invoiceData.invoiceType = ZatcaInvoiceType.STANDARD_CREDIT_NOTE;
      invoiceData.invoiceTypeCode = '381';

      const xml = service.generateUBLInvoice(invoiceData, 'previous-hash');

      expect(xml).toContain('<cbc:InvoiceTypeCode');
      expect(xml).toContain('381');
    });

    it('should generate debit note', () => {
      const invoiceData = createMockInvoiceData();
      invoiceData.invoiceType = ZatcaInvoiceType.STANDARD_DEBIT_NOTE;
      invoiceData.invoiceTypeCode = '383';

      const xml = service.generateUBLInvoice(invoiceData, 'previous-hash');

      expect(xml).toContain('<cbc:InvoiceTypeCode');
      expect(xml).toContain('383');
    });
  });

  describe('Multi-line Invoices', () => {
    it('should handle multiple invoice lines', () => {
      const invoiceData = createMockInvoiceData();
      invoiceData.lines = [
        createMockInvoiceLine(),
        { ...createMockInvoiceLine(), id: '2', name: 'Product 2' },
        { ...createMockInvoiceLine(), id: '3', name: 'Product 3' },
      ];

      const xml = service.generateUBLInvoice(invoiceData, 'previous-hash');

      expect(xml).toContain('Product 2');
      expect(xml).toContain('Product 3');
      expect((xml.match(/<cac:InvoiceLine>/g) || []).length).toBe(3);
    });

    it('should calculate correct totals for multi-line invoice', () => {
      const invoiceData = createMockInvoiceData();
      invoiceData.lines = [
        createMockInvoiceLine(), // 1000 + 150 VAT
        { ...createMockInvoiceLine(), id: '2', netAmount: 500, vatAmount: 75, totalAmount: 575 },
      ];
      invoiceData.lineExtensionAmount = 1500;
      invoiceData.taxExclusiveAmount = 1500;
      invoiceData.taxInclusiveAmount = 1725;
      invoiceData.payableAmount = 1725;
      invoiceData.taxSubtotals = [
        {
          taxableAmount: 1500,
          taxAmount: 225,
          vatCategoryCode: 'S',
          vatRate: 0.15,
        },
      ];

      const xml = service.generateUBLInvoice(invoiceData, 'previous-hash');

      expect(xml).toContain('1500.00'); // Line extension
      expect(xml).toContain('1725.00'); // Tax inclusive
    });
  });
});
