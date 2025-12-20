/**
 * CompletionStep Component
 * Final step of the onboarding wizard - success message and next steps
 */

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  LayoutDashboard,
  FileText,
  Users,
  TrendingUp,
  BookOpen,
  ArrowRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useAIConsent } from '@/hooks/useAIConsent'

const NEXT_STEPS = [
  {
    icon: LayoutDashboard,
    title: 'Start with AI Chat',
    description: 'Your AI assistant is ready to help manage your business',
    action: 'Open Chat',
    href: '/chat',
  },
  {
    icon: FileText,
    title: 'Create Your First Invoice',
    description: 'Start invoicing clients and tracking payments',
    action: 'Create Invoice',
    href: '/finance/invoices/new',
  },
  {
    icon: Users,
    title: 'Add Team Members',
    description: 'Invite employees and manage their access permissions',
    action: 'Add Employees',
    href: '/hr/employees',
  },
  {
    icon: TrendingUp,
    title: 'Review Financial Reports',
    description: 'Analyze your income, expenses, and profit margins',
    action: 'View Reports',
    href: '/reports',
  },
]

const RESOURCES = [
  {
    icon: BookOpen,
    title: 'Settings & Configuration',
    description: 'Customize your account preferences',
    href: '/settings',
  },
  {
    icon: FileText,
    title: 'Manage Documents',
    description: 'Upload and organize your files',
    href: '/documents',
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Add and manage your clients',
    href: '/clients',
  },
]

interface CompletionStepProps {
  companyName?: string
  setupCompleted?: {
    banking?: boolean
    email?: boolean
    tax?: boolean
    accounting?: boolean
  }
  aiConsentGiven?: boolean
}

export function CompletionStep({ companyName, setupCompleted, aiConsentGiven }: CompletionStepProps) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = React.useState(false)
  const { giveConsent, hasConsent } = useAIConsent()

  const handleGoToDashboard = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsNavigating(true)

    try {
      // Call API to ensure onboarding is marked complete
      const response = await fetch('/api/v1/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      // Set cookie regardless of API response (API may return 409 if already complete)
      document.cookie = 'onboarding_complete=true; path=/; max-age=31536000; SameSite=Lax'

      // Clear localStorage progress
      localStorage.removeItem('operate_onboarding_progress')

      // Only give AI consent if user explicitly checked the checkbox in preferences
      if (aiConsentGiven && !hasConsent) {
        await giveConsent()
      }

      // Navigate to chat
      router.push('/chat')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      // Still try to navigate - set cookie and go
      document.cookie = 'onboarding_complete=true; path=/; max-age=31536000; SameSite=Lax'
      localStorage.removeItem('operate_onboarding_progress')
      // Only give consent if user explicitly checked the checkbox
      if (aiConsentGiven && !hasConsent) {
        await giveConsent()
      }
      router.push('/chat')
    }
  }

  const handleNavigate = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(href)
  }

  const completedIntegrations = Object.values(setupCompleted || {}).filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Success Headline */}
      <div className="text-center space-y-4 mb-8 mt-4">
        <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">
          Setup{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Complete
          </span>
        </h1>
        <p className="text-lg text-gray-300/90 max-w-2xl mx-auto leading-relaxed">
          {companyName
            ? `Welcome aboard, ${companyName}! Your account is ready to use.`
            : 'Your account is ready to use.'}
        </p>
      </div>

      {/* Success Message Card */}
      <Card className="rounded-[16px] bg-white/10 border border-white/20">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-white/70" />
            </div>
          </div>
          <div className="text-center space-y-4 mt-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sm">
              <CheckCircle2 className="w-4 h-4 text-white/70" />
              <span>
                <strong>{completedIntegrations}</strong> integration
                {completedIntegrations !== 1 ? 's' : ''} connected
              </span>
            </div>
            <p className="text-sm text-white/60 max-w-md mx-auto">
              You&apos;re all set! Your business is now connected to Operate and ready to streamline
              your operations.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center text-white">What Would You Like to Do First?</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {NEXT_STEPS.map((step) => (
            <Card
              key={step.title}
              className="rounded-[16px] hover:border-white/30 transition-all cursor-pointer group"
              onClick={(e) => handleNavigate(e, step.href)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                    <step.icon className="w-5 h-5 text-white/70" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-white group-hover:text-white transition-colors">
                        {step.title}
                      </h4>
                      <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-white/70">{step.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Resources */}
      <Card className="rounded-[16px] bg-white/5 backdrop-blur-xl border border-white/10">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Need Help Getting Started?</h3>
              <p className="text-sm text-white/70 mt-1">Check out these resources to make the most of Operate</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {RESOURCES.map((resource) => (
                <Button
                  key={resource.title}
                  type="button"
                  variant="outline"
                  className="h-auto flex-col items-start p-4 text-left"
                  onClick={(e) => handleNavigate(e, resource.href)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <resource.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{resource.title}</span>
                  </div>
                  <span className="text-xs text-white/60">{resource.description}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="rounded-[16px] bg-white/5 backdrop-blur-xl border border-white/10">
        <CardContent className="p-6">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">Pro Tips</h4>
            <ul className="space-y-1.5 text-xs text-white/60">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Enable notifications to stay updated on invoices, expenses, and tax deadlines
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Connect your bank for automatic transaction reconciliation and save hours</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Use the mobile app to scan receipts and track expenses on the go
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Set up recurring invoices for regular clients to automate your billing
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Primary CTA */}
      <div className="flex justify-center pt-4">
        <Button
          type="button"
          size="lg"
          onClick={handleGoToDashboard}
          disabled={isNavigating}
          className="w-full md:w-auto rounded-[12px]"
        >
          <LayoutDashboard className="w-4 h-4 mr-2" />
          {isNavigating ? 'Loading...' : 'Go to Dashboard'}
        </Button>
      </div>
    </div>
  )
}
