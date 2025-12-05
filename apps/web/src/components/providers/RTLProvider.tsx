'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';

/**
 * RTL Provider Component
 *
 * Automatically detects and applies RTL (Right-to-Left) direction based on the current locale.
 * Manages document direction and applies necessary CSS classes for RTL languages.
 */

// RTL languages list
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

interface RTLProviderProps {
  children: React.ReactNode;
}

export function RTLProvider({ children }: RTLProviderProps) {
  const locale = useLocale();
  const isRTL = RTL_LANGUAGES.includes(locale);

  useEffect(() => {
    // Set document direction
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;

    // Add/remove RTL class on body
    if (isRTL) {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }

    // Set CSS custom property for direction-aware styling
    document.documentElement.style.setProperty('--dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.style.setProperty('--dir-start', isRTL ? 'right' : 'left');
    document.documentElement.style.setProperty('--dir-end', isRTL ? 'left' : 'right');

  }, [locale, isRTL]);

  return <>{children}</>;
}

/**
 * Hook to check if current locale is RTL
 */
export function useIsRTL(): boolean {
  const locale = useLocale();
  return RTL_LANGUAGES.includes(locale);
}

/**
 * Hook to get direction-aware values
 * Useful for programmatic styling that needs to flip based on direction
 */
export function useDirection() {
  const isRTL = useIsRTL();

  return {
    isRTL,
    dir: (isRTL ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
    start: isRTL ? 'right' : 'left',
    end: isRTL ? 'left' : 'right',
    // Utility function to get directional value
    getDirValue: <T,>(ltrValue: T, rtlValue: T): T =>
      isRTL ? rtlValue : ltrValue,
  };
}

/**
 * Component to force LTR direction for specific content
 * Useful for emails, URLs, code, numbers, etc.
 */
export function ForceLTR({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`force-ltr ${className}`} dir="ltr">
      {children}
    </span>
  );
}

/**
 * Component to force RTL direction for specific content
 */
export function ForceRTL({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`force-rtl ${className}`} dir="rtl">
      {children}
    </span>
  );
}

/**
 * Component for mixed content that should use plaintext bidi algorithm
 * Useful for user-generated content that might mix LTR and RTL
 */
export function MixedContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mixed-content ${className}`}>
      {children}
    </div>
  );
}

/**
 * Higher-order component to make a component direction-aware
 */
export function withRTL<P extends object>(
  Component: React.ComponentType<P & { isRTL?: boolean; dir?: 'ltr' | 'rtl' }>
) {
  return function RTLComponent(props: P) {
    const { isRTL, dir } = useDirection();

    return <Component {...props} isRTL={isRTL} dir={dir} />;
  };
}

export default RTLProvider;
