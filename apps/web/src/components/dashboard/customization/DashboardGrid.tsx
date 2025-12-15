/**
 * Dashboard Grid Component
 * Main grid container with drag-and-drop functionality
 */

'use client';

import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { DraggableWidget } from './DraggableWidget';
import { WidgetPosition, WidgetSize, WidgetType } from './dashboard-layout.types';
import { DashboardCustomizer } from './DashboardCustomizer';

interface DashboardGridProps {
  widgets: WidgetPosition[];
  isEditMode: boolean;
  isSaving: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: (activeId: string, overId: string) => void;
  onDragCancel: () => void;
  onToggleEditMode: () => void;
  onResetLayout: () => void;
  onAddWidget: (type: WidgetType) => void;
  onRemoveWidget: (widgetId: string) => void;
  onResizeWidget: (widgetId: string, size: WidgetSize) => void;
  onToggleVisibility: (widgetId: string) => void;
  renderWidget: (widget: WidgetPosition) => ReactNode;
  className?: string;
}

export function DashboardGrid({
  widgets,
  isEditMode,
  isSaving,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragCancel,
  onToggleEditMode,
  onResetLayout,
  onAddWidget,
  onRemoveWidget,
  onResizeWidget,
  onToggleVisibility,
  renderWidget,
  className,
}: DashboardGridProps) {
  // Configure sensors for drag interactions
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    onDragStart();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      onDragEnd(active.id as string, over.id as string);
    } else {
      onDragCancel();
    }
  };

  const handleDragCancel = () => {
    onDragCancel();
  };

  const visibleWidgets = widgets.filter((w) => w.visible || isEditMode);
  const widgetIds = visibleWidgets.map((w) => w.id);
  const visibleCount = widgets.filter((w) => w.visible).length;

  return (
    <>
      {/* Customizer Controls */}
      <DashboardCustomizer
        isEditMode={isEditMode}
        isSaving={isSaving}
        visibleWidgetCount={visibleCount}
        totalWidgetCount={widgets.length}
        onToggleEditMode={onToggleEditMode}
        onReset={onResetLayout}
        onAddWidget={onAddWidget}
      />

      {/* Dashboard Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
      >
        <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
          <div
            className={cn(
              'grid gap-6 transition-all duration-200',
              'grid-cols-1 md:grid-cols-6 lg:grid-cols-12',
              isDragging && 'select-none',
              className
            )}
          >
            {visibleWidgets.map((widget) => (
              <DraggableWidget
                key={widget.id}
                widget={widget}
                isEditMode={isEditMode}
                onRemove={onRemoveWidget}
                onResize={onResizeWidget}
                onToggleVisibility={onToggleVisibility}
              >
                {renderWidget(widget)}
              </DraggableWidget>
            ))}
          </div>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay>
          {isDragging ? (
            <div className="opacity-50 cursor-grabbing">
              {/* Placeholder for drag preview */}
              <div className="h-32 bg-primary/20 rounded-lg border-2 border-dashed border-primary" />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {visibleWidgets.length === 0 && !isEditMode && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <svg
              className="h-12 w-12 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zm10 0a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No widgets to display</h3>
          <p className="text-sm text-gray-300 mb-4">
            Customize your dashboard by adding widgets
          </p>
        </div>
      )}
    </>
  );
}
