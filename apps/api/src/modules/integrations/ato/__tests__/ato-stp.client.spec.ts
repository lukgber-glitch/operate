import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { AtoStpClient } from '../ato-stp.client';
import { AtoAuthService } from '../ato-auth.service';
import {
  StpPayEventSubmission,
  StpPayEvent,
  AtoTokenResponse,
} from '../ato.types';
import { STP_VALIDATION } from '../ato.constants';

describe('AtoStpClient', () => {
  let client: AtoStpClient;
  let authService: AtoAuthService;
  let configService: ConfigService;

  const mockToken: AtoTokenResponse = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    scope: 'stp',
    issuedAt: new Date(),
  };

  const mockEmployee: StpPayEvent = {
    employee: {
      tfn: '123456789',
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: new Date('1985-05-15'),
      gender: 'M',
      address: {
        line1: '123 Main St',
        suburb: 'Sydney',
        state: 'NSW',
        postcode: '2000',
        country: 'Australia',
      },
    },
    employment: {
      employmentType: 'FULL_TIME',
      startDate: new Date('2020-01-01'),
      payrollId: 'PR001',
      taxTreatment: 'REGULAR',
      taxFileNumberProvided: true,
      claimsTaxFreeThreshold: true,
      hasHelpDebt: false,
      hasSfssDebt: false,
      seniorAustralian: false,
    },
    payPeriod: {
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-14'),
      paymentDate: new Date('2024-06-14'),
    },
    income: {
      gross: 5000,
      paygWithholding: 1200,
      allowances: 100,
      bonuses: 0,
      commissions: 0,
    },
    superannuation: [
      {
        fund: {
          abn: '98765432101',
          name: 'Super Fund Pty Ltd',
          usi: 'ABC12345',
          memberNumber: 'MEM123456',
        },
        ordinaryTime: 475,
        superGuarantee: 475,
      },
    ],
    ytdValues: {
      gross: 55000,
      paygWithholding: 13200,
      superannuation: 5225,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AtoStpClient,
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

    client = module.get<AtoStpClient>(AtoStpClient);
    authService = module.get<AtoAuthService>(AtoAuthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  describe('Pay Event Validation', () => {
    it('should validate correct pay event', () => {
      const submission: StpPayEventSubmission = {
        abn: '12345678901',
        payPeriod: {
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-06-14'),
        },
        employees: [mockEmployee],
      };

      expect(() => client['validatePayEvent'](submission)).not.toThrow();
    });

    it('should reject invalid ABN', () => {
      const submission: StpPayEventSubmission = {
        abn: '123',
        payPeriod: {
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-06-14'),
        },
        employees: [mockEmployee],
      };

      expect(() => client['validatePayEvent'](submission)).toThrow(
        BadRequestException,
      );
    });

    it('should reject too many employees', () => {
      const employees = Array(STP_VALIDATION.MAX_EMPLOYEES_PER_EVENT + 1).fill(
        mockEmployee,
      );

      const submission: StpPayEventSubmission = {
        abn: '12345678901',
        payPeriod: {
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-06-14'),
        },
        employees,
      };

      expect(() => client['validatePayEvent'](submission)).toThrow(
        BadRequestException,
      );
    });

    it('should validate employee with no TFN', () => {
      const employeeWithoutTfn: StpPayEvent = {
        ...mockEmployee,
        employee: {
          ...mockEmployee.employee,
          tfn: undefined,
        },
        employment: {
          ...mockEmployee.employment,
          taxFileNumberProvided: false,
        },
      };

      const submission: StpPayEventSubmission = {
        abn: '12345678901',
        payPeriod: {
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-06-14'),
        },
        employees: [employeeWithoutTfn],
      };

      expect(() => client['validatePayEvent'](submission)).not.toThrow();
    });

    it('should reject gross amount exceeding maximum', () => {
      const invalidEmployee: StpPayEvent = {
        ...mockEmployee,
        income: {
          ...mockEmployee.income,
          gross: STP_VALIDATION.MAX_GROSS_AMOUNT + 1,
        },
      };

      const submission: StpPayEventSubmission = {
        abn: '12345678901',
        payPeriod: {
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-06-14'),
        },
        employees: [invalidEmployee],
      };

      expect(() => client['validatePayEvent'](submission)).toThrow(
        BadRequestException,
      );
    });

    it('should reject PAYG withholding exceeding gross', () => {
      const invalidEmployee: StpPayEvent = {
        ...mockEmployee,
        income: {
          gross: 5000,
          paygWithholding: 6000, // Exceeds gross
          allowances: 0,
        },
      };

      const submission: StpPayEventSubmission = {
        abn: '12345678901',
        payPeriod: {
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-06-14'),
        },
        employees: [invalidEmployee],
      };

      expect(() => client['validatePayEvent'](submission)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('TFN Validation', () => {
    it('should validate correct 9-digit TFN', () => {
      expect(client['isValidTfn']('123456789')).toBe(true);
    });

    it('should validate correct 8-digit TFN', () => {
      expect(client['isValidTfn']('12345678')).toBe(true);
    });

    it('should validate TFN with spaces', () => {
      expect(client['isValidTfn']('123 456 789')).toBe(true);
    });

    it('should reject TFN with invalid length', () => {
      expect(client['isValidTfn']('12345')).toBe(false);
    });

    it('should reject TFN with letters', () => {
      expect(client['isValidTfn']('12345678A')).toBe(false);
    });
  });

  describe('ABN Validation', () => {
    it('should validate correct 11-digit ABN', () => {
      expect(client['isValidAbn']('12345678901')).toBe(true);
    });

    it('should validate ABN with spaces', () => {
      expect(client['isValidAbn']('12 345 678 901')).toBe(true);
    });

    it('should reject ABN with invalid length', () => {
      expect(client['isValidAbn']('123456789')).toBe(false);
    });
  });

  describe('Financial Year Validation', () => {
    it('should validate correct financial year format', () => {
      expect(client['isValidFinancialYear']('2023-2024')).toBe(true);
      expect(client['isValidFinancialYear']('2024-2025')).toBe(true);
    });

    it('should reject invalid financial year format', () => {
      expect(client['isValidFinancialYear']('2023-2024-25')).toBe(false);
      expect(client['isValidFinancialYear']('2023')).toBe(false);
    });

    it('should reject non-consecutive years', () => {
      expect(client['isValidFinancialYear']('2023-2025')).toBe(false);
      expect(client['isValidFinancialYear']('2024-2023')).toBe(false);
    });
  });

  describe('Superannuation Validation', () => {
    it('should validate super fund ABN', () => {
      const errors = client['validateEmployee'](mockEmployee, 0);

      // No errors should be found for valid super fund ABN
      const abnErrors = errors.filter((e) => e.field?.includes('superannuation'));
      expect(abnErrors.length).toBe(0);
    });

    it('should reject invalid super fund ABN', () => {
      const invalidEmployee: StpPayEvent = {
        ...mockEmployee,
        superannuation: [
          {
            fund: {
              abn: '123', // Invalid ABN
              name: 'Super Fund Pty Ltd',
            },
            ordinaryTime: 475,
            superGuarantee: 475,
          },
        ],
      };

      const errors = client['validateEmployee'](invalidEmployee, 0);

      const abnErrors = errors.filter((e) => e.field?.includes('superannuation'));
      expect(abnErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Employment Type Validation', () => {
    it('should accept valid employment types', () => {
      const validTypes = ['FULL_TIME', 'PART_TIME', 'CASUAL', 'LABOUR_HIRE'];

      validTypes.forEach((type) => {
        const employee: StpPayEvent = {
          ...mockEmployee,
          employment: {
            ...mockEmployee.employment,
            employmentType: type as any,
          },
        };

        const errors = client['validateEmployee'](employee, 0);
        const typeErrors = errors.filter((e) => e.field?.includes('employmentType'));
        expect(typeErrors.length).toBe(0);
      });
    });

    it('should reject invalid employment type', () => {
      const employee: StpPayEvent = {
        ...mockEmployee,
        employment: {
          ...mockEmployee.employment,
          employmentType: 'INVALID' as any,
        },
      };

      const errors = client['validateEmployee'](employee, 0);
      const typeErrors = errors.filter((e) => e.field?.includes('employmentType'));
      expect(typeErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Tax Treatment Validation', () => {
    it('should accept valid tax treatment codes', () => {
      const validCodes = ['REGULAR', 'BACK_PAYMENT', 'WORKING_HOLIDAY_MAKER'];

      validCodes.forEach((code) => {
        const employee: StpPayEvent = {
          ...mockEmployee,
          employment: {
            ...mockEmployee.employment,
            taxTreatment: code as any,
          },
        };

        const errors = client['validateEmployee'](employee, 0);
        const treatmentErrors = errors.filter((e) =>
          e.field?.includes('taxTreatment'),
        );
        expect(treatmentErrors.length).toBe(0);
      });
    });

    it('should reject invalid tax treatment code', () => {
      const employee: StpPayEvent = {
        ...mockEmployee,
        employment: {
          ...mockEmployee.employment,
          taxTreatment: 'INVALID' as any,
        },
      };

      const errors = client['validateEmployee'](employee, 0);
      const treatmentErrors = errors.filter((e) => e.field?.includes('taxTreatment'));
      expect(treatmentErrors.length).toBeGreaterThan(0);
    });
  });
});
