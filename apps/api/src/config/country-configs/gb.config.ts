/**
 * United Kingdom Country Configuration
 *
 * This file contains UK-specific configurations for:
 * - Company types
 * - VAT schemes
 * - Filing requirements
 * - Penalties
 * - MTD (Making Tax Digital) requirements
 *
 * References:
 * - Companies House: https://www.gov.uk/government/organisations/companies-house
 * - HMRC VAT: https://www.gov.uk/vat-rates
 * - MTD VAT: https://www.gov.uk/government/publications/making-tax-digital
 */

export interface CompanyTypeConfig {
  code: string;
  name: string;
  description: string;
  filingRequirements: string[];
  taxObligations: string[];
  limitedLiability: boolean;
  minimumDirectors?: number;
  minimumShareholders?: number;
  minimumCapital?: number;
  registrationAuthority?: string;
}

export interface VatSchemeConfig {
  code: string;
  name: string;
  description: string;
  threshold?: number;
  eligibilityCriteria: string[];
  benefits: string[];
  limitations: string[];
  returnFrequency: string[];
}

export interface FilingRequirement {
  type: string;
  frequency: string;
  deadline: string;
  description: string;
  penalty?: string;
}

export interface UKConfig {
  countryCode: string;
  countryName: string;
  currency: string;
  fiscalYearStart: string;
  companyTypes: CompanyTypeConfig[];
  vatSchemes: VatSchemeConfig[];
  filingRequirements: FilingRequirement[];
  mtdRequirements: {
    vatEnabled: boolean;
    vatMandatoryThreshold: number;
    incomeTaxEnabled: boolean;
    corporationTaxEnabled: boolean;
  };
}

export const UK_COMPANY_TYPES: CompanyTypeConfig[] = [
  {
    code: 'SOLE_TRADER',
    name: 'Sole Trader',
    description: 'Self-employed individual trading under their own name or business name',
    filingRequirements: [
      'Self Assessment Tax Return (SA100)',
      'Class 2 and Class 4 National Insurance (if profits over £12,570)',
    ],
    taxObligations: [
      'Income Tax on profits',
      'National Insurance contributions',
      'VAT registration if turnover exceeds £90,000',
    ],
    limitedLiability: false,
    registrationAuthority: 'HMRC',
  },
  {
    code: 'PARTNERSHIP',
    name: 'General Partnership',
    description: 'Business owned by 2 or more people sharing profits and liabilities',
    filingRequirements: [
      'Partnership Tax Return (SA800)',
      'Individual Self Assessment for each partner',
    ],
    taxObligations: [
      'Partnership pays no tax directly',
      'Each partner pays Income Tax on their share of profits',
      'Class 2 and Class 4 National Insurance for each partner',
    ],
    limitedLiability: false,
    minimumDirectors: 2,
    registrationAuthority: 'HMRC',
  },
  {
    code: 'LLP',
    name: 'Limited Liability Partnership',
    description: 'Partnership with limited liability protection for members',
    filingRequirements: [
      'Annual accounts to Companies House',
      'Confirmation Statement',
      'Partnership Tax Return (SA800)',
    ],
    taxObligations: [
      'Members pay Income Tax on their profit share',
      'Class 2 and Class 4 National Insurance for members',
      'Corporation Tax only on non-trading income',
    ],
    limitedLiability: true,
    minimumDirectors: 2,
    registrationAuthority: 'Companies House',
  },
  {
    code: 'PRIVATE_LIMITED',
    name: 'Private Limited Company (Ltd)',
    description: 'Most common UK company structure with limited liability',
    filingRequirements: [
      'Annual accounts to Companies House',
      'Confirmation Statement',
      'Corporation Tax Return (CT600)',
      'PAYE returns if employing staff',
    ],
    taxObligations: [
      'Corporation Tax at 19-25% on profits',
      'Employer\'s National Insurance if employing staff',
      'VAT if turnover exceeds £90,000',
      'Directors pay Income Tax and National Insurance on salaries/dividends',
    ],
    limitedLiability: true,
    minimumDirectors: 1,
    minimumShareholders: 1,
    minimumCapital: 0, // No minimum share capital required
    registrationAuthority: 'Companies House',
  },
  {
    code: 'PUBLIC_LIMITED',
    name: 'Public Limited Company (PLC)',
    description: 'Company that can offer shares to the public',
    filingRequirements: [
      'Annual accounts to Companies House',
      'Confirmation Statement',
      'Corporation Tax Return (CT600)',
      'Additional FCA reporting if listed',
    ],
    taxObligations: [
      'Corporation Tax at 19-25% on profits',
      'Employer\'s National Insurance if employing staff',
      'VAT if turnover exceeds £90,000',
    ],
    limitedLiability: true,
    minimumDirectors: 2,
    minimumShareholders: 1,
    minimumCapital: 50000, // Minimum £50,000 share capital
    registrationAuthority: 'Companies House',
  },
];

