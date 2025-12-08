'use client';

/**
 * AnimatedContainer Component
 *
 * A container that registers itself for GSAP morph animations and handles
 * enter/exit transitions. Used as morph targets for MorphButton components.
 *
 * DESIGN_OVERHAUL Phase 2: GSAP Motion Morph System
 */

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useTransitionContext } from '@/components/animation/TransitionProvider';
import { fadeIn, fadeOut } from '@/lib/animation/gsap-utils';
import { cn } from '@/lib/utils';

/**
 * AnimatedContainer component props
 */
export interface AnimatedContainerProps {
  /** Unique ID for morph targeting */
  morphId: string;
  /** Container content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Callback when enter animation completes */
  onEnterComplete?: () => void;
  /** Callback when exit animation completes */
  onExitComplete?: () => void;
  /** Whether to auto-animate on mount (default: true) */
  autoAnimate?: boolean;
}

/**
 * Imperative API exposed via ref
 */
export interface AnimatedContainerRef {
  triggerExit: () => Promise<void>;
  triggerEnter: () => Promise<void>;
}

/**
 * AnimatedContainer component
 *
 * A container that:
 * - Registers itself with TransitionProvider for morph targeting
 * - Handles ENTER animation: opacity 0→1, scale 0.95→1, duration 0.25s
 * - Handles EXIT animation: opacity 1→0, scale 1→0.95, duration 0.2s
 * - Exposes imperative API via ref
 *
 * @example
 * ```tsx
 * // Basic usage
 * <AnimatedContainer morphId="login-card">
 *   <LoginForm />
 * </AnimatedContainer>
 * ```
 *
 * @example
 * ```tsx
 * // With callbacks
 * <AnimatedContainer
 *   morphId="onboarding-step-welcome"
 *   onEnterComplete={() => console.log('Animation complete')}
 * >
 *   <WelcomeStep />
 * </AnimatedContainer>
 * ```
 *
 * @example
 * ```tsx
 * // With imperative control
 * const containerRef = useRef<AnimatedContainerRef>(null);
 *
 * const handleExit = async () => {
 *   await containerRef.current?.triggerExit();
 *   // Do something after exit
 * };
 *
 * <AnimatedContainer
 *   ref={containerRef}
 *   morphId="main-chat-card"
 *   autoAnimate={false}
 * >
 *   <ChatContent />
 * </AnimatedContainer>
 * ```
 */
export const AnimatedContainer = forwardRef<AnimatedContainerRef, AnimatedContainerProps>(
  (
    {
      morphId,
      children,
      className,
      onEnterComplete,
      onExitComplete,
      autoAnimate = true,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { registerElement, unregisterElement } = useTransitionContext();

    // Register container for morphing
    useEffect(() => {
      if (containerRef.current && morphId) {
        registerElement(morphId, containerRef, 'container');
      }

      return () => {
        if (morphId) {
          unregisterElement(morphId);
        }
      };
    }, [morphId, registerElement, unregisterElement]);

    // Auto-animate enter on mount
    useEffect(() => {
      if (!containerRef.current || !autoAnimate) return;

      // Start from hidden state
      containerRef.current.style.opacity = '0';
      containerRef.current.style.transform = 'scale(0.95)';

      // Animate in
      const tween = fadeIn(containerRef.current, 0.25, 0);

      if (onEnterComplete) {
        tween.eventCallback('onComplete', onEnterComplete);
      }

      return () => {
        tween.kill();
      };
    }, [autoAnimate, onEnterComplete]);

    /**
     * Trigger exit animation imperatively
     */
    const triggerExit = (): Promise<void> => {
      return new Promise((resolve) => {
        if (!containerRef.current) {
          resolve();
          return;
        }

        const tween = fadeOut(containerRef.current, 0.2, () => {
          if (onExitComplete) onExitComplete();
          resolve();
        });
      });
    };

    /**
     * Trigger enter animation imperatively
     */
    const triggerEnter = (): Promise<void> => {
      return new Promise((resolve) => {
        if (!containerRef.current) {
          resolve();
          return;
        }

        const tween = fadeIn(containerRef.current, 0.25, 0);
        tween.eventCallback('onComplete', () => {
          if (onEnterComplete) onEnterComplete();
          resolve();
        });
      });
    };

    // Expose imperative API
    useImperativeHandle(ref, () => ({
      triggerExit,
      triggerEnter,
    }));

    return (
      <div
        ref={containerRef}
        data-morph-target={morphId}
        className={cn('w-full', className)}
      >
        {children}
      </div>
    );
  }
);

AnimatedContainer.displayName = 'AnimatedContainer';
