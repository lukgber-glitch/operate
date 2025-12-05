'use client';

import {
  Calendar,
  FileText,
  Filter,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  StickyNote,
} from 'lucide-react';
import { useState } from 'react';

import { AddNoteDialog } from './AddNoteDialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCommunications } from '@/hooks/use-clients';
import type { Communication, CommunicationType } from '@/lib/api/crm';

interface ClientActivityTabProps {
  clientId: string;
}

const typeIcons: Record<CommunicationType, React.ReactNode> = {
  EMAIL: <Mail className="h-4 w-4" />,
  PHONE: <Phone className="h-4 w-4" />,
  MEETING: <Calendar className="h-4 w-4" />,
  NOTE: <StickyNote className="h-4 w-4" />,
  TASK: <FileText className="h-4 w-4" />,
};

const typeColors: Record<CommunicationType, string> = {
  EMAIL: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  PHONE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  MEETING: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  NOTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  TASK: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

export function ClientActivityTab({ clientId }: ClientActivityTabProps) {
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<CommunicationType | 'all'>('all');

  const { data: communications, isLoading } = useCommunications(clientId);

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `Today at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return `Yesterday at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredCommunications = communications?.filter(
    (comm) => typeFilter === 'all' || comm.type === typeFilter
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Activity Timeline</h2>
          <p className="text-muted-foreground">Track all communications and interactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as CommunicationType | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="PHONE">Phone Call</SelectItem>
              <SelectItem value="MEETING">Meeting</SelectItem>
              <SelectItem value="NOTE">Note</SelectItem>
              <SelectItem value="TASK">Task</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsAddNoteOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>

      {!filteredCommunications?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {typeFilter === 'all' ? 'No activity recorded yet' : `No ${typeFilter.toLowerCase()} activities found`}
            </p>
            <Button onClick={() => setIsAddNoteOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-[31px] top-0 bottom-0 w-0.5 bg-border" />

          {/* Activities */}
          {filteredCommunications.map((communication) => (
            <div key={communication.id} className="relative flex gap-4">
              {/* Timeline dot */}
              <div className="relative z-10 mt-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-background ${typeColors[communication.type]}`}
                >
                  {typeIcons[communication.type]}
                </div>
              </div>

              {/* Content */}
              <Card className="flex-1">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={typeColors[communication.type]}>
                            {communication.type}
                          </Badge>
                          {communication.direction && (
                            <Badge variant="outline">
                              {communication.direction === 'INBOUND' ? 'Inbound' : 'Outbound'}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold">{communication.subject}</h3>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(communication.date)}
                      </span>
                    </div>

                    {communication.content && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {communication.content}
                      </p>
                    )}

                    {communication.linkedEntityType && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Linked to {communication.linkedEntityType.toLowerCase()}:{' '}
                          {communication.linkedEntityId}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(communication.createdBy)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {communication.createdBy}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <AddNoteDialog
        clientId={clientId}
        open={isAddNoteOpen}
        onOpenChange={setIsAddNoteOpen}
      />
    </>
  );
}
