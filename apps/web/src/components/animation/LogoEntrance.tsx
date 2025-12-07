'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Image from 'next/image';

interface LogoEntranceProps {
  onComplete: () => void;
  skipEnabled?: boolean;
}

export function LogoEntrance({ onComplete, skipEnabled = true }: LogoEntranceProps) {
  const logoRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Skip animation if user prefers reduced motion
      onComplete();
      return;
    }

    if (!logoRef.current || !containerRef.current) return;

    // Enable skip after 500ms (prevent accidental skips)
    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, 500);

    // Create GSAP timeline
    const tl = gsap.timeline({
      onComplete: () => {
        onComplete();
      },
    });

    // Animation sequence: "Soft Emergence"
    tl.fromTo(
      logoRef.current,
      {
        opacity: 0,
        scale: 0.85,
      },
      {
        opacity: 1,
        scale: 1.02, // Slight overshoot
        duration: 0.8,
        ease: 'power2.out',
      }
    )
      .to(logoRef.current, {
        scale: 1.0, // Settle to final size
        duration: 0.2,
        ease: 'elastic.out(1, 0.5)',
      })
      .to(logoRef.current, {
        // Hold position for brand recognition
        duration: 0.3,
      })
      .to(logoRef.current, {
        // Start fade out
        opacity: 0,
        scale: 0.95,
        duration: 0.5,
        ease: 'power2.in',
      });

    return () => {
      clearTimeout(skipTimer);
      tl.kill();
    };
  }, [onComplete]);

  const handleSkip = () => {
    if (!canSkip || !skipEnabled) return;
    onComplete();
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900"
      onClick={handleSkip}
      role="presentation"
    >
      <div ref={logoRef} className="relative w-32 h-32 md:w-40 md:h-40">
        <Image
          src="/logo.svg"
          alt="Operate Logo"
          fill
          priority
          className="object-contain"
        />
      </div>

      {skipEnabled && (
        <button
          onClick={handleSkip}
          disabled={!canSkip}
          className="absolute bottom-8 right-8 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors disabled:opacity-0"
          aria-label="Skip intro animation"
        >
          Skip
        </button>
      )}
    </div>
  );
}
