/**
 * Tax Reminder DTOs
 * Data Transfer Objects for tax deadline reminders API
 */

export type ReminderPriority = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Tax Reminder DTO
 * Structured reminder for notifications and UI display
 */
export interface TaxReminderDto {
  /** Reminder type (e.g., 'TAX_DEADLINE') */
  type: string;

  /** Priority level based on urgency */
  priority: ReminderPriority;

  /** User-friendly title (e.g., 'USt-Voranmeldung due in 7 days') */
  title: string;

  /** Detailed description of the deadline */
  description: string;

  /** Due date */
  dueDate: Date;

  /** Frontend route for action (e.g., '/tax/vat-return') */
  actionUrl: string;

  /** Days remaining until due */
  daysRemaining: number;
}

/**
 * Deadline Summary DTO
 * Summary statistics about tax deadlines
 */
export interface DeadlineSummaryDto {
  /** Total number of upcoming deadlines (next 90 days) */
  total: number;

  /** Number of upcoming deadlines (>7 days away) */
  upcoming: number;

  /** Number of urgent deadlines (≤7 days away) */
  urgent: number;

  /** Next upcoming deadline details */
  nextDeadline?: {
    type: string;
    name: string;
    dueDate: Date;
    daysRemaining: number;
  };
}
