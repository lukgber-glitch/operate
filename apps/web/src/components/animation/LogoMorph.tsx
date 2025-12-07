'use client';

import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !containerRef.current || !logoRef.current || !cardRef.current) {
      // Show card immediately if reduced motion is preferred
      if (cardRef.current) {
        gsap.set(cardRef.current, { opacity: 1, scale: 1 });
      }
      if (logoRef.current) {
        gsap.set(logoRef.current, { opacity: 0, display: 'none' });
      }
      return;
    }

    const tl = gsap.timeline();

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
      .set(logoRef.current, { display: 'none' })
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
      tl.kill();
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Logo that will morph out */}
      <div
        ref={logoRef}
        className="absolute inset-0 flex items-center justify-center"
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

      {/* Card that will morph in */}
      <div ref={cardRef}>
        {children}
      </div>
    </div>
  );
}
