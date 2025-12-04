import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { AtoBasService } from '../ato-bas.service';
import { AtoAuthService } from '../ato-auth.service';
import {
  BusinessActivityStatement,
  BasFilingRequest,
  AtoTokenResponse,
  AtoFilingStatus,
  BasGstCalculation,
} from '../ato.types';
import { BAS_PERIODS, ATO_ERROR_CODES } from '../ato.constants';

describe('AtoBasService', () => {
  let service: AtoBasService;
  let authService: AtoAuthService;
  let configService: ConfigService;

  const mockToken: AtoTokenResponse = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    scope: 'bas stp',
    issuedAt: new Date(),
  };

  const mockBasStatement: BusinessActivityStatement = {
    abn: '12345678901',
    period: '2024-Q1',
    periodType: 'QUARTERLY' as keyof typeof BAS_PERIODS,
    dueDate: new Date('2024-07-28'),
    gst: {
      g1TotalSales: 110000,
      g2ExportSales: 0,
      g3OtherGstFreeSales: 10000,
      g4InputTaxedSales: 0,
      g10CapitalPurchases: 5000,
      g11NonCapitalPurchases: 40000,
    } as BasGstCalculation,
    declarationName: 'John Doe',
    declarationDate: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AtoBasService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                ATO_ENVIRONMENT: 'sandbox',
                ATO_CLIENT_ID: 'test-client-id',
              };
              return config[key];
            }),
          },
        },
        {
          provide: AtoAuthService,
          useValue: {
            validateAndRefreshToken: jest.fn().mockResolvedValue(mockToken),
          },
        },
      ],
    }).compile();

    service = module.get<AtoBasService>(AtoBasService);
    authService = module.get<AtoAuthService>(AtoAuthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('BAS Validation', () => {
    it('should validate correct ABN format', () => {
      const request: BasFilingRequest = {
        organizationId: 'org-123',
        abn: '12345678901',
        statement: mockBasStatement,
      };

      expect(() => service['validateBas'](request.statement)).not.toThrow();
    });

    it('should reject invalid ABN format', () => {
      const invalidStatement = {
        ...mockBasStatement,
        abn: '123', // Invalid ABN
      };

      expect(() => service['validateBas'](invalidStatement)).toThrow(
        BadRequestException,
      );
    });

    it('should validate period format for quarterly BAS', () => {
      const statement = {
        ...mockBasStatement,
        period: '2024-Q2',
        periodType: 'QUARTERLY' as keyof typeof BAS_PERIODS,
      };

      expect(() => service['validateBas'](statement)).not.toThrow();
    });

    it('should reject invalid period format', () => {
      const statement = {
        ...mockBasStatement,
        period: 'INVALID',
        periodType: 'QUARTERLY' as keyof typeof BAS_PERIODS,
      };

      expect(() => service['validateBas'](statement)).toThrow(
        BadRequestException,
      );
    });

    it('should validate monthly period format', () => {
      const statement = {
        ...mockBasStatement,
        period: '2024-07',
        periodType: 'MONTHLY' as keyof typeof BAS_PERIODS,
      };

      expect(() => service['validateBas'](statement)).not.toThrow();
    });

    it('should validate annual period format', () => {
      const statement = {
        ...mockBasStatement,
        period: '2024',
        periodType: 'ANNUAL' as keyof typeof BAS_PERIODS,
      };

      expect(() => service['validateBas'](statement)).not.toThrow();
    });
  });

  describe('GST Calculation', () => {
    it('should calculate GST labels correctly', () => {
      const labels = service['calculateBasLabels'](mockBasStatement);

      // Check key GST labels
      const g1 = labels.find((l) => l.label === 'G1');
      expect(g1?.amount).toBe(110000);

      const g2 = labels.find((l) => l.label === 'G2');
      expect(g2?.amount).toBe(0);

      const g3 = labels.find((l) => l.label === 'G3');
      expect(g3?.amount).toBe(10000);

      // G5 = G2 + G3 + G4
      const g5 = labels.find((l) => l.label === 'G5');
      expect(g5?.amount).toBe(10000);

      // G6 = G1 - G5
      const g6 = labels.find((l) => l.label === 'G6');
      expect(g6?.amount).toBe(100000);

      // G8 = G6 + G7 (no G7, so same as G6)
      const g8 = labels.find((l) => l.label === 'G8');
      expect(g8?.amount).toBe(100000);

      // G9 = G8 * 10%
      const g9 = labels.find((l) => l.label === 'G9');
      expect(g9?.amount).toBe(10000);

      // G12 = G10 + G11
      const g12 = labels.find((l) => l.label === 'G12');
      expect(g12?.amount).toBe(45000);

      // G17 = G12 - G16 (no G16, so same as G12)
      const g17 = labels.find((l) => l.label === 'G17');
      expect(g17?.amount).toBe(45000);

      // G19 = G17 + G18 (no G18, so same as G17)
      const g19 = labels.find((l) => l.label === 'G19');
      expect(g19?.amount).toBe(45000);

      // G20 = G19 * 10%
      const g20 = labels.find((l) => l.label === 'G20');
      expect(g20?.amount).toBe(4500);

      // G21 = G9 - G20
      const g21 = labels.find((l) => l.label === 'G21');
      expect(g21?.amount).toBe(5500);
    });

    it('should handle GST adjustments', () => {
      const statementWithAdjustments: BusinessActivityStatement = {
        ...mockBasStatement,
        gst: {
          ...mockBasStatement.gst!,
          g7Adjustments: 1000,
          g18Adjustments: -500,
        },
      };

      const labels = service['calculateBasLabels'](statementWithAdjustments);

      const g7 = labels.find((l) => l.label === 'G7');
      expect(g7?.amount).toBe(1000);

      const g8 = labels.find((l) => l.label === 'G8');
      expect(g8?.amount).toBe(101000); // G6 + G7

      const g18 = labels.find((l) => l.label === 'G18');
      expect(g18?.amount).toBe(-500);

      const g19 = labels.find((l) => l.label === 'G19');
      expect(g19?.amount).toBe(44500); // G17 + G18
    });

    it('should round GST amounts correctly', () => {
      const statementWithRounding: BusinessActivityStatement = {
        ...mockBasStatement,
        gst: {
          g1TotalSales: 100.55,
          g2ExportSales: 0,
          g3OtherGstFreeSales: 0,
          g4InputTaxedSales: 0,
          g10CapitalPurchases: 0,
          g11NonCapitalPurchases: 50.33,
        },
      };

      const labels = service['calculateBasLabels'](statementWithRounding);

      // G9 should be rounded to 2 decimal places
      const g9 = labels.find((l) => l.label === 'G9');
      expect(g9?.amount).toBe(10.06); // 100.55 * 0.1 = 10.055, rounded to 10.06

      // G20 should be rounded to 2 decimal places
      const g20 = labels.find((l) => l.label === 'G20');
      expect(g20?.amount).toBe(5.03); // 50.33 * 0.1 = 5.033, rounded to 5.03
    });
  });

  describe('PAYG Withholding Calculation', () => {
    it('should calculate PAYG withholding labels', () => {
      const statementWithPayg: BusinessActivityStatement = {
        ...mockBasStatement,
        paygWithholding: {
          w1TotalPayments: 50000,
          w2WithheldFromPayments: 10000,
          w3WithheldNoAbn: 500,
          w4WithheldInvestmentIncome: 200,
        },
      };

      const labels = service['calculateBasLabels'](statementWithPayg);

      const w1 = labels.find((l) => l.label === 'W1');
      expect(w1?.amount).toBe(50000);

      const w2 = labels.find((l) => l.label === 'W2');
      expect(w2?.amount).toBe(10000);

      const w3 = labels.find((l) => l.label === 'W3');
      expect(w3?.amount).toBe(500);

      const w4 = labels.find((l) => l.label === 'W4');
      expect(w4?.amount).toBe(200);

      // W5 = W2 + W3 + W4
      const w5 = labels.find((l) => l.label === 'W5');
      expect(w5?.amount).toBe(10700);
    });
  });

  describe('ABN Validation', () => {
    it('should validate correct 11-digit ABN', () => {
      expect(service['isValidAbn']('12345678901')).toBe(true);
    });

    it('should validate ABN with spaces', () => {
      expect(service['isValidAbn']('12 345 678 901')).toBe(true);
    });

    it('should reject ABN with invalid length', () => {
      expect(service['isValidAbn']('123456789')).toBe(false);
    });

    it('should reject ABN with letters', () => {
      expect(service['isValidAbn']('1234567890A')).toBe(false);
    });
  });

  describe('Amount Rounding', () => {
    it('should round to 2 decimal places', () => {
      expect(service['roundAmount'](10.055)).toBe(10.06);
      expect(service['roundAmount'](10.054)).toBe(10.05);
      expect(service['roundAmount'](10.999)).toBe(11.0);
    });
  });
});
