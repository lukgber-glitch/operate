# Error Handling & Loading States - Quick Reference

## Import Statements

```typescript
// Error handling
import { handleApiError } from '@/lib/api/error-handler';
import { useToast } from '@/components/ui/use-toast';

// Loading components
import { TableSkeleton, CardSkeletonGrid, DashboardPageSkeleton, Spinner } from '@/components/loading';

// Error display
import { ApiError, ErrorMessage, EmptyState, ErrorBoundary } from '@/components/error';
```

## Common Patterns

### 1. Hook Error Handling

```typescript
const { toast } = useToast();

try {
  const result = await api.action(data);
  toast({
    title: 'Success',
    description: 'Operation completed successfully'
  });
  return result;
} catch (error) {
  const errorMessage = handleApiError(error);
  setState({ error: errorMessage });
  toast({
    title: 'Error',
    description: errorMessage,
    variant: 'destructive'
  });
  throw error;
}
```

### 2. Page Component with Loading/Error

```typescript
export default function MyPage() {
  const { data, isLoading, error, fetchData } = useMyHook();

  if (isLoading) return <DashboardPageSkeleton />;
  if (error) return <ApiError error={error} onRetry={fetchData} />;
  if (!data.length) return <EmptyState title="No data" />;

  return <MyContent data={data} />;
}
```

### 3. Table with Loading State

```typescript
{isLoading ? (
  <TableSkeleton rows={10} columns={5} />
) : (
  <Table>
    {/* ... table content */}
  </Table>
)}
```

### 4. Stats Cards with Loading

```typescript
{isLoading ? (
  <CardSkeletonGrid count={4} variant="stat" />
) : (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {stats.map(stat => <StatCard key={stat.id} {...stat} />)}
  </div>
)}
```

### 5. Inline Error Message

```typescript
{error && <ErrorMessage error={error} onRetry={retry} />}
```

### 6. Error Boundary

```typescript
<ErrorBoundary>
  <ComponentThatMightError />
</ErrorBoundary>
```

## Loading Components

| Component | Use Case | Props |
|-----------|----------|-------|
| `<TableSkeleton />` | Data tables | rows, columns, showHeader |
| `<CardSkeleton />` | Info cards | showHeader, lines |
| `<StatCardSkeleton />` | Metric cards | none |
| `<CardSkeletonGrid />` | Multiple cards | count, variant |
| `<PageLoader />` | Full page | none |
| `<Spinner />` | Inline loading | size (sm/md/lg) |
| `<DashboardPageSkeleton />` | Dashboard | none |
| `<FormPageSkeleton />` | Form pages | none |

## Error Display Variants

| Variant | Use Case | Example |
|---------|----------|---------|
| `card` | Standalone error display | Error page, modal |
| `alert` | Inline notification | Top of form, section |
| `inline` | Compact error | Table row, list item |

## Error Types

```typescript
// Check error type
if (ApiErrorHandler.isAuthError(error)) { /* redirect */ }
if (ApiErrorHandler.isNetworkError(error)) { /* offline */ }
if (ApiErrorHandler.isPermissionError(error)) { /* forbidden */ }
if (ApiErrorHandler.isValidationError(error)) { /* form */ }
```

## Spinner Sizes

```typescript
<Spinner size="sm" />   // 16px - Inline text
<Spinner size="md" />   // 32px - Default
<Spinner size="lg" />   // 48px - Full screen
```

## Empty State

```typescript
<EmptyState
  title="No invoices found"
  description="Create your first invoice to get started."
  action={{
    label: "Create Invoice",
    onClick: () => navigate('/invoices/new')
  }}
  icon={<FileText className="h-12 w-12" />}
/>
```

## Best Practices

1. **Always use `handleApiError()`** for consistent messages
2. **Show toast for user actions** (create, update, delete)
3. **Don't show toast for initial fetch** - use error state instead
4. **Provide retry functionality** when appropriate
5. **Match skeleton to content** - same layout and structure
6. **Use Error Boundary** around major sections
7. **Clear error on retry** - reset error state before new attempt

## Anti-Patterns (Don't Do This)

```typescript
// ❌ Don't parse errors manually
error instanceof Error ? error.message : 'Failed'

// ✅ Do use handleApiError
const errorMessage = handleApiError(error);

// ❌ Don't use generic loading text
<div>Loading...</div>

// ✅ Do use skeleton components
<TableSkeleton />

// ❌ Don't show ugly error text
<div>{error}</div>

// ✅ Do use error components
<ApiError error={error} onRetry={retry} />
```

## HTTP Status Quick Reference

| Code | User Message | Action |
|------|--------------|--------|
| 401 | Session expired | Redirect to login |
| 403 | Permission denied | Show error, disable action |
| 404 | Not found | Show error, go back |
| 422 | Validation failed | Highlight form errors |
| 500 | Server error | Show error, retry |
| Network | Connection error | Show offline, retry |

## Example: Complete Data Table Page

```typescript
'use client';

import { useInvoices } from '@/hooks/use-invoices';
import { TableSkeleton } from '@/components/loading';
import { ApiError, EmptyState } from '@/components/error';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

export default function InvoicesPage() {
  const {
    invoices,
    isLoading,
    error,
    fetchInvoices
  } = useInvoices();

  // Loading state
  if (isLoading && !invoices.length) {
    return (
      <div className="space-y-4">
        <h1>Invoices</h1>
        <TableSkeleton rows={10} columns={6} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <h1>Invoices</h1>
        <ApiError
          error={error}
          onRetry={fetchInvoices}
          variant="card"
        />
      </div>
    );
  }

  // Empty state
  if (!invoices.length) {
    return (
      <div className="space-y-4">
        <h1>Invoices</h1>
        <EmptyState
          title="No invoices yet"
          description="Create your first invoice to get started."
          action={{
            label: "Create Invoice",
            onClick: () => router.push('/invoices/new')
          }}
          icon={<FileText className="h-12 w-12" />}
        />
      </div>
    );
  }

  // Success state
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1>Invoices</h1>
        <Button onClick={() => router.push('/invoices/new')}>
          Create Invoice
        </Button>
      </div>

      <InvoiceTable data={invoices} />
    </div>
  );
}
```

## Need More Help?

See full documentation: `src/lib/api/README.md`
