'use client';

import * as Sentry from '@sentry/nextjs';
import { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  eventId?: string;
}

/**
 * Error boundary component that catches React errors and reports them to Sentry
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture the error in Sentry with additional context
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    this.setState({ eventId });
  }

  handleReset = () => {
    this.setState({ hasError: false, eventId: undefined });
  };

  handleReport = () => {
    if (this.state.eventId) {
      Sentry.showReportDialog({ eventId: this.state.eventId });
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Etwas ist schief gelaufen</CardTitle>
              </div>
              <CardDescription>
                Ein unerwarteter Fehler ist aufgetreten. Wir wurden automatisch benachrichtigt und werden das Problem beheben.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sie können versuchen, die Seite neu zu laden oder zum Dashboard zurückzukehren.
              </p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline">
                Erneut versuchen
              </Button>
              <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
                Zum Dashboard
              </Button>
              {this.state.eventId && (
                <Button onClick={this.handleReport} variant="secondary">
                  Fehler melden
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
