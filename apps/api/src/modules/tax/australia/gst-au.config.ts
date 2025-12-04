/**
 * Australian GST Configuration
 * Task: W26-T4 - Canadian/Australian tax rules
 */

import { AustralianGSTCategory } from '@operate/shared/types/tax/australia-tax.types';

/**
 * GST rate (standard)
 */
export const GST_RATE = 10;

/**
 * Registration thresholds
 */
export const GST_THRESHOLDS = {
  STANDARD: 75000, // Annual turnover for standard businesses
  NON_PROFIT: 150000, // Annual turnover for non-profit organizations
  TAXI_DRIVER: 0, // Taxi drivers must register regardless of turnover
  RIDESHARE_DRIVER: 0, // Rideshare drivers must register regardless of turnover
} as const;

/**
 * GST-free supplies (0% GST but can claim input tax credits)
 */
export const GST_FREE_SUPPLIES = {
  FOOD: {
    description: 'Basic food for human consumption',
    examples: [
      'Bread and bread rolls (not pastries)',
      'Milk, cream, cheese',
      'Meat (uncooked, for human consumption)',
      'Fish (uncooked, for human consumption)',
      'Fruit and vegetables (fresh)',
      'Eggs',
      'Cereals and grains',
      'Cooking ingredients (flour, sugar, salt)',
    ],
    exclusions: [
      'Restaurant meals',
      'Hot takeaway food',
      'Confectionery',
      'Soft drinks',
      'Bottled water',
      'Ice cream',
      'Prepared salads',
    ],
  },
  HEALTH: {
    description: 'Health services and medical aids',
    examples: [
      'Medical services by registered practitioners',
      'Hospital services',
      'Dental services',
      'Optical services',
      'Prescription medicines',
      'Medical aids and appliances',
    ],
  },
  EDUCATION: {
    description: 'Education courses and services',
    examples: [
      'Primary and secondary education',
      'Tertiary education courses',
      'Registered training organization courses',
    ],
  },
  CHILDCARE: {
    description: 'Childcare services',
    examples: [
      'Approved childcare services',
      'Long day care',
      'Family day care',
      'Before and after school care',
    ],
  },
  EXPORTS: {
    description: 'Exports of goods and services',
    examples: [
      'Goods exported from Australia',
      'International transport of goods',
      'International transport of passengers',
    ],
  },
  OTHER: {
    description: 'Other GST-free supplies',
    examples: [
      'Water, sewerage, and drainage',
      'Precious metals (gold, silver, platinum)',
      'Going concern sales',
      'Farm land sales',
      'Eligible emissions units',
    ],
  },
} as const;

/**
 * Input-taxed supplies (no GST, cannot claim input tax credits)
 */
export const INPUT_TAXED_SUPPLIES = {
  FINANCIAL: {
    description: 'Financial supplies and services',
    examples: [
      'Lending money and extending credit',
      'Provision of debt collection services',
      'Factoring services',
      'Providing a financial guarantee',
      'Interest payments',
      'Fee-based financial services',
    ],
    exceptions: [
      'Advice services (GST applies)',
      'Services involving arranging or dealing',
    ],
  },
  RESIDENTIAL_PROPERTY: {
    description: 'Residential premises',
    examples: [
      'Sale of existing residential premises',
      'Residential rent (leases over 28 days)',
      'Commercial residential premises (hotels, motels)',
    ],
    exceptions: [
      'New residential premises (GST applies)',
      'Short-term accommodation (under 28 days - GST applies)',
    ],
  },
  PRECIOUS_METALS: {
    description: 'Precious metals as investment',
    examples: [
      'Investment grade gold',
      'Investment grade silver',
      'Investment grade platinum',
    ],
  },
  SCHOOL_TUCKSHOPS: {
    description: 'School tuckshop and canteen supplies',
    examples: ['Food sold through school tuckshops and canteens'],
  },
} as const;

/**
 * BAS (Business Activity Statement) filing frequencies
 */
