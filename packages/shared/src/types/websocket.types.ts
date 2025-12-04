/**
 * WebSocket Event Types
 * Defines all real-time events that can be emitted through WebSocket connections
 */

/**
 * Base WebSocket event payload
 */
export interface WebSocketEventPayload {
  timestamp: Date;
  organizationId: string;
  userId?: string;
}

/**
 * Invoice Events
 */
export enum InvoiceEvent {
  CREATED = 'invoice:created',
  UPDATED = 'invoice:updated',
  PAID = 'invoice:paid',
  CANCELLED = 'invoice:cancelled',
  SENT = 'invoice:sent',
  OVERDUE = 'invoice:overdue',
}

export interface InvoiceEventPayload extends WebSocketEventPayload {
  invoiceId: string;
  invoiceNumber?: string;
  customerId?: string;
  amount?: number;
  currency?: string;
  status?: string;
}

/**
 * Expense Events
 */
export enum ExpenseEvent {
  CREATED = 'expense:created',
  UPDATED = 'expense:updated',
  APPROVED = 'expense:approved',
  REJECTED = 'expense:rejected',
  DELETED = 'expense:deleted',
}

export interface ExpenseEventPayload extends WebSocketEventPayload {
  expenseId: string;
  categoryId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  submittedBy?: string;
}

/**
 * Bank Transaction Events
 */
export enum BankEvent {
  TRANSACTION_IMPORTED = 'bank:transaction_imported',
  TRANSACTION_CLASSIFIED = 'bank:transaction_classified',
  TRANSACTION_AUTO_APPROVED = 'bank:transaction_auto_approved',
  TRANSACTIONS_SYNCED = 'bank:transactions_synced',
  ACCOUNT_CONNECTED = 'bank:account_connected',
  ACCOUNT_DISCONNECTED = 'bank:account_disconnected',
  SYNC_ERROR = 'bank:sync_error',
}

export interface BankEventPayload extends WebSocketEventPayload {
  accountId?: string;
  transactionId?: string;
  transactionCount?: number;
  category?: string;
  confidence?: number;
  autoApproved?: boolean;
  error?: string;
}

/**
 * Notification Events
 */
export enum NotificationEvent {
  NEW = 'notification:new',
  READ = 'notification:read',
  DELETED = 'notification:deleted',
}

export interface NotificationEventPayload extends WebSocketEventPayload {
  notificationId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  actionUrl?: string;
  read?: boolean;
}

/**
 * Document Events
 */
export enum DocumentEvent {
  UPLOADED = 'document:uploaded',
  PROCESSED = 'document:processed',
  CLASSIFICATION_COMPLETE = 'document:classification_complete',
  OCR_COMPLETE = 'document:ocr_complete',
  ERROR = 'document:error',
}

export interface DocumentEventPayload extends WebSocketEventPayload {
  documentId: string;
  fileName?: string;
  documentType?: string;
  status?: string;
  error?: string;
}

/**
 * HR Events
 */
export enum HrEvent {
  EMPLOYEE_ADDED = 'hr:employee_added',
  EMPLOYEE_UPDATED = 'hr:employee_updated',
  LEAVE_REQUESTED = 'hr:leave_requested',
  LEAVE_APPROVED = 'hr:leave_approved',
  LEAVE_REJECTED = 'hr:leave_rejected',
  CONTRACT_EXPIRING = 'hr:contract_expiring',
}

export interface HrEventPayload extends WebSocketEventPayload {
  employeeId?: string;
  leaveRequestId?: string;
  contractId?: string;
  action?: string;
}

/**
 * Tax Events
 */
export enum TaxEvent {
  RETURN_SUBMITTED = 'tax:return_submitted',
  RETURN_ACCEPTED = 'tax:return_accepted',
  RETURN_REJECTED = 'tax:return_rejected',
  FILING_DUE_REMINDER = 'tax:filing_due_reminder',
}

export interface TaxEventPayload extends WebSocketEventPayload {
  returnId?: string;
  taxYear?: number;
  taxType?: string;
  status?: string;
  error?: string;
}

/**
 * Integration Events
 */
export enum IntegrationEvent {
  SYNC_STARTED = 'integration:sync_started',
  SYNC_COMPLETED = 'integration:sync_completed',
  SYNC_FAILED = 'integration:sync_failed',
  CONNECTION_ESTABLISHED = 'integration:connection_established',
  CONNECTION_LOST = 'integration:connection_lost',
}

export interface IntegrationEventPayload extends WebSocketEventPayload {
  integrationName: string;
  integrationId?: string;
  status?: string;
  error?: string;
  recordsProcessed?: number;
}

/**
 * AI/Automation Events
 */
export enum AutomationEvent {
  CLASSIFICATION_COMPLETE = 'automation:classification_complete',
  AUTO_APPROVED = 'automation:auto_approved',
  REVIEW_REQUIRED = 'automation:review_required',
  CONFIDENCE_LOW = 'automation:confidence_low',
  TAX_DEDUCTION_SUGGESTED = 'automation:tax_deduction_suggested',
}

export interface AutomationEventPayload extends WebSocketEventPayload {
  entityType: string;
  entityId: string;
  feature: string;
  action: string;
  confidence?: number;
  category?: string;
  autoApproved?: boolean;
  reasoning?: string;
  metadata?: Record<string, any>;
}

/**
 * Union type of all WebSocket events
 */
export type WebSocketEvent =
  | InvoiceEvent
  | ExpenseEvent
  | BankEvent
  | NotificationEvent
  | DocumentEvent
  | HrEvent
  | TaxEvent
  | IntegrationEvent
  | AutomationEvent;

/**
 * Union type of all event payloads
 */
export type WebSocketPayload =
  | InvoiceEventPayload
  | ExpenseEventPayload
  | BankEventPayload
  | NotificationEventPayload
  | DocumentEventPayload
  | HrEventPayload
  | TaxEventPayload
  | IntegrationEventPayload
  | AutomationEventPayload;

/**
 * WebSocket room naming convention
 * Organization-scoped rooms ensure users only receive events for their organization
 */
export const getOrgRoom = (organizationId: string): string => {
  return `org:${organizationId}`;
};

export const getUserRoom = (userId: string): string => {
  return `user:${userId}`;
};
