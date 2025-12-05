/**
 * Dashboard Layout Hook
 * Manages dashboard layout state, persistence, and API sync
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

import {
  DashboardLayout,
  DashboardLayoutState,
  DEFAULT_DASHBOARD_LAYOUT,
  WidgetPosition,
  WidgetSize,
  WidgetType,
  AVAILABLE_WIDGETS,
} from './dashboard-layout.types';

const STORAGE_KEY = 'dashboard-layout';
const STORAGE_VERSION = '1.0';

interface StoredLayout {
  version: string;
  layout: DashboardLayout;
}

export function useDashboardLayout() {
  const [state, setState] = useState<DashboardLayoutState>({
    layouts: [],
    activeLayoutId: null,
    isEditMode: false,
    isDragging: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load layout from localStorage on mount
  useEffect(() => {
    const loadLayout = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: StoredLayout = JSON.parse(stored);
          if (parsed.version === STORAGE_VERSION) {
            setState((prev) => ({
              ...prev,
              layouts: [parsed.layout],
              activeLayoutId: parsed.layout.id,
            }));
            setIsLoading(false);
            return;
          }
        }

        // Create default layout if none exists
        const defaultLayout: DashboardLayout = {
          ...DEFAULT_DASHBOARD_LAYOUT,
          id: 'default',
          userId: 'current-user', // TODO: Replace with actual user ID
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setState((prev) => ({
          ...prev,
          layouts: [defaultLayout],
          activeLayoutId: defaultLayout.id,
        }));

        // Save default to localStorage
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            version: STORAGE_VERSION,
            layout: defaultLayout,
          })
        );
      } catch (error) {
        console.error('Failed to load dashboard layout:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLayout();
  }, []);

  // Get active layout
  const activeLayout = state.layouts.find((l) => l.id === state.activeLayoutId) || null;

  // Get visible widgets
  const visibleWidgets = activeLayout?.widgets.filter((w) => w.visible).sort((a, b) => a.order - b.order) || [];

  // Save layout to localStorage and API
  const saveLayout = useCallback(
    async (layout: DashboardLayout) => {
      setIsSaving(true);
      try {
        // Save to localStorage
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            version: STORAGE_VERSION,
            layout: {
              ...layout,
              updatedAt: new Date(),
            },
          })
        );

        // TODO: Sync to API
        // await fetch('/api/dashboard/layout', {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(layout),
        // });

        setState((prev) => ({
          ...prev,
          layouts: prev.layouts.map((l) => (l.id === layout.id ? { ...layout, updatedAt: new Date() } : l)),
        }));
      } catch (error) {
        console.error('Failed to save dashboard layout:', error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isEditMode: !prev.isEditMode,
    }));
  }, []);

  // Update widget order after drag
  const reorderWidgets = useCallback(
    async (activeId: string, overId: string) => {
      if (!activeLayout) return;

      const oldIndex = visibleWidgets.findIndex((w) => w.id === activeId);
      const newIndex = visibleWidgets.findIndex((w) => w.id === overId);

      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(visibleWidgets, oldIndex, newIndex);
      const updatedWidgets = activeLayout.widgets.map((widget) => {
        const newPos = newOrder.findIndex((w) => w.id === widget.id);
        if (newPos !== -1) {
          return { ...widget, order: newPos };
        }
        return widget;
      });

      const updatedLayout: DashboardLayout = {
        ...activeLayout,
        widgets: updatedWidgets,
      };

      await saveLayout(updatedLayout);
    },
    [activeLayout, visibleWidgets, saveLayout]
  );

  // Update widget size
  const updateWidgetSize = useCallback(
    async (widgetId: string, size: WidgetSize) => {
      if (!activeLayout) return;

      const updatedLayout: DashboardLayout = {
        ...activeLayout,
        widgets: activeLayout.widgets.map((w) => (w.id === widgetId ? { ...w, size } : w)),
      };

      await saveLayout(updatedLayout);
    },
    [activeLayout, saveLayout]
  );

  // Toggle widget visibility
  const toggleWidgetVisibility = useCallback(
    async (widgetId: string) => {
      if (!activeLayout) return;

      const updatedLayout: DashboardLayout = {
        ...activeLayout,
        widgets: activeLayout.widgets.map((w) => (w.id === widgetId ? { ...w, visible: !w.visible } : w)),
      };

      await saveLayout(updatedLayout);
    },
    [activeLayout, saveLayout]
  );

  // Add widget to layout
  const addWidget = useCallback(
    async (type: WidgetType) => {
      if (!activeLayout) return;

      const widgetConfig = AVAILABLE_WIDGETS.find((w) => w.type === type);
      if (!widgetConfig) return;

      // Generate unique ID
      const existingCount = activeLayout.widgets.filter((w) => w.type === type).length;
      const newId = `${type}-${existingCount + 1}`;

      const newWidget: WidgetPosition = {
        id: newId,
        type,
        size: widgetConfig.defaultSize,
        order: activeLayout.widgets.length,
        visible: true,
      };

      const updatedLayout: DashboardLayout = {
        ...activeLayout,
        widgets: [...activeLayout.widgets, newWidget],
      };

      await saveLayout(updatedLayout);
    },
    [activeLayout, saveLayout]
  );

  // Remove widget from layout
  const removeWidget = useCallback(
    async (widgetId: string) => {
      if (!activeLayout) return;

      const updatedLayout: DashboardLayout = {
        ...activeLayout,
        widgets: activeLayout.widgets.filter((w) => w.id !== widgetId),
      };

      await saveLayout(updatedLayout);
    },
    [activeLayout, saveLayout]
  );

  // Reset to default layout
  const resetToDefault = useCallback(async () => {
    if (!activeLayout) return;

    const defaultLayout: DashboardLayout = {
      ...DEFAULT_DASHBOARD_LAYOUT,
      id: activeLayout.id,
      userId: activeLayout.userId,
      createdAt: activeLayout.createdAt,
      updatedAt: new Date(),
    };

    await saveLayout(defaultLayout);
  }, [activeLayout, saveLayout]);

  // Set dragging state
  const setIsDragging = useCallback((isDragging: boolean) => {
    setState((prev) => ({
      ...prev,
      isDragging,
    }));
  }, []);

  return {
    // State
    activeLayout,
    visibleWidgets,
    isEditMode: state.isEditMode,
    isDragging: state.isDragging,
    isLoading,
    isSaving,

    // Actions
    toggleEditMode,
    reorderWidgets,
    updateWidgetSize,
    toggleWidgetVisibility,
    addWidget,
    removeWidget,
    resetToDefault,
    setIsDragging,
  };
}
