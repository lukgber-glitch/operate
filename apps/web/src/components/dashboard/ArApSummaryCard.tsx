'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react';
import { useArApSummary } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';

interface ArApSummaryCardProps {
  type: 'receivables' | 'payables';
}

function ArApSummaryCardComponent({ type }: ArApSummaryCardProps) {
  const { data, isLoading, error } = useArApSummary(type);

  const title = useMemo(() => type === 'receivables' ? 'Forderungen' : 'Verbindlichkeiten', [type]);
  const Icon = useMemo(() => type === 'receivables' ? TrendingUp : TrendingDown, [type]);
  const positiveColor = useMemo(() => type === 'receivables' ? 'text-green-400' : 'text-red-400', [type]);

  if (isLoading) {
    return (
      <Card className="rounded-[24px] bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-gray-300" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="rounded-[24px] bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-gray-300" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">€0</div>
          <div className="text-xs text-gray-300">Keine Daten verfügbar</div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = data.changePercent >= 0;

  return (
    <Card className="rounded-[24px] bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-gray-300" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">
          €{data.total.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className={`flex items-center text-xs ${isPositive ? positiveColor : 'text-gray-300'}`}>
            {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
            <span>{Math.abs(data.changePercent).toFixed(1)}%</span>
          </div>
          {data.overdue !== undefined && data.overdue > 0 && (
            <span className="text-xs text-orange-400">
              {data.count} {type === 'receivables' ? 'überfällig' : 'fällig'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const ArApSummaryCard = memo(ArApSummaryCardComponent);
