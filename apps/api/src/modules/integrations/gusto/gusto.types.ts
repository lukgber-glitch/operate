/**
 * Gusto Embedded Payroll API TypeScript Types
 * Reference: https://docs.gusto.com/embedded-payroll/docs/introduction
 */

export enum GustoEnvironment {
  SANDBOX = 'SANDBOX',
  PRODUCTION = 'PRODUCTION',
}

export enum GustoConnectionStatus {
  PENDING = 'PENDING', // OAuth flow initiated
  ACTIVE = 'ACTIVE', // Connected and operational
  EXPIRED = 'EXPIRED', // Token expired
  REVOKED = 'REVOKED', // User revoked access
  ERROR = 'ERROR', // Connection error
}

export enum GustoWebhookEventType {
  // Company events
  COMPANY_CREATED = 'company.created',
  COMPANY_UPDATED = 'company.updated',

  // Employee events
  EMPLOYEE_CREATED = 'employee.created',
  EMPLOYEE_UPDATED = 'employee.updated',
  EMPLOYEE_TERMINATED = 'employee.terminated',

  // Payroll events
  PAYROLL_CREATED = 'payroll.created',
  PAYROLL_UPDATED = 'payroll.updated',
  PAYROLL_PROCESSED = 'payroll.processed',
  PAYROLL_CANCELLED = 'payroll.cancelled',

  // Payment events
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
}

export interface GustoConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: GustoEnvironment;
  apiVersion: string;
  webhookSecret: string;
  scopes: string[];
}

export interface GustoTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string;
  tokenType: string;
}

export interface GustoOAuthState {
  state: string;
  codeVerifier: string;
  organisationId: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

// Gusto API Response Types

export interface GustoCompany {
  uuid: string;
  name: string;
  ein?: string; // Employer Identification Number
  entity_type?: string;
  company_status: string;
  locations: GustoLocation[];
  primary_signatory?: GustoSignatory;
  primary_payroll_admin?: GustoPayrollAdmin;
}

export interface GustoLocation {
  uuid: string;
  version: string;
  company_uuid: string;
  phone_number?: string;
  street_1: string;
  street_2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface GustoSignatory {
  first_name: string;
  middle_initial?: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  ssn: string;
  home_address: GustoAddress;
}

export interface GustoPayrollAdmin {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface GustoAddress {
  street_1: string;
  street_2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface GustoEmployee {
  uuid: string;
  version: string;
  first_name: string;
  middle_initial?: string;
  last_name: string;
  email?: string;
  ssn?: string;
  date_of_birth?: string;
  company_uuid: string;
  manager_uuid?: string;
  department?: string;
  terminated?: boolean;
  terminations?: GustoTermination[];
  two_percent_shareholder?: boolean;
  onboarded?: boolean;
  jobs: GustoJob[];
  home_address?: GustoAddress;
  garnishments?: GustoGarnishment[];
  eligible_paid_time_off?: GustoPaidTimeOff[];
  custom_fields?: Record<string, any>;
}

export interface GustoJob {
  uuid: string;
  version: string;
  employee_uuid: string;
  location_uuid: string;
  hire_date: string;
  title: string;
  primary: boolean;
  rate?: string;
  payment_unit?: 'Hour' | 'Week' | 'Month' | 'Year' | 'Paycheck';
  location?: GustoLocation;
  compensations?: GustoCompensation[];
}

export interface GustoCompensation {
  uuid: string;
  version: string;
  job_uuid: string;
  rate: string;
  payment_unit: 'Hour' | 'Week' | 'Month' | 'Year' | 'Paycheck';
  flsa_status: 'Exempt' | 'Nonexempt';
  effective_date: string;
}

export interface GustoTermination {
  uuid: string;
  version: string;
  employee_uuid: string;
  effective_date: string;
  run_termination_payroll: boolean;
}

export interface GustoGarnishment {
  uuid: string;
  version: string;
  employee_uuid: string;
  active: boolean;
  amount?: string;
  description: string;
  court_ordered: boolean;
  times: number;
  recurring: boolean;
  annual_maximum?: string;
  pay_period_maximum?: string;
  deduct_as_percentage: boolean;
}

export interface GustoPaidTimeOff {
  uuid: string;
  name: string;
  accrual_unit: 'Hour' | 'Day';
  accrual_period: 'Year' | 'Hour';
  accrual_rate: string;
  accrual_balance: string;
  accrual_method: string;
  maximum_accrual_balance?: string;
  paid_at_termination: boolean;
}

export interface GustoPayroll {
  uuid: string;
  version: string;
  company_uuid: string;
  payroll_deadline: string;
  check_date: string;
  processed: boolean;
  processed_date?: string;
  payroll_totals?: GustoPayrollTotals;
  employee_compensations: GustoEmployeeCompensation[];
}

export interface GustoPayrollTotals {
  company_uuid: string;
  employee_compensations_total: string;
  employer_taxes_total: string;
  employee_taxes_total: string;
  net_pay_total: string;
  gross_pay_total: string;
  reimbursements_total: string;
  check_amount: string;
}

export interface GustoEmployeeCompensation {
  employee_uuid: string;
  fixed_compensations: GustoFixedCompensation[];
  hourly_compensations: GustoHourlyCompensation[];
  paid_time_off: GustoPaidTimeOffHours[];
}

export interface GustoFixedCompensation {
  name: string;
  amount: string;
  job_uuid: string;
}

export interface GustoHourlyCompensation {
  name: string;
  hours: string;
  job_uuid: string;
  compensation_multiplier: number;
}

export interface GustoPaidTimeOffHours {
  name: string;
  hours: string;
}

// Provisioning types

export interface GustoProvisionRequest {
  user: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  company: {
    name: string;
    trade_name?: string;
    ein?: string;
    entity_type?: string;
    locations: Array<{
      phone_number?: string;
      street_1: string;
      street_2?: string;
      city: string;
      state: string;
      zip: string;
      country?: string;
    }>;
  };
}

export interface GustoProvisionResponse {
  access_token: string;
  company_uuid: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// Webhook payload types

export interface GustoWebhookPayload {
  event_type: GustoWebhookEventType;
  entity_type: string;
  entity_uuid: string;
  company_uuid: string;
  timestamp: string;
  resource_uuid?: string;
  resource?: any;
}

// API Error types

export interface GustoApiError {
  error: string;
  error_description?: string;
  errors?: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;
}

// Connection info for database

export interface GustoConnectionInfo {
  id: string;
  organisationId: string;
  userId: string;
  companyUuid: string;
  companyName?: string;
  status: GustoConnectionStatus;
  accessToken: string; // Encrypted
  refreshToken: string; // Encrypted
  expiresAt: Date;
  scope: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
}

// Sync result types

export interface GustoEmployeeSyncResult {
  success: boolean;
  employeesCreated: number;
  employeesUpdated: number;
  employeesSkipped: number;
  errors: Array<{
    employeeUuid: string;
    error: string;
  }>;
}

export interface GustoCompanySyncResult {
  success: boolean;
  companyUuid: string;
  employeesSynced: number;
  errors: string[];
}

// Rate limiting

export interface GustoRateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

// Re-export payroll types for convenience
export * from './types/payroll.types';
