'use client';

import { Plus, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { useBankConnections } from '@/hooks/use-bank-connections';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';

import { BankAccountList } from './components/BankAccountList';
import { BankConnectionCard } from './components/BankConnectionCard';
import { ConnectBankModal } from './components/ConnectBankModal';

export default function BankAccountsPage() {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const {
    connections,
    isLoading,
    error,
    fetchConnections,
    startConnection,
    syncConnection,
    disconnectConnection,
    reauthConnection,
  } = useBankConnections();

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleConnect = async (country: string, bankId: string) => {
    try {
      const redirectUrl = `${window.location.origin}/finance/bank-accounts/callback`;
      const response = await startConnection({
        provider: 'TINK',
        country,
        bankId,
        redirectUrl,
      });

      // Redirect to bank's OAuth page
      window.location.href = response.authorizationUrl;
    } catch (error) {
      console.error('Failed to start connection:', error);
    }
  };

  const handleSync = async (connectionId: string) => {
    await syncConnection(connectionId);
  };

  const handleDisconnect = async (connectionId: string) => {
    await disconnectConnection(connectionId);
  };

  const handleReauth = async (connectionId: string) => {
    try {
      const redirectUrl = `${window.location.origin}/finance/bank-accounts/callback`;
      const response = await reauthConnection(connectionId, redirectUrl);

      // Redirect to bank's OAuth page
      window.location.href = response.authorizationUrl;
    } catch (error) {
      console.error('Failed to re-authenticate:', error);
    }
  };

  const activeConnections = connections.filter(
    (c) => c.status !== 'DISCONNECTED'
  );

  const needsAttention = connections.filter(
    (c) => c.status === 'ERROR' || c.status === 'NEEDS_REAUTH'
  );

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
          <p className="text-white/70">
            Connect and manage your business bank accounts
          </p>
        </div>

        <Button onClick={() => setIsConnectModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Connect Bank
        </Button>
      </motion.div>

      {/* Alerts */}
      {needsAttention.length > 0 && (
        <motion.div variants={fadeUp}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Attention Required</AlertTitle>
            <AlertDescription>
              {needsAttention.length} bank connection{needsAttention.length !== 1 ? 's' : ''}{' '}
              {needsAttention.length !== 1 ? 'need' : 'needs'} your attention.
              Please re-authenticate or check for errors.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && connections.length === 0 && (
        <GlassCard padding="lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-white/70">
                Loading bank accounts...
              </p>
            </div>
        </GlassCard>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <GlassCard padding="lg">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
              <p className="text-sm text-red-400 mb-4">
                {error}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchConnections()}
              >
                Try Again
              </Button>
            </div>
        </GlassCard>
      )}

      {/* Empty State */}
      {!isLoading && !error && activeConnections.length === 0 && (
        <GlassCard padding="lg">
            <div className="rounded-full bg-white/10 p-4 mb-4">
              <Plus className="h-8 w-8 text-white/70" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              No bank accounts connected
            </h3>
            <p className="text-white/70 mb-4 max-w-sm">
              Connect your business bank accounts to automatically sync
              transactions and manage your finances in one place.
            </p>
            <Button onClick={() => setIsConnectModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Connect Your First Bank
            </Button>
        </GlassCard>
      )}

      {/* Bank Connections */}
      {!isLoading && activeConnections.length > 0 && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {activeConnections.map((connection) => (
              <motion.div key={connection.id} variants={fadeUp}>
                <BankConnectionCard
                  connection={connection}
                  onSync={handleSync}
                  onDisconnect={handleDisconnect}
                  onReauth={handleReauth}
                />
              </motion.div>
            ))}
          </div>

          {/* Account Lists */}
          <div className="space-y-4">
            {activeConnections.map((connection) => (
              <motion.div key={connection.id} variants={fadeUp}>
                <BankAccountList connection={connection} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Connect Bank Modal */}
      <ConnectBankModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnect={handleConnect}
      />
    </motion.div>
  );
}
