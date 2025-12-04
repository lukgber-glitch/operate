/**
 * India GST (Goods and Services Tax) Configuration
 * Task: W29-T4 - India GST configuration
 *
 * GST Structure:
 * - Intra-state: CGST + SGST (split equally)
 * - Inter-state: IGST (full rate)
 * - GST slabs: 0%, 5%, 12%, 18%, 28%
 * - Additional Cess on luxury/sin goods
 */

/**
 * GST Rate Slabs
 * All rates in percentage
 */
export const INDIA_GST_RATES = {
  ZERO: 0,
  FIVE: 5,
  TWELVE: 12,
  EIGHTEEN: 18,
  TWENTY_EIGHT: 28,
} as const;

/**
 * GST Components
 * For intra-state transactions, tax is split equally between CGST and SGST
 * For inter-state transactions, entire tax is IGST
 */
export const INDIA_GST_COMPONENTS = {
  CGST: 'CGST', // Central GST
  SGST: 'SGST', // State GST
  UTGST: 'UTGST', // Union Territory GST
  IGST: 'IGST', // Integrated GST
  CESS: 'CESS', // Compensation Cess
} as const;

/**
 * GST Rate Categories with CGST/SGST/IGST breakdown
 */
export const INDIA_GST_RATE_BREAKDOWN = {
  ZERO: {
    total: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    description: 'Nil-rated supplies',
  },
  FIVE: {
    total: 5,
    cgst: 2.5,
    sgst: 2.5,
    igst: 5,
    description: 'Essential goods and services',
  },
  TWELVE: {
    total: 12,
    cgst: 6,
    sgst: 6,
    igst: 12,
    description: 'Standard goods category 1',
  },
  EIGHTEEN: {
    total: 18,
    cgst: 9,
    sgst: 9,
    igst: 18,
    description: 'Standard goods category 2',
  },
  TWENTY_EIGHT: {
    total: 28,
    cgst: 14,
    sgst: 14,
    igst: 28,
    description: 'Luxury goods and services',
  },
} as const;

/**
 * GST Categories by Item Type
 */
export const INDIA_GST_CATEGORIES = {
  EXEMPT: 'EXEMPT', // Exempt from GST
  NIL_RATED: 'NIL_RATED', // 0% GST
  LOW_RATE: 'LOW_RATE', // 5% GST
  STANDARD_1: 'STANDARD_1', // 12% GST
  STANDARD_2: 'STANDARD_2', // 18% GST
  LUXURY: 'LUXURY', // 28% GST
  ZERO_RATED: 'ZERO_RATED', // 0% with input tax credit (exports)
} as const;

/**
 * Common Items by GST Rate - 0% (Nil-rated)
 */
export const INDIA_ZERO_RATE_ITEMS = [
  'Fresh vegetables',
  'Fresh fruits',
  'Fresh milk',
  'Curd (yogurt)',
  'Eggs',
  'Salt',
  'Bread',
  'Grains (wheat, rice, etc.)',
  'Unpacked food grains',
  'Unbranded flour',
  'Besan (gram flour)',
  'Jaggery',
] as const;

/**
 * Common Items by GST Rate - 5%
 */
export const INDIA_FIVE_PERCENT_ITEMS = [
  'Fish fillet',
  'Cream',
  'Skimmed milk powder',
  'Edible oils',
  'Coffee',
  'Tea',
  'Sugar',
  'Coal',
  'Medicines and drugs',
  'Life-saving drugs',
  'Transport services (economy class)',
  'Small restaurants (without AC)',
  'Footwear under ₹500',
  'Apparel under ₹1000',
  'Domestic LPG',
  'Cashew nuts',
] as const;

/**
 * Common Items by GST Rate - 12%
 */
