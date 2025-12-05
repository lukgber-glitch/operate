# Quick Actions Integration Guide

Complete guide for integrating the Quick Actions Grid into your dashboard.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Dashboard Integration](#dashboard-integration)
3. [Modal Integration](#modal-integration)
4. [Adding New Actions](#adding-new-actions)
5. [Customization](#customization)
6. [API Integration](#api-integration)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Import and Use

```tsx
import { QuickActionsGrid } from '@/components/dashboard/quick-actions'

export default function DashboardPage() {
  return (
    <div className="p-6">
      <QuickActionsGrid />
    </div>
  )
}
```

That's it! The component works out of the box with default actions.

---

## Dashboard Integration

### Basic Dashboard Layout

```tsx
'use client'

import { QuickActionsGrid } from '@/components/dashboard/quick-actions'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentActivity } from '@/components/dashboard/recent-activity'

export default function Dashboard() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Here's what's happening today
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActionsGrid maxVisible={8} />

      {/* Stats */}
      <StatsCards />

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  )
}
```

### Responsive Layout

```tsx
export default function ResponsiveDashboard() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Quick Actions - Full width on mobile, constrained on desktop */}
      <div className="max-w-7xl mx-auto">
        <QuickActionsGrid maxVisible={8} />
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {/* Left column content */}
        </div>
        <div>
          {/* Right column content */}
        </div>
      </div>
    </div>
  )
}
```

---

## Modal Integration

### Step 1: Create Modal State

```tsx
'use client'

import { useState } from 'react'
import { QuickActionsGrid } from '@/components/dashboard/quick-actions'
import { CreateInvoiceModal } from '@/components/invoices/CreateInvoiceModal'
import { AddExpenseModal } from '@/components/expenses/AddExpenseModal'

export default function DashboardWithModals() {
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false)
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)

  return (
    <div className="container mx-auto p-6 space-y-8">
      <QuickActionsGrid />

      {/* Modals */}
      <CreateInvoiceModal
        open={createInvoiceOpen}
        onClose={() => setCreateInvoiceOpen(false)}
        onSuccess={(invoice) => {
          console.log('Invoice created:', invoice)
          setCreateInvoiceOpen(false)
        }}
      />

      <AddExpenseModal
        open={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        onSuccess={(expense) => {
          console.log('Expense added:', expense)
          setAddExpenseOpen(false)
        }}
      />
    </div>
  )
}
```

### Step 2: Update Action Handlers

Edit `apps/web/src/hooks/useQuickActions.ts`:

```typescript
// Add modal setters as a parameter or use a context
export function useQuickActions(modalHandlers?: {
  setCreateInvoiceOpen: (open: boolean) => void
  setAddExpenseOpen: (open: boolean) => void
  // ... other handlers
}) {
  // ... existing code

  const initializeActions = useCallback((): QuickAction[] => {
    return [
      {
        id: 'create-invoice',
        icon: FileText,
        title: 'Create Invoice',
        subtitle: 'New invoice',
        variant: 'primary',
        action: () => {
          if (modalHandlers?.setCreateInvoiceOpen) {
            modalHandlers.setCreateInvoiceOpen(true)
          } else {
            router.push('/dashboard/invoices/new')
          }
        },
        visible: true,
        order: 1,
        category: 'finance',
      },
      // ... other actions
    ]
  }, [router, modalHandlers])

  // ... rest of the code
}
```

### Step 3: Better Approach - Context

Create a modal context for cleaner integration:

```tsx
// contexts/ModalContext.tsx
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ModalContextType {
  openModal: (modalId: string) => void
  closeModal: (modalId: string) => void
  isOpen: (modalId: string) => boolean
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())

  const openModal = (modalId: string) => {
    setOpenModals((prev) => new Set(prev).add(modalId))
  }

  const closeModal = (modalId: string) => {
    setOpenModals((prev) => {
      const next = new Set(prev)
      next.delete(modalId)
      return next
    })
  }

  const isOpen = (modalId: string) => openModals.has(modalId)

  return (
    <ModalContext.Provider value={{ openModal, closeModal, isOpen }}>
      {children}
    </ModalContext.Provider>
  )
}

export function useModals() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModals must be used within ModalProvider')
  }
  return context
}
```

Then use in actions:

```typescript
// In useQuickActions.ts
import { useModals } from '@/contexts/ModalContext'

export function useQuickActions() {
  const { openModal } = useModals()

  const initializeActions = useCallback((): QuickAction[] => {
    return [
      {
        id: 'create-invoice',
        icon: FileText,
        title: 'Create Invoice',
        action: () => openModal('create-invoice'),
        // ...
      },
    ]
  }, [openModal])
}
```

---

## Adding New Actions

### 1. Define the Action

Edit `apps/web/src/hooks/useQuickActions.ts`:

```typescript
{
  id: 'my-new-action',          // Unique ID
  icon: MyIcon,                  // Lucide React icon
  title: 'My Action',            // Display title
  subtitle: 'Quick description', // Optional subtitle
  variant: 'primary',            // Color theme
  action: () => {                // What happens on click
    console.log('Action clicked')
    router.push('/path')
  },
  visible: true,                 // Show by default
  order: 99,                     // Display order
  category: 'finance',           // Category grouping
}
```

### 2. Add Icon Import

```typescript
import {
  FileText,
  Receipt,
  Upload,
  DollarSign,
  UserPlus,
  FileBarChart,
  Bell,
  Building2,
  MyNewIcon, // Add your icon here
} from 'lucide-react'
```

### 3. Add Category (Optional)

If adding a new category, update the type:

```typescript
export interface QuickAction {
  // ...
  category?: 'finance' | 'hr' | 'reports' | 'clients' | 'mycategory'
}
```

Then update the settings dialog in `QuickActionsGrid.tsx` to show the new category.

---

## Customization

### Theme Variants

```tsx
<QuickActionCard
  icon={FileText}
  title="Create Invoice"
  variant="primary"  // Blue theme
/>

<QuickActionCard
  icon={Receipt}
  title="Add Expense"
  variant="success"  // Green theme
/>

<QuickActionCard
  icon={Bell}
  title="Send Reminder"
  variant="warning"  // Amber theme
/>

<QuickActionCard
  icon={FileBarChart}
  title="Generate Report"
  variant="default"  // Gray theme
/>
```

### Custom Styling

```tsx
<QuickActionsGrid
  className="mt-8 mb-12"
  maxVisible={6}
/>

<QuickActionCard
  className="shadow-lg hover:shadow-xl"
  icon={FileText}
  title="Custom Styled"
  onClick={() => {}}
/>
```

### Limited Actions

```tsx
// Show only 4 most important actions
<QuickActionsGrid maxVisible={4} />

// Compact grid for smaller dashboards
<QuickActionsGrid
  maxVisible={4}
  title="Quick Access"
  className="max-w-4xl"
/>
```

### Locked Configuration

```tsx
// Users cannot customize (no settings button)
<QuickActionsGrid
  showSettings={false}
  maxVisible={6}
/>
```

---

## API Integration

### Fetching Dynamic Counts

```tsx
'use client'

import { useEffect, useState } from 'react'
import { QuickActionsGrid } from '@/components/dashboard/quick-actions'

export default function DashboardWithCounts() {
  const [counts, setCounts] = useState({
    pendingInvoices: 0,
    draftExpenses: 0,
    unseenTransactions: 0,
  })

  useEffect(() => {
    async function fetchCounts() {
      try {
        const response = await fetch('/api/dashboard/counts')
        const data = await response.json()
        setCounts(data)
      } catch (error) {
        console.error('Failed to fetch counts:', error)
      }
    }

    fetchCounts()

    // Refresh every minute
    const interval = setInterval(fetchCounts, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6">
      <QuickActionsGrid />
      {/* Pass counts to individual cards as needed */}
    </div>
  )
}
```

### Updating Actions Based on User Role

```tsx
'use client'

import { useAuth } from '@/hooks/use-auth'
import { useQuickActions } from '@/hooks/useQuickActions'

export function RoleBasedQuickActions() {
  const { user } = useAuth()
  const { actions, toggleActionVisibility } = useQuickActions()

  useEffect(() => {
    // Hide HR actions for non-admin users
    if (user?.role !== 'admin') {
      actions
        .filter((a) => a.category === 'hr')
        .forEach((a) => toggleActionVisibility(a.id, false))
    }
  }, [user, actions, toggleActionVisibility])

  return <QuickActionsGrid />
}
```

### Fetching User Preferences from API

```typescript
// In useQuickActions.ts
useEffect(() => {
  const loadActions = async () => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      // Fetch preferences from API
      const response = await fetch('/api/user/quick-action-preferences')
      const preferences = await response.json()

      const defaultActions = initializeActions()
      const mergedActions = defaultActions.map((action) => {
        const savedAction = preferences.find((p: any) => p.id === action.id)
        if (savedAction) {
          return {
            ...action,
            visible: savedAction.visible ?? action.visible,
            order: savedAction.order ?? action.order,
          }
        }
        return action
      })

      setState({ isLoading: false, actions: mergedActions })
    } catch (error) {
      console.error('Failed to load preferences:', error)
      // Fallback to localStorage or defaults
      setState({ isLoading: false, actions: initializeActions() })
    }
  }

  loadActions()
}, [initializeActions])
```

### Saving Preferences to API

```typescript
// In useQuickActions.ts
const toggleActionVisibility = useCallback(async (actionId: string, visible: boolean) => {
  setState((prev) => {
    const updatedActions = prev.actions.map((action) =>
      action.id === actionId ? { ...action, visible } : action
    )

    // Save to API
    fetch('/api/user/quick-action-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferences: updatedActions.map((a) => ({
          id: a.id,
          visible: a.visible,
          order: a.order,
        })),
      }),
    }).catch((error) => {
      console.error('Failed to save preferences:', error)
    })

    return { ...prev, actions: updatedActions }
  })
}, [])
```

---

## Troubleshooting

### Actions Not Showing

1. **Check visibility**: Actions must have `visible: true`
2. **Check maxVisible**: You might have too many actions for the limit
3. **Check localStorage**: Clear it with `localStorage.removeItem('quickActionsPreferences')`
4. **Check console**: Look for errors in browser console

### Modals Not Opening

1. **Verify action handlers**: Check `useQuickActions.ts` action functions
2. **Check modal state**: Ensure state variables are properly set
3. **Verify imports**: Make sure modal components are imported correctly
4. **Check router**: Ensure `next/navigation` router is working

### Preferences Not Saving

1. **Check localStorage**: Browser might block localStorage in private mode
2. **Verify JSON**: Check that preferences are valid JSON
3. **Check API**: If using API, verify endpoints are working
4. **Test manually**: Try `localStorage.setItem('test', 'value')` in console

### Styling Issues

1. **Check Tailwind**: Ensure Tailwind is configured correctly
2. **Verify imports**: Make sure UI components are imported from correct paths
3. **Check dark mode**: Test both light and dark modes
4. **Browser DevTools**: Use inspector to check computed styles

### Performance Issues

1. **Limit actions**: Reduce `maxVisible` if showing too many
2. **Debounce updates**: Add debouncing to preference saves
3. **Memoize callbacks**: Ensure useCallback is used properly
4. **Check re-renders**: Use React DevTools Profiler

---

## Best Practices

### 1. Keep Actions Focused

- Maximum 12 total actions
- Show 6-8 visible by default
- Group related actions by category

### 2. Use Appropriate Variants

- `primary`: Main/most important actions
- `success`: Positive/completion actions
- `warning`: Time-sensitive/important actions
- `default`: Regular actions

### 3. Provide Clear Titles

- Use action verbs: "Create", "Add", "Send", "Generate"
- Keep titles short (2-3 words)
- Add subtitles for context

### 4. Handle Errors Gracefully

```typescript
action: async () => {
  try {
    await performAction()
  } catch (error) {
    console.error('Action failed:', error)
    toast.error('Failed to complete action')
  }
}
```

### 5. Test Across Devices

- Test on mobile (2 columns)
- Test on tablet (3-4 columns)
- Test on desktop (4 columns)
- Test with different action counts

---

## Advanced Features

### Keyboard Shortcuts

```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'i':
          e.preventDefault()
          executeAction('create-invoice')
          break
        case 'e':
          e.preventDefault()
          executeAction('add-expense')
          break
      }
    }
  }

  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [executeAction])
```

### Action Analytics

```typescript
const executeAction = useCallback((actionId: string) => {
  const action = actions.find((a) => a.id === actionId)
  if (action) {
    // Track usage
    fetch('/api/analytics/quick-action', {
      method: 'POST',
      body: JSON.stringify({ actionId, timestamp: new Date() }),
    })

    action.action()
  }
}, [actions])
```

### Drag-and-Drop Reordering

```typescript
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove } from '@dnd-kit/sortable'

// Implement drag-and-drop for custom ordering
```

---

## Support

For issues or questions:
1. Check this guide
2. Review the README.md
3. Check component documentation
4. Consult the team lead

Last updated: December 2024
