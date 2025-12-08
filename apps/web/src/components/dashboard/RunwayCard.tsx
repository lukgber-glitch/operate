'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useRunwayData } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';

export function RunwayCard() {
  const { data, isLoading, error } = useRunwayData();

  if (isLoading) {
    return (
      <Card className="rounded-[24px]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Runway
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
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
      <Card className="rounded-[24px]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Runway
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">N/A</div>
          <div className="text-xs text-muted-foreground">Keine Daten verfügbar</div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (data.status) {
      case 'healthy':
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 mr-1" />;
      case 'critical':
        return <XCircle className="h-3 w-3 mr-1" />;
    }
  };

  const getStatusColor = () => {
    switch (data.status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-orange-600 dark:text-orange-400';
      case 'critical':
        return 'text-red-600 dark:text-red-400';
    }
  };

  const getStatusText = () => {
    switch (data.status) {
      case 'healthy':
        return 'Gesund';
      case 'warning':
        return 'Vorsicht';
      case 'critical':
        return 'Kritisch';
    }
  };

  return (
    <Card className="rounded-[24px]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Runway
        </CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {data.months.toFixed(1)} Mo.
        </div>
        <div className={`flex items-center text-xs mt-1 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
