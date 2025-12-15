'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// ============================================
// Types
// ============================================

interface ChatErrorBoundaryProps {
  children: ReactNode;
  /** Fallback UI to render on error */
  fallback?: ReactNode;
  /** Called when an error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Called when reset is triggered */
  onReset?: () => void;
}

interface ChatErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================
// Error Classification
// ============================================

interface ClassifiedError {
  title: string;
  message: string;
  suggestion: string;
  isRecoverable: boolean;
}

function classifyError(error: Error): ClassifiedError {
  const message = error.message.toLowerCase();

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return {
      title: 'Connection Issue',
      message: 'Unable to connect to the AI service.',
      suggestion: 'Please check your internet connection and try again.',
      isRecoverable: true,
    };
  }

  // Rate limiting
  if (message.includes('rate limit') || message.includes('too many')) {
    return {
      title: 'Rate Limit Reached',
      message: 'You\'ve sent too many messages too quickly.',
      suggestion: 'Please wait a moment before sending more messages.',
      isRecoverable: true,
    };
  }

  // Authentication errors
  if (message.includes('auth') || message.includes('unauthorized') || message.includes('401')) {
    return {
      title: 'Session Expired',
      message: 'Your session has expired.',
      suggestion: 'Please refresh the page to log in again.',
      isRecoverable: false,
    };
  }

  // Subscription/limit errors
  if (message.includes('limit') || message.includes('subscription') || message.includes('upgrade')) {
    return {
      title: 'Usage Limit Reached',
      message: 'You\'ve reached your AI message limit for this period.',
      suggestion: 'Consider upgrading your plan for more messages.',
      isRecoverable: false,
    };
  }

  // Default error
  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred in the chat.',
    suggestion: 'Try refreshing the page or starting a new conversation.',
    isRecoverable: true,
  };
}

// ============================================
// Error Boundary Component
// ============================================

/**
 * ChatErrorBoundary - Catches errors in chat components
 *
 * Features:
 * - Graceful error display with helpful messages
 * - Error classification for user-friendly messages
 * - Reset functionality to recover from errors
 * - Optional custom fallback UI
 * - Error reporting callback
 */
export class ChatErrorBoundary extends Component<ChatErrorBoundaryProps, ChatErrorBoundaryState> {
  constructor(props: ChatErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ChatErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Report error to callback
    this.props.onError?.(error, errorInfo);

    // Log error for debugging
    console.error('ChatErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  handleRefresh = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    // Use custom fallback if provided
    if (fallback) {
      return fallback;
    }

    // Classify error for user-friendly message
    const classified = error ? classifyError(error) : {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred.',
      suggestion: 'Try refreshing the page.',
      isRecoverable: true,
    };

    return (
      <div className="flex items-center justify-center min-h-[300px] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-lg">{classified.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-2">
            <p className="text-muted-foreground">{classified.message}</p>
            <p className="text-sm text-muted-foreground">{classified.suggestion}</p>
          </CardContent>
          <CardFooter className="flex justify-center gap-2">
            {classified.isRecoverable ? (
              <Button onClick={this.handleReset} variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            ) : (
              <Button onClick={this.handleRefresh} variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }
}

// ============================================
// Hook for Error Handling
// ============================================

/**
 * Custom hook to handle chat errors gracefully
 */
export function useChatErrorHandler() {
  const handleError = (error: Error, errorInfo: ErrorInfo): void => {
    // Could send to error tracking service here
    console.error('Chat error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  };

  const handleReset = (): void => {
    // Could clear chat state here
    console.log('Chat error boundary reset');
  };

  return {
    handleError,
    handleReset,
  };
}

export default ChatErrorBoundary;
