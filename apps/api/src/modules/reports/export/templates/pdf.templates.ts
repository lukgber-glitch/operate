/**
 * PDF Template Configurations
 * Predefined templates for different report types
 */

export interface PdfTemplateConfig {
  name: string;
  description: string;
  pageSize: 'A4' | 'LETTER' | 'LEGAL' | 'A3';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  fonts: {
    heading: string;
    body: string;
    monospace: string;
  };
  sections: string[];
}

export const PDF_TEMPLATES: Record<string, PdfTemplateConfig> = {
  pl_statement: {
    name: 'Profit & Loss Statement',
    description: 'Professional P&L statement with revenue, expenses, and profit breakdown',
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    colors: {
      primary: '#2563eb',
      secondary: '#1e40af',
      accent: '#60a5fa',
      text: '#1f2937',
      background: '#ffffff',
    },
    fonts: {
      heading: 'Helvetica-Bold',
      body: 'Helvetica',
      monospace: 'Courier',
    },
    sections: ['header', 'executive_summary', 'revenue', 'expenses', 'profit', 'footer'],
  },

  cash_flow: {
    name: 'Cash Flow Statement',
    description: 'Detailed cash flow analysis with operating, investing, and financing activities',
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    colors: {
      primary: '#059669',
      secondary: '#047857',
      accent: '#34d399',
      text: '#1f2937',
      background: '#ffffff',
    },
    fonts: {
      heading: 'Helvetica-Bold',
      body: 'Helvetica',
      monospace: 'Courier',
    },
    sections: ['header', 'summary', 'operating', 'investing', 'financing', 'net_change', 'footer'],
  },

  tax_summary: {
    name: 'Tax Summary Report',
    description: 'Comprehensive tax summary with deductions and liabilities',
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    colors: {
      primary: '#dc2626',
      secondary: '#b91c1c',
      accent: '#f87171',
      text: '#1f2937',
      background: '#ffffff',
    },
    fonts: {
      heading: 'Helvetica-Bold',
      body: 'Helvetica',
      monospace: 'Courier',
    },
    sections: ['header', 'summary', 'income', 'deductions', 'credits', 'liability', 'footer'],
  },

  balance_sheet: {
    name: 'Balance Sheet',
    description: 'Statement of financial position showing assets, liabilities, and equity',
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    colors: {
      primary: '#7c3aed',
      secondary: '#6d28d9',
      accent: '#a78bfa',
      text: '#1f2937',
      background: '#ffffff',
    },
    fonts: {
      heading: 'Helvetica-Bold',
      body: 'Helvetica',
      monospace: 'Courier',
    },
    sections: ['header', 'assets', 'liabilities', 'equity', 'totals', 'footer'],
  },

  invoice_report: {
    name: 'Invoice Report',
    description: 'Detailed invoice listing with totals and aging analysis',
    pageSize: 'A4',
    orientation: 'landscape',
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    colors: {
      primary: '#0891b2',
      secondary: '#0e7490',
      accent: '#22d3ee',
      text: '#1f2937',
      background: '#ffffff',
    },
    fonts: {
      heading: 'Helvetica-Bold',
      body: 'Helvetica',
      monospace: 'Courier',
    },
    sections: ['header', 'summary', 'invoice_list', 'aging', 'totals', 'footer'],
  },

  expense_report: {
    name: 'Expense Report',
    description: 'Categorized expense breakdown with totals',
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    colors: {
      primary: '#ea580c',
      secondary: '#c2410c',
      accent: '#fb923c',
      text: '#1f2937',
      background: '#ffffff',
    },
    fonts: {
      heading: 'Helvetica-Bold',
      body: 'Helvetica',
      monospace: 'Courier',
    },
    sections: ['header', 'summary', 'by_category', 'by_vendor', 'totals', 'footer'],
  },

  executive_dashboard: {
    name: 'Executive Dashboard',
    description: 'High-level overview with key metrics and trends',
    pageSize: 'A4',
    orientation: 'landscape',
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    colors: {
      primary: '#8b5cf6',
      secondary: '#7c3aed',
      accent: '#c4b5fd',
      text: '#1f2937',
      background: '#ffffff',
    },
    fonts: {
      heading: 'Helvetica-Bold',
      body: 'Helvetica',
      monospace: 'Courier',
    },
    sections: ['header', 'kpis', 'charts', 'trends', 'insights', 'footer'],
  },

  payroll_summary: {
    name: 'Payroll Summary',
    description: 'Employee payroll breakdown with taxes and deductions',
    pageSize: 'A4',
    orientation: 'landscape',
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    colors: {
      primary: '#059669',
      secondary: '#047857',
      accent: '#6ee7b7',
      text: '#1f2937',
      background: '#ffffff',
    },
    fonts: {
      heading: 'Helvetica-Bold',
      body: 'Helvetica',
      monospace: 'Courier',
    },
    sections: ['header', 'summary', 'employee_list', 'tax_summary', 'totals', 'footer'],
  },

  custom: {
    name: 'Custom Report',
    description: 'Customizable report template',
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    colors: {
      primary: '#3b82f6',
      secondary: '#2563eb',
      accent: '#93c5fd',
      text: '#1f2937',
      background: '#ffffff',
    },
    fonts: {
      heading: 'Helvetica-Bold',
      body: 'Helvetica',
      monospace: 'Courier',
    },
    sections: ['header', 'content', 'footer'],
  },
};

/**
 * Get PDF template configuration
 */
export function getPdfTemplate(templateName: string): PdfTemplateConfig {
  return PDF_TEMPLATES[templateName] || PDF_TEMPLATES.custom;
}

/**
 * Get all available PDF templates
 */
export function getAllPdfTemplates(): Array<{ key: string; config: PdfTemplateConfig }> {
  return Object.entries(PDF_TEMPLATES).map(([key, config]) => ({ key, config }));
}

/**
 * Validate PDF template name
 */
export function isValidPdfTemplate(templateName: string): boolean {
  return templateName in PDF_TEMPLATES;
}
