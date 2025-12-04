# Command Palette Integration Guide

## Quick Start

### Step 1: Install Required Dependencies

```bash
npm install zustand cmdk lucide-react
```

### Step 2: Add to Your Root Layout

```tsx
// app/layout.tsx or app/(dashboard)/layout.tsx
import { CommandPaletteProvider } from '@/components/command-palette';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CommandPaletteProvider>
          {children}
        </CommandPaletteProvider>
      </body>
    </html>
  );
}
```

### Step 3: Use It!

Press `Cmd+K` (Mac) or `Ctrl+K` (Windows) anywhere in your app!

## Advanced Usage

### Opening Command Palette Programmatically

```tsx
import { useCommandPalette } from '@/hooks/useCommandPalette';

function MyButton() {
  const { open } = useCommandPalette();

  return (
    <button onClick={open} className="btn">
      Search <kbd>⌘K</kbd>
    </button>
  );
}
```

### Adding a Search Button to Navbar

```tsx
// components/navbar/Navbar.tsx
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

export function Navbar() {
  const { open } = useCommandPalette();

  return (
    <nav>
      <button
        onClick={open}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-accent"
      >
        <MagnifyingGlassIcon className="h-4 w-4" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="hidden md:inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
    </nav>
  );
}
```

## Connecting to Real APIs

### Step 1: Create API Endpoints

```typescript
// app/api/search/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';

  const invoices = await prisma.invoice.findMany({
    where: {
      OR: [
        { number: { contains: query, mode: 'insensitive' } },
        { client: { name: { contains: query, mode: 'insensitive' } } },
      ],
    },
    include: {
      client: true,
    },
    take: 10,
  });

  return NextResponse.json(invoices);
}
```

### Step 2: Update Search Hook

```typescript
// hooks/useGlobalSearch.ts

// Replace mock implementation with real API call
const searchAPI: SearchAPI = {
  invoices: async (query: string) => {
    try {
      const response = await fetch(`/api/search/invoices?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');

      const invoices = await response.json();

      return invoices.map((invoice: any) => ({
        id: invoice.id,
        title: `Invoice ${invoice.number}`,
        description: `${invoice.client.name} - ${formatCurrency(invoice.amount)}`,
        category: 'invoices',
        url: `/invoices/${invoice.id}`,
        metadata: {
          status: invoice.status,
          date: invoice.date,
        },
      }));
    } catch (error) {
      console.error('Invoice search error:', error);
      return [];
    }
  },

  expenses: async (query: string) => {
    const response = await fetch(`/api/search/expenses?q=${encodeURIComponent(query)}`);
    const expenses = await response.json();

    return expenses.map((expense: any) => ({
      id: expense.id,
      title: expense.description,
      description: `${expense.vendor} - ${formatCurrency(expense.amount)}`,
      category: 'expenses',
      url: `/expenses/${expense.id}`,
    }));
  },

  clients: async (query: string) => {
    const response = await fetch(`/api/search/clients?q=${encodeURIComponent(query)}`);
    const clients = await response.json();

    return clients.map((client: any) => ({
      id: client.id,
      title: client.name,
      description: client.email,
      category: 'clients',
      url: `/clients/${client.id}`,
    }));
  },

  // ... other categories
};
```

## Custom Actions

### Adding Quick Actions

```typescript
// hooks/useGlobalSearch.ts

actions: async (query: string) => {
  const actions = [
    {
      id: 'action-new-invoice',
      title: 'Create New Invoice',
      description: 'Create a new invoice',
      action: () => router.push('/invoices/new'),
    },
    {
      id: 'action-new-expense',
      title: 'Add New Expense',
      description: 'Record a new expense',
      action: () => router.push('/expenses/new'),
    },
    {
      id: 'action-new-client',
      title: 'Add New Client',
      description: 'Add a new client to your database',
      action: () => router.push('/clients/new'),
    },
    {
      id: 'action-scan-receipt',
      title: 'Scan Receipt',
      description: 'Upload and scan a receipt',
      action: () => {
        // Trigger file upload dialog
        document.getElementById('receipt-upload')?.click();
      },
    },
    {
      id: 'action-export-data',
      title: 'Export Data',
      description: 'Export your financial data',
      action: async () => {
        const response = await fetch('/api/exports/financial-data');
        const blob = await response.blob();
        // Download file
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.csv';
        a.click();
      },
    },
  ];

  return actions
    .filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    )
    .map(item => ({
      ...item,
      category: 'actions' as SearchCategory,
    }));
},
```

## Adding Icons to Results

```typescript
import {
  FileTextIcon,
  ReceiptIcon,
  UsersIcon,
  BarChartIcon,
} from 'lucide-react';

