/**
 * CashFlowChartWidget Usage Examples
 *
 * This file demonstrates how to use the CashFlowChartWidget component
 * in different scenarios and configurations.
 */

import { CashFlowChartWidget } from './CashFlowChartWidget';

/**
 * Example 1: Basic Usage
 * Default configuration with 30-day period and bar chart
 */
export function BasicCashFlowExample() {
  return (
    <div className="container mx-auto py-8">
      <CashFlowChartWidget />
    </div>
  );
}

/**
 * Example 2: Custom Period
 * Start with 12-month view
 */
export function YearlyCashFlowExample() {
  return (
    <div className="container mx-auto py-8">
      <CashFlowChartWidget defaultPeriod="12m" />
    </div>
  );
}

/**
 * Example 3: Line Chart
 * Use line chart by default
 */
export function LineCashFlowExample() {
  return (
    <div className="container mx-auto py-8">
      <CashFlowChartWidget defaultChartType="line" />
    </div>
  );
}

/**
 * Example 4: Area Chart
 * Use area chart with 3-month period
 */
export function AreaCashFlowExample() {
  return (
    <div className="container mx-auto py-8">
      <CashFlowChartWidget defaultPeriod="3m" defaultChartType="area" />
    </div>
  );
}

/**
 * Example 5: Without Export
 * Hide the export button
 */
export function NoExportCashFlowExample() {
  return (
    <div className="container mx-auto py-8">
      <CashFlowChartWidget showExport={false} />
    </div>
  );
}

/**
 * Example 6: Dashboard Grid
 * Multiple widgets in a dashboard layout
 */
export function DashboardExample() {
  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 gap-6">
        {/* Main cash flow widget */}
        <CashFlowChartWidget defaultPeriod="30d" />

        {/* Additional widgets can be placed here */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CashFlowChartWidget defaultPeriod="7d" defaultChartType="line" />
          <CashFlowChartWidget defaultPeriod="3m" defaultChartType="area" />
        </div>
      </div>
    </div>
  );
}

/**
 * Example 7: Full Width in Page
 * Widget taking full width of page container
 */
export function FullWidthExample() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Financial Dashboard</h1>
          <p className="text-muted-foreground">Track your business cash flow</p>
        </div>

        <CashFlowChartWidget className="w-full" />
      </div>
    </div>
  );
}

/**
 * Example 8: Responsive Grid Layout
 * Widget adapts to different screen sizes
 */
export function ResponsiveExample() {
  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main content - takes 8 columns on large screens */}
        <div className="lg:col-span-8">
          <CashFlowChartWidget />
        </div>

        {/* Sidebar - takes 4 columns on large screens */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">Quick Stats</h3>
            <p className="text-sm text-muted-foreground">
              Additional statistics and insights
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 9: Tabbed View
 * Switch between different time periods using tabs
 */
export function TabbedExample() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="flex gap-2 border-b">
          <button className="px-4 py-2 border-b-2 border-primary font-medium">
            Overview
          </button>
          <button className="px-4 py-2 text-muted-foreground">
            Details
          </button>
          <button className="px-4 py-2 text-muted-foreground">
            Reports
          </button>
        </div>

        <CashFlowChartWidget />
      </div>
    </div>
  );
}

/**
 * Example 10: Custom Styling
 * Widget with custom container styling
 */
export function CustomStyledExample() {
  return (
    <div className="container mx-auto py-8">
      <CashFlowChartWidget
        className="shadow-xl border-2 border-primary/20"
      />
    </div>
  );
}
