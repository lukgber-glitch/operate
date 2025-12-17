/**
 * Bank Connections API Client
 * Handles bank account linking via Tink OAuth
 */

export interface BankConnection {
  id: string;
  organisationId: string;
  provider: 'TINK' | 'PLAID' | 'MANUAL';
  providerConnectionId?: string;
  bankName: string;
  bankLogo?: string;
  country: string;
  status: 'ACTIVE' | 'ERROR' | 'NEEDS_REAUTH' | 'DISCONNECTED';
  lastSyncAt?: string;
  errorMessage?: string;
  accounts: ConnectedBankAccount[];
  createdAt: string;
  updatedAt: string;
}

export interface ConnectedBankAccount {
  id: string;
  connectionId: string;
  externalAccountId: string;
  accountName: string;
  accountNumber: string;
  iban?: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT' | 'INVESTMENT' | 'OTHER';
  currency: string;
  balance: number;
  availableBalance?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bank {
  id: string;
  name: string;
  logo?: string;
  country: string;
  bic?: string;
}

export interface StartConnectionRequest {
  organisationId: string;
  provider: 'TINK';
  country: string;
  bankId?: string;
  redirectUrl: string;
}

export interface StartConnectionResponse {
  authorizationUrl: string;
  state: string;
}

export interface CompleteConnectionRequest {
  code: string;
  state: string;
}

class BankConnectionsApi {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

  /**
   * Get organisation ID from auth context
   * The orgId is set in window.__orgId by the useAuth hook when user authenticates
   *
   * NOTE: This method now returns empty string instead of throwing to prevent page crashes.
   * The API call will handle auth errors gracefully via the fetch() error handling.
   */
  private getOrgId(): string {
    if (typeof window !== 'undefined') {
      if ((window as any).__orgId) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[BankConnectionsAPI] Using window.__orgId:', (window as any).__orgId);
        }
        return (window as any).__orgId;
      }

      // Fallback: try to parse from cookie
      const authCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('op_auth='));

      if (authCookie) {
        try {
          const authValue = decodeURIComponent(authCookie.split('=')[1] || '');
          if (process.env.NODE_ENV === 'development') {
            console.log('[BankConnectionsAPI] Found op_auth cookie, attempting to parse...');
          }
          const authData = JSON.parse(authValue);

          // Parse JWT to extract orgId
          if (authData.a) {
            const payload = JSON.parse(atob(authData.a.split('.')[1]));
            if (payload.orgId) {
              if (process.env.NODE_ENV === 'development') {
                console.log('[BankConnectionsAPI] Extracted orgId from JWT:', payload.orgId);
              }
              return payload.orgId;
            }
          }
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[BankConnectionsAPI] Failed to parse auth cookie:', e);
          }
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[BankConnectionsAPI] No op_auth cookie found');
        }
      }
    }

    // Return empty string instead of throwing - let the API call handle the 401/403
    if (process.env.NODE_ENV === 'development') {
      console.warn('[BankConnectionsAPI] Organisation ID not available - returning empty string');
    }
    return '';
  }

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

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Get all bank connections for an organisation
  async getBankConnections(): Promise<BankConnection[]> {
    const orgId = this.getOrgId();
    const response = await this.request<{ data: BankConnection[] }>(
      `/organisations/${orgId}/bank-connections`
    );
    // Ensure each connection has an accounts array (never null)
    const connections = response.data || [];
    return connections.map(connection => ({
      ...connection,
      accounts: connection.accounts || [],
    }));
  }

  // Get a specific bank connection
  async getBankConnection(connectionId: string): Promise<BankConnection> {
    const orgId = this.getOrgId();
    return this.request<BankConnection>(
      `/organisations/${orgId}/bank-connections/${connectionId}`
    );
  }

  // Start OAuth flow to connect a bank
  async startConnection(data: Omit<StartConnectionRequest, 'organisationId'>): Promise<StartConnectionResponse> {
    const orgId = this.getOrgId();
    return this.request<StartConnectionResponse>(
      `/organisations/${orgId}/bank-connections`,
      {
        method: 'POST',
        body: JSON.stringify({ ...data, organisationId: orgId }),
      }
    );
  }

  // Complete OAuth flow with authorization code
  async completeConnection(data: CompleteConnectionRequest): Promise<BankConnection> {
    const orgId = this.getOrgId();
    return this.request<BankConnection>(
      `/organisations/${orgId}/bank-connections/callback`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  // Trigger manual sync for a connection
  async syncConnection(connectionId: string): Promise<BankConnection> {
    const orgId = this.getOrgId();
    return this.request<BankConnection>(
      `/organisations/${orgId}/bank-connections/${connectionId}/sync`,
      {
        method: 'POST',
      }
    );
  }

  // Disconnect a bank connection
  async disconnectConnection(connectionId: string): Promise<void> {
    const orgId = this.getOrgId();
    return this.request<void>(
      `/organisations/${orgId}/bank-connections/${connectionId}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Re-authenticate a connection (start new OAuth flow)
  async reauthConnection(connectionId: string, redirectUrl: string): Promise<StartConnectionResponse> {
    const orgId = this.getOrgId();
    return this.request<StartConnectionResponse>(
      `/organisations/${orgId}/bank-connections/${connectionId}/reauth`,
      {
        method: 'POST',
        body: JSON.stringify({ redirectUrl }),
      }
    );
  }

  // Get available banks for a country
  async getBanks(country: string): Promise<Bank[]> {
    const response = await this.request<{ data: Bank[] }>(
      `/bank-connections/banks?country=${country}`
    );
    return response.data || [];
  }
}

export const bankConnectionsApi = new BankConnectionsApi();
