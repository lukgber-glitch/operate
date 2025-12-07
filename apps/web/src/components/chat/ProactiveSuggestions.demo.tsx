/**
 * ProactiveSuggestions Demo Page
 *
 * Use this component to test and demo the ProactiveSuggestions component
 * before integrating it into the main application.
 *
 * Usage:
 * 1. Import this component in a test page
 * 2. Ensure the backend API is running
 * 3. Navigate to the page to see the demo
 */

'use client';

import { useState } from 'react';
import { ProactiveSuggestions } from './ProactiveSuggestions';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function ProactiveSuggestionsDemo() {
  const [context, setContext] = useState<string>('dashboard');
  const [limit, setLimit] = useState<number>(5);
  const [refreshKey, setRefreshKey] = useState(0);

  const contexts = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'finance.invoices', label: 'Invoices' },
    { value: 'finance.expenses', label: 'Expenses' },
    { value: 'tax', label: 'Tax' },
    { value: 'chat', label: 'Chat' },
  ];

  const handleExecute = (suggestionId: string) => {
    toast.success(`Executing suggestion: ${suggestionId}`);
    console.log('Execute suggestion:', suggestionId);
  };

  const handleDismiss = (suggestionId: string) => {
    toast.info(`Dismissed suggestion: ${suggestionId}`);
    console.log('Dismiss suggestion:', suggestionId);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    toast.info('Refreshing suggestions...');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ProactiveSuggestions Demo
          </h1>
          <p className="text-gray-600">
            Test and preview the AI suggestions component with different configurations
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Controls</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Context Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Context
              </label>
              <select
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {contexts.map((ctx) => (
                  <option key={ctx.value} value={ctx.value}>
                    {ctx.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Limit Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limit
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[3, 5, 10, 20].map((num) => (
                  <option key={num} value={num}>
                    {num} suggestions
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actions
              </label>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Current Settings Display */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h3 className="text-xs font-medium text-gray-700 mb-1">Current Settings:</h3>
            <code className="text-xs text-gray-600">
              {`<ProactiveSuggestions context="${context}" limit={${limit}} />`}
            </code>
          </div>
        </div>

        {/* Component Preview */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
            <span className="text-xs text-gray-500">
              Key: {refreshKey}
            </span>
          </div>

          <ProactiveSuggestions
            key={refreshKey}
            context={context}
            limit={limit}
            onExecute={handleExecute}
            onDismiss={handleDismiss}
          />
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            ℹ️ Demo Information
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Suggestions are fetched from <code className="bg-blue-100 px-1 rounded">/api/v1/chatbot/suggestions</code></li>
            <li>• Execute and dismiss actions are logged to console</li>
            <li>• Change context to filter suggestions by page</li>
            <li>• Adjust limit to control number of displayed suggestions</li>
            <li>• Click refresh to force reload suggestions</li>
          </ul>
        </div>

        {/* Mock Data Note */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-900 mb-2">
            ⚠️ Backend Note
          </h3>
          <p className="text-sm text-yellow-800">
            If you see an error or empty state, ensure the backend API is running
            and the suggestions endpoint is implemented. You may need to add mock
            suggestions data to the backend for testing.
          </p>
        </div>

        {/* Test Actions */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Actions</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Testing loading state...')}
            >
              Test Loading
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.error('Simulating API error')}
            >
              Test Error
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('No suggestions available')}
            >
              Test Empty
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Current context:', context);
                console.log('Current limit:', limit);
                toast.success('Settings logged to console');
              }}
            >
              Log Settings
            </Button>
          </div>
        </div>

        {/* Integration Code */}
        <div className="mt-6 bg-gray-900 rounded-lg p-6 text-white">
          <h2 className="text-lg font-semibold mb-4">Integration Code</h2>

          <pre className="text-xs overflow-x-auto">
            <code>{`import { ProactiveSuggestions } from '@/components/chat/ProactiveSuggestions';
import { toast } from 'sonner';

export function MyPage() {
  return (
    <ProactiveSuggestions
      context="${context}"
      limit={${limit}}
      onExecute={(id) => {
        toast.success('Executing suggestion: ' + id);
        // Handle execution
      }}
      onDismiss={(id) => {
        toast.info('Dismissed suggestion: ' + id);
        // Handle dismissal
      }}
    />
  );
}`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

export default ProactiveSuggestionsDemo;