// In your search result mapping:
return invoices.map((invoice: any) => ({
  id: invoice.id,
  title: `Invoice ${invoice.number}`,
  description: `${invoice.client.name} - ${formatCurrency(invoice.amount)}`,
  category: 'invoices',
  url: `/invoices/${invoice.id}`,
  icon: <FileTextIcon className="h-5 w-5" />,
}));
```

## Keyboard Shortcuts Display

Add a help dialog showing keyboard shortcuts:

```tsx
// components/command-palette/KeyboardShortcuts.tsx
import { useCommandPalette } from '@/hooks/useCommandPalette';

export function KeyboardShortcutsHelp() {
  const shortcuts = [
    { key: '⌘K / Ctrl+K', description: 'Open command palette' },
    { key: '↑ ↓', description: 'Navigate results' },
    { key: 'Enter', description: 'Select result' },
    { key: 'Esc', description: 'Close palette' },
  ];

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Keyboard Shortcuts</h3>
      <dl className="space-y-1">
        {shortcuts.map(({ key, description }) => (
          <div key={key} className="flex items-center justify-between">
            <dt className="text-sm text-muted-foreground">{description}</dt>
            <dd>
              <kbd className="rounded border px-2 py-1 text-xs">{key}</kbd>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
```

## Testing

### Unit Tests

```typescript
// __tests__/components/command-palette/CommandPalette.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPalette } from '@/components/command-palette';
import { useCommandPalette } from '@/hooks/useCommandPalette';

describe('CommandPalette', () => {
  it('opens when Cmd+K is pressed', () => {
    render(<CommandPalette />);

    fireEvent.keyDown(document, {
      key: 'k',
      metaKey: true,
    });

    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('closes when Escape is pressed', () => {
    render(<CommandPalette />);
    const { open } = useCommandPalette.getState();

    open();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(useCommandPalette.getState().isOpen).toBe(false);
  });
});
```

### E2E Tests

```typescript
// e2e/command-palette.spec.ts
import { test, expect } from '@playwright/test';

test('command palette search', async ({ page }) => {
  await page.goto('/dashboard');

  // Open command palette
  await page.keyboard.press('Meta+K');

  // Search for invoice
  await page.fill('[placeholder*="Search"]', 'INV-2024');

  // Wait for results
  await page.waitForSelector('[role="option"]');

  // Check results
  const results = await page.locator('[role="option"]').count();
  expect(results).toBeGreaterThan(0);

  // Select first result
  await page.keyboard.press('Enter');

  // Verify navigation
  await expect(page).toHaveURL(/\/invoices\//);
});
```

## Troubleshooting

### Command Palette Not Opening

1. Check that `CommandPaletteProvider` is in your root layout
2. Verify zustand is installed: `npm list zustand`
3. Check browser console for errors

### Search Not Working

1. Check API endpoints are accessible
2. Verify CORS settings if API is on different domain
3. Check network tab for failed requests
4. Add error logging in search hooks

### Keyboard Shortcuts Conflicting

If Cmd+K conflicts with browser shortcuts:

```typescript
// Use a different shortcut
const handleKeyDown = (e: KeyboardEvent) => {
  // Change to Cmd+P or another key
  if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
    e.preventDefault();
    toggle();
  }
};
```

## Performance Tips

1. **Debounce Search**: Already implemented (300ms default)
2. **Limit Results**: Cap at 10-20 results per category
3. **Cache Results**: Use React Query or SWR for caching
4. **Lazy Load**: Load categories on-demand
5. **Virtual Scrolling**: Use `react-window` for long lists

## Examples

See complete working examples in:
- `examples/command-palette-basic.tsx`
- `examples/command-palette-with-api.tsx`
- `examples/command-palette-custom-actions.tsx`
