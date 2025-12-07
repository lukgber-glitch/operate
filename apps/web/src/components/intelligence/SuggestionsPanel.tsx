'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { intelligenceApi } from '@/lib/api/intelligence';
import type { EmailSuggestion } from '@/lib/api/intelligence';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  X,
  Mail,
  FileText,
  Users,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

const priorityColors = {
  URGENT: 'bg-red-600 text-white',
  HIGH: 'bg-orange-500 text-white',
  MEDIUM: 'bg-yellow-500 text-black',
  LOW: 'bg-gray-400 text-white',
};

const priorityIcons = {
  URGENT: AlertCircle,
  HIGH: AlertCircle,
  MEDIUM: Lightbulb,
  LOW: Lightbulb,
};

const typeIcons: Record<string, any> = {
  FOLLOW_UP_QUOTE: Mail,
  FOLLOW_UP_INVOICE: FileText,
  CREATE_INVOICE: FileText,
  CREATE_BILL: FileText,
  REENGAGE_DORMANT: Users,
  RELATIONSHIP_DECLINING: TrendingUp,
  DEFAULT: Lightbulb,
};

export function SuggestionsPanel() {
  const [filter, setFilter] = useState<'all' | 'urgent' | 'high'>('all');
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading, error } = useQuery({
    queryKey: ['email-suggestions', filter],
    queryFn: () => {
      const filters: any = {};
      if (filter === 'urgent') filters.priority = 'URGENT';
      if (filter === 'high') filters.priority = 'HIGH';
      return intelligenceApi.getSuggestions(filters);
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (suggestionId: string) => intelligenceApi.dismissSuggestion(suggestionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-suggestions'] });
      toast.success('Suggestion dismissed');
    },
    onError: () => {
      toast.error('Failed to dismiss suggestion');
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action?: string }) =>
      intelligenceApi.completeSuggestion(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-suggestions'] });
      toast.success('Suggestion completed');
    },
    onError: () => {
      toast.error('Failed to complete suggestion');
    },
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Suggestions</CardTitle>
          <CardDescription>AI-powered actionable insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load suggestions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const urgentCount = suggestions?.filter((s) => s.priority === 'URGENT').length || 0;
  const highCount = suggestions?.filter((s) => s.priority === 'HIGH').length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Suggestions
            </CardTitle>
            <CardDescription>AI-powered actionable insights</CardDescription>
          </div>
          {suggestions && suggestions.length > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold">{suggestions.length}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="urgent">
              Urgent {urgentCount > 0 && `(${urgentCount})`}
            </TabsTrigger>
            <TabsTrigger value="high">
              High {highCount > 0 && `(${highCount})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : suggestions && suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <SuggestionItem
                    key={suggestion.id}
                    suggestion={suggestion}
                    onDismiss={() => dismissMutation.mutate(suggestion.id)}
                    onComplete={() => completeMutation.mutate({ id: suggestion.id })}
                    isLoading={
                      dismissMutation.isPending || completeMutation.isPending
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No suggestions</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface SuggestionItemProps {
  suggestion: EmailSuggestion;
  onDismiss: () => void;
  onComplete: () => void;
  isLoading: boolean;
}

function SuggestionItem({ suggestion, onDismiss, onComplete, isLoading }: SuggestionItemProps) {
  const PriorityIcon = priorityIcons[suggestion.priority as keyof typeof priorityIcons];
  const TypeIcon = typeIcons[suggestion.type] || typeIcons.DEFAULT;

  return (
    <div className="p-4 rounded-lg border space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <TypeIcon className="h-4 w-4 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm">{suggestion.title}</h4>
            <Badge className={priorityColors[suggestion.priority as keyof typeof priorityColors]}>
              <PriorityIcon className="h-3 w-3 mr-1" />
              {suggestion.priority}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">{suggestion.message}</p>

          {suggestion.entityName && (
            <p className="text-xs text-muted-foreground mt-1">
              {suggestion.entityType}: {suggestion.entityName}
            </p>
          )}

          {suggestion.sourceEmailSubject && (
            <p className="text-xs text-muted-foreground mt-1">
              From email: "{suggestion.sourceEmailSubject.substring(0, 50)}..."
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onComplete}
          disabled={isLoading}
          className="flex-1"
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Complete
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDismiss}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
          Dismiss
        </Button>
      </div>
    </div>
  );
}
