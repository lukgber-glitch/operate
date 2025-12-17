/**
 * Email Integrations API Client
 * Handles Gmail and Outlook OAuth connections
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
    { params: { connectionId } }
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
  type TestConnectionResponse = {
    success: boolean;
    message: string;
    stats?: {
      totalMessages: number;
      unreadMessages: number;
    };
  };
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
): Promise<{
  success: boolean;
  message: string;
  stats?: {
    totalMessages: number;
    unreadMessages: number;
  };
}> {
  type TestOutlookResponse = {
    success: boolean;
    message: string;
    stats?: {
      totalMessages: number;
      unreadMessages: number;
    };
  };
  const response = await api.get<TestOutlookResponse>('/integrations/outlook/test', {
    params: { userId, orgId },
  });
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