export const INDIA_TWELVE_PERCENT_ITEMS = [
  'Butter',
  'Ghee',
  'Frozen meat products',
  'Packed fruit juices',
  'Computers',
  'Processed food',
  'Umbrellas',
  'Cell phones',
  'Diagnostic kits',
  'Exercise books',
  'Tooth powder',
  'Spectacles',
  'Playing cards',
  'Ayurvedic medicines',
] as const;

/**
 * Common Items by GST Rate - 18%
 */
export const INDIA_EIGHTEEN_PERCENT_ITEMS = [
  'Hair oil',
  'Toothpaste',
  'Soap',
  'Capital goods',
  'Industrial intermediaries',
  'Footwear above ₹500',
  'Apparel above ₹1000',
  'Pasta',
  'Cornflakes',
  'Pastries and cakes',
  'Preserved vegetables',
  'Jams and jellies',
  'Ice cream',
  'Mineral water',
  'Cameras',
  'Printers',
  'IT services',
  'Telecom services',
  'Financial services',
  'Restaurants with AC',
  'Hotels (₹1000-₹7500/night)',
] as const;

/**
 * Common Items by GST Rate - 28% (+ Cess on some items)
 */
export const INDIA_TWENTY_EIGHT_PERCENT_ITEMS = [
  'Luxury cars',
  'Two-wheelers (above 350cc)',
  'Air conditioners',
  'Refrigerators',
  'Washing machines',
  'Cigarettes (+ cess)',
  'Tobacco products (+ cess)',
  'Aerated beverages (+ cess)',
  'Pan masala (+ cess)',
  'Luxury hotels (above ₹7500/night)',
  'Racing cars',
  'Yachts',
  'Private jets',
  'Cinema tickets above ₹100',
  'Caffeinated beverages',
  'Paint',
  'Cement',
  'Ceramics',
] as const;

/**
 * GST Exempt Items
 * These items are completely exempt from GST
 */
export const INDIA_GST_EXEMPT_ITEMS = [
  'Agricultural produce',
  'Education services',
  'Healthcare services',
  'Public transportation',
  'Services by RBI',
  'Selling of land and buildings',
  'Postal services',
  'Election services',
  'Funeral services',
  'Services by governmental authority',
  'Fresh milk and milk products',
  'Fresh meat',
  'Live animals',
  'Seeds',
  'Human blood and organs',
] as const;

/**
 * Zero-rated Supplies (0% with ITC)
 * Exports and supplies to SEZ
 */
export const INDIA_ZERO_RATED_SUPPLIES = {
  EXPORTS: {
    description: 'Export of goods or services',
    rate: 0,
    itcAllowed: true,
    withPayment: 'Export with payment of IGST (refundable)',
    withoutPayment: 'Export under LUT/Bond without payment',
  },
  SEZ: {
    description: 'Supply to Special Economic Zone (SEZ)',
    rate: 0,
    itcAllowed: true,
    requirements: 'Supply to SEZ unit or developer',
  },
  DEEMED_EXPORTS: {
    description: 'Deemed exports',
    rate: 0,
    itcAllowed: true,
    examples: [
      'Supply to EOU (Export Oriented Unit)',
      'Supply to EHTP/STP/BTP',
      'Supply against Advance Authorization',
    ],
  },
} as const;

/**
 * Compensation Cess Rates
 * Additional cess on luxury and sin goods
 */
export const INDIA_GST_CESS_RATES = {
  TOBACCO: {
    items: ['Cigarettes', 'Cigars', 'Chewing tobacco', 'Pan masala with tobacco'],
    cessRate: 'Up to 290% (varies by type)',
    baseGST: 28,
  },
  COAL: {
    items: ['Coal', 'Lignite', 'Peat'],
    cessRate: '₹400 per tonne',
    baseGST: 5,
  },
  MOTOR_VEHICLES: {
    petrol: {
      items: ['Petrol cars (up to 4m, engine < 1200cc)'],
      cessRate: 1,
      baseGST: 28,
    },
    diesel: {
      items: ['Diesel cars (up to 4m, engine < 1500cc)'],
      cessRate: 3,
      baseGST: 28,
    },
    midSize: {
      items: ['Mid-size cars (length > 4m)'],
      cessRate: 17,
      baseGST: 28,
    },
    luxury: {
      items: ['SUVs', 'Luxury cars (> ₹40 lakhs)'],
      cessRate: 22,
      baseGST: 28,
    },
  },
  AERATED_BEVERAGES: {
    items: ['Aerated waters', 'Carbonated beverages'],
    cessRate: 12,
    baseGST: 28,
  },
  PAN_MASALA: {
    items: ['Pan masala (without tobacco)'],
    cessRate: 60,
    baseGST: 28,
  },
} as const;

