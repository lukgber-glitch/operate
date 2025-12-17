'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Wallet } from 'lucide-react';
import { useCashFlowForecast } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';

function CashBalanceCardComponent() {
  const { data, isLoading, error } = useCashFlowForecast(7);

  if (isLoading) {
    return (
      <Card className="rounded-[16px] bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">
            Kontostand
          </CardTitle>
          <Wallet className="h-4 w-4 text-gray-300" />
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
      <Card className="rounded-[16px] bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">
            Kontostand
          </CardTitle>
          <Wallet className="h-4 w-4 text-gray-300" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">€0</div>
          <div className="text-xs text-gray-300">Keine Daten verfügbar</div>
        </CardContent>
      </Card>
    );
  }

  const change = data.weeklyChange;
  const changePercent = data.weeklyChangePercent;
  const isPositive = change >= 0;

  return (
    <Card className="rounded-[16px] bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">
          Kontostand
        </CardTitle>
        <Wallet className="h-4 w-4 text-gray-300" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">
          €{data.currentBalance.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={`flex items-center text-xs mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
          <span>{Math.abs(changePercent).toFixed(1)}% diese Woche</span>
        </div>
      </CardContent>
    </Card>
  );
}

export const CashBalanceCard = memo(CashBalanceCardComponent);
