'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  Sparkles,
  Bot,
  Receipt,
  FileText,
  TrendingUp,
  Building2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TrialWelcomeProps {
  onGetStarted: () => void;
  className?: string;
}

/**
 * Welcome message for new trial users
 * Shows key features and checklist of things to explore
 */
export function TrialWelcome({ onGetStarted, className }: TrialWelcomeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (containerRef.current) {
      // Entrance animation
      const timeline = gsap.timeline();

      timeline
        .fromTo(
          containerRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
        )
        .fromTo(
          cardsRef.current,
          { opacity: 0, y: 20, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.4,
            stagger: 0.1,
            ease: 'back.out(1.7)',
          },
          '-=0.3'
        );
    }
  }, []);

  const features = [
    {
      icon: Bot,
      title: 'AI Chat Assistant',
      description: 'Ask questions in natural language',
    },
    {
      icon: Receipt,
      title: 'Smart Invoice Extraction',
      description: 'Email forwarding auto-extracts data',
    },
    {
      icon: FileText,
      title: 'Bank Auto-Classification',
      description: 'AI categorizes transactions',
    },
    {
      icon: TrendingUp,
      title: 'Advanced Reports',
      description: 'Cash flow & tax predictions',
    },
    {
      icon: Building2,
      title: 'Vendor Management',
      description: 'Track bills & payments',
    },
  ];

  const checklist = [
    'Connect your bank account for automatic sync',
    'Forward an invoice email to see extraction in action',
    'Try the AI chat to ask about your finances',
    'Explore the cash flow dashboard',
    'Set up recurring invoices',
  ];

  return (
    <div ref={containerRef} className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
          <Sparkles className="h-8 w-8" />
        </div>
        <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
          Welcome to Your 14-Day Pro Trial!
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Explore all premium features at no cost. No credit card required.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.title}
              ref={(el) => {
                if (el) cardsRef.current[index] = el;
              }}
              className="border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50 p-4 dark:border-blue-900 dark:from-gray-900 dark:to-blue-950"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1 font-semibold text-gray-900 dark:text-gray-100">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Checklist */}
      <Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 dark:border-indigo-900 dark:from-indigo-950 dark:to-purple-950">
        <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          Get the Most Out of Your Trial
        </h3>
        <ul className="space-y-3">
          {checklist.map((item, index) => (
            <li
              key={index}
              className="flex items-start gap-3 text-gray-700 dark:text-gray-300"
            >
              <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                <Check className="h-3 w-3" />
              </div>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* CTA */}
      <div className="flex justify-center pt-2">
        <Button
          onClick={onGetStarted}
          variant="primary"
          size="lg"
          className="group shadow-lg transition-all hover:shadow-xl"
        >
          Get Started
          <Sparkles className="ml-2 h-4 w-4 transition-transform group-hover:rotate-12" />
        </Button>
      </div>
    </div>
  );
}