export const UK_VAT_SCHEMES: VatSchemeConfig[] = [
  {
    code: 'STANDARD',
    name: 'Standard VAT Accounting',
    description: 'Default VAT scheme - charge VAT on sales, reclaim VAT on purchases',
    eligibilityCriteria: [
      'Any VAT-registered business',
      'No turnover restrictions',
    ],
    benefits: [
      'Can reclaim all eligible VAT on purchases',
      'Suitable for businesses with high VAT-able costs',
      'Full input tax recovery',
    ],
    limitations: [
      'Must keep detailed VAT records',
      'Quarterly or monthly returns required',
      'Cash flow impact (pay VAT before receiving payment)',
    ],
    returnFrequency: ['Monthly', 'Quarterly'],
  },
  {
    code: 'FLAT_RATE',
    name: 'Flat Rate Scheme',
    description: 'Pay a fixed percentage of VAT turnover to HMRC',
    threshold: 150000,
    eligibilityCriteria: [
      'Estimated VAT taxable turnover ≤ £150,000 (excluding VAT)',
      'Must join within first year or have been deregistered for 2+ years',
    ],
    benefits: [
      'Simpler accounting - one flat rate percentage',
      'Keep difference between VAT charged and flat rate',
      'Less paperwork',
      '1% discount in first year',
    ],
    limitations: [
      'Cannot reclaim VAT on purchases (except capital assets over £2,000)',
      'Must leave if turnover exceeds £230,000',
      'Different rates for different industries (6.5% - 14.5%)',
    ],
    returnFrequency: ['Quarterly'],
  },
  {
    code: 'CASH_ACCOUNTING',
    name: 'Cash Accounting Scheme',
    description: 'Account for VAT when payment is received/made, not when invoice is issued',
    threshold: 1350000,
    eligibilityCriteria: [
      'Estimated VAT taxable turnover ≤ £1.35 million',
      'Up to date with VAT returns and payments',
      'No VAT penalties in last 12 months',
    ],
    benefits: [
      'Improved cash flow - only pay VAT when you receive payment',
      'Automatic bad debt relief',
      'Better for businesses with slow-paying customers',
    ],
    limitations: [
      'Must leave if turnover exceeds £1.6 million',
      'Cannot reclaim VAT until you pay suppliers',
      'Must use standard or flat rate scheme alongside',
    ],
    returnFrequency: ['Monthly', 'Quarterly'],
  },
  {
    code: 'ANNUAL_ACCOUNTING',
    name: 'Annual Accounting Scheme',
    description: 'File one annual VAT return instead of quarterly returns',
    threshold: 1350000,
    eligibilityCriteria: [
      'Estimated VAT taxable turnover ≤ £1.35 million',
      'Up to date with VAT returns and payments',
    ],
    benefits: [
      'Only one VAT return per year',
      'Improved planning with regular interim payments',
      'Less admin burden',
    ],
    limitations: [
      'Must leave if turnover exceeds £1.6 million',
      'Make 9 interim payments on account',
      'May pay more VAT upfront than under standard scheme',
      'Less responsive to changes in business',
    ],
    returnFrequency: ['Annual'],
  },
];

export const UK_FILING_REQUIREMENTS: FilingRequirement[] = [
  {
    type: 'CORPORATION_TAX',
    frequency: 'Annual',
    deadline: '12 months after accounting period end (filing), 9 months + 1 day (payment)',
    description: 'CT600 Corporation Tax return',
    penalty: 'Late filing: £100 (up to 3 months late), £200 (3-6 months), daily penalties thereafter',
  },
  {
    type: 'VAT_RETURN',
    frequency: 'Quarterly (or Monthly/Annual depending on scheme)',
    deadline: '1 calendar month and 7 days after end of VAT period',
    description: 'VAT Return (online via MTD)',
    penalty: 'Default surcharge: 2% to 15% of VAT owed depending on defaults in 12 months',
  },
  {
    type: 'CONFIRMATION_STATEMENT',
    frequency: 'Annual',
    deadline: 'Within 14 days of anniversary of incorporation',
    description: 'Confirm company details are correct at Companies House',
    penalty: '£150 or more depending on how late',
  },
  {
    type: 'ANNUAL_ACCOUNTS',
    frequency: 'Annual',
    deadline: '9 months after accounting period end',
    description: 'File accounts at Companies House',
    penalty: '£150 to £7,500 depending on company size and lateness',
  },
  {
    type: 'SELF_ASSESSMENT',
    frequency: 'Annual',
    deadline: 'Online: 31 January. Paper: 31 October',
    description: 'Self Assessment tax return for sole traders and partners',
    penalty: 'Initial £100, then daily penalties and % based charges',
  },
  {
    type: 'PAYE_RTI',
    frequency: 'On or before each payday',
    deadline: 'On or before each payday',
    description: 'Real Time Information submission for PAYE',
    penalty: '1% to 4% of tax/NI due depending on lateness',
  },
];

export const UK_CONFIG: UKConfig = {
  countryCode: 'GB',
  countryName: 'United Kingdom',
  currency: 'GBP',
  fiscalYearStart: '04-06', // 6th April
  companyTypes: UK_COMPANY_TYPES,
  vatSchemes: UK_VAT_SCHEMES,
  filingRequirements: UK_FILING_REQUIREMENTS,
  mtdRequirements: {
    vatEnabled: true,
    vatMandatoryThreshold: 85000, // Mandatory for businesses with taxable turnover above £85,000
    incomeTaxEnabled: true, // MTD for Income Tax Self Assessment (phased rollout)
    corporationTaxEnabled: false, // Not yet implemented
  },
};

export default UK_CONFIG;
