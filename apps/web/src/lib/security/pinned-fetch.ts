/**
 * Pinned Fetch Wrapper
 *
 * This module provides a fetch wrapper that supports SSL certificate pinning
 * for mobile apps using Capacitor's HTTP plugin.
 *
 * IMPORTANT:
 * - For web: Falls back to standard fetch (browser handles SSL)
 * - For mobile: Uses Capacitor HTTP plugin with certificate pinning
 * - Requires @capacitor/http plugin to be installed
 *
 * INSTALLATION:
 * npm install @capacitor/http
 * npx cap sync
 */

import {
  getPinningConfig,
  isMobileApp,
  logPinningStatus,
} from './ssl-pinning';

/**
 * Type definitions for Capacitor HTTP plugin
 * These will be replaced by actual imports once Capacitor is installed
 */
interface CapacitorHttpOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  data?: any;
  responseType?: 'text' | 'json' | 'blob' | 'arraybuffer';
  connectTimeout?: number;
  readTimeout?: number;
  // Certificate pinning options
  certificatePins?: Array<{
    hostname: string;
    pins: string[];
  }>;
}

interface CapacitorHttpResponse {
  status: number;
  headers: Record<string, string>;
  data: any;
  url: string;
}

/**
 * Check if Capacitor HTTP plugin is available
 */
function isCapacitorHttpAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const capacitor = (window as any).Capacitor;
  if (!capacitor) {
    return false;
  }

  // Check if HTTP plugin is registered
  return capacitor.Plugins?.Http !== undefined;
}

/**
 * Convert fetch options to Capacitor HTTP options
 */
function convertToCapacitorOptions(
  url: string,
  options: RequestInit = {}
): CapacitorHttpOptions {
  const capacitorOptions: CapacitorHttpOptions = {
    url,
    method: (options.method || 'GET').toUpperCase(),
  };

  // Convert headers
  if (options.headers) {
    const headers: Record<string, string> = {};
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
    capacitorOptions.headers = headers;
  }

  // Convert body
  if (options.body) {
    if (typeof options.body === 'string') {
      try {
        capacitorOptions.data = JSON.parse(options.body);
      } catch {
        capacitorOptions.data = options.body;
      }
    } else if (options.body instanceof FormData) {
      // FormData needs special handling in Capacitor
      // Convert to object
      const formObject: Record<string, any> = {};
      (options.body as FormData).forEach((value, key) => {
        formObject[key] = value;
      });
      capacitorOptions.data = formObject;
    } else {
      capacitorOptions.data = options.body;
    }
  }

  // Set timeouts (30 seconds default)
  capacitorOptions.connectTimeout = 30000;
  capacitorOptions.readTimeout = 30000;

  return capacitorOptions;
}

/**
 * Convert Capacitor response to fetch Response
 */
function convertToFetchResponse(
  capacitorResponse: CapacitorHttpResponse
): Response {
  const { status, headers, data } = capacitorResponse;

  // Create response body
  let body: any;
  if (typeof data === 'string') {
    body = data;
  } else {
    body = JSON.stringify(data);
  }

  // Create Response object
  return new Response(body, {
    status,
    statusText: getStatusText(status),
    headers: new Headers(headers),
  });
}

/**
 * Get status text for HTTP status code
 */
function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };
  return statusTexts[status] || 'Unknown';
}

/**
 * Pinned fetch implementation using Capacitor HTTP
 */
async function pinnedFetchCapacitor(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const capacitor = (window as any).Capacitor;
  const Http = capacitor.Plugins.Http;

  // Convert options
  const capacitorOptions = convertToCapacitorOptions(url, options);

  // Add certificate pinning if applicable
  const pinningConfig = getPinningConfig(url);
  if (pinningConfig) {
    capacitorOptions.certificatePins = [
      {
        hostname: pinningConfig.hostname,
        pins: pinningConfig.pins,
      },
    ];

    if (process.env.NODE_ENV === 'development') {    }
  }

  try {
    // Make request with Capacitor HTTP
    const response = await Http.request(capacitorOptions);

    // Convert to fetch Response
    return convertToFetchResponse(response);
  } catch (error) {
    // Certificate pinning failure or network error
    if (process.env.NODE_ENV === 'development') {    }

    // Re-throw as fetch error
    throw new TypeError('Network request failed: ' + (error as Error).message);
  }
}

/**
 * Pinned fetch - wrapper around fetch with SSL certificate pinning support
 *
 * Usage:
 * ```typescript
 * const response = await pinnedFetch('https://operate.guru/api/v1/users');
 * const data = await response.json();
 * ```
 *
 * @param url - Request URL
 * @param options - Fetch options
 * @returns Promise resolving to Response
 */
export async function pinnedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Log pinning status in development
  if (process.env.NODE_ENV === 'development') {
    logPinningStatus(url);
  }

  // Check if we should use Capacitor HTTP with pinning
  if (isMobileApp() && isCapacitorHttpAvailable()) {
    const pinningConfig = getPinningConfig(url);

    // Use Capacitor HTTP if pinning is configured
    if (pinningConfig) {
      return pinnedFetchCapacitor(url, options);
    }
  }

  // Fall back to standard fetch for web or when pinning not configured
  return fetch(url, options);
}

/**
 * Check if pinned fetch is ready to use
 *
 * @returns Status object with availability info
 */
export function getPinnedFetchStatus(): {
  available: boolean;
  reason: string;
  platform: string;
  capacitorAvailable: boolean;
} {
  const platform = isMobileApp() ? 'mobile' : 'web';
  const capacitorAvailable = isCapacitorHttpAvailable();

  if (!isMobileApp()) {
    return {
      available: false,
      reason: 'Running on web, pinning not needed',
      platform,
      capacitorAvailable,
    };
  }

  if (!capacitorAvailable) {
    return {
      available: false,
      reason: 'Capacitor HTTP plugin not installed',
      platform,
      capacitorAvailable,
    };
  }

  return {
    available: true,
    reason: 'Ready to use pinned fetch',
    platform,
    capacitorAvailable,
  };
}
