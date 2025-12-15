'use client';

import { useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Edit, Trash2, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTimeEntries, formatDuration } from '@/hooks/use-time-tracking';

export function TodayEntries() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { entries, isLoading, fetchEntries, deleteEntry } = useTimeEntries({
    startDate: today,
    endDate: today,
    pageSize: 50,
  });

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      await deleteEntry(id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-300" />
          Today's Entries
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No time entries today</p>
            <p className="text-sm">Start tracking your time!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {entry.project && (
                      <div
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.project.color || '#6b7280' }}
                      />
                    )}
                    <span className="font-medium text-white truncate">
                      {entry.project?.name || 'No Project'}
                    </span>
                    {entry.billable && (
                      <Badge variant="default" className="bg-green-600 text-white">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Billable
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 truncate">{entry.description || 'No description'}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>
                      {format(new Date(entry.startTime), 'HH:mm')} -{' '}
                      {entry.endTime ? format(new Date(entry.endTime), 'HH:mm') : 'Running'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="font-mono font-bold text-white">{formatDuration(entry.duration)}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-300"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
