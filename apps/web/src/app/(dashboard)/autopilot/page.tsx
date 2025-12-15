'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Settings, History, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AutopilotToggle,
  AutopilotStatsCards,
  PendingApprovalCard,
  AutopilotActivityFeed,
  TimeSavedDisplay,
  AutopilotWeeklyChart,
} from '@/components/autopilot';
import {
  useAutopilotConfig,
  useAutopilotStats,
  useAutopilotActions,
  usePendingApprovals,
  useApproveAction,
  useRejectAction,
  useEnableAutopilot,
  useDisableAutopilot,
  useAutopilotWeeklyData,
} from '@/hooks/use-autopilot';
import { useToast } from '@/components/ui/use-toast';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';

export default function AutopilotPage() {
  const { toast } = useToast();
  const { config, isLoading: configLoading, fetchConfig } = useAutopilotConfig();
  const { stats, isLoading: statsLoading, fetchStats } = useAutopilotStats();
  const { actions, isLoading: actionsLoading, fetchActions } = useAutopilotActions({
    pageSize: 10,
  });
  const { approvals, isLoading: approvalsLoading, fetchApprovals } = usePendingApprovals();
  const { data: weeklyData, isLoading: weeklyLoading, fetchWeeklyData } = useAutopilotWeeklyData();
  const { approveAction } = useApproveAction();
  const { rejectAction } = useRejectAction();
  const { enable } = useEnableAutopilot();
  const { disable } = useDisableAutopilot();

  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchStats();
    fetchActions();
    fetchApprovals();
    fetchWeeklyData();
  }, []);

  const handleToggle = async (enabled: boolean) => {
    setIsToggling(true);
    try {
      if (enabled) {
        await enable();
      } else {
        await disable();
      }
      await fetchConfig();
    } catch (error) {
      console.error('Failed to toggle autopilot:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleApprove = async (actionId: string) => {
    try {
      await approveAction(actionId);
      await fetchApprovals();
      await fetchStats();
      await fetchActions();
    } catch (error) {
      console.error('Failed to approve action:', error);
    }
  };

  const handleReject = async (actionId: string) => {
    try {
      await rejectAction(actionId, 'Rejected by user');
      await fetchApprovals();
      await fetchStats();
      await fetchActions();
    } catch (error) {
      console.error('Failed to reject action:', error);
    }
  };

  const isLoading = configLoading || statsLoading || actionsLoading || approvalsLoading || weeklyLoading;

  // Show loading state
  if (isLoading && !config) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-400">Loading autopilot...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">AI Autopilot</h1>
          <p className="text-sm text-gray-400">Let AI handle routine tasks automatically</p>
        </div>
        <div className="flex gap-2">
          <Link href="/autopilot/actions">
            <Button variant="outline" className="border-white/10">
              <History className="mr-2 h-4 w-4" />
              View All Actions
            </Button>
          </Link>
          <Link href="/autopilot/settings">
            <Button variant="outline" className="border-white/10">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Main toggle */}
      <motion.div variants={fadeUp}>
        <AutopilotToggle
          enabled={config?.enabled || false}
          lastActivity={actions[0]?.createdAt}
          onToggle={handleToggle}
          isLoading={isToggling}
        />
      </motion.div>

      {/* Stats cards */}
      {stats && (
        <motion.div variants={fadeUp}>
          <AutopilotStatsCards stats={stats.today} />
        </motion.div>
      )}

      {/* Pending approvals */}
      {approvals.length > 0 && (
        <motion.div variants={fadeUp}>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">Pending Approvals</h2>
            <p className="text-sm text-gray-400">Review and approve AI-suggested actions</p>
          </div>
          <div className="space-y-4">
            {approvals.map((approval) => (
              <PendingApprovalCard
                key={approval.id}
                action={approval}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Charts and activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time saved */}
        {stats && (
          <motion.div variants={fadeUp}>
            <TimeSavedDisplay
              todayMinutes={stats.today.timeSavedMinutes}
              weeklyMinutes={stats.thisWeek.timeSavedMinutes}
            />
          </motion.div>
        )}

        {/* Weekly chart */}
        {weeklyData && weeklyData.length > 0 && (
          <motion.div variants={fadeUp} className="lg:col-span-2">
            <AutopilotWeeklyChart data={weeklyData} />
          </motion.div>
        )}
      </div>

      {/* Activity feed */}
      <motion.div variants={fadeUp}>
        <AutopilotActivityFeed actions={actions} isLoading={actionsLoading} />
      </motion.div>

      {/* First-time setup CTA */}
      {config && !config.enabled && (
        <motion.div
          variants={fadeUp}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm">
            <div className="p-6 text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                Ready to save time with AI?
              </h3>
              <p className="text-gray-400 mb-4">
                Enable Autopilot and let AI handle routine bookkeeping tasks for you.
                You'll always have final approval on important actions.
              </p>
              <Link href="/autopilot/settings">
                <Button className="bg-blue-500 hover:bg-blue-600">
                  Configure Autopilot
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