/**
 * Place of Supply Rules
 * Determines whether to apply CGST+SGST or IGST
 */
export const INDIA_PLACE_OF_SUPPLY_RULES = {
  GOODS: {
    description: 'Place of supply for goods',
    rules: [
      'Movement: Place where movement terminates (delivery location)',
      'No movement: Location of goods at time of delivery',
      'Installation: Place where goods are installed/assembled',
      'Goods on board: Location at time of supply',
    ],
  },
  SERVICES: {
    description: 'Place of supply for services',
    rules: [
      'Immovable property: Location of property',
      'Restaurant: Location of restaurant',
      'Training/performance: Where event is held',
      'Goods transportation: Location where goods handed over',
      'Passenger transportation: Where passenger embarks',
      'Online services (B2C): Location of recipient',
      'Banking/insurance: Location where recipient receives service',
      'General rule: Location of recipient (if registered), or supplier location (if unregistered)',
    ],
  },
  INTRA_STATE: {
    condition: 'Supplier and recipient in same state',
    taxes: ['CGST', 'SGST'],
    example: 'Delhi to Delhi: CGST 9% + SGST 9% = 18%',
  },
  INTER_STATE: {
    condition: 'Supplier and recipient in different states',
    taxes: ['IGST'],
    example: 'Delhi to Mumbai: IGST 18%',
  },
} as const;

/**
 * GST Registration Thresholds
 */
export const INDIA_GST_REGISTRATION_THRESHOLDS = {
  REGULAR: {
    goods: {
      amount: 4_000_000, // ₹40 lakhs
      currency: 'INR',
      description: 'Mandatory registration for goods suppliers',
      specialStates: {
        amount: 2_000_000, // ₹20 lakhs for NE states
        states: ['Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim', 'Tripura', 'Uttarakhand', 'Himachal Pradesh'],
      },
    },
    services: {
      amount: 2_000_000, // ₹20 lakhs
      currency: 'INR',
      description: 'Mandatory registration for service providers',
      specialStates: {
        amount: 1_000_000, // ₹10 lakhs for NE states
        states: ['Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim', 'Tripura', 'Uttarakhand', 'Himachal Pradesh'],
      },
    },
  },
  COMPOSITION_SCHEME: {
    threshold: 15_000_000, // ₹1.5 crore
    currency: 'INR',
    description: 'Maximum turnover for composition scheme',
    rates: {
      manufacturers: 1, // 1% (0.5% CGST + 0.5% SGST)
      restaurants: 5, // 5% (2.5% CGST + 2.5% SGST)
      traders: 1, // 1% (0.5% CGST + 0.5% SGST)
      services: 6, // 6% (3% CGST + 3% SGST)
    },
    restrictions: [
      'Cannot collect GST on invoices',
      'Cannot claim input tax credit',
      'Cannot make inter-state supplies',
      'Must issue Bill of Supply',
      'Simple quarterly filing (GSTR-4)',
    ],
  },
  COMPULSORY_REGISTRATION: [
    'Inter-state supplies',
    'Casual taxable persons',
    'E-commerce operators',
    'Non-resident taxable persons',
    'Reverse charge mechanism applicability',
    'Input Service Distributor',
    'TDS/TCS deductor',
    'Online information and database access provider (from outside India)',
    'E-commerce aggregators',
  ],
} as const;

