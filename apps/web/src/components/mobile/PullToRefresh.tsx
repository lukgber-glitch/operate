'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { useHaptic } from '@/hooks/use-haptic';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  maxPullDistance?: number;
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  maxPullDistance = 120,
  disabled = false,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const haptic = useHaptic();

  const isAtTop = () => {
    const container = containerRef.current;
    if (!container) return false;
    return container.scrollTop === 0;
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing || !isAtTop()) return;
    const touch = e.touches[0];
    if (!touch) return;
    setStartY(touch.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || isRefreshing || !isAtTop() || startY === 0) return;
    const touch = e.touches[0];
    if (!touch) return;

    const currentY = touch.clientY;
    const distance = currentY - startY;

    if (distance > 0) {
      // Prevent default scroll behavior when pulling down
      e.preventDefault();

      // Apply resistance curve for natural feel
      const resistance = Math.min(distance / 2, maxPullDistance);
      setPullDistance(resistance);

      // Trigger haptic feedback when threshold is reached
      if (resistance >= threshold && haptic.isSupported) {
        haptic.light();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      haptic.medium();

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
        haptic.error();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    setStartY(0);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, isRefreshing, pullDistance, startY, threshold]);

  const rotation = Math.min((pullDistance / threshold) * 360, 360);
  const opacity = Math.min(pullDistance / threshold, 1);
  const scale = Math.min(0.5 + (pullDistance / threshold) * 0.5, 1);

  return (
    <div ref={containerRef} className="relative h-full overflow-auto">
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 top-0 z-50 flex items-center justify-center transition-all"
        style={{
          height: pullDistance,
          opacity,
        }}
      >
        <div
          className="flex items-center justify-center rounded-full bg-primary/10 p-2"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: isRefreshing ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          <RefreshCw
            className={`h-6 w-6 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
