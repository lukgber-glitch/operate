'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useRunwayData } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';

function RunwayCardComponent() {
  const { data, isLoading, error } = useRunwayData();

  if (isLoading) {
    return (
      <Card className="rounded-[24px] bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">
            Runway
          </CardTitle>
          <Calendar className="h-4 w-4 text-gray-300" />
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
            Runway
          </CardTitle>
          <Calendar className="h-4 w-4 text-gray-300" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">N/A</div>
          <div className="text-xs text-gray-300">Keine Daten verfügbar</div>
        </CardContent>
      </Card>
    );
  }

  const statusIcon = useMemo(() => {
    switch (data.status) {
      case 'healthy':
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 mr-1" />;
      case 'critical':
        return <XCircle className="h-3 w-3 mr-1" />;
    }
  }, [data.status]);

  const statusColor = useMemo(() => {
    switch (data.status) {
      case 'healthy':
        return 'text-green-400';
      case 'warning':
        return 'text-orange-400';
      case 'critical':
        return 'text-red-400';
    }
  }, [data.status]);

  const statusText = useMemo(() => {
    switch (data.status) {
      case 'healthy':
        return 'Gesund';
      case 'warning':
        return 'Vorsicht';
      case 'critical':
        return 'Kritisch';
    }
  }, [data.status]);

  return (
    <Card className="rounded-[24px] bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">
          Runway
        </CardTitle>
        <Calendar className="h-4 w-4 text-gray-300" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">
          {data.months.toFixed(1)} Mo.
        </div>
        <div className={`flex items-center text-xs mt-1 ${statusColor}`}>
          {statusIcon}
          <span>{statusText}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export const RunwayCard = memo(RunwayCardComponent);
