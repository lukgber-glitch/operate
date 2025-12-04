/**
 * ZATCA Compliance Service Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ZatcaComplianceService } from '../zatca-compliance.service';
import { ZatcaClientService } from '../zatca-client.service';
import { ZatcaInvoiceService } from '../zatca-invoice.service';
import { ZatcaInvoiceType, ZatcaInvoiceData } from '../zatca.types';
import { CLEARANCE_THRESHOLD_SAR } from '../zatca.constants';

describe('ZatcaComplianceService', () => {
  let service: ZatcaComplianceService;
  let clientService: ZatcaClientService;
  let invoiceService: ZatcaInvoiceService;

  const mockClientService = {
    requestComplianceCSID: jest.fn(),
    requestProductionCSID: jest.fn(),
    clearInvoice: jest.fn(),
    reportInvoice: jest.fn(),
    complianceCheck: jest.fn(),
  };

  const mockInvoiceService = {
    generateUBLInvoice: jest.fn(),
    calculateHash: jest.fn(),
    generateStamp: jest.fn(),
    generateQRCode: jest.fn(),
  };

  const createMockInvoice = (amount: number, type: ZatcaInvoiceType): ZatcaInvoiceData => ({
    invoiceNumber: 'INV-001',
    uuid: '12345678-1234-1234-1234-123456789012',
    issueDate: new Date('2025-12-03'),
    issueTime: new Date('2025-12-03T10:30:00Z'),
    invoiceType: type,
    invoiceTypeCode: '388',
    transactionTypeCode: type === ZatcaInvoiceType.STANDARD_INVOICE ? '0100' : '0200',
    currency: 'SAR',
    previousInvoiceHash: '0'.repeat(64),
    seller: {
      registrationName: 'Test Company',
      vatRegistrationNumber: '300000000000003',
      address: {
        buildingNumber: '1234',
        streetName: 'Test Street',
        districtName: 'Test District',
        cityName: 'Riyadh',
        postalCode: '12345',
        countryCode: 'SA',
      },
    },
    buyer: type === ZatcaInvoiceType.STANDARD_INVOICE ? {
      registrationName: 'Buyer Company',
      vatRegistrationNumber: '300000000000004',
      address: {
        buildingNumber: '5678',
        streetName: 'Buyer Street',
        districtName: 'Buyer District',
        cityName: 'Riyadh',
        postalCode: '12345',
        countryCode: 'SA',
      },
    } : undefined,
    lines: [
      {
        id: '1',
        name: 'Product',
        quantity: 1,
        unitPrice: amount / 1.15,
        netAmount: amount / 1.15,
        vatRate: 0.15,
        vatAmount: (amount / 1.15) * 0.15,
        totalAmount: amount,
        vatCategoryCode: 'S',
      },
    ],
    lineExtensionAmount: amount / 1.15,
    taxExclusiveAmount: amount / 1.15,
    taxInclusiveAmount: amount,
    payableAmount: amount,
    taxSubtotals: [
      {
        taxableAmount: amount / 1.15,
        taxAmount: (amount / 1.15) * 0.15,
        vatCategoryCode: 'S',
        vatRate: 0.15,
      },
    ],
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZatcaComplianceService,
        {
          provide: ZatcaClientService,
          useValue: mockClientService,
        },
        {
          provide: ZatcaInvoiceService,
          useValue: mockInvoiceService,
        },
      ],
    }).compile();

    service = module.get<ZatcaComplianceService>(ZatcaComplianceService);
    clientService = module.get<ZatcaClientService>(ZatcaClientService);
    invoiceService = module.get<ZatcaInvoiceService>(ZatcaInvoiceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('CSID Onboarding', () => {
    it('should onboard compliance CSID successfully', async () => {
      const mockResponse = {
        requestID: 'compliance-123',
        dispositionMessage: 'ISSUED',
        binarySecurityToken: 'base64-token',
        secret: 'secret-key',
        tokenExpiryDate: '2025-12-31T23:59:59Z',
      };

      mockClientService.requestComplianceCSID.mockResolvedValue(mockResponse);

      const config = {
        organizationName: 'Test Company',
        organizationIdentifier: '300000000000003',
        organizationalUnitName: 'Riyadh Branch',
        countryCode: 'SA',
        privateKey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
      };

      const result = await service.onboardComplianceCSID(config);

      expect(result).toBeDefined();
      expect(result.requestId).toBe('compliance-123');
      expect(result.dispositionMessage).toBe('ISSUED');
      expect(mockClientService.requestComplianceCSID).toHaveBeenCalled();
    });

    it('should handle CSID onboarding errors', async () => {
      mockClientService.requestComplianceCSID.mockRejectedValue(
        new Error('Invalid CSR'),
      );

      const config = {
        organizationName: 'Test Company',
        organizationIdentifier: '300000000000003',
        organizationalUnitName: 'Riyadh Branch',
        countryCode: 'SA',
        privateKey: 'invalid-key',
      };

      await expect(service.onboardComplianceCSID(config)).rejects.toThrow(
        /Compliance CSID onboarding failed/,
      );
    });

    it('should request production CSID', async () => {
      const mockResponse = {
        requestID: 'production-123',
        dispositionMessage: 'ISSUED',
        binarySecurityToken: 'base64-token',
        secret: 'secret-key',
        tokenExpiryDate: '2025-12-31T23:59:59Z',
      };

      mockClientService.requestProductionCSID.mockResolvedValue(mockResponse);

      const result = await service.requestProductionCSID('compliance-123');

      expect(result).toBeDefined();
      expect(result.requestId).toBe('production-123');
      expect(mockClientService.requestProductionCSID).toHaveBeenCalledWith('compliance-123');
    });
  });

  describe('Invoice Submission - Clearance', () => {
    it('should clear standard invoice above threshold', async () => {
      const invoiceData = createMockInvoice(2000, ZatcaInvoiceType.STANDARD_INVOICE); // Above 1000 SAR

      mockInvoiceService.generateUBLInvoice.mockReturnValue('<Invoice>...</Invoice>');
      mockInvoiceService.calculateHash.mockReturnValue({
        hash: 'invoice-hash',
        canonicalString: '<Invoice>...</Invoice>',
      });
      mockInvoiceService.generateStamp.mockReturnValue({
        signature: 'signature',
        publicKey: 'public-key',
        algorithm: 'ECDSA',
      });
      mockInvoiceService.generateQRCode.mockReturnValue('qr-code-base64');

      mockClientService.clearInvoice.mockResolvedValue({
        clearanceStatus: 'CLEARED',
        clearedInvoice: 'cleared-invoice-base64',
        validationResults: [],
        warnings: [],
      });

      const result = await service.submitInvoice(
        invoiceData,
        'previous-hash',
        'private-key',
        'public-key',
      );

      expect(result.success).toBe(true);
      expect(result.clearanceStatus).toBe('CLEARED');
      expect(mockClientService.clearInvoice).toHaveBeenCalled();
      expect(mockClientService.reportInvoice).not.toHaveBeenCalled();
    });

    it('should report standard invoice below threshold', async () => {
      const invoiceData = createMockInvoice(500, ZatcaInvoiceType.STANDARD_INVOICE); // Below 1000 SAR

      mockInvoiceService.generateUBLInvoice.mockReturnValue('<Invoice>...</Invoice>');
      mockInvoiceService.calculateHash.mockReturnValue({
        hash: 'invoice-hash',
        canonicalString: '<Invoice>...</Invoice>',
      });
      mockInvoiceService.generateStamp.mockReturnValue({
        signature: 'signature',
        publicKey: 'public-key',
        algorithm: 'ECDSA',
      });
      mockInvoiceService.generateQRCode.mockReturnValue('qr-code-base64');

      mockClientService.reportInvoice.mockResolvedValue({
        reportingStatus: 'REPORTED',
        validationResults: [],
        warnings: [],
      });

      const result = await service.submitInvoice(
        invoiceData,
        'previous-hash',
        'private-key',
        'public-key',
      );

      expect(result.success).toBe(true);
      expect(result.reportingStatus).toBe('REPORTED');
      expect(mockClientService.reportInvoice).toHaveBeenCalled();
      expect(mockClientService.clearInvoice).not.toHaveBeenCalled();
    });
  });

  describe('Invoice Submission - Reporting', () => {
    it('should report simplified invoice regardless of amount', async () => {
      const invoiceData = createMockInvoice(5000, ZatcaInvoiceType.SIMPLIFIED_INVOICE); // Above threshold

      mockInvoiceService.generateUBLInvoice.mockReturnValue('<Invoice>...</Invoice>');
      mockInvoiceService.calculateHash.mockReturnValue({
        hash: 'invoice-hash',
        canonicalString: '<Invoice>...</Invoice>',
      });
      mockInvoiceService.generateStamp.mockReturnValue({
        signature: 'signature',
        publicKey: 'public-key',
        algorithm: 'ECDSA',
      });
      mockInvoiceService.generateQRCode.mockReturnValue('qr-code-base64');

      mockClientService.reportInvoice.mockResolvedValue({
        reportingStatus: 'REPORTED',
        validationResults: [],
        warnings: [],
      });

      const result = await service.submitInvoice(
        invoiceData,
        'previous-hash',
        'private-key',
        'public-key',
      );

      expect(result.success).toBe(true);
      expect(result.reportingStatus).toBe('REPORTED');
      expect(mockClientService.reportInvoice).toHaveBeenCalled();
      expect(mockClientService.clearInvoice).not.toHaveBeenCalled();
    });
  });

  describe('Invoice Validation', () => {
    it('should validate invoice without submission', async () => {
      const invoiceData = createMockInvoice(1000, ZatcaInvoiceType.STANDARD_INVOICE);

      mockInvoiceService.generateUBLInvoice.mockReturnValue('<Invoice>...</Invoice>');
      mockInvoiceService.calculateHash.mockReturnValue({
        hash: 'invoice-hash',
        canonicalString: '<Invoice>...</Invoice>',
      });
      mockInvoiceService.generateStamp.mockReturnValue({
        signature: 'signature',
        publicKey: 'public-key',
        algorithm: 'ECDSA',
      });
      mockInvoiceService.generateQRCode.mockReturnValue('qr-code-base64');

      mockClientService.complianceCheck.mockResolvedValue({
        clearanceStatus: 'CLEARED',
        reportingStatus: 'REPORTED',
        validationResults: [
          {
            type: 'WARNING',
            code: 'W001',
            category: 'Business',
            message: 'Test warning',
            status: 'PASS',
          },
        ],
        warnings: [],
      });

      const result = await service.validateInvoice(
        invoiceData,
        'previous-hash',
        'private-key',
        'public-key',
      );

      expect(result.success).toBe(true);
      expect(result.validationResults).toBeDefined();
      expect(mockClientService.complianceCheck).toHaveBeenCalled();
    });

    it('should handle validation failures', async () => {
      const invoiceData = createMockInvoice(1000, ZatcaInvoiceType.STANDARD_INVOICE);

      mockInvoiceService.generateUBLInvoice.mockReturnValue('<Invoice>...</Invoice>');
      mockInvoiceService.calculateHash.mockReturnValue({
        hash: 'invoice-hash',
        canonicalString: '<Invoice>...</Invoice>',
      });
      mockInvoiceService.generateStamp.mockReturnValue({
        signature: 'signature',
        publicKey: 'public-key',
        algorithm: 'ECDSA',
      });
      mockInvoiceService.generateQRCode.mockReturnValue('qr-code-base64');

      mockClientService.complianceCheck.mockRejectedValue(
        new Error('Validation failed'),
      );

      const result = await service.validateInvoice(
        invoiceData,
        'previous-hash',
        'private-key',
        'public-key',
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('VALIDATION_FAILED');
      expect(result.errorMessage).toContain('Validation failed');
    });
  });

  describe('Clearance Threshold Logic', () => {
    it(`should use clearance for standard invoice > ${CLEARANCE_THRESHOLD_SAR} SAR`, async () => {
      const invoiceData = createMockInvoice(
        CLEARANCE_THRESHOLD_SAR + 1,
        ZatcaInvoiceType.STANDARD_INVOICE,
      );

      mockInvoiceService.generateUBLInvoice.mockReturnValue('<Invoice>...</Invoice>');
      mockInvoiceService.calculateHash.mockReturnValue({ hash: 'hash', canonicalString: 'str' });
      mockInvoiceService.generateStamp.mockReturnValue({
        signature: 'sig',
        publicKey: 'key',
        algorithm: 'ECDSA',
      });
      mockInvoiceService.generateQRCode.mockReturnValue('qr');
      mockClientService.clearInvoice.mockResolvedValue({
        clearanceStatus: 'CLEARED',
        clearedInvoice: 'cleared',
        validationResults: [],
        warnings: [],
      });

      await service.submitInvoice(invoiceData, 'prev-hash', 'priv', 'pub');

      expect(mockClientService.clearInvoice).toHaveBeenCalled();
    });

    it(`should use reporting for standard invoice <= ${CLEARANCE_THRESHOLD_SAR} SAR`, async () => {
      const invoiceData = createMockInvoice(
        CLEARANCE_THRESHOLD_SAR,
        ZatcaInvoiceType.STANDARD_INVOICE,
      );

      mockInvoiceService.generateUBLInvoice.mockReturnValue('<Invoice>...</Invoice>');
      mockInvoiceService.calculateHash.mockReturnValue({ hash: 'hash', canonicalString: 'str' });
      mockInvoiceService.generateStamp.mockReturnValue({
        signature: 'sig',
        publicKey: 'key',
        algorithm: 'ECDSA',
      });
      mockInvoiceService.generateQRCode.mockReturnValue('qr');
      mockClientService.reportInvoice.mockResolvedValue({
        reportingStatus: 'REPORTED',
        validationResults: [],
        warnings: [],
      });

      await service.submitInvoice(invoiceData, 'prev-hash', 'priv', 'pub');

      expect(mockClientService.reportInvoice).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle invoice generation errors', async () => {
      const invoiceData = createMockInvoice(1000, ZatcaInvoiceType.STANDARD_INVOICE);

      mockInvoiceService.generateUBLInvoice.mockImplementation(() => {
        throw new Error('XML generation failed');
      });

      const result = await service.submitInvoice(
        invoiceData,
        'previous-hash',
        'private-key',
        'public-key',
      );

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('XML generation failed');
    });

    it('should handle hash calculation errors', async () => {
      const invoiceData = createMockInvoice(1000, ZatcaInvoiceType.STANDARD_INVOICE);

      mockInvoiceService.generateUBLInvoice.mockReturnValue('<Invoice>...</Invoice>');
      mockInvoiceService.calculateHash.mockImplementation(() => {
        throw new Error('Hash calculation failed');
      });

      const result = await service.submitInvoice(
        invoiceData,
        'previous-hash',
        'private-key',
        'public-key',
      );

      expect(result.success).toBe(false);
    });
  });

  describe('Compliance Testing', () => {
    it('should test compliance with sample invoice', async () => {
      const sampleInvoice = createMockInvoice(1000, ZatcaInvoiceType.STANDARD_INVOICE);

      mockInvoiceService.generateUBLInvoice.mockReturnValue('<Invoice>...</Invoice>');
      mockInvoiceService.calculateHash.mockReturnValue({
        hash: 'hash',
        canonicalString: 'str',
      });
      mockInvoiceService.generateStamp.mockReturnValue({
        signature: 'sig',
        publicKey: 'key',
        algorithm: 'ECDSA',
      });
      mockInvoiceService.generateQRCode.mockReturnValue('qr');
      mockClientService.complianceCheck.mockResolvedValue({
        clearanceStatus: 'CLEARED',
        reportingStatus: 'REPORTED',
        validationResults: [],
        warnings: [],
      });

      const result = await service.testCompliance(
        sampleInvoice,
        'private-key',
        'public-key',
      );

      expect(result).toBe(true);
    });

    it('should return false on compliance test failure', async () => {
      const sampleInvoice = createMockInvoice(1000, ZatcaInvoiceType.STANDARD_INVOICE);

      mockInvoiceService.generateUBLInvoice.mockReturnValue('<Invoice>...</Invoice>');
      mockInvoiceService.calculateHash.mockReturnValue({
        hash: 'hash',
        canonicalString: 'str',
      });
      mockInvoiceService.generateStamp.mockReturnValue({
        signature: 'sig',
        publicKey: 'key',
        algorithm: 'ECDSA',
      });
      mockInvoiceService.generateQRCode.mockReturnValue('qr');
      mockClientService.complianceCheck.mockRejectedValue(
        new Error('Compliance failed'),
      );

      const result = await service.testCompliance(
        sampleInvoice,
        'private-key',
        'public-key',
      );

      expect(result).toBe(false);
    });
  });
});
