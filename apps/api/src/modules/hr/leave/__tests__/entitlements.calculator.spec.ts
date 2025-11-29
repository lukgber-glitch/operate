import { Test, TestingModule } from '@nestjs/testing';
import { EntitlementsCalculator } from '../entitlements/entitlements.calculator';
import { Employee, EmploymentContract, ContractType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('EntitlementsCalculator', () => {
  let calculator: EntitlementsCalculator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EntitlementsCalculator],
    }).compile();

    calculator = module.get<EntitlementsCalculator>(EntitlementsCalculator);
  });

  describe('calculateAnnualEntitlement', () => {
    it('should calculate base entitlement for full-time German employee', () => {
      const employee = createMockEmployee({
        countryCode: 'DE',
        hireDate: new Date('2020-01-01'),
        dateOfBirth: new Date('1990-01-01'),
      });

      const contract = createMockContract({
        weeklyHours: new Decimal(40),
        contractType: ContractType.PERMANENT,
        startDate: new Date('2020-01-01'),
      });

      const result = calculator.calculateAnnualEntitlement(
        { ...employee, contracts: [contract] },
        2024,
      );

      expect(result).toBe(20); // 20 days minimum for Germany
    });

    it('should calculate base entitlement for full-time Austrian employee', () => {
      const employee = createMockEmployee({
        countryCode: 'AT',
        hireDate: new Date('2020-01-01'),
        dateOfBirth: new Date('1990-01-01'),
      });

      const contract = createMockContract({
        weeklyHours: new Decimal(40),
        contractType: ContractType.PERMANENT,
        startDate: new Date('2020-01-01'),
      });

      const result = calculator.calculateAnnualEntitlement(
        { ...employee, contracts: [contract] },
        2024,
      );

      expect(result).toBe(25); // 25 days minimum for Austria
    });

    it('should prorate for part-time employees', () => {
      const employee = createMockEmployee({
        countryCode: 'DE',
        hireDate: new Date('2020-01-01'),
        dateOfBirth: new Date('1990-01-01'),
      });

      const contract = createMockContract({
        weeklyHours: new Decimal(20), // 50% part-time
        contractType: ContractType.PART_TIME,
        startDate: new Date('2020-01-01'),
      });

      const result = calculator.calculateAnnualEntitlement(
        { ...employee, contracts: [contract] },
        2024,
      );

      expect(result).toBe(10); // 20 * 0.5 = 10 days
    });

    it('should prorate for first year based on hire date', () => {
      const employee = createMockEmployee({
        countryCode: 'DE',
        hireDate: new Date('2024-07-01'), // Started mid-year
        dateOfBirth: new Date('1990-01-01'),
      });

      const contract = createMockContract({
        weeklyHours: new Decimal(40),
        contractType: ContractType.PERMANENT,
        startDate: new Date('2024-07-01'),
      });

      const result = calculator.calculateAnnualEntitlement(
        { ...employee, contracts: [contract] },
        2024,
      );

      // Should be approximately half (started July 1, ~6 months remaining)
      expect(result).toBeGreaterThan(9);
      expect(result).toBeLessThan(11);
    });

    it('should apply age-based bonus for Swiss employees over 50', () => {
      const employee = createMockEmployee({
        countryCode: 'CH',
        hireDate: new Date('2020-01-01'),
        dateOfBirth: new Date('1970-01-01'), // Age 54 in 2024
      });

      const contract = createMockContract({
        weeklyHours: new Decimal(40),
        contractType: ContractType.PERMANENT,
        startDate: new Date('2020-01-01'),
      });

      const result = calculator.calculateAnnualEntitlement(
        { ...employee, contracts: [contract] },
        2024,
      );

      expect(result).toBe(25); // 20 base + 5 bonus for age >= 50
    });

    it('should apply seniority bonus for Austrian employees with 25+ years', () => {
      const employee = createMockEmployee({
        countryCode: 'AT',
        hireDate: new Date('1995-01-01'), // 29 years by 2024
        dateOfBirth: new Date('1970-01-01'),
      });

      const contract = createMockContract({
        weeklyHours: new Decimal(40),
        contractType: ContractType.PERMANENT,
        startDate: new Date('1995-01-01'),
      });

      const result = calculator.calculateAnnualEntitlement(
        { ...employee, contracts: [contract] },
        2024,
      );

      expect(result).toBe(30); // 25 base + 5 bonus for 25+ years
    });

    it('should prorate for termination year', () => {
      const employee = createMockEmployee({
        countryCode: 'DE',
        hireDate: new Date('2020-01-01'),
        dateOfBirth: new Date('1990-01-01'),
        terminationDate: new Date('2024-06-30'), // Leaves mid-year
      });

      const contract = createMockContract({
        weeklyHours: new Decimal(40),
        contractType: ContractType.PERMANENT,
        startDate: new Date('2020-01-01'),
      });

      const result = calculator.calculateAnnualEntitlement(
        { ...employee, contracts: [contract] },
        2024,
      );

      // Should be approximately half (leaves June 30, ~6 months worked)
      expect(result).toBeGreaterThan(9);
      expect(result).toBeLessThan(11);
    });

    it('should return 0 when no active contract exists', () => {
      const employee = createMockEmployee({
        countryCode: 'DE',
        hireDate: new Date('2020-01-01'),
        dateOfBirth: new Date('1990-01-01'),
      });

      const result = calculator.calculateAnnualEntitlement(
        { ...employee, contracts: [] },
        2024,
      );

      expect(result).toBe(0);
    });
  });

  describe('calculateMaxCarryover', () => {
    it('should return 5 days for Germany', () => {
      const employee = createMockEmployee({ countryCode: 'DE' });
      const result = calculator.calculateMaxCarryover(employee, 2024);
      expect(result).toBe(5);
    });

    it('should return 10 days for Austria', () => {
      const employee = createMockEmployee({ countryCode: 'AT' });
      const result = calculator.calculateMaxCarryover(employee, 2024);
      expect(result).toBe(10);
    });

    it('should return 5 days for Switzerland', () => {
      const employee = createMockEmployee({ countryCode: 'CH' });
      const result = calculator.calculateMaxCarryover(employee, 2024);
      expect(result).toBe(5);
    });
  });

  describe('calculateCarryoverExpiry', () => {
    it('should return March 31 of following year for Germany', () => {
      const employee = createMockEmployee({ countryCode: 'DE' });
      const result = calculator.calculateCarryoverExpiry(employee, 2024);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(2); // March (0-indexed)
      expect(result.getDate()).toBe(31);
    });

    it('should return December 31 of following year for Austria', () => {
      const employee = createMockEmployee({ countryCode: 'AT' });
      const result = calculator.calculateCarryoverExpiry(employee, 2024);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(11); // December (0-indexed)
      expect(result.getDate()).toBe(31);
    });

    it('should return March 31 of following year for Switzerland', () => {
      const employee = createMockEmployee({ countryCode: 'CH' });
      const result = calculator.calculateCarryoverExpiry(employee, 2024);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(2); // March (0-indexed)
      expect(result.getDate()).toBe(31);
    });
  });

  describe('calculateWorkingDays', () => {
    it('should calculate working days excluding weekends', () => {
      // July 1-5, 2024 (Mon-Fri)
      const startDate = new Date('2024-07-01');
      const endDate = new Date('2024-07-05');

      const result = calculator.calculateWorkingDays(startDate, endDate);
      expect(result).toBe(5);
    });

    it('should exclude weekends', () => {
      // July 1-7, 2024 (Mon-Sun, includes weekend)
      const startDate = new Date('2024-07-01');
      const endDate = new Date('2024-07-07');

      const result = calculator.calculateWorkingDays(startDate, endDate);
      expect(result).toBe(5); // Mon-Fri only
    });

    it('should handle single day', () => {
      const date = new Date('2024-07-01'); // Monday

      const result = calculator.calculateWorkingDays(date, date);
      expect(result).toBe(1);
    });

    it('should return 0 for weekend days', () => {
      // Saturday to Sunday
      const startDate = new Date('2024-07-06');
      const endDate = new Date('2024-07-07');

      const result = calculator.calculateWorkingDays(startDate, endDate);
      expect(result).toBe(0);
    });
  });

  describe('calculateWorkingDaysForPartTime', () => {
    it('should prorate for 3-day work week', () => {
      // 5 calendar working days
      const startDate = new Date('2024-07-01'); // Monday
      const endDate = new Date('2024-07-05'); // Friday

      const result = calculator.calculateWorkingDaysForPartTime(
        startDate,
        endDate,
        new Decimal(3),
      );

      expect(result).toBe(3); // 5 * (3/5) = 3
    });

    it('should prorate for 2.5-day work week', () => {
      // 5 calendar working days
      const startDate = new Date('2024-07-01'); // Monday
      const endDate = new Date('2024-07-05'); // Friday

      const result = calculator.calculateWorkingDaysForPartTime(
        startDate,
        endDate,
        new Decimal(2.5),
      );

      expect(result).toBe(2.5); // 5 * (2.5/5) = 2.5
    });
  });
});

// Helper functions to create mock data
function createMockEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'emp-123',
    orgId: 'org-123',
    userId: null,
    employeeNumber: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: null,
    dateOfBirth: new Date('1990-01-01'),
    gender: null,
    nationality: null,
    street: null,
    city: null,
    postalCode: null,
    countryCode: 'DE',
    taxId: null,
    taxClass: null,
    churchTax: false,
    bankName: null,
    iban: null,
    bic: null,
    status: 'ACTIVE',
    hireDate: new Date('2020-01-01'),
    terminationDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  } as Employee;
}

function createMockContract(
  overrides: Partial<EmploymentContract> = {},
): EmploymentContract {
  return {
    id: 'contract-123',
    employeeId: 'emp-123',
    contractType: ContractType.PERMANENT,
    title: 'Software Engineer',
    department: 'Engineering',
    startDate: new Date('2020-01-01'),
    endDate: null,
    probationEnd: null,
    salaryAmount: new Decimal(50000),
    salaryCurrency: 'EUR',
    salaryPeriod: 'ANNUAL',
    weeklyHours: new Decimal(40),
    workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    benefits: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as EmploymentContract;
}
