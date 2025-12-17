'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Skeleton } from '@/components/ui/skeleton';
import { LanguageSelector } from '@/components/auth/language-selector';
import { authApi } from '@/lib/auth';

// Animation variants
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

const iconVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 15,
      delay: 0.2,
    },
  },
};

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid or missing verification token.');
        return;
      }

      try {
        const response = await authApi.verifyEmail({ token });
        setStatus('success');
        setMessage(response.message || 'Your email has been verified successfully!');
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Email verification failed. The link may have expired.');
      }
    };

    verifyEmail();
  }, [token]);

  const getTitle = () => {
    if (status === 'loading') return 'Verifying your email...';
    if (status === 'success') return 'Email verified!';
    return 'Verification failed';
  };

  const getSubtitle = () => {
    if (status === 'loading') return 'Please wait while we verify your email address';
    return message;
  };

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
            <h1 className="text-xl font-semibold text-white">{getTitle()}</h1>
            <p className="text-sm text-gray-300/90 mt-1">{getSubtitle()}</p>
          </div>
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {status === 'loading' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-8 space-y-4"
                >
                  <Loader2 className="h-16 w-16 text-white/70 animate-spin" />
                  <p className="text-sm text-white/70">Verifying your email...</p>
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-6"
                >
                  <motion.div
                    className="flex justify-center py-4"
                    variants={iconVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="relative">
                      <motion.div
                        className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <CheckCircle className="h-16 w-16 text-green-500 relative z-10" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center space-y-2"
                  >
                    <h3 className="text-lg font-semibold text-white">Email Verified!</h3>
                    <p className="text-sm text-white/70">
                      Your email has been successfully verified. You can now sign in to your account.
                    </p>
                  </motion.div>

                  <motion.button
                    onClick={() => router.push('/login')}
                    className="relative w-full px-8 py-4 rounded-xl font-semibold text-white overflow-hidden group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 transition-opacity" />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Continue to Login
                      <motion.div
                        initial={{ x: 0 }}
                        whileHover={{ x: 4 }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </span>
                  </motion.button>
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-6"
                >
                  <motion.div
                    className="flex justify-center py-4"
                    variants={iconVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="relative">
                      <motion.div
                        className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <XCircle className="h-16 w-16 text-destructive relative z-10" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-400">Verification Failed</p>
                        <p className="text-sm text-red-400/80 mt-1">{message}</p>
                      </div>
                    </div>
                  </motion.div>

                  <div className="space-y-2">
                    <motion.button
                      onClick={() => router.push('/login')}
                      className="relative w-full px-8 py-4 rounded-xl font-semibold text-white overflow-hidden group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 transition-opacity" />
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Go to Login
                        <motion.div
                          initial={{ x: 0 }}
                          whileHover={{ x: 4 }}
                        >
                          <ArrowRight className="w-5 h-5" />
                        </motion.div>
                      </span>
                    </motion.button>

                    <motion.button
                      onClick={() => router.push('/register')}
                      className="w-full px-8 py-4 rounded-xl font-semibold border-2 border-white/10 hover:border-white/20 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      Create New Account
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>
      </motion.div>

      {/* Trust Signal */}
      <motion.div
        variants={fadeUpVariants}
        className="text-center text-sm text-gray-400 mt-6"
      >
        <p>Secured with enterprise-grade encryption</p>
      </motion.div>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="w-full">
        <GlassCard intensity="onDark" className="w-full rounded-[16px] p-6 lg:p-8">
          <div className="flex justify-center mb-4">
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="text-center mb-6">
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto mt-2" />
          </div>
          <Skeleton className="h-40 w-full" />
        </GlassCard>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
