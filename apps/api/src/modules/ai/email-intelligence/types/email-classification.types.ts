/**
 * Email Classification Types
 * Defines all types and enums for email classification
 */

/**
 * Email classification categories
 * Each email is classified into one of these categories
 */
export enum EmailClassification {
  // Financial
  INVOICE_RECEIVED = 'INVOICE_RECEIVED', // Vendor sent us an invoice
  INVOICE_SENT = 'INVOICE_SENT', // We sent an invoice
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED', // Customer paid us
  PAYMENT_SENT = 'PAYMENT_SENT', // We paid vendor
  PAYMENT_REMINDER = 'PAYMENT_REMINDER', // Payment reminder

  // Sales
  QUOTE_REQUEST = 'QUOTE_REQUEST', // Customer asking for quote
  QUOTE_SENT = 'QUOTE_SENT', // We sent a quote
  ORDER_CONFIRMATION = 'ORDER_CONFIRMATION', // Order confirmed

  // Customer Service
  CUSTOMER_INQUIRY = 'CUSTOMER_INQUIRY', // General question
  SUPPORT_REQUEST = 'SUPPORT_REQUEST', // Help needed
  COMPLAINT = 'COMPLAINT', // Unhappy customer
  FEEDBACK = 'FEEDBACK', // Customer feedback

  // Administrative
  CONTRACT = 'CONTRACT', // Contract related
  LEGAL = 'LEGAL', // Legal matters
  TAX_DOCUMENT = 'TAX_DOCUMENT', // Tax related

  // Low Priority
  NEWSLETTER = 'NEWSLETTER', // Marketing emails
  NOTIFICATION = 'NOTIFICATION', // Automated notifications
  SPAM = 'SPAM', // Spam/irrelevant

  // Catch-all
  BUSINESS_GENERAL = 'BUSINESS_GENERAL', // General business
  PERSONAL = 'PERSONAL', // Not business related
  UNKNOWN = 'UNKNOWN', // Couldn't classify
}

/**
 * Priority levels for email classification
 * Determines urgency of handling
 */
export enum EmailPriority {
  CRITICAL = 'CRITICAL', // Immediate action required (complaints, legal)
  HIGH = 'HIGH', // Important (invoices, quotes, contracts)
  MEDIUM = 'MEDIUM', // Normal business (inquiries, confirmations)
  LOW = 'LOW', // Low priority (newsletters, notifications)
  SPAM = 'SPAM', // No action needed
}

/**
 * Suggested actions based on classification
 */
export enum SuggestedAction {
  CREATE_BILL = 'CREATE_BILL', // Create bill from invoice
  CREATE_INVOICE = 'CREATE_INVOICE', // Create invoice record
  RECORD_PAYMENT = 'RECORD_PAYMENT', // Record payment
  SEND_QUOTE = 'SEND_QUOTE', // Respond with quote
  RESPOND_TO_INQUIRY = 'RESPOND_TO_INQUIRY', // Reply to customer
  ESCALATE_COMPLAINT = 'ESCALATE_COMPLAINT', // Escalate to manager
  REVIEW_CONTRACT = 'REVIEW_CONTRACT', // Legal review
  FILE_TAX_DOCUMENT = 'FILE_TAX_DOCUMENT', // Store for tax purposes
  MARK_AS_READ = 'MARK_AS_READ', // Just mark as read
  DELETE = 'DELETE', // Can be deleted
  NO_ACTION = 'NO_ACTION', // No action needed
}

/**
 * Input for email classification
 */
export interface EmailInput {
  subject: string;
  body: string;
  from: string;
  to: string;
  hasAttachments: boolean;
  attachmentTypes?: string[];
  attachmentNames?: string[];
  receivedAt?: Date;
}

/**
 * Classification result
 */
export interface ClassificationResult {
  classification: EmailClassification;
  confidence: number; // 0-1
  priority: EmailPriority;
  reasoning: string;
  extractedIntent?: string; // What does the sender want?
  extractedEntities?: ExtractedEntities; // Extracted business entities
  suggestedAction?: SuggestedAction;
  suggestedActionDetails?: string;
  flags?: string[]; // Additional flags (urgent, follow_up, etc.)
}

/**
 * Extracted business entities from email content
 */
export interface ExtractedEntities {
  vendorName?: string;
  customerName?: string;
  invoiceNumber?: string;
  amount?: number;
  currency?: string;
  dueDate?: string;
  productNames?: string[];
  orderNumber?: string;
  contractNumber?: string;
  caseNumber?: string;
}

/**
 * Batch classification result with email ID
 */
export interface ClassificationResultWithId extends ClassificationResult {
  emailId: string;
}

/**
 * Classification request options
 */
