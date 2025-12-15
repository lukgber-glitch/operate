'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, CheckCircle, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/auth';

type ResetRequestFormData = {
  email: string;
};

export function PasswordResetRequestForm() {
  const t = useTranslations('auth');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetRequestSchema = useMemo(() => z.object({
    email: z.string().email(t('invalidEmail')),
  }), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetRequestFormData>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: {
      email: '',
    },
  });

  const email = watch('email');
  const isValidEmail = email && email.includes('@') && email.includes('.') && !errors.email;

  const onSubmit = async (data: ResetRequestFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.forgotPassword({ email: data.email });
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('failedToSendResetEmail');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/10 border border-green-500/20 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-400">{t('checkYourEmail') || 'Reset link sent!'}</p>
              <p className="text-sm text-green-400/80">{t('resetLinkSent') || 'Check your email inbox'}</p>
            </div>
          </div>
        </motion.div>

        <div className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline font-medium inline-flex items-center min-h-[44px] py-3 px-2">
            {t('returnToLogin') || 'Return to login'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-busy={isLoading}>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-400">Request failed</p>
                <p className="text-sm text-red-400/80">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-white">{t('emailAddress') || 'Email address'}</Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            placeholder={t('emailPlaceholder') || 'you@example.com'}
            autoComplete="email"
            {...register('email')}
            disabled={isLoading}
            className={`pr-10 ${errors.email ? 'border-destructive' : ''}`}
          />
          {isValidEmail && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <CheckCircle className="w-5 h-5 text-green-500" />
            </motion.div>
          )}
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <motion.button
        type="submit"
        disabled={isLoading}
        className="relative w-full px-8 py-4 rounded-xl font-semibold text-white overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600" />
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
              {t('sendingResetLink') || 'Sending...'}
            </>
          ) : (
            t('sendResetLink') || 'Send Reset Link'
          )}
        </span>
      </motion.button>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">{t('rememberPassword') || 'Remember your password?'} </span>
        <Link href="/login" className="text-primary hover:underline font-medium inline-flex items-center min-h-[44px] py-3 px-2">
          {t('signIn') || 'Sign in'}
        </Link>
      </div>
    </form>
  );
}

type ResetPasswordFormData = {
  password: string;
  confirmPassword: string;
};

interface PasswordResetFormProps {
  token: string;
}

export function PasswordResetForm({ token }: PasswordResetFormProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const resetPasswordSchema = useMemo(() => z.object({
    password: z
      .string()
      .min(8, t('passwordTooShort'))
      .regex(/[A-Z]/, t('passwordUppercase'))
      .regex(/[a-z]/, t('passwordLowercase'))
      .regex(/[0-9]/, t('passwordNumber')),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('passwordsDoNotMatch'),
    path: ['confirmPassword'],
  }), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Watch passwords for match indicator
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.resetPassword({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('failedToResetPassword');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/10 border border-green-500/20 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-400">{t('passwordResetSuccess') || 'Password reset successful!'}</p>
              <p className="text-sm text-green-400/80">{t('passwordResetSuccessMessage') || 'Redirecting to login...'}</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-busy={isLoading}>
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
                <p className="font-medium text-red-400">Password reset failed</p>
                <p className="text-sm text-red-400/80">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-white">{t('newPassword') || 'New Password'}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={t('createPasswordPlaceholder') || 'Create a strong password'}
            {...register('password')}
            disabled={isLoading}
            className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
            autoComplete="new-password"
            onKeyDown={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
            onKeyUp={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {capsLockOn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 text-yellow-500 text-sm mt-1"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Caps Lock is on</span>
          </motion.div>
        )}
        <p className="text-xs text-muted-foreground">
          {t('passwordHint') || 'At least 8 characters with uppercase, lowercase, and number'}
        </p>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-white">{t('confirmNewPassword') || 'Confirm New Password'}</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder={t('reenterPasswordPlaceholder') || 'Re-enter your password'}
            {...register('confirmPassword')}
            disabled={isLoading}
            className={`pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
            autoComplete="new-password"
            onKeyDown={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
            onKeyUp={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {passwordsMatch && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 text-green-500 text-sm mt-1"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Passwords match</span>
          </motion.div>
        )}
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <motion.button
        type="submit"
        disabled={isLoading}
        className="relative w-full px-8 py-4 rounded-xl font-semibold text-white overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
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
              {t('resettingPassword') || 'Resetting password...'}
            </>
          ) : (
            <>
              {t('resetPassword') || 'Reset Password'}
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
    </form>
  );
}
