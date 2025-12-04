/**
 * JP-PINT (Japan Peppol International) Constants
 *
 * Japan-specific constants for Peppol e-invoicing
 * Standards:
 * - JP-PINT 1.0 (based on PINT, aligned with UBL 2.1)
 * - Japanese Invoice Registry Number format (T + 13 digits)
 * - Corporate Number (法人番号) - 13 digits with check digit
 */

/**
 * Japanese Peppol participant scheme
 */
export const JP_PEPPOL_SCHEME = '9912'; // Japan Corporate Number (法人番号)

/**
 * Invoice Registry Number prefix
 * Format: T followed by 13-digit Corporate Number
 */
export const JP_INVOICE_REGISTRY_PREFIX = 'T';

/**
 * Corporate Number length (without check digit)
 */
export const JP_CORPORATE_NUMBER_LENGTH = 13;

/**
 * JP-PINT Document ID
 */
export const JP_PINT_DOCUMENT_ID = {
  scheme: 'busdox-docid-qns',
  identifier: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2::Invoice##urn:peppol:pint:billing-1@jp-1::2.1',
};

/**
 * JP-PINT Process ID
 */
export const JP_PINT_PROCESS_ID = {
  scheme: 'cenbii-procid-ubl',
  identifier: 'urn:peppol:bis:billing',
};

/**
 * JP-PINT Customization ID
 */
export const JP_PINT_CUSTOMIZATION_ID = 'urn:peppol:pint:billing-1@jp-1';

/**
 * JP-PINT Profile ID
 */
export const JP_PINT_PROFILE_ID = 'urn:peppol:bis:billing';

/**
 * Japanese Tax Categories
 */
export const JP_TAX_CATEGORIES = {
  STANDARD: 'S', // Standard rate (10%)
  REDUCED: 'AA', // Reduced rate (8% - food & beverages)
  EXEMPT: 'E', // Exempt
  ZERO: 'Z', // Zero-rated
  REVERSE_CHARGE: 'AE', // Reverse charge
};

/**
 * Japanese Tax Rates
 */
export const JP_TAX_RATES = {
  STANDARD: 10.0, // Standard consumption tax rate
  REDUCED: 8.0, // Reduced consumption tax rate
};

/**
 * Japanese Currency
 */
export const JP_CURRENCY = 'JPY';

/**
 * Japanese Country Code
 */
export const JP_COUNTRY_CODE = 'JP';

/**
 * Corporate Number validation regex
 * 13 digits only
 */
export const JP_CORPORATE_NUMBER_REGEX = /^\d{13}$/;

/**
 * Invoice Registry Number validation regex
 * T followed by 13 digits
 */
export const JP_INVOICE_REGISTRY_REGEX = /^T\d{13}$/;

/**
 * Japanese business identifier types
 */
export const JP_BUSINESS_IDENTIFIER_TYPES = {
  CORPORATE_NUMBER: '9912', // 法人番号 (Corporate Number)
  INVOICE_REGISTRY: '9912', // Same scheme, but with 'T' prefix
};

/**
 * JP-PINT Error Codes
 */
export const JP_PINT_ERROR_CODES = {
  INVALID_CORPORATE_NUMBER: 'JP_PINT_001',
  INVALID_INVOICE_REGISTRY: 'JP_PINT_002',
  CHECK_DIGIT_MISMATCH: 'JP_PINT_003',
  INVALID_TAX_CATEGORY: 'JP_PINT_004',
  MISSING_TIMESTAMP: 'JP_PINT_005',
  INVALID_PARTICIPANT_SCHEME: 'JP_PINT_006',
};

/**
 * Japanese invoice requirements
 */
export const JP_INVOICE_REQUIREMENTS = {
  TIMESTAMP_REQUIRED: true,
  TAX_REGISTRATION_REQUIRED: true,
  CORPORATE_NUMBER_REQUIRED: true,
  INVOICE_REGISTRY_NUMBER_REQUIRED: true,
  SEAL_REQUIRED: false, // Digital seal (電子印鑑) optional for Peppol
};

/**
 * TLS Configuration for Japan
 */
export const JP_TLS_CONFIG = {
  MIN_VERSION: 'TLSv1.3',
  CIPHERS: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_AES_128_GCM_SHA256',
    'TLS_CHACHA20_POLY1305_SHA256',
  ],
};

/**
 * Japanese address format
 * Format: 〒postal_code prefecture city address
 */
export const JP_ADDRESS_FORMAT = {
  POSTAL_CODE_REGEX: /^\d{3}-?\d{4}$/, // xxx-xxxx or xxxxxxx
  PREFECTURES: [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
    '岐阜県', '静岡県', '愛知県', '三重県',
    '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
    '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県',
    '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県',
    '沖縄県',
  ],
};

/**
 * Japanese date format
 */
export const JP_DATE_FORMAT = 'YYYY-MM-DD'; // ISO 8601

/**
 * Japanese endpoint scheme for SMP lookup
 */
export const JP_SMP_SCHEME = 'jp-peppol';

/**
 * Japanese invoice type codes
 */
export const JP_INVOICE_TYPE_CODES = {
  STANDARD_INVOICE: '380', // Standard invoice
  CREDIT_NOTE: '381', // Credit note
  DEBIT_NOTE: '383', // Debit note
  CORRECTED_INVOICE: '384', // Corrected invoice
  PREPAYMENT_INVOICE: '386', // Prepayment invoice
};