export interface ClassificationOptions {
  /**
   * Use cached classification if available
   * @default true
   */
  useCache?: boolean;

  /**
   * Force reclassification even if already classified
   * @default false
   */
  forceReclassify?: boolean;

  /**
   * Include full email body in classification
   * If false, only uses subject and snippet
   * @default true
   */
  includeBody?: boolean;

  /**
   * Maximum tokens to use for classification
   * @default 2000
   */
  maxTokens?: number;
}

/**
 * Priority mapping helper
 */
export const CLASSIFICATION_PRIORITY_MAP: Record<EmailClassification, EmailPriority> = {
  // Critical
  [EmailClassification.COMPLAINT]: EmailPriority.CRITICAL,
  [EmailClassification.LEGAL]: EmailPriority.CRITICAL,

  // High
  [EmailClassification.INVOICE_RECEIVED]: EmailPriority.HIGH,
  [EmailClassification.PAYMENT_REMINDER]: EmailPriority.HIGH,
  [EmailClassification.QUOTE_REQUEST]: EmailPriority.HIGH,
  [EmailClassification.CONTRACT]: EmailPriority.HIGH,
  [EmailClassification.TAX_DOCUMENT]: EmailPriority.HIGH,
  [EmailClassification.SUPPORT_REQUEST]: EmailPriority.HIGH,

  // Medium
  [EmailClassification.INVOICE_SENT]: EmailPriority.MEDIUM,
  [EmailClassification.PAYMENT_RECEIVED]: EmailPriority.MEDIUM,
  [EmailClassification.PAYMENT_SENT]: EmailPriority.MEDIUM,
  [EmailClassification.QUOTE_SENT]: EmailPriority.MEDIUM,
  [EmailClassification.ORDER_CONFIRMATION]: EmailPriority.MEDIUM,
  [EmailClassification.CUSTOMER_INQUIRY]: EmailPriority.MEDIUM,
  [EmailClassification.FEEDBACK]: EmailPriority.MEDIUM,
  [EmailClassification.BUSINESS_GENERAL]: EmailPriority.MEDIUM,

  // Low
  [EmailClassification.NEWSLETTER]: EmailPriority.LOW,
  [EmailClassification.NOTIFICATION]: EmailPriority.LOW,
  [EmailClassification.PERSONAL]: EmailPriority.LOW,
  [EmailClassification.UNKNOWN]: EmailPriority.LOW,

  // Spam
  [EmailClassification.SPAM]: EmailPriority.SPAM,
};

/**
 * Suggested action mapping helper
 */
export const CLASSIFICATION_ACTION_MAP: Record<EmailClassification, SuggestedAction> = {
  [EmailClassification.INVOICE_RECEIVED]: SuggestedAction.CREATE_BILL,
  [EmailClassification.INVOICE_SENT]: SuggestedAction.CREATE_INVOICE,
  [EmailClassification.PAYMENT_RECEIVED]: SuggestedAction.RECORD_PAYMENT,
  [EmailClassification.PAYMENT_SENT]: SuggestedAction.RECORD_PAYMENT,
  [EmailClassification.PAYMENT_REMINDER]: SuggestedAction.RECORD_PAYMENT,
  [EmailClassification.QUOTE_REQUEST]: SuggestedAction.SEND_QUOTE,
  [EmailClassification.QUOTE_SENT]: SuggestedAction.NO_ACTION,
  [EmailClassification.ORDER_CONFIRMATION]: SuggestedAction.NO_ACTION,
  [EmailClassification.CUSTOMER_INQUIRY]: SuggestedAction.RESPOND_TO_INQUIRY,
  [EmailClassification.SUPPORT_REQUEST]: SuggestedAction.RESPOND_TO_INQUIRY,
  [EmailClassification.COMPLAINT]: SuggestedAction.ESCALATE_COMPLAINT,
  [EmailClassification.FEEDBACK]: SuggestedAction.NO_ACTION,
  [EmailClassification.CONTRACT]: SuggestedAction.REVIEW_CONTRACT,
  [EmailClassification.LEGAL]: SuggestedAction.REVIEW_CONTRACT,
  [EmailClassification.TAX_DOCUMENT]: SuggestedAction.FILE_TAX_DOCUMENT,
  [EmailClassification.NEWSLETTER]: SuggestedAction.MARK_AS_READ,
  [EmailClassification.NOTIFICATION]: SuggestedAction.MARK_AS_READ,
  [EmailClassification.SPAM]: SuggestedAction.DELETE,
  [EmailClassification.BUSINESS_GENERAL]: SuggestedAction.NO_ACTION,
  [EmailClassification.PERSONAL]: SuggestedAction.NO_ACTION,
  [EmailClassification.UNKNOWN]: SuggestedAction.NO_ACTION,
};