/**
 * GST Return Filing Periods
 */
export const INDIA_GST_RETURN_PERIODS = {
  GSTR1: {
    name: 'GSTR-1',
    description: 'Outward supplies (sales)',
    frequency: 'Monthly',
    dueDate: '11th of next month',
    applicableTo: 'Turnover > ₹5 crore: Monthly, Others: Quarterly',
  },
  GSTR3B: {
    name: 'GSTR-3B',
    description: 'Summary return with tax payment',
    frequency: 'Monthly',
    dueDate: '20th of next month (some states: 22nd/24th)',
    applicableTo: 'All regular taxpayers',
    mandatory: true,
  },
  GSTR2A: {
    name: 'GSTR-2A',
    description: 'Auto-populated purchase register',
    frequency: 'Monthly',
    dueDate: 'Auto-generated',
    applicableTo: 'All taxpayers (view only)',
  },
  GSTR2B: {
    name: 'GSTR-2B',
    description: 'Auto-drafted ITC statement',
    frequency: 'Monthly',
    dueDate: '14th of next month',
    applicableTo: 'All taxpayers (view only)',
  },
  GSTR4: {
    name: 'GSTR-4',
    description: 'Composition scheme return',
    frequency: 'Quarterly',
    dueDate: '18th of month after quarter',
    applicableTo: 'Composition scheme taxpayers',
  },
  GSTR9: {
    name: 'GSTR-9',
    description: 'Annual return',
    frequency: 'Annual',
    dueDate: '31st December of next financial year',
    applicableTo: 'Turnover > ₹2 crore',
  },
  GSTR9C: {
    name: 'GSTR-9C',
    description: 'Reconciliation statement (audited)',
    frequency: 'Annual',
    dueDate: '31st December of next financial year',
    applicableTo: 'Turnover > ₹5 crore (requires CA certification)',
  },
} as const;

/**
 * Reverse Charge Mechanism (RCM)
 * Recipient pays tax instead of supplier
 */
export const INDIA_REVERSE_CHARGE_MECHANISM = {
  description: 'Recipient liable to pay GST instead of supplier',
  applicableOn: [
    'Services from unregistered supplier (if recipient registered)',
    'Import of services from outside India',
    'GTA (Goods Transport Agency) services',
    'Services of advocates',
    'Services of arbitral tribunal',
    'Sponsorship services',
    'Services by Director/partner',
    'Renting of motor vehicles',
    'Security services',
    'Supply by e-commerce operator (not registered)',
  ],
  goods: [
    'Cashew nuts (unprocessed)',
    'Bidi wrapper leaves',
    'Tobacco leaves',
    'Silk yarn',
    'Raw cotton',
  ],
  b2b: {
    threshold: 5_000, // ₹5,000 per day
    description: 'Purchases from unregistered supplier',
    suspended: 'Currently suspended till further notice',
  },
} as const;

/**
 * Input Tax Credit (ITC) Rules
 */
export const INDIA_ITC_RULES = {
  conditions: [
    'Tax invoice or debit note issued by supplier',
    'Goods/services received',
    'Tax paid to government by supplier',
    'Return filed by recipient',
    'Supplier has also filed return',
  ],
  blocked: [
    'Motor vehicles (except for specific business use)',
    'Food and beverages',
    'Outdoor catering',
    'Beauty treatment',
    'Health services',
    'Rent-a-cab (except specified)',
    'Life and health insurance',
    'Travel benefits to employees',
    'Membership of clubs/health centers',
    'Works contract for personal use',
  ],
  timeLimits: {
    claim: 'Before earlier of: Annual return filing or 30th Nov of next financial year',
    reversal: 'If supplier has not paid tax within 180 days',
  },
  proportionate: {
    description: 'When used for both taxable and exempt supplies',
    calculation: 'Based on turnover ratio',
  },
} as const;

