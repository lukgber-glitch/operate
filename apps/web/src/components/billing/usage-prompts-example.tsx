/**
 * Usage Prompts System - Example Implementation
 *
 * This file demonstrates how to use the usage prompts components
 * in different scenarios throughout the application.
 */

import React from 'react';
import { UsageManager, UsageBanner, UsageLimitModal, UsageIndicator, UpgradeCard } from '@/components/billing';
import { useUsageCheck } from '@/hooks/use-usage-check';

// ============================================
// Example 1: Dashboard Layout (Automatic)
// ============================================
export function DashboardLayoutExample() {
  return (
    <main>
      {/* This automatically handles all usage prompts */}
      <UsageManager />

      {/* Your page content */}
      <div>Dashboard content...</div>
    </main>
  );
}

// ============================================
// Example 2: Manual Banner Control
// ============================================
export function ManualBannerExample() {
  const { usage } = useUsageCheck();

  if (!usage || usage.aiMessages.percentage < 80) {
    return null;
  }

  return (
    <UsageBanner
      percentage={usage.aiMessages.percentage}
      used={usage.aiMessages.used}
      limit={usage.aiMessages.limit}
      resourceType="AI messages"
      onDismiss={() => console.log('Banner dismissed')}
    />
  );
}

// ============================================
// Example 3: Settings Page Usage Display
// ============================================
export function SettingsUsageExample() {
  const { usage } = useUsageCheck();

  if (!usage) {
    return <div>Loading usage data...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Usage</h2>

      {/* Show all usage indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <UsageIndicator
            label="AI Messages"
            used={usage.aiMessages.used}
            limit={usage.aiMessages.limit}
            percentage={usage.aiMessages.percentage}
          />
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <UsageIndicator
            label="Bank Connections"
            used={usage.bankConnections.used}
            limit={usage.bankConnections.limit}
            percentage={usage.bankConnections.percentage}
          />
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <UsageIndicator
            label="Invoices"
            used={usage.invoices.used}
            limit={usage.invoices.limit}
            percentage={usage.invoices.percentage}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Example 4: Upgrade Card in Pricing Page
// ============================================
export function PricingPageExample() {
  const { usage } = useUsageCheck();

  if (!usage) {
    return null;
  }

  // Free tier users
  if (usage.plan.tier === 'free') {
    return (
      <UpgradeCard
        currentPlan="Free Plan"
        upgradePlan="Starter"
        currentPrice="$0/month"
        upgradePrice="$29/month"
        features={[
          { name: 'AI Messages', current: '100/mo', upgrade: '1,000/mo', highlight: true },
          { name: 'Bank Connections', current: '1', upgrade: '5', highlight: true },
          { name: 'Invoices', current: '50/mo', upgrade: 'Unlimited', highlight: true },
          { name: 'Support', current: 'Email', upgrade: 'Priority Email' },
        ]}
        onUpgrade={() => {
          // Handle upgrade logic
          window.location.href = '/checkout?plan=starter';
        }}
        showTrialBadge
      />
    );
  }

  // Starter tier users
  if (usage.plan.tier === 'starter') {
    return (
      <UpgradeCard
        currentPlan="Starter"
        upgradePlan="Pro"
        currentPrice="$29/month"
        upgradePrice="$99/month"
        features={[
          { name: 'AI Messages', current: '1,000/mo', upgrade: 'Unlimited', highlight: true },
          { name: 'Bank Connections', current: '5', upgrade: 'Unlimited', highlight: true },
          { name: 'Invoices', current: 'Unlimited', upgrade: 'Unlimited' },
          { name: 'Support', current: 'Priority Email', upgrade: 'Chat & Phone', highlight: true },
        ]}
        onUpgrade={() => {
          window.location.href = '/checkout?plan=pro';
        }}
      />
    );
  }

  return null;
}

// ============================================
// Example 5: Conditional Modal Trigger
// ============================================
export function ConditionalModalExample() {
  const { usage, showModal } = useUsageCheck();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    // Automatically open modal when limit is reached
    if (showModal) {
      setIsModalOpen(true);
    }
  }, [showModal]);

  if (!usage) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-primary text-white rounded"
      >
        View Usage Details
      </button>

      <UsageLimitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        usage={usage}
      />
    </>
  );
}

// ============================================
// Example 6: Custom Banner with Different Styling
// ============================================
export function CustomStyledBannerExample() {
  const { usage } = useUsageCheck();

  if (!usage || usage.bankConnections.percentage < 80) {
    return null;
  }

  return (
    <UsageBanner
      percentage={usage.bankConnections.percentage}
      used={usage.bankConnections.used}
      limit={usage.bankConnections.limit}
      resourceType="bank connections"
      className="max-w-4xl mx-auto my-8" // Custom styling
      onDismiss={() => {
        // Custom dismissal logic
        console.log('Custom banner dismissed');
        // Track analytics event
        if (typeof window !== 'undefined' && (window as any).analytics) {
          (window as any).analytics.track('Usage Banner Dismissed', {
            resourceType: 'bank connections',
            percentage: usage.bankConnections.percentage,
          });
        }
      }}
    />
  );
}

// ============================================
// Example 7: Multi-Resource Warning
// ============================================
export function MultiResourceWarningExample() {
  const { usage } = useUsageCheck();

  if (!usage) {
    return null;
  }

  // Check if multiple resources are at warning levels
  const warnings = [
    usage.aiMessages.percentage >= 80 && {
      type: 'AI messages' as const,
      data: usage.aiMessages,
    },
    usage.bankConnections.percentage >= 80 && {
      type: 'bank connections' as const,
      data: usage.bankConnections,
    },
    usage.invoices.percentage >= 80 && {
      type: 'invoices' as const,
      data: usage.invoices,
    },
  ].filter(Boolean);

  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {warnings.map((warning) => (
        warning && (
          <UsageBanner
            key={warning.type}
            percentage={warning.data.percentage}
            used={warning.data.used}
            limit={warning.data.limit}
            resourceType={warning.type}
          />
        )
      ))}
    </div>
  );
}

// ============================================
// Example 8: Usage Check with Refetch
// ============================================
export function RefetchUsageExample() {
  const { usage, isLoading, refetch } = useUsageCheck();

  const handleAction = async () => {
    // Perform some action that affects usage
    await performActionThatUsesAIMessage();

    // Refetch usage to get updated stats
    refetch();
  };

  return (
    <div>
      <button onClick={handleAction} disabled={isLoading}>
        Send AI Message
      </button>

      {usage && (
        <p className="text-sm text-gray-600 mt-2">
          {usage.aiMessages.used} / {usage.aiMessages.limit} messages used this month
        </p>
      )}
    </div>
  );
}

// ============================================
// Mock function (replace with actual implementation)
// ============================================
async function performActionThatUsesAIMessage() {
  // Your actual implementation
  return Promise.resolve();
}

// ============================================
// Export all examples
// ============================================
export const examples = {
  DashboardLayoutExample,
  ManualBannerExample,
  SettingsUsageExample,
  PricingPageExample,
  ConditionalModalExample,
  CustomStyledBannerExample,
  MultiResourceWarningExample,
  RefetchUsageExample,
};
