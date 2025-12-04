/**
 * Tax Deadline Configuration for Multiple Countries
 * Defines tax filing deadlines, rules, and reminders for various jurisdictions
 *
 * Supported Countries:
 * - Germany (DE): VAT/USt, Annual Tax, Payroll, ELSTER
 * - Austria (AT): VAT/USt, Annual Tax, Payroll
 * - Switzerland (CH): VAT, Annual Tax, Payroll
 * - United States (US): VAT, Income Tax, Payroll, IRS filings
 * - United Kingdom (UK): VAT, MTD, Annual Tax
 * - And more...
 */

export enum TaxTypeEnum {
  // VAT/Sales Tax
  VAT_MONTHLY = 'VAT_MONTHLY',
  VAT_QUARTERLY = 'VAT_QUARTERLY',
  VAT_ANNUAL = 'VAT_ANNUAL',
  UST_MONTHLY = 'UST_MONTHLY', // Germany
  UST_QUARTERLY = 'UST_QUARTERLY',

  // Corporate/Income Tax
  CORPORATE_TAX_ANNUAL = 'CORPORATE_TAX_ANNUAL',
  INCOME_TAX_ANNUAL = 'INCOME_TAX_ANNUAL',

  // Payroll Tax
  PAYROLL_TAX_MONTHLY = 'PAYROLL_TAX_MONTHLY',
  PAYROLL_TAX_QUARTERLY = 'PAYROLL_TAX_QUARTERLY',

  // Country-specific systems
  ELSTER_MONTHLY = 'ELSTER_MONTHLY', // Germany
  ELSTER_QUARTERLY = 'ELSTER_QUARTERLY',
  ELSTER_ANNUAL = 'ELSTER_ANNUAL',
  HMRC_MTD_MONTHLY = 'HMRC_MTD_MONTHLY', // UK Making Tax Digital
  HMRC_MTD_QUARTERLY = 'HMRC_MTD_QUARTERLY',
  IRS_QUARTERLY = 'IRS_QUARTERLY', // US
  IRS_ANNUAL = 'IRS_ANNUAL',

  // Other
  WITHHOLDING_TAX = 'WITHHOLDING_TAX',
  PROPERTY_TAX = 'PROPERTY_TAX',
  SALES_TAX_MONTHLY = 'SALES_TAX_MONTHLY',
  SALES_TAX_QUARTERLY = 'SALES_TAX_QUARTERLY',
}

export interface TaxDeadlineRule {
  taxType: TaxTypeEnum;
  country: string;
  periodType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'SEMI_ANNUAL' | 'BI_MONTHLY';

  // Deadline calculation
  daysAfterPeriodEnd: number; // Number of days after period ends
  specificDayOfMonth?: number; // e.g., 10th day of following month
  specificMonth?: number; // For annual filings (1-12)

  // Extensions and exceptions
  allowsExtension: boolean;
  extensionDays?: number;

  // Business day adjustment
  adjustForWeekends: boolean;
  adjustForHolidays: boolean;

  // Reminder schedule (days before due date)
  reminderDays: number[];

  // Metadata
  description: string;
  filingMethod?: string[]; // ['online', 'paper', 'elster']
  penaltyRate?: number; // Late filing penalty percentage
}

/**
 * Germany (DE) Tax Deadlines
 */
