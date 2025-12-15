/**
 * SEC-016: XSS Sanitization Utility
 *
 * Provides utilities to sanitize user input and prevent Cross-Site Scripting (XSS) attacks.
 * Used by validation decorators and pipes to clean user-provided data.
 *
 * @module common/utils/xss-sanitizer
 */

/**
 * HTML entities map for encoding
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Dangerous patterns that indicate potential XSS attacks
 */
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick=, onerror=, etc.
  /data:\s*text\/html/gi,
  /expression\s*\(/gi,
  /vbscript:/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*>/gi,
  /<link\b[^<]*>/gi,
  /<meta\b[^<]*>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  /<svg\b[^<]*onload=/gi,
  /<img\b[^<]*onerror=/gi,
];

/**
 * SEC-016: Encode HTML entities in a string
 *
 * @param str - String to encode
 * @returns Encoded string safe for HTML insertion
 */
export function encodeHtmlEntities(str: string): string {
  if (!str || typeof str !== 'string') {
    return str;
  }

  return str.replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * SEC-016: Check if string contains potential XSS patterns
 *
 * @param str - String to check
 * @returns True if string contains dangerous patterns
 */
export function containsXssPatterns(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }

  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(str));
}

/**
 * SEC-016: Remove dangerous XSS patterns from string
 *
 * @param str - String to sanitize
 * @returns Sanitized string with dangerous patterns removed
 */
export function removeDangerousPatterns(str: string): string {
  if (!str || typeof str !== 'string') {
    return str;
  }

  let sanitized = str;
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  return sanitized;
}

/**
 * SEC-016: Sanitize string for safe display
 *
 * This is the main sanitization function that:
 * 1. Removes dangerous XSS patterns
 * 2. Encodes remaining HTML entities
 * 3. Trims whitespace
 *
 * @param str - String to sanitize
 * @returns Sanitized string safe for display
 */
export function sanitizeForDisplay(str: string): string {
  if (!str || typeof str !== 'string') {
    return str;
  }

  // Step 1: Remove dangerous patterns
  let sanitized = removeDangerousPatterns(str);

  // Step 2: Encode HTML entities
  sanitized = encodeHtmlEntities(sanitized);

  // Step 3: Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * SEC-016: Sanitize string for safe storage
 *
 * Lighter sanitization that removes dangerous patterns but
 * preserves content for later proper encoding on display.
 *
 * @param str - String to sanitize
 * @returns Sanitized string safe for storage
 */
export function sanitizeForStorage(str: string): string {
  if (!str || typeof str !== 'string') {
    return str;
  }

  // Remove dangerous patterns only
  let sanitized = removeDangerousPatterns(str);

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * SEC-016: Sanitize object properties recursively
 *
 * @param obj - Object to sanitize
 * @param mode - 'display' or 'storage' sanitization mode
 * @returns Sanitized object
 */
export function sanitizeObject<T extends object>(
  obj: T,
  mode: 'display' | 'storage' = 'storage',
): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitizer =
    mode === 'display' ? sanitizeForDisplay : sanitizeForStorage;

  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in sanitized) {
    const value = (sanitized as any)[key];

    if (typeof value === 'string') {
      (sanitized as any)[key] = sanitizer(value);
    } else if (typeof value === 'object' && value !== null) {
      (sanitized as any)[key] = sanitizeObject(value, mode);
    }
  }

  return sanitized as T;
}

/**
 * SEC-016: Validate that string is safe (no XSS patterns)
 *
 * @param str - String to validate
 * @returns True if string is safe
 */
export function isSafeString(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return true;
  }

  return !containsXssPatterns(str);
}
