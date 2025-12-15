/**
 * Draggable Widget Component
 * Wraps dashboard widgets to make them draggable and resizable
 */

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, X, Maximize2, Minimize2 } from 'lucide-react';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { WidgetPosition, WidgetSize, WIDGET_SIZE_SPANS } from './dashboard-layout.types';

interface DraggableWidgetProps {
  widget: WidgetPosition;
  isEditMode: boolean;
  children: ReactNode;
  onRemove?: (widgetId: string) => void;
  onResize?: (widgetId: string, size: WidgetSize) => void;
  onToggleVisibility?: (widgetId: string) => void;
}

const SIZE_LABELS: Record<WidgetSize, string> = {
  small: 'Small (25%)',
  medium: 'Medium (50%)',
  large: 'Large (75%)',
  'full-width': 'Full Width (100%)',
};

export function DraggableWidget({
  widget,
  isEditMode,
  children,
  onRemove,
  onResize,
  onToggleVisibility,
}: DraggableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    disabled: !isEditMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    gridColumn: `span ${WIDGET_SIZE_SPANS[widget.size]}`,
  };

  if (!widget.visible && !isEditMode) {
    return null;
  }

  return (
    <div ref={setNodeRef} style={style} className={cn('relative group', isDragging && 'z-50')}>
      <Card
        className={cn(
          'relative h-full transition-all duration-200',
          isEditMode && 'ring-2 ring-primary/20',
          isDragging && 'shadow-2xl ring-4 ring-primary/40',
          !widget.visible && 'opacity-50 bg-muted'
        )}
      >
        {/* Edit Mode Controls */}
        {isEditMode && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Drag Handle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-grab active:cursor-grabbing bg-background/80 backdrop-blur-sm"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </Button>

            {/* Resize Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Resize Widget</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(SIZE_LABELS) as WidgetSize[]).map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => onResize?.(widget.id, size)}
                    className={cn(widget.size === size && 'bg-accent')}
                  >
                    {SIZE_LABELS[size]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Toggle Visibility */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm"
              onClick={() => onToggleVisibility?.(widget.id)}
            >
              {widget.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>

            {/* Remove Widget */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
              onClick={() => onRemove?.(widget.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Widget Content */}
        <div className={cn(isEditMode && 'pointer-events-none select-none')}>{children}</div>

        {/* Hidden Indicator */}
        {!widget.visible && isEditMode && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-gray-300">
              <EyeOff className="h-8 w-8" />
              <span className="text-sm font-medium">Hidden Widget</span>
            </div>
          </div>
        )}

        {/* Dragging Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm rounded-lg border-2 border-primary border-dashed" />
        )}
      </Card>
    </div>
  );
}
