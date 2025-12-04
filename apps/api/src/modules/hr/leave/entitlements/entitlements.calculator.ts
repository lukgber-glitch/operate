import { Injectable, Logger } from '@nestjs/common';
import { Employee, EmploymentContract, ContractType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Country-specific leave rules
 */
interface CountryLeaveRules {
  minAnnualLeaveDays: number; // For 5-day work week
  carryoverMaxDays?: number; // Max days that can be carried over
  carryoverExpiryMonthDay: string; // MM-DD format (e.g., "03-31" for March 31)
  ageBasedBonus?: { minAge: number; additionalDays: number }[];
  seniorityBonus?: { minYears: number; additionalDays: number }[];
}

const COUNTRY_RULES: Record<string, CountryLeaveRules> = {
  DE: {
    minAnnualLeaveDays: 20, // 4 weeks for 5-day week
    carryoverMaxDays: 5,
    carryoverExpiryMonthDay: '03-31', // March 31
  },
  AT: {
    minAnnualLeaveDays: 25, // 5 weeks
    carryoverMaxDays: 10,
    carryoverExpiryMonthDay: '12-31', // End of next year
    seniorityBonus: [
      { minYears: 25, additionalDays: 5 }, // 30 days after 25 years
    ],
  },
  CH: {
    minAnnualLeaveDays: 20, // 4 weeks
    carryoverMaxDays: 5,
    carryoverExpiryMonthDay: '03-31',
    ageBasedBonus: [
      { minAge: 50, additionalDays: 5 }, // 25 days from age 50
    ],
  },
};

/**
 * Calculator for leave entitlements based on country-specific rules
 */
@Injectable()
export class EntitlementsCalculator {
  private readonly logger = new Logger(EntitlementsCalculator.name);

  /**
   * Calculate annual leave entitlement for an employee for a specific year
   */
  calculateAnnualEntitlement(
    employee: Employee & { contracts: EmploymentContract[] },
    year: number,
  ): number {
    const contract = this.getActiveContract(employee.contracts, year);
    if (!contract) {
      this.logger.warn(
        `No active contract for employee ${employee.id} in year ${year}`,
      );
      return 0;
    }

    const countryRules = this.getCountryRules(employee.countryCode);
    let entitlementDays = countryRules.minAnnualLeaveDays;

    // Apply part-time proration
    entitlementDays = this.applyPartTimeProration(
      entitlementDays,
      contract.weeklyHours,
      contract.contractType,
    );

    // Apply age-based bonus (e.g., Switzerland)
    if (countryRules.ageBasedBonus) {
      const age = this.calculateAge(employee.dateOfBirth, year);
      entitlementDays += this.calculateAgeBonus(
        age,
        countryRules.ageBasedBonus,
      );
    }

    // Apply seniority bonus (e.g., Austria)
    if (countryRules.seniorityBonus) {
      const yearsOfService = this.calculateYearsOfService(
        employee.hireDate,
        year,
      );
      entitlementDays += this.calculateSeniorityBonus(
        yearsOfService,
        countryRules.seniorityBonus,
      );
    }

    // Prorate for first year (based on hire date)
    if (this.isFirstYear(employee.hireDate, year)) {
      entitlementDays = this.prorateForFirstYear(
        entitlementDays,
        employee.hireDate,
        year,
      );
    }

    // Prorate for termination year
    if (
      employee.terminationDate &&
      this.isTerminationYear(employee.terminationDate, year)
    ) {
      entitlementDays = this.prorateForTermination(
        entitlementDays,
        employee.terminationDate,
        year,
      );
    }

    // Round to nearest 0.5
    return Math.round(entitlementDays * 2) / 2;
  }

  /**
   * Calculate maximum carryover days allowed
   */
  calculateMaxCarryover(employee: Employee, year: number): number {
    const countryRules = this.getCountryRules(employee.countryCode);
    return countryRules.carryoverMaxDays || 0;
  }

  /**
   * Calculate carryover expiry date
   */
  calculateCarryoverExpiry(employee: Employee, fromYear: number): Date {
    const countryRules = this.getCountryRules(employee.countryCode);
    const [month, day] = countryRules.carryoverExpiryMonthDay
      .split('-')
      .map(Number);

    // Expiry is in the following year
    return new Date(fromYear + 1, month - 1, day);
  }

  /**
   * Calculate working days between two dates (excluding weekends)
   */
  calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      // Exclude Saturday (6) and Sunday (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Calculate working days for part-time employees
   */
  calculateWorkingDaysForPartTime(
    startDate: Date,
    endDate: Date,
    workingDaysPerWeek: Decimal,
  ): number {
    const totalWorkingDays = this.calculateWorkingDays(startDate, endDate);
    const workingDaysDecimal = Number(workingDaysPerWeek);

    // Prorate based on working days per week
    // E.g., if working 3 days/week, 5 calendar working days = 3 leave days
    return Math.round((totalWorkingDays * workingDaysDecimal) / 5 * 2) / 2;
  }

  /**
   * Get country-specific leave rules
   */
  private getCountryRules(countryCode: string): CountryLeaveRules {
    const rules = COUNTRY_RULES[countryCode];
    if (!rules) {
      this.logger.warn(
        `No leave rules defined for country ${countryCode}, using DE defaults`,
      );
      return COUNTRY_RULES['DE'];
    }
    return rules;
  }

  /**
   * Get active contract for a specific year
   */
  private getActiveContract(
    contracts: EmploymentContract[],
    year: number,
  ): EmploymentContract | null {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    const activeContract = contracts.find(
      (contract) =>
        contract.isActive &&
        contract.startDate <= yearEnd &&
        (!contract.endDate || contract.endDate >= yearStart),
    );

    return activeContract || null;
  }

  /**
   * Apply part-time proration to entitlement
   */
  private applyPartTimeProration(
    baseDays: number,
    weeklyHours: Decimal,
    contractType: ContractType,
  ): number {
    const weeklyHoursNum = Number(weeklyHours);

    // Full-time threshold (country-specific, using 40 as default)
    const fullTimeHours = 40;

    if (contractType === ContractType.PART_TIME && weeklyHoursNum < fullTimeHours) {
      return (baseDays * weeklyHoursNum) / fullTimeHours;
    }

    return baseDays;
  }

  /**
   * Calculate age at specific year
   */
  private calculateAge(dateOfBirth: Date, year: number): number {
    const birthYear = dateOfBirth.getFullYear();
    return year - birthYear;
  }

  /**
   * Calculate age-based bonus
   */
  private calculateAgeBonus(
    age: number,
    bonusRules: { minAge: number; additionalDays: number }[],
  ): number {
    let bonus = 0;
    for (const rule of bonusRules) {
      if (age >= rule.minAge) {
        bonus += rule.additionalDays;
      }
    }
    return bonus;
  }

  /**
   * Calculate years of service
   */
  private calculateYearsOfService(hireDate: Date, year: number): number {
    return year - hireDate.getFullYear();
  }

  /**
   * Calculate seniority-based bonus
   */
  private calculateSeniorityBonus(
    yearsOfService: number,
    bonusRules: { minYears: number; additionalDays: number }[],
  ): number {
    let bonus = 0;
    for (const rule of bonusRules) {
      if (yearsOfService >= rule.minYears) {
        bonus += rule.additionalDays;
      }
    }
    return bonus;
  }

  /**
   * Check if year is first year of employment
   */
  private isFirstYear(hireDate: Date, year: number): boolean {
    return hireDate.getFullYear() === year;
  }

  /**
   * Check if year is termination year
   */
  private isTerminationYear(terminationDate: Date, year: number): boolean {
    return terminationDate.getFullYear() === year;
  }

  /**
   * Prorate entitlement for first year based on hire date
   */
  private prorateForFirstYear(
    annualDays: number,
    hireDate: Date,
    year: number,
  ): number {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    // Calculate remaining days in year
    const totalDaysInYear =
      (yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24);
    const remainingDays =
      (yearEnd.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24);

    return (annualDays * remainingDays) / totalDaysInYear;
  }

  /**
   * Prorate entitlement for termination year
   */
  private prorateForTermination(
    annualDays: number,
    terminationDate: Date,
    year: number,
  ): number {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    // Calculate worked days in year
    const totalDaysInYear =
      (yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24);
    const workedDays =
      (terminationDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24);

    return (annualDays * workedDays) / totalDaysInYear;
  }
}
