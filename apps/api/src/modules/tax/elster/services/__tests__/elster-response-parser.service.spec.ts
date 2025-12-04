import { Test, TestingModule } from '@nestjs/testing';
import { ElsterResponseParserService } from '../elster-response-parser.service';
import {
  TigerVATResponse,
  StatusCode,
  ActionType,
  ErrorCategory,
} from '../../types/elster-response.types';

describe('ElsterResponseParserService', () => {
  let service: ElsterResponseParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ElsterResponseParserService],
    }).compile();

    service = module.get<ElsterResponseParserService>(
      ElsterResponseParserService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseResponse', () => {
    it('should parse successful response', () => {
      const response: TigerVATResponse = {
        success: true,
        transferTicket: 'TT-2024-123456',
        elsterRequestId: 'ER-789012',
        timestamp: '2024-01-15T10:30:00Z',
        status: {
          code: 'SUCCESS',
          message: 'Successfully submitted',
        },
      };

      const parsed = service.parseResponse(response);

      expect(parsed.success).toBe(true);
      expect(parsed.transferTicket).toBe('TT-2024-123456');
      expect(parsed.elsterReference).toBe('ER-789012');
      expect(parsed.status.code).toBe(StatusCode.SUCCESS);
      expect(parsed.errors).toHaveLength(0);
      expect(parsed.warnings).toHaveLength(0);
      expect(parsed.displayMessages).toHaveLength(1);
      expect(parsed.displayMessages[0].type).toBe('success');
    });

    it('should parse validation error response', () => {
      const response: TigerVATResponse = {
        success: false,
        timestamp: '2024-01-15T10:30:00Z',
        errors: [
          {
            code: 'ELSTER_VAL_001',
            field: 'taxNumber',
            message: 'Invalid tax number format',
            severity: 'error',
          },
        ],
        status: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
        },
      };

      const parsed = service.parseResponse(response);

      expect(parsed.success).toBe(false);
      expect(parsed.errors).toHaveLength(1);
      expect(parsed.errors[0].code).toBe('ELSTER_VAL_001');
      expect(parsed.errors[0].field).toBe('taxNumber');
      expect(parsed.errors[0].fieldLabel).toBe('Steuernummer');
      expect(parsed.errors[0].category).toBe(ErrorCategory.VALIDATION);
      expect(parsed.errors[0].isRetryable).toBe(false);
      expect(parsed.status.code).toBe(StatusCode.VALIDATION_ERROR);
    });

    it('should parse certificate error response', () => {
      const response: TigerVATResponse = {
        success: false,
        timestamp: '2024-01-15T10:30:00Z',
        errors: [
          {
            code: 'ELSTER_CERT_001',
            field: 'certificate',
            message: 'Certificate has expired',
            severity: 'error',
          },
        ],
      };

      const parsed = service.parseResponse(response);

      expect(parsed.errors).toHaveLength(1);
      expect(parsed.errors[0].category).toBe(ErrorCategory.CERTIFICATE);
      expect(parsed.status.code).toBe(StatusCode.CERTIFICATE_ERROR);
      expect(parsed.suggestedActions).toContainEqual(
        expect.objectContaining({
          type: ActionType.CHECK_CERTIFICATE,
        }),
      );
    });

    it('should parse multiple errors', () => {
      const response: TigerVATResponse = {
        success: false,
        timestamp: '2024-01-15T10:30:00Z',
        errors: [
          {
            code: 'ELSTER_VAL_001',
            field: 'taxNumber',
            message: 'Invalid tax number',
            severity: 'error',
          },
          {
            code: 'ELSTER_VAL_002',
            field: 'vatId',
            message: 'Invalid VAT ID',
            severity: 'error',
          },
          {
            code: 'ELSTER_VAL_010',
            field: 'period',
            message: 'Invalid period',
            severity: 'error',
          },
        ],
      };

      const parsed = service.parseResponse(response);

      expect(parsed.errors).toHaveLength(3);
      expect(parsed.suggestedActions.length).toBeGreaterThan(0);
      expect(parsed.displayMessages.length).toBeGreaterThan(0);
    });

    it('should parse warnings', () => {
      const response: TigerVATResponse = {
        success: true,
        transferTicket: 'TT-2024-123456',
        timestamp: '2024-01-15T10:30:00Z',
        warnings: [
          {
            code: 'WARN_001',
            field: 'inputTax',
            message: 'Input tax is unusually high',
            severity: 'warning',
          },
        ],
      };

      const parsed = service.parseResponse(response);

      expect(parsed.success).toBe(true);
      expect(parsed.warnings).toHaveLength(1);
      expect(parsed.warnings[0].code).toBe('WARN_001');
    });

    it('should handle unknown error codes', () => {
      const response: TigerVATResponse = {
        success: false,
        timestamp: '2024-01-15T10:30:00Z',
        errors: [
          {
            code: 'UNKNOWN_ERROR_999',
            message: 'Some unknown error',
            severity: 'error',
          },
        ],
      };

      const parsed = service.parseResponse(response);

      expect(parsed.errors).toHaveLength(1);
      expect(parsed.errors[0].code).toBe('UNKNOWN_ERROR_999');
      expect(parsed.errors[0].category).toBe(ErrorCategory.TECHNICAL);
      expect(parsed.errors[0].isRetryable).toBe(true); // Default
    });

    it('should include raw response when configured', () => {
      const response: TigerVATResponse = {
        success: true,
        transferTicket: 'TT-2024-123456',
        timestamp: '2024-01-15T10:30:00Z',
        rawResponse: { some: 'data' },
      };

      const parsed = service.parseResponse(response, {
        includeRawResponse: true,
      });

      expect(parsed.rawResponse).toBeDefined();
      expect(parsed.rawResponse.some).toBe('data');
    });

    it('should not include raw response by default', () => {
      const response: TigerVATResponse = {
        success: true,
        transferTicket: 'TT-2024-123456',
        timestamp: '2024-01-15T10:30:00Z',
      };

      const parsed = service.parseResponse(response);

      expect(parsed.rawResponse).toBeUndefined();
    });
  });

  describe('getErrorMessage', () => {
    it('should return localized message for known error code', () => {
      const message = service.getErrorMessage('ELSTER_VAL_001');
      expect(message).toBe('Die Steuernummer hat ein ungültiges Format');
    });

    it('should return default message for unknown error code', () => {
      const message = service.getErrorMessage('UNKNOWN_CODE');
      expect(message).toBe('Ein unbekannter Fehler ist aufgetreten');
    });
  });

  describe('mapErrorToField', () => {
    it('should map error code to field name', () => {
      const field = service.mapErrorToField('ELSTER_VAL_001');
      expect(field).toBe('taxNumber');
    });

    it('should return null for codes without field mapping', () => {
      const field = service.mapErrorToField('ELSTER_TECH_001');
      expect(field).toBeNull();
    });

    it('should return null for unknown codes', () => {
      const field = service.mapErrorToField('UNKNOWN_CODE');
      expect(field).toBeNull();
    });
  });

  describe('getSuggestedFixes', () => {
    it('should return suggested fixes for errors', () => {
      const errors = [
        {
          code: 'ELSTER_VAL_001',
          message: 'Invalid tax number',
          severity: 'error' as const,
        },
      ];

      const fixes = service.getSuggestedFixes(errors);

      expect(fixes.length).toBeGreaterThan(0);
      expect(fixes[0].type).toBe(ActionType.FIX_FIELD);
      expect(fixes[0].field).toBe('taxNumber');
    });

    it('should return retry action for retryable errors', () => {
      const errors = [
        {
          code: 'ELSTER_TECH_001',
          message: 'System unavailable',
          severity: 'error' as const,
        },
      ];

      const fixes = service.getSuggestedFixes(errors);

      expect(fixes.length).toBeGreaterThan(0);
      expect(fixes[0].type).toBe(ActionType.RETRY);
    });

    it('should return certificate action for certificate errors', () => {
      const errors = [
        {
          code: 'ELSTER_CERT_001',
          message: 'Certificate expired',
          severity: 'error' as const,
        },
      ];

      const fixes = service.getSuggestedFixes(errors);

      expect(fixes.length).toBeGreaterThan(0);
      expect(fixes[0].type).toBe(ActionType.CHECK_CERTIFICATE);
    });
  });

  describe('isRetryable', () => {
    it('should return false for validation errors', () => {
      const error = {
        code: 'ELSTER_VAL_001',
        message: 'Invalid tax number',
        severity: 'error' as const,
      };

      expect(service.isRetryable(error)).toBe(false);
    });

    it('should return true for technical errors', () => {
      const error = {
        code: 'ELSTER_TECH_001',
        message: 'System unavailable',
        severity: 'error' as const,
      };

      expect(service.isRetryable(error)).toBe(true);
    });

    it('should return true by default for unknown codes', () => {
      const error = {
        code: 'UNKNOWN_CODE',
        message: 'Unknown error',
        severity: 'error' as const,
      };

      expect(service.isRetryable(error)).toBe(true);
    });
  });

  describe('formatForDisplay', () => {
    it('should format successful response for display', () => {
      const parsed = service.parseResponse({
        success: true,
        transferTicket: 'TT-2024-123456',
        timestamp: '2024-01-15T10:30:00Z',
      });

      const display = service.formatForDisplay(parsed);

      expect(display.success).toBe(true);
      expect(display.title).toBe('Erfolgreich');
      expect(display.transferTicket).toBe('TT-2024-123456');
      expect(display.errors).toHaveLength(0);
    });

    it('should format error response for display', () => {
      const parsed = service.parseResponse({
        success: false,
        timestamp: '2024-01-15T10:30:00Z',
        errors: [
          {
            code: 'ELSTER_VAL_001',
            field: 'taxNumber',
            message: 'Invalid tax number',
            severity: 'error',
          },
        ],
      });

      const display = service.formatForDisplay(parsed);

      expect(display.success).toBe(false);
      expect(display.title).toBe('Fehler');
      expect(display.errors).toHaveLength(1);
      expect(display.errors[0].field).toBe('taxNumber');
      expect(display.errors[0].canRetry).toBe(false);
    });

    it('should include actions in display', () => {
      const parsed = service.parseResponse({
        success: false,
        timestamp: '2024-01-15T10:30:00Z',
        errors: [
          {
            code: 'ELSTER_CERT_001',
            message: 'Certificate expired',
            severity: 'error',
          },
        ],
      });

      const display = service.formatForDisplay(parsed);

      expect(display.actions.length).toBeGreaterThan(0);
      expect(display.actions[0].isPrimary).toBe(true);
    });
  });

  describe('isFinalStatus', () => {
    it('should return true for success status', () => {
      const response: TigerVATResponse = {
        success: true,
        transferTicket: 'TT-2024-123456',
        timestamp: '2024-01-15T10:30:00Z',
      };

      expect(service.isFinalStatus(response)).toBe(true);
    });

    it('should return false for pending status', () => {
      const response: TigerVATResponse = {
        success: false,
        timestamp: '2024-01-15T10:30:00Z',
        status: {
          code: 'PENDING',
          message: 'Processing',
        },
      };

      expect(service.isFinalStatus(response)).toBe(false);
    });

    it('should return true for validation errors', () => {
      const response: TigerVATResponse = {
        success: false,
        timestamp: '2024-01-15T10:30:00Z',
        errors: [
          {
            code: 'ELSTER_VAL_001',
            message: 'Validation error',
            severity: 'error',
          },
        ],
      };

      expect(service.isFinalStatus(response)).toBe(true);
    });
  });

  describe('canRetry', () => {
    it('should return false for validation errors', () => {
      const response: TigerVATResponse = {
        success: false,
        timestamp: '2024-01-15T10:30:00Z',
        errors: [
          {
            code: 'ELSTER_VAL_001',
            message: 'Validation error',
            severity: 'error',
          },
        ],
      };

      expect(service.canRetry(response)).toBe(false);
    });

    it('should return true for technical errors', () => {
      const response: TigerVATResponse = {
        success: false,
        timestamp: '2024-01-15T10:30:00Z',
        errors: [
          {
            code: 'ELSTER_TECH_001',
            message: 'System unavailable',
            severity: 'error',
          },
        ],
      };

      expect(service.canRetry(response)).toBe(true);
    });
  });

  describe('extractErrorCodes', () => {
    it('should extract all error codes', () => {
      const response: TigerVATResponse = {
        success: false,
        timestamp: '2024-01-15T10:30:00Z',
        errors: [
          {
            code: 'ELSTER_VAL_001',
            message: 'Error 1',
            severity: 'error',
          },
          {
            code: 'ELSTER_VAL_002',
            message: 'Error 2',
            severity: 'error',
          },
        ],
      };

      const codes = service.extractErrorCodes(response);

      expect(codes).toEqual(['ELSTER_VAL_001', 'ELSTER_VAL_002']);
    });

    it('should return empty array for no errors', () => {
      const response: TigerVATResponse = {
        success: true,
        transferTicket: 'TT-2024-123456',
        timestamp: '2024-01-15T10:30:00Z',
      };

      const codes = service.extractErrorCodes(response);

      expect(codes).toEqual([]);
    });
  });

  describe('hasErrorCategory', () => {
    it('should detect validation errors', () => {
      const response: TigerVATResponse = {
        success: false,
        timestamp: '2024-01-15T10:30:00Z',
        errors: [
          {
            code: 'ELSTER_VAL_001',
            message: 'Validation error',
            severity: 'error',
          },
        ],
      };

      expect(service.hasErrorCategory(response, ErrorCategory.VALIDATION)).toBe(
        true,
      );
      expect(
        service.hasErrorCategory(response, ErrorCategory.CERTIFICATE),
      ).toBe(false);
    });

    it('should detect certificate errors', () => {
      const response: TigerVATResponse = {
        success: false,
        timestamp: '2024-01-15T10:30:00Z',
        errors: [
          {
            code: 'ELSTER_CERT_001',
            message: 'Certificate error',
            severity: 'error',
          },
        ],
      };

      expect(
        service.hasErrorCategory(response, ErrorCategory.CERTIFICATE),
      ).toBe(true);
      expect(service.hasErrorCategory(response, ErrorCategory.VALIDATION)).toBe(
        false,
      );
    });
  });

  describe('status determination', () => {
    it('should determine success status from transfer ticket', () => {
      const response: TigerVATResponse = {
        success: true,
        transferTicket: 'TT-2024-123456',
        timestamp: '2024-01-15T10:30:00Z',
      };

      const parsed = service.parseResponse(response);

      expect(parsed.status.code).toBe(StatusCode.SUCCESS);
      expect(parsed.status.isFinal).toBe(true);
      expect(parsed.status.isRetryable).toBe(false);
    });

    it('should determine pending status', () => {
      const response: TigerVATResponse = {
        success: false,
        timestamp: '2024-01-15T10:30:00Z',
        status: {
          code: 'PROCESSING',
          message: 'Being processed',
        },
      };

      const parsed = service.parseResponse(response);

      expect(parsed.status.code).toBe(StatusCode.PENDING);
      expect(parsed.status.isFinal).toBe(false);
    });

    it('should determine timeout status', () => {
      const response: TigerVATResponse = {
        success: false,
        timestamp: '2024-01-15T10:30:00Z',
        status: {
          code: 'TIMEOUT',
          message: 'Request timed out',
        },
      };

      const parsed = service.parseResponse(response);

      expect(parsed.status.code).toBe(StatusCode.TIMEOUT);
      expect(parsed.status.isRetryable).toBe(true);
    });
  });
});
