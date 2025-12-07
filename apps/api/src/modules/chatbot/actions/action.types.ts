/**
 * Action Types and Interfaces
 * Defines all action-related types for the chatbot action executor system
 */

/**
 * Available action types that the AI can execute
 */
export enum ActionType {
  CREATE_INVOICE = 'create_invoice',
  SEND_REMINDER = 'send_reminder',
  GENERATE_REPORT = 'generate_report',
  CREATE_EXPENSE = 'create_expense',
  SEND_EMAIL = 'send_email',
  EXPORT_DATA = 'export_data',
  UPDATE_STATUS = 'update_status',
  SCHEDULE_TASK = 'schedule_task',
  CREATE_BILL = 'create_bill',
  PAY_BILL = 'pay_bill',
  LIST_BILLS = 'list_bills',
  BILL_STATUS = 'bill_status',
  GET_CASH_FLOW = 'get_cash_flow',
  GET_RUNWAY = 'get_runway',
  GET_BURN_RATE = 'get_burn_rate',
  GET_CASH_FORECAST = 'get_cash_forecast',
  HIRE_EMPLOYEE = 'hire_employee',
  TERMINATE_EMPLOYEE = 'terminate_employee',
  REQUEST_LEAVE = 'request_leave',
  APPROVE_LEAVE = 'approve_leave',
  // New automation actions for S2-08
  SEARCH_DOCUMENTS = 'search_documents',
  REDUCE_EXPENSES = 'reduce_expenses',
  CONSULT_TAXES = 'consult_taxes',
  CREATE_CUSTOMER = 'create_customer',
  // Bank account actions for S2-01
  GET_BANK_BALANCE = 'get_bank_balance',
  GET_BANK_TRANSACTIONS = 'get_bank_transactions',
}

/**
 * Action intent parsed from AI response
 */
export interface ActionIntent {
  type: ActionType;
  parameters: Record<string, any>;
  confirmationRequired: boolean;
  description: string;
}

/**
 * Result of an executed action
 */
export interface ActionResult {
  success: boolean;
  message: string;
  entityId?: string;
  entityType?: string;
  data?: any;
  error?: string;
}

/**
 * Context needed to execute actions
 */
export interface ActionContext {
  userId: string;
  organizationId: string;
  conversationId: string;
  permissions: string[];
  userRole?: string;
}

/**
 * Parameter definition for action validation
 */
export interface ParameterDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  validation?: (value: any) => boolean;
  default?: any;
}

/**
 * Validation result for action parameters
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Action definition for available actions
 */
export interface ActionDefinition {
  type: ActionType;
  name: string;
  description: string;
  parameters: ParameterDefinition[];
  requiredPermissions: string[];
  requiresConfirmation: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  examples: string[];
}

/**
 * Pending action awaiting confirmation
 */
export interface PendingAction {
  id: string;
  action: ActionIntent;
  context: ActionContext;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Action execution options
 */
export interface ActionExecutionOptions {
  skipConfirmation?: boolean;
  dryRun?: boolean;
  timeout?: number;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  actionsPerHour: number;
  actionsPerDay: number;
  highRiskActionsPerDay: number;
}

/**
 * Action audit entry
 */
export interface ActionAudit {
  actionType: ActionType;
  userId: string;
  organizationId: string;
  conversationId: string;
  messageId: string;
  parameters: Record<string, any>;
  result: ActionResult;
  timestamp: Date;
  ipAddress?: string;
}
