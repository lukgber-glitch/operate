/**
 * Tax Deadline Reminder Types
 * Type definitions for tax deadline reminder system
 */

export interface TaxDeadline {
  type: string;
  name: string;
  schedule: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  dayOfMonth?: number;
  daysAfterPeriod?: number;
  month?: number;
  day?: number;
  quarters?: { month: number; day: number }[];
  description: string;
}

export interface UpcomingDeadline extends TaxDeadline {
  dueDate: Date;
  daysRemaining: number;
}

export interface TaxReminder {
  type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  dueDate: Date;
  actionUrl: string;
  daysRemaining: number;
}

export type CountryDeadlines = Record<string, TaxDeadline[]>;

export type ReminderPriority = 'HIGH' | 'MEDIUM' | 'LOW';
