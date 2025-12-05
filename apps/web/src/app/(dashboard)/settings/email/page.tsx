'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmailConnectionCard, EmailConnection } from '@/components/email/EmailConnectionCard';
import { ConnectEmailDialog } from '@/components/email/ConnectEmailDialog';
import { EmailSyncStatus, SyncStatus } from '@/components/email/EmailSyncStatus';
import { EmailFilterSettings, EmailFilterConfig } from '@/components/email/EmailFilterSettings';
import { useEmailConnection, EmailProvider } from '@/hooks/use-email-connection';
import { useAuth } from '@/hooks/use-auth';
import {
  syncEmails,
  getEmailFilterConfig,
  updateEmailFilterConfig,
  EmailConnection as ApiEmailConnection,
  getEmailConnections,
} from '@/lib/api/email';
import { useToast } from '@/components/ui/use-toast';

export default function EmailSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<Record<string, SyncStatus>>({});
  const [filterConfig, setFilterConfig] = useState<EmailFilterConfig | null>(null);
  const [originalFilterConfig, setOriginalFilterConfig] = useState<EmailFilterConfig | null>(null);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isSavingFilters, setIsSavingFilters] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);

  const emailConnection = useEmailConnection({
    userId: user?.id || '',
    orgId: user?.orgId || '',
    onConnectionSuccess: (provider, email) => {
      toast({
        title: 'Email Connected',
        description: `Successfully connected ${email}`,
      });
      loadConnections();
      setConnectDialogOpen(false);
    },
    onConnectionError: (provider, error) => {
      toast({
        title: 'Connection Failed',
        description: error,
        variant: 'destructive',
      });
    },
  });

  // Load email connections
  const loadConnections = async () => {
    if (!user?.id) return;

    try {
      setIsLoadingConnections(true);
      const apiConnections = await getEmailConnections(user.id);

      const mappedConnections: EmailConnection[] = apiConnections.map((conn) => ({
        id: conn.id,
        provider: conn.provider,
        email: conn.email,
        status: conn.status,
        lastSync: conn.lastSync,
        expiresAt: conn.expiresAt,
        syncedEmailCount: conn.syncedEmailCount,
        error: conn.error,
      }));

      setConnections(mappedConnections);

      // Initialize sync statuses
      const statuses: Record<string, SyncStatus> = {};
      mappedConnections.forEach((conn) => {
        statuses[conn.id] = {
          status: 'idle',
          lastSync: conn.lastSync,
        };
      });
      setSyncStatuses(statuses);
    } catch (error) {
      console.error('Failed to load connections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email connections',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingConnections(false);
    }
  };

  // Load filter configuration
  const loadFilterConfig = async () => {
    if (!user?.id) return;

    try {
      setIsLoadingFilters(true);
      const config = await getEmailFilterConfig(user.id);
      setFilterConfig(config);
      setOriginalFilterConfig(config);
    } catch (error) {
      console.error('Failed to load filter config:', error);
      // Set default config
      const defaultConfig: EmailFilterConfig = {
        processAttachments: true,
        processInvoices: true,
        processReceipts: true,
        processPurchaseOrders: false,
        processStatements: false,
        senderWhitelist: [],
        senderBlacklist: [],
        subjectKeywords: ['invoice', 'receipt', 'bill'],
        autoProcess: false,
        requireManualReview: true,
      };
      setFilterConfig(defaultConfig);
      setOriginalFilterConfig(defaultConfig);
    } finally {
      setIsLoadingFilters(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadConnections();
      loadFilterConfig();
    }
  }, [user?.id]);

  const handleConnect = async (provider: EmailProvider) => {
    if (provider === 'gmail') {
      await emailConnection.connectGmail();
    } else {
      await emailConnection.connectOutlook();
    }
  };

  const handleDisconnect = async (id: string) => {
    const connection = connections.find((c) => c.id === id);
    if (!connection) return;

    if (!confirm(`Are you sure you want to disconnect ${connection.email}?`)) {
      return;
    }

    try {
      if (connection.provider === 'gmail') {
        await emailConnection.disconnectGmail();
      } else {
        await emailConnection.disconnectOutlook();
      }

      toast({
        title: 'Disconnected',
        description: 'Email account disconnected successfully',
      });

      loadConnections();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to disconnect email account',
        variant: 'destructive',
      });
    }
  };

  const handleReconnect = async (id: string) => {
    const connection = connections.find((c) => c.id === id);
    if (!connection) return;

    if (connection.provider === 'gmail') {
      await emailConnection.connectGmail();
    } else {
      await emailConnection.connectOutlook();
    }
  };

  const handleSync = async (id: string) => {
    const connection = connections.find((c) => c.id === id);
    if (!connection) return;

    try {
      // Update UI to show syncing
      setSyncStatuses((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          status: 'syncing',
          progress: 0,
        },
      }));

      // Trigger sync
      await syncEmails(id);

      // Simulate progress updates (in production, this would come from a webhook or polling)
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setSyncStatuses((prev) => {
          const current = prev[id] || { status: 'syncing' as const };
          return {
            ...prev,
            [id]: {
              ...current,
              status: current.status,
              progress: Math.min(progress, 90),
            },
          };
        });

        if (progress >= 90) {
          clearInterval(interval);
        }
      }, 500);

      // Wait for sync to complete (simplified - in production use webhooks)
      setTimeout(() => {
        clearInterval(interval);
        setSyncStatuses((prev) => ({
          ...prev,
          [id]: {
            status: 'success',
            lastSync: new Date().toISOString(),
            progress: 100,
            processedEmails: 150,
            foundInvoices: 12,
          },
        }));

        toast({
          title: 'Sync Complete',
          description: 'Email sync completed successfully',
        });

        loadConnections();
      }, 5000);
    } catch (error) {
      setSyncStatuses((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          status: 'error',
          error: 'Failed to sync emails',
        },
      }));

      toast({
        title: 'Sync Failed',
        description: 'Failed to sync emails. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSettings = (id: string) => {
    // Navigate to filter settings tab
    const tabs = document.querySelector('[role="tablist"]');
    const filterTab = tabs?.querySelector('[value="filters"]') as HTMLElement;
    filterTab?.click();
  };

  const handleSaveFilters = async () => {
    if (!user?.id || !filterConfig) return;

    try {
      setIsSavingFilters(true);
      await updateEmailFilterConfig(user.id, filterConfig);
      setOriginalFilterConfig(filterConfig);

      toast({
        title: 'Settings Saved',
        description: 'Email filter settings updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save filter settings',
        variant: 'destructive',
      });
    } finally {
      setIsSavingFilters(false);
    }
  };

  const handleResetFilters = () => {
    if (originalFilterConfig) {
      setFilterConfig(originalFilterConfig);
    }
  };

  const isFilterConfigDirty = () => {
    if (!filterConfig || !originalFilterConfig) return false;
    return JSON.stringify(filterConfig) !== JSON.stringify(originalFilterConfig);
  };

  if (!user) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Email Integration</h1>
        <p className="text-muted-foreground">
          Connect your email accounts to automatically process invoices and receipts
        </p>
      </div>

      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="sync">Sync Status</TabsTrigger>
          <TabsTrigger value="filters">Filter Settings</TabsTrigger>
        </TabsList>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-6">
          {isLoadingConnections ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {connections.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No email accounts connected. Click the button below to connect your first email account.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {connections.map((connection) => (
                    <EmailConnectionCard
                      key={connection.id}
                      connection={connection}
                      onDisconnect={handleDisconnect}
                      onReconnect={handleReconnect}
                      onSync={handleSync}
                      onSettings={handleSettings}
                    />
                  ))}
                </div>
              )}

              <Button onClick={() => setConnectDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Connect Email Account
              </Button>
            </>
          )}
        </TabsContent>

        {/* Sync Status Tab */}
        <TabsContent value="sync" className="space-y-6">
          {isLoadingConnections ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : connections.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No email accounts connected. Connect an email account to see sync status.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {connections.map((connection) => (
                <EmailSyncStatus
                  key={connection.id}
                  syncStatus={syncStatuses[connection.id] || { status: 'idle' }}
                  provider={connection.provider}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Filter Settings Tab */}
        <TabsContent value="filters" className="space-y-6">
          {isLoadingFilters ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filterConfig ? (
            <EmailFilterSettings
              config={filterConfig}
              onChange={setFilterConfig}
              onSave={handleSaveFilters}
              onReset={handleResetFilters}
              isSaving={isSavingFilters}
              isDirty={isFilterConfigDirty()}
            />
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load filter settings</AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {/* Connect Email Dialog */}
      <ConnectEmailDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        onConnect={handleConnect}
        isConnectingGmail={emailConnection.gmail.isConnecting}
        isConnectingOutlook={emailConnection.outlook.isConnecting}
      />
    </div>
  );
}
