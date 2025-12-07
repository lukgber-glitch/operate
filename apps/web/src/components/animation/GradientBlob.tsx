'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface GradientBlobProps {
  color: string;
  size: number; // in viewport units
  blur: number;
  opacity: number;
  duration: number; // animation cycle in seconds
  delay?: number;
  path?: 'figure8' | 'circular' | 'organic';
  className?: string;
}

export function GradientBlob({
  color,
  size,
  blur,
  opacity,
  duration,
  delay = 0,
  path = 'organic',
  className = '',
}: GradientBlobProps) {
  const blobRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!blobRef.current) return;

    const blob = blobRef.current;
    const timeline = gsap.timeline({
      repeat: -1,
      yoyo: false,
      delay,
    });

    // Create different movement patterns
    if (path === 'figure8') {
      // Figure-8 pattern
      timeline.to(blob, {
        x: 80,
        y: -60,
        scale: 1.08,
        rotation: 5,
        duration: duration / 3,
        ease: 'sine.inOut',
      });
      timeline.to(blob, {
        x: -50,
        y: 70,
        scale: 0.95,
        rotation: -3,
        duration: duration / 3,
        ease: 'sine.inOut',
      });
      timeline.to(blob, {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: duration / 3,
        ease: 'sine.inOut',
      });
    } else if (path === 'circular') {
      // Circular pattern
      const radius = 60;
      timeline.to(blob, {
        motionPath: {
          path: [
            { x: 0, y: 0 },
            { x: radius, y: 0 },
            { x: radius, y: radius },
            { x: 0, y: radius },
            { x: 0, y: 0 },
          ],
          curviness: 1.5,
        },
        scale: gsap.utils.wrap([1, 1.1, 0.95, 1.05, 1]),
        rotation: 360,
        duration,
        ease: 'sine.inOut',
      });
    } else {
      // Organic pattern (default)
      const createRandomPoint = () => ({
        x: gsap.utils.random(-100, 100),
        y: gsap.utils.random(-80, 80),
        scale: gsap.utils.random(0.9, 1.12),
        rotation: gsap.utils.random(-12, 12),
      });

      const points = [
        createRandomPoint(),
        createRandomPoint(),
        createRandomPoint(),
        { x: 0, y: 0, scale: 1, rotation: 0 },
      ];

      points.forEach((point, index) => {
        timeline.to(blob, {
          x: point.x,
          y: point.y,
          scale: point.scale,
          rotation: point.rotation,
          duration: duration / points.length,
          ease: 'sine.inOut',
        });
      });
    }

    animationRef.current = timeline;

    // Pause animation when tab is not visible for performance
    const handleVisibilityChange = () => {
      if (document.hidden) {
        timeline.pause();
      } else {
        timeline.resume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      timeline.kill();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [duration, delay, path]);

  return (
    <div
      ref={blobRef}
      className={`gradient-blob ${className}`}
      style={{
        width: `${size}vw`,
        height: `${size}vw`,
        background: color,
        opacity,
        filter: `blur(${blur}px)`,
      }}
      aria-hidden="true"
    />
  );
}
