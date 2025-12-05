/**
 * Base API Client
 * Provides a generic HTTP client for making API requests
 */

import { ApiErrorHandler } from './error-handler';

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || '/api/v1') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: ApiErrorHandler.parseError(new Error(`HTTP ${response.status}`)).message,
        }));

        throw new ApiClientError(
          errorData.message || ApiErrorHandler.parseError(new Error(`HTTP ${response.status}`)).message,
          response.status,
          errorData.code,
          errorData.details
        );
      }

      const data = await response.json();

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      // Re-throw ApiClientError as-is
      if (error instanceof ApiClientError) {
        throw error;
      }

      // Wrap other errors
      const parsed = ApiErrorHandler.parseError(error);
      throw new ApiClientError(
        parsed.message,
        parsed.status,
        parsed.code,
        parsed.details
      );
    }
  }

  private async requestBlob<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

      const response = await fetch(url, {
        ...options,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new ApiClientError(
          ApiErrorHandler.parseError(new Error(`HTTP ${response.status}`)).message,
          response.status
        );
      }

      const data = await response.blob();

      return {
        data: data as unknown as T,
        status: response.status,
      };
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      const parsed = ApiErrorHandler.parseError(error);
      throw new ApiClientError(
        parsed.message,
        parsed.status,
        parsed.code,
        parsed.details
      );
    }
  }

  async get<T>(endpoint: string, options?: RequestInit & { params?: Record<string, any>; responseType?: 'json' | 'blob' }): Promise<ApiResponse<T>> {
    let url = endpoint;
    const { params, responseType, ...restOptions } = options || {};

    if (params) {
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
      );
      const queryString = new URLSearchParams(filteredParams).toString();
      url = `${endpoint}${queryString ? '?' + queryString : ''}`;
    }

    if (responseType === 'blob') {
      return this.requestBlob<T>(url, { ...restOptions, method: 'GET' });
    }

    return this.request<T>(url, { ...restOptions, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    body?: any,
    options?: RequestInit & { onUploadProgress?: (progressEvent: any) => void; params?: Record<string, any> }
  ): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (options?.params) {
      const filteredParams = Object.fromEntries(
        Object.entries(options.params).filter(([, v]) => v !== undefined && v !== null)
      );
      const queryString = new URLSearchParams(filteredParams).toString();
      url = `${endpoint}${queryString ? '?' + queryString : ''}`;
    }

    // Handle FormData separately (don't stringify or set Content-Type)
    if (body instanceof FormData) {
      const { onUploadProgress, params, ...restOptions } = options || {};
      const headers = { ...(restOptions.headers || {}) };
      delete (headers as any)['Content-Type']; // Let browser set it for FormData

      return this.request<T>(url, {
        ...restOptions,
        method: 'POST',
        body,
        headers,
      });
    }

    const { onUploadProgress, params, ...restOptions } = options || {};
    return this.request<T>(url, {
      ...restOptions,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any, options?: RequestInit & { params?: Record<string, any> }): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (options?.params) {
      const filteredParams = Object.fromEntries(
        Object.entries(options.params).filter(([, v]) => v !== undefined && v !== null)
      );
      const queryString = new URLSearchParams(filteredParams).toString();
      url = `${endpoint}${queryString ? '?' + queryString : ''}`;
    }
    const { params, ...restOptions } = options || {};
    return this.request<T>(url, {
      ...restOptions,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: any, options?: RequestInit & { params?: Record<string, any> }): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (options?.params) {
      const filteredParams = Object.fromEntries(
        Object.entries(options.params).filter(([, v]) => v !== undefined && v !== null)
      );
      const queryString = new URLSearchParams(filteredParams).toString();
      url = `${endpoint}${queryString ? '?' + queryString : ''}`;
    }
    const { params, ...restOptions } = options || {};
    return this.request<T>(url, {
      ...restOptions,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
export const apiClient = api; // Alias for consistency
