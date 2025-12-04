/**
 * HMRC MTD (Making Tax Digital) Interfaces
 * UK HMRC OAuth2 and API integration types
 */

export interface HmrcConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
  serverToken?: string; // For application-restricted endpoints
}

export interface HmrcEndpoints {
  authorizationUrl: string;
  tokenUrl: string;
  apiBaseUrl: string;
}

export interface HmrcToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface EncryptedToken {
  encryptedData: string;
  iv: Buffer;
  tag: Buffer;
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

export interface HmrcConnectionInfo {
  id: string;
  orgId: string;
  vrn: string;
  status: HmrcConnectionStatus;
  isConnected: boolean;
  lastSyncAt?: Date;
  lastError?: string;
  tokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  environment: string;
  connectedAt: Date;
  disconnectedAt?: Date;
}

export enum HmrcConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  EXPIRED = 'EXPIRED',
  ERROR = 'ERROR',
}

export interface HmrcAuthUrlResponse {
  authUrl: string;
  state: string;
}

export interface HmrcCallbackQuery {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export interface RefreshTokenResult {
  success: boolean;
  tokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  error?: string;
}

export interface DisconnectResult {
  success: boolean;
  message: string;
}

export interface DecryptedTokens {
  accessToken: string;
  refreshToken: string;
}

export interface HmrcAuditLog {
  action: 'CONNECT' | 'DISCONNECT' | 'TOKEN_REFRESH' | 'API_CALL';
  endpoint?: string;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * HMRC Fraud Prevention Headers
 * Required by HMRC for all API calls
 * @see https://developer.service.hmrc.gov.uk/guides/fraud-prevention/
 */
export interface HmrcFraudPreventionHeaders {
  'Gov-Client-Connection-Method': string;
  'Gov-Client-Device-ID': string;
  'Gov-Client-User-IDs': string;
  'Gov-Client-Timezone': string;
  'Gov-Client-Local-IPs': string;
  'Gov-Client-Screens': string;
  'Gov-Client-Window-Size': string;
  'Gov-Client-Browser-Plugins': string;
  'Gov-Client-Browser-JS-User-Agent': string;
  'Gov-Client-Browser-Do-Not-Track': string;
  'Gov-Client-Multi-Factor'?: string;
  'Gov-Client-Public-IP'?: string;
  'Gov-Client-Public-Port'?: string;
  'Gov-Vendor-Version'?: string;
  'Gov-Vendor-Product-Name'?: string;
}

export interface VATObligations {
  obligations: VATObligation[];
}

export interface VATObligation {
  start: string;
  end: string;
  due: string;
  status: 'O' | 'F'; // Open or Fulfilled
  periodKey: string;
  received?: string;
}

export interface VATReturn {
  periodKey: string;
  vatDueSales: number;
  vatDueAcquisitions: number;
  totalVatDue: number;
  vatReclaimedCurrPeriod: number;
  netVatDue: number;
  totalValueSalesExVAT: number;
  totalValuePurchasesExVAT: number;
  totalValueGoodsSuppliedExVAT: number;
  totalAcquisitionsExVAT: number;
  finalised: boolean;
}

export interface VATReturnResponse {
  processingDate: string;
  paymentIndicator: string;
  formBundleNumber: string;
  chargeRefNumber?: string;
}

export interface VATLiabilities {
  liabilities: VATLiability[];
}

export interface VATLiability {
  taxPeriod: {
    from: string;
    to: string;
  };
  type: string;
  originalAmount: number;
  outstandingAmount: number;
  due: string;
}

export interface VATPayments {
  payments: VATPayment[];
}

export interface VATPayment {
  amount: number;
  received: string;
}
