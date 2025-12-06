'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

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
  } = useForm<ResetRequestFormData>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: {
      email: '',
    },
  });

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
        <div className="bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 text-sm p-4 rounded-md border border-green-200 dark:border-green-800">
          <p className="font-medium mb-1">{t('checkYourEmail')}</p>
          <p>{t('resetLinkSent')}</p>
        </div>

        <div className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline font-medium">
            {t('returnToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">{t('emailAddress')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t('emailPlaceholder')}
          {...register('email')}
          disabled={isLoading}
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t('sendingResetLink')}
          </>
        ) : (
          t('sendResetLink')
        )}
      </Button>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">{t('rememberPassword')} </span>
        <Link href="/login" className="text-primary hover:underline font-medium">
          {t('signIn')}
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
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

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
        <div className="bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 text-sm p-4 rounded-md border border-green-200 dark:border-green-800">
          <p className="font-medium mb-1">{t('passwordResetSuccess')}</p>
          <p>{t('passwordResetSuccessMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">{t('newPassword')}</Label>
        <Input
          id="password"
          type="password"
          placeholder={t('createPasswordPlaceholder')}
          {...register('password')}
          disabled={isLoading}
          className={errors.password ? 'border-destructive' : ''}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {t('passwordHint')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('confirmNewPassword')}</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder={t('reenterPasswordPlaceholder')}
          {...register('confirmPassword')}
          disabled={isLoading}
          className={errors.confirmPassword ? 'border-destructive' : ''}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t('resettingPassword')}
          </>
        ) : (
          t('resetPassword')
        )}
      </Button>
    </form>
  );
}
