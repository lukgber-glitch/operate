/**
 * QuickActionsGrid Usage Example
 *
 * This file demonstrates how to integrate the QuickActionsGrid component
 * into your dashboard page.
 */

'use client'

import { QuickActionsGrid } from './quick-actions'

// Example 1: Basic usage with defaults
export function DashboardWithQuickActions() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Quick Actions Grid */}
      <QuickActionsGrid />

      {/* Other dashboard content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Your other dashboard widgets */}
      </div>
    </div>
  )
}

// Example 2: Customized with fewer actions
export function CompactDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <QuickActionsGrid
        maxVisible={4}
        title="Common Tasks"
        className="mb-6"
      />
    </div>
  )
}

// Example 3: Without settings (locked actions)
export function LockedQuickActions() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <QuickActionsGrid
        showSettings={false}
        maxVisible={6}
      />
    </div>
  )
}

// Example 4: Full dashboard layout
export function FullDashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Welcome back, John
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Here's what's happening with your business today
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActionsGrid maxVisible={8} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Add your stat cards here */}
        </div>

        {/* Recent Activity & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add your charts and activity feeds here */}
        </div>
      </div>
    </div>
  )
}

/**
 * Integration with Modal Components
 *
 * When you create modal components, update the action handlers
 * in useQuickActions.ts like this:
 */

/*
// 1. Create your modal component
import { CreateInvoiceModal } from '@/components/invoices/CreateInvoiceModal'
import { AddExpenseModal } from '@/components/expenses/AddExpenseModal'

// 2. Add modal state
const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false)
const [addExpenseOpen, setAddExpenseOpen] = useState(false)

// 3. Update the action in useQuickActions.ts
{
  id: 'create-invoice',
  icon: FileText,
  title: 'Create Invoice',
  subtitle: 'New invoice',
  variant: 'primary',
  action: () => {
    setCreateInvoiceOpen(true) // Open modal instead of navigation
  },
  visible: true,
  order: 1,
  category: 'finance',
}

// 4. Render the modals
<CreateInvoiceModal
  open={createInvoiceOpen}
  onClose={() => setCreateInvoiceOpen(false)}
  onSuccess={(invoice) => {
    console.log('Invoice created:', invoice)
    setCreateInvoiceOpen(false)
  }}
/>
*/

/**
 * Adding Dynamic Counts to Actions
 *
 * To show counts (e.g., pending invoices), fetch data and update actions:
 */

/*
import { useEffect } from 'react'
import { useQuickActions } from '@/hooks/useQuickActions'

function DashboardWithCounts() {
  const { actions } = useQuickActions()
  const [counts, setCounts] = useState({})

  useEffect(() => {
    // Fetch counts from API
    async function fetchCounts() {
      const data = await fetch('/api/dashboard/counts').then(r => r.json())
      setCounts(data)
    }
    fetchCounts()
  }, [])

  // Pass counts to actions when rendering
  return (
    <QuickActionsGrid
      customActions={actions.map(action => ({
        ...action,
        count: counts[action.id] || action.count
      }))}
    />
  )
}
*/

/**
 * Custom Action with Callback
 *
 * Create a custom action that executes a callback:
 */

/*
import { useQuickActions } from '@/hooks/useQuickActions'

function CustomActionExample() {
  const { executeAction } = useQuickActions()

  const handleCustomAction = () => {
    // Your custom logic here
    console.log('Custom action executed')

    // Then trigger the default action
    executeAction('create-invoice')
  }

  return (
    <button onClick={handleCustomAction}>
      Custom Trigger
    </button>
  )
}
*/

export default DashboardWithQuickActions
