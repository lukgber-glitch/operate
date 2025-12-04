'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { VerificationHistoryEntry } from '@/types/verification';
import { format } from 'date-fns';
import {
  CheckCircle,
  XCircle,
  Upload,
  Send,
  Eye,
  PlayCircle,
  CalendarX,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationTimelineProps {
  history: VerificationHistoryEntry[];
  className?: string;
}

const eventConfig = {
  started: {
    icon: PlayCircle,
    label: 'Verification Started',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
  },
  document_uploaded: {
    icon: Upload,
    label: 'Document Uploaded',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
  },
  submitted: {
    icon: Send,
    label: 'Verification Submitted',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
  },
  under_review: {
    icon: Eye,
    label: 'Under Review',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
  },
  verified: {
    icon: CheckCircle,
    label: 'Verified',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
  },
  expired: {
    icon: CalendarX,
    label: 'Expired',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
  },
};

export function VerificationTimeline({ history, className }: VerificationTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Verification History</CardTitle>
          <CardDescription>Track the progress of your verification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No history available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Verification History</CardTitle>
        <CardDescription>Track the progress of your verification</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border" />

          {history.map((entry, index) => {
            const config = eventConfig[entry.event] || eventConfig.started;
            const Icon = config.icon;
            const isLast = index === history.length - 1;

            return (
              <div key={entry.id} className="relative flex gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    'relative z-10 w-8 h-8 rounded-full flex items-center justify-center',
                    config.bgColor
                  )}
                >
                  <Icon className={cn('w-4 h-4', config.color)} />
                </div>

                {/* Content */}
                <div className={cn('flex-1 pb-8', isLast && 'pb-0')}>
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm font-semibold">{config.label}</h4>
                    <time className="text-xs text-muted-foreground">
                      {format(new Date(entry.timestamp), 'MMM d, h:mm a')}
                    </time>
                  </div>
                  <p className="text-sm text-muted-foreground">{entry.description}</p>
                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                      {Object.entries(entry.metadata).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-medium">{key}:</span>
                          <span className="text-muted-foreground">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
