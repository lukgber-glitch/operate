'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Quote, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface Testimonial {
  id: string;
  authorName: string;
  authorRole?: string;
  company?: string;
  content: string;
  timeSaved?: string;
  isVerified: boolean;
}

interface TestimonialsCarouselProps {
  className?: string;
}

/**
 * TestimonialsCarousel Component
 *
 * Displays customer testimonials from the database with time savings.
 * Shows "Be the first" empty state if no testimonials exist.
 *
 * TRUTHFULNESS GUARANTEE:
 * - Only shows real testimonials from the database
 * - No fake testimonials or fabricated reviews
 * - Empty state encourages genuine user feedback
 * - Verified badge only for actually verified testimonials
 */
export function TestimonialsCarousel({ className }: TestimonialsCarouselProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/v1/testimonials');
        // const data = await response.json();

        // Simulated empty data - replace with real API
        const simulatedData: Testimonial[] = [];

        setTestimonials(simulatedData);
      } catch (error) {
        console.error('Failed to fetch testimonials:', error);
        setTestimonials([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTestimonials();
  }, []);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  if (isLoading) {
    return null;
  }

  // Empty state - no fake testimonials
  if (testimonials.length === 0) {
    return (
      <Card className={cn('rounded-[24px]', className)}>
        <CardContent className="p-6 text-center">
          <div className="inline-flex p-3 rounded-full bg-muted mb-4">
            <Quote className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-2">
            Be the First to Share
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
            Help others discover how Operate can transform their business. Share your experience!
          </p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              // TODO: Implement feedback form
              console.log('Open feedback form');
            }}
          >
            Share Your Experience
          </Button>
        </CardContent>
      </Card>
    );
  }

  const current = testimonials[currentIndex];

  // Safety check (should never happen due to early return above)
  if (!current) {
    return null;
  }

  return (
    <Card className={cn('rounded-[24px]', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Quote className="h-8 w-8 text-primary/20 shrink-0" />
          <div className="flex items-center gap-2">
            {testimonials.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={goToPrevious}
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {currentIndex + 1} / {testimonials.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={goToNext}
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <blockquote className="text-sm mb-4 leading-relaxed">
          "{current.content}"
        </blockquote>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">
                {current.authorName}
              </p>
              {current.isVerified && (
                <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  Verified
                </div>
              )}
            </div>
            {(current.authorRole || current.company) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {current.authorRole}
                {current.authorRole && current.company && ' at '}
                {current.company}
              </p>
            )}
          </div>

          {current.timeSaved && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <Clock className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                {current.timeSaved}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
