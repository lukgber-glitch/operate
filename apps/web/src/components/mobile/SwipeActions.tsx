'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { Trash2, Archive, Star, Check, X } from 'lucide-react';
import { useHaptic } from '@/hooks/use-haptic';

export interface SwipeAction {
  id: string;
  label: string;
  icon?: ReactNode;
  color: 'red' | 'blue' | 'green' | 'yellow' | 'gray';
  onAction: () => void | Promise<void>;
}

interface SwipeActionsProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  disabled?: boolean;
}

const COLOR_CLASSES = {
  red: 'bg-red-500 text-white',
  blue: 'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  yellow: 'bg-yellow-500 text-white',
  gray: 'bg-gray-500 text-white',
};

export function SwipeActions({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  disabled = false,
}: SwipeActionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [triggeredAction, setTriggeredAction] = useState<SwipeAction | null>(null);
  const haptic = useHaptic();

  const maxSwipeDistance = 200;

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    if (!touch) return;
    setStartX(touch.clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || !isDragging || startX === 0) return;
    const touch = e.touches[0];
    if (!touch) return;

    const currentX = touch.clientX;
    const distance = currentX - startX;

    // Limit swipe distance
    const limitedDistance = Math.max(
      -maxSwipeDistance,
      Math.min(maxSwipeDistance, distance)
    );

    setSwipeDistance(limitedDistance);

    // Check if threshold is reached for haptic feedback
    if (Math.abs(limitedDistance) >= threshold && !triggeredAction) {
      const action = limitedDistance > 0 ? leftActions[0] : rightActions[0];
      if (action) {
        haptic.light();
        setTriggeredAction(action);
      }
    } else if (Math.abs(limitedDistance) < threshold && triggeredAction) {
      setTriggeredAction(null);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled) return;

    setIsDragging(false);

    if (Math.abs(swipeDistance) >= threshold && triggeredAction) {
      // Execute the action
      haptic.medium();
      try {
        await triggeredAction.onAction();
        haptic.success();
      } catch (error) {
        console.error('Swipe action failed:', error);
        haptic.error();
      }
    }

    // Reset
    setSwipeDistance(0);
    setStartX(0);
    setTriggeredAction(null);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, isDragging, swipeDistance, startX, threshold, triggeredAction]);

  const visibleActions = swipeDistance > 0 ? leftActions : rightActions;
  const actionWidth = 80;

  return (
    <div ref={containerRef} className="relative overflow-hidden touch-pan-y">
      {/* Left actions */}
      {leftActions.length > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 flex items-stretch"
          style={{
            width: Math.max(0, swipeDistance),
            transition: isDragging ? 'none' : 'width 0.3s ease-out',
          }}
        >
          {leftActions.map((action, index) => (
            <div
              key={action.id}
              className={`flex flex-col items-center justify-center ${
                COLOR_CLASSES[action.color]
              }`}
              style={{ width: actionWidth }}
            >
              {action.icon || <Check className="h-5 w-5" />}
              <span className="text-xs mt-1">{action.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Right actions */}
      {rightActions.length > 0 && (
        <div
          className="absolute right-0 top-0 bottom-0 flex items-stretch"
          style={{
            width: Math.max(0, -swipeDistance),
            transition: isDragging ? 'none' : 'width 0.3s ease-out',
          }}
        >
          {rightActions.map((action, index) => (
            <div
              key={action.id}
              className={`flex flex-col items-center justify-center ${
                COLOR_CLASSES[action.color]
              }`}
              style={{ width: actionWidth }}
            >
              {action.icon || <Trash2 className="h-5 w-5" />}
              <span className="text-xs mt-1">{action.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div
        className="relative bg-background"
        style={{
          transform: `translateX(${swipeDistance}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Convenience export for common action icons
export const SwipeActionIcons = {
  Delete: <Trash2 className="h-5 w-5" />,
  Archive: <Archive className="h-5 w-5" />,
  Star: <Star className="h-5 w-5" />,
  Check: <Check className="h-5 w-5" />,
  Close: <X className="h-5 w-5" />,
};
