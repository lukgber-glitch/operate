'use client';

import { MfaSetup } from '@/components/auth/mfa-setup';
import { GlassCard } from '@/components/ui/glass-card';
import { LanguageSelector } from '@/components/auth/language-selector';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, Lock } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function MfaSetupPage() {
  return (
    <motion.div
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUpVariants}>
        <GlassCard intensity="onDark" className="w-full rounded-[24px] p-6 lg:p-8">
          {/* Language selector inside card, centered */}
          <div className="flex justify-center mb-4">
            <LanguageSelector />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-white">Set up two-factor authentication</h1>
            <p className="text-sm text-gray-300/90 mt-1">Secure your account with an additional layer of protection</p>
          </div>

          <MfaSetup />
        </GlassCard>
      </motion.div>

      {/* Trust Signals - Security-focused */}
      <motion.div
        variants={fadeUpVariants}
        className="flex flex-col gap-4 text-sm text-gray-400 mt-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-blue-500" />
          </div>
          <span>Bank-grade security with end-to-end encryption</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <span>Compatible with all major authenticator apps</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
            <Lock className="w-4 h-4 text-purple-500" />
          </div>
          <span>Backup codes stored securely for account recovery</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
