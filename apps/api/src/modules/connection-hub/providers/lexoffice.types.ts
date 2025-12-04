/**
 * LexOffice API Types
 * TypeScript interfaces for LexOffice integration
 *
 * API Documentation: https://developers.lexoffice.io/docs/
 */

import {
  LexOfficeDocumentType,
  LexOfficeInvoiceStatus,
  LexOfficeVoucherStatus,
  LexOfficeContactType,
  PaymentTermsType,
  WebhookEventType,
} from './lexoffice.constants';

/**
 * LexOffice API Credentials
 */
export interface LexOfficeCredentials {
  apiKey: string;
}

/**
 * Common address structure
 */
export interface Address {
  street?: string;
  zip?: string;
  city?: string;
  countryCode?: string; // ISO 3166-1 alpha-2 (e.g., 'DE', 'AT', 'CH')
  supplement?: string;
}

/**
 * Contact Person
 */
export interface ContactPerson {
  salutation?: string;
  firstName?: string;
  lastName?: string;
  primary?: boolean;
  emailAddress?: string;
  phoneNumber?: string;
}

/**
 * Contact Roles (Customer/Vendor)
 */
export interface ContactRoles {
  customer?: {
    number?: number;
  };
  vendor?: {
    number?: number;
  };
}

/**
 * LexOffice Contact
 */
export interface LexOfficeContact {
  id?: string;
  organizationId?: string;
  version?: number;
  roles: ContactRoles;
  company?: {
    name: string;
    taxNumber?: string;
    vatRegistrationId?: string;
    allowTaxFreeInvoices?: boolean;
    contactPersons?: ContactPerson[];
  };
  person?: {
    salutation?: string;
    firstName?: string;
    lastName: string;
  };
  addresses?: {
    billing?: Address[];
    shipping?: Address[];
  };
  emailAddresses?: {
    business?: string[];
    office?: string[];
    private?: string[];
    other?: string[];
  };
  phoneNumbers?: {
    business?: string[];
    office?: string[];
    mobile?: string[];
    private?: string[];
    fax?: string[];
    other?: string[];
  };
  note?: string;
  archived?: boolean;
}

/**
 * Contact List Response (paginated)
 */
export interface ContactListResponse {
  content: Array<{
    id: string;
    organizationId: string;
    version: number;
    roles: ContactRoles;
    company?: {
      name: string;
    };
    person?: {
      firstName?: string;
      lastName: string;
    };
  }>;
  first?: boolean;
  last?: boolean;
  totalPages?: number;
  totalElements?: number;
  numberOfElements?: number;
  size?: number;
  number?: number;
  sort?: Array<{
    property: string;
    direction: 'ASC' | 'DESC';
    ignoreCase: boolean;
    nullHandling: string;
  }>;
}

/**
 * LexOffice Line Item (for invoices, vouchers)
 */
export interface LexOfficeLineItem {
  id?: string;
  type: 'custom' | 'text' | 'material' | 'service';
  name: string;
  description?: string;
  quantity: number;
  unitName?: string;
  unitPrice?: {
    currency: string;
    netAmount: number;
    grossAmount: number;
    taxRatePercentage: number;
  };
  discountPercentage?: number;
  lineItemAmount?: number;
}

/**
 * Total Price Structure
 */
export interface TotalPrice {
  currency: string;
  totalNetAmount: number;
  totalGrossAmount: number;
  totalTaxAmount: number;
  totalDiscountAbsolute?: number;
  totalDiscountPercentage?: number;
}

/**
 * Tax Amount by Rate
 */
export interface TaxAmount {
  taxRatePercentage: number;
  taxAmount: number;
  netAmount: number;
}

/**
 * Payment Terms
 */
export interface PaymentTerms {
  paymentTermLabel: string;
  paymentTermDuration?: number;
  paymentDiscountConditions?: {
    discountPercentage: number;
    discountRange: number;
  };
}

/**
 * Shipping Conditions
 */
export interface ShippingConditions {
  shippingDate?: string; // ISO 8601 date format
  shippingEndDate?: string;
  shippingType?: 'service' | 'serviceCollectiveGoods' | 'individualGoods';
}

/**
 * LexOffice Invoice
 */
export interface LexOfficeInvoice {
  id?: string;
  organizationId?: string;
  createdDate?: string;
  updatedDate?: string;
  version?: number;
  language?: string;
  archived?: boolean;
  voucherStatus?: LexOfficeInvoiceStatus;
  voucherNumber?: string;
  voucherDate: string; // YYYY-MM-DD
  dueDate?: string;
  address: Address;
  lineItems: LexOfficeLineItem[];
  totalPrice?: TotalPrice;
  taxAmounts?: TaxAmount[];
  taxConditions?: {
    taxType: string;
    taxTypeNote?: string;
  };
  paymentConditions?: {
    paymentTermLabel: string;
    paymentTermDuration?: number;
    paymentDiscountConditions?: {
      discountPercentage: number;
      discountRange: number;
    };
  };
  shippingConditions?: ShippingConditions;
  title?: string;
  introduction?: string;
  remark?: string;
  deliveryTerms?: string;
  files?: {
    documentFileId: string;
  };
  relatedVouchers?: Array<{
    id: string;
    voucherNumber: string;
    voucherType: LexOfficeDocumentType;
  }>;
}

/**
 * Create Invoice Request
 * Simplified payload for creating a finalized invoice
 */
