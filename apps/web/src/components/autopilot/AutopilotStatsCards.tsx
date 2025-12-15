'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Timer, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: 'blue' | 'purple' | 'green' | 'orange';
  index: number;
}

function StatsCard({ icon, label, value, subtitle, color = 'blue', index }: StatsCardProps) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-500/0 text-blue-400',
    purple: 'from-purple-500/20 to-purple-500/0 text-purple-400',
    green: 'from-green-500/20 to-green-500/0 text-green-400',
    orange: 'from-orange-500/20 to-orange-500/0 text-orange-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="relative overflow-hidden border-white/10 bg-white/5 backdrop-blur-sm">
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br',
            colorClasses[color].split(' ').slice(0, 2).join(' ')
          )}
        />
        <div className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-400">{label}</p>
              <motion.p
                className="mt-2 text-3xl font-bold text-white"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
              >
                {value}
              </motion.p>
              {subtitle && (
                <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
              )}
            </div>
            <div className={cn('rounded-lg bg-white/10 p-3', colorClasses[color].split(' ').slice(2).join(' '))}>
              {icon}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

interface AutopilotStatsCardsProps {
  stats: {
    actionsCompleted: number;
    pendingApproval: number;
    timeSavedMinutes: number;
    successRate: number;
  };
}

export function AutopilotStatsCards({ stats }: AutopilotStatsCardsProps) {
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        icon={<CheckCircle2 className="h-6 w-6" />}
        label="Actions Completed"
        value={stats.actionsCompleted}
        subtitle="Today"
        color="green"
        index={0}
      />
      <StatsCard
        icon={<Clock className="h-6 w-6" />}
        label="Pending Approval"
        value={stats.pendingApproval}
        subtitle={stats.pendingApproval === 1 ? 'Action' : 'Actions'}
        color="orange"
        index={1}
      />
      <StatsCard
        icon={<Timer className="h-6 w-6" />}
        label="Time Saved"
        value={formatTime(stats.timeSavedMinutes)}
        subtitle="Today"
        color="blue"
        index={2}
      />
      <StatsCard
        icon={<TrendingUp className="h-6 w-6" />}
        label="Success Rate"
        value={`${stats.successRate}%`}
        subtitle="All time"
        color="purple"
        index={3}
      />
    </div>
  );
}
