import { Bot, CheckCircle2, Hand } from 'lucide-react'
import * as React from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type AutomationMode = 'FULL_AUTO' | 'SEMI_AUTO' | 'MANUAL'

interface AutomationModeCardProps {
  mode: AutomationMode
  selected: boolean
  onSelect: () => void
}

const AUTOMATION_CONFIG = {
  FULL_AUTO: {
    icon: Bot,
    label: 'Full Automatic',
    description: 'Let AI handle routine tasks automatically',
    features: [
      'Auto-approve AI classifications with >90% confidence',
      'Auto-send payment reminders',
      'Auto-categorize bank transactions',
      'Minimal manual intervention required',
    ],
    badge: null,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
  },
  SEMI_AUTO: {
    icon: CheckCircle2,
    label: 'Semi-Automatic',
    description: 'AI suggests, you approve',
    features: [
      'AI classifies but requires your approval',
      'Review reminder drafts before sending',
      'Approve categorization suggestions',
      'Perfect balance of automation and control',
    ],
    badge: 'Recommended',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
  },
  MANUAL: {
    icon: Hand,
    label: 'Manual',
    description: 'Full control over everything',
    features: [
      'No automatic actions taken',
      'All tasks require manual intervention',
      'Maximum control and transparency',
      'Best for hands-on management',
    ],
    badge: null,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
  },
} as const

export function AutomationModeCard({ mode, selected, onSelect }: AutomationModeCardProps) {
  const config = AUTOMATION_CONFIG[mode]
  const Icon = config.icon

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        selected && 'ring-2 ring-primary shadow-lg',
        !selected && 'hover:border-primary/50'
      )}
      onClick={onSelect}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', config.bgColor)}>
                <Icon className={cn('w-6 h-6', config.color)} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{config.label}</h3>
                  {config.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                      {config.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{config.description}</p>
              </div>
            </div>
            <div
              className={cn(
                'w-5 h-5 rounded-full border-2 transition-all',
                selected
                  ? 'bg-primary border-primary'
                  : 'border-muted-foreground/30 bg-transparent'
              )}
            >
              {selected && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2 pt-2 border-t">
            {config.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
