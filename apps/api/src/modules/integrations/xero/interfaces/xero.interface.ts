/**
 * Xero API Interfaces
 * These interfaces match the Xero API response structures
 */

/**
 * Xero Connection (tenant) response
 */
export interface IXeroConnection {
  id: string;
  tenantId: string;
  tenantType: string;
  tenantName: string;
  createdDateUtc: string;
  updatedDateUtc: string;
}

/**
 * Xero Organization response
 */
export interface IXeroOrganisation {
  OrganisationID: string;
  Name: string;
  LegalName?: string;
  PaysTax?: boolean;
  Version?: string;
  OrganisationType?: string;
  BaseCurrency?: string;
  CountryCode?: string;
  IsDemoCompany?: boolean;
  OrganisationStatus?: string;
  FinancialYearEndDay?: number;
  FinancialYearEndMonth?: number;
  SalesTaxBasis?: string;
  SalesTaxPeriod?: string;
  DefaultSalesTax?: string;
  DefaultPurchasesTax?: string;
  PeriodLockDate?: string;
  EndOfYearLockDate?: string;
  CreatedDateUTC?: string;
  Timezone?: string;
  OrganisationEntityType?: string;
  ShortCode?: string;
  LineOfBusiness?: string;
  Addresses?: Array<{
    AddressType: string;
    City?: string;
    Region?: string;
    PostalCode?: string;
    Country?: string;
  }>;
  Phones?: Array<{
    PhoneType: string;
    PhoneNumber?: string;
    PhoneAreaCode?: string;
    PhoneCountryCode?: string;
  }>;
  ExternalLinks?: Array<{
    LinkType: string;
    Url?: string;
  }>;
}

/**
 * Xero Contact response
 */
export interface IXeroContact {
  ContactID: string;
  ContactStatus?: string;
  Name: string;
  FirstName?: string;
  LastName?: string;
  EmailAddress?: string;
  BankAccountDetails?: string;
  Addresses?: Array<{
    AddressType: string;
    AddressLine1?: string;
    AddressLine2?: string;
    AddressLine3?: string;
    AddressLine4?: string;
    City?: string;
    Region?: string;
    PostalCode?: string;
    Country?: string;
  }>;
  Phones?: Array<{
    PhoneType: string;
    PhoneNumber?: string;
    PhoneAreaCode?: string;
    PhoneCountryCode?: string;
  }>;
  UpdatedDateUTC?: string;
  IsSupplier?: boolean;
  IsCustomer?: boolean;
}

/**
 * Xero Invoice response
 */
export interface IXeroInvoice {
  InvoiceID: string;
  InvoiceNumber: string;
  Type: 'ACCREC' | 'ACCPAY';
  Contact: {
    ContactID: string;
    Name?: string;
  };
  DateString?: string;
  DueDateString?: string;
  Status?: string;
  LineAmountTypes?: string;
  LineItems?: Array<{
    LineItemID?: string;
    Description: string;
    Quantity?: number;
    UnitAmount?: number;
    AccountCode?: string;
    TaxType?: string;
    TaxAmount?: number;
    LineAmount?: number;
  }>;
  SubTotal?: number;
  TotalTax?: number;
  Total?: number;
  UpdatedDateUTC?: string;
  CurrencyCode?: string;
  FullyPaidOnDate?: string;
  AmountDue?: number;
  AmountPaid?: number;
  AmountCredited?: number;
  Reference?: string;
}

/**
 * Xero Payment response
 */
export interface IXeroPayment {
  PaymentID: string;
  Date: string;
  Amount: number;
  Reference?: string;
  CurrencyRate?: number;
  PaymentType?: string;
  Status?: string;
  UpdatedDateUTC?: string;
  Invoice?: {
    InvoiceID: string;
    InvoiceNumber?: string;
  };
  Account?: {
    AccountID: string;
    Code?: string;
  };
}

/**
 * Xero API Response wrapper
 */
export interface IXeroApiResponse<T> {
  Id?: string;
  Status?: string;
  ProviderName?: string;
  DateTimeUTC?: string;
  Data?: T;
}