/**
 * E-Invoicing Requirements
 * Mandatory electronic invoice reporting
 */
export const INDIA_E_INVOICING = {
  mandatory: true,
  effectiveDate: '2020-10-01',
  currentThreshold: 1_000_000, // ₹10 lakhs annual turnover
  phases: [
    { date: '2020-10-01', threshold: 50_000_000_000 }, // ₹500 crore
    { date: '2021-01-01', threshold: 10_000_000_000 }, // ₹100 crore
    { date: '2021-04-01', threshold: 5_000_000_000 }, // ₹50 crore
    { date: '2021-10-01', threshold: 2_000_000_000 }, // ₹20 crore
    { date: '2022-04-01', threshold: 1_000_000_000 }, // ₹10 crore
    { date: '2022-10-01', threshold: 500_000_000 }, // ₹5 crore
    { date: '2023-05-01', threshold: 10_000_000 }, // ₹1 crore
    { date: '2024-04-01', threshold: 5_000_000 }, // ₹50 lakhs
    { date: '2025-04-01', threshold: 1_000_000 }, // ₹10 lakhs
  ],
  irpSystem: {
    name: 'Invoice Registration Portal (IRP)',
    description: 'Government portal for invoice registration',
    providers: ['NIC', 'NSDL', 'Cleartax', 'Iris', 'Tera Software', 'Cygnet'],
    qrCode: true,
    irn: 'Invoice Reference Number (64-character hash)',
  },
  format: 'JSON schema as per GSTN specifications',
  realTime: true,
} as const;

/**
 * E-Way Bill Requirements
 * Electronic waybill for goods movement
 */
export const INDIA_E_WAY_BILL = {
  threshold: 5_000_000, // ₹50,000
  description: 'Required for inter-state/intra-state goods movement above threshold',
  validity: {
    upto100km: '1 day',
    upto300km: '3 days',
    upto500km: '5 days',
    upto1000km: '10 days',
    above1000km: '15 days',
    additional: '1 day per 100 km',
  },
  exemptions: [
    'Non-motorized conveyance',
    'Goods value < ₹50,000',
    'Specified goods (live animals, organic manure, etc.)',
    'Diplomatic cargo',
    'Defense/military consignments',
  ],
  parts: {
    partA: 'Details of goods, consignor, consignee',
    partB: 'Vehicle details (by transporter)',
  },
} as const;

/**
 * GSTIN Format
 * Goods and Services Tax Identification Number
 */
export const INDIA_GSTIN_FORMAT = {
  length: 15,
  format: '99AAAAA9999A9Z9',
  structure: {
    stateCode: {
      position: '1-2',
      description: 'State code (01-38)',
      type: 'numeric',
    },
    pan: {
      position: '3-12',
      description: 'PAN of taxpayer',
      type: 'alphanumeric',
      format: '10 characters',
    },
    entityNumber: {
      position: '13',
      description: 'Registration number within state',
      type: 'alphanumeric',
      default: 'Usually 1 for first registration',
    },
    defaultChar: {
      position: '14',
      description: 'Default character Z',
      type: 'alpha',
      value: 'Z',
    },
    checksum: {
      position: '15',
      description: 'Check digit',
      type: 'alphanumeric',
    },
  },
  example: '27AAPFU0939F1ZV',
  validation: 'Luhn algorithm with alphanumeric characters',
} as const;

/**
 * HSN/SAC Codes
 * Harmonized System of Nomenclature / Service Accounting Code
 */
export const INDIA_HSN_SAC = {
  hsn: {
    description: 'HSN codes for goods',
    mandatory: {
      above50L: '4-digit HSN',
      above5Cr: '6-digit HSN',
      below50L: 'Optional',
    },
    structure: {
      chapter: '2 digits (01-99)',
      heading: '4 digits',
      subheading: '6 digits',
      tariff: '8 digits',
    },
  },
  sac: {
    description: 'SAC codes for services',
    mandatory: {
      above50L: '4-digit SAC',
      above5Cr: '6-digit SAC',
      below50L: 'Optional',
    },
    structure: {
      section: '2 digits (99)',
      heading: '4 digits',
      group: '5 digits',
      subGroup: '6 digits',
    },
  },
} as const;

