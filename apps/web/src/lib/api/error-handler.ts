/**
 * API Error Handling Utility
 * Provides centralized error parsing and user-friendly messages
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class ApiErrorHandler {
  /**
   * Parse API error and return user-friendly message
   */
  static parseError(error: unknown): ApiError {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        message: 'Network error. Please check your internet connection.',
        code: 'NETWORK_ERROR',
      };
    }

    // API errors
    if (error instanceof Error) {
      const errorMessage = error.message;

      // Parse HTTP status codes
      const statusMatch = errorMessage.match(/HTTP (\d+)/);
      if (statusMatch) {
        const status = parseInt(statusMatch[1]);
        return {
          message: this.getStatusMessage(status),
          status,
          code: `HTTP_${status}`,
        };
      }

      // Return the error message as-is if it's already user-friendly
      return {
        message: errorMessage,
      };
    }

    // Unknown errors
    return {
      message: 'An unexpected error occurred. Please try again.',
      code: 'UNKNOWN_ERROR',
    };
  }

  /**
   * Get user-friendly message for HTTP status codes
   */
  private static getStatusMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This operation conflicts with existing data.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Our team has been notified.';
      case 502:
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      case 504:
        return 'Request timeout. Please try again.';
      default:
        return `An error occurred (${status}). Please try again.`;
    }
  }

  /**
   * Check if error is a network error
   */
  static isNetworkError(error: unknown): boolean {
    return error instanceof TypeError && error.message.includes('fetch');
  }

  /**
   * Check if error is an authentication error
   */
  static isAuthError(error: unknown): boolean {
    const parsed = this.parseError(error);
    return parsed.status === 401;
  }

  /**
   * Check if error is a permission error
   */
  static isPermissionError(error: unknown): boolean {
    const parsed = this.parseError(error);
    return parsed.status === 403;
  }

  /**
   * Check if error is a validation error
   */
  static isValidationError(error: unknown): boolean {
    const parsed = this.parseError(error);
    return parsed.status === 422 || parsed.status === 400;
  }

  /**
   * Format error for logging
   */
  static formatForLogging(error: unknown, context?: string): string {
    const parsed = this.parseError(error);
    const prefix = context ? `[${context}] ` : '';
    return `${prefix}${parsed.code || 'ERROR'}: ${parsed.message} ${
      parsed.status ? `(HTTP ${parsed.status})` : ''
    }`;
  }
}

/**
 * Hook-friendly error handler that returns user-friendly message
 */
export function handleApiError(error: unknown): string {
  const parsed = ApiErrorHandler.parseError(error);
  return parsed.message;
}

/**
 * Get error message with fallback
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  try {
    return handleApiError(error);
  } catch {
    return fallback;
  }
}
