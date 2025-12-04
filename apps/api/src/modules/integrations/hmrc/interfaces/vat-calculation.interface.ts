/**
 * VAT Calculation Interfaces
 * Types for UK VAT calculation and HMRC VAT return preparation
 */

export enum VatRateType {
  STANDARD = 'STANDARD', // 20%
  REDUCED = 'REDUCED',   // 5%
  ZERO = 'ZERO',         // 0%
}

export interface VatCalculationInput {
  orgId: string;
  vrn: string;
  periodFrom: Date;
  periodTo: Date;
  useFlatRateScheme?: boolean;
  flatRate?: number; // If using flat rate scheme
}

export interface VatCalculationBreakdown {
  totalVat: number;
  totalNetAmount: number;
  count: number;
  details: any[];
}

export interface VatCalculationResult {
  periodFrom: Date;
  periodTo: Date;

  // VAT Return boxes (all in pence)
  box1VatDueSales: number;
  box2VatDueAcquisitions: number;
  box3TotalVatDue: number;
  box4VatReclaimed: number;
  box5NetVatDue: number;
  box6TotalValueSalesExVat: number;
  box7TotalValuePurchasesExVat: number;
  box8TotalValueGoodsSupplied: number;
  box9TotalAcquisitionsExVat: number;

  // Breakdown for audit
  breakdown: {
    salesVat: VatCalculationBreakdown;
    ecAcquisitionsVat: VatCalculationBreakdown;
    inputVat: VatCalculationBreakdown;
    ecSupplies: VatCalculationBreakdown;
    ecAcquisitions: VatCalculationBreakdown;
  };

  metadata: {
    invoiceCount: number;
    expenseCount: number;
    calculatedAt: Date;
  };
}

export interface VatReturnValidation {
  valid: boolean;
  errors: string[];
}
