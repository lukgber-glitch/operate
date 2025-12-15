"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuggestionTypeIcon } from "./SuggestionTypeIcon";
import { useDismissSuggestion, useCompleteSuggestion } from "@/hooks/use-tax-assistant";
import { X, Check, Clock, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TaxSuggestion {
  id: string;
  type: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  potentialSavings: number;
  expiresAt?: string;
  actionUrl?: string;
  actionLabel?: string;
  status: "ACTIVE" | "COMPLETED" | "DISMISSED";
}

interface TaxSuggestionCardProps {
  suggestion: TaxSuggestion;
}

export function TaxSuggestionCard({ suggestion }: TaxSuggestionCardProps) {
  const router = useRouter();
  const dismissMutation = useDismissSuggestion();
  const completeMutation = useCompleteSuggestion();
  const [showDismissDialog, setShowDismissDialog] = useState(false);

  const priorityColors = {
    HIGH: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 border-red-200",
    MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400 border-yellow-200",
    LOW: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400 border-blue-200",
  };

  const priorityBorderColors = {
    HIGH: "border-red-200 dark:border-red-800",
    MEDIUM: "border-yellow-200 dark:border-yellow-800",
    LOW: "border-blue-200 dark:border-blue-800",
  };

  const daysUntilExpiry = suggestion.expiresAt
    ? Math.ceil((new Date(suggestion.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleAction = () => {
    if (suggestion.actionUrl) {
      router.push(suggestion.actionUrl);
    }
  };

  const handleDismiss = () => {
    dismissMutation.mutate(suggestion.id);
    setShowDismissDialog(false);
  };

  const handleComplete = () => {
    completeMutation.mutate(suggestion.id);
  };

  return (
    <>
      <Card className={`p-6 ${priorityBorderColors[suggestion.priority]}`}>
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="mt-1">
            <SuggestionTypeIcon type={suggestion.type} size={24} />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{suggestion.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {suggestion.description}
                </p>
              </div>

              {/* Priority Badge */}
              <Badge className={priorityColors[suggestion.priority]}>
                {suggestion.priority}
              </Badge>
            </div>

            {/* Savings Amount */}
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                €{suggestion.potentialSavings.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">potential savings</div>
            </div>

            {/* Expiry Warning */}
            {daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
              <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                <Clock className="h-4 w-4" />
                <span>
                  {daysUntilExpiry === 0
                    ? "Expires today!"
                    : daysUntilExpiry === 1
                    ? "Expires tomorrow"
                    : `Expires in ${daysUntilExpiry} days`}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              {suggestion.actionUrl && (
                <Button onClick={handleAction} size="sm">
                  {suggestion.actionLabel || "Take Action"}
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              )}

              <Button
                onClick={handleComplete}
                variant="outline"
                size="sm"
                disabled={completeMutation.isPending}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>

              <Button
                onClick={() => setShowDismissDialog(true)}
                variant="ghost"
                size="sm"
                disabled={dismissMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Dismiss Confirmation Dialog */}
      <AlertDialog open={showDismissDialog} onOpenChange={setShowDismissDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dismiss Suggestion?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to dismiss this suggestion? You can always run a new analysis to get more recommendations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDismiss}>Dismiss</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
