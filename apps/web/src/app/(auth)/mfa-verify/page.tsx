'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader2, Shield, Lock, Smartphone } from 'lucide-react';

import { MfaInput } from '@/components/auth/mfa-input';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { LanguageSelector } from '@/components/auth/language-selector';
import { useAuth } from '@/hooks/use-auth';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

export default function MfaVerifyPage() {
  const router = useRouter();
  const { verifyMfa } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [showBackupCode, setShowBackupCode] = useState(false);

  const handleMfaComplete = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await verifyMfa({ code, rememberDevice });
      router.push('/chat');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid verification code';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaError = (error: string) => {
    setError(error);
  };

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
            <h1 className="text-xl font-semibold text-white">Two-factor authentication</h1>
            <p className="text-sm text-gray-300/90 mt-1">Enter the 6-digit code from your authenticator app</p>
          </div>

          <div className="space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"
                  role="alert"
                  aria-live="assertive"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-400">Verification failed</p>
                      <p className="text-sm text-red-400/80">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form className="space-y-4" aria-busy={isLoading}>
              <div className="space-y-4">
                <MfaInput
                  length={6}
                  onComplete={handleMfaComplete}
                  onError={handleMfaError}
                  disabled={isLoading}
                  autoSubmit={!rememberDevice}
                />

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberDevice"
                    checked={rememberDevice}
                    onCheckedChange={(checked: boolean) => setRememberDevice(checked)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="rememberDevice"
                    className="text-sm font-normal text-white cursor-pointer min-h-[44px] flex items-center py-3"
                  >
                    Remember this device for 30 days
                  </Label>
                </div>

                {rememberDevice && (
                  <motion.button
                    type="button"
                    onClick={() => {
                      const code = Array.from({ length: 6 }, (_, i) => {
                        const input = document.querySelector(`input[aria-label="Digit ${i + 1}"]`) as HTMLInputElement;
                        return input?.value || '';
                      }).join('');
                      if (code.length === 6) {
                        handleMfaComplete(code);
                      }
                    }}
                    disabled={isLoading}
                    className="relative w-full px-8 py-4 rounded-xl font-semibold text-white overflow-hidden group disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 transition-opacity" />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify Code
                          <motion.svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            initial={{ x: 0 }}
                            whileHover={{ x: 4 }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </motion.svg>
                        </>
                      )}
                    </span>
                  </motion.button>
                )}
              </div>
            </form>

            <div className="text-center text-sm">
              <span className="text-gray-400">Lost access to your device? </span>
              <button
                onClick={() => setShowBackupCode(!showBackupCode)}
                className="text-white/70 hover:text-white hover:underline font-medium inline-flex items-center min-h-[44px] py-3 px-2"
              >
                Use backup code
              </button>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Trust Signals */}
      <motion.div
        variants={fadeUpVariants}
        className="flex items-center justify-center gap-6 text-xs text-gray-400 mt-6"
      >
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4" />
          <span>Secure Authentication</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="w-4 h-4" />
          <span>End-to-end Encrypted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-4 h-4" />
          <span>Multi-device Support</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
