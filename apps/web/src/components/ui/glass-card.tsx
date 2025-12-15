'use client';

import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/**
 * GlassCard - Glassmorphic card component
 *
 * Features:
 * - Frosted glass effect with backdrop blur
 * - Multiple intensity variants (subtle, medium, strong)
 * - Optional border glow on hover
 * - Entrance animation
 * - Dark mode support
 * - Reduced motion support
 */

const glassCardVariants = cva(
  [
    'relative rounded-3xl overflow-hidden',
    'border transition-all duration-300',
  ],
  {
    variants: {
      intensity: {
        subtle: [
          'bg-white/40 dark:bg-slate-900/40',
          'backdrop-blur-sm',
          'border-white/20 dark:border-slate-700/30',
          'shadow-sm',
        ],
        medium: [
          'bg-white/40 dark:bg-slate-900/40',
          'backdrop-blur-md',
          'border-white/30 dark:border-slate-700/40',
          'shadow-md',
        ],
        strong: [
          'bg-white/80 dark:bg-slate-900/80',
          'backdrop-blur-lg',
          'border-white/40 dark:border-slate-700/50',
          'shadow-lg',
        ],
        blue: [
          'bg-blue-50/70 dark:bg-blue-950/70',
          'backdrop-blur-md',
          'border-blue-200/50 dark:border-blue-800/50',
          'shadow-md shadow-blue-500/5',
        ],
        onDark: [
          'bg-white/5',
          'backdrop-blur-sm',
          'border-white/10',
          // No shadow - matches onboarding style
        ],
      },
      hover: {
        none: '',
        lift: 'hover:shadow-xl hover:-translate-y-1',
        glow: 'hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-300/60',
        scale: 'hover:scale-[1.02]',
      },
      padding: {
        none: '',
        sm: 'p-3',
        md: 'p-4 md:p-6',
        lg: 'p-6 md:p-8',
      },
    },
    defaultVariants: {
      intensity: 'medium',
      hover: 'none',
      padding: 'md',
    },
  }
);

// Animation variants - start visible for SSR compatibility
const cardVariants = {
  hidden: {
    opacity: 1,  // Start visible for SSR
    y: 0,
    scale: 1,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 25,
    },
  },
};

export interface GlassCardProps
  extends Omit<HTMLMotionProps<'div'>, 'children'>,
    VariantProps<typeof glassCardVariants> {
  /** Card content */
  children: React.ReactNode;
  /** Whether to animate entrance */
  animate?: boolean;
  /** Animation delay in seconds */
  delay?: number;
  /** Additional inner content wrapper class */
  innerClassName?: string;
  /** Whether card is interactive (adds cursor pointer) */
  interactive?: boolean;
  /** Custom gradient overlay */
  gradientOverlay?: boolean;
}

export function GlassCard({
  children,
  className,
  innerClassName,
  intensity,
  hover,
  padding,
  animate = true,
  delay = 0,
  interactive = false,
  gradientOverlay = false,
  ...props
}: GlassCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animate && !prefersReducedMotion;

  const content = (
    <>
      {/* Gradient overlay for extra depth */}
      {gradientOverlay && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(13,71,161,0.05) 100%)',
          }}
        />
      )}

      {/* Inner noise texture for glass effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className={cn('relative z-10', innerClassName)}>{children}</div>
    </>
  );

  if (shouldAnimate) {
    return (
      <motion.div
        className={cn(
          glassCardVariants({ intensity, hover, padding }),
          interactive && 'cursor-pointer',
          className
        )}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay }}
        whileHover={
          hover === 'scale' ? { scale: 1.02 } : hover === 'lift' ? { y: -4 } : undefined
        }
        {...props}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        glassCardVariants({ intensity, hover, padding }),
        interactive && 'cursor-pointer',
        className
      )}
    >
      {content}
    </div>
  );
}

/**
 * GlassCardHeader - Header section for glass cards
 */
interface GlassCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassCardHeader({
  children,
  className,
  ...props
}: GlassCardHeaderProps) {
  return (
    <div
      className={cn('mb-4 pb-4 border-b border-white/20', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * GlassCardTitle - Title for glass cards
 */
interface GlassCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

export function GlassCardTitle({
  children,
  className,
  as: Component = 'h3',
  ...props
}: GlassCardTitleProps) {
  return (
    <Component
      className={cn(
        'text-lg font-semibold',
        'text-slate-900 dark:text-white',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * GlassCardDescription - Description text for glass cards
 */
interface GlassCardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function GlassCardDescription({
  children,
  className,
  ...props
}: GlassCardDescriptionProps) {
  return (
    <p
      className={cn(
        'text-sm text-slate-600 dark:text-slate-400',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * GlassCardContent - Main content area for glass cards
 */
interface GlassCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassCardContent({
  children,
  className,
  ...props
}: GlassCardContentProps) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * GlassCardFooter - Footer section for glass cards
 */
interface GlassCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassCardFooter({
  children,
  className,
  ...props
}: GlassCardFooterProps) {
  return (
    <div
      className={cn(
        'mt-4 pt-4 border-t border-white/20',
        'flex items-center justify-end gap-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default GlassCard;
