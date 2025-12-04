/**
 * Mindee API Response Interfaces
 * Based on Mindee Receipt OCR API v5 documentation
 */

/**
 * Field with confidence score
 */
export interface MindeeField<T = string> {
  value: T | null;
  confidence: number;
  polygon?: number[][];
}

/**
 * Locale information
 */
export interface MindeeLocale {
  value: string | null;
  confidence: number;
  language: string | null;
  country: string | null;
  currency: string | null;
}

/**
 * Line item from receipt
 */
export interface MindeeLineItem {
  description: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_amount: number | null;
  confidence: number;
  polygon?: number[][];
}

/**
 * Receipt prediction data
 */
export interface MindeeReceiptPrediction {
  // Merchant info
  supplier_name: MindeeField<string>;
  supplier_address: MindeeField<string>;
  supplier_phone_number: MindeeField<string>;

  // Date and time
  date: MindeeField<string>;
  time: MindeeField<string>;

  // Amounts
  total_amount: MindeeField<number>;
  total_tax: MindeeField<number>;
  total_net: MindeeField<number>;
  tip: MindeeField<number>;

  // Locale
  locale: MindeeLocale;

  // Payment details
  payment_method: MindeeField<string>;
  receipt_number: MindeeField<string>;

  // Line items
  line_items: MindeeLineItem[];

  // Category (optional)
  category: MindeeField<string>;

  // Subcategory (optional)
  subcategory: MindeeField<string>;
}

/**
 * Document inference
 */
export interface MindeeInference {
  prediction: MindeeReceiptPrediction;
  pages: any[];
  endpoint_name: string;
  endpoint_version: string;
  is_rotation_applied: boolean;
}

/**
 * Complete API response
 */
export interface MindeeApiResponse {
  api_request: {
    error: any;
    resources: string[];
    status: string;
    status_code: number;
    url: string;
  };
  document: {
    id: string;
    name: string;
    n_pages: number;
    inference: MindeeInference;
  };
}

/**
 * Async job response
 */
export interface MindeeAsyncJobResponse {
  api_request: {
    error: any;
    resources: string[];
    status: string;
    status_code: number;
    url: string;
  };
  job: {
    id: string;
    status: 'waiting' | 'processing' | 'completed' | 'failed';
    error?: any;
    available_at?: string;
    issued_at: string;
  };
  document?: {
    id: string;
    name: string;
    n_pages: number;
    inference: MindeeInference;
  };
}

/**
 * Error response
 */
export interface MindeeErrorResponse {
  api_request: {
    error: {
      code: string;
      message: string;
      details?: any;
    };
    status: string;
    status_code: number;
  };
}
