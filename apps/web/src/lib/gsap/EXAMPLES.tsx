/**
 * GSAP Animation Library - Usage Examples
 *
 * This file contains practical examples of using the GSAP animation library.
 * These are reference examples - copy and adapt as needed.
 */

'use client';

import { useEffect, useRef } from 'react';
import {
  // Components
  FadeIn,
  StaggerList,
  PageTransition,

  // Functions
  fadeIn,
  slideIn,
  staggerIn,
  morphTo,
  scaleIn,

  // Hooks
  useGsapContext,
  useGsapTimeline,
  useGsapSelector,

  // Core
  gsap,
  ScrollTrigger,
  useGSAP,
} from './index';

/**
 * Example 1: Basic Page Transition
 */
export function PageWithTransition() {
  return (
    <PageTransition>
      <div className="container">
        <h1>Welcome to Operate</h1>
        <p>This content fades in smoothly when the page loads.</p>
      </div>
    </PageTransition>
  );
}

/**
 * Example 2: Staggered List
 */
export function NavigationList() {
  const items = ['Dashboard', 'Transactions', 'Reports', 'Settings'];

  return (
    <StaggerList stagger={0.1} delay={0.2}>
      {items.map((item, i) => (
        <div key={i} className="nav-item">
          {item}
        </div>
      ))}
    </StaggerList>
  );
}

/**
 * Example 3: Fade In with Direction
 */
export function WelcomeMessage() {
  return (
    <div className="space-y-4">
      <FadeIn direction="down" delay={0}>
        <h1>Welcome!</h1>
      </FadeIn>

      <FadeIn direction="up" delay={0.2}>
        <p>Let's get started with your onboarding.</p>
      </FadeIn>

      <FadeIn direction="up" delay={0.4}>
        <button className="btn-primary">Begin</button>
      </FadeIn>
    </div>
  );
}

/**
 * Example 4: Using Animation Functions Directly
 */
export function DirectAnimationExample() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (!buttonRef.current || !cardRef.current) return;

    // Morph button into card
    morphTo(buttonRef.current, cardRef.current, {
      duration: 0.5,
      ease: 'power2.inOut',
    });
  };

  return (
    <div>
      <button ref={buttonRef} onClick={handleClick}>
        Expand
      </button>

      <div ref={cardRef} style={{ display: 'none' }}>
        <h2>Expanded Content</h2>
        <p>This appeared via morphing animation!</p>
      </div>
    </div>
  );
}

/**
 * Example 5: Using useGsapContext Hook
 */
export function ContextExample() {
  const scopeRef = useGsapContext((ctx) => {
    // Animate all buttons in this scope
    gsap.from('.animated-button', {
      scale: 0,
      opacity: 0,
      duration: 0.3,
      stagger: 0.1,
      ease: 'back.out(1.7)',
    });
  });

  return (
    <div ref={scopeRef}>
      <button className="animated-button">Button 1</button>
      <button className="animated-button">Button 2</button>
      <button className="animated-button">Button 3</button>
    </div>
  );
}

/**
 * Example 6: Using useGsapTimeline Hook
 */
export function TimelineExample() {
  const timeline = useGsapTimeline({ paused: true });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    timeline
      .to('.box-1', { x: 100, duration: 0.5 })
      .to('.box-2', { y: 100, duration: 0.5 }, '-=0.3')
      .to('.box-3', { rotation: 360, duration: 0.5 }, '-=0.3')
      .play();
  }, [timeline]);

  return (
    <div ref={containerRef}>
      <div className="box-1">Box 1</div>
      <div className="box-2">Box 2</div>
      <div className="box-3">Box 3</div>
    </div>
  );
}

/**
 * Example 7: Scoped Selectors with useGsapSelector
 */
export function SelectorExample() {
  const [scopeRef, q] = useGsapSelector();

  const handleAnimate = () => {
    gsap.to(q('.target'), {
      x: 100,
      rotation: 360,
      duration: 1,
      ease: 'elastic.out(1, 0.3)',
    });
  };

  return (
    <div ref={scopeRef}>
      <button onClick={handleAnimate}>Animate</button>
      <div className="target">I will animate!</div>
    </div>
  );
}

/**
 * Example 8: Sequential Animations
 */
export function SequentialExample() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline();

      tl.from('.title', {
        opacity: 0,
        y: -30,
        duration: 0.5,
      })
        .from('.subtitle', {
          opacity: 0,
          y: 20,
          duration: 0.4,
        }, '-=0.2')
        .from('.button', {
          scale: 0,
          duration: 0.3,
          ease: 'back.out(1.7)',
        });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef}>
      <h1 className="title">Welcome to Operate</h1>
      <p className="subtitle">Your AI-powered business assistant</p>
      <button className="button">Get Started</button>
    </div>
  );
}

/**
 * Example 9: Scroll-Triggered Animation
 */
export function ScrollExample() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from('.scroll-item', {
        opacity: 0,
        y: 50,
        duration: 0.6,
        stagger: 0.2,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="h-screen">
      <div className="scroll-item">Item 1</div>
      <div className="scroll-item">Item 2</div>
      <div className="scroll-item">Item 3</div>
    </div>
  );
}

/**
 * Example 10: Interactive Hover Effects
 */
export function HoverExample() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>('.hover-card');

      cards.forEach((card) => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            scale: 1.05,
            y: -5,
            duration: 0.3,
            ease: 'power2.out',
          });
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: 'power2.out',
          });
        });
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="grid grid-cols-3 gap-4">
      <div className="hover-card">Card 1</div>
      <div className="hover-card">Card 2</div>
      <div className="hover-card">Card 3</div>
    </div>
  );
}

/**
 * Example 11: Form Field Animation
 */
export function FormFieldAnimation() {
  const formRef = useRef<HTMLFormElement>(null);

  useGSAP(
    () => {
      // Stagger form fields
      gsap.from('.form-field', {
        opacity: 0,
        x: -30,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power2.out',
      });
    },
    { scope: formRef, dependencies: [] }
  );

  return (
    <form ref={formRef}>
      <div className="form-field">
        <input type="text" placeholder="Name" />
      </div>
      <div className="form-field">
        <input type="email" placeholder="Email" />
      </div>
      <div className="form-field">
        <input type="password" placeholder="Password" />
      </div>
      <div className="form-field">
        <button type="submit">Submit</button>
      </div>
    </form>
  );
}

/**
 * Example 12: Loading State Animation
 */
export function LoadingAnimation() {
  const dotsRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const dots = gsap.utils.toArray<HTMLElement>('.loading-dot');

      gsap.to(dots, {
        y: -10,
        duration: 0.4,
        stagger: {
          each: 0.15,
          repeat: -1,
          yoyo: true,
        },
        ease: 'power2.inOut',
      });
    },
    { scope: dotsRef }
  );

  return (
    <div ref={dotsRef} className="flex gap-2">
      <div className="loading-dot w-3 h-3 bg-blue-500 rounded-full" />
      <div className="loading-dot w-3 h-3 bg-blue-500 rounded-full" />
      <div className="loading-dot w-3 h-3 bg-blue-500 rounded-full" />
    </div>
  );
}
