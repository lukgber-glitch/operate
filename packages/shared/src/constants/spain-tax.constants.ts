/**
 * Spanish Tax Constants
 * IVA (VAT), IGIC (Canary Islands), and related tax information
 * Task: W25-T2 - Spanish tax configuration
 */

/**
 * Spanish VAT (IVA) Rates - Mainland Spain
 */
export const SPAIN_IVA_RATES = {
  STANDARD: 21.0, // Tipo general
  REDUCED: 10.0, // Tipo reducido
  SUPER_REDUCED: 4.0, // Tipo superreducido
  ZERO: 0.0, // Exportaciones y entregas intracomunitarias
} as const;

/**
 * Recargo de Equivalencia (RE) - Surcharge rates for small retailers
 * These are ADDED to the regular IVA rates
 */
export const SPAIN_RECARGO_EQUIVALENCIA_RATES = {
  STANDARD: 5.2, // Applied with 21% IVA = 26.2% total
  REDUCED: 1.4, // Applied with 10% IVA = 11.4% total
  SUPER_REDUCED: 0.5, // Applied with 4% IVA = 4.5% total
} as const;

/**
 * IGIC Rates - Canary Islands (replaces IVA)
 * Impuesto General Indirecto Canario
 */
export const SPAIN_IGIC_RATES = {
  SPECIAL: 15.0, // Tipo especial (luxury goods, premium alcohol, tobacco)
  INCREASED_REDUCED: 9.5, // Tipo incrementado (tobacco, alcohol, certain luxury items)
  GENERAL: 7.0, // Tipo general (standard rate for Canary Islands)
  REDUCED: 3.0, // Tipo reducido (food, transport, culture)
  ZERO: 0.0, // Sin IGIC (exports, essential goods)
} as const;

/**
 * Tax Categories for Spain
 */
export const SPAIN_TAX_CATEGORIES = {
  STANDARD: 'STANDARD', // Most goods and services
  REDUCED: 'REDUCED', // Essential goods
  SUPER_REDUCED: 'SUPER_REDUCED', // Basic necessities
  ZERO: 'ZERO', // Exports, intra-EU
  EXEMPT: 'EXEMPT', // Healthcare, education
} as const;

/**
 * Spanish Tax Regimes
 */
export const SPAIN_TAX_REGIMES = {
  GENERAL: 'REGIMEN_GENERAL', // Common regime
  SIMPLIFIED: 'REGIMEN_SIMPLIFICADO', // Simplified regime (módulos)
  RECARGO_EQUIVALENCIA: 'RECARGO_EQUIVALENCIA', // Retailers surcharge regime
  CASH_ACCOUNTING: 'RECC', // Régimen Especial del Criterio de Caja
  SECOND_HAND: 'REBU', // Régimen Especial de Bienes Usados
  GROUP_ENTITIES: 'REGE', // Régimen Especial del Grupo de Entidades
  CANARY_ISLANDS: 'IGIC', // Canary Islands special regime
} as const;

/**
 * Spanish VAT Forms (Modelos)
 */
export const SPAIN_VAT_FORMS = {
  MODELO_303: 'Modelo 303', // Quarterly VAT return
  MODELO_390: 'Modelo 390', // Annual VAT summary
  MODELO_347: 'Modelo 347', // Annual operations with third parties
  MODELO_349: 'Modelo 349', // Intra-community transactions
  MODELO_036: 'Modelo 036', // Tax registration (general)
  MODELO_037: 'Modelo 037', // Tax registration (simplified)
} as const;

/**
 * Quarterly Filing Deadlines
 */
export const SPAIN_QUARTERLY_DEADLINES = {
  Q1: {
    period: 'January - March',
    filingStart: 'April 1',
    filingEnd: 'April 20',
    form: 'Modelo 303',
  },
  Q2: {
    period: 'April - June',
    filingStart: 'July 1',
    filingEnd: 'July 20',
    form: 'Modelo 303',
  },
  Q3: {
    period: 'July - September',
    filingStart: 'October 1',
    filingEnd: 'October 20',
    form: 'Modelo 303',
  },
  Q4: {
    period: 'October - December',
    filingStart: 'January 1',
    filingEnd: 'January 30',
    form: 'Modelo 303',
  },
} as const;

/**
 * Annual Filing Deadlines
 */
export const SPAIN_ANNUAL_DEADLINES = {
  MODELO_390: {
    description: 'Annual VAT summary',
    period: 'Full calendar year',
    filingStart: 'January 1',
    filingEnd: 'January 30',
  },
  MODELO_347: {
    description: 'Annual declaration of operations with third parties (over €3,005.06)',
    period: 'Full calendar year',
    filingStart: 'February 1',
    filingEnd: 'February 28',
  },
  MODELO_200: {
    description: 'Corporate income tax',
    period: 'Fiscal year',
    filingEnd: '25 days after 6 months from fiscal year end',
  },
} as const;

/**
 * NIF (Tax ID) Patterns
 * NIF = Número de Identificación Fiscal
 */
export const SPAIN_NIF_PATTERNS = {
  // Individual tax ID: 8 digits + control letter
  // Example: 12345678Z
  INDIVIDUAL: /^[0-9]{8}[A-Z]$/,

  // Foreign individual (NIE): X/Y/Z + 7 digits + control letter
  // Example: X1234567L
  FOREIGN_INDIVIDUAL: /^[XYZ][0-9]{7}[A-Z]$/,

  // Company tax ID (CIF): Letter + 7 digits + control character (digit or letter)
  // Example: B12345678 or A12345678
  COMPANY: /^[A-W][0-9]{7}[0-9A-J]$/,

  // Complete pattern (any valid Spanish tax ID)
  ANY: /^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]|[A-W][0-9]{7}[0-9A-J])$/,
} as const;

