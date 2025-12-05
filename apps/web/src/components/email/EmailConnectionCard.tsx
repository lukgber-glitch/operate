'use client';

import { Mail, CheckCircle2, XCircle, AlertCircle, Settings, Trash2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export interface EmailConnection {
  id: string;
  provider: 'gmail' | 'outlook';
  email: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync?: string;
  expiresAt?: string;
  syncedEmailCount?: number;
  error?: string;
}

interface EmailConnectionCardProps {
  connection: EmailConnection;
  onDisconnect: (id: string) => void;
  onReconnect: (id: string) => void;
  onSync: (id: string) => void;
  onSettings: (id: string) => void;
}

export function EmailConnectionCard({
  connection,
  onDisconnect,
  onReconnect,
  onSync,
  onSettings,
}: EmailConnectionCardProps) {
  const getStatusBadge = () => {
    switch (connection.status) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Connected
          </Badge>
        );
      case 'syncing':
        return (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
            <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
            Syncing
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Error
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="secondary">
            <XCircle className="mr-1 h-3 w-3" />
            Disconnected
          </Badge>
        );
    }
  };

  const getProviderName = () => {
    return connection.provider === 'gmail' ? 'Gmail' : 'Outlook';
  };

  const getProviderColor = () => {
    return connection.provider === 'gmail' ? 'text-red-500' : 'text-blue-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`rounded-lg bg-muted p-2 ${getProviderColor()}`}>
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{getProviderName()}</CardTitle>
              <CardDescription className="mt-1">{connection.email}</CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Sync Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {connection.lastSync && (
              <div>
                <p className="text-muted-foreground">Last Sync</p>
                <p className="font-medium">
                  {formatDistanceToNow(new Date(connection.lastSync), { addSuffix: true })}
                </p>
              </div>
            )}
            {connection.syncedEmailCount !== undefined && (
              <div>
                <p className="text-muted-foreground">Emails Processed</p>
                <p className="font-medium">{connection.syncedEmailCount.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {connection.error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {connection.error}
            </div>
          )}

          {/* Expiration Warning */}
          {connection.expiresAt && connection.status === 'connected' && (
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>
                  Token expires {formatDistanceToNow(new Date(connection.expiresAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {(connection.status === 'connected' || connection.status === 'syncing') && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSync(connection.id)}
                  disabled={connection.status === 'syncing'}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${connection.status === 'syncing' ? 'animate-spin' : ''}`} />
                  Sync Now
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSettings(connection.id)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </>
            )}
            {(connection.status === 'error' || connection.status === 'disconnected') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReconnect(connection.id)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reconnect
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDisconnect(connection.id)}
              className="ml-auto text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
