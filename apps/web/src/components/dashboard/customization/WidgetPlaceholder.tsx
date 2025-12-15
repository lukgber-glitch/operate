/**
 * Widget Placeholder Component
 * Drop zone indicator for drag and drop
 */

'use client';

import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WidgetPlaceholderProps {
  id: string;
  isEditMode: boolean;
  label?: string;
  className?: string;
}

export function WidgetPlaceholder({ id, isEditMode, label = 'Drop widget here', className }: WidgetPlaceholderProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: !isEditMode,
  });

  if (!isEditMode) {
    return null;
  }

  return (
    <div ref={setNodeRef} className={cn('transition-all duration-200', className)}>
      <Card
        className={cn(
          'h-32 border-2 border-dashed flex items-center justify-center cursor-pointer transition-all',
          'hover:bg-accent/50 hover:border-primary/50',
          isOver && 'bg-primary/10 border-primary scale-105 shadow-lg'
        )}
      >
        <div className="flex flex-col items-center gap-2 text-gray-300">
          <Plus className={cn('h-6 w-6', isOver && 'text-primary')} />
          <span className={cn('text-sm font-medium', isOver && 'text-primary')}>{label}</span>
        </div>
      </Card>
    </div>
  );
}
