import { Bill as PrismaBill, BillStatus, BillSourceType, PaymentStatus } from '@prisma/client';

/**
 * Bill Entity
 *
 * Represents an invoice/bill received from a vendor (Accounts Payable)
 * This is the opposite of Invoice (which tracks money owed TO the business)
 */
export class Bill implements PrismaBill {
  id: string;
  organisationId: string;

  // Vendor info
  vendorId: string | null;
  vendorName: string;

  // Bill identification
  billNumber: string | null;
  reference: string | null;

  // Core details
  description: string | null;

  // Amounts
  amount: any; // Prisma Decimal
  currency: string;
  taxAmount: any; // Prisma Decimal
  totalAmount: any; // Prisma Decimal
  paidAmount: any; // Prisma Decimal

  // Status
  status: BillStatus;
  paymentStatus: PaymentStatus;

  // Dates
  issueDate: Date;
  dueDate: Date;
  paidDate: Date | null;

  // Source tracking
  sourceType: BillSourceType;
  sourceEmailId: string | null;
  sourceAttachmentId: string | null;
  extractedDataId: string | null;

  // Categorization & Tax
  categoryId: string | null;
  taxDeductible: boolean;
  deductionCategory: string | null;
  vatRate: any | null; // Prisma Decimal

  // Approval workflow
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  rejectionNotes: string | null;

  // Notes
  notes: string | null;
  internalNotes: string | null;

  // Attachments
  attachmentUrls: string[];

  // Metadata
  metadata: any; // JSON

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bill Line Item Entity
 *
 * Represents individual line items on a bill (for itemized bills)
 */
export class BillLineItem {
  id: string;
  billId: string;

  // Line item details
  description: string;
  quantity: any; // Prisma Decimal
  unitPrice: any; // Prisma Decimal
  amount: any; // Prisma Decimal

  // Tax
  taxRate: any | null; // Prisma Decimal
  taxAmount: any | null; // Prisma Decimal

  // Optional categorization
  category: string | null;
  productCode: string | null;

  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bill Payment Entity
 *
 * Represents a payment made toward a bill
 * Bills can be paid in multiple installments
 */
export class BillPayment {
  id: string;
  billId: string;

  // Payment details
  amount: any; // Prisma Decimal
  paymentDate: Date;
  paymentMethod: string | null;

  // Bank transaction linking
  transactionId: string | null;
  bankTransactionId: string | null;

  // Reference
  reference: string | null;
  notes: string | null;

  // Metadata
  metadata: any; // JSON

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Vendor Entity
 *
 * Represents a vendor/supplier from whom the business receives bills
 * NOTE: Vendor model is already defined in schema.prisma
 * This is just a TypeScript interface for reference
 */
export class Vendor {
  id: string;
  organisationId: string;

  // Basic info
  name: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;

  // Address
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;

  // Tax identification
  taxId: string | null;
  taxIdType: string; // TaxIdType enum

  // Payment terms
  paymentTerms: number; // days until payment due

  // Payment details
  preferredPaymentMethod: string | null;
  bankAccountName: string | null;
  bankIban: string | null;
  bankBic: string | null;

  // Default categorization
  defaultCategoryId: string | null;
  defaultTaxDeductible: boolean;

  // Status
  status: string; // VendorStatus enum

  // Notes
  notes: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
