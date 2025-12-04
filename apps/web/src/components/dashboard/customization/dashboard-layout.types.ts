/**
 * Dashboard Layout Types
 * Type definitions for dashboard customization system
 */

export type WidgetSize = 'small' | 'medium' | 'large' | 'full-width';

export type WidgetType =
  | 'ai-insights'
  | 'cash-flow-chart'
  | 'quick-actions'
  | 'recent-invoices'
  | 'notifications'
  | 'tax-deadlines'
  | 'revenue-chart'
  | 'expense-breakdown';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description: string;
  icon: string;
  defaultSize: WidgetSize;
  minSize: WidgetSize;
  maxSize: WidgetSize;
  category: 'analytics' | 'actions' | 'insights' | 'finance' | 'compliance';
}

export interface WidgetPosition {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  order: number;
  visible: boolean;
  gridColumn?: number; // Column span for custom layouts
  gridRow?: number; // Row span for custom layouts
}

export interface DashboardLayout {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  widgets: WidgetPosition[];
  gridColumns: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayoutState {
  layouts: DashboardLayout[];
  activeLayoutId: string | null;
  isEditMode: boolean;
  isDragging: boolean;
}

export interface GridConfig {
  desktop: number; // 12 columns
  tablet: number; // 6 columns
  mobile: number; // 1 column
}

export const GRID_CONFIG: GridConfig = {
  desktop: 12,
  tablet: 6,
  mobile: 1,
};

export const WIDGET_SIZE_SPANS: Record<WidgetSize, number> = {
  small: 3, // 1/4 width
  medium: 6, // 1/2 width
  large: 9, // 3/4 width
  'full-width': 12, // full width
};

export const AVAILABLE_WIDGETS: WidgetConfig[] = [
  {
    id: 'ai-insights',
    type: 'ai-insights',
    title: 'AI Insights',
    description: 'Smart recommendations and business insights',
    icon: 'Sparkles',
    defaultSize: 'medium',
    minSize: 'small',
    maxSize: 'full-width',
    category: 'insights',
  },
  {
    id: 'cash-flow-chart',
    type: 'cash-flow-chart',
    title: 'Cash Flow Chart',
    description: 'Visualize your cash flow over time',
    icon: 'TrendingUp',
    defaultSize: 'large',
    minSize: 'medium',
    maxSize: 'full-width',
    category: 'analytics',
  },
  {
    id: 'quick-actions',
    type: 'quick-actions',
    title: 'Quick Actions',
    description: 'Common tasks and shortcuts',
    icon: 'Zap',
    defaultSize: 'medium',
    minSize: 'small',
    maxSize: 'large',
    category: 'actions',
  },
  {
    id: 'recent-invoices',
    type: 'recent-invoices',
    title: 'Recent Invoices',
    description: 'Latest invoices and payments',
    icon: 'FileText',
    defaultSize: 'medium',
    minSize: 'small',
    maxSize: 'full-width',
    category: 'finance',
  },
  {
    id: 'notifications',
    type: 'notifications',
    title: 'Notification Summary',
    description: 'Recent alerts and updates',
    icon: 'Bell',
    defaultSize: 'small',
    minSize: 'small',
    maxSize: 'medium',
    category: 'insights',
  },
  {
    id: 'tax-deadlines',
    type: 'tax-deadlines',
    title: 'Tax Deadline Reminders',
    description: 'Upcoming tax obligations and deadlines',
    icon: 'Calendar',
    defaultSize: 'medium',
    minSize: 'small',
    maxSize: 'large',
    category: 'compliance',
  },
  {
    id: 'revenue-chart',
    type: 'revenue-chart',
    title: 'Revenue Chart',
    description: 'Track revenue trends over time',
    icon: 'BarChart3',
    defaultSize: 'large',
    minSize: 'medium',
    maxSize: 'full-width',
    category: 'analytics',
  },
  {
    id: 'expense-breakdown',
    type: 'expense-breakdown',
    title: 'Expense Breakdown',
    description: 'Categorized expense analysis',
    icon: 'PieChart',
    defaultSize: 'medium',
    minSize: 'small',
    maxSize: 'large',
    category: 'analytics',
  },
];

export const DEFAULT_DASHBOARD_LAYOUT: Omit<DashboardLayout, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  name: 'Default Layout',
  isDefault: true,
  gridColumns: 12,
  widgets: [
    {
      id: 'ai-insights-1',
      type: 'ai-insights',
      size: 'medium',
      order: 0,
      visible: true,
    },
    {
      id: 'cash-flow-chart-1',
      type: 'cash-flow-chart',
      size: 'large',
      order: 1,
      visible: true,
    },
    {
      id: 'quick-actions-1',
      type: 'quick-actions',
      size: 'medium',
      order: 2,
      visible: true,
    },
    {
      id: 'recent-invoices-1',
      type: 'recent-invoices',
      size: 'medium',
      order: 3,
      visible: true,
    },
    {
      id: 'notifications-1',
      type: 'notifications',
      size: 'small',
      order: 4,
      visible: true,
    },
    {
      id: 'tax-deadlines-1',
      type: 'tax-deadlines',
      size: 'medium',
      order: 5,
      visible: true,
    },
  ],
};

export interface DragData {
  id: string;
  type: WidgetType;
  currentIndex: number;
}

export interface DropData {
  targetIndex: number;
  dropZone: 'before' | 'after' | 'replace';
}
