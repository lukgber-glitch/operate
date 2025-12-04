'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getGmailAuthUrl,
  getOutlookAuthUrl,
  getGmailStatus,
  getOutlookStatus,
  disconnectGmail,
  disconnectOutlook,
  type EmailConnectionStatus,
} from '@/lib/api/email-integrations';

export type EmailProvider = 'gmail' | 'outlook';

export interface EmailConnection {
  provider: EmailProvider;
  status: EmailConnectionStatus;
  isConnecting: boolean;
  error: string | null;
}

export interface UseEmailConnectionOptions {
  userId: string;
  orgId: string;
  onConnectionSuccess?: (provider: EmailProvider, email: string) => void;
  onConnectionError?: (provider: EmailProvider, error: string) => void;
}

export function useEmailConnection({
  userId,
  orgId,
  onConnectionSuccess,
  onConnectionError,
}: UseEmailConnectionOptions) {
  const [connections, setConnections] = useState<
    Record<EmailProvider, EmailConnection>
  >({
    gmail: {
      provider: 'gmail',
      status: { connected: false },
      isConnecting: false,
      error: null,
    },
    outlook: {
      provider: 'outlook',
      status: { connected: false },
      isConnecting: false,
      error: null,
    },
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load initial connection statuses
  const loadConnectionStatuses = useCallback(async () => {
    setIsLoading(true);
    try {
      const [gmailStatus, outlookStatus] = await Promise.all([
        getGmailStatus(userId),
        getOutlookStatus(userId, orgId),
      ]);

      setConnections((prev) => ({
        gmail: {
          ...prev.gmail,
          status: gmailStatus,
        },
        outlook: {
          ...prev.outlook,
          status: outlookStatus,
        },
      }));
    } catch (error) {
      console.error('Failed to load email connection statuses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, orgId]);

  useEffect(() => {
    loadConnectionStatuses();
  }, [loadConnectionStatuses]);

  // Handle OAuth callback from popup/redirect
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'EMAIL_CONNECTION_SUCCESS') {
        const { provider, email } = event.data;
        setConnections((prev) => ({
          ...prev,
          [provider]: {
            ...prev[provider],
            status: { connected: true, provider, email },
            isConnecting: false,
            error: null,
          },
        }));
        onConnectionSuccess?.(provider, email);
      } else if (event.data.type === 'EMAIL_CONNECTION_ERROR') {
        const { provider, error } = event.data;
        setConnections((prev) => ({
          ...prev,
          [provider]: {
            ...prev[provider],
            isConnecting: false,
            error,
          },
        }));
        onConnectionError?.(provider, error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onConnectionSuccess, onConnectionError]);

  /**
   * Connect to Gmail
   */
  const connectGmail = useCallback(async () => {
    setConnections((prev) => ({
      ...prev,
      gmail: {
        ...prev.gmail,
        isConnecting: true,
        error: null,
      },
    }));

    try {
      const { authUrl } = await getGmailAuthUrl(userId, orgId);

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        'Gmail Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error(
          'Popup blocked. Please allow popups for this site to connect your email.'
        );
      }

      // Check if popup was closed before completing OAuth
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setConnections((prev) => ({
            ...prev,
            gmail: {
              ...prev.gmail,
              isConnecting: false,
            },
          }));
        }
      }, 1000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to connect Gmail';
      setConnections((prev) => ({
        ...prev,
        gmail: {
          ...prev.gmail,
          isConnecting: false,
          error: errorMessage,
        },
      }));
      onConnectionError?.('gmail', errorMessage);
    }
  }, [userId, orgId, onConnectionError]);

  /**
   * Connect to Outlook
   */
  const connectOutlook = useCallback(async () => {
    setConnections((prev) => ({
      ...prev,
      outlook: {
        ...prev.outlook,
        isConnecting: true,
        error: null,
      },
    }));

    try {
      const { authUrl } = await getOutlookAuthUrl(userId, orgId);

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        'Outlook Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error(
          'Popup blocked. Please allow popups for this site to connect your email.'
        );
      }

      // Check if popup was closed before completing OAuth
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setConnections((prev) => ({
            ...prev,
            outlook: {
              ...prev.outlook,
              isConnecting: false,
            },
          }));
        }
      }, 1000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to connect Outlook';
      setConnections((prev) => ({
        ...prev,
        outlook: {
          ...prev.outlook,
          isConnecting: false,
          error: errorMessage,
        },
      }));
      onConnectionError?.('outlook', errorMessage);
    }
  }, [userId, orgId, onConnectionError]);

  /**
   * Disconnect Gmail
   */
  const disconnectGmailConnection = useCallback(async () => {
    const connectionId = connections.gmail.status.email; // Simplified, should use actual connection ID
    if (!connectionId) return;

    try {
      await disconnectGmail(connectionId);
      setConnections((prev) => ({
        ...prev,
        gmail: {
          provider: 'gmail',
          status: { connected: false },
          isConnecting: false,
          error: null,
        },
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to disconnect Gmail';
      setConnections((prev) => ({
        ...prev,
        gmail: {
          ...prev.gmail,
          error: errorMessage,
        },
      }));
    }
  }, [connections.gmail.status.email]);

  /**
   * Disconnect Outlook
   */
  const disconnectOutlookConnection = useCallback(async () => {
    try {
      await disconnectOutlook(userId, orgId);
      setConnections((prev) => ({
        ...prev,
        outlook: {
          provider: 'outlook',
          status: { connected: false },
          isConnecting: false,
          error: null,
        },
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to disconnect Outlook';
      setConnections((prev) => ({
        ...prev,
        outlook: {
          ...prev.outlook,
          error: errorMessage,
        },
      }));
    }
  }, [userId, orgId]);

  /**
   * Refresh connection statuses
   */
  const refresh = useCallback(() => {
    loadConnectionStatuses();
  }, [loadConnectionStatuses]);

  return {
    gmail: connections.gmail,
    outlook: connections.outlook,
    isLoading,
    connectGmail,
    connectOutlook,
    disconnectGmail: disconnectGmailConnection,
    disconnectOutlook: disconnectOutlookConnection,
    refresh,
  };
}
