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
    description: 'Perfekt zum Ausprobieren von Operate',
    features: [
      '1 Bankverbindung',
      '50 AI-Nachrichten pro Monat',
      '5 Rechnungen pro Monat',
      'Basis-Ausgabenverfolgung',
      'Community-Support',
    ],
    cta: 'Kostenlos starten',
    ctaLink: '/auth/signup',
    highlighted: false,
  },
  {
    name: 'Starter',
    monthlyPrice: 9.90,
    annualPrice: 95,
    description: 'Für Freelancer und Einzelunternehmer',
    features: [
      '3 Bankverbindungen',
      '200 AI-Nachrichten pro Monat',
      'Unbegrenzte Rechnungen',
      'E-Mail-Rechnungssynchronisierung',
      'Basis-Berichte',
      'DATEV-Export',
      'E-Mail-Support',
    ],
    cta: 'Jetzt starten',
    ctaLink: '/auth/signup?plan=starter',
    highlighted: false,
  },
  {
    name: 'Pro',
    monthlyPrice: 19.90,
    annualPrice: 190,
    description: 'Für kleine Unternehmen',
    badge: 'Am beliebtesten',
    features: [
      '10 Bankverbindungen',
      'Unbegrenzte AI-Nachrichten',
      'Steuererklärung (UStVA, EÜR)',
      'Cashflow-Prognosen',
      'Dokument-OCR-Scanning',
      'Erweiterte Berichte (BWA)',
      'Bis zu 3 Teammitglieder',
      'Prioritäts-Support',
    ],
    cta: 'Jetzt starten',
    ctaLink: '/auth/signup?plan=pro',
    highlighted: true,
  },
  {
    name: 'Business',
    monthlyPrice: 39.90,
    annualPrice: 380,
    description: 'Für wachsende Teams',
    features: [
      'Unbegrenzte Bankverbindungen',
      'Unbegrenzte AI-Nachrichten',
      'Alle Pro-Funktionen',
      'Unbegrenzte Teammitglieder',
      'API-Zugang',
      'Individuelle Integrationen',
      'Multi-Währungsunterstützung',
      'Dedizierter Support',
    ],
    cta: 'Jetzt starten',
    ctaLink: '/auth/signup?plan=business',
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
          Einfache, transparente Preise
        </h1>
        <p
          className="text-xl md:text-2xl mb-8"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Wählen Sie den Plan, der zu Ihrem Unternehmen passt.
          <br />
          Starten Sie mit einer 14-tägigen kostenlosen Testversion, keine Kreditkarte erforderlich.
        </p>
      </div>

      {/* Pricing Toggle */}
      <PricingToggle onToggle={setIsAnnual} />

      {/* Pricing Cards */}
      <div
        ref={cardsContainerRef}
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8"
      >
        {pricingTiers.map((tier, index) => (
          <PricingCard key={tier.name} tier={tier} isAnnual={isAnnual} index={index} />
        ))}
      </div>

      {/* VAT Note */}
      <div className="max-w-7xl mx-auto text-center mb-24">
        <p
          className="text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Alle Preise zzgl. MwSt.
        </p>
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
            Bereit, Ihr Geschäft zu automatisieren?
          </h2>
          <p
            className="text-lg md:text-xl mb-8"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Schließen Sie sich Tausenden von Unternehmen an, die bereits Operate nutzen, um Zeit und Geld zu sparen.
          </p>
          <a
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-[var(--radius-lg)] text-lg font-semibold text-white transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--color-primary)',
            }}
          >
            Kostenlose Testversion starten
          </a>
        </div>
      </div>
    </div>
  );
}
