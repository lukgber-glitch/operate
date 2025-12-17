'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock } from 'lucide-react';

import { PasswordResetForm } from '@/components/auth/password-reset-form';
import { GlassCard } from '@/components/ui/glass-card';
import { Skeleton } from '@/components/ui/skeleton';
import { LanguageSelector } from '@/components/auth/language-selector';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } }
};

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <motion.div
        className="w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUpVariants}>
          <GlassCard intensity="onDark" className="w-full rounded-[16px] p-6 lg:p-8">
            {/* Language selector inside card, centered */}
            <div className="flex justify-center mb-4">
              <LanguageSelector />
            </div>

            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold text-white">Invalid Reset Link</h1>
              <p className="text-sm text-gray-300/90 mt-1">This password reset link is invalid or has expired.</p>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
              <p className="text-red-400 text-sm text-center">
                Please request a new link from the forgot password page.
              </p>
            </div>
            <div className="text-center">
              <a
                href="/forgot-password"
                className="text-white/70 hover:text-white hover:underline font-medium inline-flex items-center min-h-[44px] py-3 px-2"
              >
                Request New Reset Link
              </a>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUpVariants}>
        <GlassCard intensity="onDark" className="w-full rounded-[16px] p-6 lg:p-8">
          {/* Language selector inside card, centered */}
          <div className="flex justify-center mb-4">
            <LanguageSelector />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-white">Set new password</h1>
            <p className="text-sm text-gray-300/90 mt-1">Enter your new password below</p>
          </div>

          <PasswordResetForm token={token} />
        </GlassCard>
      </motion.div>

      <motion.div
        variants={fadeUpVariants}
        className="flex items-center justify-center gap-6 text-xs text-gray-400 mt-6"
      >
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-green-500" />
          <span>256-bit encryption</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-green-500" />
          <span>GDPR compliant</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <GlassCard intensity="medium" className="rounded-[16px] p-6">
          <Skeleton className="h-40 w-full" />
        </GlassCard>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

// Force dynamic rendering to avoid build-time issues with searchParams
export const dynamic = 'force-dynamic';
