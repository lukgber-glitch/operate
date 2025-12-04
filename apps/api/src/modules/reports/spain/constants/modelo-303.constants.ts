/**
 * Modelo 303 Constants
 * Box codes, field mappings, and validation rules for quarterly VAT declaration
 * Task: W25-T4
 */

/**
 * Modelo 303 Box Codes
 * Official AEAT box numbers
 */
export const MODELO_303_BOXES = {
  // IVA DEVENGADO (Collected VAT)
  BASE_21: '01', // Base imponible 21%
  CUOTA_21: '02', // Cuota 21%
  BASE_10: '03', // Base imponible 10%
  CUOTA_10: '04', // Cuota 10%
  BASE_4: '05', // Base imponible 4%
  CUOTA_4: '06', // Cuota 4%

  // Adquisiciones intracomunitarias
  BASE_INTRA_EU: '10', // Base adquisiciones intracomunitarias
  CUOTA_INTRA_EU: '11', // Cuota adquisiciones intracomunitarias

  // Modificación bases y cuotas
  MODIFICACION_BASE_21: '07', // Modificación base imponible 21%
  MODIFICACION_CUOTA_21: '08', // Modificación cuota 21%
  MODIFICACION_BASE_10: '09', // Modificación base imponible 10%

  // Total IVA devengado
  TOTAL_CUOTA_DEVENGADA: '27', // Total cuota devengada (sum of boxes 02+04+06+11...)

  // IVA DEDUCIBLE (Deductible VAT)
  BASE_DEDUCIBLE_CORRIENTE: '12', // Base deducible operaciones corrientes
  CUOTA_DEDUCIBLE_CORRIENTE: '13', // Cuota deducible operaciones corrientes
  BASE_DEDUCIBLE_INVERSION: '14', // Base deducible bienes de inversión
  CUOTA_DEDUCIBLE_INVERSION: '15', // Cuota deducible bienes de inversión
  CUOTA_DEDUCIBLE_IMPORTACIONES: '16', // Cuota deducible importaciones
  CUOTA_DEDUCIBLE_INTRA_EU: '17', // Cuota deducible adquisiciones intracomunitarias
  COMPENSACION_RE: '18', // Compensaciones régimen simplificado

  // Total IVA deducible
  TOTAL_CUOTA_DEDUCIBLE: '28', // Total cuota deducible (sum of boxes 13+15+16+17+18)

  // RESULTADO (Result)
  RESULTADO_BRUTO: '29', // Resultado bruto (box 27 - box 28)
  PROPORCION_ANTERIOR: '30', // A deducir por prorrata
  REGULARIZACION_PRORRATA: '31', // Regularización de prorrata
  DEVOLUCIONES_ANTERIORES: '32', // A deducir por devoluciones anteriores
  RESULTADO_LIQUIDACION: '46', // Resultado de la liquidación (final result)
  A_INGRESAR: '47', // Cuantía a ingresar (if positive)
  A_DEVOLVER: '48', // Cuantía a devolver (if negative, requested return)

  // INFORMACIÓN ADICIONAL (Additional Information)
  DECLARANTE_MENSUAL: '49', // Monthly filer checkbox
  CONCURSO_ACREEDORES: '50', // Insolvency proceedings
  INVERSION_SUJETO_PASIVO: '51', // Reverse charge operations
  RECC: '52', // Cash accounting regime
  REGIMEN_SIMPLIFICADO: '53', // Simplified regime activities

  // AUTOLIQUIDACIÓN (Self-assessment)
  INGRESO_EFECTIVO: '70', // Actual payment amount
  COMPLEMENTARIA: '80', // Complementary return
  SUSTITUCION: '81', // Substitution return
} as const;

/**
 * Field mappings for AEAT XML generation
 */
