export interface DeadlineTemplate {
  name: string;
  type: 'VAT_RETURN' | 'INCOME_TAX' | 'CORPORATE_TAX' | 'PAYROLL_TAX' | 'ESTIMATED_PAYMENT' | 'ANNUAL_FILING';
  month?: number; // 1-12
  day: number; // 1-31
  recurring?: 'monthly' | 'quarterly' | 'annual';
  quarter?: 1 | 2 | 3 | 4; // For quarterly deadlines
  description?: string;
}

export const TAX_DEADLINES: Record<string, DeadlineTemplate[]> = {
  US: [
    {
      name: 'Q1 Estimated Tax',
      type: 'ESTIMATED_PAYMENT',
      month: 4,
      day: 15,
      quarter: 1,
      description: 'First quarter estimated tax payment due',
    },
    {
      name: 'Q2 Estimated Tax',
      type: 'ESTIMATED_PAYMENT',
      month: 6,
      day: 15,
      quarter: 2,
      description: 'Second quarter estimated tax payment due',
    },
    {
      name: 'Q3 Estimated Tax',
      type: 'ESTIMATED_PAYMENT',
      month: 9,
      day: 15,
      quarter: 3,
      description: 'Third quarter estimated tax payment due',
    },
    {
      name: 'Q4 Estimated Tax',
      type: 'ESTIMATED_PAYMENT',
      month: 1,
      day: 15,
      quarter: 4,
      description: 'Fourth quarter estimated tax payment due (next year)',
    },
    {
      name: 'Annual Tax Return',
      type: 'ANNUAL_FILING',
      month: 4,
      day: 15,
      description: 'Annual income tax return filing deadline',
    },
  ],
  DE: [
    {
      name: 'Monthly UStVA (VAT Return)',
      type: 'VAT_RETURN',
      day: 10,
      recurring: 'monthly',
      description: 'Monthly VAT advance return (Umsatzsteuervoranmeldung)',
    },
    {
      name: 'Annual Tax Return',
      type: 'ANNUAL_FILING',
      month: 7,
      day: 31,
      description: 'Annual income/corporate tax return deadline',
    },
    {
      name: 'Corporate Tax Quarterly Advance',
      type: 'CORPORATE_TAX',
      day: 10,
      recurring: 'quarterly',
      description: 'Quarterly corporate tax advance payment',
    },
  ],
  UK: [
    {
      name: 'VAT Return (Monthly)',
      type: 'VAT_RETURN',
      day: 7,
      recurring: 'monthly',
      description: 'Monthly VAT return deadline (if registered for monthly)',
    },
    {
      name: 'VAT Return (Quarterly)',
      type: 'VAT_RETURN',
      day: 7,
      recurring: 'quarterly',
      description: 'Quarterly VAT return deadline',
    },
    {
      name: 'Self Assessment Tax Return',
      type: 'ANNUAL_FILING',
      month: 1,
      day: 31,
      description: 'Self Assessment tax return online filing deadline',
    },
    {
      name: 'Self Assessment Payment on Account',
      type: 'INCOME_TAX',
      month: 1,
      day: 31,
      description: 'Payment on account deadline',
    },
    {
      name: 'Self Assessment Second Payment',
      type: 'INCOME_TAX',
      month: 7,
      day: 31,
      description: 'Second payment on account deadline',
    },
  ],
  AT: [
    {
      name: 'Monthly UVA (VAT Return)',
      type: 'VAT_RETURN',
      day: 15,
      recurring: 'monthly',
      description: 'Monthly VAT advance return (Umsatzsteuervoranmeldung)',
    },
    {
      name: 'Quarterly UVA (VAT Return)',
      type: 'VAT_RETURN',
      day: 15,
      recurring: 'quarterly',
      description: 'Quarterly VAT advance return',
    },
    {
      name: 'Annual Tax Return',
      type: 'ANNUAL_FILING',
      month: 6,
      day: 30,
      description: 'Annual income/corporate tax return deadline',
    },
  ],
  FR: [
    {
      name: 'Monthly VAT Return',
      type: 'VAT_RETURN',
      day: 24,
      recurring: 'monthly',
      description: 'Monthly VAT return (CA3)',
    },
    {
      name: 'Annual Corporate Tax',
      type: 'CORPORATE_TAX',
      month: 5,
      day: 15,
      description: 'Annual corporate tax return deadline',
    },
  ],
  ES: [
    {
      name: 'Quarterly VAT Return',
      type: 'VAT_RETURN',
      day: 20,
      recurring: 'quarterly',
      description: 'Quarterly VAT return (Modelo 303)',
    },
    {
      name: 'Annual Corporate Tax',
      type: 'CORPORATE_TAX',
      month: 7,
      day: 25,
      description: 'Annual corporate tax return deadline',
    },
  ],
  IT: [
    {
      name: 'Monthly VAT Return',
      type: 'VAT_RETURN',
      day: 16,
      recurring: 'monthly',
      description: 'Monthly VAT return',
    },
    {
      name: 'Annual Tax Return',
      type: 'ANNUAL_FILING',
      month: 11,
      day: 30,
      description: 'Annual income/corporate tax return deadline',
    },
  ],
  NL: [
    {
      name: 'Monthly VAT Return',
      type: 'VAT_RETURN',
      day: 28,
      recurring: 'monthly',
      description: 'Monthly VAT return (BTW-aangifte)',
    },
    {
      name: 'Quarterly VAT Return',
      type: 'VAT_RETURN',
      day: 28,
      recurring: 'quarterly',
      description: 'Quarterly VAT return',
    },
    {
      name: 'Annual Corporate Tax',
      type: 'CORPORATE_TAX',
      month: 5,
      day: 31,
      description: 'Annual corporate tax return deadline',
    },
  ],
  SE: [
    {
      name: 'Monthly VAT Return',
      type: 'VAT_RETURN',
      day: 26,
      recurring: 'monthly',
      description: 'Monthly VAT return (Momsdeklaration)',
    },
    {
      name: 'Annual Tax Return',
      type: 'ANNUAL_FILING',
      month: 5,
      day: 2,
      description: 'Annual income tax return deadline',
    },
  ],
  DK: [
    {
      name: 'Quarterly VAT Return',
      type: 'VAT_RETURN',
      day: 1,
      recurring: 'quarterly',
      description: 'Quarterly VAT return',
    },
    {
      name: 'Annual Tax Return',
      type: 'ANNUAL_FILING',
      month: 7,
      day: 1,
      description: 'Annual tax return deadline',
    },
  ],
  NO: [
    {
      name: 'Bi-Monthly VAT Return',
      type: 'VAT_RETURN',
      day: 10,
      recurring: 'monthly',
      description: 'Bi-monthly VAT return (every 2 months)',
    },
    {
      name: 'Annual Tax Return',
      type: 'ANNUAL_FILING',
      month: 5,
      day: 31,
      description: 'Annual income tax return deadline',
    },
  ],
  FI: [
    {
      name: 'Monthly VAT Return',
      type: 'VAT_RETURN',
      day: 12,
      recurring: 'monthly',
      description: 'Monthly VAT return',
    },
    {
      name: 'Annual Tax Return',
      type: 'ANNUAL_FILING',
      month: 5,
      day: 4,
      description: 'Annual tax return deadline',
    },
  ],
  BE: [
    {
      name: 'Monthly VAT Return',
      type: 'VAT_RETURN',
      day: 20,
      recurring: 'monthly',
      description: 'Monthly VAT return',
    },
    {
      name: 'Annual Corporate Tax',
      type: 'CORPORATE_TAX',
      month: 9,
      day: 30,
      description: 'Annual corporate tax return deadline',
    },
  ],
  CH: [
    {
      name: 'Quarterly VAT Return',
      type: 'VAT_RETURN',
      day: 60,
      recurring: 'quarterly',
      description: 'Quarterly VAT return (60 days after quarter end)',
    },
    {
      name: 'Annual Corporate Tax',
      type: 'CORPORATE_TAX',
      month: 3,
      day: 31,
      description: 'Annual corporate tax return deadline',
    },
  ],
};
