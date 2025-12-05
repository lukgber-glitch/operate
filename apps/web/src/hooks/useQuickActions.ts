'use client'

import { useCallback, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Receipt,
  Upload,
  DollarSign,
  UserPlus,
  FileBarChart,
  Bell,
  Building2,
  CreditCard,
  TrendingUp,
  Calendar,
  Users,
} from 'lucide-react'

export interface QuickAction {
  id: string
  icon: any
  title: string
  subtitle?: string
  count?: number
  variant?: 'default' | 'primary' | 'success' | 'warning'
  action: () => void
  visible: boolean
  order: number
  category?: 'finance' | 'hr' | 'reports' | 'clients'
}

export interface QuickActionsState {
  actions: QuickAction[]
  isLoading: boolean
}

export interface UseQuickActionsReturn {
  actions: QuickAction[]
  isLoading: boolean
  executeAction: (actionId: string) => void
  toggleActionVisibility: (actionId: string, visible: boolean) => void
  reorderActions: (actionIds: string[]) => void
  refreshActions: () => Promise<void>
}

export function useQuickActions(): UseQuickActionsReturn {
  const router = useRouter()
  const [state, setState] = useState<QuickActionsState>({
    isLoading: false,
    actions: [],
  })

  // Initialize default actions
  const initializeActions = useCallback((): QuickAction[] => {
    return [
      {
        id: 'create-invoice',
        icon: FileText,
        title: 'Create Invoice',
        subtitle: 'New invoice',
        variant: 'primary',
        action: () => {
          // TODO: Open CreateInvoiceModal
          router.push('/dashboard/invoices/new')
        },
        visible: true,
        order: 1,
        category: 'finance',
      },
      {
        id: 'add-expense',
        icon: Receipt,
        title: 'Add Expense',
        subtitle: 'Record expense',
        variant: 'default',
        action: () => {
          // TODO: Open AddExpenseModal
          router.push('/dashboard/expenses/new')
        },
        visible: true,
        order: 2,
        category: 'finance',
      },
      {
        id: 'upload-receipt',
        icon: Upload,
        title: 'Upload Receipt',
        subtitle: 'Scan & process',
        variant: 'default',
        action: () => {
          // TODO: Open UploadReceiptModal
          console.log('Upload receipt clicked')
        },
        visible: true,
        order: 3,
        category: 'finance',
      },
      {
        id: 'record-payment',
        icon: DollarSign,
        title: 'Record Payment',
        subtitle: 'Log transaction',
        variant: 'success',
        action: () => {
          // TODO: Open RecordPaymentModal
          router.push('/dashboard/payments/new')
        },
        visible: true,
        order: 4,
        category: 'finance',
      },
      {
        id: 'add-client',
        icon: UserPlus,
        title: 'Add Client',
        subtitle: 'New customer',
        variant: 'default',
        action: () => {
          router.push('/dashboard/clients/new')
        },
        visible: true,
        order: 5,
        category: 'clients',
      },
      {
        id: 'generate-report',
        icon: FileBarChart,
        title: 'Generate Report',
        subtitle: 'Financial reports',
        variant: 'default',
        action: () => {
          router.push('/dashboard/reports')
        },
        visible: true,
        order: 6,
        category: 'reports',
      },
      {
        id: 'send-reminder',
        icon: Bell,
        title: 'Send Reminder',
        subtitle: 'Payment reminder',
        variant: 'warning',
        action: () => {
          // TODO: Open SendReminderModal
          console.log('Send reminder clicked')
        },
        visible: true,
        order: 7,
        category: 'clients',
      },
      {
        id: 'view-transactions',
        icon: Building2,
        title: 'Bank Transactions',
        subtitle: 'Recent activity',
        variant: 'default',
        action: () => {
          router.push('/dashboard/banking/transactions')
        },
        visible: true,
        order: 8,
        category: 'finance',
      },
      {
        id: 'create-quote',
        icon: FileText,
        title: 'Create Quote',
        subtitle: 'New quotation',
        variant: 'default',
        action: () => {
          router.push('/dashboard/quotes/new')
        },
        visible: false,
        order: 9,
        category: 'clients',
      },
      {
        id: 'payroll',
        icon: Users,
        title: 'Run Payroll',
        subtitle: 'Process payroll',
        variant: 'primary',
        action: () => {
          router.push('/dashboard/hr/payroll')
        },
        visible: false,
        order: 10,
        category: 'hr',
      },
      {
        id: 'cash-flow',
        icon: TrendingUp,
        title: 'Cash Flow',
        subtitle: 'View forecast',
        variant: 'default',
        action: () => {
          router.push('/dashboard/reports/cash-flow')
        },
        visible: false,
        order: 11,
        category: 'reports',
      },
      {
        id: 'schedule-meeting',
        icon: Calendar,
        title: 'Schedule Meeting',
        subtitle: 'Book appointment',
        variant: 'default',
        action: () => {
          // TODO: Open ScheduleMeetingModal
          console.log('Schedule meeting clicked')
        },
        visible: false,
        order: 12,
        category: 'clients',
      },
    ]
  }, [router])

  // Initialize actions on mount
  useEffect(() => {
    const loadActions = async () => {
      setState((prev) => ({ ...prev, isLoading: true }))

      try {
        // In a real app, this would fetch from API or localStorage
        // For now, use default actions
        const defaultActions = initializeActions()

        // Try to load saved preferences from localStorage
        const savedPreferences = localStorage.getItem('quickActionsPreferences')
        if (savedPreferences) {
          const preferences = JSON.parse(savedPreferences)
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
        } else {
          setState({ isLoading: false, actions: defaultActions })
        }
      } catch (error) {
        console.error('Failed to load quick actions:', error)
        setState({ isLoading: false, actions: initializeActions() })
      }
    }

    loadActions()
  }, [initializeActions])

  const executeAction = useCallback(
    (actionId: string) => {
      const action = state.actions.find((a) => a.id === actionId)
      if (action && !state.isLoading) {
        action.action()
      }
    },
    [state.actions, state.isLoading]
  )

  const toggleActionVisibility = useCallback((actionId: string, visible: boolean) => {
    setState((prev) => {
      const updatedActions = prev.actions.map((action) =>
        action.id === actionId ? { ...action, visible } : action
      )

      // Save to localStorage
      const preferences = updatedActions.map((a) => ({
        id: a.id,
        visible: a.visible,
        order: a.order,
      }))
      localStorage.setItem('quickActionsPreferences', JSON.stringify(preferences))

      return { ...prev, actions: updatedActions }
    })
  }, [])

  const reorderActions = useCallback((actionIds: string[]) => {
    setState((prev) => {
      const updatedActions = prev.actions.map((action) => {
        const newOrder = actionIds.indexOf(action.id)
        return newOrder !== -1 ? { ...action, order: newOrder } : action
      })

      // Save to localStorage
      const preferences = updatedActions.map((a) => ({
        id: a.id,
        visible: a.visible,
        order: a.order,
      }))
      localStorage.setItem('quickActionsPreferences', JSON.stringify(preferences))

      return { ...prev, actions: updatedActions }
    })
  }, [])

  const refreshActions = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      // In a real app, this would refetch from API
      // For now, just reload from localStorage
      const savedPreferences = localStorage.getItem('quickActionsPreferences')
      const defaultActions = initializeActions()

      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences)
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
      } else {
        setState({ isLoading: false, actions: defaultActions })
      }
    } catch (error) {
      console.error('Failed to refresh quick actions:', error)
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [initializeActions])

  return {
    actions: state.actions.filter((a) => a.visible).sort((a, b) => a.order - b.order),
    isLoading: state.isLoading,
    executeAction,
    toggleActionVisibility,
    reorderActions,
    refreshActions,
  }
}
