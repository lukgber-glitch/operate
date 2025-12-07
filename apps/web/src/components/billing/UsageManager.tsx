'use client';

import { useState } from 'react';
import { useUsageCheck } from '@/hooks/use-usage-check';
import { UsageBanner } from './UsageBanner';
import { UsageLimitModal } from './UsageLimitModal';

/**
 * Manages usage warnings and limit modals throughout the dashboard
 * Automatically shows banners at 80% and modals at 100% usage
 */
export function UsageManager() {
  const { showBanner, showModal, usage, isLoading } = useUsageCheck();
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isModalDismissed, setIsModalDismissed] = useState(false);

  if (isLoading || !usage) {
    return null;
  }

  // Determine which resource to show banner for (prioritize AI messages)
  const getBannerResource = () => {
    if (usage.aiMessages.percentage >= 80 && usage.aiMessages.percentage < 100) {
      return {
        resourceType: 'AI messages' as const,
        percentage: usage.aiMessages.percentage,
        used: usage.aiMessages.used,
        limit: usage.aiMessages.limit,
      };
    }
    if (usage.bankConnections.percentage >= 80 && usage.bankConnections.percentage < 100) {
      return {
        resourceType: 'bank connections' as const,
        percentage: usage.bankConnections.percentage,
        used: usage.bankConnections.used,
        limit: usage.bankConnections.limit,
      };
    }
    if (usage.invoices.percentage >= 80 && usage.invoices.percentage < 100) {
      return {
        resourceType: 'invoices' as const,
        percentage: usage.invoices.percentage,
        used: usage.invoices.used,
        limit: usage.invoices.limit,
      };
    }
    return null;
  };

  const bannerResource = getBannerResource();

  return (
    <>
      {/* Usage Warning Banner (80% threshold) */}
      {showBanner && !isBannerDismissed && bannerResource && (
        <UsageBanner
          percentage={bannerResource.percentage}
          used={bannerResource.used}
          limit={bannerResource.limit}
          resourceType={bannerResource.resourceType}
          onDismiss={() => setIsBannerDismissed(true)}
        />
      )}

      {/* Usage Limit Modal (100% threshold) */}
      {showModal && !isModalDismissed && (
        <UsageLimitModal
          isOpen={true}
          onClose={() => setIsModalDismissed(true)}
          usage={usage}
        />
      )}
    </>
  );
}
