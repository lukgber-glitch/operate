import { PaymentSourceType } from '../truelayer-pis.types';

/**
 * Create Payment DTO
 * Request body for initiating a new payment via TrueLayer PIS
 */
export class CreatePaymentDto {
  amount: number;
  currency?: string;
  beneficiaryName: string;
  beneficiaryIban?: string;
  beneficiarySortCode?: string;
  beneficiaryAccountNumber?: string;
  reference?: string;
  description?: string;
  redirectUri?: string;
  sourceType?: PaymentSourceType;
  billId?: string;
  expenseId?: string;
  invoiceId?: string;
}
