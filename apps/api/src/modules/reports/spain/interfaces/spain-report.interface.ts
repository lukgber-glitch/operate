/**
 * Spain Report Interfaces
 * Data structures for Spanish tax reports (Modelo 303, 390, 111, 347)
 * Task: W25-T4
 */

/**
 * Report types
 */
export enum SpainReportType {
  MODELO_303 = 'MODELO_303', // Quarterly VAT
  MODELO_390 = 'MODELO_390', // Annual VAT summary
  MODELO_111 = 'MODELO_111', // Withholding tax
  MODELO_347 = 'MODELO_347', // Third-party operations
}

/**
 * Report status
 */
export enum SpainReportStatus {
  DRAFT = 'DRAFT',
  CALCULATED = 'CALCULATED',
  VALIDATED = 'VALIDATED',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  ERROR = 'ERROR',
}

/**
 * Reporting period
 */
export interface SpainReportPeriod {
  year: number;
  quarter?: 1 | 2 | 3 | 4; // For quarterly reports
  month?: number; // For monthly reports
  isAnnual?: boolean;
}

/**
 * Taxpayer information
 */
export interface SpainTaxpayer {
  nif: string; // Tax ID
  name: string;
  fiscalYear: number;
  taxRegime?: string;
}

/**
 * Base report interface
 */
export interface SpainReportBase {
  id: string;
  orgId: string;
  type: SpainReportType;
  period: SpainReportPeriod;
  taxpayer: SpainTaxpayer;
  status: SpainReportStatus;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  acceptedAt?: Date;
  csvReference?: string; // AEAT submission reference
  errors?: string[];
}

/**
 * Modelo 303 - Quarterly VAT Declaration
 */
export interface Modelo303Report extends SpainReportBase {
  type: SpainReportType.MODELO_303;

  // IVA Collected (Devengado)
  ivaCollected: {
    // Base rates
    base21: number; // Box 01: Base imponible 21%
    quota21: number; // Box 02: Cuota 21%
    base10: number; // Box 03: Base imponible 10%
    quota10: number; // Box 04: Cuota 10%
    base4: number; // Box 05: Base imponible 4% (super-reduced)
    quota4: number; // Box 06: Cuota 4%

    // Special acquisitions
    intraEUAcquisitionsBase?: number; // Box 10
    intraEUAcquisitionsQuota?: number; // Box 11

    // Total collected
    totalQuota: number; // Box 27: Total cuota devengada
  };

  // IVA Deductible (Deducible)
  ivaDeductible: {
    // Current operations
    currentOperationsBase: number; // Box 12: Base deducible operaciones corrientes
    currentOperationsQuota: number; // Box 13: Cuota deducible operaciones corrientes

    // Investment goods
    investmentGoodsBase?: number; // Box 14: Base deducible bienes inversión
    investmentGoodsQuota?: number; // Box 15: Cuota deducible bienes inversión

    // Imports
    importsQuota?: number; // Box 16: Cuota deducible importaciones

    // Intra-EU acquisitions
    intraEUQuota?: number; // Box 17: Cuota deducible adquisiciones intracomunitarias

    // Compensation RE
    compensationRE?: number; // Box 18: Compensaciones régimen simplificado

    // Total deductible
    totalQuota: number; // Box 28: Total cuota deducible
  };

  // Result
  result: {
    grossResult: number; // Box 29: Resultado bruto (27 - 28)

    // Adjustments
    previousQuarterProportion?: number; // Box 30: Prorrata
    proportionRegularization?: number; // Box 31: Regularización prorrata

    // Previous returns
    previousReturnsToDeduct?: number; // Box 32: Devoluciones anteriores

    // Final result
    netResult: number; // Box 46: Resultado neto (to pay if positive, to return if negative)
    toPay?: number; // Box 47: A ingresar
    toReturn?: number; // Box 48: A devolver
  };

  // Special regimes and additional info
  specialInfo?: {
    isMonthlyFiler?: boolean; // Box 49: Declarante mensual
    isInsolvent?: boolean; // Box 50: En concurso
    hasReverseChargeOperations?: boolean; // Box 51: Operaciones inversión sujeto pasivo
    hasCashAccountingRegime?: boolean; // Box 52: RECC
    simplifiedRegimeActivities?: string; // Box 53: Actividades régimen simplificado
  };

  // Metadata
  calculatedFrom?: {
    invoiceCount: number;
    expenseCount: number;
    dateRange: {
      from: Date;
      to: Date;
    };
  };
}

