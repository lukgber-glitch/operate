'use client';

import { CheckCircle2, RefreshCw, AlertCircle, Clock, Mail } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSync?: string;
  progress?: number;
  totalEmails?: number;
  processedEmails?: number;
  foundInvoices?: number;
  error?: string;
  nextSync?: string;
}

interface EmailSyncStatusProps {
  syncStatus: SyncStatus;
  provider?: 'gmail' | 'outlook';
}

export function EmailSyncStatus({ syncStatus, provider }: EmailSyncStatusProps) {
  const getStatusIcon = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return 'Syncing emails...';
      case 'success':
        return 'Sync completed';
      case 'error':
        return 'Sync failed';
      default:
        return 'Ready to sync';
    }
  };

  const getStatusBadge = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
            In Progress
          </Badge>
        );
      case 'success':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            Success
          </Badge>
        );
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Idle</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Sync Status</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Header */}
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div className="flex-1">
            <p className="font-medium">{getStatusText()}</p>
            {syncStatus.lastSync && syncStatus.status !== 'syncing' && (
              <p className="text-sm text-muted-foreground">
                Last synced {formatDistanceToNow(new Date(syncStatus.lastSync), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {syncStatus.status === 'syncing' && syncStatus.progress !== undefined && (
          <div className="space-y-2">
            <Progress value={syncStatus.progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {syncStatus.processedEmails} of {syncStatus.totalEmails} emails processed
            </p>
          </div>
        )}

        {/* Sync Stats */}
        {syncStatus.status !== 'idle' && (
          <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/50 p-3">
            {syncStatus.processedEmails !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Emails Checked</p>
                <p className="text-lg font-semibold">{syncStatus.processedEmails.toLocaleString()}</p>
              </div>
            )}
            {syncStatus.foundInvoices !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Invoices Found</p>
                <p className="text-lg font-semibold flex items-center gap-1">
                  <Mail className="h-4 w-4 text-primary" />
                  {syncStatus.foundInvoices}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {syncStatus.error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm font-medium text-destructive">Error</p>
            <p className="text-sm text-destructive/90">{syncStatus.error}</p>
          </div>
        )}

        {/* Next Sync Info */}
        {syncStatus.nextSync && syncStatus.status !== 'syncing' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Next sync {formatDistanceToNow(new Date(syncStatus.nextSync), { addSuffix: true })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
