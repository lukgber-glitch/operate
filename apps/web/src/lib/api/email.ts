/**
 * Email API Client
 * Handles email connection management, syncing, and configuration
 */

import { api } from './client';

export interface EmailConnectionStatus {
  connected: boolean;
  provider?: 'gmail' | 'outlook';
  email?: string;
  expiresAt?: string;
  lastSync?: string;
  invoiceCount?: number;
}

export interface EmailConnection {
  id: string;
  provider: 'gmail' | 'outlook';
  email: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync?: string;
  expiresAt?: string;
  syncedEmailCount?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GmailAuthUrlResponse {
  authUrl: string;
  state: string;
}

export interface OutlookAuthUrlResponse {
  authUrl: string;
  state: string;
}

export interface ConnectionInfo {
  id: string;
  provider: 'gmail' | 'outlook';
  email: string;
  connected: boolean;
  expiresAt?: string;
  lastSync?: string;
}

export interface EmailFilterConfig {
  processAttachments: boolean;
  processInvoices: boolean;
  processReceipts: boolean;
  processPurchaseOrders: boolean;
  processStatements: boolean;
  senderWhitelist: string[];
  senderBlacklist: string[];
  subjectKeywords: string[];
  minAmount?: number;
  maxAmount?: number;
  autoProcess: boolean;
  requireManualReview: boolean;
}

export interface SyncResult {
  success: boolean;
  jobId: string;
  message: string;
}

export interface SyncProgress {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalEmails?: number;
  processedEmails?: number;
  foundInvoices?: number;
  error?: string;
}

/**
 * Get all email connections for a user
 */
export async function getEmailConnections(
  userId: string
): Promise<EmailConnection[]> {
  try {
    const response = await api.get<EmailConnection[]>(
      `/integrations/email/connections`,
      {
        params: { userId },
      }
    );
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch email connections:', error);
    return [];
  }
}

/**
 * Get OAuth authorization URL for Gmail
 */
export async function getGmailAuthUrl(
  userId: string,
  orgId: string,
  redirectUri?: string
): Promise<GmailAuthUrlResponse> {
  const response = await api.post<GmailAuthUrlResponse>(
    '/integrations/gmail/auth-url',
    {
      userId,
      orgId,
      redirectUri,
    }
  );
  return response.data || ({ authUrl: '', state: '' } as GmailAuthUrlResponse);
}

/**
 * Get OAuth authorization URL for Outlook
 */
export async function getOutlookAuthUrl(
  userId: string,
  orgId: string,
  redirectUri?: string
): Promise<OutlookAuthUrlResponse> {
  const response = await api.get<OutlookAuthUrlResponse>(
    '/integrations/outlook/auth-url',
    {
      params: {
        userId,
        orgId,
        redirectUri,
      },
    }
  );
  return response.data || ({ authUrl: '', state: '' } as OutlookAuthUrlResponse);
}

/**
 * Get Gmail connection status
 */
export async function getGmailStatus(
  userId: string
): Promise<EmailConnectionStatus> {
  try {
    const response = await api.get<ConnectionInfo | null>(
      '/integrations/gmail/status',
      {
        params: { userId },
      }
    );

    if (!response.data) {
      return { connected: false };
    }

    return {
      connected: true,
      provider: 'gmail',
      email: response.data.email,
      expiresAt: response.data.expiresAt,
      lastSync: response.data.lastSync,
    };
  } catch (error) {
    return { connected: false };
  }
}

/**
 * Get Outlook connection status
 */
export async function getOutlookStatus(
  userId: string,
  orgId: string
): Promise<EmailConnectionStatus> {
  try {
    const response = await api.get<
      ConnectionInfo | { connected: false }
    >('/integrations/outlook/status', {
      params: { userId, orgId },
    });

    if ('connected' in response.data && !response.data.connected) {
      return { connected: false };
    }

    const data = response.data as ConnectionInfo;
    return {
      connected: true,
      provider: 'outlook',
      email: data.email,
      expiresAt: data.expiresAt,
      lastSync: data.lastSync,
    };
  } catch (error) {
    return { connected: false };
  }
}

/**
 * Disconnect Gmail
 */
export async function disconnectGmail(
  connectionId: string
): Promise<{ success: boolean; message: string }> {
  const response = await api.post<{ success: boolean; message: string }>(
    '/integrations/gmail/disconnect',
    null,
    {
      params: { connectionId },
    }
  );
  return response.data || { success: false, message: 'Unknown error' };
}

/**
 * Disconnect Outlook
 */
export async function disconnectOutlook(
  userId: string,
  orgId: string
): Promise<{ success: boolean; message: string }> {
  const response = await api.post<{ success: boolean; message: string }>(
    '/integrations/outlook/disconnect',
    { userId, orgId }
  );
  return response.data || { success: false, message: 'Unknown error' };
}

/**
 * Disconnect any email connection by ID
 */
export async function disconnectEmail(
  connectionId: string
): Promise<{ success: boolean; message: string }> {
  const response = await api.delete<{ success: boolean; message: string }>(
    `/integrations/email/connections/${connectionId}`
  );
  return response.data || { success: false, message: 'Unknown error' };
}

/**
 * Trigger email sync for a connection
 */
export async function syncEmails(connectionId: string): Promise<SyncResult> {
  const response = await api.post<SyncResult>(
    `/integrations/email/connections/${connectionId}/sync`
  );
  return response.data || ({ success: false, jobId: '', message: 'Unknown error' } as SyncResult);
}

/**
 * Get sync progress for a connection
 */
export async function getSyncProgress(
  connectionId: string
): Promise<SyncProgress> {
  const response = await api.get<SyncProgress>(
    `/integrations/email/connections/${connectionId}/sync/progress`
  );
  return response.data || ({ status: 'failed', progress: 0 } as SyncProgress);
}

/**
 * Get email filter configuration
 */
export async function getEmailFilterConfig(
  userId: string
): Promise<EmailFilterConfig> {
  const response = await api.get<EmailFilterConfig>(
    `/integrations/email/filter-config`,
    {
      params: { userId },
    }
  );
  return response.data || ({
    processAttachments: false,
    processInvoices: false,
    processReceipts: false,
    processPurchaseOrders: false,
    processStatements: false,
    senderWhitelist: [],
    senderBlacklist: [],
    subjectKeywords: [],
    autoProcess: false,
    requireManualReview: true,
  } as EmailFilterConfig);
}

/**
 * Update email filter configuration
 */
export async function updateEmailFilterConfig(
  userId: string,
  config: EmailFilterConfig
): Promise<EmailFilterConfig> {
  const response = await api.put<EmailFilterConfig>(
    `/integrations/email/filter-config`,
    config,
    {
      params: { userId },
    }
  );
  return response.data || config;
}

/**
 * Test Gmail connection
 */
type TestConnectionResponse = {
  success: boolean;
  message: string;
  stats?: {
    totalMessages: number;
    unreadMessages: number;
  };
};

export async function testGmailConnection(connectionId: string): Promise<TestConnectionResponse> {
  const response = await api.get<TestConnectionResponse>('/integrations/gmail/test', {
    params: { connectionId },
  });
  return response.data || { success: false, message: 'Unknown error' };
}

/**
 * Test Outlook connection
 */
export async function testOutlookConnection(
  userId: string,
  orgId: string
): Promise<TestConnectionResponse> {
  const response = await api.get<TestConnectionResponse>('/integrations/outlook/test', {
    params: { userId, orgId },
  });
  return response.data || { success: false, message: 'Unknown error' };
}

/**
 * Test any email connection by ID
 */
export async function testEmailConnection(connectionId: string): Promise<TestConnectionResponse> {
  const response = await api.post<TestConnectionResponse>(
    `/integrations/email/connections/${connectionId}/test`
  );
  return response.data || { success: false, message: 'Unknown error' };
}

/**
 * Search for invoice emails in Gmail
 */
export async function searchGmailInvoices(
  connectionId: string,
  options?: {
    since?: string;
    until?: string;
    maxResults?: number;
  }
): Promise<{ messages: any[]; totalResults: number }> {
  const response = await api.get<{ messages: any[]; totalResults: number }>('/integrations/gmail/search/invoices', {
    params: { connectionId, ...options },
  });
  return response.data || { messages: [], totalResults: 0 };
}

/**
 * Search for invoice emails in Outlook
 */
export async function searchOutlookInvoices(
  userId: string,
  orgId: string,
  options?: {
    since?: string;
    until?: string;
    maxResults?: number;
  }
): Promise<{ messages: any[]; count: number }> {
  const response = await api.get<{ messages: any[]; count: number }>('/integrations/outlook/search/invoices', {
    params: { userId, orgId, ...options },
  });
  return response.data || { messages: [], count: 0 };
}

/**
 * Get sync history for a connection
 */
type SyncHistoryResponse = {
  syncs: Array<{
    id: string;
    startedAt: string;
    completedAt?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    processedEmails: number;
    foundInvoices: number;
    error?: string;
  }>;
  total: number;
};

export async function getSyncHistory(
  connectionId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<SyncHistoryResponse> {
  const response = await api.get<SyncHistoryResponse>(
    `/integrations/email/connections/${connectionId}/sync/history`,
    {
      params: options,
    }
  );
  return response.data || { syncs: [], total: 0 };
}

/**
 * Reconnect an email connection (refresh OAuth token)
 */
export async function reconnectEmail(
  connectionId: string
): Promise<{ authUrl: string; state: string }> {
  const response = await api.post<{ authUrl: string; state: string }>(
    `/integrations/email/connections/${connectionId}/reconnect`
  );
  return response.data || { authUrl: '', state: '' };
}

/**
 * Get email connection statistics
 */
type EmailConnectionStatsResponse = {
  totalEmailsProcessed: number;
  invoicesFound: number;
  receiptsFound: number;
  lastSyncDuration?: number;
  averageSyncDuration?: number;
  syncSuccessRate?: number;
};

export async function getEmailConnectionStats(connectionId: string): Promise<EmailConnectionStatsResponse> {
  const response = await api.get<EmailConnectionStatsResponse>(
    `/integrations/email/connections/${connectionId}/stats`
  );
  return response.data || {
    totalEmailsProcessed: 0,
    invoicesFound: 0,
    receiptsFound: 0,
  };
}
