'use client'

import * as React from 'react'
import { Settings, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

import { QuickActionCard } from './QuickActionCard'
import { useQuickActions } from '@/hooks/useQuickActions'

export interface QuickActionsGridProps {
  className?: string
  maxVisible?: number
  showSettings?: boolean
  title?: string
}

export function QuickActionsGrid({
  className,
  maxVisible = 8,
  showSettings = true,
  title = 'Quick Actions',
}: QuickActionsGridProps) {
  const { actions, isLoading, executeAction, toggleActionVisibility, refreshActions } =
    useQuickActions()
  const [settingsOpen, setSettingsOpen] = React.useState(false)

  // Get all actions (including hidden ones) for settings
  const allActions = React.useMemo(() => {
    const savedPreferences = localStorage.getItem('quickActionsPreferences')
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences)
        return preferences
      } catch {
        return []
      }
    }
    return []
  }, [settingsOpen])

  const handleActionClick = (actionId: string) => {
    executeAction(actionId)
  }

  const handleToggleVisibility = async (actionId: string, checked: boolean) => {
    toggleActionVisibility(actionId, checked)
    // Small delay to allow state to update before refreshing
    await new.Promise((resolve) => setTimeout(resolve, 100))
    await refreshActions()
  }

  // Get visible actions limited by maxVisible
  const visibleActions = actions.slice(0, maxVisible)

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-lg border bg-slate-100 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>

        {showSettings && (
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Customize
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Customize Quick Actions</DialogTitle>
                <DialogDescription>
                  Select which actions you want to see on your dashboard. You can show
                  up to {maxVisible} actions at a time.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Finance Actions */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    Finance
                  </h3>
                  <div className="space-y-2">
                    {actions
                      .filter((a) => a.category === 'finance')
                      .map((action) => (
                        <div
                          key={action.id}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Checkbox
                            id={action.id}
                            checked={action.visible}
                            onCheckedChange={(checked) =>
                              handleToggleVisibility(action.id, checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={action.id}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <action.icon className="h-4 w-4 text-slate-500" />
                              <span>{action.title}</span>
                            </div>
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Clients Actions */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    Clients
                  </h3>
                  <div className="space-y-2">
                    {actions
                      .filter((a) => a.category === 'clients')
                      .map((action) => (
                        <div
                          key={action.id}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Checkbox
                            id={action.id}
                            checked={action.visible}
                            onCheckedChange={(checked) =>
                              handleToggleVisibility(action.id, checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={action.id}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <action.icon className="h-4 w-4 text-slate-500" />
                              <span>{action.title}</span>
                            </div>
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Reports Actions */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    Reports
                  </h3>
                  <div className="space-y-2">
                    {actions
                      .filter((a) => a.category === 'reports')
                      .map((action) => (
                        <div
                          key={action.id}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Checkbox
                            id={action.id}
                            checked={action.visible}
                            onCheckedChange={(checked) =>
                              handleToggleVisibility(action.id, checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={action.id}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <action.icon className="h-4 w-4 text-slate-500" />
                              <span>{action.title}</span>
                            </div>
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>

                {/* HR Actions */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    HR
                  </h3>
                  <div className="space-y-2">
                    {actions
                      .filter((a) => a.category === 'hr')
                      .map((action) => (
                        <div
                          key={action.id}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Checkbox
                            id={action.id}
                            checked={action.visible}
                            onCheckedChange={(checked) =>
                              handleToggleVisibility(action.id, checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={action.id}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <action.icon className="h-4 w-4 text-slate-500" />
                              <span>{action.title}</span>
                            </div>
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Actions Grid */}
      {visibleActions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
          <Plus className="h-8 w-8 text-slate-400 mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
            No quick actions configured
          </p>
          {showSettings && (
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Add Actions
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {visibleActions.map((action) => (
            <QuickActionCard
              key={action.id}
              icon={action.icon}
              title={action.title}
              subtitle={action.subtitle}
              count={action.count}
              variant={action.variant}
              onClick={() => handleActionClick(action.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
