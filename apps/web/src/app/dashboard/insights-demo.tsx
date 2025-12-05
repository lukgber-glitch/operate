'use client';

/**
 * AI Insights Demo Page
 * Demonstrates the AIInsightsCard component with all features
 */

import { useState } from 'react';
import { AIInsightsCard } from '@/components/dashboard/AIInsightsCard';
import { InsightsCompactList } from '@/components/dashboard/insights';
import { useAIInsights } from '@/hooks/useAIInsights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, LayoutDashboard } from 'lucide-react';

export default function InsightsDemoPage() {
  const [actionLog, setActionLog] = useState<string[]>([]);

  // Direct hook usage example
  const {
    insights: topInsights,
    isLoading,
    refresh,
  } = useAIInsights({
    filters: {
      urgency: ['HIGH', 'URGENT'],
      limit: 5,
    },
  });

  const handleInsightAction = (id: string, data?: any) => {
    const log = `Action on insight ${id}: ${JSON.stringify(data || {})}`;
    setActionLog((prev) => [log, ...prev].slice(0, 10));
    console.log(log);
  };

  const handleDismiss = (id: string) => {
    const log = `Dismissed insight ${id}`;
    setActionLog((prev) => [log, ...prev].slice(0, 10));
    console.log(log);
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Insights Demo</h1>
        </div>
        <p className="text-muted-foreground">
          Demonstration of the AI Insights Card component with all features
        </p>
      </div>

      <Tabs defaultValue="full" className="space-y-6">
        <TabsList>
          <TabsTrigger value="full">Full Card</TabsTrigger>
          <TabsTrigger value="compact">Compact List</TabsTrigger>
          <TabsTrigger value="customized">Customized</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        {/* Full Card Demo */}
        <TabsContent value="full" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Default Configuration</CardTitle>
              <CardDescription>
                Full-featured AI insights card with filtering and refresh
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIInsightsCard
                limit={10}
                showFilters={true}
                showRefresh={true}
                autoRefresh={false}
                maxHeight="500px"
                onInsightAction={handleInsightAction}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compact List Demo */}
        <TabsContent value="compact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compact Horizontal Layout</CardTitle>
              <CardDescription>
                Scrollable horizontal list of compact insight cards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex gap-3 overflow-x-auto">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="min-w-[260px] h-40 bg-muted animate-pulse rounded-lg"
                    />
                  ))}
                </div>
              ) : (
                <InsightsCompactList
                  insights={topInsights}
                  onDismiss={handleDismiss}
                  onAction={handleInsightAction}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customized Demo */}
        <TabsContent value="customized" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Without Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Without Filters</CardTitle>
                <CardDescription>Minimal configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <AIInsightsCard
                  limit={5}
                  showFilters={false}
                  showRefresh={true}
                  maxHeight="400px"
                  onInsightAction={handleInsightAction}
                />
              </CardContent>
            </Card>

            {/* With Auto-refresh */}
            <Card>
              <CardHeader>
                <CardTitle>Auto-Refresh Enabled</CardTitle>
                <CardDescription>Updates every 5 minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <AIInsightsCard
                  limit={5}
                  showFilters={true}
                  showRefresh={true}
                  autoRefresh={true}
                  maxHeight="400px"
                  onInsightAction={handleInsightAction}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Integration Example */}
        <TabsContent value="integration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dashboard Layout Example */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5" />
                  <CardTitle>Main Dashboard Content</CardTitle>
                </div>
                <CardDescription>
                  Your primary dashboard widgets and KPIs go here
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Mock KPI Cards */}
                  {[
                    { label: 'Revenue', value: '$45,231', change: '+12%' },
                    { label: 'Expenses', value: '$12,450', change: '-5%' },
                    { label: 'Profit', value: '$32,781', change: '+18%' },
                    { label: 'Invoices', value: '142', change: '+23' },
                  ].map((kpi) => (
                    <Card key={kpi.label}>
                      <CardHeader className="pb-2">
                        <CardDescription className="text-xs">{kpi.label}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline justify-between">
                          <p className="text-2xl font-bold">{kpi.value}</p>
                          <Badge variant="secondary" className="text-xs">
                            {kpi.change}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Top Priority Insights */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Priority Insights</h3>
                  <InsightsCompactList
                    insights={topInsights}
                    onDismiss={handleDismiss}
                    onAction={handleInsightAction}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sidebar with Insights */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">AI Assistant</CardTitle>
                <CardDescription className="text-xs">
                  Proactive insights and suggestions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <AIInsightsCard
                  limit={8}
                  showFilters={true}
                  showRefresh={true}
                  autoRefresh={false}
                  maxHeight="600px"
                  onInsightAction={handleInsightAction}
                  className="border-0 shadow-none"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Log */}
      {actionLog.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Action Log</CardTitle>
                <CardDescription className="text-xs">
                  Recent interactions with insights
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionLog([])}
              >
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {actionLog.map((log, i) => (
                <div
                  key={i}
                  className="text-xs p-2 bg-muted rounded font-mono"
                >
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
