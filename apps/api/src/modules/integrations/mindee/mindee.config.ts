/**
 * Mindee API Configuration
 */
export const MINDEE_CONFIG = {
  /**
   * API Key from environment
   */
  apiKey: process.env.MINDEE_API_KEY,

  /**
   * Base URL for Mindee API
   */
  baseUrl: process.env.MINDEE_BASE_URL || 'https://api.mindee.net/v1',

  /**
   * Receipt OCR endpoint (v5)
   */
  receiptEndpoint: '/products/mindee/expense_receipts/v5/predict',

  /**
   * Async receipt endpoint for larger files
   */
  receiptAsyncEndpoint: '/products/mindee/expense_receipts/v5/predict_async',

  /**
   * Request timeout in milliseconds
   */
  timeout: parseInt(process.env.MINDEE_TIMEOUT || '30000', 10),

  /**
   * Maximum file size (10MB)
   */
  maxFileSize: 10 * 1024 * 1024,

  /**
   * Supported MIME types for receipt parsing
   */
  supportedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/tiff',
    'image/heic',
    'application/pdf',
  ],

  /**
   * Polling configuration for async jobs
   */
  polling: {
    /**
     * Initial delay before first poll (ms)
     */
    initialDelay: 2000,

    /**
     * Interval between polls (ms)
     */
    interval: 3000,

    /**
     * Maximum number of poll attempts
     */
    maxAttempts: 20,
  },

  /**
   * Confidence thresholds
   */
  confidence: {
    /**
     * Minimum confidence to consider a field valid
     */
    minimum: 0.5,

    /**
     * High confidence threshold
     */
    high: 0.8,
  },
};

/**
 * Check if Mindee is configured
 */
export function isMindeeConfigured(): boolean {
  return !!MINDEE_CONFIG.apiKey && MINDEE_CONFIG.apiKey.length > 0;
}

/**
 * Check if file type is supported
 */
export function isSupportedMimeType(mimeType: string): boolean {
  return MINDEE_CONFIG.supportedMimeTypes.includes(mimeType.toLowerCase());
}

/**
 * Check if file size is within limits
 */
export function isValidFileSize(size: number): boolean {
  return size > 0 && size <= MINDEE_CONFIG.maxFileSize;
}