/**
 * Modelo 390 - Annual VAT Summary
 */
export interface Modelo390Report extends SpainReportBase {
  type: SpainReportType.MODELO_390;

  // Annual summary of all quarters
  quarters: {
    Q1: Modelo303Report;
    Q2: Modelo303Report;
    Q3: Modelo303Report;
    Q4: Modelo303Report;
  };

  // Annual totals
  annualTotals: {
    totalCollected: number;
    totalDeductible: number;
    annualResult: number;
    totalPaid: number;
    totalReturned: number;
  };

  // Additional annual information
  additionalInfo?: {
    volumeOfOperations: number; // Total business volume
    exportAmount?: number;
    intraEUDeliveriesAmount?: number;
    investmentGoodsAmount?: number;
  };
}

/**
 * Modelo 111 - Withholding Tax (IRPF)
 */
export interface Modelo111Report extends SpainReportBase {
  type: SpainReportType.MODELO_111;

  // Professional services withholding
  professionalServices: {
    recipientCount: number; // Number of recipients
    totalBase: number; // Total amount paid
    totalWithholding: number; // Total withheld (usually 15%)
  };

  // Employee withholding (if applicable)
  employees?: {
    employeeCount: number;
    totalBase: number;
    totalWithholding: number;
  };

  // Result
  result: {
    totalWithholding: number;
    previousReturns?: number;
    toPay: number;
  };
}

/**
 * Modelo 347 - Third-party Operations
 */
export interface Modelo347Report extends SpainReportBase {
  type: SpainReportType.MODELO_347;

  // Third parties with operations > €3,005.06
  thirdParties: ThirdPartyOperation[];

  // Summary
  summary: {
    totalRecipients: number;
    totalPurchases: number;
    totalSales: number;
    totalAmount: number;
  };
}

/**
 * Third party operation (for Modelo 347)
 */
export interface ThirdPartyOperation {
  nif: string;
  name: string;
  operationType: 'SALES' | 'PURCHASES' | 'BOTH';

  // Quarterly breakdown
  quarters: {
    Q1: { sales: number; purchases: number };
    Q2: { sales: number; purchases: number };
    Q3: { sales: number; purchases: number };
    Q4: { sales: number; purchases: number };
  };

  // Annual totals
  annualSales: number;
  annualPurchases: number;
  annualTotal: number;

  // Additional info
  hasCashOperations?: boolean;
  cashAmount?: number;
  hasRealEstateOperations?: boolean;
  realEstateAmount?: number;
}

/**
 * Report generation request
 */
export interface GenerateReportRequest {
  orgId: string;
  type: SpainReportType;
  period: SpainReportPeriod;
  taxpayer: SpainTaxpayer;

  // Options
  options?: {
    includePreview?: boolean; // Generate PDF preview
    autoValidate?: boolean; // Auto-validate calculations
    exportFormat?: 'XML' | 'PDF' | 'BOTH';
  };
}

/**
 * Report generation response
 */
export interface GenerateReportResponse {
  success: boolean;
  report: SpainReportBase;
  preview?: {
    pdfUrl?: string;
    pdfBase64?: string;
  };
  export?: {
    xmlUrl?: string;
    xmlContent?: string;
  };
  errors?: string[];
  warnings?: string[];
}

/**
 * Report validation result
 */
export interface ReportValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  field: string;
  message: string;
  severity: 'ERROR';
}

export interface ValidationWarning {
  code: string;
  field: string;
  message: string;
  severity: 'WARNING';
}

/**
 * Report calculation source data
 */
export interface ReportCalculationData {
  period: SpainReportPeriod;

  // Source invoices (sales)
  issuedInvoices: {
    id: string;
    number: string;
    date: Date;
    customerId: string;
    customerName: string;
    customerNif?: string;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    type: string;
    isIntraEU?: boolean;
    isExport?: boolean;
  }[];

  // Source expenses (purchases)
  receivedInvoices: {
    id: string;
    number: string;
    date: Date;
    supplierId: string;
    supplierName: string;
    supplierNif?: string;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    type: string;
    isDeductible: boolean;
    deductionPercentage?: number;
    isIntraEU?: boolean;
    isImport?: boolean;
  }[];

  // Previous quarter data (for adjustments)
  previousQuarter?: {
    toPay?: number;
    toReturn?: number;
  };
}
