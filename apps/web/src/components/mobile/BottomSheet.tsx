'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useHaptic } from '@/hooks/use-haptic';

export type SnapPoint = 'closed' | 'peek' | 'half' | 'full';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  snapPoints?: SnapPoint[];
  initialSnap?: SnapPoint;
  showHandle?: boolean;
  showClose?: boolean;
  title?: string;
  backdrop?: boolean;
}

const SNAP_PERCENTAGES: Record<SnapPoint, number> = {
  closed: 0,
  peek: 20,
  half: 50,
  full: 90,
};

export function BottomSheet({
  isOpen,
  onClose,
  children,
  snapPoints = ['peek', 'full'],
  initialSnap = 'peek',
  showHandle = true,
  showClose = true,
  title,
  backdrop = true,
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState<SnapPoint>(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [startY, setStartY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const haptic = useHaptic();

  const getSnapPosition = (snap: SnapPoint) => {
    return SNAP_PERCENTAGES[snap];
  };

  const findClosestSnap = (percentage: number): SnapPoint => {
    const validSnaps: SnapPoint[] = snapPoints.includes('closed') ? snapPoints : ['closed', ...snapPoints];

    return validSnaps.reduce<SnapPoint>((closest, snap) => {
      const currentDiff = Math.abs(percentage - getSnapPosition(snap));
      const closestDiff = Math.abs(percentage - getSnapPosition(closest));
      return currentDiff < closestDiff ? snap : closest;
    }, validSnaps[0] ?? 'closed');
  };

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    setStartY(touch.clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !sheetRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    const currentY = touch.clientY;
    const deltaY = currentY - startY;

    // Only allow downward dragging from full position
    // or any direction from other positions
    if (currentSnap === 'full' && deltaY < 0) {
      return;
    }

    setDragY(deltaY);
  };

  const handleTouchEnd = () => {
    if (!sheetRef.current) return;

    const sheetHeight = sheetRef.current.offsetHeight;
    const windowHeight = window.innerHeight;
    const currentPercentage = getSnapPosition(currentSnap);
    const dragPercentage = (dragY / windowHeight) * 100;
    const newPercentage = Math.max(0, Math.min(90, currentPercentage - dragPercentage));

    const closestSnap = findClosestSnap(newPercentage);

    haptic.selection();

    if (closestSnap === 'closed') {
      onClose();
    } else {
      setCurrentSnap(closestSnap);
    }

    setIsDragging(false);
    setDragY(0);
    setStartY(0);
  };

  useEffect(() => {
    if (!isOpen) {
      setCurrentSnap(initialSnap);
      return;
    }

    const sheet = sheetRef.current;
    if (!sheet) return;

    sheet.addEventListener('touchstart', handleTouchStart, { passive: true });
    sheet.addEventListener('touchmove', handleTouchMove, { passive: true });
    sheet.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart);
      sheet.removeEventListener('touchmove', handleTouchMove);
      sheet.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, isDragging, dragY, startY, currentSnap]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPercentage = getSnapPosition(currentSnap);
  const dragPercentage = isDragging ? (dragY / window.innerHeight) * 100 : 0;
  const translateY = 100 - currentPercentage + dragPercentage;

  const content = (
    <>
      {/* Backdrop */}
      {backdrop && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          style={{
            opacity: isDragging ? 1 - dragPercentage / 100 : 1,
          }}
          onClick={onClose}
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-2xl will-change-transform"
        style={{
          transform: `translateY(${translateY}%)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          maxHeight: '90vh',
        }}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            {showClose && (
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-accent transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          {children}
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