export const GERMANY_TAX_DEADLINES: TaxDeadlineRule[] = [
  {
    taxType: TaxTypeEnum.UST_MONTHLY,
    country: 'DE',
    periodType: 'MONTHLY',
    daysAfterPeriodEnd: 10,
    specificDayOfMonth: 10,
    allowsExtension: false,
    adjustForWeekends: true,
    adjustForHolidays: true,
    reminderDays: [7, 3, 1],
    description: 'Monthly VAT return (Umsatzsteuer-Voranmeldung)',
    filingMethod: ['elster', 'online'],
    penaltyRate: 1.0,
  },
  {
    taxType: TaxTypeEnum.UST_QUARTERLY,
    country: 'DE',
    periodType: 'QUARTERLY',
    daysAfterPeriodEnd: 10,
    allowsExtension: false,
    adjustForWeekends: true,
    adjustForHolidays: true,
    reminderDays: [7, 3, 1],
    description: 'Quarterly VAT return (Umsatzsteuer-Voranmeldung)',
    filingMethod: ['elster', 'online'],
    penaltyRate: 1.0,
  },
  {
    taxType: TaxTypeEnum.ELSTER_ANNUAL,
    country: 'DE',
    periodType: 'ANNUAL',
    specificMonth: 7, // July 31st
    specificDayOfMonth: 31,
    daysAfterPeriodEnd: 212, // ~7 months
    allowsExtension: true,
    extensionDays: 183, // Can extend to end of next year
    adjustForWeekends: true,
    adjustForHolidays: true,
    reminderDays: [30, 14, 7, 3, 1],
    description: 'Annual tax return (Einkommensteuererklärung) via ELSTER',
    filingMethod: ['elster'],
    penaltyRate: 0.25,
  },
  {
    taxType: TaxTypeEnum.PAYROLL_TAX_MONTHLY,
    country: 'DE',
    periodType: 'MONTHLY',
    daysAfterPeriodEnd: 10,
    specificDayOfMonth: 10,
    allowsExtension: false,
    adjustForWeekends: true,
    adjustForHolidays: true,
    reminderDays: [5, 2, 1],
    description: 'Monthly payroll tax (Lohnsteuer-Anmeldung)',
    filingMethod: ['elster', 'online'],
  },
];

/**
 * Austria (AT) Tax Deadlines
 */
export const AUSTRIA_TAX_DEADLINES: TaxDeadlineRule[] = [
  {
    taxType: TaxTypeEnum.VAT_MONTHLY,
    country: 'AT',
    periodType: 'MONTHLY',
    daysAfterPeriodEnd: 15,
    specificDayOfMonth: 15,
    allowsExtension: false,
    adjustForWeekends: true,
    adjustForHolidays: true,
    reminderDays: [7, 3, 1],
    description: 'Monthly VAT return (Umsatzsteuer-Voranmeldung)',
    filingMethod: ['online', 'finanzonline'],
    penaltyRate: 2.0,
  },
  {
    taxType: TaxTypeEnum.VAT_QUARTERLY,
    country: 'AT',
    periodType: 'QUARTERLY',
    daysAfterPeriodEnd: 15,
    allowsExtension: false,
    adjustForWeekends: true,
    adjustForHolidays: true,
    reminderDays: [7, 3, 1],
    description: 'Quarterly VAT return (Umsatzsteuer-Voranmeldung)',
    filingMethod: ['online', 'finanzonline'],
    penaltyRate: 2.0,
  },
  {
    taxType: TaxTypeEnum.CORPORATE_TAX_ANNUAL,
    country: 'AT',
    periodType: 'ANNUAL',
    specificMonth: 6, // June 30th
    specificDayOfMonth: 30,
    daysAfterPeriodEnd: 181,
    allowsExtension: true,
    extensionDays: 92, // 3 months
    adjustForWeekends: true,
    adjustForHolidays: true,
    reminderDays: [30, 14, 7, 3, 1],
    description: 'Annual corporate tax return (Körperschaftsteuererklärung)',
    filingMethod: ['online', 'finanzonline'],
  },
];

/**
 * Switzerland (CH) Tax Deadlines
 */
export const SWITZERLAND_TAX_DEADLINES: TaxDeadlineRule[] = [
  {
    taxType: TaxTypeEnum.VAT_QUARTERLY,
    country: 'CH',
    periodType: 'QUARTERLY',
    daysAfterPeriodEnd: 60,
    allowsExtension: true,
    extensionDays: 30,
    adjustForWeekends: true,
    adjustForHolidays: true,
    reminderDays: [14, 7, 3, 1],
    description: 'Quarterly VAT return (MWST-Abrechnung)',
    filingMethod: ['online'],
    penaltyRate: 5.0,
  },
  {
    taxType: TaxTypeEnum.CORPORATE_TAX_ANNUAL,
    country: 'CH',
    periodType: 'ANNUAL',
    specificMonth: 3, // March 31st
    specificDayOfMonth: 31,
    daysAfterPeriodEnd: 90,
    allowsExtension: true,
    extensionDays: 180,
    adjustForWeekends: true,
    adjustForHolidays: true,
    reminderDays: [30, 14, 7, 3, 1],
    description: 'Annual corporate tax return',
    filingMethod: ['online', 'paper'],
  },
];

/**
 * United States (US) Tax Deadlines
 */
