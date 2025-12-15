'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Shield, Lock } from 'lucide-react';

import { LoginForm } from '@/components/auth/login-form';
import { GlassCard } from '@/components/ui/glass-card';
import { LanguageSelector } from '@/components/auth/language-selector';

// Animation variants matching WelcomeStep choreography
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 22,
    },
  },
};

export function LoginPageWithAnimation() {
  const t = useTranslations('auth');
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <motion.div
      className="w-full"
      variants={containerVariants}
      initial={isMounted ? 'hidden' : false}
      animate={isMounted ? 'visible' : false}
    >
      {/* Card */}
      <motion.div variants={fadeUpVariants}>
        <GlassCard intensity="onDark" className="w-full rounded-[24px] p-6 lg:p-8">
          {/* Language selector inside card, centered above welcome */}
          <div className="flex justify-center mb-4">
            <LanguageSelector />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-white">
              {t('welcomeTitle') || 'Sign In'}
            </h1>
            <p className="text-sm text-gray-300/90 mt-1">
              {t('signInDescription') || 'Enter your credentials to continue'}
            </p>
          </div>
          <LoginForm />
        </GlassCard>
      </motion.div>

      {/* Trust signals */}
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
          <span>SOC 2 compliant</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
