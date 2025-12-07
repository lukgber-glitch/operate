'use client'

import { Mail, Settings, Search, Plus, Check, X } from 'lucide-react'
import { useState } from 'react'
import {
  AnimatedCard,
  PrimaryButton,
  MinimalInput,
  HeadlineOutside,
  IconButton,
} from '@/components/ui'

export default function MinimalDesignDemo() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = () => {
    setLoading(true)
    setEmailError('')

    // Simulate validation
    setTimeout(() => {
      if (!email.includes('@')) {
        setEmailError('Please enter a valid email')
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)

      // Reset after 2 seconds
      setTimeout(() => {
        setSuccess(false)
        setEmail('')
        setPassword('')
      }, 2000)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-[var(--color-text-primary)]">
            Minimal Design System Demo
          </h1>
          <div className="flex gap-2">
            <IconButton
              icon={<Search className="h-5 w-5" />}
              aria-label="Search"
              onClick={() => alert('Search clicked')}
            />
            <IconButton
              icon={<Settings className="h-5 w-5" />}
              aria-label="Settings"
              onClick={() => alert('Settings clicked')}
            />
          </div>
        </div>

        {/* Icon Buttons Section */}
        <section>
          <HeadlineOutside subtitle="Ghost-style buttons for icons">
            Icon Buttons
          </HeadlineOutside>
          <AnimatedCard variant="default" padding="lg">
            <div className="flex gap-4 flex-wrap">
              <IconButton
                icon={<Plus className="h-5 w-5" />}
                aria-label="Add"
                size="md"
              />
              <IconButton
                icon={<Check className="h-5 w-5" />}
                aria-label="Confirm"
                size="md"
              />
              <IconButton
                icon={<X className="h-5 w-5" />}
                aria-label="Close"
                size="md"
              />
              <IconButton
                icon={<Mail className="h-5 w-5" />}
                aria-label="Email"
                size="sm"
              />
              <IconButton
                icon={<Settings className="h-5 w-5" />}
                aria-label="Settings"
                size="sm"
              />
            </div>
          </AnimatedCard>
        </section>

        {/* Animated Cards Section */}
        <section>
          <HeadlineOutside subtitle="Main container component with variants">
            Animated Cards
          </HeadlineOutside>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedCard variant="default" padding="lg">
              <h3 className="text-lg font-semibold mb-2 text-[var(--color-text-primary)]">
                Default Card
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                Simple border with flat design
              </p>
            </AnimatedCard>

            <AnimatedCard variant="elevated" padding="lg">
              <h3 className="text-lg font-semibold mb-2 text-[var(--color-text-primary)]">
                Elevated Card
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                Subtle shadow that increases on hover
              </p>
            </AnimatedCard>

            <AnimatedCard variant="outlined" padding="lg">
              <h3 className="text-lg font-semibold mb-2 text-[var(--color-text-primary)]">
                Outlined Card
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                Primary color border for emphasis
              </p>
            </AnimatedCard>
          </div>
        </section>

        {/* Primary Buttons Section */}
        <section>
          <HeadlineOutside subtitle="Main action buttons with states">
            Primary Buttons
          </HeadlineOutside>
          <AnimatedCard variant="default" padding="lg">
            <div className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <PrimaryButton size="sm">Small Button</PrimaryButton>
                <PrimaryButton size="md">Medium Button</PrimaryButton>
                <PrimaryButton size="lg">Large Button</PrimaryButton>
              </div>

              <div className="flex gap-4 flex-wrap">
                <PrimaryButton loading={true}>Loading...</PrimaryButton>
                <PrimaryButton disabled={true}>Disabled</PrimaryButton>
                <PrimaryButton onClick={() => alert('Clicked!')}>
                  Click Me
                </PrimaryButton>
              </div>

              <PrimaryButton fullWidth>Full Width Button</PrimaryButton>
            </div>
          </AnimatedCard>
        </section>

        {/* Minimal Inputs Section */}
        <section>
          <HeadlineOutside subtitle="Clean input fields with floating labels">
            Minimal Inputs
          </HeadlineOutside>
          <AnimatedCard variant="default" padding="lg">
            <div className="space-y-6">
              <MinimalInput
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
                error={emailError}
              />

              <MinimalInput
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={setPassword}
              />

              <MinimalInput
                label="Search"
                type="text"
                placeholder="Search..."
                icon={<Search className="h-5 w-5" />}
              />

              <MinimalInput
                label="Disabled"
                type="text"
                value="This field is disabled"
                disabled
              />
            </div>
          </AnimatedCard>
        </section>

        {/* Interactive Form Demo */}
        <section>
          <HeadlineOutside
            subtitle="Complete example with all components"
            align="center"
          >
            Interactive Login Form
          </HeadlineOutside>
          <div className="max-w-md mx-auto">
            <AnimatedCard variant="elevated" padding="lg">
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                    Welcome Back
                  </h2>
                  <p className="text-[var(--color-text-secondary)]">
                    Sign in to your account
                  </p>
                </div>

                <MinimalInput
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={setEmail}
                  error={emailError}
                  icon={<Mail className="h-5 w-5" />}
                />

                <MinimalInput
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={setPassword}
                />

                <PrimaryButton
                  id="login-btn"
                  fullWidth
                  size="lg"
                  loading={loading}
                  onClick={handleSubmit}
                >
                  {success ? (
                    <>
                      <Check className="h-5 w-5" />
                      Success!
                    </>
                  ) : (
                    'Sign In'
                  )}
                </PrimaryButton>

                <div className="text-center">
                  <button
                    className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
                    onClick={() => alert('Forgot password')}
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>
            </AnimatedCard>
          </div>
        </section>

        {/* Design Tokens */}
        <section>
          <HeadlineOutside subtitle="Color palette and spacing">
            Design Tokens
          </HeadlineOutside>
          <AnimatedCard variant="default" padding="lg">
            <div className="space-y-6">
              {/* Colors */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-[var(--color-text-primary)]">
                  Colors
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="h-16 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white font-medium">
                      Primary
                    </div>
                    <code className="text-xs text-[var(--color-text-secondary)]">
                      #04BDA5
                    </code>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center font-medium">
                      Surface
                    </div>
                    <code className="text-xs text-[var(--color-text-secondary)]">
                      #FCFEFE
                    </code>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center font-medium">
                      Background
                    </div>
                    <code className="text-xs text-[var(--color-text-secondary)]">
                      #F2F2F2
                    </code>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-lg bg-[var(--color-text-primary)] flex items-center justify-center text-white font-medium">
                      Text
                    </div>
                    <code className="text-xs text-[var(--color-text-secondary)]">
                      #1A1A2E
                    </code>
                  </div>
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-[var(--color-text-primary)]">
                  Border Radius
                </h3>
                <div className="flex gap-4 flex-wrap">
                  <div className="text-center">
                    <div className="h-16 w-16 rounded-[12px] bg-[var(--color-primary)] mb-2"></div>
                    <code className="text-xs">12px (inputs)</code>
                  </div>
                  <div className="text-center">
                    <div className="h-16 w-16 rounded-[24px] bg-[var(--color-primary)] mb-2"></div>
                    <code className="text-xs">24px (cards)</code>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </section>
      </div>
    </div>
  )
}
