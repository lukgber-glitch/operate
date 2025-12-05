'use client';

import { RefreshCw, Unplug, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BankConnection } from '@/lib/api/bank-connections';

interface BankConnectionCardProps {
  connection: BankConnection;
  onSync: (connectionId: string) => Promise<void>;
  onDisconnect: (connectionId: string) => Promise<void>;
  onReauth: (connectionId: string) => Promise<void>;
}

const statusConfig = {
  ACTIVE: {
    icon: CheckCircle2,
    label: 'Active',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  ERROR: {
    icon: XCircle,
    label: 'Error',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  NEEDS_REAUTH: {
    icon: AlertCircle,
    label: 'Needs Re-auth',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  DISCONNECTED: {
    icon: XCircle,
    label: 'Disconnected',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  },
};

export function BankConnectionCard({
  connection,
  onSync,
  onDisconnect,
  onReauth,
}: BankConnectionCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync(connection.id);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this bank account?')) {
      return;
    }
    setIsDisconnecting(true);
    try {
      await onDisconnect(connection.id);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleReauth = async () => {
    await onReauth(connection.id);
  };

  const statusInfo = statusConfig[connection.status];
  const StatusIcon = statusInfo.icon;

  const totalBalance = connection.accounts.reduce(
    (sum, account) => sum + account.balance,
    0
  );

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('de-DE', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex items-start gap-4">
          {connection.bankLogo ? (
            <img
              src={connection.bankLogo}
              alt={connection.bankName}
              className="h-12 w-12 rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-lg font-semibold text-primary">
                {connection.bankName.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-lg">{connection.bankName}</h3>
            <p className="text-sm text-muted-foreground">
              {connection.accounts.length} account{connection.accounts.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className={statusInfo.className}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {statusInfo.label}
              </Badge>
              <Badge variant="outline">{connection.provider}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-2xl font-bold">
              {formatCurrency(totalBalance, connection.accounts[0]?.currency || 'EUR')}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Synced</p>
            <p className="text-sm font-medium">{formatDate(connection.lastSyncAt)}</p>
          </div>
        </div>

        {connection.status === 'ERROR' && connection.errorMessage && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
            <p className="text-sm text-red-800 dark:text-red-400">
              {connection.errorMessage}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {connection.status === 'ACTIVE' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Button>
          )}

          {(connection.status === 'NEEDS_REAUTH' || connection.status === 'ERROR') && (
            <Button
              variant="default"
              size="sm"
              onClick={handleReauth}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Re-authenticate
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <Unplug className="mr-2 h-4 w-4" />
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
