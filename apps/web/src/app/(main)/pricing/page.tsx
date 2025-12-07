'use client';

import { useState, useEffect, useRef } from 'react';
import { Metadata } from 'next';
import { gsap } from 'gsap';
import { PricingCard, PricingTier } from '@/components/pricing/PricingCard';
import { PricingToggle } from '@/components/pricing/PricingToggle';
import { FeatureComparison } from '@/components/pricing/FeatureComparison';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Perfect for trying out Operate',
    features: [
      '1 bank connection',
      '50 AI messages per month',
      'Basic financial reports',
      'Manual transaction entry',
      'Community support',
    ],
    cta: 'Get Started',
    ctaLink: '/auth/signup',
    highlighted: false,
  },
  {
    name: 'Starter',
    monthlyPrice: 19,
    annualPrice: 190,
    description: 'For freelancers and solo entrepreneurs',
    features: [
      '3 bank connections',
      '500 AI messages per month',
      'Email invoice sync',
      'Invoicing & quotes',
      'Advanced reports',
      'Email support',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/auth/signup?plan=starter',
    highlighted: false,
  },
  {
    name: 'Pro',
    monthlyPrice: 39,
    annualPrice: 390,
    description: 'For small businesses',
    features: [
      '10 bank connections',
      'Unlimited AI messages',
      'Tax filing assistance',
      'Cash flow predictions',
      'Document search',
      'Up to 3 team members',
      'Priority email support',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/auth/signup?plan=pro',
    highlighted: true,
  },
  {
    name: 'Business',
    monthlyPrice: 69,
    annualPrice: 690,
    description: 'For growing teams',
    features: [
      'Unlimited bank connections',
      'Unlimited AI messages',
      'Everything in Pro',
      'Unlimited team members',
      'API access',
      'Custom integrations',
      'Priority support & onboarding',
    ],
    cta: 'Contact Sales',
    ctaLink: 'mailto:sales@operate.guru',
    highlighted: false,
  },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero animation
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current.children,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
        }
      );
    }

    // Cards animation
    if (cardsContainerRef.current) {
      const cards = cardsContainerRef.current.querySelectorAll('.pricing-card');
      gsap.fromTo(
        cards,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          delay: 0.4,
          ease: 'power3.out',
        }
      );
    }
  }, []);

  return (
    <div className="min-h-screen py-16 px-4" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Hero Section */}
      <div ref={heroRef} className="max-w-4xl mx-auto text-center mb-16">
        <h1
          className="text-5xl md:text-6xl font-bold mb-6"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Simple, transparent pricing
        </h1>
        <p
          className="text-xl md:text-2xl mb-8"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Choose the plan that's right for your business.
          <br />
          Start with a 14-day free trial, no credit card required.
        </p>
      </div>

      {/* Pricing Toggle */}
      <PricingToggle onToggle={setIsAnnual} />

      {/* Pricing Cards */}
      <div
        ref={cardsContainerRef}
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24"
      >
        {pricingTiers.map((tier, index) => (
          <PricingCard key={tier.name} tier={tier} isAnnual={isAnnual} index={index} />
        ))}
      </div>

      {/* Feature Comparison */}
      <FeatureComparison />

      {/* FAQ */}
      <PricingFAQ />

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto text-center mt-24 mb-16">
        <div
          className="p-12 rounded-[var(--radius-2xl)]"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Ready to automate your business?
          </h2>
          <p
            className="text-lg md:text-xl mb-8"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Join thousands of businesses already using Operate to save time and money.
          </p>
          <a
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-[var(--radius-lg)] text-lg font-semibold text-white transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--color-primary)',
            }}
          >
            Start Your Free Trial
          </a>
        </div>
      </div>
    </div>
  );
}
