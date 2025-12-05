# API Error Handling & Loading States

This directory contains the centralized error handling utilities and patterns for the application.

## Error Handling

### Error Handler Utility (`error-handler.ts`)

The `ApiErrorHandler` class provides centralized error parsing and user-friendly messages for all API errors.

#### Features:
- Parses HTTP status codes and provides user-friendly messages
- Handles network errors
- Identifies authentication and permission errors
- Supports validation error detection
- Provides logging utilities

#### Usage in Hooks:

```typescript
import { handleApiError } from '@/lib/api/error-handler';

try {
  const data = await api.get('/endpoint');
  // ... handle success
} catch (error) {
  const errorMessage = handleApiError(error);
  setError(errorMessage);
  toast({
    title: 'Error',
    description: errorMessage,
    variant: 'destructive',
  });
}
```

#### Helper Methods:

```typescript
import { ApiErrorHandler } from '@/lib/api/error-handler';

// Check error types
if (ApiErrorHandler.isAuthError(error)) {
  // Redirect to login
}

if (ApiErrorHandler.isNetworkError(error)) {
  // Show offline message
}

// Format for logging
console.error(ApiErrorHandler.formatForLogging(error, 'UserContext'));
```

### API Client (`client.ts`)

The API client automatically wraps all errors in `ApiClientError` with structured information:

```typescript
class ApiClientError extends Error {
  message: string;  // User-friendly message
  status?: number;  // HTTP status code
  code?: string;    // Error code (e.g., 'HTTP_404')
  details?: any;    // Additional error details from API
}
```

## Loading Components

### Available Components:

#### 1. TableSkeleton
For data tables with customizable rows and columns:

```typescript
import { TableSkeleton } from '@/components/loading';

<TableSkeleton rows={10} columns={5} showHeader={true} />
```

#### 2. CardSkeleton
For stat cards and info cards:

```typescript
import { CardSkeleton, StatCardSkeleton, CardSkeletonGrid } from '@/components/loading';

// Single card
<CardSkeleton showHeader={true} lines={3} />

// Stat card
<StatCardSkeleton />

// Grid of cards
<CardSkeletonGrid count={4} variant="stat" />
```

#### 3. PageLoader
Full page loading states:

```typescript
import { PageLoader, Spinner, DashboardPageSkeleton } from '@/components/loading';

// Simple spinner
<PageLoader />

// Inline spinner
<Spinner size="md" />

// Complete dashboard skeleton
<DashboardPageSkeleton />
```

### Usage in Pages:

```typescript
'use client';

import { useInvoices } from '@/hooks/use-invoices';
import { TableSkeleton } from '@/components/loading';
import { ApiError } from '@/components/error';

export default function InvoicesPage() {
  const { invoices, isLoading, error, fetchInvoices } = useInvoices();

  if (isLoading) {
    return <TableSkeleton rows={10} columns={6} />;
  }

  if (error) {
    return <ApiError error={error} onRetry={fetchInvoices} />;
  }

  return (
    // ... render invoices
  );
}
```

## Error Display Components

### Available Components:

#### 1. ApiError
Display API errors with retry functionality:

```typescript
import { ApiError } from '@/components/error';

// Card variant (default)
<ApiError error={error} onRetry={handleRetry} variant="card" />

// Alert variant
<ApiError error={error} onRetry={handleRetry} variant="alert" />

// Inline variant
<ApiError error={error} onRetry={handleRetry} variant="inline" />
```

#### 2. ErrorMessage
Compact error display for tables and lists:

```typescript
import { ErrorMessage } from '@/components/error';

<ErrorMessage error={error} onRetry={handleRetry} />
```

#### 3. EmptyState
Display when no data is available:

```typescript
import { EmptyState } from '@/components/error';

<EmptyState
  title="No invoices found"
  description="Create your first invoice to get started."
  action={{
    label: "Create Invoice",
    onClick: handleCreate
  }}
/>
```

#### 4. ErrorBoundary
Catch React errors in component trees:

```typescript
import { ErrorBoundary } from '@/components/error';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## Hook Pattern

All hooks follow a consistent pattern:

```typescript
export function useResource(initialFilters?: Filters) {
  const { toast } = useToast();
  const [state, setState] = useState({
    data: [],
    isLoading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.get('/endpoint');
      setState({
        data: response.data,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const createItem = useCallback(async (data: CreateRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const item = await api.create(data);
      setState(prev => ({
        ...prev,
        data: [item, ...prev.data],
        isLoading: false,
      }));
      toast({
        title: 'Success',
        description: 'Item created successfully',
      });
      return item;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  return {
    ...state,
    fetchData,
    createItem,
  };
}
```

## Best Practices

### 1. Always use `handleApiError()` for consistency
```typescript
// Good
const errorMessage = handleApiError(error);

// Bad
const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
```

### 2. Show toast notifications for user actions
```typescript
// Create, Update, Delete operations
toast({
  title: 'Success',
  description: 'Operation completed successfully',
});
```

### 3. Don't show toast for initial data fetching
```typescript
// Good - error is available in hook state for UI to display
setState({ error: errorMessage });

// Avoid - don't toast on page load errors
// toast({ title: 'Error', description: errorMessage });
```

### 4. Provide retry functionality
```typescript
<ApiError error={error} onRetry={() => fetchData()} />
```

### 5. Use appropriate loading states
```typescript
// Full page
if (isLoading && !data.length) return <DashboardPageSkeleton />;

// Partial update
if (isLoading) return <Spinner />;

// Table
if (isLoading) return <TableSkeleton />;
```

## Error Message Customization

Default messages are provided for common HTTP status codes:

- 400: "Invalid request. Please check your input and try again."
- 401: "Your session has expired. Please log in again."
- 403: "You do not have permission to perform this action."
- 404: "The requested resource was not found."
- 500: "Server error. Our team has been notified."
- Network: "Network error. Please check your internet connection."

To customize messages, modify the `getStatusMessage()` method in `error-handler.ts`.
