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
  // Quotes actions
  CREATE_QUOTE = 'create_quote',
  SEND_QUOTE = 'send_quote',
  GET_QUOTE_STATUS = 'get_quote_status',
  CONVERT_QUOTE_TO_INVOICE = 'convert_quote_to_invoice',
  // Time tracking actions
  START_TIMER = 'start_timer',
  STOP_TIMER = 'stop_timer',
  GET_TIME_SUMMARY = 'get_time_summary',
  LOG_TIME = 'log_time',
  // Mileage actions
  LOG_MILEAGE = 'log_mileage',
  GET_MILEAGE_SUMMARY = 'get_mileage_summary',
  // Contract actions
  CREATE_CONTRACT = 'create_contract',
  SEND_CONTRACT = 'send_contract',
  GET_CONTRACT_STATUS = 'get_contract_status',
  // Health score actions
  GET_BUSINESS_HEALTH = 'get_business_health',
  GET_HEALTH_RECOMMENDATIONS = 'get_health_recommendations',
  // Project actions
  CREATE_PROJECT = 'create_project',
  GET_PROJECT_STATUS = 'get_project_status',
  // Payment initiation actions
  INITIATE_PAYMENT = 'initiate_payment',
  SHOW_PAYMENT_SUGGESTIONS = 'show_payment_suggestions',
  CONFIRM_PAYMENT = 'confirm_payment',
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

/**
 * Panel Types for UI Wizard Integration
 * These panels provide guided, step-by-step workflows in a side panel
 */
export enum PanelType {
  INVOICE_BUILDER = 'invoice_builder',
  EXPENSE_FORM = 'expense_form',
  CLIENT_FORM = 'client_form',
  VENDOR_FORM = 'vendor_form',
  LEAVE_REQUEST = 'leave_request',
  QUOTE_BUILDER = 'quote_builder',
  CONTRACT_BUILDER = 'contract_builder',
  EMPLOYEE_ONBOARD = 'employee_onboard',
  PROJECT_CREATE = 'project_create',
  REPORT_BUILDER = 'report_builder',
}

/**
 * Panel trigger configuration
 * Defines initial data and options when opening a panel
 */
export interface PanelTrigger {
  panelType: PanelType;
  initialData?: Record<string, any>;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  chatGuidance?: boolean; // Whether chat should provide step-by-step guidance
}

/**
 * Extended action result with panel support
 */
export interface ActionResultWithPanel extends ActionResult {
  /**
   * If set, indicates that a UI panel should be opened instead of
   * or in addition to the action result
   */
  openPanel?: PanelTrigger;

  /**
   * Guidance messages to show in chat as user progresses through panel
   */
  panelGuidance?: PanelGuidanceConfig;
}

/**
 * Configuration for chat guidance during panel workflows
 */
export interface PanelGuidanceConfig {
  stepMessages: Record<number, string>;
  completionMessage: string;
  errorMessage?: string;
  hints?: string[];
}

/**
 * Maps action types that should trigger panels instead of direct execution
 * Some actions are better served by a guided wizard than immediate execution
 */
export const ACTION_TO_PANEL_MAP: Partial<Record<ActionType, PanelType>> = {
  [ActionType.CREATE_INVOICE]: PanelType.INVOICE_BUILDER,
  [ActionType.CREATE_EXPENSE]: PanelType.EXPENSE_FORM,
  [ActionType.CREATE_CUSTOMER]: PanelType.CLIENT_FORM,
  [ActionType.REQUEST_LEAVE]: PanelType.LEAVE_REQUEST,
  [ActionType.CREATE_QUOTE]: PanelType.QUOTE_BUILDER,
  [ActionType.CREATE_CONTRACT]: PanelType.CONTRACT_BUILDER,
  [ActionType.HIRE_EMPLOYEE]: PanelType.EMPLOYEE_ONBOARD,
  [ActionType.CREATE_PROJECT]: PanelType.PROJECT_CREATE,
};

/**
 * Panel-specific step guidance messages
 */
export const PANEL_GUIDANCE_MESSAGES: Record<PanelType, PanelGuidanceConfig> = {
  [PanelType.INVOICE_BUILDER]: {
    stepMessages: {
      0: "Let's create your invoice. First, select or search for your client.",
      1: "Now add your line items. I can help calculate totals.",
      2: "Set the invoice date and due date. The default payment terms are applied automatically.",
      3: "Review everything and you're ready to send!",
    },
    completionMessage: "Invoice created successfully! Would you like me to send it now?",
    hints: ["Tip: You can add multiple line items at once"],
  },
  [PanelType.EXPENSE_FORM]: {
    stepMessages: {
      0: "Enter the expense amount and select a category.",
      1: "Add a description and upload your receipt if you have one.",
      2: "Review and save your expense.",
    },
    completionMessage: "Expense recorded! I've categorized it for your tax deductions.",
    hints: ["Tip: Take a photo of the receipt with your phone"],
  },
  [PanelType.CLIENT_FORM]: {
    stepMessages: {
      0: "Let's add a new client. Start with their basic contact info.",
      1: "Add their billing address for invoices.",
      2: "Set payment terms and tax information.",
      3: "Review and save the client.",
    },
    completionMessage: "Client added! Ready to create their first invoice?",
  },
  [PanelType.VENDOR_FORM]: {
    stepMessages: {
      0: "Add vendor contact information.",
      1: "Enter their address for record keeping.",
      2: "Set default payment terms.",
      3: "Review and save the vendor.",
    },
    completionMessage: "Vendor added successfully!",
  },
  [PanelType.LEAVE_REQUEST]: {
    stepMessages: {
      0: "Select the type of leave you need.",
      1: "Choose your dates. I'll check your available balance.",
      2: "Review and submit your request.",
    },
    completionMessage: "Leave request submitted! Your manager will be notified.",
  },
  [PanelType.QUOTE_BUILDER]: {
    stepMessages: {
      0: "Select the client for this quote.",
      1: "Add the items or services you're quoting.",
      2: "Set validity period and terms.",
      3: "Review and send the quote.",
    },
    completionMessage: "Quote created! Shall I send it to the client?",
  },
  [PanelType.CONTRACT_BUILDER]: {
    stepMessages: {
      0: "Select the client for this contract.",
      1: "Choose a contract template or start fresh.",
      2: "Fill in the contract details.",
      3: "Review and prepare for signing.",
    },
    completionMessage: "Contract ready! Send it for e-signature?",
  },
  [PanelType.EMPLOYEE_ONBOARD]: {
    stepMessages: {
      0: "Enter the new employee's personal information.",
      1: "Set up their employment details and start date.",
      2: "Configure payroll and benefits.",
      3: "Review and complete onboarding.",
    },
    completionMessage: "Employee onboarded! I'll set up their access and send welcome materials.",
  },
  [PanelType.PROJECT_CREATE]: {
    stepMessages: {
      0: "Name your project and set objectives.",
      1: "Define the timeline and milestones.",
      2: "Assign team members and set budgets.",
      3: "Review and create the project.",
    },
    completionMessage: "Project created! Team members have been notified.",
  },
  [PanelType.REPORT_BUILDER]: {
    stepMessages: {
      0: "Select the type of report you need.",
      1: "Choose the date range and filters.",
      2: "Configure report sections and format.",
      3: "Generate and download your report.",
    },
    completionMessage: "Report generated! Would you like to schedule this report?",
  },
};
