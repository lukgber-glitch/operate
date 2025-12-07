'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { GradientBlob } from './GradientBlob';
import '@/styles/gradient-background.css';

interface GradientBackgroundProps {
  className?: string;
  intensity?: 'subtle' | 'medium' | 'vibrant';
  disabled?: boolean;
}

export function GradientBackground({
  className = '',
  intensity = 'subtle',
  disabled = false,
}: GradientBackgroundProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [lowEndDevice, setLowEndDevice] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);

    // Detect low-end devices (2 cores or less)
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
      setLowEndDevice(true);
    }

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Don't render on server, if disabled, or for reduced motion/low-end devices
  if (!mounted || disabled) {
    return null;
  }

  // Render static gradient for reduced motion or low-end devices
  if (prefersReducedMotion || lowEndDevice) {
    const isDark = resolvedTheme === 'dark';
    const staticColor = isDark
      ? 'rgba(6, 191, 157, 0.08)'
      : 'rgba(6, 191, 157, 0.15)';

    return (
      <div
        className={`gradient-background-container ${className}`}
        aria-hidden="true"
      >
        <div
          className="gradient-blob"
          style={{
            width: '60vw',
            height: '60vw',
            top: '20%',
            left: '20%',
            background: staticColor,
            opacity: 0.5,
            filter: 'blur(120px)',
          }}
        />
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';

  // Color configuration based on theme and intensity
  const getOpacity = (base: number) => {
    const multipliers = {
      subtle: 1,
      medium: 1.4,
      vibrant: 1.8,
    };
    return Math.min(base * multipliers[intensity], 0.6);
  };

  const colors = isDark
    ? {
        blob1: '#06BF9D', // Primary teal
        blob2: '#48D9BE', // Secondary teal
        blob3: '#84D9C9', // Tertiary teal
      }
    : {
        blob1: '#06BF9D', // Primary teal
        blob2: '#48D9BE', // Secondary teal
        blob3: '#84D9C9', // Tertiary teal
      };

  const opacities = isDark
    ? {
        blob1: getOpacity(0.2),
        blob2: getOpacity(0.15),
        blob3: getOpacity(0.12),
      }
    : {
        blob1: getOpacity(0.3),
        blob2: getOpacity(0.25),
        blob3: getOpacity(0.2),
      };

  return (
    <div
      className={`gradient-background-container gradient-background-loaded ${className}`}
      aria-hidden="true"
    >
      {/* Blob 1: Large, slow, top-left area */}
      <GradientBlob
        color={colors.blob1}
        size={40}
        blur={150}
        opacity={opacities.blob1}
        duration={45}
        delay={0}
        path="organic"
        className="top-[10%] left-[15%]"
      />

      {/* Blob 2: Medium, medium speed, center-right */}
      <GradientBlob
        color={colors.blob2}
        size={30}
        blur={120}
        opacity={opacities.blob2}
        duration={35}
        delay={5}
        path="organic"
        className="top-[50%] right-[20%]"
      />

      {/* Blob 3: Small, slightly faster, bottom area */}
      <GradientBlob
        color={colors.blob3}
        size={25}
        blur={100}
        opacity={opacities.blob3}
        duration={30}
        delay={10}
        path="organic"
        className="bottom-[15%] left-[25%]"
      />
    </div>
  );
}