export const MODELO_303_FIELD_NAMES = {
  [MODELO_303_BOXES.BASE_21]: 'BaseImponible01',
  [MODELO_303_BOXES.CUOTA_21]: 'Cuota02',
  [MODELO_303_BOXES.BASE_10]: 'BaseImponible03',
  [MODELO_303_BOXES.CUOTA_10]: 'Cuota04',
  [MODELO_303_BOXES.BASE_4]: 'BaseImponible05',
  [MODELO_303_BOXES.CUOTA_4]: 'Cuota06',
  [MODELO_303_BOXES.BASE_INTRA_EU]: 'BaseImponible10',
  [MODELO_303_BOXES.CUOTA_INTRA_EU]: 'Cuota11',
  [MODELO_303_BOXES.TOTAL_CUOTA_DEVENGADA]: 'TotalCuotaDevengada27',
  [MODELO_303_BOXES.BASE_DEDUCIBLE_CORRIENTE]: 'BaseImponible12',
  [MODELO_303_BOXES.CUOTA_DEDUCIBLE_CORRIENTE]: 'Cuota13',
  [MODELO_303_BOXES.BASE_DEDUCIBLE_INVERSION]: 'BaseImponible14',
  [MODELO_303_BOXES.CUOTA_DEDUCIBLE_INVERSION]: 'Cuota15',
  [MODELO_303_BOXES.CUOTA_DEDUCIBLE_IMPORTACIONES]: 'Cuota16',
  [MODELO_303_BOXES.CUOTA_DEDUCIBLE_INTRA_EU]: 'Cuota17',
  [MODELO_303_BOXES.COMPENSACION_RE]: 'CompensacionRE18',
  [MODELO_303_BOXES.TOTAL_CUOTA_DEDUCIBLE]: 'TotalCuotaDeducible28',
  [MODELO_303_BOXES.RESULTADO_BRUTO]: 'ResultadoBruto29',
  [MODELO_303_BOXES.RESULTADO_LIQUIDACION]: 'ResultadoLiquidacion46',
  [MODELO_303_BOXES.A_INGRESAR]: 'AIngresar47',
  [MODELO_303_BOXES.A_DEVOLVER]: 'ADevolver48',
} as const;

/**
 * VAT rates and their corresponding box codes
 */
export const VAT_RATE_TO_BOX_MAP = {
  21: {
    baseBox: MODELO_303_BOXES.BASE_21,
    quotaBox: MODELO_303_BOXES.CUOTA_21,
  },
  10: {
    baseBox: MODELO_303_BOXES.BASE_10,
    quotaBox: MODELO_303_BOXES.CUOTA_10,
  },
  4: {
    baseBox: MODELO_303_BOXES.BASE_4,
    quotaBox: MODELO_303_BOXES.CUOTA_4,
  },
} as const;

/**
 * Quarterly periods and their codes
 */
export const QUARTERLY_PERIODS = {
  1: { code: '1T', months: [1, 2, 3], label: 'Q1 (Enero-Marzo)' },
  2: { code: '2T', months: [4, 5, 6], label: 'Q2 (Abril-Junio)' },
  3: { code: '3T', months: [7, 8, 9], label: 'Q3 (Julio-Septiembre)' },
  4: { code: '4T', months: [10, 11, 12], label: 'Q4 (Octubre-Diciembre)' },
} as const;

/**
 * Filing deadlines
 */
export const FILING_DEADLINES = {
  1: { month: 4, day: 20, label: '20 de Abril' },
  2: { month: 7, day: 20, label: '20 de Julio' },
  3: { month: 10, day: 20, label: '20 de Octubre' },
  4: { month: 1, day: 30, label: '30 de Enero (siguiente año)' },
} as const;

/**
 * Validation rules
 */
export const MODELO_303_VALIDATION_RULES = {
  // Maximum values
  MAX_AMOUNT: 999999999999.99, // 12 digits + 2 decimals
  MIN_AMOUNT: -999999999999.99,

  // Required fields
  REQUIRED_FIELDS: [
    'nif',
    'fiscalYear',
    'period',
    'totalCuotaDevengada',
    'totalCuotaDeducible',
    'resultadoLiquidacion',
  ],

  // Decimal precision
  DECIMAL_PLACES: 2,

  // Special operations thresholds
  MODELO_347_THRESHOLD: 3005.06, // Operations requiring Modelo 347
  INTRA_EU_THRESHOLD: 35000, // Intra-community threshold

  // NIF validation
  NIF_PATTERN: /^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]|[A-W][0-9]{7}[0-9A-J])$/,

  // Period validation
  MIN_YEAR: 2020,
  MAX_YEAR: 2100,
  QUARTERS: [1, 2, 3, 4],
} as const;

