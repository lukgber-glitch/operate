# Command Palette (Cmd+K)

Global search and command palette component for Operate/CoachOS.

## Features

- **Keyboard Shortcut**: Cmd+K (Mac) or Ctrl+K (Windows/Linux)
- **Fuzzy Search**: Search across invoices, expenses, clients, reports, and more
- **Recent Searches**: Automatically saves recent searches in localStorage
- **Keyboard Navigation**: Navigate results with arrow keys, Enter to select, Escape to close
- **Category Grouping**: Results organized by type (Actions, Navigation, Invoices, etc.)
- **Highlighted Matches**: Search terms highlighted in results
- **Loading States**: Visual feedback during search
- **Responsive**: Works on all screen sizes

## Installation

### 1. Add to Root Layout

Wrap your app with the `CommandPaletteProvider`:

```tsx
// app/layout.tsx
import { CommandPaletteProvider } from '@/components/command-palette/CommandPaletteProvider';

export default function RootLayout({ children }) {
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

### 2. Install Dependencies

Ensure you have the required dependencies:

```bash
npm install zustand cmdk lucide-react
```

## Usage

### Opening the Command Palette

The command palette can be opened in three ways:

1. **Keyboard Shortcut**: Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
2. **Programmatically**: Use the `useCommandPalette` hook
3. **Button**: Add a button that triggers the palette

```tsx
import { useCommandPalette } from '@/hooks/useCommandPalette';

function MyComponent() {
  const { open } = useCommandPalette();

  return (
    <button onClick={open}>
      Open Command Palette
    </button>
  );
}
```

### Search Categories

The command palette searches across multiple categories:

- **Actions**: Quick actions like "Create Invoice", "Add Expense"
- **Navigation**: App pages and sections
- **Invoices**: Search by invoice number, client name, amount
- **Expenses**: Search by vendor, category, amount
- **Clients**: Search by name, email, company
- **Reports**: Search by report type, date range

## Customization

### Adding Custom Search Categories

Extend the search API in `useGlobalSearch.ts`:

```typescript
// Add your custom category
export type SearchCategory =
  | 'invoices'
  | 'expenses'
  | 'clients'
  | 'reports'
  | 'navigation'
  | 'actions'
  | 'my-custom-category'; // Add here

// Implement search function
const mockSearchAPI: SearchAPI = {
  // ... existing categories
  'my-custom-category': async (query: string) => {
    // Your search logic
    return results;
  },
};
```

### Integrating with Real API

Replace the mock search functions in `useGlobalSearch.ts`:

```typescript
// Replace mock with real API call
invoices: async (query: string) => {
  const response = await fetch(`/api/search/invoices?q=${query}`);
  const data = await response.json();
  return data.map(item => ({
    id: item.id,
    title: item.number,
    description: `${item.client} - ${item.amount}`,
    category: 'invoices',
    url: `/invoices/${item.id}`,
  }));
},
```

### Styling

The command palette uses Tailwind CSS and shadcn/ui components. Customize styles in:

- `CommandPalette.tsx` - Main container styles
- `SearchResultItem.tsx` - Individual result styles
- `SearchCategory.tsx` - Category header styles

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open/close command palette |
| `↑` / `↓` | Navigate results |
| `Enter` | Select result |
| `Escape` | Close palette |

## Components

### CommandPalette
Main command palette component with search functionality.

### CommandPaletteProvider
Provider component that wraps the app and provides global keyboard shortcuts.

### SearchInput
Input field with auto-focus and search icon.

### SearchResults
Displays grouped search results with loading and empty states.

### SearchResultItem
Individual search result with highlighted text matching.

### SearchCategory
Groups results by category with category headers.

### RecentSearches
Displays and manages recent search history.

## Hooks

### useCommandPalette
Manages the open/close state of the command palette.

```typescript
const { isOpen, open, close, toggle } = useCommandPalette();
```

### useGlobalSearch
Handles search functionality across all categories.

```typescript
const {
  query,
  setQuery,
  results,
  groupedResults,
  recentSearches,
  clearRecentSearches,
  isLoading,
  error,
} = useGlobalSearch();
```

### useCommandPaletteShortcut
Sets up the global Cmd+K / Ctrl+K keyboard shortcut.

## File Structure

```
apps/web/src/
├── components/command-palette/
│   ├── CommandPalette.tsx
│   ├── CommandPaletteModal.tsx
│   ├── CommandPaletteProvider.tsx
│   ├── SearchInput.tsx
│   ├── SearchResults.tsx
│   ├── SearchResultItem.tsx
│   ├── SearchCategory.tsx
│   ├── RecentSearches.tsx
│   ├── index.ts
│   └── README.md
└── hooks/
    ├── useCommandPalette.ts
    ├── useGlobalSearch.ts
    └── useDebounce.ts
```

## Performance

- **Debounced Search**: Search requests are debounced by 300ms to reduce API calls
- **Parallel Requests**: All categories are searched in parallel for faster results
- **Lazy Loading**: Results load as you type
- **Local Storage**: Recent searches stored locally for quick access

## Accessibility

- **Keyboard Navigation**: Full keyboard support
- **ARIA Labels**: Proper ARIA attributes for screen readers
- **Focus Management**: Auto-focus on input when opened
- **Visual Feedback**: Clear loading and empty states

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Dependencies

- `zustand` - State management
- `cmdk` - Command palette primitives
- `lucide-react` - Icons
- `@radix-ui/react-icons` - Additional icons
- `@radix-ui/react-dialog` - Dialog primitive

## License

Part of Operate/CoachOS - Internal use only
