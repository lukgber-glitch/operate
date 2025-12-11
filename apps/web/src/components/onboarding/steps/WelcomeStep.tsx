/**
 * WelcomeStep Component - Premium Onboarding Redesign (Phase 18)
 * First step of the onboarding wizard - introduces users to the platform
 * Features: Animated gradient background, Stripe-level design, Framer Motion animations
 */

'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Lock, Lightbulb, Shield, CheckCircle, Building2, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { WelcomeBackground } from '@/components/onboarding/WelcomeBackground'
import { GuruLogo } from '@/components/ui/guru-logo'

// Animation variants for orchestrated, professional animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,      // 120ms delay between children
      delayChildren: 0.2,          // Start after 200ms
    },
  },
}

const fadeUpVariants = {
  hidden: {
    opacity: 0,
    y: 24,           // Subtle 24px shift
    scale: 0.96      // Slight scale for depth
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 260,  // Moderate spring (professional, not bouncy)
      damping: 22,     // Smooth settling
    },
  },
}

const cardHoverVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,     // Subtle lift
    transition: {
      type: 'spring' as const,
      stiffness: 400,  // Snappy response
      damping: 25
    }
  }
}

interface WelcomeStepProps {
  onGetStarted?: () => void
}

export function WelcomeStep({ onGetStarted }: WelcomeStepProps) {
  const [isTransitioning, setIsTransitioning] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleGetStarted = () => {
    setIsTransitioning(true)
    // Call parent navigation handler
    if (onGetStarted) {
      onGetStarted()
    }
  }

  return (
    <motion.div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      variants={containerVariants}
      initial={isMounted ? "hidden" : false}
      animate={isMounted ? "visible" : false}
    >
      {/* Premium animated gradient background */}
      <WelcomeBackground />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 w-full">
        {/* Headline */}
        <motion.div
          className="mb-16"
          variants={fadeUpVariants}
        >
          <h1
            className="text-4xl md:text-6xl font-semibold text-white mb-6 tracking-tight"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            Welcome to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Operate
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300/90 max-w-2xl leading-relaxed">
            Your intelligent business management platform. Let's get you set up in minutes.
          </p>
        </motion.div>

        {/* Feature highlight cards - Staggered animation */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          variants={fadeUpVariants}
        >
          {/* Lightning Fast */}
          <motion.div
            className="flex flex-col items-start gap-4 p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 transition-colors duration-200 hover:bg-white/10 cursor-default"
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
          >
            <div className="group">
              <Zap className="w-8 h-8 text-white/70 transition-all duration-200 group-hover:text-white group-hover:scale-110" />
            </div>
            <div>
              <h3 className="text-base font-medium text-white mb-1.5">Lightning Fast</h3>
              <p className="text-sm text-gray-300/80 leading-relaxed">
                Set up your account in under 5 minutes and start automating immediately
              </p>
            </div>
          </motion.div>

          {/* Bank-Level Security */}
          <motion.div
            className="flex flex-col items-start gap-4 p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 transition-colors duration-200 hover:bg-white/10 cursor-default"
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
          >
            <div className="group">
              <Lock className="w-8 h-8 text-white/70 transition-all duration-200 group-hover:text-white group-hover:scale-110" />
            </div>
            <div>
              <h3 className="text-base font-medium text-white mb-1.5">Bank-Level Security</h3>
              <p className="text-sm text-gray-300/80 leading-relaxed">
                Your data is encrypted with 256-bit encryption and stored securely
              </p>
            </div>
          </motion.div>

          {/* AI-Powered Insights */}
          <motion.div
            className="flex flex-col items-start gap-4 p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 transition-colors duration-200 hover:bg-white/10 cursor-default"
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
          >
            <div className="group">
              <Lightbulb className="w-8 h-8 text-white/70 transition-all duration-200 group-hover:text-white group-hover:scale-110" />
            </div>
            <div>
              <h3 className="text-base font-medium text-white mb-1.5">AI-Powered Insights</h3>
              <p className="text-sm text-gray-300/80 leading-relaxed">
                Smart automation classifies transactions and suggests optimizations
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* CTA Buttons - Animates after cards */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          variants={fadeUpVariants}
        >
          <motion.button
            onClick={handleGetStarted}
            disabled={isTransitioning}
            className="relative px-8 py-4 rounded-xl font-semibold text-white overflow-hidden group disabled:opacity-75 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
          >
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600" />

            {/* Animated gradient overlay on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />

            {/* Text with loading state */}
            <span className="relative z-10 flex items-center gap-2">
              <AnimatePresence mode="wait">
                {isTransitioning ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting...
                  </motion.span>
                ) : (
                  <motion.span
                    key="text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    Get Started
                    <motion.svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </motion.svg>
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </motion.button>

          <motion.button
            className="px-8 py-4 rounded-xl font-semibold text-white border-2 border-white/20 hover:border-white/40 transition-colors duration-200 hover:bg-white/5"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
          >
            <span className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Import Data
            </span>
          </motion.button>
        </motion.div>

        {/* Trust signals - Last to animate */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400"
          variants={fadeUpVariants}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" fill="currentColor" />
            <span>SOC 2 Compliant</span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" fill="currentColor" />
            <span>GDPR Ready</span>
          </div>

          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            <span>256-bit Encryption</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
