/**
 * QuickBooks Online Integration Types
 * Type definitions for QuickBooks OAuth and API operations
 */

export interface QuickBooksToken {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
  realmId: string;
}

export interface QuickBooksCompanyInfo {
  companyId: string;
  companyName: string;
  country?: string;
  fiscalYearStart?: string;
  address?: {
    line1?: string;
    city?: string;
    countrySubDivisionCode?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface QuickBooksConnectionInfo {
  id: string;
  orgId: string;
  companyId: string;
  companyName: string | null;
  status: 'CONNECTED' | 'DISCONNECTED' | 'EXPIRED' | 'ERROR';
  isConnected: boolean;
  lastSyncAt: Date | null;
  lastError: string | null;
  tokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  environment: string;
  connectedAt: Date;
}

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}

export interface OAuthState {
  state: string;
  codeVerifier: string;
  orgId: string;
  createdAt: number;
  expiresAt: number;
}

export interface QuickBooksAuthUrlResponse {
  authUrl: string;
  state: string;
}

export interface QuickBooksCallbackQuery {
  code: string;
  state: string;
  realmId: string;
  error?: string;
  error_description?: string;
}

export interface EncryptedToken {
  encryptedData: string;
  iv: Buffer;
  tag: Buffer;
}

export interface DecryptedTokens {
  accessToken: string;
  refreshToken: string;
}

export interface QuickBooksAuditLog {
  action: 'CONNECT' | 'DISCONNECT' | 'TOKEN_REFRESH' | 'SYNC' | 'API_CALL' | 'ERROR';
  endpoint?: string;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface RefreshTokenResult {
  success: boolean;
  tokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  error?: string;
}

export interface QuickBooksApiError {
  code: string;
  message: string;
  detail?: string;
  statusCode?: number;
}

export interface DisconnectResult {
  success: boolean;
  message: string;
}

// QuickBooks API Response Types (subset, extend as needed)
export interface QuickBooksCustomer {
  Id: string;
  DisplayName: string;
  GivenName?: string;
  FamilyName?: string;
  CompanyName?: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
  PrimaryPhone?: {
    FreeFormNumber: string;
  };
  BillAddr?: {
    Line1?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
  Balance: number;
  Active: boolean;
}

export interface QuickBooksInvoice {
  Id: string;
  DocNumber: string;
  CustomerRef: {
    value: string;
    name?: string;
  };
  TxnDate: string;
  DueDate: string;
  TotalAmt: number;
  Balance: number;
  Line: Array<{
    Id: string;
    LineNum: number;
    Description?: string;
    Amount: number;
    DetailType: string;
    SalesItemLineDetail?: {
      ItemRef: {
        value: string;
        name?: string;
      };
      Qty: number;
      UnitPrice: number;
    };
  }>;
}

export interface QuickBooksAccount {
  Id: string;
  Name: string;
  AcctNum?: string;
  AccountType: string;
  AccountSubType: string;
  CurrentBalance: number;
  Active: boolean;
}
