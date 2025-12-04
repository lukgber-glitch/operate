'use client';

import { useHMRCConnection, HMRCConnectionStatus as Status } from '@/hooks/useHMRC';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Link2, Unlink } from 'lucide-react';

export function HMRCConnectionStatus() {
  const { connection, isLoading, connect, disconnect, refetch } = useHMRCConnection();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    if (!connection) return null;

    switch (connection.status) {
      case Status.CONNECTED:
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case Status.EXPIRED:
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            <AlertCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      case Status.ERROR:
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <XCircle className="h-3 w-3 mr-1" />
            Disconnected
          </Badge>
        );
    }
  };

  if (!connection?.isConnected) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>HMRC Connection</CardTitle>
              <CardDescription>Connect to HMRC Making Tax Digital</CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Connected</AlertTitle>
            <AlertDescription>
              You need to connect to HMRC Making Tax Digital to submit VAT returns electronically.
            </AlertDescription>
          </Alert>
          <Button onClick={connect} className="mt-4">
            <Link2 className="h-4 w-4 mr-2" />
            Connect to HMRC
          </Button>
        </CardContent>
      </Card>
    );
  }

  const expiresAt = connection.expiresAt ? new Date(connection.expiresAt) : null;
  const isExpiringSoon = expiresAt && expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>HMRC Connection</CardTitle>
            <CardDescription>Making Tax Digital for VAT</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connection.vrn && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">VAT Registration Number</p>
              <p className="text-lg font-semibold">{connection.vrn}</p>
            </div>
          )}
          {connection.organisationName && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Organisation</p>
              <p className="text-lg font-semibold">{connection.organisationName}</p>
            </div>
          )}
          {connection.connectedAt && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Connected Since</p>
              <p className="text-lg font-semibold">
                {new Date(connection.connectedAt).toLocaleDateString('en-GB')}
              </p>
            </div>
          )}
          {expiresAt && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Token Expires</p>
              <p className="text-lg font-semibold">
                {expiresAt.toLocaleDateString('en-GB')}
              </p>
            </div>
          )}
        </div>

        {isExpiringSoon && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Token Expiring Soon</AlertTitle>
            <AlertDescription>
              Your HMRC connection token will expire soon. Please reconnect to maintain access.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
          <Button variant="destructive" size="sm" onClick={disconnect}>
            <Unlink className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
