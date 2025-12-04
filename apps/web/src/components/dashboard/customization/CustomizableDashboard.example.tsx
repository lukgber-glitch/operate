/**
 * Customizable Dashboard Example
 * Complete example showing how to integrate the dashboard customization system
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { DashboardGrid } from './DashboardGrid';
import { useDashboardLayout } from './useDashboardLayout';
import { WidgetPosition, WidgetType } from './dashboard-layout.types';

// Import your actual widget components
// import { AIInsightsCard } from '../AIInsightsCard';
// import { CashFlowChartWidget } from '../CashFlowChartWidget';
// import { QuickActionsGrid } from '../QuickActionsGrid';
// ... other widgets

export function CustomizableDashboard() {
  const {
    visibleWidgets,
    isEditMode,
    isDragging,
    isLoading,
    isSaving,
    toggleEditMode,
    reorderWidgets,
    updateWidgetSize,
    toggleWidgetVisibility,
    addWidget,
    removeWidget,
    resetToDefault,
    setIsDragging,
  } = useDashboardLayout();

  // Render widget based on type
  const renderWidget = (widget: WidgetPosition) => {
    switch (widget.type) {
      case 'ai-insights':
        return (
          <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>Smart recommendations for your business</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">AI insights content goes here</p>
              {/* <AIInsightsCard /> */}
            </CardContent>
          </Card>
        );

      case 'cash-flow-chart':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Chart</CardTitle>
              <CardDescription>Track your cash flow over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Cash flow chart goes here</p>
              </div>
              {/* <CashFlowChartWidget /> */}
            </CardContent>
          </Card>
        );

      case 'quick-actions':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm">Action {i}</p>
                  </div>
                ))}
              </div>
              {/* <QuickActionsGrid /> */}
            </CardContent>
          </Card>
        );

      case 'recent-invoices':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Latest invoices and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Invoice #{i}</span>
                    <span className="text-sm font-medium">$1,000</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Recent alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm">Notification {i}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'tax-deadlines':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Tax Deadlines</CardTitle>
              <CardDescription>Upcoming obligations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium">VAT Return Q{i}</p>
                    <p className="text-xs text-muted-foreground">Due in {i * 7} days</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'revenue-chart':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Revenue Chart</CardTitle>
              <CardDescription>Track revenue trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Revenue chart goes here</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'expense-breakdown':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>Categorized expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Expense breakdown chart goes here</p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Unknown widget type: {widget.type}</p>
            </CardContent>
          </Card>
        );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-6 lg:grid-cols-12">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`col-span-${i % 2 === 0 ? '6' : '3'}`}>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DashboardGrid
      widgets={visibleWidgets}
      isEditMode={isEditMode}
      isSaving={isSaving}
      isDragging={isDragging}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(activeId, overId) => {
        setIsDragging(false);
        reorderWidgets(activeId, overId);
      }}
      onDragCancel={() => setIsDragging(false)}
      onToggleEditMode={toggleEditMode}
      onResetLayout={resetToDefault}
      onAddWidget={addWidget}
      onRemoveWidget={removeWidget}
      onResizeWidget={updateWidgetSize}
      onToggleVisibility={toggleWidgetVisibility}
      renderWidget={renderWidget}
    />
  );
}
