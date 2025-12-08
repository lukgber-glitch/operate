'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Image from 'next/image';

interface LogoMorphProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Component that morphs the logo into a card shape
 * Wraps the login card and animates the transition from logo to card
 */
export function LogoMorph({ children, className = '' }: LogoMorphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Mark component as ready for rendering
    setIsReady(true);

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !containerRef.current || !logoRef.current || !cardRef.current) {
      // Show card immediately if reduced motion is preferred
      if (cardRef.current) {
        gsap.set(cardRef.current, { opacity: 1, scale: 1 });
      }
      if (logoRef.current) {
        gsap.set(logoRef.current, {
          opacity: 0,
          display: 'none',
          visibility: 'hidden',
          zIndex: -1
        });
      }
      return;
    }

    // Fallback: Show card after 1 second if animation doesn't complete
    const fallbackTimer = setTimeout(() => {
      if (cardRef.current) {
        gsap.set(cardRef.current, { opacity: 1, scale: 1 });
      }
      if (logoRef.current) {
        gsap.set(logoRef.current, {
          opacity: 0,
          display: 'none',
          visibility: 'hidden',
          zIndex: -1
        });
      }
    }, 1000);

    const tl = gsap.timeline({
      onComplete: () => {
        clearTimeout(fallbackTimer);
      }
    });

    // Start with logo visible, card hidden
    gsap.set(cardRef.current, { opacity: 0, scale: 0.9 });
    gsap.set(logoRef.current, { opacity: 1, scale: 1 });

    // Morph animation sequence
    tl.to(logoRef.current, {
      opacity: 0,
      scale: 1.1,
      duration: 0.3,
      ease: 'power2.in',
    })
      .set(logoRef.current, {
        display: 'none',
        visibility: 'hidden',
        zIndex: -1
      })
      .fromTo(
        cardRef.current,
        {
          opacity: 0,
          scale: 0.9,
          y: 20,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
        },
        '-=0.1' // Slight overlap
      );

    return () => {
      clearTimeout(fallbackTimer);
      tl.kill();
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Logo that will morph out - z-10 ensures it starts on top, pointer-events-none after animation */}
      <div
        ref={logoRef}
        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
        style={{ opacity: 0 }}
      >
        <div className="relative w-24 h-24 md:w-32 md:h-32">
          <Image
            src="/logo.svg"
            alt="Operate Logo"
            fill
            priority
            className="object-contain"
          />
        </div>
      </div>

      {/* Card that will morph in - start visible as fallback */}
      <div ref={cardRef} style={{ opacity: isReady ? undefined : 1 }}>
        {children}
      </div>
    </div>
  );
}
