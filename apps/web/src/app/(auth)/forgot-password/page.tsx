'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock } from 'lucide-react';

import { PasswordResetRequestForm } from '@/components/auth/password-reset-form';
import { GlassCard } from '@/components/ui/glass-card';
import { LanguageSelector } from '@/components/auth/language-selector';
import { Skeleton } from '@/components/ui/skeleton';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 }
  }
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 22 }
  }
};

function ForgotPasswordContent() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();

  // DEFENSIVE: This is /forgot-password - should NEVER check for token
  // If someone lands here with a token param, ignore it completely
  // Tokens are ONLY for /reset-password page
  const hasToken = searchParams.get('token');

  // Log warning if token detected on wrong page
  if (hasToken && typeof window !== 'undefined') {
    console.warn('[ForgotPassword] Token detected on /forgot-password page. This is incorrect - tokens belong on /reset-password');
  }

  return (
    <motion.div
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUpVariants}>
        <GlassCard intensity="onDark" className="w-full rounded-[24px] p-6 lg:p-8">
          {/* Language selector inside card, centered above welcome */}
          <div className="flex justify-center mb-4">
            <LanguageSelector />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-white">{t('forgotPasswordTitle') || 'Reset password'}</h1>
            <p className="text-sm text-gray-300/90 mt-1">{t('forgotPasswordDescription') || "Enter your email address and we'll send you a link to reset your password"}</p>
          </div>

          {/* ALWAYS show email form - this is the request page, not the reset page */}
          <PasswordResetRequestForm />
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
          <span>Secure reset</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="w-full">
        <GlassCard intensity="onDark" className="w-full rounded-[24px] p-6 lg:p-8">
          <div className="flex justify-center mb-4">
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="text-center mb-6">
            <Skeleton className="h-7 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <Skeleton className="h-40 w-full" />
        </GlassCard>
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}

// Force dynamic rendering to prevent any static build issues
export const dynamic = 'force-dynamic';