/**
 * Penalties for Non-Compliance
 */
export const INDIA_GST_PENALTIES = {
  LATE_FILING: {
    description: 'Late fee for delayed return filing',
    fee: 50, // ₹50 per day (₹25 CGST + ₹25 SGST)
    nilReturn: 20, // ₹20 per day for nil returns
    maximum: 5000, // ₹5,000 maximum
  },
  LATE_PAYMENT: {
    description: 'Interest on delayed tax payment',
    rate: 18, // 18% per annum
    calculation: 'Calculated per day from due date',
  },
  TAX_EVASION: {
    description: 'Penalty for tax evasion',
    penalty: '100% of tax evaded',
    minimum: 10000, // ₹10,000
    fraud: '100%-200% of tax amount (if fraud/willful misstatement)',
  },
  WRONG_ITC: {
    description: 'Taking wrong input tax credit',
    penalty: 'Higher of ₹10,000 or 10% of wrongly claimed ITC',
  },
  NO_REGISTRATION: {
    description: 'Operating without registration',
    penalty: 'Higher of ₹10,000 or tax amount',
  },
  INVOICE_VIOLATION: {
    description: 'Not issuing/incorrect invoice',
    penalty: '₹25,000',
  },
  E_INVOICE_FAILURE: {
    description: 'Not generating e-invoice when required',
    penalty: '₹10,000 per invoice',
  },
} as const;

/**
 * Tax Authority Information
 */
export const INDIA_TAX_AUTHORITY = {
  central: {
    name: 'Central Board of Indirect Taxes and Customs',
    abbreviation: 'CBIC',
    website: 'https://www.cbic.gov.in',
    under: 'Ministry of Finance, Government of India',
  },
  gstNetwork: {
    name: 'Goods and Services Tax Network',
    abbreviation: 'GSTN',
    website: 'https://www.gst.gov.in',
    portal: 'https://www.gst.gov.in',
    description: 'IT backbone for GST',
  },
  council: {
    name: 'GST Council',
    description: 'Constitutional body for GST decisions',
    chair: 'Union Finance Minister',
    members: 'State Finance Ministers',
  },
} as const;

/**
 * TDS/TCS under GST
 */
export const INDIA_GST_TDS_TCS = {
  tds: {
    description: 'Tax Deducted at Source',
    rate: 2, // 1% CGST + 1% SGST (or 2% IGST)
    threshold: 250_000, // ₹2.5 lakhs per contract
    deductors: [
      'Central/State Government',
      'Local authorities',
      'Governmental agencies',
      'PSUs',
      'Authorities under law',
    ],
  },
  tcs: {
    description: 'Tax Collected at Source',
    rate: 1, // 0.5% CGST + 0.5% SGST (or 1% IGST)
    threshold: 500_000, // ₹50 lakhs (increased from ₹2.5 lakhs)
    collectors: 'E-commerce operators',
    applicableTo: 'All supplies through e-commerce',
  },
} as const;

/**
 * GST Refund Process
 */
export const INDIA_GST_REFUND = {
  types: [
    'Zero-rated supplies (exports)',
    'Inverted duty structure',
    'ITC accumulation',
    'Tax paid by mistake',
    'Excess payment',
  ],
  timeline: {
    application: 'Within 2 years from relevant date',
    processing: '60 days from complete application',
    provisionalRefund: '90% of claimed amount (within 7 days for exports)',
  },
  form: 'RFD-01',
  supporting: [
    'Statement of invoices',
    'Tax payment proof',
    'Bank account details',
    'Shipping bills (for exports)',
  ],
} as const;