/**
 * CIF Type Letters and their meanings
 */
export const SPAIN_CIF_TYPE_LETTERS = {
  A: 'Sociedad Anónima (Public Limited Company)',
  B: 'Sociedad de Responsabilidad Limitada (Limited Liability Company)',
  C: 'Sociedad Colectiva (General Partnership)',
  D: 'Sociedad Comanditaria (Limited Partnership)',
  E: 'Comunidad de Bienes (Community of Property)',
  F: 'Sociedad Cooperativa (Cooperative)',
  G: 'Asociación (Association)',
  H: 'Comunidad de Propietarios (Community of Property Owners)',
  J: 'Sociedad Civil (Civil Partnership)',
  N: 'Entidad Extranjera (Foreign Entity)',
  P: 'Corporación Local (Local Corporation)',
  Q: 'Organismo Autónomo (Autonomous Organization)',
  R: 'Congregación o Institución Religiosa (Religious Institution)',
  S: 'Órgano de la Administración del Estado (State Administration)',
  U: 'Unión Temporal de Empresas (Temporary Business Union)',
  V: 'Otros tipos no definidos (Other undefined types)',
  W: 'Establecimiento permanente de entidad no residente (Permanent establishment)',
} as const;

/**
 * NIF Control Letter Calculation
 * Valid letters for NIF check digit
 */
export const SPAIN_NIF_CONTROL_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

/**
 * CIF Control Characters (for companies)
 * Used for validation of company tax IDs
 */
export const SPAIN_CIF_CONTROL_CHARACTERS = 'JABCDEFGHI';

/**
 * Canary Islands Provinces
 * These regions use IGIC instead of IVA
 */
export const SPAIN_CANARY_ISLANDS_PROVINCES = [
  'Las Palmas',
  'Santa Cruz de Tenerife',
] as const;

/**
 * Ceuta and Melilla
 * These autonomous cities have special tax treatment
 */
export const SPAIN_CEUTA_MELILLA = ['Ceuta', 'Melilla'] as const;

/**
 * Intra-community threshold
 * Below this amount, simplified reporting may apply
 */
export const SPAIN_INTRA_COMMUNITY_THRESHOLD = 35000; // EUR

/**
 * Modelo 347 threshold
 * Operations with third parties above this amount must be declared
 */
export const SPAIN_MODELO_347_THRESHOLD = 3005.06; // EUR

/**
 * VAT registration threshold
 * Businesses must register for VAT if turnover exceeds this
 */
export const SPAIN_VAT_REGISTRATION_THRESHOLD = 0; // No threshold - all businesses must register

/**
 * Penalties for late filing
 */
export const SPAIN_PENALTIES = {
  LATE_FILING_PERCENT: 1, // 1% per month
  MIN_PENALTY: 300, // EUR
  MAX_PENALTY_PERCENT: 20, // 20% of tax due
  LATE_PAYMENT_INTEREST: 3.75, // Annual percentage (updated annually)
} as const;

/**
 * Digital certificate requirements
 */
export const SPAIN_DIGITAL_CERTIFICATE = {
  REQUIRED_FOR: [
    'All VAT returns (Modelo 303, 390)',
    'Intra-community declarations (Modelo 349)',
    'Annual operations (Modelo 347)',
    'Companies and self-employed (mandatory)',
  ],
  ISSUER: 'FNMT (Fábrica Nacional de Moneda y Timbre)',
  ALTERNATIVE: 'Cl@ve PIN system',
} as const;

/**
 * E-invoicing information
 */
export const SPAIN_EINVOICING = {
  FORMAT: 'Facturae',
  NETWORK: 'FACe / FACeB2B',
  MANDATE_DATE: '2025-01-01',
  MANDATORY_FOR: [
    'Public sector suppliers (already mandatory)',
    'All B2B transactions (from 2025)',
  ],
  TECHNICAL_SPEC: 'Facturae 3.2.2',
} as const;

/**
 * Spanish autonomous regions
 */
export const SPAIN_AUTONOMOUS_REGIONS = [
  'Andalucía',
  'Aragón',
  'Asturias',
  'Baleares',
  'Canarias',
  'Cantabria',
  'Castilla y León',
  'Castilla-La Mancha',
  'Cataluña',
  'Ceuta',
  'Comunidad Valenciana',
  'Extremadura',
  'Galicia',
  'La Rioja',
  'Madrid',
  'Melilla',
  'Murcia',
  'Navarra',
  'País Vasco',
] as const;

/**
 * Tax-related URLs
 */
export const SPAIN_TAX_URLS = {
  AEAT: 'https://www.agenciatributaria.es', // Agencia Estatal de Administración Tributaria
  MODELO_303: 'https://www.agenciatributaria.es/AEAT.internet/Inicio/_Segmentos_/Empresas_y_profesionales/Empresas/IVA/Declaraciones/Modelo_303.shtml',
  MODELO_390: 'https://www.agenciatributaria.es/AEAT.internet/Inicio/_Segmentos_/Empresas_y_profesionales/Empresas/IVA/Declaraciones/Modelo_390.shtml',
  FNMT_CERTIFICATE: 'https://www.sede.fnmt.gob.es/certificados',
  FACE_PORTAL: 'https://face.gob.es',
} as const;
