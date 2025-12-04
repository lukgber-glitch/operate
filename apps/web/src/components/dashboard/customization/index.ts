/**
 * Dashboard Customization Module
 * Exports all components and utilities for dashboard customization
 */

export { DashboardGrid } from './DashboardGrid';
export { DraggableWidget } from './DraggableWidget';
export { WidgetPlaceholder } from './WidgetPlaceholder';
export { WidgetResizeHandle, useWidgetResize } from './WidgetResizeHandle';
export { DashboardCustomizer } from './DashboardCustomizer';
export { WidgetPicker } from './WidgetPicker';
export { useDashboardLayout } from './useDashboardLayout';

export type {
  WidgetSize,
  WidgetType,
  WidgetConfig,
  WidgetPosition,
  DashboardLayout,
  DashboardLayoutState,
  GridConfig,
  DragData,
  DropData,
} from './dashboard-layout.types';

export {
  GRID_CONFIG,
  WIDGET_SIZE_SPANS,
  AVAILABLE_WIDGETS,
  DEFAULT_DASHBOARD_LAYOUT,
} from './dashboard-layout.types';
