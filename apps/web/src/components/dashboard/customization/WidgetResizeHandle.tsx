/**
 * Widget Resize Handle Component
 * Visual handles for resizing widgets
 */

'use client';

import { Maximize2, Minimize2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { WidgetSize } from './dashboard-layout.types';

interface WidgetResizeHandleProps {
  currentSize: WidgetSize;
  onResize: (direction: 'increase' | 'decrease') => void;
  className?: string;
}

const SIZE_ORDER: WidgetSize[] = ['small', 'medium', 'large', 'full-width'];

export function WidgetResizeHandle({ currentSize, onResize, className }: WidgetResizeHandleProps) {
  const currentIndex = SIZE_ORDER.indexOf(currentSize);
  const canIncrease = currentIndex < SIZE_ORDER.length - 1;
  const canDecrease = currentIndex > 0;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => onResize('decrease')}
        disabled={!canDecrease}
        title="Make smaller"
      >
        <Minimize2 className="h-3 w-3" />
      </Button>

      <span className="text-xs font-medium text-gray-300 min-w-[60px] text-center">
        {currentSize === 'full-width' ? 'Full' : currentSize.charAt(0).toUpperCase() + currentSize.slice(1)}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => onResize('increase')}
        disabled={!canIncrease}
        title="Make larger"
      >
        <Maximize2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function useWidgetResize(currentSize: WidgetSize, onSizeChange: (size: WidgetSize) => void) {
  const handleResize = (direction: 'increase' | 'decrease') => {
    const currentIndex = SIZE_ORDER.indexOf(currentSize);

    if (direction === 'increase' && currentIndex < SIZE_ORDER.length - 1) {
      const nextSize = SIZE_ORDER[currentIndex + 1];
      if (nextSize) onSizeChange(nextSize);
    } else if (direction === 'decrease' && currentIndex > 0) {
      const prevSize = SIZE_ORDER[currentIndex - 1];
      if (prevSize) onSizeChange(prevSize);
    }
  };

  return handleResize;
}
