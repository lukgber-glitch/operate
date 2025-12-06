/**
 * Authentication API Client
 * Handles all authentication-related API calls
 */

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    orgId?: string;
  };
  // Tokens are now in HTTP-only cookies, not in response body
  accessToken?: string;
  refreshToken?: string;
  requiresMfa?: boolean;
}

export interface MfaVerifyRequest {
  code: string;
  rememberDevice?: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface OAuthProvider {
  provider: 'google' | 'microsoft';
  redirectUrl?: string;
}

class AuthApi {
  private baseUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/auth`;

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    const json = await response.json().catch(() => ({
      error: { message: 'An error occurred' },
    }));

    if (!response.ok) {
      // API returns errors in {error: {message: "..."}} format
      const errorMessage = json.error?.message || json.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    // API wraps responses in {data: {...}, meta: {...}} format
    return json.data !== undefined ? json.data : json;
  }

  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    // API doesn't accept acceptTerms, only validate it on frontend
    const { acceptTerms, ...apiData } = data;
    return this.request<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify(apiData),
    });
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    return this.request<void>('/logout', {
      method: 'POST',
    });
  }

  /**
   * Refresh the access token
   * Tokens are now stored in HTTP-only cookies, so no need to pass refreshToken
   */
  async refresh(): Promise<AuthResponse> {
    return this.request<AuthResponse>('/refresh', {
      method: 'POST',
    });
  }

  /**
   * Verify MFA code
   */
  async verifyMfa(data: MfaVerifyRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/mfa/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Verify email with token
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Initiate OAuth login
   */
  async oauthLogin(data: OAuthProvider): Promise<{ redirectUrl: string }> {
    return this.request<{ redirectUrl: string }>('/oauth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<AuthResponse['user']> {
    return this.request<AuthResponse['user']>('/me', {
      method: 'GET',
    });
  }
}

export const authApi = new AuthApi();
