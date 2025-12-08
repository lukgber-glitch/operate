/**
 * WelcomeStep Component
 * First step of the onboarding wizard - introduces users to the platform
 */

'use client'

import * as React from 'react'
import { Building2, FileText, Mail, CreditCard, Settings, Sparkles } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const FEATURES = [
  {
    icon: Building2,
    title: 'Company Profile',
    description: 'Set up your business information and legal details',
    duration: '2 min',
  },
  {
    icon: CreditCard,
    title: 'Bank Connection',
    description: 'Connect your bank account for automated transaction sync',
    duration: '3 min',
    optional: true,
  },
  {
    icon: Mail,
    title: 'Email Integration',
    description: 'Link your email to automatically process invoices',
    duration: '2 min',
    optional: true,
  },
  {
    icon: FileText,
    title: 'Tax Software',
    description: 'Connect to ELSTER or other tax platforms',
    duration: '3 min',
    optional: true,
  },
  {
    icon: Settings,
    title: 'Preferences',
    description: 'Customize your language, timezone, and notifications',
    duration: '2 min',
  },
]

export function WelcomeStep() {
  return (
    <div className="space-y-6">
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>

      {/* Headline */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome to Operate</h1>
        <p className="text-muted-foreground">
          Your all-in-one platform for business operations, tax automation, and HR management
        </p>
      </div>

      <Card className="rounded-[24px]">
        <CardContent className="p-6 space-y-6">
          {/* Overview */}
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-sm text-muted-foreground text-center">
              We&apos;ll guide you through a quick setup process to get your account ready.
              This will take approximately <strong>10-15 minutes</strong> to complete.
              You can skip optional steps and return to them later.
            </p>
          </div>

          {/* What to Expect */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">What to Expect</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {FEATURES.map((feature) => (
                <Card key={feature.title} className="border-muted">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-2 rounded-lg bg-primary/10">
                        <feature.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">{feature.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {feature.duration}
                            </Badge>
                            {feature.optional && (
                              <Badge variant="outline" className="text-xs">
                                Optional
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="rounded-lg bg-primary/5 p-4 space-y-3">
            <h4 className="text-sm font-semibold">Why complete the setup?</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>
                  <strong>Save time:</strong> Automate invoice processing, expense tracking, and tax reporting
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>
                  <strong>Stay compliant:</strong> Ensure your business meets all tax and regulatory requirements
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>
                  <strong>Gain insights:</strong> Get real-time visibility into your business finances and operations
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>
                  <strong>Work smarter:</strong> Let AI classify transactions and suggest optimizations
                </span>
              </li>
            </ul>
          </div>

          {/* Privacy Note */}
          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground">
              Your data is encrypted and secure. We never share your information with third parties.
              <br />
              You can modify any settings later from your dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
