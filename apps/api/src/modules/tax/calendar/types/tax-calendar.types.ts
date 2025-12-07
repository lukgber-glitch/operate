/**
 * Tax Calendar Types
 * Type definitions for tax deadline calendar system
 */

export type TaxDeadlineType = 'vat_return' | 'income_tax' | 'prepayment' | 'annual_return' | 'custom';

export type TaxFilingFrequency = 'monthly' | 'quarterly' | 'yearly' | 'one_time';

export type TaxDeadlineStatus = 'upcoming' | 'due_soon' | 'overdue' | 'completed';

export interface TaxDeadline {
  id: string;
  type: TaxDeadlineType;
  title: string;
  description: string;
  dueDate: Date;
  periodStart?: Date;
  periodEnd?: Date;
  country: string;
  filingType: TaxFilingFrequency;
  status: TaxDeadlineStatus;
  estimatedAmount?: number;
  actionUrl?: string;
  reminderDays: number[]; // Days before to remind: [14, 7, 3, 1]
}

export interface OrganizationTaxSettings {
  country: string;
  taxFilingFrequency?: TaxFilingFrequency;
  vatRegistered?: boolean;
  vatNumber?: string;
  taxYear?: number;
  fiscalYearStart?: number; // Month number 1-12
}

export interface TaxCalendarFilters {
  year?: number;
  type?: TaxDeadlineType;
  status?: TaxDeadlineStatus;
  country?: string;
}

export interface DeadlineReminder {
  deadlineId: string;
  organizationId: string;
  dueDate: Date;
  daysUntilDue: number;
  title: string;
  actionUrl?: string;
}
