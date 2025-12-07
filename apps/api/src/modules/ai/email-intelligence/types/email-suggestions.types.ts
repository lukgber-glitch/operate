/**
 * Email-Based Suggestions Types
 * Types for AI-generated suggestions based on email analysis and relationship tracking
 */

import { ClassificationResult } from './email-classification.types';
import { ExtractedEntities } from './extracted-entities.types';

/**
 * Email suggestion types
 * Different categories of actionable suggestions generated from email analysis
 */
export enum EmailSuggestionType {
  // Follow-up suggestions
  FOLLOW_UP_QUOTE = 'FOLLOW_UP_QUOTE', // Quote sent X days ago, no response
  FOLLOW_UP_INVOICE = 'FOLLOW_UP_INVOICE', // Invoice overdue, send reminder
  FOLLOW_UP_INQUIRY = 'FOLLOW_UP_INQUIRY', // Customer asked question, needs response

  // Re-engagement suggestions
  REENGAGE_DORMANT = 'REENGAGE_DORMANT', // No contact in X days, reach out
  REENGAGE_PAST_CUSTOMER = 'REENGAGE_PAST_CUSTOMER', // Past customer, could return

  // Opportunity suggestions
  UPSELL_OPPORTUNITY = 'UPSELL_OPPORTUNITY', // Based on purchase patterns
  NEW_CONTACT_DETECTED = 'NEW_CONTACT_DETECTED', // New person at existing company

  // Warning suggestions
  RELATIONSHIP_DECLINING = 'RELATIONSHIP_DECLINING', // Response times increasing, sentiment negative
  PAYMENT_PATTERN_CHANGE = 'PAYMENT_PATTERN_CHANGE', // Started paying late

  // Action suggestions
  CREATE_INVOICE = 'CREATE_INVOICE', // Work completed, create invoice
  CREATE_BILL = 'CREATE_BILL', // Received invoice, create bill
  UPDATE_CONTACT = 'UPDATE_CONTACT', // New phone/email detected
}

/**
 * Suggestion priority levels
 */
export enum EmailSuggestionPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * Suggestion lifecycle status
 */
export enum EmailSuggestionStatus {
  PENDING = 'PENDING',
  VIEWED = 'VIEWED',
  COMPLETED = 'COMPLETED',
  DISMISSED = 'DISMISSED',
  SNOOZED = 'SNOOZED',
  EXPIRED = 'EXPIRED',
}

/**
 * Entity types that can be associated with suggestions
 */
export enum EmailSuggestionEntityType {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  CONTACT = 'CONTACT',
  INVOICE = 'INVOICE',
  BILL = 'BILL',
  EMAIL = 'EMAIL',
}

/**
 * Action types that can be executed from suggestions
 */
export enum EmailSuggestionActionType {
  NAVIGATE = 'NAVIGATE', // Navigate to a page
  CHAT_ACTION = 'CHAT_ACTION', // Execute chat action
  API_CALL = 'API_CALL', // Call an API endpoint
  OPEN_MODAL = 'OPEN_MODAL', // Open a modal dialog
}

/**
 * Email-based suggestion structure
 */
export interface EmailSuggestion {
  id: string;
  type: EmailSuggestionType;
  priority: EmailSuggestionPriority;
  status: EmailSuggestionStatus;
  title: string;
  message: string;

  // Related entity
  entityId?: string;
  entityType?: EmailSuggestionEntityType;
  entityName?: string;

  // Source email
  sourceEmailId?: string;
  sourceEmailSubject?: string;

  // Action
  actionType?: EmailSuggestionActionType;
  actionPayload?: any;
  actionLabel?: string; // Button text like "Send Reminder"

  // Metadata
  confidence?: number; // AI confidence (0-1)
  contextData?: Record<string, any>; // Additional context

  // Lifecycle
  createdAt: Date;
  expiresAt?: Date;
  dismissedAt?: Date;
  dismissedBy?: string;
  completedAt?: Date;
  completedBy?: string;
  snoozedUntil?: Date;

  // Organization
  organisationId: string;
}

/**
 * Input for generating suggestions from email
 */
export interface EmailSuggestionInput {
  emailId?: string;
  emailSubject?: string;
  classification: ClassificationResult;
  entities: ExtractedEntities;
  orgId: string;
  existingSuggestions?: EmailSuggestion[];
}

/**
 * Input for relationship-based suggestions
 */
export interface RelationshipSuggestionInput {
  entityId: string;
  entityType: EmailSuggestionEntityType;
  entityName: string;
  orgId: string;
  relationshipMetrics: RelationshipMetrics;
}

