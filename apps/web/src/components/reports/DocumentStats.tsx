'use client';

import { FileText, CheckCircle, Clock, TrendingUp, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DocumentCategory {
  category: string;
  count: number;
  percentage: number;
}

interface ProcessingMetric {
  period: string;
  processed: number;
  avgTime: number;
}

interface DocumentStatsData {
  totalProcessed: number;
  successfulClassifications: number;
  classificationAccuracy: number;
  averageProcessingTime: number;
  fastestProcessingTime: number;
  slowestProcessingTime: number;
  processingTrend: ProcessingMetric[];
  categoryBreakdown: DocumentCategory[];
  pendingDocuments: number;
  failedDocuments: number;
}

interface DocumentStatsProps {
  data: DocumentStatsData;
}

export function DocumentStats({ data }: DocumentStatsProps) {
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return 'text-green-600';
    if (accuracy >= 85) return 'text-blue-600';
    if (accuracy >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyBadgeColor = (accuracy: number) => {
    if (accuracy >= 95) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (accuracy >= 85) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (accuracy >= 75) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Document Processing Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalProcessed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Documents this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classification Accuracy</CardTitle>
            <CheckCircle className={`h-4 w-4 ${getAccuracyColor(data.classificationAccuracy)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getAccuracyColor(data.classificationAccuracy)}`}>
              {data.classificationAccuracy.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.successfulClassifications.toLocaleString()} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.averageProcessingTime.toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per document
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fastest Time</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {data.fastestProcessingTime.toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Best performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Processing Performance */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {data.pendingDocuments}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {data.failedDocuments}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Slowest Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.slowestProcessingTime.toFixed(1)}s
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Needs optimization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Processing Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Time Trends</CardTitle>
          <CardDescription>Average processing time over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {/* Chart Placeholder - Will be replaced with recharts */}
            <div className="flex h-full items-center justify-center rounded-lg border bg-muted/30">
              <div className="text-center">
                <TrendingUp className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  Processing Time Trend Line Chart
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Install recharts to display interactive chart
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Document Categories</CardTitle>
          <CardDescription>Breakdown by document type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.categoryBreakdown.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{category.category}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold">{category.count.toLocaleString()}</span>
                    <Badge variant="secondary" className="min-w-[60px] justify-center">
                      {category.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Category Distribution Chart */}
          <div className="mt-6 h-[300px]">
            <div className="flex h-full items-center justify-center rounded-lg border bg-muted/30">
              <div className="text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  Category Distribution Pie Chart
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Install recharts to display interactive chart
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Metrics by Period</CardTitle>
          <CardDescription>Detailed processing statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left font-medium">Period</th>
                  <th className="pb-3 text-right font-medium">Documents Processed</th>
                  <th className="pb-3 text-right font-medium">Avg Processing Time</th>
                  <th className="pb-3 text-right font-medium">Performance</th>
                </tr>
              </thead>
              <tbody>
                {data.processingTrend.map((metric, index) => {
                  const avgTime = metric.avgTime;
                  const performance =
                    avgTime < 2 ? 'Excellent' :
                    avgTime < 4 ? 'Good' :
                    avgTime < 6 ? 'Fair' : 'Needs Improvement';
                  const performanceColor =
                    avgTime < 2 ? getAccuracyBadgeColor(95) :
                    avgTime < 4 ? getAccuracyBadgeColor(85) :
                    avgTime < 6 ? getAccuracyBadgeColor(75) : getAccuracyBadgeColor(60);

                  return (
                    <tr key={index} className="border-b">
                      <td className="py-3 font-medium">{metric.period}</td>
                      <td className="py-3 text-right">{metric.processed.toLocaleString()}</td>
                      <td className="py-3 text-right">{avgTime.toFixed(1)}s</td>
                      <td className="py-3 text-right">
                        <Badge variant="secondary" className={performanceColor}>
                          {performance}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Accuracy Indicator */}
      <Card>
        <CardHeader>
          <CardTitle>Classification Accuracy Rating</CardTitle>
          <CardDescription>Overall AI classification performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Current Accuracy</p>
              <p className={`text-4xl font-bold ${getAccuracyColor(data.classificationAccuracy)}`}>
                {data.classificationAccuracy.toFixed(1)}%
              </p>
            </div>
            <div>
              <Badge
                variant="secondary"
                className={`${getAccuracyBadgeColor(data.classificationAccuracy)} text-lg px-4 py-2`}
              >
                {data.classificationAccuracy >= 95 ? 'Excellent' :
                 data.classificationAccuracy >= 85 ? 'Good' :
                 data.classificationAccuracy >= 75 ? 'Fair' : 'Needs Improvement'}
              </Badge>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all ${
                  data.classificationAccuracy >= 95 ? 'bg-green-600' :
                  data.classificationAccuracy >= 85 ? 'bg-blue-600' :
                  data.classificationAccuracy >= 75 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${data.classificationAccuracy}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
