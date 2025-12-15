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

import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';

type RegisterFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

export function RegisterForm() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { register: registerUser, error: authError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const registerSchema = useMemo(() => z.object({
    firstName: z.string().min(2, t('firstNameTooShort')),
    lastName: z.string().min(2, t('lastNameTooShort')),
    email: z.string().email(t('invalidEmail')),
    password: z
      .string()
      .min(8, t('passwordTooShort'))
      .regex(/[A-Z]/, t('passwordUppercase'))
      .regex(/[a-z]/, t('passwordLowercase'))
      .regex(/[0-9]/, t('passwordNumber')),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: t('mustAcceptTerms'),
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('passwordsDoNotMatch'),
    path: ['confirmPassword'],
  }), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const acceptTerms = watch('acceptTerms');

  // Watch email for inline validation
  const email = watch('email');
  const isValidEmail = email && email.includes('@') && email.includes('.') && !errors.email;

  // Watch passwords for match indicator
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  // Animation variants
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        acceptTerms: data.acceptTerms,
      });

      router.push('/chat');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('registrationError');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthError = (error: string) => {
    setError(error);
  };

  return (
    <div className="space-y-6">
      <OAuthButtons onError={handleOAuthError} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-label="Registration form" aria-busy={isLoading}>
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
                  <p className="font-medium text-red-400">Registration failed</p>
                  <p className="text-sm text-red-400/80">{error || authError}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-full overflow-hidden">
          <div className="space-y-2 min-w-0">
            <Label htmlFor="firstName" className="text-white">{t('firstName')}</Label>
            <Input
              id="firstName"
              type="text"
              placeholder={t('firstNamePlaceholder')}
              {...register('firstName')}
              disabled={isLoading}
              className={errors.firstName ? 'border-destructive' : ''}
              aria-invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            />
            {errors.firstName && (
              <p id="firstName-error" className="text-sm text-destructive" role="alert">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div className="space-y-2 min-w-0">
            <Label htmlFor="lastName" className="text-white">{t('lastName')}</Label>
            <Input
              id="lastName"
              type="text"
              placeholder={t('lastNamePlaceholder')}
              {...register('lastName')}
              disabled={isLoading}
              className={errors.lastName ? 'border-destructive' : ''}
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            />
            {errors.lastName && (
              <p id="lastName-error" className="text-sm text-destructive" role="alert">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-white">{t('email')}</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder={t('emailPlaceholder')}
              {...register('email')}
              disabled={isLoading}
              className={`pr-10 ${errors.email ? 'border-destructive' : ''}`}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              autoComplete="email"
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
            <p id="email-error" className="text-sm text-destructive" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-white">{t('password')}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('createPasswordPlaceholder')}
              {...register('password')}
              disabled={isLoading}
              className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error password-hint' : 'password-hint'}
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
              role="alert"
            >
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              <span>Caps Lock is on</span>
            </motion.div>
          )}
          <p id="password-hint" className="text-xs text-white/60">
            {t('passwordHint')}
          </p>
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-white">{t('confirmPassword')}</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder={t('reenterPasswordPlaceholder')}
              {...register('confirmPassword')}
              disabled={isLoading}
              className={`pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
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
              role="status"
            >
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
              <span>Passwords match</span>
            </motion.div>
          )}
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="text-sm text-destructive" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="acceptTerms"
              checked={acceptTerms}
              onCheckedChange={(checked: boolean) => setValue('acceptTerms', checked)}
              disabled={isLoading}
              className="mt-3"
              aria-invalid={!!errors.acceptTerms}
              aria-describedby={errors.acceptTerms ? 'acceptTerms-error' : undefined}
            />
            <Label
              htmlFor="acceptTerms"
              className="text-sm font-normal leading-relaxed cursor-pointer min-h-[44px] flex items-center py-3 text-white"
            >
              {t('iAgreeToThe')}{' '}
              <Link href="/terms" className="text-primary hover:underline inline-flex items-center min-h-[44px] py-2 px-1">
                {t('termsOfService')}
              </Link>{' '}
              {t('and')}{' '}
              <Link href="/privacy" className="text-primary hover:underline inline-flex items-center min-h-[44px] py-2 px-1">
                {t('privacyPolicy')}
              </Link>
            </Label>
          </div>
          {errors.acceptTerms && (
            <p id="acceptTerms-error" className="text-sm text-destructive" role="alert">
              {errors.acceptTerms.message}
            </p>
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
                Creating account...
              </>
            ) : (
              <>
                Create Account
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

      <div className="text-center text-sm mt-4">
        <span className="text-white/70">{t('alreadyHaveAccount')} </span>
        <Link href="/login" className="text-white hover:underline font-medium inline-flex items-center min-h-[44px] py-3 px-2">
          {t('signIn')}
        </Link>
      </div>
    </div>
  );
}
