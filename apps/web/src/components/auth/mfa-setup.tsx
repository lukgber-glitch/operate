'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Download, Loader2, QrCode, Key, Shield } from 'lucide-react';

import { MfaInput } from '@/components/auth/mfa-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useMfa } from '@/hooks/use-mfa';

export function MfaSetup() {
  const router = useRouter();
  const { setupMfa, verifyMfaSetup, isLoading, error } = useMfa();
  const [step, setStep] = useState<'loading' | 'setup' | 'verify'>('loading');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    const initSetup = async () => {
      try {
        const data = await setupMfa();
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
        setBackupCodes(data.backupCodes);
        setStep('setup');
      } catch (err) {        setStep('setup');
      }
    };

    initSetup();
  }, [setupMfa]);

  const handleVerifyCode = async (code: string) => {
    setVerifyError(null);
    try {
      await verifyMfaSetup(code);
      setStep('verify');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid verification code';
      setVerifyError(message);
    }
  };

  const handleComplete = () => {
    router.push('/chat');
  };

  if (step === 'loading') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-64 mx-auto" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          className="bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 p-4 rounded-xl border border-green-200 dark:border-green-800"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Two-factor authentication enabled!</p>
              <p className="text-sm opacity-90">Your account is now protected with 2FA.</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold text-white flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Backup Codes
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Save these codes in a secure place. You can use them to access your account if you lose your authenticator device.
            </p>
            <motion.div
              className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-xl font-mono text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {backupCodes.map((code, index) => (
                <motion.div
                  key={index}
                  className="p-2 bg-background rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (index * 0.05) }}
                >
                  {code}
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.button
            onClick={() => {
              // Download backup codes as text file
              const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'operate-backup-codes.txt';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="w-full px-6 py-3 rounded-xl font-medium border border-border hover:bg-accent transition-colors flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download className="w-4 h-4" />
            Download Backup Codes
          </motion.button>

          <motion.button
            onClick={handleComplete}
            className="relative w-full px-8 py-4 rounded-xl font-semibold text-white overflow-hidden group"
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
              Continue to Dashboard
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
            </span>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <form className="space-y-6" aria-busy={isLoading}>
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
                <p className="font-medium text-red-400">Setup Error</p>
                <p className="text-sm text-red-400/80">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Label className="text-base font-semibold text-white flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            Step 1: Scan QR Code
          </Label>
          <p className="text-sm text-muted-foreground mb-4">
            Use an authenticator app like Google Authenticator, Authy, or 1Password to scan this QR code.
          </p>
          {qrCodeUrl ? (
            <motion.div
              className="flex justify-center p-6 bg-white rounded-xl shadow-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <img src={qrCodeUrl} alt="MFA QR Code" className="w-64 h-64" />
            </motion.div>
          ) : (
            <Skeleton className="h-64 w-64 mx-auto" />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Label className="text-base font-semibold text-white flex items-center gap-2">
            <Key className="w-4 h-4" />
            Step 2: Enter Secret Key (Optional)
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            If you can&apos;t scan the QR code, enter this secret key manually:
          </p>
          <motion.div
            className="p-3 bg-muted rounded-xl font-mono text-sm break-all"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {secret || 'Loading...'}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Label className="text-base font-semibold text-white flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Step 3: Verify Code
          </Label>
          <p className="text-sm text-muted-foreground mb-4">
            Enter the 6-digit code from your authenticator app to confirm setup.
          </p>

          <AnimatePresence>
            {verifyError && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4"
                role="alert"
                aria-live="assertive"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-400">Verification Failed</p>
                    <p className="text-sm text-red-400/80">{verifyError}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <MfaInput
            length={6}
            onComplete={handleVerifyCode}
            onError={setVerifyError}
            disabled={isLoading}
            autoSubmit={true}
          />
        </motion.div>
      </div>

      <div className="text-center text-sm">
        <motion.button
          type="button"
          onClick={() => router.push('/chat')}
          className="text-muted-foreground hover:underline inline-flex items-center min-h-[44px] py-3 px-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Skip for now
        </motion.button>
      </div>
    </form>
  );
}
