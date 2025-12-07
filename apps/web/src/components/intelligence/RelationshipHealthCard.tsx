'use client';

import { useQuery } from '@tanstack/react-query';
import { intelligenceApi } from '@/lib/api/intelligence';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Heart, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const healthColors = {
  EXCELLENT: { bg: 'bg-green-500', text: 'text-green-700', label: 'Excellent' },
  GOOD: { bg: 'bg-blue-500', text: 'text-blue-700', label: 'Good' },
  NEEDS_ATTENTION: { bg: 'bg-yellow-500', text: 'text-yellow-700', label: 'Needs Attention' },
  AT_RISK: { bg: 'bg-orange-500', text: 'text-orange-700', label: 'At Risk' },
  DORMANT: { bg: 'bg-gray-500', text: 'text-gray-700', label: 'Dormant' },
};

export function RelationshipHealthCard() {
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['relationship-summary'],
    queryFn: () => intelligenceApi.getRelationshipSummary(),
  });

  const { data: atRisk, isLoading: atRiskLoading } = useQuery({
    queryKey: ['at-risk-relationships'],
    queryFn: () => intelligenceApi.getAtRiskRelationships(),
  });

  if (summaryError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relationship Health</CardTitle>
          <CardDescription>Track customer and vendor engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load relationship health</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const showAtRisk = atRisk && atRisk.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Relationship Health
            </CardTitle>
            <CardDescription>Track customer and vendor engagement</CardDescription>
          </div>
          {summary && summary.total > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold">{summary.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {summaryLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : summary && summary.total > 0 ? (
          <>
            {/* Health Status Bars */}
            <div className="space-y-2">
              {Object.entries(summary.byStatus).map(([status, count]) => {
                if (count === 0) return null;
                const config = healthColors[status as keyof typeof healthColors];
                const percentage = (count / summary.total) * 100;

                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={config.text}>{config.label}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${config.bg} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* At-Risk Relationships */}
            {showAtRisk && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    Needs Attention ({atRisk.length})
                  </h4>
                </div>

                <div className="space-y-2">
                  {atRisk.slice(0, 5).map((relationship) => (
                    <div
                      key={relationship.id}
                      className="flex items-center justify-between p-2 rounded-lg border text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{relationship.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {relationship.type} • {relationship.daysSinceLastContact} days since contact
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`ml-2 ${healthColors[relationship.healthStatus].text}`}
                      >
                        {relationship.healthScore}
                      </Badge>
                    </div>
                  ))}

                  {atRisk.length > 5 && (
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href="/intelligence/email?tab=relationships">
                        View all {atRisk.length} relationships
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No relationship data yet</p>
            <p className="text-sm">Start exchanging emails to track relationships</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
