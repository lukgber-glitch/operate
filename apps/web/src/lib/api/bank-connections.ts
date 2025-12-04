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
  private baseUrl = '/api/v1';

  private getOrgId(): string {
    if (typeof window !== 'undefined' && (window as any).__orgId) {
      return (window as any).__orgId;
    }
    return 'default-org-id';
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
    return response.data;
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
    return response.data;
  }
}

export const bankConnectionsApi = new BankConnectionsApi();
