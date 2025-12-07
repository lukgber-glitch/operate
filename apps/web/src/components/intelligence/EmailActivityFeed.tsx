'use client';

import { useQuery } from '@tanstack/react-query';
import { intelligenceApi } from '@/lib/api/intelligence';
import type { EmailActivityItem } from '@/lib/api/intelligence';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, FileText, CreditCard, DollarSign, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EmailActivityFeedProps {
  limit?: number;
}

const categoryIcons: Record<string, any> = {
  INVOICE_RECEIVED: FileText,
  QUOTE_REQUEST: Mail,
  PAYMENT_CONFIRMATION: DollarSign,
  BILL: CreditCard,
  GENERAL: Mail,
};

const categoryColors: Record<string, string> = {
  INVOICE_RECEIVED: 'text-blue-600 bg-blue-50',
  QUOTE_REQUEST: 'text-green-600 bg-green-50',
  PAYMENT_CONFIRMATION: 'text-emerald-600 bg-emerald-50',
  BILL: 'text-orange-600 bg-orange-50',
  GENERAL: 'text-gray-600 bg-gray-50',
};

export function EmailActivityFeed({ limit = 20 }: EmailActivityFeedProps) {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['email-activity', limit],
    queryFn: () => intelligenceApi.getEmailActivity(limit),
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Activity</CardTitle>
          <CardDescription>Recent emails processed by intelligence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load email activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Activity</CardTitle>
        <CardDescription>Recent emails processed with AI intelligence</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <EmailActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No email activity yet</p>
            <p className="text-sm">Email intelligence will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmailActivityItem({ activity }: { activity: EmailActivityItem }) {
  const Icon = categoryIcons[activity.category] || Mail;
  const colorClass = categoryColors[activity.category] || categoryColors.GENERAL;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{activity.subject}</p>
            <p className="text-xs text-muted-foreground">From: {activity.from}</p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-2 text-xs">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            {activity.action}
          </span>

          {activity.entityName && (
            <span className="text-muted-foreground">
              {activity.entityType}: {activity.entityName}
            </span>
          )}

          {activity.amount && activity.currency && (
            <span className="text-muted-foreground font-medium">
              {activity.currency} {activity.amount.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
