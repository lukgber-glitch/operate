'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, CheckCircle, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';

import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';

export function LoginForm() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { login, error: authError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const loginSchema = z.object({
    email: z.string().email(t('invalidEmail') || 'Please enter a valid email address'),
    password: z.string().min(8, t('passwordTooShort') || 'Password must be at least 8 characters'),
    rememberMe: z.boolean().optional(),
  });

  type LoginFormData = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const rememberMe = watch('rememberMe');

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      if (result.requiresMfa) {
        router.push('/mfa');
      } else {
        router.push('/chat');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('loginError') || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthError = (error: string) => {
    setError(error);
  };

  const email = watch('email');
  const isValidEmail = email && email.includes('@') && email.includes('.') && !errors.email;

  return (
    <div className="space-y-6">
      <OAuthButtons onError={handleOAuthError} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-busy={isLoading}>
        <AnimatePresence>
          {(error || authError) && (
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
                  <p className="font-medium text-red-300">Sign in failed</p>
                  <p className="text-sm text-red-300/80">{error || authError}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-white">{t('email')}</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder={t('emailPlaceholder') || 'you@example.com'}
              autoComplete="username email"
              {...register('email')}
              disabled={isLoading}
              className={`pr-10 ${errors.email ? 'border-destructive' : ''}`}
            />
            {isValidEmail && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label="Valid email address"
              >
                <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />
              </motion.div>
            )}
          </div>
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-white">
              {t('password')}
              <span className="sr-only">, minimum 8 characters</span>
            </Label>
            <Link
              href="/forgot-password"
              className="text-sm text-white/70 hover:text-white hover:underline inline-flex items-center min-h-[44px] py-3"
            >
              {t('forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder') || 'Enter your password'}
              autoComplete="current-password"
              {...register('password')}
              disabled={isLoading}
              className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
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
              role="alert"
            >
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              <span>Caps Lock is on</span>
            </motion.div>
          )}
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(checked: boolean) => setValue('rememberMe', checked)}
            disabled={isLoading}
          />
          <Label
            htmlFor="rememberMe"
            className="text-sm font-normal cursor-pointer min-h-[44px] flex items-center py-3 text-white"
          >
            {t('rememberMe')}
          </Label>
        </div>

        <motion.button
          type="submit"
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
                Signing in...
              </>
            ) : (
              <>
                Sign In
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

      <div className="text-center text-sm">
        <span className="text-white/60">{t('dontHaveAccount')} </span>
        <Link href="/register" className="text-white hover:underline font-medium inline-flex items-center min-h-[44px] py-3 px-2">
          {t('signUp')}
        </Link>
      </div>
    </div>
  );
}
