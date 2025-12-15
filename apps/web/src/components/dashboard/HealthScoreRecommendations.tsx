'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface HealthRecommendation {
  id: string;
  issue: string;
  action: string;
  actionLabel: string;
  actionHref?: string;
  priority: 'high' | 'medium' | 'low';
}

interface HealthScoreRecommendationsProps {
  recommendations: HealthRecommendation[];
  onActionClick?: (recommendation: HealthRecommendation) => void;
  className?: string;
}

const getPriorityColor = (priority: HealthRecommendation['priority']) => {
  switch (priority) {
    case 'high':
      return 'border-red-500/20 bg-red-500/5';
    case 'medium':
      return 'border-yellow-500/20 bg-yellow-500/5';
    case 'low':
      return 'border-blue-500/20 bg-blue-500/5';
  }
};

export function HealthScoreRecommendations({
  recommendations,
  onActionClick,
  className,
}: HealthScoreRecommendationsProps) {
  if (recommendations.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-400', className)}>
        No recommendations at this time. Keep up the good work!
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {recommendations.map((recommendation, index) => (
        <motion.div
          key={recommendation.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={cn(
            'p-4 rounded-lg border',
            getPriorityColor(recommendation.priority)
          )}
        >
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">
                {recommendation.issue}
              </h4>
              <p className="text-sm text-gray-300">
                {recommendation.action}
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                if (recommendation.actionHref) {
                  window.location.href = recommendation.actionHref;
                } else if (onActionClick) {
                  onActionClick(recommendation);
                }
              }}
            >
              {recommendation.actionLabel}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
