'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { LeaveBalance } from '@/lib/api/employees';

interface LeaveBalanceCardProps {
  balance: LeaveBalance;
}

export function LeaveBalanceCard({ balance }: LeaveBalanceCardProps) {
  const usagePercentage = (balance.usedDays / balance.totalDays) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">
          {balance.leaveType?.name || 'Leave'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold">{balance.remainingDays}</div>
          <div className="text-sm text-muted-foreground">
            of {balance.totalDays} days
          </div>
        </div>

        <Progress value={usagePercentage} className="h-2" />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{balance.usedDays} used</span>
          <span>{balance.remainingDays} remaining</span>
        </div>
      </CardContent>
    </Card>
  );
}
