/**
 * Excel Template Configurations
 * Predefined templates for different Excel report types
 */

export interface ExcelTemplateConfig {
  name: string;
  description: string;
  sheets: Array<{
    name: string;
    type: 'data' | 'summary' | 'chart' | 'pivot';
    freezePanes?: { row: number; col: number };
    columns?: Array<{
      key: string;
      header: string;
      width?: number;
      format?: string;
    }>;
  }>;
  styles: {
    headerBackgroundColor: string;
    headerFontColor: string;
    alternatingRows: boolean;
    autoFitColumns: boolean;
    showGridlines: boolean;
  };
  features: {
    includeFormulas: boolean;
    includeCharts: boolean;
    includePivotTables: boolean;
    enableFilters: boolean;
    protectSheets: boolean;
  };
}

export const EXCEL_TEMPLATES: Record<string, ExcelTemplateConfig> = {
  financial_statement: {
    name: 'Financial Statement',
    description: 'Comprehensive financial statement with multiple sheets',
    sheets: [
      {
        name: 'Summary',
        type: 'summary',
        freezePanes: { row: 1, col: 0 },
      },
      {
        name: 'Income Statement',
        type: 'data',
        freezePanes: { row: 1, col: 0 },
        columns: [
          { key: 'account', header: 'Account', width: 30 },
          { key: 'amount', header: 'Amount', width: 15, format: '€#,##0.00' },
          { key: 'percentage', header: '% of Total', width: 12, format: '0.00%' },
        ],
      },
      {
        name: 'Balance Sheet',
        type: 'data',
        freezePanes: { row: 1, col: 0 },
        columns: [
          { key: 'account', header: 'Account', width: 30 },
          { key: 'amount', header: 'Amount', width: 15, format: '€#,##0.00' },
        ],
      },
      {
        name: 'Cash Flow',
        type: 'data',
        freezePanes: { row: 1, col: 0 },
        columns: [
          { key: 'activity', header: 'Activity', width: 30 },
          { key: 'amount', header: 'Amount', width: 15, format: '€#,##0.00' },
        ],
      },
    ],
    styles: {
      headerBackgroundColor: 'FF2563eb',
      headerFontColor: 'FFFFFFFF',
      alternatingRows: true,
      autoFitColumns: true,
      showGridlines: true,
    },
    features: {
      includeFormulas: true,
      includeCharts: true,
      includePivotTables: false,
      enableFilters: true,
      protectSheets: false,
    },
  },

  multi_sheet_workbook: {
    name: 'Multi-Sheet Workbook',
    description: 'Flexible workbook with multiple data sheets',
    sheets: [
      {
        name: 'Overview',
        type: 'summary',
        freezePanes: { row: 1, col: 0 },
      },
    ],
    styles: {
      headerBackgroundColor: 'FF059669',
      headerFontColor: 'FFFFFFFF',
      alternatingRows: true,
      autoFitColumns: true,
      showGridlines: true,
    },
    features: {
      includeFormulas: true,
      includeCharts: true,
      includePivotTables: true,
      enableFilters: true,
      protectSheets: false,
    },
  },

  tax_report: {
    name: 'Tax Report',
    description: 'Detailed tax report with calculations',
    sheets: [
      {
        name: 'Tax Summary',
        type: 'summary',
        freezePanes: { row: 1, col: 0 },
      },
      {
        name: 'Income Details',
        type: 'data',
        freezePanes: { row: 1, col: 0 },
        columns: [
          { key: 'date', header: 'Date', width: 12 },
          { key: 'description', header: 'Description', width: 40 },
          { key: 'amount', header: 'Amount', width: 15, format: '€#,##0.00' },
          { key: 'taxable', header: 'Taxable', width: 15, format: '€#,##0.00' },
        ],
      },
      {
        name: 'Deductions',
        type: 'data',
        freezePanes: { row: 1, col: 0 },
        columns: [
          { key: 'category', header: 'Category', width: 30 },
          { key: 'amount', header: 'Amount', width: 15, format: '€#,##0.00' },
          { key: 'percentage', header: '% Deductible', width: 12, format: '0%' },
        ],
      },
    ],
    styles: {
      headerBackgroundColor: 'FFdc2626',
      headerFontColor: 'FFFFFFFF',
      alternatingRows: true,
      autoFitColumns: true,
      showGridlines: true,
    },
    features: {
      includeFormulas: true,
      includeCharts: true,
      includePivotTables: false,
      enableFilters: true,
      protectSheets: true,
    },
  },

  payroll_report: {
    name: 'Payroll Report',
    description: 'Employee payroll with taxes and deductions',
    sheets: [
      {
        name: 'Payroll Summary',
        type: 'summary',
        freezePanes: { row: 1, col: 0 },
      },
      {
        name: 'Employee Details',
        type: 'data',
        freezePanes: { row: 1, col: 0 },
        columns: [
          { key: 'employeeId', header: 'Employee ID', width: 15 },
          { key: 'name', header: 'Name', width: 25 },
          { key: 'grossPay', header: 'Gross Pay', width: 15, format: '€#,##0.00' },
          { key: 'taxWithheld', header: 'Tax Withheld', width: 15, format: '€#,##0.00' },
          { key: 'socialSecurity', header: 'Social Security', width: 15, format: '€#,##0.00' },
          { key: 'netPay', header: 'Net Pay', width: 15, format: '€#,##0.00' },
        ],
      },
      {
        name: 'Tax Summary',
        type: 'data',
        freezePanes: { row: 1, col: 0 },
      },
    ],
    styles: {
      headerBackgroundColor: 'FF059669',
      headerFontColor: 'FFFFFFFF',
      alternatingRows: true,
      autoFitColumns: true,
      showGridlines: true,
    },
    features: {
      includeFormulas: true,
      includeCharts: true,
      includePivotTables: false,
      enableFilters: true,
      protectSheets: true,
    },
  },

  invoice_register: {
    name: 'Invoice Register',
    description: 'Comprehensive invoice tracking spreadsheet',
    sheets: [
      {
        name: 'Invoice List',
        type: 'data',
        freezePanes: { row: 1, col: 0 },
        columns: [
          { key: 'invoiceNumber', header: 'Invoice #', width: 15 },
          { key: 'date', header: 'Date', width: 12 },
          { key: 'customer', header: 'Customer', width: 30 },
          { key: 'amount', header: 'Amount', width: 15, format: '€#,##0.00' },
          { key: 'tax', header: 'Tax', width: 15, format: '€#,##0.00' },
          { key: 'total', header: 'Total', width: 15, format: '€#,##0.00' },
          { key: 'status', header: 'Status', width: 12 },
          { key: 'dueDate', header: 'Due Date', width: 12 },
        ],
      },
      {
        name: 'Aging Report',
        type: 'data',
        freezePanes: { row: 1, col: 0 },
      },
      {
        name: 'Charts',
        type: 'chart',
      },
    ],
    styles: {
      headerBackgroundColor: 'FF0891b2',
      headerFontColor: 'FFFFFFFF',
      alternatingRows: true,
      autoFitColumns: true,
      showGridlines: true,
    },
    features: {
      includeFormulas: true,
      includeCharts: true,
      includePivotTables: true,
      enableFilters: true,
      protectSheets: false,
    },
  },

  expense_tracker: {
    name: 'Expense Tracker',
    description: 'Detailed expense tracking with categories',
    sheets: [
      {
        name: 'Expenses',
        type: 'data',
        freezePanes: { row: 1, col: 0 },
        columns: [
          { key: 'date', header: 'Date', width: 12 },
          { key: 'category', header: 'Category', width: 20 },
          { key: 'vendor', header: 'Vendor', width: 30 },
          { key: 'description', header: 'Description', width: 40 },
          { key: 'amount', header: 'Amount', width: 15, format: '€#,##0.00' },
          { key: 'paymentMethod', header: 'Payment Method', width: 15 },
          { key: 'receiptNumber', header: 'Receipt #', width: 15 },
        ],
      },
      {
        name: 'By Category',
        type: 'pivot',
        freezePanes: { row: 1, col: 0 },
      },
      {
        name: 'Monthly Summary',
        type: 'summary',
        freezePanes: { row: 1, col: 0 },
      },
    ],
    styles: {
      headerBackgroundColor: 'FFea580c',
      headerFontColor: 'FFFFFFFF',
      alternatingRows: true,
      autoFitColumns: true,
      showGridlines: true,
    },
    features: {
      includeFormulas: true,
      includeCharts: true,
      includePivotTables: true,
      enableFilters: true,
      protectSheets: false,
    },
  },

  cash_flow: {
    name: 'Cash Flow',
    description: 'Cash flow analysis with projections',
    sheets: [
      {
        name: 'Cash Flow',
        type: 'data',
        freezePanes: { row: 1, col: 0 },
        columns: [
          { key: 'month', header: 'Month', width: 15 },
          { key: 'beginningCash', header: 'Beginning Cash', width: 18, format: '€#,##0.00' },
          { key: 'cashIn', header: 'Cash In', width: 18, format: '€#,##0.00' },
          { key: 'cashOut', header: 'Cash Out', width: 18, format: '€#,##0.00' },
          { key: 'netCashFlow', header: 'Net Cash Flow', width: 18, format: '€#,##0.00' },
          { key: 'endingCash', header: 'Ending Cash', width: 18, format: '€#,##0.00' },
        ],
      },
      {
        name: 'Projections',
        type: 'data',
        freezePanes: { row: 1, col: 0 },
      },
      {
        name: 'Charts',
        type: 'chart',
      },
    ],
    styles: {
      headerBackgroundColor: 'FF059669',
      headerFontColor: 'FFFFFFFF',
      alternatingRows: true,
      autoFitColumns: true,
      showGridlines: true,
    },
    features: {
      includeFormulas: true,
      includeCharts: true,
      includePivotTables: false,
      enableFilters: true,
      protectSheets: false,
    },
  },

  custom: {
    name: 'Custom Template',
    description: 'Customizable Excel template',
    sheets: [
      {
        name: 'Data',
        type: 'data',
        freezePanes: { row: 1, col: 0 },
      },
    ],
    styles: {
      headerBackgroundColor: 'FF3b82f6',
      headerFontColor: 'FFFFFFFF',
      alternatingRows: true,
      autoFitColumns: true,
      showGridlines: true,
    },
    features: {
      includeFormulas: true,
      includeCharts: false,
      includePivotTables: false,
      enableFilters: true,
      protectSheets: false,
    },
  },
};

/**
 * Get Excel template configuration
 */
export function getExcelTemplate(templateName: string): ExcelTemplateConfig {
  return EXCEL_TEMPLATES[templateName] || EXCEL_TEMPLATES.custom;
}

/**
 * Get all available Excel templates
 */
export function getAllExcelTemplates(): Array<{ key: string; config: ExcelTemplateConfig }> {
  return Object.entries(EXCEL_TEMPLATES).map(([key, config]) => ({ key, config }));
}

/**
 * Validate Excel template name
 */
export function isValidExcelTemplate(templateName: string): boolean {
  return templateName in EXCEL_TEMPLATES;
}
