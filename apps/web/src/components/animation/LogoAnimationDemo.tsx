'use client';

import { useState } from 'react';
import { LogoEntrance } from './LogoEntrance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Demo component to preview the logo animation
 * Useful for testing and showcasing the animation effect
 */
export function LogoAnimationDemo() {
  const [showAnimation, setShowAnimation] = useState(false);

  const handleReplay = () => {
    // Clear the localStorage flag and replay
    localStorage.removeItem('operate_intro_seen');
    setShowAnimation(true);
  };

  const handleComplete = () => {
    setShowAnimation(false);
  };

  if (showAnimation) {
    return <LogoEntrance onComplete={handleComplete} skipEnabled />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Logo Animation Demo</CardTitle>
          <CardDescription>
            Preview the logo entrance animation used on first visit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Animation Specs:</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Duration: 1.8 seconds</li>
              <li>• Effect: Soft Emergence</li>
              <li>• Timing: Power2.out + Elastic.out</li>
              <li>• Skip enabled after 500ms</li>
              <li>• Respects prefers-reduced-motion</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Timeline:</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• 0-800ms: Fade in + scale to 1.02</li>
              <li>• 800-1000ms: Settle to 1.0 (elastic)</li>
              <li>• 1000-1300ms: Hold for recognition</li>
              <li>• 1300-1800ms: Fade out + morph to card</li>
            </ul>
          </div>

          <Button onClick={handleReplay} className="w-full">
            Play Animation
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Click anywhere or "Skip" during animation to end early
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
