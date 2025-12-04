/**
 * Connection Hub Providers
 * Export all provider services for easy importing
 */

// GoCardless exports
export { GoCardlessService } from './gocardless.service';
export {
  TokenResponse as GoCardlessTokenResponse,
  Institution,
  Requisition,
  RequisitionStatus,
  BankAccount,
  AccountStatus,
  AccountDetails,
  Transaction,
  TransactionsResponse,
  Balance,
  BalanceType,
  BalancesResponse,
  EndUserAgreement,
  GoCardlessError,
  CreateRequisitionRequest,
  CreateAgreementRequest,
} from './gocardless.types';

// Gmail exports
export { GmailService } from './gmail.service';
export {
  TokenResponse as GmailTokenResponse,
  GmailProfile,
  MessageList,
  MessageListItem,
  GmailMessage,
  MessagePart,
  MessageHeader,
  MessageBody,
  Label,
  LabelListResponse,
  GmailErrorResponse,
} from './gmail.types';

// Outlook exports
export { OutlookService } from './outlook.service';
export {
  TokenResponse as OutlookTokenResponse,
  OutlookProfile,
  MessageList as OutlookMessageList,
  OutlookMessage,
  EmailAddress,
  ItemBody,
  FollowupFlag,
  DateTimeTimeZone,
  MailFolder,
  MailFolderListResponse,
  GraphErrorResponse,
  SendMailRequest,
} from './outlook.types';

// LexOffice exports
export { LexOfficeService } from './lexoffice.service';
export {
  LexOfficeCredentials,
  LexOfficeContact,
  ContactListResponse,
  ContactSearchParams,
  LexOfficeInvoice,
  CreateInvoiceRequest,
  InvoiceListResponse,
  InvoiceSearchParams,
  LexOfficeVoucher,
  CreateVoucherRequest,
  VoucherListResponse,
  VoucherListFilters,
  LexOfficeTransaction,
  LexOfficeWebhookEvent,
  WebhookRegistration,
  LexOfficeErrorResponse,
  RateLimitInfo,
  Address,
  ContactPerson,
  ContactRoles,
  LexOfficeLineItem,
  TotalPrice,
  TaxAmount,
  PaymentTerms,
  ShippingConditions,
} from './lexoffice.types';
export {
  LEXOFFICE_API_BASE_URL,
  VAT_RATES,
  LEXOFFICE_VAT_TYPES,
  LexOfficeDocumentType,
  LexOfficeInvoiceStatus,
  LexOfficeVoucherStatus,
  LexOfficeContactType,
  PaymentTermsType,
  WebhookEventType,
  RATE_LIMIT,
  PAGINATION_DEFAULTS,
} from './lexoffice.constants';

// DATEV exports
export { DATEVService } from './datev.service';
export {
  TokenResponse as DATEVTokenResponse,
  DATEVCredentials,
  DATEVBookingRecord,
  DATEVAccount,
  DATEVExportFormat,
  DATEVChartOfAccounts,
  DATEVSyncResult,
  DATEVError,
  DATEVErrorResponse,
  DATEVExportRequest,
  DATEVImportResult,
  DATEVASCIIHeader,
} from './datev.types';

// SevDesk exports
export { SevDeskService } from './sevdesk.service';
export {
  SevDeskCredentials,
  SevDeskTokenResponse,
  SevDeskApiResponse,
  SevDeskModelRef,
  SevDeskAddress,
  SevDeskCommunicationWay,
  SevDeskContact,
  ContactListParams as SevDeskContactListParams,
  SevDeskInvoicePos,
  SevDeskInvoice,
  CreateSevDeskInvoiceRequest,
  InvoiceListParams as SevDeskInvoiceListParams,
  SevDeskVoucherPos,
  SevDeskVoucher,
  CreateSevDeskVoucherRequest,
  VoucherListParams as SevDeskVoucherListParams,
  SevDeskTransaction,
  TransactionListParams as SevDeskTransactionListParams,
  SevDeskAccount,
  AccountListParams as SevDeskAccountListParams,
  SevDeskCategory,
  SevDeskWebhookEvent,
  SevDeskWebhookRegistration,
  SevDeskErrorResponse,
  RateLimitInfo as SevDeskRateLimitInfo,
  SevDeskFileUploadResponse,
  SevDeskExportResponse,
  SevDeskPart,
  SevDeskTaxRule,
  SevDeskUnity,
} from './sevdesk.types';
export {
  SEVDESK_API_BASE_URL,
  SEVDESK_OAUTH,
  SEVDESK_SCOPES,
  VAT_RATES as SEVDESK_VAT_RATES,
  SevDeskTaxType,
  TAX_SETS,
  SevDeskContactType,
  SevDeskInvoiceStatus,
  SevDeskVoucherStatus,
  SevDeskVoucherType,
  SEVDESK_OBJECTS,
  SevDeskPaymentMethod,
  RATE_LIMIT as SEVDESK_RATE_LIMIT,
  PAGINATION_DEFAULTS as SEVDESK_PAGINATION_DEFAULTS,
  WebhookEventType as SevDeskWebhookEventType,
  SUPPORTED_CURRENCIES as SEVDESK_SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY as SEVDESK_DEFAULT_CURRENCY,
  DATE_FORMAT as SEVDESK_DATE_FORMAT,
  SevDeskErrorCode,
  SevDeskAccountType,
  SevDeskBookingSide,
} from './sevdesk.constants';