/**
 * Calculation formulas
 */
export const CALCULATION_FORMULAS = {
  // Cuota = Base × (Rate / 100)
  calculateQuota: (base: number, rate: number): number =>
    Math.round((base * (rate / 100)) * 100) / 100,

  // Total Cuota Devengada = sum of all collected VAT
  calculateTotalDevengada: (quotas: number[]): number =>
    Math.round(quotas.reduce((sum, q) => sum + q, 0) * 100) / 100,

  // Total Cuota Deducible = sum of all deductible VAT
  calculateTotalDeducible: (quotas: number[]): number =>
    Math.round(quotas.reduce((sum, q) => sum + q, 0) * 100) / 100,

  // Resultado Bruto = Devengada - Deducible
  calculateResultadoBruto: (devengada: number, deducible: number): number =>
    Math.round((devengada - deducible) * 100) / 100,

  // Resultado Liquidación (final result after adjustments)
  calculateResultadoLiquidacion: (
    bruto: number,
    adjustments: number = 0,
  ): number => Math.round((bruto - adjustments) * 100) / 100,
} as const;

/**
 * Error codes
 */
export const MODELO_303_ERROR_CODES = {
  // Validation errors
  INVALID_NIF: 'E303001',
  INVALID_PERIOD: 'E303002',
  INVALID_AMOUNT: 'E303003',
  MISSING_REQUIRED_FIELD: 'E303004',

  // Calculation errors
  CALCULATION_MISMATCH: 'E303010',
  NEGATIVE_BASE: 'E303011',
  EXCESSIVE_DEDUCTION: 'E303012',

  // Business logic errors
  NO_INVOICES_FOUND: 'E303020',
  PERIOD_ALREADY_FILED: 'E303021',
  PAST_DEADLINE: 'E303022',

  // AEAT submission errors
  AEAT_REJECTION: 'E303030',
  CERTIFICATE_INVALID: 'E303031',
  NETWORK_ERROR: 'E303032',
} as const;

/**
 * Warning codes
 */
export const MODELO_303_WARNING_CODES = {
  APPROACHING_DEADLINE: 'W303001',
  UNUSUAL_DEDUCTION_RATIO: 'W303002',
  LARGE_REFUND_REQUEST: 'W303003',
  NO_INTRA_EU_DECLARATION: 'W303004',
  SIMPLIFIED_REGIME_DETECTED: 'W303005',
} as const;

/**
 * Special regimes
 */
export const SPECIAL_REGIMES = {
  GENERAL: 'REGIMEN_GENERAL',
  SIMPLIFIED: 'REGIMEN_SIMPLIFICADO',
  RECARGO_EQUIVALENCIA: 'RECARGO_EQUIVALENCIA',
  CASH_ACCOUNTING: 'RECC',
  SECOND_HAND: 'REBU',
  AGRICULTURE: 'REA',
  TRAVEL_AGENCIES: 'REAAV',
  GROUP_ENTITIES: 'REGE',
} as const;

/**
 * Operation types for special cases
 */
export const OPERATION_TYPES = {
  STANDARD: 'STANDARD', // Standard domestic operations
  INTRA_EU: 'INTRA_EU', // Intra-community acquisitions/deliveries
  EXPORT: 'EXPORT', // Exports (0% VAT)
  IMPORT: 'IMPORT', // Imports
  REVERSE_CHARGE: 'REVERSE_CHARGE', // Inverse sujeto pasivo
  CASH_ACCOUNTING: 'CASH_ACCOUNTING', // RECC
  SECOND_HAND: 'SECOND_HAND', // Used goods
} as const;

/**
 * XML namespace and schema information
 */
export const MODELO_303_XML_SCHEMA = {
  NAMESPACE: 'http://www.agenciatributaria.es/static_files/common/internet/dep/aplicaciones/es/aeat/burt/jdit/ws/Modelo303.xsd',
  VERSION: '1.0',
  ENCODING: 'UTF-8',
} as const;

/**
 * Default values
 */
export const MODELO_303_DEFAULTS = {
  specialCircumstance: '00', // No special circumstances
  operationType: 'F1', // Standard invoice
  declarationType: 'I', // Ingreso (payment)
  exerciseType: 'A', // Annual
} as const;
