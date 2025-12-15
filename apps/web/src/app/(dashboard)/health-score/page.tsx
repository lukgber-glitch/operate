'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  DollarSign,
  FileText,
  Calendar,
  Target,
  Calculator,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HealthScoreGauge } from '@/components/dashboard/HealthScoreGauge';
import { HealthScoreTrend } from '@/components/dashboard/HealthScoreTrend';
import { HealthScoreInsights } from '@/components/dashboard/HealthScoreInsights';
import { HealthScoreRecommendations } from '@/components/dashboard/HealthScoreRecommendations';
import {
  useHealthScoreDetails,
  useHealthScoreHistory,
  useRecalculateScore
} from '@/hooks/use-health-score';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { fadeUp, staggerContainer } from '@/lib/animation-variants';

const componentIcons: Record<string, any> = {
  cashFlow: DollarSign,
  arHealth: FileText,
  apHealth: DollarSign,
  taxCompliance: Calculator,
  profitability: Target,
  runway: Calendar,
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
};

const getScoreBgColor = (score: number) => {
  if (score >= 80) return 'bg-green-500/10 border-green-500/20';
  if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/20';
  if (score >= 40) return 'bg-orange-500/10 border-orange-500/20';
  return 'bg-red-500/10 border-red-500/20';
};

export default function HealthScorePage() {
  const [selectedDays, setSelectedDays] = useState(30);
  const { data: details, isLoading: detailsLoading } = useHealthScoreDetails();
  const { data: history, isLoading: historyLoading } = useHealthScoreHistory(selectedDays);
  const recalculate = useRecalculateScore();

  const isLoading = detailsLoading || historyLoading;

  const handleRecalculate = () => {
    recalculate.mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!details || !history) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Unable to load health score data</p>
        </div>
      </div>
    );
  }

  const TrendIcon = details.score.trend === 'up' ? TrendingUp : TrendingDown;
  const trendColor = details.score.trend === 'up' ? 'text-green-500' : 'text-red-500';

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Business Health Score
          </h1>
          <p className="text-sm text-gray-300">
            Comprehensive overview of your business financial health
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRecalculate}
            disabled={recalculate.isPending}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', recalculate.isPending && 'animate-spin')} />
            Recalculate
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </motion.div>

      {/* Score overview and trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall score */}
        <motion.div variants={fadeUp}>
          <Card className={cn('border', getScoreBgColor(details.score.score))}>
            <CardHeader>
              <CardTitle>Overall Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <HealthScoreGauge score={details.score.score} size="lg" showLabel={false} />
              </div>

              {details.score.trend !== 'stable' && (
                <div className={cn('flex items-center justify-center gap-2 text-sm', trendColor)}>
                  <TrendIcon className="h-4 w-4" />
                  <span>
                    {details.score.trend === 'up' ? '+' : '-'}
                    {details.score.trendPercentage}% vs last period
                  </span>
                </div>
              )}

              <p className="text-xs text-center text-gray-400">
                Last updated: {details.score.lastUpdated.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Historical trend */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Historical Trend</CardTitle>
                <div className="flex gap-2">
                  {[7, 30, 90].map((days) => (
                    <Button
                      key={days}
                      variant={selectedDays === days ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedDays(days)}
                    >
                      {days}d
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <HealthScoreTrend
                data={history.data}
                currentScore={details.score.score}
                className="h-[280px]"
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Component breakdown cards */}
      <motion.div variants={fadeUp}>
        <h2 className="text-xl font-semibold text-white mb-4">Score Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {details.breakdown.components.map((component, index) => {
            const Icon = componentIcons[component.id] || Activity;
            return (
              <motion.div
                key={component.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={cn('border', getScoreBgColor(component.score))}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-5 w-5" />
                      {component.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn('text-4xl font-bold', getScoreColor(component.score))}>
                        {component.score}
                      </span>
                      <span className="text-sm text-gray-400">/ 100</span>
                    </div>
                    <p className="text-sm text-gray-300">{component.details}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>
                Automated analysis of your business health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HealthScoreInsights insights={details.insights} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Recommendations */}
        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>
                Action items to improve your health score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HealthScoreRecommendations recommendations={details.recommendations} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
