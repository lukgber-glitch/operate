'use client';

import { CheckCircle, FileText, Receipt, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SuggestedMatch } from '@/hooks/use-reconciliation';

interface MatchSuggestionsProps {
  suggestions: SuggestedMatch[];
  isLoading: boolean;
  onApplyMatch: (entityType: string, entityId: string) => void;
  applyingMatch: boolean;
}

export function MatchSuggestions({
  suggestions,
  isLoading,
  onApplyMatch,
  applyingMatch,
}: MatchSuggestionsProps) {
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (confidence >= 50) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30';
  };

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 85) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (confidence >= 50) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Suggested Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="h-10 w-10 bg-muted animate-pulse rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Suggested Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No matches found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search or manually match this transaction
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Suggested Matches</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          {suggestions.length} potential {suggestions.length === 1 ? 'match' : 'matches'} found
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div
              key={`${suggestion.entityType}-${suggestion.entityId}`}
              className="flex items-start gap-4 p-4 border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className={`p-2 rounded-lg ${getConfidenceColor(suggestion.confidence)}`}>
                {suggestion.entityType === 'EXPENSE' ? (
                  <Receipt className="h-5 w-5" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {suggestion.entity.number || suggestion.entity.description}
                      </p>
                      <Badge
                        variant="secondary"
                        className={getConfidenceBadgeColor(suggestion.confidence)}
                      >
                        {suggestion.confidence}% match
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {suggestion.entity.description}
                    </p>
                  </div>

                  <p className="font-semibold text-sm whitespace-nowrap">
                    {formatCurrency(suggestion.entity.amount, suggestion.entity.currency)}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{formatDate(suggestion.entity.date)}</span>
                  {suggestion.entity.vendorName && (
                    <span>{suggestion.entity.vendorName}</span>
                  )}
                  {suggestion.entity.customerName && (
                    <span>{suggestion.entity.customerName}</span>
                  )}
                  {suggestion.entity.category && (
                    <Badge variant="outline" className="text-xs">
                      {suggestion.entity.category.name}
                    </Badge>
                  )}
                </div>

                <div className="flex items-start gap-2 p-2 bg-muted/50 rounded text-xs">
                  <CheckCircle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">{suggestion.reason}</p>
                </div>

                <Button
                  size="sm"
                  onClick={() => onApplyMatch(suggestion.entityType, suggestion.entityId)}
                  disabled={applyingMatch}
                  className="w-full"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Apply Match
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
