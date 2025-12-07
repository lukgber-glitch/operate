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
import { AnimatedCard } from '@/components/ui/animated-card'
import { useGSAP } from '@gsap/react'
import { gsap, staggerIn } from '@/lib/gsap'

const NEXT_STEPS = [
  {
    icon: LayoutDashboard,
    title: 'Explore Your Dashboard',
    description: 'Get an overview of your business metrics and recent activity',
    action: 'Go to Dashboard',
    href: '/dashboard',
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
}

export function CompletionStep({ companyName, setupCompleted }: CompletionStepProps) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = React.useState(false)
  const checkmarkRef = React.useRef<HTMLDivElement>(null)
  const titleRef = React.useRef<HTMLHeadingElement>(null)
  const descriptionRef = React.useRef<HTMLParagraphElement>(null)
  const badgeRef = React.useRef<HTMLDivElement>(null)
  const nextStepsRef = React.useRef<HTMLDivElement>(null)
  const ctaButtonRef = React.useRef<HTMLButtonElement>(null)

  // Celebration animation sequence
  useGSAP(() => {
    const tl = gsap.timeline({ delay: 0.2 })

    // Checkmark bounces in with rotation
    tl.fromTo(
      checkmarkRef.current,
      { scale: 0, rotation: -180, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: 'back.out(2)' }
    )
      // Add a little bounce
      .to(checkmarkRef.current, {
        scale: 1.1,
        duration: 0.15,
        ease: 'power2.out',
      })
      .to(checkmarkRef.current, {
        scale: 1,
        duration: 0.15,
        ease: 'power2.in',
      })
      // Title fades up
      .fromTo(
        titleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.2'
      )
      // Description fades up
      .fromTo(
        descriptionRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
        '-=0.2'
      )
      // Badge pops in
      .fromTo(
        badgeRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' },
        '-=0.1'
      )

    // Stagger next steps cards
    if (nextStepsRef.current) {
      const cards = nextStepsRef.current.querySelectorAll('.next-step-card')
      staggerIn(cards, {
        delay: 1.2,
        stagger: 0.08,
        duration: 0.4,
      })
    }

    // CTA button pulses in at the end
    if (ctaButtonRef.current) {
      tl.fromTo(
        ctaButtonRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' },
        '-=0.2'
      )
        // Add subtle pulse animation
        .to(ctaButtonRef.current, {
          scale: 1.05,
          duration: 0.6,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1,
        })
    }
  }, [])

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

      // Navigate to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      // Still try to navigate - set cookie and go
      document.cookie = 'onboarding_complete=true; path=/; max-age=31536000; SameSite=Lax'
      localStorage.removeItem('operate_onboarding_progress')
      router.push('/dashboard')
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
      {/* Success Message */}
      <AnimatedCard variant="elevated" padding="lg" className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
        <div className="text-center space-y-4">
          <div
            ref={checkmarkRef}
            className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
            style={{ opacity: 0 }}
          >
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-500" />
          </div>
          <div>
            <h2
              ref={titleRef}
              className="text-2xl font-semibold text-green-900 dark:text-green-100"
              style={{ opacity: 0 }}
            >
              Setup Complete!
            </h2>
            <p
              ref={descriptionRef}
              className="text-base mt-2 text-green-700 dark:text-green-300"
              style={{ opacity: 0 }}
            >
              {companyName
                ? `Welcome aboard, ${companyName}! Your account is ready to use.`
                : 'Your account is ready to use.'}
            </p>
          </div>
        </div>
        <div className="text-center space-y-4 mt-6">
          <div
            ref={badgeRef}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 text-sm"
            style={{ opacity: 0 }}
          >
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>
              <strong>{completedIntegrations}</strong> integration
              {completedIntegrations !== 1 ? 's' : ''} connected
            </span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300 max-w-md mx-auto">
            You&apos;re all set! Your business is now connected to Operate and ready to streamline
            your operations.
          </p>
        </div>
      </AnimatedCard>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">What Would You Like to Do First?</h3>
        <div ref={nextStepsRef} className="grid gap-4 md:grid-cols-2">
          {NEXT_STEPS.map((step) => (
            <AnimatedCard
              key={step.title}
              variant="outlined"
              padding="sm"
              className="next-step-card hover:border-primary/50 transition-all cursor-pointer group"
              style={{ opacity: 0 }}
              onClick={(e) => handleNavigate(e, step.href)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 rounded-lg bg-[var(--color-primary)]/10 group-hover:bg-[var(--color-primary)]/20 transition-colors">
                  <step.icon className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium group-hover:text-[var(--color-primary)] transition-colors">
                      {step.title}
                    </h4>
                    <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">{step.description}</p>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </div>

      {/* Resources */}
      <AnimatedCard variant="default" padding="lg">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Need Help Getting Started?</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">Check out these resources to make the most of Operate</p>
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
                <span className="text-xs text-muted-foreground">{resource.description}</span>
              </Button>
            ))}
          </div>
        </div>
      </AnimatedCard>

      {/* Tips */}
      <AnimatedCard variant="default" padding="lg" className="bg-muted/50">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">💡 Pro Tips</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
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
      </AnimatedCard>

      {/* Primary CTA */}
      <div className="flex justify-center pt-4">
        <Button
          ref={ctaButtonRef}
          type="button"
          size="lg"
          onClick={handleGoToDashboard}
          disabled={isNavigating}
          className="w-full md:w-auto rounded-[12px] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
          style={{ opacity: 0 }}
        >
          <LayoutDashboard className="w-4 h-4 mr-2" />
          {isNavigating ? 'Loading...' : 'Go to Dashboard'}
        </Button>
      </div>
    </div>
  )
}
