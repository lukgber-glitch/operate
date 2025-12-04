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
    return response.data;
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
  return response.data;
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
  return response.data;
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
  return response.data;
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
  return response.data;
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
  return response.data;
}

/**
 * Trigger email sync for a connection
 */
export async function syncEmails(connectionId: string): Promise<SyncResult> {
  const response = await api.post<SyncResult>(
    `/integrations/email/connections/${connectionId}/sync`
  );
  return response.data;
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
  return response.data;
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
  return response.data;
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
  return response.data;
}

/**
 * Test Gmail connection
 */
export async function testGmailConnection(connectionId: string): Promise<{
  success: boolean;
  message: string;
  stats?: {
    totalMessages: number;
    unreadMessages: number;
  };
}> {
  const response = await api.get('/integrations/gmail/test', {
    params: { connectionId },
  });
  return response.data;
}

/**
 * Test Outlook connection
 */
export async function testOutlookConnection(
  userId: string,
  orgId: string
): Promise<{
  success: boolean;
  message: string;
  stats?: {
    totalMessages: number;
    unreadMessages: number;
  };
}> {
  const response = await api.get('/integrations/outlook/test', {
    params: { userId, orgId },
  });
  return response.data;
}

/**
 * Test any email connection by ID
 */
export async function testEmailConnection(connectionId: string): Promise<{
  success: boolean;
  message: string;
  stats?: {
    totalMessages: number;
    unreadMessages: number;
  };
}> {
  const response = await api.post(
    `/integrations/email/connections/${connectionId}/test`
  );
  return response.data;
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
  const response = await api.get('/integrations/gmail/search/invoices', {
    params: { connectionId, ...options },
  });
  return response.data;
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
  const response = await api.get('/integrations/outlook/search/invoices', {
    params: { userId, orgId, ...options },
  });
  return response.data;
}

/**
 * Get sync history for a connection
 */
export async function getSyncHistory(
  connectionId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<{
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
}> {
  const response = await api.get(
    `/integrations/email/connections/${connectionId}/sync/history`,
    {
      params: options,
    }
  );
  return response.data;
}

/**
 * Reconnect an email connection (refresh OAuth token)
 */
export async function reconnectEmail(
  connectionId: string
): Promise<{ authUrl: string; state: string }> {
  const response = await api.post(
    `/integrations/email/connections/${connectionId}/reconnect`
  );
  return response.data;
}

/**
 * Get email connection statistics
 */
export async function getEmailConnectionStats(connectionId: string): Promise<{
  totalEmailsProcessed: number;
  invoicesFound: number;
  receiptsFound: number;
  lastSyncDuration?: number;
  averageSyncDuration?: number;
  syncSuccessRate?: number;
}> {
  const response = await api.get(
    `/integrations/email/connections/${connectionId}/stats`
  );
  return response.data;
}
