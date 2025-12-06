'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

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

      router.push('/dashboard');
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-label="Registration form">
        {(error || authError) && (
          <div
            role="alert"
            aria-live="assertive"
            className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20"
          >
            {error || authError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">{t('firstName')}</Label>
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

          <div className="space-y-2">
            <Label htmlFor="lastName">{t('lastName')}</Label>
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
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t('emailPlaceholder')}
            {...register('email')}
            disabled={isLoading}
            className={errors.email ? 'border-destructive' : ''}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            autoComplete="email"
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t('password')}</Label>
          <Input
            id="password"
            type="password"
            placeholder={t('createPasswordPlaceholder')}
            {...register('password')}
            disabled={isLoading}
            className={errors.password ? 'border-destructive' : ''}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error password-hint' : 'password-hint'}
            autoComplete="new-password"
          />
          <p id="password-hint" className="text-xs text-muted-foreground">
            {t('passwordHint')}
          </p>
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder={t('reenterPasswordPlaceholder')}
            {...register('confirmPassword')}
            disabled={isLoading}
            className={errors.confirmPassword ? 'border-destructive' : ''}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
            autoComplete="new-password"
          />
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
              className="mt-1"
              aria-invalid={!!errors.acceptTerms}
              aria-describedby={errors.acceptTerms ? 'acceptTerms-error' : undefined}
            />
            <Label
              htmlFor="acceptTerms"
              className="text-sm font-normal leading-relaxed cursor-pointer"
            >
              {t('iAgreeToThe')}{' '}
              <Link href="/terms" className="text-primary hover:underline">
                {t('termsOfService')}
              </Link>{' '}
              {t('and')}{' '}
              <Link href="/privacy" className="text-primary hover:underline">
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

        <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading}>
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
              <span>{t('creatingAccount')}</span>
            </>
          ) : (
            t('createAccount')
          )}
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">{t('alreadyHaveAccount')} </span>
        <Link href="/login" className="text-primary hover:underline font-medium">
          {t('signIn')}
        </Link>
      </div>
    </div>
  );
}
