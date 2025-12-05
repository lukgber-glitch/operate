import { cn } from '@/lib/utils';
import * as React from 'react';

type ValidHTMLElement = 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label' | 'caption';

interface ScreenReaderOnlyProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  as?: ValidHTMLElement;
}

/**
 * ScreenReaderOnly component
 * Visually hides content while keeping it accessible to screen readers
 * WCAG 2.1 compliant
 */
export function ScreenReaderOnly({
  children,
  as: Component = 'span',
  className,
  ...props
}: ScreenReaderOnlyProps) {
  return (
    <Component className={cn('sr-only', className)} {...props}>
      {children}
    </Component>
  );
}
