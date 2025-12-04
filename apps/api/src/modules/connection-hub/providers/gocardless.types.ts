/**
 * GoCardless Bank Account Data API Types
 * OAuth 2.0 + Requisition flow for EU Open Banking
 */

/**
 * OAuth 2.0 Token Response
 */
export interface TokenResponse {
  access: string;
  access_expires: number;
  refresh: string;
  refresh_expires: number;
}

/**
 * Financial Institution
 */
export interface Institution {
  id: string;
  name: string;
  bic: string;
  transaction_total_days: string;
  countries: string[];
  logo: string;
  supported_payments?: {
    'single-payment': string[];
    'bulk-payment'?: string[];
  };
  supported_features?: string[];
}

/**
 * Bank Account Requisition (consent)
 */
export interface Requisition {
  id: string;
  created: string;
  redirect: string;
  status: RequisitionStatus;
  institution_id: string;
  agreement?: string;
  reference: string;
  accounts: string[];
  user_language?: string;
  link: string;
  ssn?: string;
  account_selection?: boolean;
  redirect_immediate?: boolean;
}

/**
 * Requisition Status
 */
export enum RequisitionStatus {
  CREATED = 'CR',
  GIVING_CONSENT = 'GC',
  UNDERGOING_AUTHENTICATION = 'UA',
  REJECTED = 'RJ',
  SELECTING_ACCOUNTS = 'SA',
  GRANTING_ACCESS = 'GA',
  LINKED = 'LN',
  SUSPENDED = 'SU',
  EXPIRED = 'EX',
}

/**
 * Bank Account Details
 */
export interface BankAccount {
  id: string;
  created: string;
  last_accessed?: string;
  iban: string;
  institution_id: string;
  status: AccountStatus;
  owner_name?: string;
  details?: AccountDetails;
}

/**
 * Account Status
 */
export enum AccountStatus {
  DISCOVERED = 'DISCOVERED',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR',
  EXPIRED = 'EXPIRED',
  READY = 'READY',
  SUSPENDED = 'SUSPENDED',
}

/**
 * Account Details
 */
export interface AccountDetails {
  resourceId?: string;
  iban?: string;
  bban?: string;
  currency?: string;
  ownerName?: string;
  name?: string;
  displayName?: string;
  product?: string;
  cashAccountType?: string;
  status?: string;
  bic?: string;
  linkedAccounts?: string;
  usage?: string;
  details?: string;
}

/**
 * Bank Transaction
 */
export interface Transaction {
  transactionId: string;
  debtorName?: string;
  debtorAccount?: {
    iban?: string;
    bban?: string;
  };
  transactionAmount: {
    amount: string;
    currency: string;
  };
  bankTransactionCode?: string;
  bookingDate: string;
  valueDate?: string;
  remittanceInformationUnstructured?: string;
  remittanceInformationUnstructuredArray?: string[];
  creditorName?: string;
  creditorAccount?: {
    iban?: string;
    bban?: string;
  };
  proprietaryBankTransactionCode?: string;
  internalTransactionId?: string;
  entryReference?: string;
  mandateId?: string;
  checkId?: string;
  creditorId?: string;
  bookingDateTime?: string;
  valueDateTime?: string;
  transactionIdGenerated?: boolean;
  additionalInformation?: string;
  currencyExchange?: Array<{
    sourceCurrency: string;
    targetCurrency: string;
    exchangeRate: string;
    contractIdentification?: string;
    quotationDate?: string;
  }>;
  balanceAfterTransaction?: {
    balanceAmount: {
      amount: string;
      currency: string;
    };
  };
}

/**
 * Transactions Response
 */
export interface TransactionsResponse {
  transactions: {
    booked: Transaction[];
    pending?: Transaction[];
  };
}

/**
 * Account Balance
 */
export interface Balance {
  balanceAmount: {
    amount: string;
    currency: string;
  };
  balanceType: BalanceType;
  referenceDate?: string;
  lastChangeDateTime?: string;
}

/**
 * Balance Type
 */
export enum BalanceType {
  CLOSING_BOOKED = 'closingBooked',
  EXPECTED = 'expected',
  FORWARD_AVAILABLE = 'forwardAvailable',
  INFORMATION = 'information',
  INTERIM_AVAILABLE = 'interimAvailable',
  INTERIM_BOOKED = 'interimBooked',
  OPENING_BOOKED = 'openingBooked',
  PREVIOUSLY_CLOSED_BOOKED = 'previouslyClosedBooked',
}

/**
 * Balances Response
 */
export interface BalancesResponse {
  balances: Balance[];
}

/**
 * End User Agreement
 */
export interface EndUserAgreement {
  id: string;
  created: string;
  institution_id: string;
  max_historical_days: number;
  access_valid_for_days: number;
  access_scope: string[];
  accepted?: string;
}

/**
 * Error Response from GoCardless API
 */
export interface GoCardlessError {
  summary: string;
  detail: string;
  status_code?: number;
  type?: string;
}

/**
 * Create Requisition Request
 */
export interface CreateRequisitionRequest {
  redirect: string;
  institution_id: string;
  reference?: string;
  agreement?: string;
  user_language?: string;
  ssn?: string;
  account_selection?: boolean;
  redirect_immediate?: boolean;
}

/**
 * Create End User Agreement Request
 */
export interface CreateAgreementRequest {
  institution_id: string;
  max_historical_days?: number;
  access_valid_for_days?: number;
  access_scope?: string[];
}
