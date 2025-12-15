'use client';

import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HealthInsight {
  id: string;
  message: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  timestamp: Date;
}

interface HealthScoreInsightsProps {
  insights: HealthInsight[];
  className?: string;
}

const getSeverityConfig = (severity: HealthInsight['severity']) => {
  switch (severity) {
    case 'critical':
      return {
        icon: AlertCircle,
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        iconColor: 'text-red-500',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20',
        iconColor: 'text-yellow-500',
      };
    case 'info':
      return {
        icon: Info,
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        iconColor: 'text-blue-500',
      };
    case 'success':
      return {
        icon: CheckCircle,
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
        iconColor: 'text-green-500',
      };
  }
};

export function HealthScoreInsights({ insights, className }: HealthScoreInsightsProps) {
  if (insights.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-400', className)}>
        No insights available. Your business health is being monitored.
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {insights.map((insight, index) => {
        const config = getSeverityConfig(insight.severity);
        const Icon = config.icon;

        return (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'p-4 rounded-lg border flex items-start gap-3',
              config.bgColor,
              config.borderColor
            )}
          >
            <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">{insight.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {insight.timestamp.toLocaleDateString()} at {insight.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
