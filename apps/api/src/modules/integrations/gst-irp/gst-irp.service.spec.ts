/**
 * GST IRP Service Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GstIrpService } from './gst-irp.service';
import { GstIrpClient } from './gst-irp.client';
import { GstIrpValidationService } from './utils/gst-irp-validation.service';
import { GstIrpAuditService } from './gst-irp-audit.service';
import {
  IrpEInvoiceRequest,
  IrpIrnResponse,
  IrpCancelResponse,
  GstInvoiceType,
  SupplyType,
  DocumentStatus,
} from './gst-irp.types';

describe('GstIrpService', () => {
  let service: GstIrpService;
  let client: jest.Mocked<GstIrpClient>;
  let validationService: jest.Mocked<GstIrpValidationService>;
  let auditService: jest.Mocked<GstIrpAuditService>;

  const mockInvoiceData: IrpEInvoiceRequest = {
    version: '1.1',
    tranDtls: {
      taxSch: 'GST',
      supTyp: SupplyType.B2B,
    },
    docDtls: {
      typ: GstInvoiceType.INVOICE,
      no: 'INV/2024/001',
      dt: '01/01/2024',
    },
    sellerDtls: {
      gstin: '29AABCT1332L000',
      legalName: 'Test Seller Pvt Ltd',
      address: {
        pincode: '560001',
        stateCode: '29',
      },
    },
    buyerDtls: {
      gstin: '29AABCT1332L001',
      legalName: 'Test Buyer Pvt Ltd',
      address: {
        pincode: '560002',
        stateCode: '29',
      },
    },
    itemList: [
      {
        slNo: '1',
        productDescription: 'Test Product',
        isService: 'N',
        hsnCode: '1234',
        quantity: 1,
        unit: 'NOS',
        unitPrice: 100,
        totAmount: 100,
        assAmount: 100,
        gstRate: 18,
        cgstAmount: 9,
        sgstAmount: 9,
        totItemValue: 118,
      },
    ],
    valDtls: {
      assVal: 100,
      cgstVal: 9,
      sgstVal: 9,
      totInvVal: 118,
    },
  };

  const mockIrnResponse: IrpIrnResponse = {
    irn: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    ackNo: 'ACK123456789',
    ackDt: '01/01/2024 10:30:00',
    signedInvoice: 'base64_signed_invoice_data',
    signedQrCode: 'base64_qr_code_data',
    status: DocumentStatus.ACTIVE,
  };

  beforeEach(async () => {
    const mockClient = {
      makeRequest: jest.fn(),
      isAuthenticated: jest.fn().mockReturnValue(true),
      getRateLimitStatus: jest.fn().mockReturnValue({
        requestsThisSecond: 0,
        requestsThisMinute: 0,
        requestsThisHour: 0,
        requestsToday: 0,
      }),
      getConfig: jest.fn().mockReturnValue({
        environment: 'sandbox',
        gstin: '29AABCT1332L000',
      }),
    };

    const mockValidationService = {
      validateInvoice: jest.fn().mockReturnValue({
        isValid: true,
        errors: [],
      }),
      validateGstin: jest.fn().mockReturnValue(true),
      validateIrn: jest.fn().mockReturnValue(true),
      validateDate: jest.fn().mockReturnValue(true),
    };

    const mockAuditService = {
      logOperation: jest.fn().mockResolvedValue(undefined),
      getAuditLogs: jest.fn().mockResolvedValue([]),
      getAuditLogByIrn: jest.fn().mockResolvedValue(null),
      getAuditStats: jest.fn().mockResolvedValue({
        totalOperations: 0,
        successCount: 0,
        errorCount: 0,
        byOperation: {},
        byStatus: {},
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GstIrpService,
        { provide: GstIrpClient, useValue: mockClient },
        { provide: GstIrpValidationService, useValue: mockValidationService },
        { provide: GstIrpAuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<GstIrpService>(GstIrpService);
    client = module.get(GstIrpClient);
    validationService = module.get(GstIrpValidationService);
    auditService = module.get(GstIrpAuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateIrn', () => {
    it('should generate IRN successfully', async () => {
      client.makeRequest.mockResolvedValue(mockIrnResponse);

      const result = await service.generateIrn(mockInvoiceData);

      expect(result).toEqual(mockIrnResponse);
      expect(validationService.validateInvoice).toHaveBeenCalledWith(mockInvoiceData);
      expect(client.makeRequest).toHaveBeenCalled();
      expect(auditService.logOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'generate',
          status: 'success',
          irn: mockIrnResponse.irn,
        }),
      );
    });

    it('should throw error if validation fails', async () => {
      validationService.validateInvoice.mockReturnValue({
        isValid: false,
        errors: [
          {
            field: 'docDtls.no',
            message: 'Invalid document number',
            code: 'INVALID_DOC_NUMBER',
          },
        ],
      });

      await expect(service.generateIrn(mockInvoiceData)).rejects.toThrow('Validation failed');
    });

    it('should log audit entry on failure', async () => {
      const error = new Error('API Error');
      client.makeRequest.mockRejectedValue(error);

      await expect(service.generateIrn(mockInvoiceData)).rejects.toThrow('API Error');
      expect(auditService.logOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'generate',
          status: 'error',
          errorMessage: 'API Error',
        }),
      );
    });
  });

  describe('generateIrnHash', () => {
    it('should generate correct IRN hash', () => {
      const hash = service.generateIrnHash({
        supplyType: SupplyType.B2B,
        documentType: GstInvoiceType.INVOICE,
        documentNumber: 'INV/2024/001',
        documentDate: '01/01/2024',
        sellerGstin: '29AABCT1332L000',
        buyerGstin: '29AABCT1332L001',
        totalInvoiceValue: 118.0,
      });

      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64); // SHA-256 produces 64 hex characters
      expect(/^[0-9a-f]{64}$/i.test(hash)).toBe(true);
    });

    it('should generate same hash for same input', () => {
      const input = {
        supplyType: SupplyType.B2B,
        documentType: GstInvoiceType.INVOICE,
        documentNumber: 'INV/2024/001',
        documentDate: '01/01/2024',
        sellerGstin: '29AABCT1332L000',
        buyerGstin: '29AABCT1332L001',
        totalInvoiceValue: 118.0,
      };

      const hash1 = service.generateIrnHash(input);
      const hash2 = service.generateIrnHash(input);

      expect(hash1).toEqual(hash2);
    });

    it('should generate different hash for different input', () => {
      const input1 = {
        supplyType: SupplyType.B2B,
        documentType: GstInvoiceType.INVOICE,
        documentNumber: 'INV/2024/001',
        documentDate: '01/01/2024',
        sellerGstin: '29AABCT1332L000',
        buyerGstin: '29AABCT1332L001',
        totalInvoiceValue: 118.0,
      };

      const input2 = { ...input1, documentNumber: 'INV/2024/002' };

      const hash1 = service.generateIrnHash(input1);
      const hash2 = service.generateIrnHash(input2);

      expect(hash1).not.toEqual(hash2);
    });
  });

  describe('cancelIrn', () => {
    it('should cancel IRN successfully', async () => {
      const cancelResponse: IrpCancelResponse = {
        irn: mockIrnResponse.irn,
        cancelDate: '01/01/2024',
        status: DocumentStatus.CANCELLED,
      };

      client.makeRequest.mockResolvedValue(cancelResponse);

      const result = await service.cancelIrn({
        irn: mockIrnResponse.irn,
        cnlRsn: '1',
        cnlRem: 'Duplicate invoice',
      });

      expect(result).toEqual(cancelResponse);
      expect(client.makeRequest).toHaveBeenCalled();
      expect(auditService.logOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'cancel',
          status: 'success',
        }),
      );
    });

    it('should throw error for invalid IRN format', async () => {
      await expect(
        service.cancelIrn({
          irn: 'invalid_irn',
          cnlRsn: '1',
          cnlRem: 'Test',
        }),
      ).rejects.toThrow('Invalid IRN format');
    });

    it('should throw error for invalid cancellation reason', async () => {
      await expect(
        service.cancelIrn({
          irn: mockIrnResponse.irn,
          cnlRsn: '5', // Invalid reason code
          cnlRem: 'Test',
        }),
      ).rejects.toThrow('Invalid cancellation reason code');
    });
  });

  describe('getIrnByIrn', () => {
    it('should fetch IRN details successfully', async () => {
      const irnDetails = {
        ...mockIrnResponse,
        invoiceData: mockInvoiceData,
      };

      client.makeRequest.mockResolvedValue(irnDetails);

      const result = await service.getIrnByIrn(mockIrnResponse.irn);

      expect(result).toEqual(irnDetails);
      expect(client.makeRequest).toHaveBeenCalled();
    });

    it('should throw error for invalid IRN format', async () => {
      await expect(service.getIrnByIrn('invalid_irn')).rejects.toThrow('Invalid IRN format');
    });
  });

  describe('generateQrCode', () => {
    it('should generate QR code successfully', async () => {
      const qrCode = await service.generateQrCode(mockIrnResponse, mockInvoiceData);

      expect(qrCode).toBeDefined();
      expect(qrCode).toContain('data:image/png;base64');
    });
  });

  describe('generateBulkIrn', () => {
    it('should process bulk invoices successfully', async () => {
      const bulkRequest = {
        invoices: [mockInvoiceData, mockInvoiceData],
      };

      client.makeRequest.mockResolvedValue(mockIrnResponse);

      const result = await service.generateBulkIrn(bulkRequest);

      expect(result.results).toHaveLength(2);
      expect(result.results.every(r => r.status === 'success')).toBe(true);
    });

    it('should throw error if batch size exceeds limit', async () => {
      const bulkRequest = {
        invoices: Array(101).fill(mockInvoiceData),
      };

      await expect(service.generateBulkIrn(bulkRequest)).rejects.toThrow(
        'Batch size exceeds limit',
      );
    });

    it('should handle partial failures in bulk processing', async () => {
      const bulkRequest = {
        invoices: [mockInvoiceData, mockInvoiceData],
      };

      client.makeRequest
        .mockResolvedValueOnce(mockIrnResponse)
        .mockRejectedValueOnce(new Error('API Error'));

      const result = await service.generateBulkIrn(bulkRequest);

      expect(result.results).toHaveLength(2);
      expect(result.results[0].status).toBe('success');
      expect(result.results[1].status).toBe('error');
    });
  });

  describe('canCancelIrn', () => {
    it('should return true if IRN can be cancelled (within 24 hours)', async () => {
      const recentAckDt = new Date();
      recentAckDt.setHours(recentAckDt.getHours() - 1); // 1 hour ago
      const formattedDate = service.formatGstDate(recentAckDt);

      const irnDetails = {
        ...mockIrnResponse,
        ackDt: formattedDate,
        invoiceData: mockInvoiceData,
      };

      client.makeRequest.mockResolvedValue(irnDetails);

      const canCancel = await service.canCancelIrn(mockIrnResponse.irn);

      expect(canCancel).toBe(true);
    });

    it('should return false if IRN is already cancelled', async () => {
      const irnDetails = {
        ...mockIrnResponse,
        status: DocumentStatus.CANCELLED,
        invoiceData: mockInvoiceData,
      };

      client.makeRequest.mockResolvedValue(irnDetails);

      const canCancel = await service.canCancelIrn(mockIrnResponse.irn);

      expect(canCancel).toBe(false);
    });

    it('should return false if more than 24 hours have passed', async () => {
      const oldAckDt = new Date();
      oldAckDt.setHours(oldAckDt.getHours() - 25); // 25 hours ago
      const formattedDate = service.formatGstDate(oldAckDt);

      const irnDetails = {
        ...mockIrnResponse,
        ackDt: formattedDate,
        invoiceData: mockInvoiceData,
      };

      client.makeRequest.mockResolvedValue(irnDetails);

      const canCancel = await service.canCancelIrn(mockIrnResponse.irn);

      expect(canCancel).toBe(false);
    });
  });

  describe('formatGstDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = service.formatGstDate(date);

      expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });
  });

  describe('getHealthStatus', () => {
    it('should return health status', async () => {
      const health = await service.getHealthStatus();

      expect(health).toHaveProperty('service');
      expect(health).toHaveProperty('authenticated');
      expect(health).toHaveProperty('rateLimits');
      expect(health).toHaveProperty('config');
    });
  });
});