export const US_TAX_DEADLINES: TaxDeadlineRule[] = [
  {
    taxType: TaxTypeEnum.IRS_QUARTERLY,
    country: 'US',
    periodType: 'QUARTERLY',
    // US quarterly dates: Apr 15, Jun 15, Sep 15, Jan 15
    daysAfterPeriodEnd: 15,
    allowsExtension: false,
    adjustForWeekends: true,
    adjustForHolidays: true,
    reminderDays: [14, 7, 3, 1],
    description: 'Quarterly estimated tax payment (Form 1040-ES)',
    filingMethod: ['online', 'paper', 'irs'],
    penaltyRate: 0.5,
  },
  {
    taxType: TaxTypeEnum.IRS_ANNUAL,
    country: 'US',
    periodType: 'ANNUAL',
    specificMonth: 4, // April 15th
    specificDayOfMonth: 15,
    daysAfterPeriodEnd: 105,
    allowsExtension: true,
    extensionDays: 183, // 6 months to October 15
    adjustForWeekends: true,
    adjustForHolidays: true,
    reminderDays: [30, 14, 7, 3, 1],
    description: 'Annual tax return (Form 1040)',
    filingMethod: ['online', 'paper', 'irs'],
    penaltyRate: 5.0,
  },
  {
    taxType: TaxTypeEnum.PAYROLL_TAX_MONTHLY,
    country: 'US',
    periodType: 'MONTHLY',
    daysAfterPeriodEnd: 15,
    specificDayOfMonth: 15,
    allowsExtension: false,
    adjustForWeekends: true,
    adjustForHolidays: true,
    reminderDays: [7, 3, 1],
    description: 'Monthly payroll tax deposit (Form 941)',
    filingMethod: ['online', 'irs'],
  },
  {
    taxType: TaxTypeEnum.SALES_TAX_MONTHLY,
    country: 'US',
    periodType: 'MONTHLY',
    daysAfterPeriodEnd: 20,
    specificDayOfMonth: 20,
    allowsExtension: false,
    adjustForWeekends: true,
    adjustForHolidays: true,
    reminderDays: [7, 3, 1],
    description: 'Monthly sales tax return (varies by state)',
    filingMethod: ['online'],
    penaltyRate: 10.0,
  },
];

/**
 * United Kingdom (UK) Tax Deadlines
 */
export const UK_TAX_DEADLINES: TaxDeadlineRule[] = [
  {
    taxType: TaxTypeEnum.HMRC_MTD_QUARTERLY,
    country: 'GB',
    periodType: 'QUARTERLY',
    daysAfterPeriodEnd: 30,
    allowsExtension: false,
    adjustForWeekends: true,
    adjustForHolidays: true,
    reminderDays: [14, 7, 3, 1],
    description: 'Quarterly VAT return (Making Tax Digital)',
    filingMethod: ['online', 'hmrc', 'mtd'],
    penaltyRate: 15.0,
  },
  {
    taxType: TaxTypeEnum.VAT_MONTHLY,
    country: 'GB',
    periodType: 'MONTHLY',
    daysAfterPeriodEnd: 30,
    allowsExtension: false,
    adjustForWeekends: true,
    adjustForHolidays: true,
    reminderDays: [7, 3, 1],
    description: 'Monthly VAT return',
    filingMethod: ['online', 'hmrc'],
    penaltyRate: 15.0,
  },
  {
    taxType: TaxTypeEnum.INCOME_TAX_ANNUAL,
    country: 'GB',
    periodType: 'ANNUAL',
    specificMonth: 1, // January 31st
    specificDayOfMonth: 31,
    daysAfterPeriodEnd: 305, // Tax year ends April 5
    allowsExtension: false,
    adjustForWeekends: false, // HMRC strict on deadlines
    adjustForHolidays: false,
    reminderDays: [30, 14, 7, 3, 1],
    description: 'Annual self-assessment tax return',
    filingMethod: ['online', 'hmrc'],
    penaltyRate: 5.0,
  },
  {
    taxType: TaxTypeEnum.PAYROLL_TAX_MONTHLY,
    country: 'GB',
    periodType: 'MONTHLY',
    daysAfterPeriodEnd: 22,
    specificDayOfMonth: 22,
    allowsExtension: false,
    adjustForWeekends: false,
    adjustForHolidays: false,
    reminderDays: [7, 3, 1],
    description: 'Monthly PAYE payment to HMRC',
    filingMethod: ['online', 'hmrc'],
  },
];

/**
 * Master list of all tax deadline rules by country
 */
