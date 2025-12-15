'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, TrendingDown, ArrowRight, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HealthScoreGauge } from './HealthScoreGauge';
import { HealthScoreBreakdown } from './HealthScoreBreakdown';
import { useHealthScore, useHealthScoreBreakdown } from '@/hooks/use-health-score';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function BusinessHealthScore() {
  const { data: healthScore, isLoading: scoreLoading } = useHealthScore();
  const { data: breakdown, isLoading: breakdownLoading } = useHealthScoreBreakdown();

  const isLoading = scoreLoading || breakdownLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Business Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex justify-center">
              <Skeleton className="h-[180px] w-[180px] rounded-full" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthScore || !breakdown) {
    return null;
  }

  const TrendIcon = healthScore.trend === 'up' ? TrendingUp : TrendingDown;
  const trendColor = healthScore.trend === 'up' ? 'text-green-500' : 'text-red-500';

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Business Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gauge */}
        <div className="flex justify-center">
          <HealthScoreGauge score={healthScore.score} size="md" />
        </div>

        {/* Trend indicator */}
        {healthScore.trend !== 'stable' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'flex items-center justify-center gap-2 text-sm',
              trendColor
            )}
          >
            <TrendIcon className="h-4 w-4" />
            <span>
              {healthScore.trend === 'up' ? '+' : '-'}
              {healthScore.trendPercentage}% vs last period
            </span>
          </motion.div>
        )}

        {/* Component breakdown */}
        <HealthScoreBreakdown components={breakdown.components} />

        {/* View details button */}
        <Link href="/health-score">
          <Button variant="outline" className="w-full group">
            View Detailed Analysis
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>

        {/* Last updated */}
        <p className="text-xs text-center text-gray-400">
          Last updated: {healthScore.lastUpdated.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
