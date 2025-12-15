'use client';

import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import {
  FileText,
  Send,
  Eye,
  FileSignature,
  XCircle,
  Clock,
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: 'created' | 'sent' | 'viewed' | 'signed' | 'cancelled' | 'expired';
  timestamp: string;
  user?: string;
  details?: string;
}

interface ContractTimelineProps {
  events: TimelineEvent[];
}

const eventConfig: Record<
  TimelineEvent['type'],
  { icon: React.ElementType; label: string; color: string }
> = {
  created: {
    icon: FileText,
    label: 'Created',
    color: 'bg-blue-500',
  },
  sent: {
    icon: Send,
    label: 'Sent for Signature',
    color: 'bg-purple-500',
  },
  viewed: {
    icon: Eye,
    label: 'Viewed',
    color: 'bg-indigo-500',
  },
  signed: {
    icon: FileSignature,
    label: 'Signed',
    color: 'bg-green-500',
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    color: 'bg-red-500',
  },
  expired: {
    icon: Clock,
    label: 'Expired',
    color: 'bg-orange-500',
  },
};

export function ContractTimeline({ events }: ContractTimelineProps) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Activity Timeline</h3>
      <div className="space-y-4">
        {events.map((event, index) => {
          const config = eventConfig[event.type];
          const Icon = config.icon;

          return (
            <div key={event.id} className="flex gap-4">
              <div className="relative">
                <div className={`p-2 rounded-full ${config.color} text-white`}>
                  <Icon className="h-4 w-4" />
                </div>
                {index < events.length - 1 && (
                  <div className="absolute top-10 left-1/2 w-0.5 h-8 bg-border -translate-x-1/2" />
                )}
              </div>
              <div className="flex-1 pb-8">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{config.label}</p>
                    {event.user && (
                      <p className="text-sm text-muted-foreground">
                        by {event.user}
                      </p>
                    )}
                    {event.details && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.details}
                      </p>
                    )}
                  </div>
                  <time className="text-sm text-muted-foreground">
                    {format(new Date(event.timestamp), 'MMM d, yyyy HH:mm')}
                  </time>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
