'use client';

import { AlertCircle, RefreshCw, WifiOff, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ApiErrorHandler } from '@/lib/api/error-handler';

interface ApiErrorProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  variant?: 'card' | 'alert' | 'inline';
  showDetails?: boolean;
}

/**
 * Display API errors with appropriate styling and retry functionality
 */
export function ApiError({
  error,
  onRetry,
  title = 'Error',
  variant = 'card',
  showDetails = false,
}: ApiErrorProps) {
  const parsed = ApiErrorHandler.parseError(error);
  const isNetworkError = ApiErrorHandler.isNetworkError(error);
  const isAuthError = ApiErrorHandler.isAuthError(error);
  const isPermissionError = ApiErrorHandler.isPermissionError(error);

  const getIcon = () => {
    if (isNetworkError) return <WifiOff className="h-5 w-5" />;
    if (isAuthError || isPermissionError) return <Lock className="h-5 w-5" />;
    return <AlertCircle className="h-5 w-5" />;
  };

  const getTitle = () => {
    if (isNetworkError) return 'Connection Error';
    if (isAuthError) return 'Authentication Required';
    if (isPermissionError) return 'Permission Denied';
    return title;
  };

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-md bg-destructive/10">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">{parsed.message}</p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} size="sm" variant="outline">
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'alert') {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{getTitle()}</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{parsed.message}</span>
          {onRetry && (
            <Button onClick={onRetry} size="sm" variant="outline" className="ml-2">
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Card variant (default)
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          {getIcon()}
          <CardTitle className="text-destructive">{getTitle()}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{parsed.message}</p>
        {showDetails && parsed.status && (
          <p className="text-xs text-muted-foreground mt-2">Error code: {parsed.status}</p>
        )}
      </CardContent>
      {onRetry && (
        <CardFooter>
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * Compact error display for tables and lists
 */
interface ErrorMessageProps {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({ error, onRetry, className = '' }: ErrorMessageProps) {
  const parsed = ApiErrorHandler.parseError(error);

  return (
    <div className={`flex items-center justify-center gap-2 p-4 ${className}`}>
      <AlertCircle className="h-4 w-4 text-destructive" />
      <span className="text-sm text-muted-foreground">{parsed.message}</span>
      {onRetry && (
        <Button onClick={onRetry} size="sm" variant="ghost">
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

/**
 * Empty state when no data is available (not an error, but often shown alongside)
 */
interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

export function EmptyState({
  title = 'No data available',
  description = 'Get started by creating your first item.',
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}
