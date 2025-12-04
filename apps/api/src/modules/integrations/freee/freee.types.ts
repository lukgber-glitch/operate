/**
 * freee API Type Definitions
 * Based on freee API documentation: https://developer.freee.co.jp/docs
 */

import {
  FreeeConnectionStatus,
  FreeeSyncStatus,
  FreeeSyncDirection,
} from './freee.constants';

/**
 * Encrypted token storage
 */
export interface EncryptedToken {
  encryptedData: string;
  iv: Buffer;
  tag: Buffer;
}

/**
 * PKCE challenge for OAuth2
 */
export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}

/**
 * OAuth state stored during authorization
 */
export interface OAuthState {
  state: string;
  codeVerifier: string;
  orgId: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * freee OAuth2 token response
 */
export interface FreeeToken {
  access_token: string;
  refresh_token: string;
  token_type: string; // 'Bearer'
  expires_in: number; // 86400 (24 hours)
  scope: string; // 'read write'
  created_at: number; // Unix timestamp
}

/**
 * freee Company (事業所) information
 */
export interface FreeeCompany {
  id: number;
  name: string;
  name_kana: string | null;
  display_name: string;
  tax_at_source_calc_type: number;
  contact_name: string | null;
  head_count: number | null;
  corporate_number: string | null;
  txn_number_format: string;
  private_settlement: boolean;
  minus_format: number;
  role: 'admin' | 'simple_accounting' | 'self_only' | 'read_only';
  phone1: string | null;
  phone2: string | null;
  fax: string | null;
  zipcode: string | null;
  prefecture_code: number | null;
  street_name1: string | null;
  street_name2: string | null;
  invoice_layout: number;
  invoice_style: number;
  amount_fraction: number;
  industry_class: string | null;
  industry_code: string | null;
  workflow_setting: 'enable' | 'disable';
  fiscal_years: FreeFiscalYear[];
}

/**
 * freee Fiscal Year (会計年度)
 */
export interface FreeFiscalYear {
  id: number;
  company_id: number;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  accounting_period: number;
  depreciation_fraction: number;
  return_code: number;
  tax_method: number;
  tax_fraction: number;
  use_industry_template: boolean;
  indirect_write_off_method: boolean;
  start_month: number;
}

/**
 * freee Partner (取引先) - Contact/Customer/Vendor
 */
export interface FreeePartner {
  id: number;
  company_id: number;
  name: string;
  shortcut1: string | null;
  shortcut2: string | null;
  long_name: string | null;
  name_kana: string | null;
  default_title: string | null;
  phone: string | null;
  contact_name: string | null;
  email: string | null;
  payer_walletable_id: number | null;
  transfer_fee_handling_side: 'payer' | 'payee' | null;
  address_attributes: {
    zipcode: string | null;
    prefecture_code: number | null;
    street_name1: string | null;
    street_name2: string | null;
  } | null;
  partner_doc_setting_attributes: {
    sending_method: 'posting' | 'email' | 'email_and_posting' | null;
  } | null;
  partner_bank_account_attributes: {
    bank_name: string | null;
    bank_name_kana: string | null;
    bank_code: string | null;
    branch_name: string | null;
    branch_kana: string | null;
    branch_code: string | null;
    account_type: 'ordinary' | 'checking' | 'savings' | null;
    account_number: string | null;
    account_name: string | null;
    long_account_name: string | null;
  } | null;
  available: boolean;
  org_code: number | null;
  country_code: string | null;
  invoice_registration_number: string | null; // インボイス登録番号
  qualified_invoice_issuer: 'qualified' | 'not_qualified' | 'unspecified' | null;
}

/**
 * freee Invoice (請求書)
 */
export interface FreeeInvoice {
  id: number;
  company_id: number;
  issue_date: string; // YYYY-MM-DD
  partner_id: number;
  partner_name: string;
  partner_display_name: string | null;
  partner_title: string | null;
  partner_zipcode: string | null;
  partner_prefecture_code: number | null;
  partner_prefecture_name: string | null;
  partner_address1: string | null;
  partner_address2: string | null;
  partner_contact_info: string | null;
  company_name: string;
  company_zipcode: string | null;
  company_prefecture_code: number | null;
  company_prefecture_name: string | null;
  company_address1: string | null;
  company_address2: string | null;
  company_contact_info: string | null;
  payment_type: 'transfer' | 'direct_debit';
  payment_bank_info: string | null;
  message: string | null;
  notes: string | null;
  invoice_number: string;
  title: string | null;
  due_date: string | null; // YYYY-MM-DD
  total_amount: number;
  total_vat: number;
  sub_total: number;
  booking_date: string | null; // YYYY-MM-DD
  description: string | null;
  invoice_status: 'draft' | 'applying' | 'remanded' | 'rejected' | 'approved' | 'submitted';
  payment_status: 'unsettled' | 'settled';
  invoice_layout: 'default_classic' | 'standard_classic' | 'envelope_classic' | 'default_modern' | 'standard_modern' | 'envelope_modern';
  tax_entry_method: 'inclusive' | 'exclusive';
  deal_id: number | null;
  invoice_contents: FreeeInvoiceContent[];
  total_amount_per_vat_rate: {
    reduced_vat: number | null;
    eight_percent_vat: number | null;
    five_percent_vat: number | null;
    standard_vat: number | null;
  };
}

/**
 * freee Invoice Content (請求書明細)
 */
export interface FreeeInvoiceContent {
  id: number;
  order: number;
  type: 'normal' | 'discount' | 'text';
  qty: number;
  unit: string | null;
  unit_price: number;
  amount: number;
  vat: number;
  reduced_vat: boolean;
  description: string;
  tax_code: number | null;
  item_id: number | null;
  item_name: string | null;
  section_id: number | null;
  section_name: string | null;
  tag_ids: number[];
  tag_names: string[];
  segment_1_tag_id: number | null;
  segment_1_tag_name: string | null;
  segment_2_tag_id: number | null;
  segment_2_tag_name: string | null;
  segment_3_tag_id: number | null;
  segment_3_tag_name: string | null;
}

/**
 * freee Deal (取引)
 */
export interface FreeeDeal {
  id: number;
  company_id: number;
  issue_date: string; // YYYY-MM-DD
  due_date: string | null; // YYYY-MM-DD
  amount: number;
  due_amount: number;
  type: 'income' | 'expense';
  partner_id: number;
  partner_code: string | null;
  ref_number: string | null;
  status: 'settled' | 'unsettled';
  details: FreeDealDetail[];
  payments: FreeeDealPayment[];
  receipts: any[];
  renews: any[];
}

/**
 * freee Deal Detail (取引明細)
 */
export interface FreeDealDetail {
  id: number;
  account_item_id: number;
  account_item_name: string;
  tax_code: number;
  item_id: number | null;
  item_name: string | null;
  section_id: number | null;
  section_name: string | null;
  tag_ids: number[];
  tag_names: string[];
  segment_1_tag_id: number | null;
  segment_1_tag_name: string | null;
  segment_2_tag_id: number | null;
  segment_2_tag_name: string | null;
  segment_3_tag_id: number | null;
  segment_3_tag_name: string | null;
  amount: number;
  vat: number;
  description: string | null;
}

/**
 * freee Deal Payment (決済情報)
 */
export interface FreeeDealPayment {
  id: number;
  date: string; // YYYY-MM-DD
  from_walletable_id: number;
  from_walletable_type: 'bank_account' | 'credit_card' | 'wallet';
  to_walletable_id: number | null;
  to_walletable_type: 'bank_account' | 'credit_card' | 'wallet' | null;
  amount: number;
}

/**
 * freee Wallet Transaction (明細)
 */
export interface FreeeWalletTxn {
  id: number;
  company_id: number;
  date: string; // YYYY-MM-DD
  amount: number;
  due_amount: number;
  balance: number | null;
  entry_side: 'income' | 'expense';
  walletable_id: number;
  walletable_type: 'bank_account' | 'credit_card' | 'wallet';
  description: string | null;
  status: 'not_registered' | 'registered' | 'ignored';
  deal_id: number | null;
}

/**
 * freee connection information
 */
export interface FreeeConnectionInfo {
  id: string;
  orgId: string;
  freeeCompanyId: number;
  freeeCompanyName: string | null;
  status: FreeeConnectionStatus;
  isConnected: boolean;
  lastSyncAt: Date | null;
  lastError: string | null;
  tokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  connectedAt: Date;
}

/**
 * OAuth authorization URL response
 */
export interface FreeeAuthUrlResponse {
  authUrl: string;
  state: string;
}

/**
 * OAuth callback query parameters
 */
export interface FreeeCallbackQuery {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

/**
 * Token refresh result
 */
export interface RefreshTokenResult {
  success: boolean;
  tokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  error?: string;
}

/**
 * Disconnect result
 */
export interface DisconnectResult {
  success: boolean;
  message: string;
}

/**
 * Decrypted tokens for internal use
 */
export interface DecryptedTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * freee audit log entry
 */
export interface FreeeAuditLog {
  action: string;
  endpoint?: string;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * freee API error response
 */
export interface FreeeApiError {
  status_code: number;
  errors: Array<{
    type: string;
    messages: string[];
  }>;
}

/**
 * Sync job configuration
 */
export interface FreeeSyncJobConfig {
  orgId: string;
  freeeCompanyId?: number;
  direction: FreeeSyncDirection;
  entities: string[];
  fullSync: boolean;
  sinceDate?: Date;
}

/**
 * Sync job result
 */
export interface FreeeSyncJobResult {
  success: boolean;
  status: FreeeSyncStatus;
  startedAt: Date;
  completedAt?: Date;
  entitiesSynced: Record<string, number>;
  errors: string[];
}

/**
 * Rate limiter state
 */
export interface RateLimiterState {
  requests: number;
  resetAt: number;
}