/**
 * Relationship health metrics
 */
export interface RelationshipMetrics {
  daysSinceLastContact: number;
  averageResponseTime: number; // in hours
  responseTimeChange: number; // percentage change
  emailFrequency: number; // emails per month
  frequencyChange: number; // percentage change
  sentimentScore: number; // -1 to 1
  sentimentTrend: 'improving' | 'stable' | 'declining';
  paymentBehavior?: 'early' | 'on_time' | 'late';
  paymentBehaviorChange?: boolean;
  healthScore: number; // 0-100
}

/**
 * Options for getting suggestions
 */
export interface GetEmailSuggestionsOptions {
  types?: EmailSuggestionType[];
  priority?: EmailSuggestionPriority[];
  limit?: number;
  includeExpired?: boolean;
  includeDismissed?: boolean;
  entityId?: string;
  entityType?: EmailSuggestionEntityType;
}

/**
 * Create suggestion DTO
 */
export interface CreateEmailSuggestionDto {
  type: EmailSuggestionType;
  priority: EmailSuggestionPriority;
  title: string;
  message: string;
  organisationId: string;

  entityId?: string;
  entityType?: EmailSuggestionEntityType;
  entityName?: string;

  sourceEmailId?: string;
  sourceEmailSubject?: string;

  actionType?: EmailSuggestionActionType;
  actionPayload?: any;
  actionLabel?: string;

  confidence?: number;
  contextData?: Record<string, any>;

  expiresAt?: Date;
}

/**
 * Suggestion generation context
 */
export interface SuggestionGenerationContext {
  orgId: string;
  emailData?: {
    id?: string;
    subject?: string;
    classification: ClassificationResult;
    entities: ExtractedEntities;
  };
  relationshipData?: RelationshipMetrics;
  entityData?: {
    id: string;
    type: EmailSuggestionEntityType;
    name: string;
  };
}

/**
 * Priority mapping for suggestion types
 */
export const EMAIL_SUGGESTION_PRIORITY_MAP: Record<
  EmailSuggestionType,
  EmailSuggestionPriority
> = {
  [EmailSuggestionType.FOLLOW_UP_QUOTE]: EmailSuggestionPriority.HIGH,
  [EmailSuggestionType.FOLLOW_UP_INVOICE]: EmailSuggestionPriority.URGENT,
  [EmailSuggestionType.FOLLOW_UP_INQUIRY]: EmailSuggestionPriority.HIGH,
  [EmailSuggestionType.REENGAGE_DORMANT]: EmailSuggestionPriority.MEDIUM,
  [EmailSuggestionType.REENGAGE_PAST_CUSTOMER]: EmailSuggestionPriority.MEDIUM,
  [EmailSuggestionType.UPSELL_OPPORTUNITY]: EmailSuggestionPriority.LOW,
  [EmailSuggestionType.NEW_CONTACT_DETECTED]: EmailSuggestionPriority.MEDIUM,
  [EmailSuggestionType.RELATIONSHIP_DECLINING]: EmailSuggestionPriority.HIGH,
  [EmailSuggestionType.PAYMENT_PATTERN_CHANGE]: EmailSuggestionPriority.URGENT,
  [EmailSuggestionType.CREATE_INVOICE]: EmailSuggestionPriority.HIGH,
  [EmailSuggestionType.CREATE_BILL]: EmailSuggestionPriority.HIGH,
  [EmailSuggestionType.UPDATE_CONTACT]: EmailSuggestionPriority.LOW,
};

/**
 * Default expiration times (in days) for suggestion types
 */
export const EMAIL_SUGGESTION_EXPIRATION_MAP: Record<EmailSuggestionType, number> = {
  [EmailSuggestionType.FOLLOW_UP_QUOTE]: 30,
  [EmailSuggestionType.FOLLOW_UP_INVOICE]: 7,
  [EmailSuggestionType.FOLLOW_UP_INQUIRY]: 14,
  [EmailSuggestionType.REENGAGE_DORMANT]: 60,
  [EmailSuggestionType.REENGAGE_PAST_CUSTOMER]: 90,
  [EmailSuggestionType.UPSELL_OPPORTUNITY]: 60,
  [EmailSuggestionType.NEW_CONTACT_DETECTED]: 30,
  [EmailSuggestionType.RELATIONSHIP_DECLINING]: 30,
  [EmailSuggestionType.PAYMENT_PATTERN_CHANGE]: 30,
  [EmailSuggestionType.CREATE_INVOICE]: 14,
  [EmailSuggestionType.CREATE_BILL]: 14,
  [EmailSuggestionType.UPDATE_CONTACT]: 30,
};
