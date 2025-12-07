'use client';

import { useState } from 'react';
import { QuickActionPills, type QuickActionContext } from './QuickActionPills';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * QuickActionPills Context Demo - Demonstrates context-aware functionality (S4-05)
 *
 * This example shows:
 * 1. Context-aware actions based on simulated page context
 * 2. Automatic context detection behavior
 * 3. Smooth animations when context changes
 * 4. All available context types
 */

export function QuickActionPillsContextDemo() {
  const [selectedContext, setSelectedContext] = useState<QuickActionContext>('default');
  const [actionLog, setActionLog] = useState<string[]>([]);

  const handleActionClick = (action: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActionLog(prev => [`[${timestamp}] ${action}`, ...prev].slice(0, 10));
  };

  const contexts: QuickActionContext[] = [
    'default',
    'dashboard',
    'invoices',
    'expenses',
    'hr',
    'banking',
    'tax',
    'vendors',
    'reports',
    'documents',
    'chat',
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Quick Action Pills - Context-Aware Demo</h2>
        <p className="text-muted-foreground">
          Select different page contexts to see how the quick action pills adapt automatically
        </p>
      </div>

      {/* Context Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Simulate Page Context</CardTitle>
          <CardDescription>
            In production, context is auto-detected from the current route (e.g., /dashboard/invoices → 'invoices')
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedContext} onValueChange={(v) => setSelectedContext(v as QuickActionContext)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select context" />
              </SelectTrigger>
              <SelectContent>
                {contexts.map((ctx) => (
                  <SelectItem key={ctx} value={ctx}>
                    {ctx}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Current Context: <strong>{selectedContext}</strong>
            </span>
          </div>

          {/* Quick context buttons */}
          <div className="flex flex-wrap gap-2">
            {contexts.map((ctx) => (
              <Button
                key={ctx}
                variant={selectedContext === ctx ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedContext(ctx)}
              >
                {ctx}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Pills Display */}
      <Card>
        <CardHeader>
          <CardTitle>Contextual Quick Actions</CardTitle>
          <CardDescription>
            Watch the pills animate smoothly when you change context
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-lg overflow-hidden">
            <QuickActionPills
              context={selectedContext}
              onActionClick={handleActionClick}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Log */}
      <Card>
        <CardHeader>
          <CardTitle>Action Log</CardTitle>
          <CardDescription>
            Click on any pill above to see the action logged here
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actionLog.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No actions clicked yet. Try clicking a pill above!
            </p>
          ) : (
            <div className="space-y-2">
              {actionLog.map((log, index) => (
                <div
                  key={index}
                  className="text-sm font-mono bg-muted/50 p-2 rounded"
                >
                  {log}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Context Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Context Descriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>invoices:</strong> Create Invoice, Send Reminders, Revenue Report, Overdue Invoices
            </div>
            <div>
              <strong>expenses:</strong> Add Expense, Categorize All, Tax Deductions, Expense Report
            </div>
            <div>
              <strong>hr:</strong> Run Payroll, Request Leave, Hire Employee, Approve Leave
            </div>
            <div>
              <strong>banking:</strong> Account Balance, Recent Transactions, Cash Flow, Reconcile
            </div>
            <div>
              <strong>dashboard:</strong> Daily Summary, Pending Tasks, Quick Insights, Today's Agenda
            </div>
            <div>
              <strong>tax:</strong> Tax Liability, File Return, Deductions, Deadlines
            </div>
            <div>
              <strong>vendors:</strong> All Vendors, Pending Bills, Pay Bills, Add Vendor
            </div>
            <div>
              <strong>reports:</strong> P&L Report, Balance Sheet, Cash Flow, Export Reports
            </div>
            <div>
              <strong>documents:</strong> Search Docs, Recent Files, Tax Documents, Receipts
            </div>
            <div>
              <strong>chat:</strong> Invoices, Cash Flow, Tax Summary, Bank Summary
            </div>
            <div>
              <strong>default:</strong> Create Invoice, Cash Flow, Tax Summary, Email Insights, Bank Summary
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Notes (S4-05)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <strong>Automatic Route Detection:</strong> The component uses Next.js usePathname() to detect the current page
          </div>
          <div>
            <strong>Priority Order:</strong>
            <ol className="list-decimal list-inside ml-4 space-y-1 mt-2">
              <li>Explicitly provided contextualActions prop (highest priority)</li>
              <li>Explicitly provided context prop</li>
              <li>Auto-detected context from route (lowest priority)</li>
            </ol>
          </div>
          <div>
            <strong>Animation:</strong> GSAP stagger animation triggers when actions change (smooth context switching)
          </div>
          <div>
            <strong>TypeScript:</strong> Fully typed with QuickAction interface and QuickActionContext type
          </div>
          <div>
            <strong>Responsive:</strong> Touch-friendly pills with horizontal scroll on mobile
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
