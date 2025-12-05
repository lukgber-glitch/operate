# Command Palette Architecture

## Component Hierarchy

```
CommandPaletteProvider
└── CommandPalette
    └── CommandPaletteModal
        └── Command (shadcn/ui)
            ├── SearchInput
            │   └── CommandInput
            └── SearchResults
                └── CommandList
                    ├── RecentSearches
                    │   └── CommandGroup
                    │       └── CommandItem (each search)
                    └── SearchCategory (foreach category)
                        └── CommandGroup
                            └── SearchResultItem (foreach result)
                                └── CommandItem
```

## Data Flow

```
User Input (Cmd+K)
    ↓
useCommandPaletteShortcut (hook)
    ↓
useCommandPalette (zustand store)
    ↓
CommandPalette (component)
    ↓
SearchInput (user types)
    ↓
useGlobalSearch (hook)
    ↓
useDebounce (300ms delay)
    ↓
Search API (parallel requests)
    ↓
Results grouped by category
    ↓
SearchResults (display)
    ↓
User selects result
    ↓
Navigate to URL or Execute Action
    ↓
Save to Recent Searches (localStorage)
```

## State Management

```
┌─────────────────────────────────┐
│   useCommandPalette (Zustand)   │
│                                  │
│   State:                         │
│   - isOpen: boolean              │
│                                  │
│   Actions:                       │
│   - open()                       │
│   - close()                      │
│   - toggle()                     │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│   useGlobalSearch (React Hook)  │
│                                  │
│   State:                         │
│   - query: string                │
│   - results: SearchResult[]      │
│   - groupedResults: grouped      │
│   - recentSearches: string[]     │
│   - isLoading: boolean           │
│   - error: string | null         │
│                                  │
│   Actions:                       │
│   - setQuery()                   │
│   - clearRecentSearches()        │
└─────────────────────────────────┘
```

## Search Flow

```
┌──────────────┐
│ User Types   │
│   "invoice"  │
└──────┬───────┘
       │
       ↓ (debounced 300ms)
┌──────────────────────────────────────────┐
│          Parallel API Calls              │
├──────────────────────────────────────────┤
│  1. invoices("invoice")                  │
│  2. expenses("invoice")                  │
│  3. clients("invoice")                   │
│  4. reports("invoice")                   │
│  5. navigation("invoice")                │
│  6. actions("invoice")                   │
└──────┬───────────────────────────────────┘
       │ Promise.all()
       ↓
┌──────────────────────────────────────────┐
│          Results Aggregated              │
├──────────────────────────────────────────┤
│  {                                       │
│    invoices: [result1, result2],        │
│    expenses: [],                         │
│    clients: [],                          │
│    reports: [result3],                   │
│    navigation: [result4],                │
│    actions: [result5, result6]           │
│  }                                       │
└──────┬───────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────┐
│         Display in Categories            │
├──────────────────────────────────────────┤
│  Actions (2 results)                     │
│  ├─ Create New Invoice                   │
│  └─ Export Invoice Data                  │
│                                          │
│  Navigation (1 result)                   │
│  └─ Invoices Page                        │
│                                          │
│  Invoices (2 results)                    │
│  ├─ Invoice #INV-2024-001                │
│  └─ Invoice #INV-2024-002                │
│                                          │
│  Reports (1 result)                      │
│  └─ Invoice Summary Report               │
└──────────────────────────────────────────┘
```

## Keyboard Navigation Flow

```
┌─────────────────────┐
│   Cmd+K / Ctrl+K    │
│   (anywhere in app) │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Modal Opens        │
│  Input Auto-Focus   │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  User Types Query   │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Results Displayed  │
│  First item focused │
└──────────┬──────────┘
           │
           ↓
    ┌──────┴──────┐
    │             │
    ↓             ↓
┌───────┐    ┌────────┐
│  ↑↓   │    │ Enter  │
│ Keys  │    │  Key   │
└───┬───┘    └────┬───┘
    │             │
    ↓             ↓
┌───────────┐  ┌─────────────┐
│ Navigate  │  │   Execute   │
│  Results  │  │   Action    │
└───────────┘  └──────┬──────┘
                      │
                      ↓
               ┌──────────────┐
               │ Close Modal  │
               │ Navigate URL │
               │ Save Recent  │
               └──────────────┘
```

