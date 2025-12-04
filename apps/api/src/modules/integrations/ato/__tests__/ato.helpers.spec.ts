import {
  formatAbn,
  formatTfn,
  getFinancialYear,
  getCurrentFinancialYear,
  getBasQuarter,
  getBasPeriod,
  getBasDueDate,
  getStpFinalisationDueDate,
  getTparDueDate,
  isOverdue,
  daysUntilDue,
  formatAud,
  validateAbnChecksum,
  getSuperGuaranteeRate,
  calculateSuperGuarantee,
  getStateName,
  isValidPostcodeForState,
  getTaxFreeThreshold,
  formatPeriod,
  generateFilingReference,
} from '../utils/ato.helpers';

describe('ATO Helpers', () => {
  describe('formatAbn', () => {
    it('should format ABN with spaces', () => {
      expect(formatAbn('12345678901')).toBe('12 345 678 901');
    });

    it('should handle ABN already with spaces', () => {
      expect(formatAbn('12 345 678 901')).toBe('12 345 678 901');
    });

    it('should return original if invalid length', () => {
      expect(formatAbn('123')).toBe('123');
    });
  });

  describe('formatTfn', () => {
    it('should format 9-digit TFN', () => {
      expect(formatTfn('123456789')).toBe('123 456 789');
    });

    it('should format 8-digit TFN', () => {
      expect(formatTfn('12345678')).toBe('123 456 78');
    });

    it('should handle TFN already with spaces', () => {
      expect(formatTfn('123 456 789')).toBe('123 456 789');
    });
  });

  describe('getFinancialYear', () => {
    it('should return correct FY for July onwards', () => {
      const date = new Date('2024-07-01');
      expect(getFinancialYear(date)).toBe('2024-2025');
    });

    it('should return correct FY for January to June', () => {
      const date = new Date('2024-06-30');
      expect(getFinancialYear(date)).toBe('2023-2024');
    });

    it('should handle December correctly', () => {
      const date = new Date('2024-12-15');
      expect(getFinancialYear(date)).toBe('2024-2025');
    });
  });

  describe('getBasQuarter', () => {
    it('should return Q1 for July-September', () => {
      expect(getBasQuarter(new Date('2024-07-01'))).toBe('Q1');
      expect(getBasQuarter(new Date('2024-08-15'))).toBe('Q1');
      expect(getBasQuarter(new Date('2024-09-30'))).toBe('Q1');
    });

    it('should return Q2 for October-December', () => {
      expect(getBasQuarter(new Date('2024-10-01'))).toBe('Q2');
      expect(getBasQuarter(new Date('2024-11-15'))).toBe('Q2');
      expect(getBasQuarter(new Date('2024-12-31'))).toBe('Q2');
    });

    it('should return Q3 for January-March', () => {
      expect(getBasQuarter(new Date('2024-01-01'))).toBe('Q3');
      expect(getBasQuarter(new Date('2024-02-15'))).toBe('Q3');
      expect(getBasQuarter(new Date('2024-03-31'))).toBe('Q3');
    });

    it('should return Q4 for April-June', () => {
      expect(getBasQuarter(new Date('2024-04-01'))).toBe('Q4');
      expect(getBasQuarter(new Date('2024-05-15'))).toBe('Q4');
      expect(getBasQuarter(new Date('2024-06-30'))).toBe('Q4');
    });
  });

  describe('getBasPeriod', () => {
    it('should return correct monthly period', () => {
      const date = new Date('2024-07-15');
      expect(getBasPeriod(date, 'MONTHLY')).toBe('2024-07');
    });

    it('should return correct quarterly period', () => {
      const date = new Date('2024-08-15');
      expect(getBasPeriod(date, 'QUARTERLY')).toBe('2024-Q1');
    });

    it('should return correct annual period', () => {
      const date = new Date('2024-08-15');
      expect(getBasPeriod(date, 'ANNUAL')).toBe('2024');
    });
  });

  describe('getBasDueDate', () => {
    it('should calculate correct monthly due date', () => {
      const dueDate = getBasDueDate('2024-07', 'MONTHLY');
      expect(dueDate.getDate()).toBe(21);
      expect(dueDate.getMonth()).toBe(7); // August (0-indexed)
    });

    it('should handle December monthly correctly', () => {
      const dueDate = getBasDueDate('2024-12', 'MONTHLY');
      expect(dueDate.getDate()).toBe(21);
      expect(dueDate.getMonth()).toBe(0); // January
      expect(dueDate.getFullYear()).toBe(2025);
    });

    it('should calculate Q1 due date (28 October)', () => {
      const dueDate = getBasDueDate('2024-Q1', 'QUARTERLY');
      expect(dueDate.getDate()).toBe(28);
      expect(dueDate.getMonth()).toBe(9); // October
      expect(dueDate.getFullYear()).toBe(2024);
    });

    it('should calculate Q2 due date (28 February)', () => {
      const dueDate = getBasDueDate('2024-Q2', 'QUARTERLY');
      expect(dueDate.getDate()).toBe(28);
      expect(dueDate.getMonth()).toBe(1); // February
      expect(dueDate.getFullYear()).toBe(2025);
    });

    it('should calculate annual due date (31 October)', () => {
      const dueDate = getBasDueDate('2024', 'ANNUAL');
      expect(dueDate.getDate()).toBe(31);
      expect(dueDate.getMonth()).toBe(9); // October
      expect(dueDate.getFullYear()).toBe(2025);
    });
  });

  describe('getStpFinalisationDueDate', () => {
    it('should return 14 July of end year', () => {
      const dueDate = getStpFinalisationDueDate('2023-2024');
      expect(dueDate.getDate()).toBe(14);
      expect(dueDate.getMonth()).toBe(6); // July
      expect(dueDate.getFullYear()).toBe(2024);
    });
  });

  describe('getTparDueDate', () => {
    it('should return 28 August of end year', () => {
      const dueDate = getTparDueDate('2023-2024');
      expect(dueDate.getDate()).toBe(28);
      expect(dueDate.getMonth()).toBe(7); // August
      expect(dueDate.getFullYear()).toBe(2024);
    });
  });

  describe('isOverdue', () => {
    it('should return true for past date', () => {
      const pastDate = new Date('2020-01-01');
      expect(isOverdue(pastDate)).toBe(true);
    });

    it('should return false for future date', () => {
      const futureDate = new Date('2099-12-31');
      expect(isOverdue(futureDate)).toBe(false);
    });
  });

  describe('daysUntilDue', () => {
    it('should calculate positive days for future date', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const days = daysUntilDue(futureDate);
      expect(days).toBeGreaterThanOrEqual(6);
      expect(days).toBeLessThanOrEqual(8);
    });

    it('should calculate negative days for past date', () => {
      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const days = daysUntilDue(pastDate);
      expect(days).toBeLessThan(0);
    });
  });

  describe('formatAud', () => {
    it('should format positive amount', () => {
      expect(formatAud(1234.56)).toContain('1,234.56');
      expect(formatAud(1234.56)).toContain('$');
    });

    it('should format negative amount', () => {
      expect(formatAud(-1234.56)).toContain('1,234.56');
      expect(formatAud(-1234.56)).toContain('-');
    });

    it('should handle zero', () => {
      expect(formatAud(0)).toContain('0.00');
    });
  });

  describe('validateAbnChecksum', () => {
    it('should validate correct ABN', () => {
      // Note: This is a placeholder - real ABNs should be used for actual validation
      // The algorithm requires a valid ABN to test properly
      const abn = '51824753556'; // Valid test ABN
      expect(validateAbnChecksum(abn)).toBe(true);
    });

    it('should reject invalid length', () => {
      expect(validateAbnChecksum('123')).toBe(false);
    });

    it('should reject non-numeric', () => {
      expect(validateAbnChecksum('1234567890A')).toBe(false);
    });
  });

  describe('getSuperGuaranteeRate', () => {
    it('should return 11.5% for 2024', () => {
      expect(getSuperGuaranteeRate(new Date('2024-07-01'))).toBe(0.115);
    });

    it('should return 12% for 2025', () => {
      expect(getSuperGuaranteeRate(new Date('2025-07-01'))).toBe(0.12);
    });

    it('should return 11% for 2023', () => {
      expect(getSuperGuaranteeRate(new Date('2023-07-01'))).toBe(0.11);
    });
  });

  describe('calculateSuperGuarantee', () => {
    it('should calculate correct SG amount', () => {
      const ote = 5000;
      const sg = calculateSuperGuarantee(ote, new Date('2024-07-01'));
      expect(sg).toBe(575); // 5000 * 0.115
    });

    it('should round to 2 decimal places', () => {
      const ote = 5001;
      const sg = calculateSuperGuarantee(ote, new Date('2024-07-01'));
      expect(sg).toBe(575.12); // 5001 * 0.115 = 575.115, rounded to 575.12
    });
  });

  describe('getStateName', () => {
    it('should return full state names', () => {
      expect(getStateName('NSW')).toBe('New South Wales');
      expect(getStateName('VIC')).toBe('Victoria');
      expect(getStateName('QLD')).toBe('Queensland');
      expect(getStateName('SA')).toBe('South Australia');
      expect(getStateName('WA')).toBe('Western Australia');
      expect(getStateName('TAS')).toBe('Tasmania');
      expect(getStateName('NT')).toBe('Northern Territory');
      expect(getStateName('ACT')).toBe('Australian Capital Territory');
    });

    it('should handle lowercase', () => {
      expect(getStateName('nsw')).toBe('New South Wales');
    });

    it('should return original if unknown', () => {
      expect(getStateName('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('isValidPostcodeForState', () => {
    it('should validate NSW postcodes', () => {
      expect(isValidPostcodeForState('2000', 'NSW')).toBe(true);
      expect(isValidPostcodeForState('2999', 'NSW')).toBe(true);
      expect(isValidPostcodeForState('3000', 'NSW')).toBe(false);
    });

    it('should validate VIC postcodes', () => {
      expect(isValidPostcodeForState('3000', 'VIC')).toBe(true);
      expect(isValidPostcodeForState('3999', 'VIC')).toBe(true);
      expect(isValidPostcodeForState('4000', 'VIC')).toBe(false);
    });

    it('should validate QLD postcodes', () => {
      expect(isValidPostcodeForState('4000', 'QLD')).toBe(true);
      expect(isValidPostcodeForState('4999', 'QLD')).toBe(true);
    });
  });

  describe('getTaxFreeThreshold', () => {
    it('should return correct threshold', () => {
      expect(getTaxFreeThreshold('2024-2025')).toBe(18200);
    });
  });

  describe('formatPeriod', () => {
    it('should format monthly period', () => {
      const formatted = formatPeriod('2024-07', 'MONTHLY');
      expect(formatted).toContain('July');
      expect(formatted).toContain('2024');
    });

    it('should format quarterly period', () => {
      expect(formatPeriod('2024-Q1', 'QUARTERLY')).toBe('Q1 2024-2025');
    });

    it('should format annual period', () => {
      expect(formatPeriod('2024', 'ANNUAL')).toBe('2024-2025');
    });
  });

  describe('generateFilingReference', () => {
    it('should generate unique BAS references', () => {
      const ref1 = generateFilingReference('BAS');
      const ref2 = generateFilingReference('BAS');

      expect(ref1).toContain('BAS-');
      expect(ref2).toContain('BAS-');
      expect(ref1).not.toBe(ref2);
    });

    it('should generate unique STP references', () => {
      const ref1 = generateFilingReference('STP');
      const ref2 = generateFilingReference('STP');

      expect(ref1).toContain('STP-');
      expect(ref1).not.toBe(ref2);
    });

    it('should generate unique TPAR references', () => {
      const ref = generateFilingReference('TPAR');
      expect(ref).toContain('TPAR-');
    });
  });
});
