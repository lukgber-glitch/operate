'use client';

import React, { useState } from 'react';
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedIcon,
  CardHeader,
  CardTitle,
  CardContent,
  useSuccessAnimation,
  useErrorAnimation,
  useFormAnimation,
  useStaggerAnimation,
} from '@/components/ui/animated';
import { Star, Heart, Settings, Send, Loader2, Check, X } from 'lucide-react';

/**
 * Micro-Interactions Demo Page
 *
 * This page showcases all available micro-interactions in the system.
 * Use this as a reference for implementing animations throughout the app.
 */
export default function MicroInteractionsDemo() {
  const [success, triggerSuccess] = useSuccessAnimation();
  const [error, triggerError] = useErrorAnimation();
  const {
    isLoading,
    isSuccess,
    isError,
    setLoading,
    setSuccess,
    setError,
  } = useFormAnimation();
  const getStaggerProps = useStaggerAnimation();

  const suggestions = [
    'Show me my recent transactions',
    'What are my upcoming tax deadlines?',
    'Generate monthly expense report',
    'Review employee timesheets',
  ];

  return (
    <div className="container mx-auto p-8 space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Micro-Interactions Demo</h1>
        <p className="text-muted-foreground">
          Interactive showcase of all available micro-interactions and animations.
        </p>
      </div>

      {/* Button Interactions */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Button Interactions</h2>
        <div className="flex flex-wrap gap-4">
          <AnimatedButton pressEffect="default">
            Default Press
          </AnimatedButton>
          <AnimatedButton pressEffect="soft" variant="secondary">
            Soft Press
          </AnimatedButton>
          <AnimatedButton
            pressEffect="soft"
            success={success}
            onClick={triggerSuccess}
          >
            Trigger Success
          </AnimatedButton>
          <AnimatedButton
            pressEffect="soft"
            error={error}
            onClick={triggerError}
            variant="destructive"
          >
            Trigger Error
          </AnimatedButton>
          <AnimatedButton loading={true}>
            Loading State
          </AnimatedButton>
        </div>
      </section>

      {/* Form Animation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Form Workflow</h2>
        <div className="flex flex-wrap gap-4">
          <AnimatedButton
            pressEffect="soft"
            loading={isLoading}
            success={isSuccess}
            error={isError}
            onClick={async () => {
              setLoading();
              await new Promise((resolve) => setTimeout(resolve, 1500));
              setSuccess();
            }}
          >
            Save (Success)
          </AnimatedButton>
          <AnimatedButton
            pressEffect="soft"
            loading={isLoading}
            success={isSuccess}
            error={isError}
            onClick={async () => {
              setLoading();
              await new Promise((resolve) => setTimeout(resolve, 1500));
              setError();
            }}
            variant="destructive"
          >
            Save (Error)
          </AnimatedButton>
        </div>
      </section>

      {/* Card Interactions */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Card Interactions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnimatedCard hoverEffect="lift">
            <CardHeader>
              <CardTitle>Subtle Lift</CardTitle>
            </CardHeader>
            <CardContent>
              Hover to see a subtle lift effect with shadow increase.
            </CardContent>
          </AnimatedCard>

          <AnimatedCard hoverEffect="lift-strong">
            <CardHeader>
              <CardTitle>Strong Lift</CardTitle>
            </CardHeader>
            <CardContent>
              Hover to see a more pronounced lift effect.
            </CardContent>
          </AnimatedCard>

          <AnimatedCard
            hoverEffect="interactive"
            onClick={() => alert('Card clicked!')}
          >
            <CardHeader>
              <CardTitle>Interactive</CardTitle>
            </CardHeader>
            <CardContent>
              This card is clickable with full interactive feedback.
            </CardContent>
          </AnimatedCard>
        </div>
      </section>

      {/* Staggered Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Staggered Animations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((suggestion, index) => (
            <AnimatedCard
              key={index}
              hoverEffect="interactive"
              staggerIndex={index}
              onClick={() => console.log(suggestion)}
            >
              <CardContent className="p-4">
                <p className="text-sm">{suggestion}</p>
              </CardContent>
            </AnimatedCard>
          ))}
        </div>
      </section>

      {/* Icon Animations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Icon Animations</h2>
        <div className="flex flex-wrap gap-8 items-center">
          <div className="space-y-2 text-center">
            <AnimatedIcon animation="bounce">
              <Star className="h-8 w-8 text-yellow-500" />
            </AnimatedIcon>
            <p className="text-xs text-muted-foreground">Bounce</p>
          </div>

          <div className="space-y-2 text-center">
            <AnimatedIcon animation="scale">
              <Heart className="h-8 w-8 text-red-500" />
            </AnimatedIcon>
            <p className="text-xs text-muted-foreground">Scale</p>
          </div>

          <div className="space-y-2 text-center">
            <AnimatedIcon animation="rotate">
              <Settings className="h-8 w-8 text-blue-500" />
            </AnimatedIcon>
            <p className="text-xs text-muted-foreground">Rotate</p>
          </div>

          <div className="space-y-2 text-center">
            <AnimatedIcon animation="spin">
              <Send className="h-8 w-8 text-green-500" />
            </AnimatedIcon>
            <p className="text-xs text-muted-foreground">Spin</p>
          </div>

          <div className="space-y-2 text-center">
            <AnimatedIcon animation="spin" continuous>
              <Loader2 className="h-8 w-8 text-primary" />
            </AnimatedIcon>
            <p className="text-xs text-muted-foreground">Continuous</p>
          </div>
        </div>
      </section>

      {/* State Feedback */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">State Feedback</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="animate-pulse-success p-4 bg-green-100 dark:bg-green-900 rounded-lg flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium">Success Pulse</span>
          </div>

          <div className="animate-shake p-4 bg-red-100 dark:bg-red-900 rounded-lg flex items-center gap-2">
            <X className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium">Error Shake</span>
          </div>

          <div className="animate-pulse-slow p-4 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium">Loading Pulse</span>
          </div>
        </div>
      </section>

      {/* Utility Classes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">CSS Utility Classes</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Entrance Animations</p>
            <div className="flex flex-wrap gap-4">
              <div className="animate-fade-in p-3 bg-secondary rounded">Fade In</div>
              <div className="animate-slide-in-up p-3 bg-secondary rounded">Slide Up</div>
              <div className="animate-slide-in-down p-3 bg-secondary rounded">Slide Down</div>
              <div className="animate-scale-in p-3 bg-secondary rounded">Scale In</div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Stagger Items</p>
            <div className="flex flex-wrap gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="stagger-item p-3 bg-secondary rounded">
                  Item {i}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Usage Guide */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Usage Guide</h2>
        <AnimatedCard>
          <CardHeader>
            <CardTitle>Implementation Reference</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Import Components:</p>
              <code className="block p-3 bg-secondary rounded text-sm">
                {`import { AnimatedButton, AnimatedCard, AnimatedIcon } from '@/components/ui/animated';`}
              </code>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Basic Usage:</p>
              <code className="block p-3 bg-secondary rounded text-sm whitespace-pre">
                {`<AnimatedButton pressEffect="soft">
  Click Me
</AnimatedButton>

<AnimatedCard hoverEffect="interactive">
  <CardContent>Interactive Card</CardContent>
</AnimatedCard>

<AnimatedIcon animation="bounce">
  <Star className="h-5 w-5" />
</AnimatedIcon>`}
              </code>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Documentation:</p>
              <p className="text-sm text-muted-foreground">
                See <code>MICRO_INTERACTIONS_GUIDE.md</code> for complete documentation.
              </p>
            </div>
          </CardContent>
        </AnimatedCard>
      </section>
    </div>
  );
}