## Storage Architecture

```
┌─────────────────────────────────────┐
│         localStorage                │
├─────────────────────────────────────┤
│  Key: "operate-recent-searches"     │
│  Value: ["invoice", "expense", ...] │
│  Max: 10 items                      │
└─────────────────────────────────────┘
           ↑         ↓
           │         │
    ┌──────┴─────────┴──────┐
    │  RecentSearches Hook   │
    │  - Load on mount       │
    │  - Save on search      │
    │  - Clear on demand     │
    └────────────────────────┘
```

## API Integration Points

```
┌─────────────────────────────────────┐
│    useGlobalSearch.ts               │
├─────────────────────────────────────┤
│                                     │
│  mockSearchAPI (current)            │
│  └─ Replace with real APIs:         │
│                                     │
│     invoices: async (query) => {    │
│       const res = await fetch(      │
│         `/api/search/invoices?q=`   │
│       );                            │
│       return res.json();            │
│     }                               │
│                                     │
│     expenses: async (query) => {    │
│       const res = await fetch(      │
│         `/api/search/expenses?q=`   │
│       );                            │
│       return res.json();            │
│     }                               │
│                                     │
│     ... other categories            │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│    Backend API Routes               │
├─────────────────────────────────────┤
│  /api/search/invoices               │
│  /api/search/expenses               │
│  /api/search/clients                │
│  /api/search/reports                │
│  ... etc                            │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│    Database Queries                 │
├─────────────────────────────────────┤
│  - Prisma ORM                       │
│  - Full-text search                 │
│  - Fuzzy matching                   │
│  - Pagination                       │
└─────────────────────────────────────┘
```

## Performance Optimization

```
┌─────────────────────┐
│  User Types         │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  useDebounce        │
│  (300ms delay)      │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Single API Request │
│  (not on every key) │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Promise.all()      │
│  (parallel)         │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Results Limited    │
│  (10-20 per cat)    │
└─────────────────────┘
```

## Error Handling

```
┌─────────────────────────────────────┐
│    Search Request                   │
└──────────┬──────────────────────────┘
           │
           ↓
    ┌──────┴──────┐
    │             │
    ↓             ↓
┌────────┐    ┌────────┐
│Success │    │ Error  │
└───┬────┘    └────┬───┘
    │              │
    ↓              ↓
┌────────┐    ┌──────────────┐
│Display │    │ Error State  │
│Results │    │ - Log error  │
└────────┘    │ - Show msg   │
              │ - Retry btn  │
              └──────────────┘
```

## Extensibility Points

### 1. Add New Category

```typescript
// 1. Update type
export type SearchCategory =
  | 'invoices'
  | 'my-new-category'; // Add here

// 2. Add search function
const mockSearchAPI = {
  'my-new-category': async (query) => {
    // Your logic
    return results;
  }
};

// 3. Add category label
const categoryLabels = {
  'my-new-category': 'My Category'
};
```

### 2. Add Custom Icons

```typescript
import { MyIcon } from 'lucide-react';

return {
  id: 'result-1',
  title: 'My Result',
  category: 'my-category',
  icon: <MyIcon className="h-5 w-5" />,
};
```

### 3. Add Metadata

```typescript
return {
  id: 'result-1',
  title: 'Invoice #123',
  category: 'invoices',
  metadata: {
    status: 'paid',
    amount: 1000,
    date: '2024-01-01',
    shortcut: '⌘I'
  }
};
```

## Testing Strategy

```
Unit Tests
├── useCommandPalette.test.ts
│   ├── Test open/close/toggle
│   ├── Test keyboard shortcut
│   └── Test state persistence
├── useGlobalSearch.test.ts
│   ├── Test search debouncing
│   ├── Test result grouping
│   ├── Test recent searches
│   └── Test error handling
└── Components/*.test.tsx
    ├── Test rendering
    ├── Test keyboard navigation
    └── Test result selection

Integration Tests
├── Test search flow
├── Test navigation
└── Test API integration

E2E Tests
├── Test full user journey
├── Test keyboard shortcuts
└── Test cross-browser
```