export const TAX_DEADLINE_RULES: Record<string, TaxDeadlineRule[]> = {
  DE: GERMANY_TAX_DEADLINES,
  AT: AUSTRIA_TAX_DEADLINES,
  CH: SWITZERLAND_TAX_DEADLINES,
  US: US_TAX_DEADLINES,
  GB: UK_TAX_DEADLINES,
};

/**
 * Default reminder schedule (days before due date)
 */
export const DEFAULT_REMINDER_DAYS = [7, 3, 1];

/**
 * Holiday calendars for business day adjustments
 * This is a simplified version - in production, use a comprehensive holiday API
 */
export const PUBLIC_HOLIDAYS: Record<string, Date[]> = {
  DE: [
    // 2024 German public holidays (sample)
    new Date('2024-01-01'), // New Year
    new Date('2024-03-29'), // Good Friday
    new Date('2024-04-01'), // Easter Monday
    new Date('2024-05-01'), // Labour Day
    new Date('2024-05-09'), // Ascension Day
    new Date('2024-05-20'), // Whit Monday
    new Date('2024-10-03'), // German Unity Day
    new Date('2024-12-25'), // Christmas Day
    new Date('2024-12-26'), // Boxing Day
  ],
  AT: [
    new Date('2024-01-01'), // New Year
    new Date('2024-01-06'), // Epiphany
    new Date('2024-04-01'), // Easter Monday
    new Date('2024-05-01'), // Labour Day
    new Date('2024-05-09'), // Ascension Day
    new Date('2024-05-20'), // Whit Monday
    new Date('2024-08-15'), // Assumption Day
    new Date('2024-10-26'), // National Day
    new Date('2024-11-01'), // All Saints Day
    new Date('2024-12-08'), // Immaculate Conception
    new Date('2024-12-25'), // Christmas Day
    new Date('2024-12-26'), // St Stephen's Day
  ],
  GB: [
    new Date('2024-01-01'), // New Year
    new Date('2024-03-29'), // Good Friday
    new Date('2024-04-01'), // Easter Monday
    new Date('2024-05-06'), // Early May Bank Holiday
    new Date('2024-05-27'), // Spring Bank Holiday
    new Date('2024-08-26'), // Summer Bank Holiday
    new Date('2024-12-25'), // Christmas Day
    new Date('2024-12-26'), // Boxing Day
  ],
  US: [
    new Date('2024-01-01'), // New Year
    new Date('2024-01-15'), // MLK Day
    new Date('2024-02-19'), // Presidents Day
    new Date('2024-05-27'), // Memorial Day
    new Date('2024-07-04'), // Independence Day
    new Date('2024-09-02'), // Labor Day
    new Date('2024-10-14'), // Columbus Day
    new Date('2024-11-11'), // Veterans Day
    new Date('2024-11-28'), // Thanksgiving
    new Date('2024-12-25'), // Christmas
  ],
};

/**
 * Get tax deadline rules for a specific country
 */
export function getTaxDeadlineRulesForCountry(countryCode: string): TaxDeadlineRule[] {
  return TAX_DEADLINE_RULES[countryCode.toUpperCase()] || [];
}

/**
 * Get specific tax deadline rule
 */
export function getTaxDeadlineRule(
  countryCode: string,
  taxType: TaxTypeEnum,
): TaxDeadlineRule | undefined {
  const countryRules = getTaxDeadlineRulesForCountry(countryCode);
  return countryRules.find((rule) => rule.taxType === taxType);
}

/**
 * Check if a date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Check if a date is a public holiday
 */
export function isPublicHoliday(date: Date, countryCode: string): boolean {
  const holidays = PUBLIC_HOLIDAYS[countryCode.toUpperCase()] || [];
  return holidays.some(
    (holiday) =>
      holiday.getFullYear() === date.getFullYear() &&
      holiday.getMonth() === date.getMonth() &&
      holiday.getDate() === date.getDate(),
  );
}

/**
 * Adjust date to next business day if needed
 */
export function adjustToBusinessDay(
  date: Date,
  countryCode: string,
  adjustWeekends: boolean = true,
  adjustHolidays: boolean = true,
): Date {
  let adjustedDate = new Date(date);

  while (
    (adjustWeekends && isWeekend(adjustedDate)) ||
    (adjustHolidays && isPublicHoliday(adjustedDate, countryCode))
  ) {
    adjustedDate.setDate(adjustedDate.getDate() + 1);
  }

  return adjustedDate;
}