export interface CreateInvoiceRequest {
  voucherDate: string;
  address: Address;
  lineItems: LexOfficeLineItem[];
  totalPrice: TotalPrice;
  taxConditions: {
    taxType: string;
  };
  paymentConditions?: {
    paymentTermLabel: string;
    paymentTermDuration?: number;
  };
  shippingConditions?: ShippingConditions;
  title?: string;
  introduction?: string;
  remark?: string;
  deliveryTerms?: string;
}

/**
 * Invoice List Response
 */
export interface InvoiceListResponse {
  content: Array<{
    id: string;
    organizationId: string;
    createdDate: string;
    updatedDate: string;
    version: number;
    voucherType: LexOfficeDocumentType;
    voucherStatus: LexOfficeInvoiceStatus;
    voucherNumber: string;
    voucherDate: string;
    dueDate?: string;
    contactName?: string;
    contactId?: string;
    totalAmount: number;
    openAmount?: number;
    currency: string;
  }>;
  first?: boolean;
  last?: boolean;
  totalPages?: number;
  totalElements?: number;
  numberOfElements?: number;
  size?: number;
  number?: number;
}

/**
 * LexOffice Voucher (Beleg)
 * Represents expenses, receipts, and other documents
 */
export interface LexOfficeVoucher {
  id?: string;
  organizationId?: string;
  createdDate?: string;
  updatedDate?: string;
  version?: number;
  voucherType: LexOfficeDocumentType;
  voucherStatus: LexOfficeVoucherStatus;
  voucherNumber?: string;
  voucherDate: string;
  dueDate?: string;
  totalGrossAmount: number;
  totalTaxAmount: number;
  taxType?: string;
  currency: string;
  contactId?: string;
  contactName?: string;
  useCollectiveContact?: boolean;
  remark?: string;
  voucherItems?: Array<{
    amount: number;
    taxAmount: number;
    taxRatePercent: number;
    categoryId: string;
  }>;
  files?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
}

/**
 * Create Voucher Request
 */
export interface CreateVoucherRequest {
  voucherDate: string;
  type: LexOfficeDocumentType;
  voucherStatus?: LexOfficeVoucherStatus;
  useCollectiveContact?: boolean;
  contactId?: string;
  totalGrossAmount: number;
  totalTaxAmount: number;
  currency: string;
  taxType?: string;
  remark?: string;
  voucherItems: Array<{
    amount: number;
    taxAmount: number;
    taxRatePercent: number;
    categoryId: string;
  }>;
  files?: Array<{
    content: string; // Base64 encoded
    filename: string;
    type: string;
  }>;
}

/**
 * Voucher List Response
 */
export interface VoucherListResponse {
  content: Array<{
    id: string;
    voucherType: LexOfficeDocumentType;
    voucherStatus: LexOfficeVoucherStatus;
    voucherNumber: string;
    voucherDate: string;
    contactName?: string;
    totalAmount: number;
    currency: string;
  }>;
  first?: boolean;
  last?: boolean;
  totalPages?: number;
  totalElements?: number;
  size?: number;
  number?: number;
}

/**
 * LexOffice Transaction (from Payments/Banking)
 */
export interface LexOfficeTransaction {
  id: string;
  entryDate: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  contactId?: string;
  contactName?: string;
  voucherId?: string;
  voucherNumber?: string;
  categoryId?: string;
  categoryName?: string;
  description?: string;
}

/**
 * Webhook Event
 */
export interface LexOfficeWebhookEvent {
  eventType: WebhookEventType;
  eventDate: string;
  resourceId: string;
  organizationId: string;
}

/**
 * Webhook Registration
 */
export interface WebhookRegistration {
  webhookId?: string;
  organizationId: string;
  callbackUrl: string;
  events: WebhookEventType[];
  active?: boolean;
}

/**
 * LexOffice Error Response
 */
export interface LexOfficeErrorResponse {
  timestamp?: string;
  status?: number;
  error?: string;
  message: string;
  path?: string;
  traceId?: string;
  details?: Array<{
    field?: string;
    message: string;
  }>;
}

/**
 * Rate Limiting Information
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

/**
 * Pagination Parameters
 */
export interface PaginationParams {
  page?: number;
  size?: number;
  direction?: 'ASC' | 'DESC';
  property?: string;
}

/**
 * Voucher List Filter Parameters
 */
export interface VoucherListFilters extends PaginationParams {
  voucherType?: LexOfficeDocumentType;
  voucherStatus?: LexOfficeInvoiceStatus | LexOfficeVoucherStatus;
  voucherDateFrom?: string;
  voucherDateTo?: string;
  contactId?: string;
}

/**
 * Contact Search Parameters
 */
export interface ContactSearchParams extends PaginationParams {
  email?: string;
  name?: string;
  customer?: boolean;
  vendor?: boolean;
}

/**
 * Invoice Search Parameters
 */
export interface InvoiceSearchParams extends PaginationParams {
  voucherStatus?: LexOfficeInvoiceStatus;
  voucherDateFrom?: string;
  voucherDateTo?: string;
  contactId?: string;
}

/**
 * LexOffice File Upload Response
 */
export interface FileUploadResponse {
  documentFileId: string;
}

/**
 * Download File Response
 */
export interface DownloadFileResponse {
  content: Buffer;
  filename: string;
  contentType: string;
}
