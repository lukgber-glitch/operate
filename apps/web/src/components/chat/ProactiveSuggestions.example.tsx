/**
 * ProactiveSuggestions Component - Integration Examples
 *
 * This file demonstrates how to integrate the ProactiveSuggestions component
 * in different contexts throughout the application.
 */

import { ProactiveSuggestions } from './ProactiveSuggestions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Example 1: Dashboard Integration
 *
 * Display global suggestions on the main dashboard
 */
export function DashboardSuggestions() {
  const router = useRouter();

  const handleExecute = (suggestionId: string) => {
    toast.success('Executing suggestion...');
    // Optionally navigate or perform actions based on suggestion type
  };

  const handleDismiss = (suggestionId: string) => {
    toast.info('Suggestion dismissed');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Suggestions for you</h2>
        <span className="text-sm text-gray-500">Powered by AI</span>
      </div>

      <ProactiveSuggestions
        context="dashboard"
        limit={5}
        onExecute={handleExecute}
        onDismiss={handleDismiss}
      />
    </div>
  );
}

/**
 * Example 2: Finance Page Integration
 *
 * Display finance-specific suggestions on the invoices page
 */
export function InvoicesSuggestions() {
  const router = useRouter();

  const handleExecute = (suggestionId: string) => {
    // Navigate to specific invoice or action
    toast.success('Opening invoice...');
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <ProactiveSuggestions
        context="finance.invoices"
        limit={3}
        onExecute={handleExecute}
        className="max-w-2xl"
      />
    </div>
  );
}

/**
 * Example 3: Chat Sidebar Integration
 *
 * Display suggestions in the chat interface sidebar
 */
export function ChatSideSuggestions() {
  return (
    <aside className="w-80 border-l border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>

      <ProactiveSuggestions
        context="chat"
        limit={5}
        onExecute={(id) => {
          // Insert suggestion into chat
          console.log('Insert into chat:', id);
        }}
        onDismiss={(id) => {
          console.log('Dismiss:', id);
        }}
      />
    </aside>
  );
}

/**
 * Example 4: Auto-Refresh Integration
 *
 * Display suggestions with automatic refresh every 2 minutes
 */
export function AutoRefreshSuggestions() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">AI Suggestions</h2>
        <p className="text-sm text-gray-600">Auto-refreshes every 2 minutes</p>
      </div>

      {/* Note: refreshInterval is handled inside useSuggestions hook */}
      <ProactiveSuggestions context="dashboard" limit={10} />
    </div>
  );
}

/**
 * Example 5: Tax Filing Page Integration
 *
 * Display tax-specific suggestions during tax season
 */
export function TaxSuggestions() {
  const router = useRouter();

  const handleExecute = (suggestionId: string) => {
    // Navigate to tax filing wizard
    router.push('/tax/file');
    toast.success('Opening tax filing wizard...');
  };

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="h-5 w-5 text-orange-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-sm font-medium text-orange-900">Tax Season Alerts</h3>
      </div>

      <ProactiveSuggestions
        context="tax"
        limit={5}
        onExecute={handleExecute}
        className="space-y-2"
      />
    </div>
  );
}

/**
 * Example 6: Mobile Integration
 *
 * Compact suggestions for mobile views
 */
export function MobileSuggestions() {
  return (
    <div className="px-4 py-3 bg-white">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Suggested Actions</h3>

      <ProactiveSuggestions
        context="mobile.dashboard"
        limit={3}
        className="space-y-2"
      />
    </div>
  );
}

/**
 * Example 7: Empty State Handling
 *
 * Custom handling when no suggestions are available
 */
export function SuggestionsWithFallback() {
  return (
    <div className="max-w-2xl mx-auto">
      <ProactiveSuggestions
        context="dashboard"
        limit={5}
        className="min-h-[200px]"
      />
      {/* Empty state is handled internally by the component */}
    </div>
  );
}

/**
 * Example 8: Error Handling
 *
 * The component handles errors internally and displays a retry button
 */
export function SuggestionsWithErrorHandling() {
  return (
    <div className="max-w-2xl mx-auto">
      <ProactiveSuggestions
        context="dashboard"
        limit={5}
      />
      {/* Error state is handled internally by the component */}
    </div>
  );
}

/**
 * Example 9: Custom Styling
 *
 * Apply custom styling to the suggestions container
 */
export function StyledSuggestions() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Smart Recommendations</h2>

      <ProactiveSuggestions
        context="dashboard"
        limit={5}
        className="space-y-4"
      />
    </div>
  );
}

/**
 * Example 10: Integration with Chat Interface
 *
 * Display suggestions below the chat input
 */
export function ChatIntegrationExample() {
  const handleExecute = (suggestionId: string) => {
    // Execute suggestion in chat context
    toast.success('Suggestion applied to chat');
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Chat messages here */}
      </div>

      {/* Suggestions */}
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        <ProactiveSuggestions
          context="chat"
          limit={3}
          onExecute={handleExecute}
          className="mb-4"
        />

        {/* Chat Input */}
        <div className="bg-white rounded-lg shadow-sm p-3">
          <input
            type="text"
            placeholder="Type a message..."
            className="w-full outline-none"
          />
        </div>
      </div>
    </div>
  );
}
