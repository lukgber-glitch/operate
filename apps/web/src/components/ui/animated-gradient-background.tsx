'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/**
 * AnimatedGradientBackground - Animated gradient backdrop
 *
 * Features:
 * - Smooth gradient animation
 * - Multiple preset themes (blue, aurora, sunset)
 * - Subtle blob animations
 * - Reduced motion support
 * - Performance optimized
 */

interface AnimatedGradientBackgroundProps {
  /** Gradient theme preset */
  theme?: 'blue' | 'aurora' | 'sunset' | 'minimal' | 'custom';
  /** Custom gradient colors (for custom theme) */
  colors?: string[];
  /** Animation intensity */
  intensity?: 'subtle' | 'medium' | 'strong';
  /** Show animated blobs */
  showBlobs?: boolean;
  /** Additional class names */
  className?: string;
  /** Children to render on top */
  children?: React.ReactNode;
  /** Whether background is fixed position */
  fixed?: boolean;
}

// Gradient presets
const gradientPresets = {
  blue: {
    base: 'from-blue-50 via-white to-blue-100',
    colors: ['#E3F2FD', '#FFFFFF', '#BBDEFB'],
    blobColors: ['rgba(30, 136, 229, 0.15)', 'rgba(21, 101, 192, 0.1)', 'rgba(100, 181, 246, 0.12)'],
  },
  aurora: {
    base: 'from-blue-100 via-purple-50 to-cyan-100',
    colors: ['#DBEAFE', '#F3E8FF', '#CFFAFE'],
    blobColors: ['rgba(99, 102, 241, 0.15)', 'rgba(139, 92, 246, 0.12)', 'rgba(34, 211, 238, 0.1)'],
  },
  sunset: {
    base: 'from-orange-50 via-rose-50 to-purple-100',
    colors: ['#FFF7ED', '#FFF1F2', '#F3E8FF'],
    blobColors: ['rgba(251, 146, 60, 0.15)', 'rgba(244, 63, 94, 0.12)', 'rgba(168, 85, 247, 0.1)'],
  },
  minimal: {
    base: 'from-slate-50 via-white to-slate-100',
    colors: ['#F8FAFC', '#FFFFFF', '#F1F5F9'],
    blobColors: ['rgba(100, 116, 139, 0.08)', 'rgba(148, 163, 184, 0.06)', 'rgba(203, 213, 225, 0.1)'],
  },
  custom: {
    base: '',
    colors: [],
    blobColors: [],
  },
};

// Animation durations based on intensity
const intensityConfig = {
  subtle: { duration: 30, scale: 0.8 },
  medium: { duration: 20, scale: 1 },
  strong: { duration: 12, scale: 1.2 },
};

// Blob animation variants
const blobVariants = (duration: number, delay: number) => ({
  animate: {
    x: [0, 30, -20, 10, 0],
    y: [0, -20, 30, -10, 0],
    scale: [1, 1.1, 0.95, 1.05, 1],
    transition: {
      duration,
      repeat: Infinity,
      ease: 'easeInOut',
      delay,
    },
  },
});

export function AnimatedGradientBackground({
  theme = 'blue',
  colors,
  intensity = 'subtle',
  showBlobs = true,
  className,
  children,
  fixed = false,
}: AnimatedGradientBackgroundProps) {
  const prefersReducedMotion = useReducedMotion();
  const preset = gradientPresets[theme];
  const config = intensityConfig[intensity];

  // Use custom colors if provided, otherwise use preset
  const gradientColors = colors || preset.colors;
  const blobColors = preset.blobColors;

  // Build gradient style
  const gradientStyle = {
    background:
      gradientColors.length >= 3
        ? `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 50%, ${gradientColors[2]} 100%)`
        : `linear-gradient(135deg, ${gradientColors[0] || '#F8FAFC'} 0%, ${gradientColors[1] || '#FFFFFF'} 100%)`,
  };

  return (
    <div
      className={cn(
        'overflow-hidden',
        fixed ? 'fixed inset-0 -z-10' : 'absolute inset-0 -z-10',
        className
      )}
      style={gradientStyle}
    >
      {/* Animated gradient overlay */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              `radial-gradient(ellipse 80% 50% at 20% 40%, ${blobColors[0]} 0%, transparent 70%)`,
              `radial-gradient(ellipse 80% 50% at 80% 60%, ${blobColors[0]} 0%, transparent 70%)`,
              `radial-gradient(ellipse 80% 50% at 40% 30%, ${blobColors[0]} 0%, transparent 70%)`,
              `radial-gradient(ellipse 80% 50% at 20% 40%, ${blobColors[0]} 0%, transparent 70%)`,
            ],
          }}
          transition={{
            duration: config.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Animated blobs */}
      {showBlobs && !prefersReducedMotion && (
        <>
          {/* Blob 1 - Top right */}
          <motion.div
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl"
            style={{ background: blobColors[0] }}
            variants={blobVariants(config.duration, 0)}
            animate="animate"
          />

          {/* Blob 2 - Bottom left */}
          <motion.div
            className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full blur-3xl"
            style={{ background: blobColors[1] }}
            variants={blobVariants(config.duration * 1.2, 2)}
            animate="animate"
          />

          {/* Blob 3 - Center */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-50"
            style={{ background: blobColors[2] }}
            variants={blobVariants(config.duration * 0.8, 4)}
            animate="animate"
          />
        </>
      )}

      {/* Static fallback for reduced motion */}
      {prefersReducedMotion && showBlobs && (
        <>
          <div
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl"
            style={{ background: blobColors[0] }}
          />
          <div
            className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full blur-3xl"
            style={{ background: blobColors[1] }}
          />
        </>
      )}

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Children */}
      {children && <div className="relative z-10 h-full">{children}</div>}
    </div>
  );
}

/**
 * MeshGradientBackground - CSS mesh gradient alternative (lighter weight)
 */
interface MeshGradientBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  fixed?: boolean;
}

export function MeshGradientBackground({
  className,
  children,
  fixed = false,
}: MeshGradientBackgroundProps) {
  return (
    <div
      className={cn(
        'overflow-hidden',
        fixed ? 'fixed inset-0 -z-10' : 'absolute inset-0 -z-10',
        className
      )}
      style={{
        background: `
          radial-gradient(at 40% 20%, rgba(227, 242, 253, 0.8) 0px, transparent 50%),
          radial-gradient(at 80% 0%, rgba(187, 222, 251, 0.6) 0px, transparent 50%),
          radial-gradient(at 0% 50%, rgba(144, 202, 249, 0.4) 0px, transparent 50%),
          radial-gradient(at 80% 50%, rgba(100, 181, 246, 0.3) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(227, 242, 253, 0.5) 0px, transparent 50%),
          radial-gradient(at 80% 100%, rgba(187, 222, 251, 0.4) 0px, transparent 50%),
          linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 50%, #F1F5F9 100%)
        `,
      }}
    >
      {children && <div className="relative z-10 h-full">{children}</div>}
    </div>
  );
}

export default AnimatedGradientBackground;