export const BAS_FILING = {
  MONTHLY: {
    description: 'Monthly BAS',
    applicableTo: [
      'Businesses with GST turnover over $20 million',
      'Businesses choosing to report monthly',
    ],
    lodgmentDeadline: '21st day of the following month',
    paymentDeadline: '21st day of the following month',
  },
  QUARTERLY: {
    description: 'Quarterly BAS',
    applicableTo: [
      'Most businesses with GST turnover under $20 million',
      'Default for most small businesses',
    ],
    quarters: {
      Q1: {
        period: 'July - September',
        lodgmentDeadline: 'October 28',
        paymentDeadline: 'October 28',
      },
      Q2: {
        period: 'October - December',
        lodgmentDeadline: 'January 28',
        paymentDeadline: 'January 28',
      },
      Q3: {
        period: 'January - March',
        lodgmentDeadline: 'April 28',
        paymentDeadline: 'April 28',
      },
      Q4: {
        period: 'April - June',
        lodgmentDeadline: 'July 28',
        paymentDeadline: 'July 28',
      },
    },
  },
  ANNUAL: {
    description: 'Annual GST return (Simpler BAS)',
    applicableTo: [
      'Small businesses with GST turnover under $10 million',
      'By choice with ATO approval',
    ],
    lodgmentDeadline: 'February 28 (following financial year)',
    instalments: 'Quarterly PAYG instalments may still be required',
  },
} as const;

/**
 * GST accounting methods
 */
export const GST_ACCOUNTING_METHODS = {
  CASH: {
    description: 'Cash accounting',
    eligibility: 'GST turnover under $10 million',
    gstPayable: 'When you receive payment',
    gstCredits: 'When you pay for business expenses',
  },
  ACCRUAL: {
    description: 'Accrual accounting (non-cash)',
    eligibility: 'All businesses (mandatory if turnover over $10 million)',
    gstPayable: 'When you issue an invoice or receive payment (whichever is earlier)',
    gstCredits: 'When you receive an invoice or make payment (whichever is earlier)',
  },
} as const;

/**
 * GST calculation methods
 */
export const GST_CALCULATION_METHODS = {
  STANDARD: {
    description: 'Standard GST calculation',
    formula: 'GST = (Price × 10%) or (GST-inclusive price ÷ 11)',
  },
  MARGIN_SCHEME: {
    description: 'Margin scheme for property',
    applicableTo: ['Sales of real property', 'Going concern sales'],
    calculation: 'GST payable on the margin (difference between sale and purchase price)',
    eligibility: [
      'Property was GST-free when acquired',
      'Property was purchased under margin scheme',
      'Supplier and purchaser agree to use margin scheme',
    ],
  },
  SIMPLIFIED: {
    description: 'Simplified accounting for small business',
    applicableTo: ['Businesses under $10 million turnover'],
    methods: ['Cash accounting', 'Annual apportionment'],
  },
} as const;

/**
 * Input tax credit (ITC) rules
 */
export const INPUT_TAX_CREDIT_RULES = {
  DESCRIPTION: 'Credits for GST paid on business purchases',
  ELIGIBILITY: [
    'You are registered for GST',
    'Purchase is for a creditable purpose (business use)',
    'GST was included in the price',
    'You have a tax invoice (for purchases over $82.50)',
  ],
  TAX_INVOICE_REQUIREMENTS: {
    UNDER_82_50: 'No tax invoice required (but keep evidence of purchase)',
    FROM_82_50_TO_1000: [
      'Supplier\'s name and ABN',
      'Description of items',
      'Total price including GST',
      'Date of issue',
    ],
    OVER_1000: [
      'Supplier\'s name and ABN',
      'Buyer\'s name or ABN',
      'Description of items',
      'Quantity and price',
      'GST amount or statement that GST is included',
      'Date of issue',
    ],
  },
  TIME_LIMIT: '4 years from the due date of the relevant BAS',
} as const;

/**
 * GST registration process
 */
export const GST_REGISTRATION = {
  HOW_TO_REGISTER: 'Online through myGov or Australian Business Register',
  TIMING: 'Register by 21 days after the month you exceed the threshold',
  EFFECTIVE_DATE: 'From the start of the month you exceeded the threshold',
  WHAT_YOU_NEED: [
    'ABN (Australian Business Number)',
    'Business details',
    'Expected GST turnover',
    'Accounting method preference (cash or accrual)',
    'Reporting frequency preference',
  ],
} as const;

/**
 * Common GST mistakes to avoid
 */
export const COMMON_GST_MISTAKES = [
  'Not registering when turnover exceeds threshold',
  'Charging GST when not registered',
  'Not issuing tax invoices over $82.50',
  'Claiming ITCs without proper documentation',
  'Incorrect GST treatment of residential property',
  'Not understanding GST-free vs input-taxed',
  'Late BAS lodgment and payment',
  'Not keeping records for 5 years',
] as const;
