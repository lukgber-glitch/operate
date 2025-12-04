import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface EmailProviderCardProps {
  provider: 'gmail' | 'outlook';
  name: string;
  description: string;
  logo?: React.ReactNode;
  status: 'disconnected' | 'connected' | 'connecting' | 'error';
  email?: string;
  lastSync?: string;
  error?: string | null;
  recommended?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const PROVIDER_COLORS = {
  gmail: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
  },
  outlook: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
  },
};

export function EmailProviderCard({
  provider,
  name,
  description,
  logo,
  status,
  email,
  lastSync,
  error,
  recommended,
  onConnect,
  onDisconnect,
}: EmailProviderCardProps) {
  const colors = PROVIDER_COLORS[provider];
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  const hasError = status === 'error';

  const formatLastSync = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return null;
    }
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-md',
        isConnected && `${colors.border} border-2`,
        hasError && 'border-destructive/50'
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div
            className={cn(
              'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
              isConnected ? colors.bg : 'bg-muted'
            )}
          >
            {logo || <Mail className={cn('w-7 h-7', colors.icon)} />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base">{name}</h3>
                {recommended && !isConnected && (
                  <Badge variant="secondary" className="text-xs">
                    Popular
                  </Badge>
                )}
                {isConnected && (
                  <Badge className={cn('text-xs', colors.badge)}>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {description}
            </p>

            {/* Connected State */}
            {isConnected && email && (
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium truncate">{email}</span>
                </div>
                {lastSync && (
                  <div className="text-xs text-muted-foreground">
                    Last synced: {formatLastSync(lastSync)}
                  </div>
                )}
              </div>
            )}

            {/* Error State */}
            {hasError && error && (
              <div className="flex items-start gap-2 p-3 mb-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {isConnected ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDisconnect}
                    className="flex-1"
                  >
                    Disconnect
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onConnect}
                    className="flex-1"
                  >
                    Reconnect
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onConnect}
                  disabled={isConnecting}
                  className="flex-1"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
