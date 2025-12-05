'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AIInsight } from '@/types/ai-insights';
import { InsightItem } from './InsightItem';

interface InsightsCompactListProps {
  insights: AIInsight[];
  onDismiss?: (id: string) => void;
  onAction?: (id: string, actionData?: any) => void;
  className?: string;
}

/**
 * InsightsCompactList - Horizontal scrollable list of compact insights
 *
 * Features:
 * - Horizontal scroll layout
 * - Navigation arrows
 * - Compact card format
 * - Responsive sizing
 * - Smooth scrolling
 */
export function InsightsCompactList({
  insights,
  onDismiss,
  onAction,
  className,
}: InsightsCompactListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [insights]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      const newScrollLeft =
        direction === 'left'
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });

      setTimeout(checkScroll, 300);
    }
  };

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className={cn('relative group', className)}>
      {/* Left Navigation */}
      {canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        onScroll={checkScroll}
      >
        {insights.map((insight) => (
          <InsightItem
            key={insight.id}
            insight={insight}
            onDismiss={onDismiss}
            onAction={onAction}
            compact
          />
        ))}
      </div>

      {/* Right Navigation */}
      {canScrollRight && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
